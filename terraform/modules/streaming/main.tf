resource "aws_security_group" "icecast" {
  name        = "icecast-sg-${var.environment}"
  description = "Security group for Icecast streaming server"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP access to Icecast"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = {
    Name        = "Icecast Security Group"
    Environment = var.environment
  }
}

resource "aws_ecs_task_definition" "icecast" {
  family                   = "icecast-radio-${var.environment}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "1024"
  memory                   = "2048"
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn
  
  container_definitions = jsonencode([
    {
      name          = "icecast-radio"
      image         = var.icecast_ecr_repo
      essential     = true
      portMappings  = [
        {
          containerPort = 8000
          hostPort      = 8000
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "ENVIRONMENT"
          value = var.environment
        },
        {
          name  = "HLS_SEGMENT_DURATION"
          value = "10"
        },
        {
          name  = "HLS_PLAYLIST_LENGTH"
          value = "5"
        },
        {
          name  = "HLS_OUTPUT_PATH"
          value = "/var/www/html/streams"
        }
      ]
      secrets = [
        {
          name      = "ICECAST_SOURCE_PASSWORD"
          valueFrom = var.icecast_source_password_arn
        },
        {
          name      = "ICECAST_ADMIN_PASSWORD"
          valueFrom = var.icecast_admin_password_arn
        }
      ]
      mountPoints = [
        {
          sourceVolume  = "music-data"
          containerPath = "/music"
          readOnly      = true
        },
        {
          sourceVolume  = "playlist-data"
          containerPath = "/playlists"
          readOnly      = true
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/icecast-radio-${var.environment}"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "icecast"
        }
      }
    }
  ])
  
  volume {
    name = "music-data"
    
    efs_volume_configuration {
      file_system_id     = aws_efs_file_system.music.id
      root_directory     = "/"
      transit_encryption = "ENABLED"
      authorization_config {
        access_point_id = aws_efs_access_point.music.id
      }
    }
  }
  
  volume {
    name = "playlist-data"
    
    efs_volume_configuration {
      file_system_id     = aws_efs_file_system.playlists.id
      root_directory     = "/"
      transit_encryption = "ENABLED"
      authorization_config {
        access_point_id = aws_efs_access_point.playlists.id
      }
    }
  }
  
  tags = {
    Name        = "Icecast Radio Task Definition"
    Environment = var.environment
  }
}

resource "aws_ecs_service" "icecast" {
  name            = "icecast-radio-service"
  cluster         = var.ecs_cluster_id
  task_definition = aws_ecs_task_definition.icecast.arn
  desired_count   = var.environment == "prod" ? 2 : 1
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = concat([aws_security_group.icecast.id], var.security_group_ids)
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.icecast.arn
    container_name   = "icecast-radio"
    container_port   = 8000
  }
  
  depends_on = [aws_lb_listener.icecast]
  
  tags = {
    Name        = "Icecast Radio Service"
    Environment = var.environment
  }
}

# EFS file systems for music and playlists
resource "aws_efs_file_system" "music" {
  encrypted = true
  
  lifecycle_policy {
    transition_to_ia = "AFTER_30_DAYS"
  }
  
  performance_mode = "generalPurpose"
  throughput_mode  = "bursting"
  
  tags = {
    Name        = "Music Data"
    Environment = var.environment
  }
}

resource "aws_efs_file_system" "playlists" {
  encrypted = true
  
  lifecycle_policy {
    transition_to_ia = "AFTER_30_DAYS"
  }
  
  performance_mode = "generalPurpose"
  throughput_mode  = "bursting"
  
  tags = {
    Name        = "Playlist Data"
    Environment = var.environment
  }
}

resource "aws_efs_access_point" "music" {
  file_system_id = aws_efs_file_system.music.id
  
  posix_user {
    gid = 1000
    uid = 1000
  }
  
  root_directory {
    path = "/music"
    creation_info {
      owner_gid   = 1000
      owner_uid   = 1000
      permissions = "0755"
    }
  }
  
  tags = {
    Name        = "Music Access Point"
    Environment = var.environment
  }
}

resource "aws_efs_access_point" "playlists" {
  file_system_id = aws_efs_file_system.playlists.id
  
  posix_user {
    gid = 1000
    uid = 1000
  }
  
  root_directory {
    path = "/playlists"
    creation_info {
      owner_gid   = 1000
      owner_uid   = 1000
      permissions = "0755"
    }
  }
  
  tags = {
    Name        = "Playlists Access Point"
    Environment = var.environment
  }
}

resource "aws_efs_mount_target" "music" {
  count           = length(var.private_subnet_ids)
  file_system_id  = aws_efs_file_system.music.id
  subnet_id       = var.private_subnet_ids[count.index]
  security_groups = [aws_security_group.efs.id]
}

resource "aws_efs_mount_target" "playlists" {
  count           = length(var.private_subnet_ids)
  file_system_id  = aws_efs_file_system.playlists.id
  subnet_id       = var.private_subnet_ids[count.index]
  security_groups = [aws_security_group.efs.id]
}

resource "aws_security_group" "efs" {
  name        = "efs-sg-${var.environment}"
  description = "Security group for EFS mount targets"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port       = 2049
    to_port         = 2049
    protocol        = "tcp"
    security_groups = concat([aws_security_group.icecast.id], var.security_group_ids)
    description     = "NFS access from ECS tasks"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = {
    Name        = "EFS Security Group"
    Environment = var.environment
  }
}

# Application Load Balancer for Icecast
resource "aws_lb" "icecast" {
  name               = "icecast-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.icecast_alb.id]
  subnets            = var.public_subnet_ids
  
  enable_deletion_protection = var.environment == "prod" ? true : false
  
  access_logs {
    bucket  = var.logging_bucket_name
    prefix  = "icecast-alb"
    enabled = true
  }
  
  tags = {
    Name        = "Icecast ALB"
    Environment = var.environment
  }
}

resource "aws_security_group" "icecast_alb" {
  name        = "icecast-alb-sg-${var.environment}"
  description = "Security group for Icecast ALB"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP access"
  }
  
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
    Name        = "Icecast ALB Security Group"
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "icecast" {
  name     = "icecast-tg-${var.environment}"
  port     = 8000
  protocol = "HTTP"
  vpc_id   = var.vpc_id
  target_type = "ip"
  
  health_check {
    enabled             = true
    interval            = 30
    path                = "/status.xsl"
    port                = "traffic-port"
    protocol            = "HTTP"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    matcher             = "200"
  }
  
  tags = {
    Name        = "Icecast Target Group"
    Environment = var.environment
  }
}

resource "aws_lb_listener" "icecast_http" {
  load_balancer_arn = aws_lb.icecast.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type = "redirect"
    
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "icecast" {
  load_balancer_arn = aws_lb.icecast.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.certificate_arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.icecast.arn
  }
}

# AWS WAF association with ALB
resource "aws_wafv2_web_acl_association" "icecast" {
  resource_arn = aws_lb.icecast.arn
  web_acl_arn  = var.waf_web_acl_arn
}

# CloudWatch log group for Icecast
resource "aws_cloudwatch_log_group" "icecast" {
  name              = "/ecs/icecast-radio-${var.environment}"
  retention_in_days = var.environment == "prod" ? 30 : 7
  
  tags = {
    Name        = "Icecast Radio Logs"
    Environment = var.environment
  }
}
