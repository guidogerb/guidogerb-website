variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "bucket_prefix" {
  description = "Prefix for the S3 bucket names"
  type        = string
  default     = "guidogerbpublishing"
}

variable "frontend_origin" {
  description = "Origin URL for the frontend application (for CORS)"
  type        = string
}

# JWT Authentication variables
variable "jwt_audience" {
  description = "JWT audience claim value"
  type        = string
}

variable "jwt_issuer" {
  description = "JWT issuer claim value"
  type        = string
}

# Content moderation variables
variable "moderation_confidence_threshold" {
  description = "Confidence threshold for content moderation (0-100)"
  type        = number
  default     = 75.0
}

# Lambda function variables
variable "lambda_memory_size" {
  description = "Memory size for Lambda functions in MB"
  type        = number
  default     = 256
}

variable "lambda_timeout" {
  description = "Timeout for Lambda functions in seconds"
  type        = number
  default     = 30
}

# Network variables (if needed)
variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
  default     = ""
}

variable "subnet_ids" {
  description = "IDs of the subnets where Lambda functions will run"
  type        = list(string)
  default     = []
}

variable "lambda_security_group_ids" {
  description = "Security group IDs for Lambda functions"
  type        = list(string)
  default     = []
}

# WebSocket API variables
variable "websocket_connection_ttl" {
  description = "TTL for WebSocket connections in seconds"
  type        = number
  default     = 7200  # 2 hours
}

# Route53 and DNS variables
variable "domain_name" {
  description = "Domain name for the API Gateway custom domain"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ARN of the ACM certificate for the custom domain"
  type        = string
  default     = ""
}
