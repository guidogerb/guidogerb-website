variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC where streaming resources will be deployed"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs where streaming resources will be deployed"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs where load balancers will be deployed"
  type        = list(string)
}

variable "ecs_cluster_id" {
  description = "ID of the ECS cluster where Icecast will be deployed"
  type        = string
}

variable "icecast_ecr_repo" {
  description = "URL of the ECR repository for Icecast"
  type        = string
}

variable "security_group_ids" {
  description = "List of additional security group IDs to attach to Icecast"
  type        = list(string)
  default     = []
}

variable "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  type        = string
}

variable "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  type        = string
}

variable "icecast_source_password_arn" {
  description = "ARN of the Secrets Manager secret containing Icecast source password"
  type        = string
  default     = null
}

variable "icecast_admin_password_arn" {
  description = "ARN of the Secrets Manager secret containing Icecast admin password"
  type        = string
  default     = null
}

variable "aws_region" {
  description = "AWS region where resources will be deployed"
  type        = string
  default     = "us-east-1"
}

variable "certificate_arn" {
  description = "ARN of the ACM certificate for Icecast HTTPS"
  type        = string
}

variable "waf_web_acl_arn" {
  description = "ARN of the WAF web ACL to associate with the Icecast ALB"
  type        = string
}

variable "logging_bucket_name" {
  description = "Name of the S3 bucket for ALB access logs"
  type        = string
}
