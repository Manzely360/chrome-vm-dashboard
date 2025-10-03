# Chrome VM Dashboard - Terraform Variables

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "instance_type" {
  description = "EC2 instance type for Chrome VMs"
  type        = string
  default     = "t3.medium"
}

variable "volume_size" {
  description = "EBS volume size in GB"
  type        = number
  default     = 50
}

variable "min_instances" {
  description = "Minimum number of instances"
  type        = number
  default     = 1
}

variable "max_instances" {
  description = "Maximum number of instances"
  type        = number
  default     = 10
}

variable "desired_instances" {
  description = "Desired number of instances"
  type        = number
  default     = 3
}

variable "ssh_public_key" {
  description = "SSH public key for EC2 instances"
  type        = string
  sensitive   = true
}

variable "dashboard_url" {
  description = "URL of the dashboard backend"
  type        = string
  default     = "https://your-dashboard.com"
}

variable "domain_name" {
  description = "Domain name for Cloudflare tunnels"
  type        = string
  default     = "your-domain.com"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "chrome-vm-dashboard"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
