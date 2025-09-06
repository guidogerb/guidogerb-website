# ECS Cluster for containerized services
resource "aws_ecs_cluster" "main" {
  name = var.ecs_cluster_name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name        = "Digital Asset Platform Cluster"
    Environment = var.environment
  }
}

# CloudWatch Log Group for ECS logs
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.ecs_cluster_name}"
  retention_in_days = var.environment == "prod" ? 30 : 7

  tags = {
    Name        = "ECS Logs"
    Environment = var.environment
  }
}

# ECR Repositories for Docker images
resource "aws_ecr_repository" "repos" {
  for_each = toset(var.ecr_repository_names)

  name                 = each.key
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = aws_kms_key.ecr.arn
  }

  tags = {
    Name        = each.key
    Environment = var.environment
  }
}

# KMS key for ECR encryption
resource "aws_kms_key" "ecr" {
  description             = "KMS key for ECR repository encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name        = "ECR Encryption Key"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "ecr" {
  name          = "alias/ecr-key-${var.environment}"
  target_key_id = aws_kms_key.ecr.key_id
}

# ECR Lifecycle Policy to limit image versions
resource "aws_ecr_lifecycle_policy" "main" {
  for_each = aws_ecr_repository.repos

  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep only the last 5 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 5
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# Lambda function for asset processing
resource "aws_lambda_function" "asset_processor" {
  function_name = "asset-processor-${var.environment}"
  description   = "Processes uploaded assets for streaming and distribution"
  role          = var.lambda_execution_role_arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  timeout       = 300
  memory_size   = 1024

  s3_bucket = var.lambda_code_bucket
  s3_key    = var.asset_processor_s3_key

  environment {
    variables = {
      ENVIRONMENT  = var.environment
      ASSET_BUCKET = var.asset_bucket_name
      REGION       = var.aws_region
    }
  }

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
  }

  tags = {
    Name        = "Asset Processor"
    Environment = var.environment
  }
}

# Lambda function for generating signed URLs
resource "aws_lambda_function" "url_signer" {
  function_name = "url-signer-${var.environment}"
  description   = "Generates signed URLs for protected assets"
  role          = var.lambda_execution_role_arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  timeout       = 10
  memory_size   = 128

  s3_bucket = var.lambda_code_bucket
  s3_key    = var.url_signer_s3_key

  environment {
    variables = {
      ENVIRONMENT       = var.environment
      DISTRIBUTION_ID   = var.cloudfront_distribution_id
      KEY_PAIR_ID       = var.cloudfront_key_pair_id
      PRIVATE_KEY_PARAM = var.cloudfront_private_key_param
      REGION            = var.aws_region
    }
  }

  tags = {
    Name        = "URL Signer"
    Environment = var.environment
  }
}

# Lambda function for asset metadata handling
resource "aws_lambda_function" "metadata_handler" {
  function_name = "metadata-handler-${var.environment}"
  description   = "Handles metadata for digital assets"
  role          = var.lambda_execution_role_arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  timeout       = 30
  memory_size   = 256

  s3_bucket = var.lambda_code_bucket
  s3_key    = var.metadata_handler_s3_key

  environment {
    variables = {
      ENVIRONMENT              = var.environment
      METADATA_TABLE           = var.asset_metadata_table
      RIGHTS_MANAGEMENT_TABLE  = var.rights_management_table
      REGION                   = var.aws_region
    }
  }

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
  }

  tags = {
    Name        = "Metadata Handler"
    Environment = var.environment
  }
}

# Security group for Lambda functions
resource "aws_security_group" "lambda" {
  name        = "lambda-sg-${var.environment}"
  description = "Security group for Lambda functions"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "Lambda Security Group"
    Environment = var.environment
  }
}

# S3 event notification for asset processing
resource "aws_s3_bucket_notification" "asset_upload" {
  bucket = var.asset_bucket_name

  lambda_function {
    lambda_function_arn = aws_lambda_function.asset_processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploads/"
  }

  depends_on = [aws_lambda_permission.allow_s3]
}

# Lambda permission for S3 event invocation
resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowExecutionFromS3"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.asset_processor.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = "arn:aws:s3:::${var.asset_bucket_name}"
}

# CloudWatch Dashboard for compute resources
resource "aws_cloudwatch_dashboard" "compute" {
  dashboard_name = "compute-dashboard-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ClusterName", var.ecs_cluster_name]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "ECS Cluster CPU Utilization"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ECS", "MemoryUtilization", "ClusterName", var.ecs_cluster_name]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "ECS Cluster Memory Utilization"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 24
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.asset_processor.function_name],
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.url_signer.function_name],
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.metadata_handler.function_name]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Invocations"
          period  = 300
        }
      }
    ]
  })
}
