# DynamoDB tables for the File Exchange feature

# Table to store WebSocket connections
resource "aws_dynamodb_table" "websocket_connections" {
  name           = "file-exchange-connections-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "connection_id"
  
  attribute {
    name = "connection_id"
    type = "S"
  }
  
  attribute {
    name = "user_id"
    type = "S"
  }
  
  global_secondary_index {
    name               = "UserIdIndex"
    hash_key           = "user_id"
    projection_type    = "ALL"
  }
  
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
  
  tags = {
    Name        = "File Exchange WebSocket Connections"
    Environment = var.environment
  }
}

# Table to store user purchases for digital asset distribution
resource "aws_dynamodb_table" "user_purchases" {
  name           = "file-exchange-purchases-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "purchase_id"
  
  attribute {
    name = "purchase_id"
    type = "S"
  }
  
  attribute {
    name = "user_id"
    type = "S"
  }
  
  attribute {
    name = "asset_id"
    type = "S"
  }
  
  global_secondary_index {
    name               = "UserIdIndex"
    hash_key           = "user_id"
    projection_type    = "ALL"
  }
  
  global_secondary_index {
    name               = "AssetIdIndex"
    hash_key           = "asset_id"
    projection_type    = "ALL"
  }
  
  tags = {
    Name        = "File Exchange User Purchases"
    Environment = var.environment
  }
}

# Table to store file metadata and status
resource "aws_dynamodb_table" "file_metadata" {
  name           = "file-exchange-metadata-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "file_id"
  
  attribute {
    name = "file_id"
    type = "S"
  }
  
  attribute {
    name = "user_id"
    type = "S"
  }
  
  attribute {
    name = "status"
    type = "S"
  }
  
  global_secondary_index {
    name               = "UserIdIndex"
    hash_key           = "user_id"
    projection_type    = "ALL"
  }
  
  global_secondary_index {
    name               = "StatusIndex"
    hash_key           = "status"
    projection_type    = "ALL"
  }
  
  tags = {
    Name        = "File Exchange Metadata"
    Environment = var.environment
  }
}
