# Create an ACM certificate for the domain and wildcard subdomains
resource "aws_acm_certificate" "main" {
  domain_name               = "guidogerbpublishing.com"
  subject_alternative_names = ["*.guidogerbpublishing.com"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "GuidoGerbPublishing Wildcard Certificate"
    Environment = var.environment
  }
}

# Create DNS validation records in Route 53
resource "aws_route53_record" "validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name    = dvo.resource_record_name
      record  = dvo.resource_record_value
      type    = dvo.resource_record_type
    }
  }

  zone_id         = var.hosted_zone_id
  name            = each.value.name
  type            = each.value.type
  ttl             = 60
  records         = [each.value.record]
  allow_overwrite = true
}

# Validate the certificate with the DNS records
resource "aws_acm_certificate_validation" "main" {
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in aws_route53_record.validation : record.fqdn]
}

# Create Route 53 record for main domain pointing to CloudFront
resource "aws_route53_record" "main" {
  zone_id = var.hosted_zone_id
  name    = "guidogerbpublishing.com"
  type    = "A"

  alias {
    name                   = var.cloudfront_domain_name
    zone_id                = var.cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}

# Create Route 53 record for www subdomain
resource "aws_route53_record" "www" {
  zone_id = var.hosted_zone_id
  name    = "www.guidogerbpublishing.com"
  type    = "A"

  alias {
    name                   = var.cloudfront_domain_name
    zone_id                = var.cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}

# Create Route 53 record for API subdomain
resource "aws_route53_record" "api" {
  zone_id = var.hosted_zone_id
  name    = "api.guidogerbpublishing.com"
  type    = "A"

  alias {
    name                   = var.api_cloudfront_domain_name
    zone_id                = var.cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}

# Create Route 53 record for media subdomain
resource "aws_route53_record" "media" {
  zone_id = var.hosted_zone_id
  name    = "media.guidogerbpublishing.com"
  type    = "A"

  alias {
    name                   = var.media_cloudfront_domain_name
    zone_id                = var.cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}
