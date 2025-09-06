output "file_exchange_bucket_name" {
  description = "Name of the S3 bucket for file exchange"
  value       = aws_s3_bucket.file_exchange.id
}

output "file_exchange_bucket_arn" {
  description = "ARN of the S3 bucket for file exchange"
  value       = aws_s3_bucket.file_exchange.arn
}

output "http_api_endpoint" {
  description = "Endpoint URL of the File Exchange HTTP API"
  value       = "${aws_apigatewayv2_stage.http_api_stage.invoke_url}"
}

output "websocket_api_endpoint" {
  description = "Endpoint URL of the File Exchange WebSocket API"
  value       = "${aws_apigatewayv2_stage.websocket_api_stage.invoke_url}"
}

output "upload_handler_function_name" {
  description = "Name of the upload handler Lambda function"
  value       = aws_lambda_function.upload_handler.function_name
}

output "moderation_handler_function_name" {
  description = "Name of the moderation handler Lambda function"
  value       = aws_lambda_function.moderation_handler.function_name
}

output "hello_world_function_name" {
  description = "Name of the hello world Lambda function"
  value       = aws_lambda_function.hello_world.function_name
}

output "dynamodb_file_metadata_table_name" {
  description = "Name of the DynamoDB table for file metadata"
  value       = aws_dynamodb_table.file_metadata.name
}

output "dynamodb_user_purchases_table_name" {
  description = "Name of the DynamoDB table for user purchases"
  value       = aws_dynamodb_table.user_purchases.name
}

output "dynamodb_websocket_connections_table_name" {
  description = "Name of the DynamoDB table for WebSocket connections"
  value       = aws_dynamodb_table.websocket_connections.name
}
