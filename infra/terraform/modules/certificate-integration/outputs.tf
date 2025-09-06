output "certificate_status" {
  description = "Status of the certificate integration with CloudFront"
  value       = local.is_certificate_valid ? "Certificate applied to CloudFront distributions" : "Certificate not yet validated"
}

output "certificate_arn" {
  description = "ARN of the certificate used for CloudFront"
  value       = var.certificate_arn
}
