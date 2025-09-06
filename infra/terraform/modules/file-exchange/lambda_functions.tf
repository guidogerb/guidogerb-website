# Lambda functions for File Exchange feature

# Common IAM role for Lambda functions
resource "aws_iam_role" "lambda_role" {
  name = "file-exchange-lambda-role-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.file_exchange_lambda_policy.arn
}

# CloudWatch logs policy for Lambda functions
resource "aws_iam_policy" "lambda_logs_policy" {
  name        = "file-exchange-lambda-logs-policy-${var.environment}"
  description = "IAM policy for logging from Lambda functions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# Attach logs policy to role
resource "aws_iam_role_policy_attachment" "lambda_logs_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_logs_policy.arn
}

# Hello World Lambda function (for testing)
resource "aws_lambda_function" "hello_world" {
  function_name    = "file-exchange-hello-world-${var.environment}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs16.x"
  filename         = data.archive_file.hello_world_zip.output_path
  source_code_hash = data.archive_file.hello_world_zip.output_base64sha256
  
  environment {
    variables = {
      ENVIRONMENT = var.environment
      BUCKET_NAME = aws_s3_bucket.file_exchange.id
    }
  }
}

# File Upload Handler Lambda
resource "aws_lambda_function" "upload_handler" {
  function_name    = "file-exchange-upload-handler-${var.environment}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs16.x"
  filename         = data.archive_file.upload_handler_zip.output_path
  source_code_hash = data.archive_file.upload_handler_zip.output_base64sha256
  timeout          = 30
  memory_size      = 256
  
  environment {
    variables = {
      ENVIRONMENT                    = var.environment
      BUCKET_NAME                    = aws_s3_bucket.file_exchange.id
      METADATA_TABLE                 = aws_dynamodb_table.file_metadata.name
      WEBSOCKET_API_ENDPOINT         = "https://${aws_apigatewayv2_api.websocket_api.id}.execute-api.${var.region}.amazonaws.com/${aws_apigatewayv2_stage.websocket_api_stage.name}"
      MODERATION_CONFIDENCE_THRESHOLD = var.moderation_confidence_threshold
    }
  }
}

# File List Handler Lambda
resource "aws_lambda_function" "list_files_handler" {
  function_name    = "file-exchange-list-files-handler-${var.environment}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs16.x"
  filename         = data.archive_file.list_files_handler_zip.output_path
  source_code_hash = data.archive_file.list_files_handler_zip.output_base64sha256
  
  environment {
    variables = {
      ENVIRONMENT    = var.environment
      BUCKET_NAME    = aws_s3_bucket.file_exchange.id
      METADATA_TABLE = aws_dynamodb_table.file_metadata.name
    }
  }
}

# File Download Handler Lambda
resource "aws_lambda_function" "download_handler" {
  function_name    = "file-exchange-download-handler-${var.environment}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs16.x"
  filename         = data.archive_file.download_handler_zip.output_path
  source_code_hash = data.archive_file.download_handler_zip.output_base64sha256
  
  environment {
    variables = {
      ENVIRONMENT    = var.environment
      BUCKET_NAME    = aws_s3_bucket.file_exchange.id
      METADATA_TABLE = aws_dynamodb_table.file_metadata.name
    }
  }
}

# File Delete Handler Lambda
resource "aws_lambda_function" "delete_file_handler" {
  function_name    = "file-exchange-delete-file-handler-${var.environment}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs16.x"
  filename         = data.archive_file.delete_file_handler_zip.output_path
  source_code_hash = data.archive_file.delete_file_handler_zip.output_base64sha256
  
  environment {
    variables = {
      ENVIRONMENT    = var.environment
      BUCKET_NAME    = aws_s3_bucket.file_exchange.id
      METADATA_TABLE = aws_dynamodb_table.file_metadata.name
      WEBSOCKET_API_ENDPOINT = "https://${aws_apigatewayv2_api.websocket_api.id}.execute-api.${var.region}.amazonaws.com/${aws_apigatewayv2_stage.websocket_api_stage.name}"
    }
  }
}

# Content Moderation Handler Lambda
resource "aws_lambda_function" "moderation_handler" {
  function_name    = "file-exchange-moderation-handler-${var.environment}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs16.x"
  filename         = data.archive_file.moderation_handler_zip.output_path
  source_code_hash = data.archive_file.moderation_handler_zip.output_base64sha256
  timeout          = 60
  memory_size      = 256
  
  environment {
    variables = {
      ENVIRONMENT                    = var.environment
      BUCKET_NAME                    = aws_s3_bucket.file_exchange.id
      METADATA_TABLE                 = aws_dynamodb_table.file_metadata.name
      WEBSOCKET_API_ENDPOINT         = "https://${aws_apigatewayv2_api.websocket_api.id}.execute-api.${var.region}.amazonaws.com/${aws_apigatewayv2_stage.websocket_api_stage.name}"
      MODERATION_CONFIDENCE_THRESHOLD = var.moderation_confidence_threshold
    }
  }
}

# S3 trigger for content moderation
resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.moderation_handler.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.file_exchange.arn
}

