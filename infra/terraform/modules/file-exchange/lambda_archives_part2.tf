# Archive files for Lambda functions - Part 2

# Download Handler Lambda archive
data "archive_file" "download_handler_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda_code/download_handler.zip"

  source {
    content  = <<EOF
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

const BUCKET_NAME = process.env.BUCKET_NAME;
const METADATA_TABLE = process.env.METADATA_TABLE;

exports.handler = async (event) => {
  try {
    // Extract user ID from JWT claims in the request
    const userId = event.requestContext.authorizer.jwt.claims.sub;
    const fileId = event.pathParameters.fileId;
    
    if (!fileId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'File ID is required' })
      };
    }
    
    // Get file metadata from DynamoDB
    const metadataResult = await dynamoDB.get({
      TableName: METADATA_TABLE,
      Key: { file_id: fileId }
    }).promise();
    
    const fileMetadata = metadataResult.Item;
    
    if (!fileMetadata) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'File not found' })
      };
    }
    
    // Check if user owns the file
    if (fileMetadata.user_id !== userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Access denied' })
      };
    }
    
    // Check if file status is acceptable for download
    if (fileMetadata.status === 'rejected') {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'File has been rejected due to inappropriate content' })
      };
    }
    
    if (fileMetadata.status === 'deleted') {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'File has been deleted' })
      };
    }
    
    // Generate presigned URL for download
    const url = s3.getSignedUrl('getObject', {
      Bucket: BUCKET_NAME,
      Key: fileMetadata.s3_key,
      Expires: 3600, // URL expires in 1 hour
      ResponseContentDisposition: `attachment; filename="${fileMetadata.file_name}"`,
      ResponseContentType: fileMetadata.content_type
    });
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        url: url,
        fileName: fileMetadata.file_name,
        contentType: fileMetadata.content_type,
        expiresIn: 3600
      })
    };
  } catch (error) {
    console.error('Error generating download URL:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error generating download URL',
        details: error.message
      })
    };
  }
};
EOF
    filename = "index.js"
  }
}

# Delete File Handler Lambda archive
data "archive_file" "delete_file_handler_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda_code/delete_file_handler.zip"

  source {
    content  = <<EOF
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

const BUCKET_NAME = process.env.BUCKET_NAME;
const METADATA_TABLE = process.env.METADATA_TABLE;
const WEBSOCKET_API_ENDPOINT = process.env.WEBSOCKET_API_ENDPOINT;

exports.handler = async (event) => {
  try {
    // Extract user ID from JWT claims in the request
    const userId = event.requestContext.authorizer.jwt.claims.sub;
    const fileId = event.pathParameters.fileId;
    
    if (!fileId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'File ID is required' })
      };
    }
    
    // Get file metadata from DynamoDB
    const metadataResult = await dynamoDB.get({
      TableName: METADATA_TABLE,
      Key: { file_id: fileId }
    }).promise();
    
    const fileMetadata = metadataResult.Item;
    
    if (!fileMetadata) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'File not found' })
      };
    }
    
    // Check if user owns the file
    if (fileMetadata.user_id !== userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Access denied' })
      };
    }
    
    // Check if file is already deleted
    if (fileMetadata.status === 'deleted') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'File has already been deleted' })
      };
    }
    
    // Move file to deleted folder
    const currentKey = fileMetadata.s3_key;
    const newKey = currentKey.replace('/uploads/', '/uploads/deleted/');
    
    // Copy to new location
    await s3.copyObject({
      Bucket: BUCKET_NAME,
      CopySource: `${BUCKET_NAME}/${currentKey}`,
      Key: newKey
    }).promise();
    
    // Delete from original location
    await s3.deleteObject({
      Bucket: BUCKET_NAME,
      Key: currentKey
    }).promise();
    
    // Update metadata in DynamoDB
    await dynamoDB.update({
      TableName: METADATA_TABLE,
      Key: { file_id: fileId },
      UpdateExpression: 'SET #status = :status, s3_key = :s3Key, updated_at = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'deleted',
        ':s3Key': newKey,
        ':updatedAt': new Date().toISOString()
      }
    }).promise();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'File deleted successfully',
        fileId: fileId
      })
    };
  } catch (error) {
    console.error('Error deleting file:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error deleting file',
        details: error.message
      })
    };
  }
};
EOF
    filename = "index.js"
  }
}

# Moderation Handler Lambda archive
data "archive_file" "moderation_handler_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda_code/moderation_handler.zip"

  source {
    content  = <<EOF
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const rekognition = new AWS.Rekognition();
const apiGatewayManagementApi = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.WEBSOCKET_API_ENDPOINT
});

