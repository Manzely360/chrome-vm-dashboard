#!/bin/bash

# User data script for Chrome VM instances
# This script runs when the instance starts

set -e

# Log everything
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "🚀 Starting Chrome VM user data script..."

# Update system
apt-get update
apt-get upgrade -y

# Install basic dependencies
apt-get install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install Xfce desktop environment
apt-get install -y xfce4 xfce4-goodies

# Install Chrome
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
apt-get update
apt-get install -y google-chrome-stable

# Install NoVNC and dependencies
apt-get install -y x11vnc xvfb novnc websockify

# Install additional tools
apt-get install -y firefox-esr chromium-browser

# Create user for running services
useradd -m -s /bin/bash chromeuser
usermod -aG sudo chromeuser

# Create directories
mkdir -p /opt/chrome-agent
mkdir -p /var/log/chrome-agent
mkdir -p /home/chromeuser/.config/google-chrome
mkdir -p /home/chromeuser/.local/share/applications

# Set up Chrome profile directory
chown -R chromeuser:chromeuser /home/chromeuser/.config/google-chrome
chown -R chromeuser:chromeuser /home/chromeuser/.local

# Install PM2 globally
npm install -g pm2

# Create startup script for desktop environment
cat > /home/chromeuser/start-desktop.sh << 'EOF'
#!/bin/bash
export DISPLAY=:1
Xvfb :1 -screen 0 1920x1080x24 &
sleep 2
xfce4-session &
sleep 5
x11vnc -display :1 -nopw -listen localhost -xkb -ncache 10 -ncache_cr -forever &
websockify -D --web=/usr/share/novnc/ 6080 localhost:5900
EOF

chmod +x /home/chromeuser/start-desktop.sh
chown chromeuser:chromeuser /home/chromeuser/start-desktop.sh

# Create systemd service for desktop environment
cat > /etc/systemd/system/chrome-desktop.service << 'EOF'
[Unit]
Description=Chrome Desktop Environment
After=network.target

[Service]
Type=forking
User=chromeuser
Group=chromeuser
WorkingDirectory=/home/chromeuser
ExecStart=/home/chromeuser/start-desktop.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start desktop service
systemctl daemon-reload
systemctl enable chrome-desktop.service
systemctl start chrome-desktop.service

# Create Chrome agent directory and install dependencies
cd /opt/chrome-agent

