output "cognito_user_pool_id" {
  description = "ID of the Cognito user pool"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_user_pool_arn" {
  description = "ARN of the Cognito user pool"
  value       = aws_cognito_user_pool.main.arn
}

output "cognito_app_client_id" {
  description = "ID of the Cognito app client"
  value       = aws_cognito_user_pool_client.main.id
}

output "cognito_domain" {
  description = "Domain for the Cognito hosted UI"
  value       = aws_cognito_user_pool_domain.main.domain
}

output "forgerock_am_url" {
  description = "URL of the ForgeRock AM load balancer"
  value       = "https://${aws_lb.forgerock_am.dns_name}/am"
}

output "forgerock_am_security_group_id" {
  description = "ID of the security group for ForgeRock AM"
  value       = aws_security_group.forgerock_am.id
}

output "forgerock_am_alb_security_group_id" {
  description = "ID of the security group for ForgeRock AM ALB"
  value       = aws_security_group.forgerock_am_alb.id
}

output "forgerock_am_task_definition_arn" {
  description = "ARN of the ECS task definition for ForgeRock AM"
  value       = aws_ecs_task_definition.forgerock_am.arn
}

output "forgerock_am_service_name" {
  description = "Name of the ECS service for ForgeRock AM"
  value       = aws_ecs_service.forgerock_am.name
}

output "forgerock_am_alb_arn" {
  description = "ARN of the ALB for ForgeRock AM"
  value       = aws_lb.forgerock_am.arn
}
