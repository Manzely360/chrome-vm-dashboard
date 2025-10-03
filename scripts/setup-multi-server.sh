#!/bin/bash

# Multi-Server Setup Script for Chrome VM Dashboard
# This script helps you set up multiple servers for distributed VM management

set -e

echo "🚀 Setting up Multi-Server Chrome VM Dashboard..."

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

# Check if Docker is installed
check_docker() {
    log_step "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    log_info "Docker and Docker Compose are installed ✅"
}

# Create sample server configurations
create_sample_servers() {
    log_step "Creating sample server configurations..."
    
    # Create a sample servers.json file
    cat > sample-servers.json << 'EOF'
[
  {
    "name": "Local Server 1",
    "host": "localhost",
    "port": 3001,
    "novnc_port": 6081,
    "max_vms": 3,
    "location": "Local Development"
  },
  {
    "name": "Local Server 2", 
    "host": "localhost",
    "port": 3002,
    "novnc_port": 6082,
    "max_vms": 3,
    "location": "Local Development"
  },
  {
    "name": "Remote Server 1",
    "host": "192.168.1.100",
    "port": 3000,
    "novnc_port": 6080,
    "max_vms": 5,
    "location": "Office Network"
  }
]
EOF

    log_info "Sample server configurations created in sample-servers.json"
}

# Start Docker VMs
start_docker_vms() {
    log_step "Starting Docker-based Chrome VMs..."
    
    # Build and start the VMs
    docker-compose -f docker-compose-vms.yml up -d --build
    
    log_info "Docker VMs started successfully"
    log_info "VM 1: NoVNC at http://localhost:6081, API at http://localhost:3001"
    log_info "VM 2: NoVNC at http://localhost:6082, API at http://localhost:3002" 
    log_info "VM 3: NoVNC at http://localhost:6083, API at http://localhost:3003"
}

# Add sample servers to the database
add_sample_servers() {
    log_step "Adding sample servers to the database..."
    
    # Wait for backend to be ready
    sleep 5
    
    # Add servers via API
    curl -X POST http://localhost:3001/api/servers \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Docker VM 1",
        "host": "localhost",
        "port": 3001,
        "novnc_port": 6081,
        "max_vms": 3,
        "location": "Local Docker"
      }' || log_warn "Failed to add server 1"
    
    curl -X POST http://localhost:3001/api/servers \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Docker VM 2", 
        "host": "localhost",
        "port": 3002,
        "novnc_port": 6082,
        "max_vms": 3,
        "location": "Local Docker"
      }' || log_warn "Failed to add server 2"
    
    curl -X POST http://localhost:3001/api/servers \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Docker VM 3",
        "host": "localhost", 
        "port": 3003,
        "novnc_port": 6083,
        "max_vms": 3,
        "location": "Local Docker"
      }' || log_warn "Failed to add server 3"
    
    log_info "Sample servers added to database"
}

# Test the setup
test_setup() {
    log_step "Testing the setup..."
    
    # Test backend health
    if curl -s http://localhost:3001/api/health > /dev/null; then
        log_info "Backend API: ✅"
    else
        log_error "Backend API: ❌"
    fi
    
    # Test frontend
    if curl -s http://localhost:3000 > /dev/null; then
        log_info "Frontend Dashboard: ✅"
    else
        log_error "Frontend Dashboard: ❌"
    fi
    
    # Test servers
    if curl -s http://localhost:3001/api/servers > /dev/null; then
        log_info "Server Management: ✅"
    else
        log_error "Server Management: ❌"
    fi
}

# Main setup function
main() {
    echo "Chrome VM Dashboard - Multi-Server Setup"
    echo "========================================"
    echo ""
    
    check_docker
    create_sample_servers
    start_docker_vms
    add_sample_servers
    test_setup
    
    echo ""
    log_info "🎉 Multi-server setup completed successfully!"
    echo ""
    log_info "Access your dashboard at: http://localhost:3000"
    echo ""
    log_info "Available servers:"
    echo "  - Docker VM 1: localhost:3001 (NoVNC: 6081)"
    echo "  - Docker VM 2: localhost:3002 (NoVNC: 6082)" 
    echo "  - Docker VM 3: localhost:3003 (NoVNC: 6083)"
    echo ""
    log_info "Next steps:"
    echo "1. Open http://localhost:3000 in your browser"
    echo "2. Go to the 'Servers' tab to see your servers"
    echo "3. Go to the 'VMs' tab to create VMs on any server"
    echo "4. Add more servers by clicking 'Add Server'"
    echo ""
    log_info "To add remote servers:"
    echo "1. Deploy the agent.js to your remote servers"
    echo "2. Use 'Add Server' in the dashboard"
    echo "3. Enter the remote server's IP and ports"
}

# Run main function
main "$@"
