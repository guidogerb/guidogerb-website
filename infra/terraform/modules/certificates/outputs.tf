output "certificate_arn" {
  description = "ARN of the validated ACM certificate"
  value       = aws_acm_certificate_validation.main.certificate_arn
}

output "certificate_domain_name" {
  description = "Main domain name for the certificate"
  value       = aws_acm_certificate.main.domain_name
}

output "certificate_validation_domains" {
  description = "List of domains validated with this certificate including wildcard"
  value       = concat([aws_acm_certificate.main.domain_name], aws_acm_certificate.main.subject_alternative_names)
}
