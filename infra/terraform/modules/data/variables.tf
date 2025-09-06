variable "domain_name" {
  description = "Domain name for the application (e.g., example.com)"
  type        = string
  default     = ""
}

variable "hosted_zone_name" {
  description = "Name of the Route 53 hosted zone (if different from domain_name)"
  type        = string
  default     = ""
}
