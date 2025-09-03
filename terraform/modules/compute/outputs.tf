output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecr_repository_urls" {
  description = "URLs of the ECR repositories"
  value       = { for name, repo in aws_ecr_repository.repos : name => repo.repository_url }
}

output "ecr_repository_arns" {
  description = "ARNs of the ECR repositories"
  value       = { for name, repo in aws_ecr_repository.repos : name => repo.arn }
}

output "lambda_security_group_id" {
  description = "ID of the security group for Lambda functions"
  value       = aws_security_group.lambda.id
}

output "asset_processor_function_name" {
  description = "Name of the asset processor Lambda function"
  value       = aws_lambda_function.asset_processor.function_name
}

output "asset_processor_function_arn" {
  description = "ARN of the asset processor Lambda function"
  value       = aws_lambda_function.asset_processor.arn
}

output "url_signer_function_name" {
  description = "Name of the URL signer Lambda function"
  value       = aws_lambda_function.url_signer.function_name
}

output "url_signer_function_arn" {
  description = "ARN of the URL signer Lambda function"
  value       = aws_lambda_function.url_signer.arn
}

output "metadata_handler_function_name" {
  description = "Name of the metadata handler Lambda function"
  value       = aws_lambda_function.metadata_handler.function_name
}

output "metadata_handler_function_arn" {
  description = "ARN of the metadata handler Lambda function"
  value       = aws_lambda_function.metadata_handler.arn
}
