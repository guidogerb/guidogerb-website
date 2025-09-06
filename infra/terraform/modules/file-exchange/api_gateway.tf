# API Gateway configuration for File Exchange feature

# HTTP API Gateway with JWT authorization
resource "aws_apigatewayv2_api" "http_api" {
  name          = "file-exchange-api-${var.environment}"
  protocol_type = "HTTP"
  
  cors_configuration {
    allow_origins     = [var.frontend_origin]
    allow_methods     = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers     = ["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key", "X-Amz-Security-Token"]
    expose_headers    = ["Content-Type", "Content-Length", "Content-Disposition"]
    allow_credentials = true
    max_age           = 300
  }
}

# JWT Authorizer for HTTP API Gateway
resource "aws_apigatewayv2_authorizer" "jwt_authorizer" {
  api_id           = aws_apigatewayv2_api.http_api.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "jwt-authorizer-${var.environment}"

  jwt_configuration {
    audience = var.jwt_audience
    issuer   = var.jwt_issuer
  }
}

# API Gateway stage for HTTP API
resource "aws_apigatewayv2_stage" "http_api_stage" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = var.environment
  auto_deploy = true
  
  default_route_settings {
    throttling_burst_limit = 100
    throttling_rate_limit  = 50
  }
  
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      integrationLatency = "$context.integrationLatency"
    })
  }
}

# WebSocket API Gateway
resource "aws_apigatewayv2_api" "websocket_api" {
  name                       = "file-exchange-websocket-api-${var.environment}"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}

# WebSocket API Gateway stage
resource "aws_apigatewayv2_stage" "websocket_api_stage" {
  api_id      = aws_apigatewayv2_api.websocket_api.id
  name        = var.environment
  auto_deploy = true
  
  default_route_settings {
    throttling_burst_limit = 100
    throttling_rate_limit  = 50
  }
  
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.websocket_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      connectionId   = "$context.connectionId"
      integrationLatency = "$context.integrationLatency"
    })
  }
}

# CloudWatch log group for HTTP API Gateway
resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/apigateway/${aws_apigatewayv2_api.http_api.name}"
  retention_in_days = 7
}

# CloudWatch log group for WebSocket API Gateway
resource "aws_cloudwatch_log_group" "websocket_logs" {
  name              = "/aws/apigateway/${aws_apigatewayv2_api.websocket_api.name}"
  retention_in_days = 7
}

# WebSocket API Gateway default routes
resource "aws_apigatewayv2_route" "connect_route" {
  api_id    = aws_apigatewayv2_api.websocket_api.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.connect_integration.id}"
}

resource "aws_apigatewayv2_route" "disconnect_route" {
  api_id    = aws_apigatewayv2_api.websocket_api.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.disconnect_integration.id}"
}

resource "aws_apigatewayv2_route" "default_route" {
  api_id    = aws_apigatewayv2_api.websocket_api.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.default_integration.id}"
}

# File operation routes for HTTP API Gateway
resource "aws_apigatewayv2_route" "upload_route" {
  api_id             = aws_apigatewayv2_api.http_api.id
  route_key          = "POST /upload"
  target             = "integrations/${aws_apigatewayv2_integration.upload_integration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt_authorizer.id
}

resource "aws_apigatewayv2_route" "list_files_route" {
  api_id             = aws_apigatewayv2_api.http_api.id
  route_key          = "GET /files"
  target             = "integrations/${aws_apigatewayv2_integration.list_files_integration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt_authorizer.id
}

resource "aws_apigatewayv2_route" "download_route" {
  api_id             = aws_apigatewayv2_api.http_api.id
  route_key          = "GET /files/{fileId}"
  target             = "integrations/${aws_apigatewayv2_integration.download_integration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt_authorizer.id
}

resource "aws_apigatewayv2_route" "delete_file_route" {
  api_id             = aws_apigatewayv2_api.http_api.id
  route_key          = "DELETE /files/{fileId}"
  target             = "integrations/${aws_apigatewayv2_integration.delete_file_integration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt_authorizer.id
}

# Digital asset purchase routes for HTTP API Gateway
resource "aws_apigatewayv2_route" "list_purchases_route" {
  api_id             = aws_apigatewayv2_api.http_api.id
  route_key          = "GET /purchases"
  target             = "integrations/${aws_apigatewayv2_integration.list_purchases_integration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt_authorizer.id
}

resource "aws_apigatewayv2_route" "download_purchase_route" {
  api_id             = aws_apigatewayv2_api.http_api.id
  route_key          = "GET /purchases/{purchaseId}"
  target             = "integrations/${aws_apigatewayv2_integration.download_purchase_integration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt_authorizer.id
}

# Hello World test route (no auth required)
resource "aws_apigatewayv2_route" "hello_world_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /hello"
  target    = "integrations/${aws_apigatewayv2_integration.hello_world_integration.id}"
}

# Admin routes for HTTP API Gateway
resource "aws_apigatewayv2_route" "admin_list_users_route" {
  api_id             = aws_apigatewayv2_api.http_api.id
  route_key          = "GET /admin/users"
  target             = "integrations/${aws_apigatewayv2_integration.admin_list_users_integration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt_authorizer.id
}

resource "aws_apigatewayv2_route" "admin_list_user_files_route" {
  api_id             = aws_apigatewayv2_api.http_api.id
  route_key          = "GET /admin/users/{userId}/files"
  target             = "integrations/${aws_apigatewayv2_integration.admin_list_user_files_integration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt_authorizer.id
}

resource "aws_apigatewayv2_route" "admin_update_file_status_route" {
  api_id             = aws_apigatewayv2_api.http_api.id
  route_key          = "PUT /admin/files/{fileId}/status"
  target             = "integrations/${aws_apigatewayv2_integration.admin_update_file_status_integration.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt_authorizer.id
}
