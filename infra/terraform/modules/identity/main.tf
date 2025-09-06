# AWS Cognito setup for user authentication
resource "aws_cognito_user_pool" "main" {
  name = var.cognito_user_pool_name
  
  username_attributes      = ["email"]
  auto_verify_attributes   = ["email"]
  
  password_policy {
    minimum_length    = 12
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = true
  }
  
  # Lambda triggers for custom workflows
  lambda_config {
    pre_sign_up       = var.pre_sign_up_lambda_arn
    post_confirmation = var.post_confirmation_lambda_arn
    custom_message    = var.custom_message_lambda_arn
  }
  
  schema {
    name                = "given_name"
    attribute_data_type = "String"
    mutable             = true
    required            = true
  }
  
  schema {
    name                = "family_name"
    attribute_data_type = "String"
    mutable             = true
    required            = true
  }
  
  schema {
    name                = "subscription_level"
    attribute_data_type = "String"
    mutable             = true
    required            = false
    string_attribute_constraints {
      min_length = 1
      max_length = 50
    }
  }
  
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }
  
  tags = {
    Name        = "Digital Asset Platform User Pool"
    Environment = var.environment
  }
}

resource "aws_cognito_user_pool_client" "main" {
  name                                 = "digital-asset-platform-client-${var.environment}"
  user_pool_id                         = aws_cognito_user_pool.main.id
  generate_secret                      = true
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  callback_urls                        = var.cognito_callback_urls
  logout_urls                          = var.cognito_logout_urls
  supported_identity_providers         = ["COGNITO"]
  refresh_token_validity               = 30
  access_token_validity                = 1
  id_token_validity                    = 1
  
  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }
  
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = "digital-asset-platform-${var.environment}"
  user_pool_id = aws_cognito_user_pool.main.id
}

# ForgeRock AM ECS deployment
resource "aws_security_group" "forgerock_am" {
  name        = "forgerock-am-sg-${var.environment}"
  description = "Security group for ForgeRock AM"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP access to ForgeRock AM"
  }
  
  ingress {
    from_port   = 8443
    to_port     = 8443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS access to ForgeRock AM"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = {
    Name        = "ForgeRock AM Security Group"
    Environment = var.environment
  }
}

resource "aws_ecs_task_definition" "forgerock_am" {
  family                   = "forgerock-am-${var.environment}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "1024"
  memory                   = "2048"
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn
  
  container_definitions = jsonencode([
    {
      name          = "forgerock-am"
      image         = var.forgerock_ecr_repo
      essential     = true
      portMappings  = [
        {
          containerPort = 8080
          hostPort      = 8080
          protocol      = "tcp"
        },
        {
          containerPort = 8443
          hostPort      = 8443
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "ENVIRONMENT"
          value = var.environment
        },
        {
          name  = "AM_STORES_CTS_SERVERS"
          value = var.forgerock_cts_store_url
        },
        {
          name  = "AM_STORES_USER_SERVERS"
          value = var.forgerock_user_store_url
        }
      ]
      secrets = [
        {
          name      = "AM_ADMIN_PWD"
          valueFrom = var.forgerock_admin_password_arn
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/forgerock-am-${var.environment}"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "forgerock"
        }
      }
    }
  ])
  
  tags = {
    Name        = "ForgeRock AM Task Definition"
    Environment = var.environment
  }
}

resource "aws_ecs_service" "forgerock_am" {
  name            = "forgerock-am-service"
  cluster         = var.ecs_cluster_id
  task_definition = aws_ecs_task_definition.forgerock_am.arn
  desired_count   = var.environment == "prod" ? 2 : 1
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = concat([aws_security_group.forgerock_am.id], var.security_group_ids)
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.forgerock_am.arn
    container_name   = "forgerock-am"
    container_port   = 8443
  }
  
  depends_on = [aws_lb_listener.forgerock_am]
  
  tags = {
    Name        = "ForgeRock AM Service"
    Environment = var.environment
  }
}

# Application Load Balancer for ForgeRock AM
resource "aws_lb" "forgerock_am" {
  name               = "forgerock-am-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.forgerock_am_alb.id]
  subnets            = var.public_subnet_ids
  
  enable_deletion_protection = var.environment == "prod" ? true : false
  
  access_logs {
    bucket  = var.logging_bucket_name
    prefix  = "forgerock-am-alb"
    enabled = true
  }
  
  tags = {
    Name        = "ForgeRock AM ALB"
    Environment = var.environment
  }
}

resource "aws_security_group" "forgerock_am_alb" {
  name        = "forgerock-am-alb-sg-${var.environment}"
  description = "Security group for ForgeRock AM ALB"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS access"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = {
    Name        = "ForgeRock AM ALB Security Group"
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "forgerock_am" {
  name     = "forgerock-am-tg-${var.environment}"
  port     = 8443
  protocol = "HTTPS"
  vpc_id   = var.vpc_id
  target_type = "ip"
  
  health_check {
    enabled             = true
    interval            = 30
    path                = "/am/isAlive.jsp"
    port                = "traffic-port"
    protocol            = "HTTPS"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    matcher             = "200"
  }
  
  tags = {
    Name        = "ForgeRock AM Target Group"
    Environment = var.environment
  }
}

resource "aws_lb_listener" "forgerock_am" {
  load_balancer_arn = aws_lb.forgerock_am.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.certificate_arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.forgerock_am.arn
  }
}

# AWS WAF association with ALB
resource "aws_wafv2_web_acl_association" "forgerock_am" {
  resource_arn = aws_lb.forgerock_am.arn
  web_acl_arn  = var.waf_web_acl_arn
}

# CloudWatch log group for ForgeRock AM
resource "aws_cloudwatch_log_group" "forgerock_am" {
  name              = "/ecs/forgerock-am-${var.environment}"
  retention_in_days = var.environment == "prod" ? 30 : 7
  
  tags = {
    Name        = "ForgeRock AM Logs"
    Environment = var.environment
  }
}
