variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
}

variable "hosted_zone_id" {
  description = "ID of the Route 53 hosted zone for guidogerbpublishing.com"
  type        = string
}

variable "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution for the main website"
  type        = string
}

variable "cloudfront_hosted_zone_id" {
  description = "Hosted zone ID of the CloudFront distribution (always Z2FDTNDATAQYW2 for CloudFront)"
  type        = string
  default     = "Z2FDTNDATAQYW2"
}

variable "api_cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution for the API"
  type        = string
}

variable "media_cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution for the media streaming"
  type        = string
}
