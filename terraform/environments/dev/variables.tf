variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones to use"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "private_subnets" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnets" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "asset_bucket_name" {
  description = "Name of the S3 bucket for storing digital assets"
  type        = string
  default     = "digital-asset-platform-assets-dev"
}

variable "frontend_bucket_name" {
  description = "Name of the S3 bucket for frontend hosting"
  type        = string
  default     = "digital-asset-platform-frontend-dev"
}

variable "logging_bucket_name" {
  description = "Name of the S3 bucket for access logs"
  type        = string
  default     = "digital-asset-platform-logs-dev"
}

variable "sam_artifacts_bucket_name" {
  description = "Name of the S3 bucket for SAM artifacts"
  type        = string
  default     = "digital-asset-platform-sam-artifacts-dev"
}

variable "db_username" {
  description = "Username for the database"
  type        = string
  default     = "dbuser"
  sensitive   = true
}

variable "db_password" {
  description = "Password for the database (should be stored in SSM Parameter Store)"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "Instance class for the RDS database"
  type        = string
  default     = "db.t3.small"
}

variable "db_allocated_storage" {
  description = "Allocated storage for the RDS database in GB"
  type        = number
  default     = 20
}

variable "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
  default     = "asset-manager-cluster-dev"
}

variable "ecr_repository_names" {
  description = "Names of ECR repositories to create"
  type        = list(string)
  default     = ["forgerock-am", "icecast-radio"]
}

variable "cognito_user_pool_name" {
  description = "Name of the Cognito user pool"
  type        = string
  default     = "digital-asset-platform-users-dev"
}

variable "route53_hosted_zone_id" {
  description = "ID of the Route 53 hosted zone for guidogerbpublishing.com"
  type        = string
}
