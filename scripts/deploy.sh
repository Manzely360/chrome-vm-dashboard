#!/bin/bash

# Chrome VM Dashboard Deployment Script
# This script deploys the entire system to production

set -e

echo "🚀 Starting Chrome VM Dashboard deployment..."

# Configuration
ENVIRONMENT=${1:-"production"}
DOMAIN_NAME=${2:-"your-domain.com"}
AWS_REGION=${3:-"us-west-2"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if required tools are installed
    command -v node >/dev/null 2>&1 || { log_error "Node.js is required but not installed. Aborting."; exit 1; }
    command -v npm >/dev/null 2>&1 || { log_error "npm is required but not installed. Aborting."; exit 1; }
    command -v terraform >/dev/null 2>&1 || { log_error "Terraform is required but not installed. Aborting."; exit 1; }
    command -v aws >/dev/null 2>&1 || { log_error "AWS CLI is required but not installed. Aborting."; exit 1; }
    command -v cloudflared >/dev/null 2>&1 || { log_error "cloudflared is required but not installed. Aborting."; exit 1; }
    
    log_info "All prerequisites met!"
}

# Deploy infrastructure
deploy_infrastructure() {
    log_info "Deploying infrastructure with Terraform..."
    
    cd terraform
    
    # Initialize Terraform
    terraform init
    
    # Create terraform.tfvars if it doesn't exist
    if [ ! -f "terraform.tfvars" ]; then
        log_warn "terraform.tfvars not found. Creating from example..."
        cp terraform.tfvars.example terraform.tfvars
        log_warn "Please edit terraform.tfvars with your configuration before continuing."
        read -p "Press Enter to continue after editing terraform.tfvars..."
    fi
    
    # Plan deployment
    terraform plan -var="domain_name=$DOMAIN_NAME" -var="aws_region=$AWS_REGION"
    
    # Apply deployment
    read -p "Do you want to proceed with infrastructure deployment? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        terraform apply -var="domain_name=$DOMAIN_NAME" -var="aws_region=$AWS_REGION" -auto-approve
    else
        log_error "Infrastructure deployment cancelled."
        exit 1
    fi
    
    cd ..
    log_info "Infrastructure deployed successfully!"
}

# Deploy backend
deploy_backend() {
    log_info "Deploying backend API..."
    
    cd backend
    
    # Install dependencies
    npm ci --production
    
    # Create environment file
    if [ ! -f ".env" ]; then
        log_warn "Creating .env file from example..."
        cp ../env.example .env
        log_warn "Please edit .env with your configuration."
        read -p "Press Enter to continue after editing .env..."
    fi
    
    # Build application
    npm run build || log_warn "No build script found, skipping..."
    
    cd ..
    log_info "Backend deployed successfully!"
}

# Deploy frontend
deploy_frontend() {
    log_info "Deploying frontend dashboard..."
    
    cd dashboard
    
    # Install dependencies
    npm ci
    
    # Create environment file
    if [ ! -f ".env.local" ]; then
        log_warn "Creating .env.local file..."
        cat > .env.local << EOF
NEXT_PUBLIC_API_URL=https://api.$DOMAIN_NAME
NEXT_PUBLIC_DOMAIN_NAME=$DOMAIN_NAME
EOF
    fi
    
    # Build application
    npm run build
    
    cd ..
    log_info "Frontend deployed successfully!"
}

# Setup Cloudflare tunnels
setup_cloudflare() {
    log_info "Setting up Cloudflare tunnels..."
    
    cd cloudflare
    
    # Make setup script executable
    chmod +x setup-tunnel.sh
    
    # Run setup script
    ./setup-tunnel.sh "$DOMAIN_NAME"
    
    cd ..
    log_info "Cloudflare tunnels configured!"
}

# Start services
start_services() {
    log_info "Starting services..."
    
    # Start backend
    cd backend
    nohup npm start > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../logs/backend.pid
    cd ..
    
    # Start frontend
    cd dashboard
    nohup npm start > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../logs/frontend.pid
    cd ..
    
    # Start Cloudflare tunnel
    nohup cloudflared tunnel --config cloudflare/tunnel-config.yml run > logs/cloudflare.log 2>&1 &
    CLOUDFLARE_PID=$!
    echo $CLOUDFLARE_PID > logs/cloudflare.pid
    
    log_info "Services started successfully!"
    log_info "Backend PID: $BACKEND_PID"
    log_info "Frontend PID: $FRONTEND_PID"
    log_info "Cloudflare PID: $CLOUDFLARE_PID"
}

# Create logs directory
mkdir -p logs

# Main deployment flow
main() {
    log_info "Starting deployment for environment: $ENVIRONMENT"
    log_info "Domain: $DOMAIN_NAME"
    log_info "AWS Region: $AWS_REGION"
    
    check_prerequisites
    deploy_infrastructure
    deploy_backend
    deploy_frontend
    setup_cloudflare
    start_services
    
    log_info "🎉 Deployment completed successfully!"
    log_info "Dashboard: https://dashboard.$DOMAIN_NAME"
    log_info "API: https://api.$DOMAIN_NAME"
    log_info "Health Check: https://api.$DOMAIN_NAME/api/health"
    
    log_info "To check service status:"
    log_info "  Backend: tail -f logs/backend.log"
    log_info "  Frontend: tail -f logs/frontend.log"
    log_info "  Cloudflare: tail -f logs/cloudflare.log"
}

# Run main function
main "$@"
