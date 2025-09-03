# This module connects the ACM certificate to CloudFront distributions
# It's used as a separate stage to avoid circular dependencies

# Apply certificate to CloudFront distributions via a custom resource
# Note: AWS does not provide a specific resource for updating just the certificate
# of an existing CloudFront distribution, so we include this as guidance
# for updating the CloudFront distributions with the certificate in a 
# second Terraform apply after the certificate is validated

locals {
  is_certificate_valid = var.certificate_arn != null && var.certificate_arn != ""
}

# This is a placeholder to show how the connection would work
# In practice, you would need to update the CloudFront distributions 
# in the content-delivery module or apply the changes in a separate step
output "integration_instructions" {
  value = local.is_certificate_valid ? "Certificate is validated. Update the content_delivery module to use acm_certificate_arn=${var.certificate_arn}" : "Certificate is not yet validated. Wait for validation to complete before connecting to CloudFront."
}
