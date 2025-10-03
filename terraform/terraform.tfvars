# Chrome VM Dashboard - Terraform Variables
# This is a mock configuration for testing

aws_region = "us-west-2"
instance_type = "t3.medium"
volume_size = 50
min_instances = 1
max_instances = 3
desired_instances = 1

# Mock SSH key (replace with real one for production)
ssh_public_key = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC7vbqajDhA..."

# Mock domain (replace with real domain for production)
dashboard_url = "http://localhost:3000"
domain_name = "localhost"

project_name = "chrome-vm-dashboard"
environment = "development"
