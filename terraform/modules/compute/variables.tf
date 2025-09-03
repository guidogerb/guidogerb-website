variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC where compute resources will be deployed"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs where compute resources will be deployed"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs where load balancers will be deployed"
  type        = list(string)
}

variable "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
}

variable "ecr_repository_names" {
  description = "List of ECR repository names to create"
  type        = list(string)
}

variable "lambda_execution_role_arn" {
  description = "ARN of the Lambda execution role"
  type        = string
}

variable "lambda_code_bucket" {
  description = "Name of the S3 bucket containing Lambda function code"
  type        = string
  default     = ""
}

variable "asset_processor_s3_key" {
  description = "S3 key for the asset processor Lambda function code"
  type        = string
  default     = "lambda/asset-processor.zip"
}

variable "url_signer_s3_key" {
  description = "S3 key for the URL signer Lambda function code"
  type        = string
  default     = "lambda/url-signer.zip"
}

variable "metadata_handler_s3_key" {
  description = "S3 key for the metadata handler Lambda function code"
  type        = string
  default     = "lambda/metadata-handler.zip"
}

variable "asset_bucket_name" {
  description = "Name of the S3 bucket for assets"
  type        = string
  default     = ""
}

variable "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution for assets"
  type        = string
  default     = ""
}

variable "cloudfront_key_pair_id" {
  description = "ID of the CloudFront key pair for signed URLs"
  type        = string
  default     = ""
}

variable "cloudfront_private_key_param" {
  description = "Name of the SSM parameter containing the CloudFront private key"
  type        = string
  default     = ""
}

variable "asset_metadata_table" {
  description = "Name of the DynamoDB table for asset metadata"
  type        = string
  default     = ""
}

variable "rights_management_table" {
  description = "Name of the DynamoDB table for rights management"
  type        = string
  default     = ""
}

variable "aws_region" {
  description = "AWS region where resources will be deployed"
  type        = string
  default     = "us-east-1"
}
