# SSL Certificate Management with AWS ACM

This module creates and manages SSL certificates for the Guido Gerb Publishing domain using AWS Certificate Manager (ACM) with DNS validation.

## Features

- Creates a wildcard SSL certificate (`*.guidogerbpublishing.com`) that covers all subdomains
- Uses DNS validation through Route 53 for automated certificate issuance and renewal
- Creates DNS records for the main domain and required subdomains
- Integrates with CloudFront distributions to enable HTTPS

## Implementation Approach

The certificate setup follows a two-phase approach to avoid circular dependencies:

### Phase 1: Certificate Creation and Validation

1. Create the ACM certificate for the domain and wildcard subdomains
2. Create DNS validation records in Route 53
3. Wait for certificate validation to complete (this can take 5-30 minutes)

### Phase 2: Certificate Integration

After the certificate is validated, it can be integrated with CloudFront distributions by:

1. Updating the CloudFront distributions to use the validated certificate
2. Setting proper security policies (TLSv1.2_2021)
3. Configuring SNI support for the certificate

## Usage

### Prerequisites

- Domain must be managed in AWS Route 53
- Route 53 Hosted Zone ID must be provided

### Module Configuration

```hcl
module "certificates" {
  source = "../../modules/certificates"
  
  environment                 = "dev"
  hosted_zone_id              = var.route53_hosted_zone_id
  cloudfront_domain_name      = module.content_delivery.cloudfront_domain_name
  api_cloudfront_domain_name  = module.content_delivery.cloudfront_domain_name
  media_cloudfront_domain_name = module.streaming.streaming_endpoint
}
```

### Variables

| Name | Description | Type | Default |
|------|-------------|------|---------|
| environment | Environment name (e.g., dev, prod) | string | - |
| hosted_zone_id | ID of the Route 53 hosted zone | string | - |
| cloudfront_domain_name | Domain name of the CloudFront distribution for the main website | string | - |
| api_cloudfront_domain_name | Domain name of the CloudFront distribution for the API | string | - |
| media_cloudfront_domain_name | Domain name of the CloudFront distribution for media streaming | string | - |
| cloudfront_hosted_zone_id | Hosted zone ID for CloudFront | string | Z2FDTNDATAQYW2 |

### Outputs

| Name | Description |
|------|-------------|
| certificate_arn | ARN of the validated ACM certificate |
| certificate_domain_name | Main domain name for the certificate |
| certificate_validation_domains | List of domains validated with this certificate |

## Security Considerations

- Certificate private keys are managed by AWS and never exposed
- AWS ACM automatically handles certificate renewal before expiration
- DNS validation provides a secure and automated method for proving domain ownership
