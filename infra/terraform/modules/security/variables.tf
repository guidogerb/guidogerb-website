variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC where security resources will be deployed"
  type        = string
}

variable "s3_bucket_arns" {
  description = "List of ARNs of S3 buckets that need to be accessed"
  type        = list(string)
  default     = []
}

variable "dynamodb_table_arns" {
  description = "List of ARNs of DynamoDB tables that need to be accessed"
  type        = list(string)
  default     = []
}

variable "secrets_manager_arns" {
  description = "List of ARNs of Secrets Manager secrets that need to be accessed"
  type        = list(string)
  default     = []
}
