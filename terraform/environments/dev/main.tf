terraform {
  required_version = ">= 1.0.0"
  
  backend "s3" {
    bucket         = "ggp-store-website-terraform-state"
    key            = "terraform/dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = "dev"
      Project     = "DigitalAssetPlatform"
      ManagedBy   = "Terraform"
    }
  }
}

# Include shared data lookups
module "data" {
  source = "../../modules/data"
}

# VPC and networking
module "networking" {
  source = "../../modules/networking"
  
  environment        = "dev"
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  private_subnets    = var.private_subnets
  public_subnets     = var.public_subnets
}

# Security (IAM, WAF, etc.)
module "security" {
  source = "../../modules/security"
  
  environment = "dev"
  vpc_id      = module.networking.vpc_id
}

# Storage (S3 buckets)
module "storage" {
  source = "../../modules/storage"
  
  environment                = "dev"
  asset_bucket_name          = var.asset_bucket_name
  frontend_bucket_name       = var.frontend_bucket_name
  logging_bucket_name        = var.logging_bucket_name
  sam_artifacts_bucket_name  = var.sam_artifacts_bucket_name
}

# Database (RDS, DynamoDB)
module "database" {
  source = "../../modules/database"
  
  environment         = "dev"
  vpc_id              = module.networking.vpc_id
  private_subnet_ids  = module.networking.private_subnet_ids
  db_username         = var.db_username
  db_password         = var.db_password
  db_instance_class   = var.db_instance_class
  db_allocated_storage = var.db_allocated_storage
}

# Compute (ECS, Lambda)
module "compute" {
  source = "../../modules/compute"
  
  environment         = "dev"
  vpc_id              = module.networking.vpc_id
  private_subnet_ids  = module.networking.private_subnet_ids
  public_subnet_ids   = module.networking.public_subnet_ids
  ecs_cluster_name    = var.ecs_cluster_name
  ecr_repository_names = var.ecr_repository_names
  lambda_execution_role_arn = module.security.lambda_execution_role_arn
}

# Content Delivery (CloudFront)
module "content_delivery" {
  source = "../../modules/content-delivery"
  
  environment            = "dev"
  frontend_bucket_name   = module.storage.frontend_bucket_name
  frontend_bucket_arn    = module.storage.frontend_bucket_arn
  asset_bucket_name      = module.storage.asset_bucket_name
  asset_bucket_arn       = module.storage.asset_bucket_arn
  logging_bucket_name    = module.storage.logging_bucket_name
  waf_web_acl_arn        = module.security.waf_web_acl_arn
}

# Streaming infrastructure (ECS services, S3)
module "streaming" {
  source = "../../modules/streaming"
  
  environment        = "dev"
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  public_subnet_ids  = module.networking.public_subnet_ids
  ecs_cluster_id     = module.compute.ecs_cluster_id
  icecast_ecr_repo   = module.compute.ecr_repository_urls["icecast-radio"]
  waf_web_acl_arn    = module.security.waf_web_acl_arn
  security_group_ids = [module.networking.default_security_group_id]
}

# Identity (ForgeRock AM, Cognito)
module "identity" {
  source = "../../modules/identity"
  
  environment        = "dev"
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  public_subnet_ids  = module.networking.public_subnet_ids
  ecs_cluster_id     = module.compute.ecs_cluster_id
  forgerock_ecr_repo = module.compute.ecr_repository_urls["forgerock-am"]
  security_group_ids = [module.networking.default_security_group_id]
  cognito_user_pool_name = var.cognito_user_pool_name
}

# SSL Certificates and DNS Configuration
module "certificates" {
  source = "../../modules/certificates"
  
  environment            = "dev"
  hosted_zone_id         = var.route53_hosted_zone_id
  cloudfront_domain_name = module.content_delivery.cloudfront_domain_name
  api_cloudfront_domain_name = module.content_delivery.cloudfront_domain_name
  media_cloudfront_domain_name = module.streaming.streaming_endpoint
}
