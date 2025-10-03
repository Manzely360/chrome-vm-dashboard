#!/bin/bash

# Oracle Cloud Always Free Setup Script
# This script sets up a Chrome VM on Oracle Cloud's free tier

set -e

echo "🆓 Setting up Oracle Cloud Always Free Chrome VM..."

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

# Check if running on Ubuntu
check_os() {
    log_step "Checking operating system..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get &> /dev/null; then
            log_info "Ubuntu/Debian detected ✅"
        else
            log_error "This script requires Ubuntu/Debian"
            exit 1
        fi
    else
        log_warn "This script is designed for Ubuntu. You may need to adapt it for your OS."
    fi
}

# Update system
update_system() {
    log_step "Updating system packages..."
    
    sudo apt update && sudo apt upgrade -y
    log_info "System updated ✅"
}

# Install Docker
install_docker() {
    log_step "Installing Docker..."
    
    if command -v docker &> /dev/null; then
        log_info "Docker already installed ✅"
    else
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        log_info "Docker installed ✅"
    fi
}

# Install Node.js
install_nodejs() {
    log_step "Installing Node.js..."
    
    if command -v node &> /dev/null; then
        log_info "Node.js already installed ✅"
    else
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
        log_info "Node.js installed ✅"
    fi
}

# Install Chrome and dependencies
install_chrome() {
    log_step "Installing Google Chrome and dependencies..."
    
    # Install dependencies
    sudo apt-get install -y \
        wget \
        gnupg \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        xvfb \
        x11vnc \
        novnc \
        websockify \
        xfce4 \
        xfce4-goodies

    # Install Chrome
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
    sudo apt update
    sudo apt install -y google-chrome-stable

    log_info "Chrome and dependencies installed ✅"
}

# Install Puppeteer
install_puppeteer() {
    log_step "Installing Puppeteer..."
    
    npm install -g puppeteer
    log_info "Puppeteer installed ✅"
}

# Set up Chrome VM agent
setup_agent() {
    log_step "Setting up Chrome VM agent..."
    
    # Create agent directory
    mkdir -p ~/chrome-agent
    cd ~/chrome-agent
    
    # Copy agent files from current directory
    if [ -f "../agent.js" ]; then
        cp ../agent.js .
        cp ../package.json .
        npm install
        log_info "Agent files copied ✅"
    else
        log_warn "Agent files not found. Please copy agent.js and package.json to ~/chrome-agent/"
    fi
}

# Create systemd service
create_service() {
    log_step "Creating systemd service..."
    
    sudo tee /etc/systemd/system/chrome-agent.service > /dev/null << EOF
[Unit]
Description=Chrome VM Agent
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$HOME/chrome-agent
ExecStart=/usr/bin/node agent.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable chrome-agent.service
    log_info "Systemd service created ✅"
}

# Install Cloudflare Tunnel
install_cloudflare() {
    log_step "Installing Cloudflare Tunnel..."
    
    if command -v cloudflared &> /dev/null; then
        log_info "Cloudflare Tunnel already installed ✅"
    else
        wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
        chmod +x cloudflared-linux-amd64
        sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
        log_info "Cloudflare Tunnel installed ✅"
    fi
}

# Create startup script
create_startup_script() {
    log_step "Creating startup script..."
    
    cat > ~/start-chrome-vm.sh << 'EOF'
#!/bin/bash

# Start desktop environment
export DISPLAY=:1
Xvfb :1 -screen 0 1920x1080x24 &
sleep 2
xfce4-session &
sleep 5
x11vnc -display :1 -nopw -listen 0.0.0.0 -xkb -ncache 10 -ncache_cr -forever &
websockify -D --web=/usr/share/novnc/ 6080 localhost:5900 &

# Start Chrome agent
cd ~/chrome-agent
node agent.js &
EOF

    chmod +x ~/start-chrome-vm.sh
    log_info "Startup script created ✅"
}

# Main setup function
main() {
    echo "Oracle Cloud Always Free - Chrome VM Setup"
    echo "=========================================="
    echo ""
    
    check_os
    update_system
    install_docker
    install_nodejs
    install_chrome
    install_puppeteer
    setup_agent
    create_service
    install_cloudflare
    create_startup_script
    
    echo ""
    log_info "🎉 Oracle Cloud setup completed successfully!"
    echo ""
    log_info "Next steps:"
    echo "1. Start the service: sudo systemctl start chrome-agent.service"
    echo "2. Check status: sudo systemctl status chrome-agent.service"
    echo "3. Set up Cloudflare Tunnel: cloudflared tunnel login"
    echo "4. Add this server to your dashboard"
    echo ""
    log_info "Your VM is ready for Chrome automation! 🚀"
    echo ""
    log_info "To start manually: ~/start-chrome-vm.sh"
    echo "To check logs: journalctl -u chrome-agent.service -f"
}

# Run main function
main "$@"

