# Archive files for Lambda functions

# Hello World Lambda archive
data "archive_file" "hello_world_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda_code/hello_world.zip"

  source {
    content  = <<EOF
exports.handler = async (event) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    body: JSON.stringify({
      message: 'Hello from the File Exchange API!'
    })
  };
};
EOF
    filename = "index.js"
  }
}

# Upload Handler Lambda archive
data "archive_file" "upload_handler_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda_code/upload_handler.zip"

  source {
    content  = <<EOF
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const rekognition = new AWS.Rekognition();
const { v4: uuidv4 } = require('uuid');

const BUCKET_NAME = process.env.BUCKET_NAME;
const METADATA_TABLE = process.env.METADATA_TABLE;
const MODERATION_CONFIDENCE_THRESHOLD = parseFloat(process.env.MODERATION_CONFIDENCE_THRESHOLD || '75.0');

exports.handler = async (event) => {
  try {
    // Extract user ID from JWT claims in the request
    const userId = event.requestContext.authorizer.jwt.claims.sub;
    
    if (!event.body || !event.isBase64Encoded) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid request format. Expected base64 encoded body.' })
      };
    }
    
    // Parse multipart form data
    const body = Buffer.from(event.body, 'base64').toString('utf-8');
    const boundary = getFormBoundary(event);
    const parts = parseMultipartForm(body, boundary);
    
    if (!parts.file) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No file found in request' })
      };
    }
    
    const fileId = uuidv4();
    const fileName = parts.filename || 'unknown-file';
    const contentType = parts.contentType || 'application/octet-stream';
    const fileBuffer = Buffer.from(parts.file, 'binary');
    
    // Upload file to S3
    const s3Key = `${userId}/uploads/${fileId}/${fileName}`;
    await s3.putObject({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: contentType
    }).promise();
    
    // Store metadata in DynamoDB
    const timestamp = new Date().toISOString();
    const fileMetadata = {
      file_id: fileId,
      user_id: userId,
      file_name: fileName,
      content_type: contentType,
      size: fileBuffer.length,
      s3_key: s3Key,
      status: 'pending_moderation',
      created_at: timestamp,
      updated_at: timestamp
    };
    
    await dynamoDB.put({
      TableName: METADATA_TABLE,
      Item: fileMetadata
    }).promise();
    
    // Initial moderation check for images
    if (contentType.startsWith('image/')) {
      try {
        const moderationResult = await rekognition.detectModerationLabels({
          Image: {
            S3Object: {
              Bucket: BUCKET_NAME,
              Name: s3Key
            }
          },
          MinConfidence: MODERATION_CONFIDENCE_THRESHOLD
        }).promise();
        
        if (moderationResult.ModerationLabels && moderationResult.ModerationLabels.length > 0) {
          // Inappropriate content detected
          const newKey = s3Key.replace('/uploads/', '/uploads/rejected/');
          
          // Move file to rejected folder
          await s3.copyObject({
            Bucket: BUCKET_NAME,
            CopySource: `${BUCKET_NAME}/${s3Key}`,
            Key: newKey
          }).promise();
          
          await s3.deleteObject({
            Bucket: BUCKET_NAME,
            Key: s3Key
          }).promise();
          
          // Update metadata
          await dynamoDB.update({
            TableName: METADATA_TABLE,
            Key: { file_id: fileId },
            UpdateExpression: 'SET #status = :status, s3_key = :s3Key, updated_at = :updatedAt, moderation_labels = :labels',
            ExpressionAttributeNames: {
              '#status': 'status'
            },
            ExpressionAttributeValues: {
              ':status': 'rejected',
              ':s3Key': newKey,
              ':updatedAt': new Date().toISOString(),
              ':labels': moderationResult.ModerationLabels
            }
          }).promise();
          
          return {
            statusCode: 403,
            body: JSON.stringify({
              error: 'Content rejected due to inappropriate material',
              fileId: fileId
            })
          };
        }
      } catch (error) {
        console.error('Error during moderation check:', error);
        // Continue processing even if moderation check fails
      }
    }
    
    // Send success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'File uploaded successfully',
        fileId: fileId,
        fileName: fileName,
        status: 'pending_moderation'
      })
    };
  } catch (error) {
    console.error('Error processing file upload:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error processing file upload',
        details: error.message
      })
    };
  }
};

// Helper functions for multipart form parsing
function getFormBoundary(event) {
  const contentType = event.headers['content-type'] || event.headers['Content-Type'];
  if (!contentType) return null;
  
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  return boundaryMatch ? (boundaryMatch[1] || boundaryMatch[2]) : null;
}

function parseMultipartForm(body, boundary) {
  const result = {};
  const parts = body.split(new RegExp(`--${boundary}\\r?\\n`));
  
  parts.forEach(part => {
    if (!part || part.trim() === `--` || part.trim() === '') return;
    
    const headerBodySplit = part.indexOf('\r\n\r\n');
    if (headerBodySplit === -1) return;
    
    const headers = part.substring(0, headerBodySplit).split('\r\n');
    const content = part.substring(headerBodySplit + 4);
    
    // Parse content disposition to extract field name and filename
    const contentDisposition = headers.find(h => h.toLowerCase().startsWith('content-disposition:'));
    if (!contentDisposition) return;
    
    const nameMatch = contentDisposition.match(/name="([^"]+)"/i);
    const name = nameMatch ? nameMatch[1] : null;
    
    const filenameMatch = contentDisposition.match(/filename="([^"]+)"/i);
    result.filename = filenameMatch ? filenameMatch[1] : null;
    
    // Get content type
    const contentTypeHeader = headers.find(h => h.toLowerCase().startsWith('content-type:'));
    if (contentTypeHeader) {
      result.contentType = contentTypeHeader.substring(contentTypeHeader.indexOf(':') + 1).trim();
    }
    
    if (name === 'file') {
      result.file = content.replace(/\\r?\\n$/, '');
    } else if (name) {
      result[name] = content.replace(/\\r?\\n$/, '');
    }
  });
  
  return result;
}
EOF
    filename = "index.js"
  }
}

# List Files Handler Lambda archive
data "archive_file" "list_files_handler_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda_code/list_files_handler.zip"

  source {
    content  = <<EOF
const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

const METADATA_TABLE = process.env.METADATA_TABLE;

exports.handler = async (event) => {
  try {
    // Extract user ID from JWT claims in the request
    const userId = event.requestContext.authorizer.jwt.claims.sub;
    
    // Query DynamoDB for user's files
    const result = await dynamoDB.query({
      TableName: METADATA_TABLE,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'user_id = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }).promise();
    
    // Filter out files with status 'deleted'
    const files = result.Items.filter(file => file.status !== 'deleted');
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        files: files.map(file => ({
          fileId: file.file_id,
          fileName: file.file_name,
          contentType: file.content_type,
          size: file.size,
          status: file.status,
          createdAt: file.created_at
        }))
      })
    };
  } catch (error) {
    console.error('Error listing files:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error listing files',
        details: error.message
      })
    };
  }
};
EOF
    filename = "index.js"
  }
}
