variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
}

variable "frontend_bucket_name" {
  description = "Name of the S3 bucket for frontend hosting"
  type        = string
}

variable "frontend_bucket_arn" {
  description = "ARN of the S3 bucket for frontend hosting"
  type        = string
}

variable "asset_bucket_name" {
  description = "Name of the S3 bucket for assets"
  type        = string
}

variable "asset_bucket_arn" {
  description = "ARN of the S3 bucket for assets"
  type        = string
}

variable "logging_bucket_name" {
  description = "Name of the S3 bucket for access logs"
  type        = string
}

variable "waf_web_acl_arn" {
  description = "ARN of the WAF web ACL to associate with CloudFront distributions"
  type        = string
}

variable "acm_certificate_arn" {
  description = "ARN of the ACM certificate for CloudFront HTTPS"
  type        = string
  default     = null
}

variable "cloudfront_public_key" {
  description = "Public key for CloudFront signed URLs"
  type        = string
  default     = ""
}
