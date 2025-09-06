variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC where identity resources will be deployed"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs where identity resources will be deployed"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs where load balancers will be deployed"
  type        = list(string)
}

variable "ecs_cluster_id" {
  description = "ID of the ECS cluster where ForgeRock AM will be deployed"
  type        = string
}

variable "forgerock_ecr_repo" {
  description = "URL of the ECR repository for ForgeRock AM"
  type        = string
}

variable "security_group_ids" {
  description = "List of additional security group IDs to attach to ForgeRock AM"
  type        = list(string)
  default     = []
}

variable "cognito_user_pool_name" {
  description = "Name of the Cognito user pool"
  type        = string
}

variable "cognito_callback_urls" {
  description = "List of allowed callback URLs for Cognito"
  type        = list(string)
  default     = ["https://localhost:3000/auth/callback"]
}

variable "cognito_logout_urls" {
  description = "List of allowed logout URLs for Cognito"
  type        = list(string)
  default     = ["https://localhost:3000/"]
}

variable "pre_sign_up_lambda_arn" {
  description = "ARN of the Lambda function for Cognito pre-sign-up trigger"
  type        = string
  default     = null
}

variable "post_confirmation_lambda_arn" {
  description = "ARN of the Lambda function for Cognito post-confirmation trigger"
  type        = string
  default     = null
}

variable "custom_message_lambda_arn" {
  description = "ARN of the Lambda function for Cognito custom message trigger"
  type        = string
  default     = null
}

variable "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  type        = string
}

variable "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  type        = string
}

variable "forgerock_cts_store_url" {
  description = "URL of the ForgeRock CTS store"
  type        = string
  default     = "localhost:6379"
}

variable "forgerock_user_store_url" {
  description = "URL of the ForgeRock user store"
  type        = string
  default     = "localhost:1389"
}

variable "forgerock_admin_password_arn" {
  description = "ARN of the Secrets Manager secret containing ForgeRock admin password"
  type        = string
  default     = null
}

variable "aws_region" {
  description = "AWS region where resources will be deployed"
  type        = string
  default     = "us-east-1"
}

variable "certificate_arn" {
  description = "ARN of the ACM certificate for ForgeRock AM HTTPS"
  type        = string
}

variable "waf_web_acl_arn" {
  description = "ARN of the WAF web ACL to associate with the ForgeRock AM ALB"
  type        = string
}

variable "logging_bucket_name" {
  description = "Name of the S3 bucket for ALB access logs"
  type        = string
}
