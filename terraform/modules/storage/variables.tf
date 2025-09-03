variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
}

variable "asset_bucket_name" {
  description = "Name of the S3 bucket for storing digital assets"
  type        = string
}

variable "frontend_bucket_name" {
  description = "Name of the S3 bucket for frontend hosting"
  type        = string
}

variable "logging_bucket_name" {
  description = "Name of the S3 bucket for access logs"
  type        = string
}

variable "sam_artifacts_bucket_name" {
  description = "Name of the S3 bucket for SAM artifacts"
  type        = string
}
