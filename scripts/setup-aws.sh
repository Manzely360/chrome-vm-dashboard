#!/bin/bash

# AWS Setup Script for Chrome VM Dashboard
# This script helps you configure AWS for the Chrome VM Dashboard

set -e

echo "🚀 Setting up AWS for Chrome VM Dashboard..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if AWS CLI is configured
check_aws_config() {
    log_step "Checking AWS configuration..."
    
    if aws sts get-caller-identity >/dev/null 2>&1; then
        log_info "AWS credentials are configured!"
        aws sts get-caller-identity
        return 0
    else
        log_warn "AWS credentials not configured."
        return 1
    fi
}

# Configure AWS CLI
configure_aws() {
    log_step "Configuring AWS CLI..."
    
    echo "Please enter your AWS credentials:"
    aws configure
    
    if check_aws_config; then
        log_info "AWS configuration successful!"
    else
        log_error "AWS configuration failed. Please check your credentials."
        exit 1
    fi
}

# Create SSH key pair
create_ssh_key() {
    log_step "Creating SSH key pair..."
    
    SSH_KEY_PATH="$HOME/.ssh/chrome-vm-key"
    
    if [ ! -f "$SSH_KEY_PATH" ]; then
        log_info "Creating new SSH key pair..."
        ssh-keygen -t rsa -b 4096 -f "$SSH_KEY_PATH" -N ""
        chmod 600 "$SSH_KEY_PATH"
        chmod 644 "$SSH_KEY_PATH.pub"
        log_info "SSH key pair created at $SSH_KEY_PATH"
    else
        log_info "SSH key pair already exists at $SSH_KEY_PATH"
    fi
    
    # Import to AWS
    log_info "Importing SSH key to AWS..."
    aws ec2 import-key-pair \
        --key-name "chrome-vm-key" \
        --public-key-material "fileb://$SSH_KEY_PATH.pub" \
        --region us-west-2 || log_warn "Key pair might already exist in AWS"
    
    echo ""
    log_info "Your SSH public key:"
    cat "$SSH_KEY_PATH.pub"
    echo ""
}

# Configure Terraform
configure_terraform() {
    log_step "Configuring Terraform..."
    
    cd terraform
    
    if [ ! -f "terraform.tfvars" ]; then
        log_info "Creating terraform.tfvars from example..."
        cp terraform.tfvars.example terraform.tfvars
        
        # Get SSH public key
        SSH_PUBLIC_KEY=$(cat "$HOME/.ssh/chrome-vm-key.pub")
        
        # Update terraform.tfvars with SSH key
        sed -i.bak "s|ssh_public_key = \".*\"|ssh_public_key = \"$SSH_PUBLIC_KEY\"|" terraform.tfvars
        
        log_info "terraform.tfvars created with your SSH key"
        log_warn "Please edit terraform.tfvars to add your domain name and other settings"
    else
        log_info "terraform.tfvars already exists"
    fi
    
    cd ..
}

# Test AWS connectivity
test_aws() {
    log_step "Testing AWS connectivity..."
    
    # Test EC2 access
    if aws ec2 describe-regions --region us-west-2 >/dev/null 2>&1; then
        log_info "EC2 access: ✅"
    else
        log_error "EC2 access: ❌"
        return 1
    fi
    
    # Test VPC access
    if aws ec2 describe-vpcs --region us-west-2 >/dev/null 2>&1; then
        log_info "VPC access: ✅"
    else
        log_error "VPC access: ❌"
        return 1
    fi
    
    # Test S3 access
    if aws s3 ls --region us-west-2 >/dev/null 2>&1; then
        log_info "S3 access: ✅"
    else
        log_error "S3 access: ❌"
        return 1
    fi
    
    log_info "All AWS services accessible!"
}

# Main setup function
main() {
    echo "Chrome VM Dashboard - AWS Setup"
    echo "================================"
    echo ""
    
    # Check AWS configuration
    if ! check_aws_config; then
        configure_aws
    fi
    
    # Create SSH key
    create_ssh_key
    
    # Configure Terraform
    configure_terraform
    
    # Test AWS
    test_aws
    
    echo ""
    log_info "🎉 AWS setup completed successfully!"
    echo ""
    log_info "Next steps:"
    echo "1. Edit terraform/terraform.tfvars with your domain name"
    echo "2. Run: cd terraform && terraform init"
    echo "3. Run: terraform plan"
    echo "4. Run: terraform apply"
    echo ""
    log_info "Your SSH public key (save this):"
    cat "$HOME/.ssh/chrome-vm-key.pub"
}

# Run main function
main "$@"
