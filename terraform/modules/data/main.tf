# This module contains common data sources used across multiple modules

# Get the current AWS account ID
data "aws_caller_identity" "current" {}

# Get the current AWS region
data "aws_region" "current" {}

# Get available AZs in the region
data "aws_availability_zones" "available" {
  state = "available"
}

# Look up latest Amazon Linux 2 AMI (for any EC2 resources that might be needed)
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Look up ACM certificates if available
data "aws_acm_certificate" "issued" {
  count  = var.domain_name != "" ? 1 : 0
  domain = var.domain_name
  statuses = ["ISSUED"]
  most_recent = true
}

# Look up Route 53 hosted zone if a domain is provided
data "aws_route53_zone" "selected" {
  count = var.domain_name != "" ? 1 : 0
  name  = var.hosted_zone_name != "" ? var.hosted_zone_name : regex("([^.]+\\.[^.]+)$", var.domain_name)
  private_zone = false
}
