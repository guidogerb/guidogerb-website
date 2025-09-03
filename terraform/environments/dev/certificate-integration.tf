# Certificate integration with CloudFront
# This should be applied after the certificate is validated

module "certificate_integration" {
  source = "../../modules/certificate-integration"
  
  certificate_arn         = module.certificates.certificate_arn
  frontend_distribution_id = module.content_delivery.cloudfront_distribution_id
  assets_distribution_id   = module.content_delivery.assets_distribution_id
}
