# File Exchange Module - Secure File Upload and Management System

# S3 bucket for file exchange with appropriate lifecycle policies
resource "aws_s3_bucket" "file_exchange" {
  bucket = "${var.bucket_prefix}-file-exchange-${var.environment}"
  
  tags = {
    Name        = "Secure File Exchange"
    Environment = var.environment
  }
}

# Block public access to the file exchange bucket
resource "aws_s3_bucket_public_access_block" "file_exchange" {
  bucket = aws_s3_bucket.file_exchange.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Server-side encryption for the file exchange bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "file_exchange" {
  bucket = aws_s3_bucket.file_exchange.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# CORS configuration for the file exchange bucket
resource "aws_s3_bucket_cors_configuration" "file_exchange" {
  bucket = aws_s3_bucket.file_exchange.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE"]
    allowed_origins = [var.frontend_origin]
    expose_headers  = ["ETag", "Content-Type", "Content-Length"]
    max_age_seconds = 3000
  }
}

# Lifecycle configuration for the file exchange bucket
resource "aws_s3_bucket_lifecycle_configuration" "file_exchange" {
  bucket = aws_s3_bucket.file_exchange.id

  rule {
    id = "expire-deleted-files"
    status = "Enabled"
    
    filter {
      prefix = "*/deleted/"
    }
    
    expiration {
      days = 30
    }
  }
  
  rule {
    id = "transition-purchased-assets"
    status = "Enabled"
    
    filter {
      prefix = "*/purchased/"
    }
    
    transition {
      days = 90
      storage_class = "STANDARD_IA"
    }
  }
}

# IAM role for the upload Lambda function
resource "aws_iam_role" "upload_lambda_role" {
  name = "file-exchange-upload-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM policy for the file exchange Lambda functions
resource "aws_iam_policy" "file_exchange_lambda_policy" {
  name        = "file-exchange-lambda-policy-${var.environment}"
  description = "Policy for the file exchange Lambda functions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:DeleteObject",
          "s3:CopyObject"
        ]
        Effect   = "Allow"
        Resource = [
          aws_s3_bucket.file_exchange.arn,
          "${aws_s3_bucket.file_exchange.arn}/*"
        ]
      },
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Action = [
          "rekognition:DetectModerationLabels"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action = [
          "execute-api:ManageConnections"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:execute-api:*:*:*/@connections/*"
      },
      {
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Effect   = "Allow"
        Resource = [
          aws_dynamodb_table.websocket_connections.arn,
          aws_dynamodb_table.user_purchases.arn
        ]
      }
    ]
  })
}

# Attach the policy to the role
resource "aws_iam_role_policy_attachment" "upload_lambda_policy_attachment" {
  role       = aws_iam_role.upload_lambda_role.name
  policy_arn = aws_iam_policy.upload_lambda_policy.arn
}

# Lambda function for file uploads
resource "aws_lambda_function" "upload_handler" {
  function_name    = "file-exchange-upload-handler-${var.environment}"
  role             = aws_iam_role.upload_lambda_role.arn
  handler          = "upload_handler.lambda_handler"
  runtime          = "python3.9"
  timeout          = 30
  memory_size      = 512
  
  s3_bucket        = var.lambda_code_bucket
  s3_key           = var.upload_handler_s3_key

  environment {
    variables = {
      UPLOADS_BUCKET = aws_s3_bucket.uploads.id
      ENVIRONMENT    = var.environment
      MODERATION_CONFIDENCE_THRESHOLD = "70"
    }
  }
}

# Lambda function for file content moderation
resource "aws_lambda_function" "content_moderator" {
  function_name    = "file-exchange-content-moderator-${var.environment}"
  role             = aws_iam_role.upload_lambda_role.arn
  handler          = "content_moderator.lambda_handler"
  runtime          = "python3.9"
  timeout          = 60
  memory_size      = 1024
  
  s3_bucket        = var.lambda_code_bucket
  s3_key           = var.content_moderator_s3_key

  environment {
    variables = {
      UPLOADS_BUCKET = aws_s3_bucket.uploads.id
      ENVIRONMENT    = var.environment
      MODERATION_CONFIDENCE_THRESHOLD = "70"
    }
  }
}

# S3 event trigger for content moderation
resource "aws_s3_bucket_notification" "upload_notification" {
  bucket = aws_s3_bucket.uploads.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.content_moderator.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploads/"
    filter_suffix       = ""
  }

  depends_on = [
    aws_lambda_permission.allow_s3_trigger
  ]
}

# Permission for S3 to invoke the content moderator Lambda
resource "aws_lambda_permission" "allow_s3_trigger" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.content_moderator.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.uploads.arn
}

# Hello World Lambda function
resource "aws_lambda_function" "hello_world" {
  function_name    = "file-exchange-hello-world-${var.environment}"
  role             = aws_iam_role.upload_lambda_role.arn
  handler          = "helloworld.lambda_handler"
  runtime          = "python3.9"
  timeout          = 10
  memory_size      = 128
  
  s3_bucket        = var.lambda_code_bucket
  s3_key           = var.hello_world_s3_key

  environment {
    variables = {
      ENVIRONMENT = var.environment
    }
  }
}

# API Gateway for the file exchange API
resource "aws_apigatewayv2_api" "file_exchange_api" {
  name          = "file-exchange-api-${var.environment}"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = [var.frontend_origin]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key", "X-Amz-Security-Token"]
    max_age       = 300
  }
}

# API Gateway stage
resource "aws_apigatewayv2_stage" "file_exchange_api_stage" {
  api_id      = aws_apigatewayv2_api.file_exchange_api.id
  name        = var.environment
  auto_deploy = true
}

# API Gateway integration for the upload handler
resource "aws_apigatewayv2_integration" "upload_handler_integration" {
  api_id             = aws_apigatewayv2_api.file_exchange_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.upload_handler.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

# API Gateway integration for the hello world handler
resource "aws_apigatewayv2_integration" "hello_world_integration" {
  api_id             = aws_apigatewayv2_api.file_exchange_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.hello_world.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

# API Gateway route for the upload handler
resource "aws_apigatewayv2_route" "upload_handler_route" {
  api_id    = aws_apigatewayv2_api.file_exchange_api.id
  route_key = "POST /upload"
  target    = "integrations/${aws_apigatewayv2_integration.upload_handler_integration.id}"
}

# API Gateway route for the hello world handler
resource "aws_apigatewayv2_route" "hello_world_route" {
  api_id    = aws_apigatewayv2_api.file_exchange_api.id
  route_key = "GET /hello"
  target    = "integrations/${aws_apigatewayv2_integration.hello_world_integration.id}"
}

# Permission for API Gateway to invoke the upload handler Lambda
resource "aws_lambda_permission" "upload_handler_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.upload_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.file_exchange_api.execution_arn}/*/*/upload"
}

# Permission for API Gateway to invoke the hello world Lambda
resource "aws_lambda_permission" "hello_world_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.hello_world.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.file_exchange_api.execution_arn}/*/*/hello"
}
