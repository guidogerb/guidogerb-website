output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.networking.vpc_id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = module.networking.private_subnet_ids
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = module.networking.public_subnet_ids
}

output "asset_bucket_name" {
  description = "Name of the S3 bucket for assets"
  value       = module.storage.asset_bucket_name
}

output "frontend_bucket_name" {
  description = "Name of the S3 bucket for frontend"
  value       = module.storage.frontend_bucket_name
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution for the frontend"
  value       = module.content_delivery.cloudfront_distribution_id
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = module.content_delivery.cloudfront_domain_name
}

output "database_endpoint" {
  description = "Endpoint of the RDS database"
  value       = module.database.db_endpoint
}

output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = module.compute.ecs_cluster_id
}

output "ecr_repository_urls" {
  description = "URLs of the ECR repositories"
  value       = module.compute.ecr_repository_urls
}

output "cognito_user_pool_id" {
  description = "ID of the Cognito user pool"
  value       = module.identity.cognito_user_pool_id
}

output "cognito_app_client_id" {
  description = "ID of the Cognito app client"
  value       = module.identity.cognito_app_client_id
}

output "forgerock_am_url" {
  description = "URL of the ForgeRock AM instance"
  value       = module.identity.forgerock_am_url
}

output "streaming_endpoint" {
  description = "Endpoint for the streaming service"
  value       = module.streaming.streaming_endpoint
}
