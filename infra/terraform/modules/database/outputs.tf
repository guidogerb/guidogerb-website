output "db_endpoint" {
  description = "Endpoint of the RDS database"
  value       = aws_db_instance.main.endpoint
}

output "db_name" {
  description = "Name of the database"
  value       = aws_db_instance.main.db_name
}

output "db_security_group_id" {
  description = "ID of the security group for the database"
  value       = aws_security_group.db.id
}

output "db_credentials_secret_arn" {
  description = "ARN of the Secrets Manager secret containing database credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "asset_metadata_table_name" {
  description = "Name of the DynamoDB table for asset metadata"
  value       = aws_dynamodb_table.asset_metadata.name
}

output "asset_metadata_table_arn" {
  description = "ARN of the DynamoDB table for asset metadata"
  value       = aws_dynamodb_table.asset_metadata.arn
}

output "rights_management_table_name" {
  description = "Name of the DynamoDB table for rights management"
  value       = aws_dynamodb_table.rights_management.name
}

output "rights_management_table_arn" {
  description = "ARN of the DynamoDB table for rights management"
  value       = aws_dynamodb_table.rights_management.arn
}
