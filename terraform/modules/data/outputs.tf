output "account_id" {
  description = "Current AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "region_name" {
  description = "Current AWS region name"
  value       = data.aws_region.current.name
}

output "availability_zones" {
  description = "List of available AZs in the current region"
  value       = data.aws_availability_zones.available.names
}

output "amazon_linux_2_ami_id" {
  description = "Latest Amazon Linux 2 AMI ID"
  value       = data.aws_ami.amazon_linux_2.id
}

output "certificate_arn" {
  description = "ARN of the ACM certificate (if a domain name was provided)"
  value       = var.domain_name != "" ? data.aws_acm_certificate.issued[0].arn : null
}

output "hosted_zone_id" {
  description = "ID of the Route 53 hosted zone (if a domain name was provided)"
  value       = var.domain_name != "" ? data.aws_route53_zone.selected[0].zone_id : null
}
