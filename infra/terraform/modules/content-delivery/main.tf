resource "aws_cloudfront_origin_access_identity" "frontend" {
  comment = "Origin Access Identity for ${var.frontend_bucket_name}"
}

resource "aws_cloudfront_origin_access_identity" "assets" {
  comment = "Origin Access Identity for ${var.asset_bucket_name}"
}

# S3 policy for CloudFront access to frontend bucket
resource "aws_s3_bucket_policy" "frontend" {
  bucket = var.frontend_bucket_name

  policy = jsonencode({
    Version = "2012-10-17"
    Id      = "PolicyForCloudFrontPrivateContent"
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipal"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action    = "s3:GetObject"
        Resource  = "${var.frontend_bucket_arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.frontend.arn
          }
        }
      }
    ]
  })
}

# S3 policy for CloudFront access to assets bucket
resource "aws_s3_bucket_policy" "assets" {
  bucket = var.asset_bucket_name

  policy = jsonencode({
    Version = "2012-10-17"
    Id      = "PolicyForCloudFrontPrivateContent"
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipal"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action    = "s3:GetObject"
        Resource  = "${var.asset_bucket_arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.assets.arn
          }
        }
      }
    ]
  })
}

# CloudFront distribution for frontend
resource "aws_cloudfront_distribution" "frontend" {
  origin {
    domain_name              = "${var.frontend_bucket_name}.s3.amazonaws.com"
    origin_id                = "S3-${var.frontend_bucket_name}"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Frontend distribution for ${var.environment}"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"
  
  logging_config {
    include_cookies = false
    bucket          = "${var.logging_bucket_name}.s3.amazonaws.com"
    prefix          = "cloudfront/frontend/"
  }

  # Main frontend distribution behavior
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3-${var.frontend_bucket_name}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
      headers = ["Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
    
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
  }

  # Custom error responses for SPA
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  web_acl_id = var.waf_web_acl_arn

  viewer_certificate {
    cloudfront_default_certificate = var.acm_certificate_arn == null ? true : false
    acm_certificate_arn            = var.acm_certificate_arn
    ssl_support_method             = var.acm_certificate_arn == null ? null : "sni-only"
    minimum_protocol_version       = var.acm_certificate_arn == null ? "TLSv1" : "TLSv1.2_2021"
  }

  tags = {
    Name        = "Frontend Distribution"
    Environment = var.environment
  }
}

# CloudFront origin access control for frontend
resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "frontend-${var.environment}"
  description                       = "Origin access control for frontend bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront origin access control for assets
resource "aws_cloudfront_origin_access_control" "assets" {
  name                              = "assets-${var.environment}"
  description                       = "Origin access control for assets bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront security headers policy
resource "aws_cloudfront_response_headers_policy" "security_headers" {
  name = "security-headers-policy-${var.environment}"

  security_headers_config {
    content_security_policy {
      content_security_policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://*.amazonaws.com https://*.forgerock.io;"
      override = true
    }

    content_type_options {
      override = true
    }

    frame_options {
      frame_option = "DENY"
      override = true
    }

    referrer_policy {
      referrer_policy = "same-origin"
      override = true
    }

    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      preload                    = true
      override                   = true
    }

    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }
  }
}

# CloudFront distribution for assets with signed URLs
resource "aws_cloudfront_distribution" "assets" {
  origin {
    domain_name              = "${var.asset_bucket_name}.s3.amazonaws.com"
    origin_id                = "S3-${var.asset_bucket_name}"
    origin_access_control_id = aws_cloudfront_origin_access_control.assets.id
  }

  enabled         = true
  is_ipv6_enabled = true
  comment         = "Assets distribution for ${var.environment}"
  price_class     = "PriceClass_100"
  
  logging_config {
    include_cookies = false
    bucket          = "${var.logging_bucket_name}.s3.amazonaws.com"
    prefix          = "cloudfront/assets/"
  }

  # Signed URL behavior for assets
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3-${var.asset_bucket_name}"

    forwarded_values {
      query_string = true
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy     = "redirect-to-https"
    min_ttl                    = 0
    default_ttl                = 3600
    max_ttl                    = 86400
    compress                   = true
    trusted_key_groups         = [aws_cloudfront_key_group.assets.id]
    
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  web_acl_id = var.waf_web_acl_arn

  viewer_certificate {
    cloudfront_default_certificate = var.acm_certificate_arn == null ? true : false
    acm_certificate_arn            = var.acm_certificate_arn
    ssl_support_method             = var.acm_certificate_arn == null ? null : "sni-only"
    minimum_protocol_version       = var.acm_certificate_arn == null ? "TLSv1" : "TLSv1.2_2021"
  }

  tags = {
    Name        = "Assets Distribution"
    Environment = var.environment
  }
}

# CloudFront key group for signed URLs
resource "aws_cloudfront_public_key" "assets" {
  comment     = "Public key for signed URLs"
  encoded_key = var.cloudfront_public_key
  name        = "assets-public-key-${var.environment}"
}

resource "aws_cloudfront_key_group" "assets" {
  comment = "Key group for asset access"
  items   = [aws_cloudfront_public_key.assets.id]
  name    = "assets-key-group-${var.environment}"
}
