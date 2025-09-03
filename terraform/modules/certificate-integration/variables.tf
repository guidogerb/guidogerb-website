variable "certificate_arn" {
  description = "ARN of the validated ACM certificate"
  type        = string
  default     = null
}

variable "frontend_distribution_id" {
  description = "ID of the CloudFront distribution for the frontend"
  type        = string
}

variable "assets_distribution_id" {
  description = "ID of the CloudFront distribution for assets"
  type        = string
}
