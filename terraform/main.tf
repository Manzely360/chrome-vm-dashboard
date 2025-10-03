# Chrome VM Dashboard - Terraform Configuration
# This creates AWS infrastructure for the browser farm

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# VPC and Networking
resource "aws_vpc" "chrome_vm_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "chrome-vm-vpc"
  }
}

resource "aws_internet_gateway" "chrome_vm_igw" {
  vpc_id = aws_vpc.chrome_vm_vpc.id

  tags = {
    Name = "chrome-vm-igw"
  }
}

resource "aws_subnet" "chrome_vm_subnet" {
  count = length(data.aws_availability_zones.available.names)

  vpc_id                  = aws_vpc.chrome_vm_vpc.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "chrome-vm-subnet-${count.index + 1}"
  }
}

resource "aws_route_table" "chrome_vm_rt" {
  vpc_id = aws_vpc.chrome_vm_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.chrome_vm_igw.id
  }

  tags = {
    Name = "chrome-vm-rt"
  }
}

resource "aws_route_table_association" "chrome_vm_rta" {
  count = length(aws_subnet.chrome_vm_subnet)

  subnet_id      = aws_subnet.chrome_vm_subnet[count.index].id
  route_table_id = aws_route_table.chrome_vm_rt.id
}

# Security Groups
resource "aws_security_group" "chrome_vm_sg" {
  name_prefix = "chrome-vm-sg"
  vpc_id      = aws_vpc.chrome_vm_vpc.id

  # SSH access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # NoVNC access
  ingress {
    from_port   = 6080
    to_port     = 6080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Agent API access
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "chrome-vm-sg"
  }
}

# IAM Role for EC2 instances
resource "aws_iam_role" "chrome_vm_role" {
  name = "chrome-vm-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "chrome_vm_policy" {
  name = "chrome-vm-policy"
  role = aws_iam_role.chrome_vm_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeTags",
          "ec2:CreateTags"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "chrome_vm_profile" {
  name = "chrome-vm-profile"
  role = aws_iam_role.chrome_vm_role.name
}

# Key Pair
resource "aws_key_pair" "chrome_vm_key" {
  key_name   = "chrome-vm-key"
  public_key = var.ssh_public_key
}

# User data script
locals {
  user_data = base64encode(templatefile("${path.module}/user-data.sh", {
    dashboard_url = var.dashboard_url
    domain_name   = var.domain_name
  }))
}

# Launch Template
resource "aws_launch_template" "chrome_vm_template" {
  name_prefix   = "chrome-vm-template"
  image_id      = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  key_name      = aws_key_pair.chrome_vm_key.key_name

  vpc_security_group_ids = [aws_security_group.chrome_vm_sg.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.chrome_vm_profile.name
  }

  user_data = local.user_data

  block_device_mappings {
    device_name = "/dev/sda1"
    ebs {
      volume_size = var.volume_size
      volume_type = "gp3"
      encrypted   = true
    }
  }

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "chrome-vm"
      Environment = "production"
      Project     = "chrome-vm-dashboard"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "chrome_vm_asg" {
  name                = "chrome-vm-asg"
  vpc_zone_identifier = aws_subnet.chrome_vm_subnet[*].id
  target_group_arns   = [aws_lb_target_group.chrome_vm_tg.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_instances
  max_size         = var.max_instances
  desired_capacity = var.desired_instances

  launch_template {
    id      = aws_launch_template.chrome_vm_template.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "chrome-vm"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = "production"
    propagate_at_launch = true
  }
}

# Application Load Balancer
resource "aws_lb" "chrome_vm_alb" {
  name               = "chrome-vm-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.chrome_vm_sg.id]
  subnets            = aws_subnet.chrome_vm_subnet[*].id

  enable_deletion_protection = false

  tags = {
    Name = "chrome-vm-alb"
  }
}

resource "aws_lb_target_group" "chrome_vm_tg" {
  name     = "chrome-vm-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = aws_vpc.chrome_vm_vpc.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
    port                = "traffic-port"
    protocol            = "HTTP"
  }
}

resource "aws_lb_listener" "chrome_vm_listener" {
  load_balancer_arn = aws_lb.chrome_vm_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.chrome_vm_tg.arn
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "chrome_vm_logs" {
  name              = "/aws/ec2/chrome-vm"
  retention_in_days = 7
}

# S3 Bucket for scripts and results
resource "aws_s3_bucket" "chrome_vm_bucket" {
  bucket = "${var.project_name}-chrome-vm-${random_string.bucket_suffix.result}"

  tags = {
    Name        = "Chrome VM Storage"
    Environment = "production"
  }
}

resource "aws_s3_bucket_versioning" "chrome_vm_bucket_versioning" {
  bucket = aws_s3_bucket.chrome_vm_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "chrome_vm_bucket_encryption" {
  bucket = aws_s3_bucket.chrome_vm_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.chrome_vm_vpc.id
}

output "subnet_ids" {
  description = "IDs of the subnets"
  value       = aws_subnet.chrome_vm_subnet[*].id
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.chrome_vm_sg.id
}

output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = aws_lb.chrome_vm_alb.dns_name
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.chrome_vm_bucket.bucket
}
