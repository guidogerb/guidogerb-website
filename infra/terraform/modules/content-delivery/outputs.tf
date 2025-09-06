output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution for the frontend"
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution for the frontend"
  value       = aws_cloudfront_distribution.frontend.arn
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution for the frontend"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "assets_distribution_id" {
  description = "ID of the CloudFront distribution for assets"
  value       = aws_cloudfront_distribution.assets.id
}

output "assets_distribution_arn" {
  description = "ARN of the CloudFront distribution for assets"
  value       = aws_cloudfront_distribution.assets.arn
}

output "assets_distribution_domain_name" {
  description = "Domain name of the CloudFront distribution for assets"
  value       = aws_cloudfront_distribution.assets.domain_name
}

output "cloudfront_key_group_id" {
  description = "ID of the CloudFront key group for signed URLs"
  value       = aws_cloudfront_key_group.assets.id
}
