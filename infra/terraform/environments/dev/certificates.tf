# SSL Certificate and DNS Configuration for dev environment
module "certificates" {
  source = "../../modules/certificates"
  
  environment                 = "dev"
  hosted_zone_id              = var.route53_hosted_zone_id
  cloudfront_domain_name      = module.content_delivery.cloudfront_domain_name
  api_cloudfront_domain_name  = module.content_delivery.cloudfront_domain_name  # Same distribution in dev
  media_cloudfront_domain_name = module.streaming.streaming_endpoint
}