resource "aws_s3_bucket_notification" "bucket_notification" {
  bucket = aws_s3_bucket.file_exchange.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.moderation_handler.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "*/uploads/"
    filter_suffix       = ""
  }

  depends_on = [aws_lambda_permission.allow_s3]
}

# Digital Asset Purchase List Handler Lambda
resource "aws_lambda_function" "list_purchases_handler" {
  function_name    = "file-exchange-list-purchases-handler-${var.environment}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs16.x"
  filename         = data.archive_file.list_purchases_handler_zip.output_path
  source_code_hash = data.archive_file.list_purchases_handler_zip.output_base64sha256
  
  environment {
    variables = {
      ENVIRONMENT     = var.environment
      BUCKET_NAME     = aws_s3_bucket.file_exchange.id
      PURCHASES_TABLE = aws_dynamodb_table.user_purchases.name
    }
  }
}

# Digital Asset Purchase Download Handler Lambda
resource "aws_lambda_function" "download_purchase_handler" {
  function_name    = "file-exchange-download-purchase-handler-${var.environment}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs16.x"
  filename         = data.archive_file.download_purchase_handler_zip.output_path
  source_code_hash = data.archive_file.download_purchase_handler_zip.output_base64sha256
  
  environment {
    variables = {
      ENVIRONMENT     = var.environment
      BUCKET_NAME     = aws_s3_bucket.file_exchange.id
      PURCHASES_TABLE = aws_dynamodb_table.user_purchases.name
    }
  }
}

# Admin List Users Handler Lambda
resource "aws_lambda_function" "admin_list_users_handler" {
  function_name    = "file-exchange-admin-list-users-handler-${var.environment}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs16.x"
  filename         = data.archive_file.admin_list_users_handler_zip.output_path
  source_code_hash = data.archive_file.admin_list_users_handler_zip.output_base64sha256
  
  environment {
    variables = {
      ENVIRONMENT    = var.environment
      METADATA_TABLE = aws_dynamodb_table.file_metadata.name
    }
  }
}

# Admin List User Files Handler Lambda
resource "aws_lambda_function" "admin_list_user_files_handler" {
  function_name    = "file-exchange-admin-list-user-files-handler-${var.environment}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs16.x"
  filename         = data.archive_file.admin_list_user_files_handler_zip.output_path
  source_code_hash = data.archive_file.admin_list_user_files_handler_zip.output_base64sha256
  
  environment {
    variables = {
      ENVIRONMENT    = var.environment
      BUCKET_NAME    = aws_s3_bucket.file_exchange.id
      METADATA_TABLE = aws_dynamodb_table.file_metadata.name
    }
  }
}

# Admin Update File Status Handler Lambda
resource "aws_lambda_function" "admin_update_file_status_handler" {
  function_name    = "file-exchange-admin-update-file-status-handler-${var.environment}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs16.x"
  filename         = data.archive_file.admin_update_file_status_handler_zip.output_path
  source_code_hash = data.archive_file.admin_update_file_status_handler_zip.output_base64sha256
  
  environment {
    variables = {
      ENVIRONMENT           = var.environment
      BUCKET_NAME           = aws_s3_bucket.file_exchange.id
      METADATA_TABLE        = aws_dynamodb_table.file_metadata.name
      WEBSOCKET_API_ENDPOINT = "https://${aws_apigatewayv2_api.websocket_api.id}.execute-api.${var.region}.amazonaws.com/${aws_apigatewayv2_stage.websocket_api_stage.name}"
    }
  }
}

# WebSocket Connect Handler Lambda
resource "aws_lambda_function" "websocket_connect_handler" {
  function_name    = "file-exchange-websocket-connect-handler-${var.environment}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs16.x"
  filename         = data.archive_file.websocket_connect_handler_zip.output_path
  source_code_hash = data.archive_file.websocket_connect_handler_zip.output_base64sha256
  
  environment {
    variables = {
      ENVIRONMENT           = var.environment
      CONNECTIONS_TABLE     = aws_dynamodb_table.websocket_connections.name
    }
  }
}

# WebSocket Disconnect Handler Lambda
resource "aws_lambda_function" "websocket_disconnect_handler" {
  function_name    = "file-exchange-websocket-disconnect-handler-${var.environment}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs16.x"
  filename         = data.archive_file.websocket_disconnect_handler_zip.output_path
  source_code_hash = data.archive_file.websocket_disconnect_handler_zip.output_base64sha256
  
  environment {
    variables = {
      ENVIRONMENT           = var.environment
      CONNECTIONS_TABLE     = aws_dynamodb_table.websocket_connections.name
    }
  }
}

# WebSocket Default Handler Lambda
resource "aws_lambda_function" "websocket_default_handler" {
  function_name    = "file-exchange-websocket-default-handler-${var.environment}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs16.x"
  filename         = data.archive_file.websocket_default_handler_zip.output_path
  source_code_hash = data.archive_file.websocket_default_handler_zip.output_base64sha256
  
  environment {
    variables = {
      ENVIRONMENT           = var.environment
      CONNECTIONS_TABLE     = aws_dynamodb_table.websocket_connections.name
    }
  }
}
