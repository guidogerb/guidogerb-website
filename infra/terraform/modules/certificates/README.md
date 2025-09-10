# terraform/modules/certificates

Manages ACM certificates for CloudFront (must be in `us-east-1`) and regional services. Placeholder for teams that choose to manage certs via Terraform.

## Inputs (suggested)

- `domain_names` (list)
- `validation_method` (default: DNS)
- `hosted_zone_id` (optional for Route 53 DNS validation)

> If you are using the Phase-1 CloudFormation path, create/validate certificates directly in ACM and reference the ARN in the `edge-site.yaml` parameters.
