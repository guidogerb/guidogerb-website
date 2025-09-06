output "streaming_endpoint" {
  description = "URL of the Icecast streaming service"
  value       = "https://${aws_lb.icecast.dns_name}"
}

output "icecast_security_group_id" {
  description = "ID of the security group for Icecast"
  value       = aws_security_group.icecast.id
}

output "icecast_alb_security_group_id" {
  description = "ID of the security group for Icecast ALB"
  value       = aws_security_group.icecast_alb.id
}

output "icecast_task_definition_arn" {
  description = "ARN of the ECS task definition for Icecast"
  value       = aws_ecs_task_definition.icecast.arn
}

output "icecast_service_name" {
  description = "Name of the ECS service for Icecast"
  value       = aws_ecs_service.icecast.name
}

output "icecast_alb_arn" {
  description = "ARN of the ALB for Icecast"
  value       = aws_lb.icecast.arn
}

output "music_efs_id" {
  description = "ID of the EFS file system for music"
  value       = aws_efs_file_system.music.id
}

output "playlists_efs_id" {
  description = "ID of the EFS file system for playlists"
  value       = aws_efs_file_system.playlists.id
}

output "efs_security_group_id" {
  description = "ID of the security group for EFS"
  value       = aws_security_group.efs.id
}
