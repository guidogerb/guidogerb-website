resource "aws_db_subnet_group" "main" {
  name       = "asset-platform-db-subnet-group-${var.environment}"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name        = "DB Subnet Group"
    Environment = var.environment
  }
}

resource "aws_security_group" "db" {
  name        = "asset-platform-db-sg-${var.environment}"
  description = "Security group for RDS database"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = var.allowed_security_group_ids
    description     = "Allow PostgreSQL access from application servers"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "DB Security Group"
    Environment = var.environment
  }
}

# Use AWS Secrets Manager to store database credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "asset-platform-db-credentials-${var.environment}"
  description = "Database credentials for the digital asset platform"

  tags = {
    Name        = "DB Credentials"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password
  })
}

resource "aws_db_parameter_group" "main" {
  name   = "asset-platform-pg-${var.environment}"
  family = "postgres13"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  tags = {
    Name        = "PostgreSQL Parameter Group"
    Environment = var.environment
  }
}

resource "aws_db_instance" "main" {
  identifier             = "asset-platform-db-${var.environment}"
  engine                 = "postgres"
  engine_version         = "13.7"
  instance_class         = var.db_instance_class
  allocated_storage      = var.db_allocated_storage
  storage_type           = "gp2"
  storage_encrypted      = true
  db_name                = "assetplatform"
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  parameter_group_name   = aws_db_parameter_group.main.name
  publicly_accessible    = false
  skip_final_snapshot    = var.environment == "dev" ? true : false
  final_snapshot_identifier = var.environment == "dev" ? null : "asset-platform-db-${var.environment}-final-snapshot"
  backup_retention_period = var.environment == "dev" ? 1 : 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"
  multi_az                = var.environment == "dev" ? false : true
  deletion_protection     = var.environment == "dev" ? false : true
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  auto_minor_version_upgrade      = true

  tags = {
    Name        = "Asset Platform Database"
    Environment = var.environment
  }
}

# Create a DynamoDB table for document metadata
resource "aws_dynamodb_table" "asset_metadata" {
  name           = "asset-metadata-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "AssetId"
  range_key      = "Version"

  attribute {
    name = "AssetId"
    type = "S"
  }

  attribute {
    name = "Version"
    type = "N"
  }

  attribute {
    name = "AssetType"
    type = "S"
  }

  attribute {
    name = "OwnerId"
    type = "S"
  }

  global_secondary_index {
    name               = "AssetTypeIndex"
    hash_key           = "AssetType"
    range_key          = "AssetId"
    projection_type    = "ALL"
  }

  global_secondary_index {
    name               = "OwnerIndex"
    hash_key           = "OwnerId"
    range_key          = "AssetId"
    projection_type    = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name        = "Asset Metadata"
    Environment = var.environment
  }
}

# Create a DynamoDB table for rights management
resource "aws_dynamodb_table" "rights_management" {
  name           = "rights-management-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "RightId"
  range_key      = "AssetId"

  attribute {
    name = "RightId"
    type = "S"
  }

  attribute {
    name = "AssetId"
    type = "S"
  }

  attribute {
    name = "UserId"
    type = "S"
  }

  attribute {
    name = "ExpirationDate"
    type = "S"
  }

  global_secondary_index {
    name               = "UserRightsIndex"
    hash_key           = "UserId"
    range_key          = "ExpirationDate"
    projection_type    = "ALL"
  }

  global_secondary_index {
    name               = "AssetRightsIndex"
    hash_key           = "AssetId"
    range_key          = "ExpirationDate"
    projection_type    = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name        = "Rights Management"
    Environment = var.environment
  }
}