# Create package.json
cat > package.json << 'EOF'
{
  "name": "chrome-vm-agent",
  "version": "1.0.0",
  "description": "Chrome VM Agent for Browser Farm",
  "main": "agent.js",
  "scripts": {
    "start": "node agent.js",
    "dev": "nodemon agent.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "puppeteer": "^21.5.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "uuid": "^9.0.1",
    "fs-extra": "^11.1.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
EOF

# Install dependencies
npm install

# Download agent.js from S3 or GitHub
# For now, we'll create a placeholder that will be replaced
cat > agent.js << 'EOF'
// Agent will be downloaded from S3 or GitHub
console.log('Agent placeholder - will be replaced');
EOF

# Set permissions
chown -R chromeuser:chromeuser /opt/chrome-agent
chmod +x /opt/chrome-agent/agent.js

# Create systemd service for Chrome agent
cat > /etc/systemd/system/chrome-agent.service << 'EOF'
[Unit]
Description=Chrome VM Agent
After=network.target chrome-desktop.service

[Service]
Type=simple
User=chromeuser
Group=chromeuser
WorkingDirectory=/opt/chrome-agent
ExecStart=/usr/bin/node agent.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=DISPLAY=:1

[Install]
WantedBy=multi-user.target
EOF

# Enable Chrome agent service
systemctl daemon-reload
systemctl enable chrome-agent.service

# Create Cloudflare tunnel directory
mkdir -p /opt/cloudflared
cd /opt/cloudflared

# Download cloudflared (latest version)
wget -O cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared
chown chromeuser:chromeuser cloudflared

# Get instance metadata
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

# Create cloudflared config
cat > config.yml << EOF
tunnel: chrome-vm-tunnel
credentials-file: /opt/cloudflared/tunnel-credentials.json

ingress:
  - hostname: novnc-${INSTANCE_ID}.${domain_name}
    service: http://localhost:6080
  - hostname: agent-${INSTANCE_ID}.${domain_name}
    service: http://localhost:3000
  - catch-all:
      service: http-status:404
EOF

chown chromeuser:chromeuser config.yml

# Create startup script for cloudflared
cat > start-tunnel.sh << 'EOF'
#!/bin/bash
cd /opt/cloudflared
./cloudflared tunnel --config config.yml run
EOF

chmod +x start-tunnel.sh
chown chromeuser:chromeuser start-tunnel.sh

# Create systemd service for cloudflared
cat > /etc/systemd/system/cloudflared.service << 'EOF'
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=chromeuser
Group=chromeuser
WorkingDirectory=/opt/cloudflared
ExecStart=/opt/cloudflared/start-tunnel.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable cloudflared service
systemctl daemon-reload
systemctl enable cloudflared.service

# Create VM registration script
cat > /opt/chrome-agent/register-vm.sh << EOF
#!/bin/bash
# This script registers the VM with the dashboard backend
VM_ID=\$(curl -s http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null || echo "vm-\$(date +%s)")
DASHBOARD_URL="${dashboard_url}/api/register-vm"

curl -X POST "\$DASHBOARD_URL" \\
  -H "Content-Type: application/json" \\
  -d "{
    \"vm_id\": \"\$VM_ID\",
    \"novnc_url\": \"https://novnc-\$VM_ID.${domain_name}\",
    \"agent_url\": \"https://agent-\$VM_ID.${domain_name}\",
    \"status\": \"ready\",
    \"public_ip\": \"\$PUBLIC_IP\"
  }"
EOF

chmod +x /opt/chrome-agent/register-vm.sh
chown chromeuser:chromeuser /opt/chrome-agent/register-vm.sh

# Create cleanup script
cat > /opt/chrome-agent/cleanup.sh << 'EOF'
#!/bin/bash
# Cleanup script for VM termination
pkill -f chrome
pkill -f puppeteer
pkill -f x11vnc
pkill -f websockify
rm -rf /tmp/.X11-unix/X1
rm -rf /home/chromeuser/.config/google-chrome/Singleton*
EOF

chmod +x /opt/chrome-agent/cleanup.sh
chown chromeuser:chromeuser /opt/chrome-agent/cleanup.sh

# Set up log rotation
cat > /etc/logrotate.d/chrome-agent << 'EOF'
/var/log/chrome-agent/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 chromeuser chromeuser
    postrotate
        systemctl reload chrome-agent.service
    endscript
}
EOF

# Create VM info file
cat > /opt/chrome-agent/vm-info.json << EOF
{
  "vm_id": "${INSTANCE_ID}",
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "chrome_version": "$(google-chrome --version | cut -d' ' -f3)",
  "node_version": "$(node --version)",
  "status": "initializing",
  "public_ip": "${PUBLIC_IP}"
}
EOF

# Set final permissions
chown -R chromeuser:chromeuser /opt/chrome-agent
chown -R chromeuser:chromeuser /var/log/chrome-agent

# Start services
systemctl start chrome-desktop.service
systemctl start chrome-agent.service
systemctl start cloudflared.service

echo "✅ Chrome VM setup completed!"
echo "Instance ID: ${INSTANCE_ID}"
echo "Public IP: ${PUBLIC_IP}"
echo "Chrome Version: $(google-chrome --version | cut -d' ' -f3)"
echo "Node Version: $(node --version)"
echo ""
echo "NoVNC will be available at: http://${PUBLIC_IP}:6080"
echo "Agent API will be available at: http://${PUBLIC_IP}:3000"

# Register VM with dashboard
/opt/chrome-agent/register-vm.sh

echo "🎉 Chrome VM is ready!"
