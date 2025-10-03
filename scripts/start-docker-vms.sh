#!/bin/bash

# Docker Chrome VM Dashboard Setup Script
# This script starts the complete Chrome VM dashboard with Docker

set -e

echo "🐳 Starting Chrome VM Dashboard with Docker..."

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

# Check if Docker is running
check_docker() {
    log_step "Checking Docker..."
    
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker Desktop first."
        exit 1
    fi
    
    log_info "Docker is running ✅"
}

# Stop existing containers
stop_containers() {
    log_step "Stopping existing containers..."
    
    docker-compose -f docker-compose-simple.yml down 2>/dev/null || true
    log_info "Existing containers stopped ✅"
}

# Build and start containers
start_containers() {
    log_step "Building and starting containers..."
    
    # Build the Docker VM image first
    log_info "Building Chrome VM image..."
    docker build -t chrome-vm ./docker-vm
    
    # Start all services
    log_info "Starting all services..."
    docker-compose -f docker-compose-simple.yml up -d --build
    
    log_info "All containers started ✅"
}

# Wait for services to be ready
wait_for_services() {
    log_step "Waiting for services to be ready..."
    
    # Wait for backend
    log_info "Waiting for backend API..."
    for i in {1..30}; do
        if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
            log_info "Backend API ready ✅"
            break
        fi
        sleep 2
    done
    
    # Wait for frontend
    log_info "Waiting for frontend dashboard..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 >/dev/null 2>&1; then
            log_info "Frontend dashboard ready ✅"
            break
        fi
        sleep 2
    done
}

# Add Docker VMs to the dashboard
add_vms_to_dashboard() {
    log_step "Adding Docker VMs to dashboard..."
    
    # Wait a bit for backend to be fully ready
    sleep 5
    
    # Add VM 1
    curl -X POST http://localhost:3001/api/servers \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Docker VM 1",
        "host": "localhost",
        "port": 3011,
        "novnc_port": 6081,
        "max_vms": 1,
        "location": "Local Docker"
      }' 2>/dev/null || log_warn "Failed to add server 1"
    
    # Add VM 2
    curl -X POST http://localhost:3001/api/servers \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Docker VM 2",
        "host": "localhost",
        "port": 3012,
        "novnc_port": 6082,
        "max_vms": 1,
        "location": "Local Docker"
      }' 2>/dev/null || log_warn "Failed to add server 2"
    
    # Add VM 3
    curl -X POST http://localhost:3001/api/servers \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Docker VM 3",
        "host": "localhost",
        "port": 3013,
        "novnc_port": 6083,
        "max_vms": 1,
        "location": "Local Docker"
      }' 2>/dev/null || log_warn "Failed to add server 3"
    
    log_info "Docker VMs added to dashboard ✅"
}

# Show status
show_status() {
    log_step "Checking container status..."
    
    echo ""
    log_info "Container Status:"
    docker-compose -f docker-compose-simple.yml ps
    
    echo ""
    log_info "Service URLs:"
    echo "  📊 Dashboard: http://localhost:3000"
    echo "  🔧 Backend API: http://localhost:3001"
    echo "  🖥️  VM 1 NoVNC: http://localhost:6081"
    echo "  🖥️  VM 2 NoVNC: http://localhost:6082"
    echo "  🖥️  VM 3 NoVNC: http://localhost:6083"
    echo "  🤖 VM 1 API: http://localhost:3011"
    echo "  🤖 VM 2 API: http://localhost:3012"
    echo "  🤖 VM 3 API: http://localhost:3013"
    
    echo ""
    log_info "Test commands:"
    echo "  curl http://localhost:3001/api/health"
    echo "  curl http://localhost:3011/health"
    echo "  curl http://localhost:3012/health"
    echo "  curl http://localhost:3013/health"
}

# Main setup function
main() {
    echo "Chrome VM Dashboard - Docker Setup"
    echo "=================================="
    echo ""
    
    check_docker
    stop_containers
    start_containers
    wait_for_services
    add_vms_to_dashboard
    show_status
    
    echo ""
    log_info "🎉 Chrome VM Dashboard is ready!"
    echo ""
    log_info "Next steps:"
    echo "1. Open http://localhost:3000 in your browser"
    echo "2. Go to the 'Servers' tab to see your Docker VMs"
    echo "3. Go to the 'VMs' tab to create VMs on any server"
    echo "4. Click 'Run Script' to test automation"
    echo ""
    log_info "To stop all containers:"
    echo "  docker-compose -f docker-compose-simple.yml down"
    echo ""
    log_info "To view logs:"
    echo "  docker-compose -f docker-compose-simple.yml logs -f"
}

# Run main function
main "$@"