const BUCKET_NAME = process.env.BUCKET_NAME;
const METADATA_TABLE = process.env.METADATA_TABLE;
const MODERATION_CONFIDENCE_THRESHOLD = parseFloat(process.env.MODERATION_CONFIDENCE_THRESHOLD || '75.0');

exports.handler = async (event) => {
  try {
    // Process S3 event records
    for (const record of event.Records) {
      if (record.eventName.startsWith('ObjectCreated:')) {
        const bucket = record.s3.bucket.name;
        const key = decodeURIComponent(record.s3.object.key.replace(/\\+/g, ' '));
        
        // Skip files that are not in uploads folder or already in rejected/deleted folders
        if (!key.includes('/uploads/') || key.includes('/uploads/rejected/') || key.includes('/uploads/deleted/')) {
          continue;
        }
        
        // Extract file ID from key - format is userId/uploads/fileId/fileName
        const parts = key.split('/');
        if (parts.length < 4) continue;
        
        const userId = parts[0];
        const fileId = parts[2];
        
        // Get file metadata from DynamoDB
        const metadataResult = await dynamoDB.get({
          TableName: METADATA_TABLE,
          Key: { file_id: fileId }
        }).promise();
        
        const fileMetadata = metadataResult.Item;
        if (!fileMetadata) continue;
        
        // Check file type and determine moderation approach
        let isInappropriate = false;
        let moderationLabels = [];
        
        if (fileMetadata.content_type.startsWith('image/')) {
          // Image moderation
          const moderationResult = await rekognition.detectModerationLabels({
            Image: {
              S3Object: {
                Bucket: bucket,
                Name: key
              }
            },
            MinConfidence: MODERATION_CONFIDENCE_THRESHOLD
          }).promise();
          
          moderationLabels = moderationResult.ModerationLabels || [];
          isInappropriate = moderationLabels.length > 0;
        }
        
        // Update the file status based on moderation results
        let newStatus = 'approved';
        let newKey = key;
        
        if (isInappropriate) {
          newStatus = 'rejected';
          newKey = key.replace('/uploads/', '/uploads/rejected/');
          
          // Move file to rejected folder
          await s3.copyObject({
            Bucket: bucket,
            CopySource: `${bucket}/${key}`,
            Key: newKey
          }).promise();
          
          await s3.deleteObject({
            Bucket: bucket,
            Key: key
          }).promise();
        }
        
        // Update metadata in DynamoDB
        await dynamoDB.update({
          TableName: METADATA_TABLE,
          Key: { file_id: fileId },
          UpdateExpression: 'SET #status = :status, s3_key = :s3Key, updated_at = :updatedAt, moderation_labels = :labels',
          ExpressionAttributeNames: {
            '#status': 'status'
          },
          ExpressionAttributeValues: {
            ':status': newStatus,
            ':s3Key': newKey,
            ':updatedAt': new Date().toISOString(),
            ':labels': moderationLabels.length > 0 ? moderationLabels : null
          }
        }).promise();
        
        // Send notification to user via WebSocket if available
        try {
          // Query for active WebSocket connections for this user
          const connectionResult = await dynamoDB.query({
            TableName: process.env.CONNECTIONS_TABLE,
            IndexName: 'UserIdIndex',
            KeyConditionExpression: 'user_id = :userId',
            ExpressionAttributeValues: {
              ':userId': userId
            }
          }).promise();
          
          if (connectionResult.Items && connectionResult.Items.length > 0) {
            const message = JSON.stringify({
              type: 'FILE_STATUS_UPDATE',
              fileId: fileId,
              status: newStatus,
              fileName: fileMetadata.file_name,
              message: isInappropriate ? 'File rejected due to inappropriate content' : 'File approved'
            });
            
            // Send message to all active connections for this user
            for (const connection of connectionResult.Items) {
              try {
                await apiGatewayManagementApi.postToConnection({
                  ConnectionId: connection.connection_id,
                  Data: message
                }).promise();
              } catch (wsError) {
                if (wsError.statusCode === 410) {
                  // Connection is stale, delete it
                  await dynamoDB.delete({
                    TableName: process.env.CONNECTIONS_TABLE,
                    Key: { connection_id: connection.connection_id }
                  }).promise();
                }
              }
            }
          }
        } catch (wsError) {
          console.error('Error sending WebSocket notification:', wsError);
          // Continue processing even if WebSocket notification fails
        }
      }
    }
    
    return { status: 'success' };
  } catch (error) {
    console.error('Error in moderation handler:', error);
    return { status: 'error', error: error.message };
  }
};
EOF
    filename = "index.js"
  }
}
