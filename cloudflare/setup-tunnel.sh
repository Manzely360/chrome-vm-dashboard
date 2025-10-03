#!/bin/bash

# Cloudflare Tunnel Setup Script for Chrome VM Dashboard
# This script sets up Cloudflare Tunnels for secure access to VMs

set -e

echo "🚀 Setting up Cloudflare Tunnel for Chrome VM Dashboard..."

# Configuration
DOMAIN_NAME=${1:-"your-domain.com"}
TUNNEL_NAME="chrome-vm-dashboard"
CONFIG_DIR="/opt/cloudflared"
CONFIG_FILE="$CONFIG_DIR/tunnel-config.yml"

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared is not installed. Please install it first."
    echo "   Download from: https://github.com/cloudflare/cloudflared/releases"
    exit 1
fi

# Create config directory
mkdir -p "$CONFIG_DIR"

# Create tunnel configuration
cat > "$CONFIG_FILE" << EOF
tunnel: $TUNNEL_NAME
credentials-file: $CONFIG_DIR/tunnel-credentials.json

ingress:
  # Dashboard frontend
  - hostname: dashboard.$DOMAIN_NAME
    service: http://localhost:3000
    originRequest:
      httpHostHeader: dashboard.$DOMAIN_NAME

  # Backend API
  - hostname: api.$DOMAIN_NAME
    service: http://localhost:3001
    originRequest:
      httpHostHeader: api.$DOMAIN_NAME

  # VM NoVNC access (wildcard for dynamic VM IDs)
  - hostname: "novnc-*.$DOMAIN_NAME"
    service: http://localhost:6080
    originRequest:
      httpHostHeader: "novnc-{subdomain}.$DOMAIN_NAME"

  # VM Agent API access (wildcard for dynamic VM IDs)
  - hostname: "agent-*.$DOMAIN_NAME"
    service: http://localhost:3000
    originRequest:
      httpHostHeader: "agent-{subdomain}.$DOMAIN_NAME"

  # Catch-all rule (must be last)
  - service: http-status:404

originRequest:
  noTLSVerify: true
  connectTimeout: 30s
  tlsTimeout: 10s
  tcpKeepAlive: 30s

logging:
  level: info
  format: json

metrics: 0.0.0.0:8080
EOF

echo "✅ Tunnel configuration created at $CONFIG_FILE"

# Create systemd service for cloudflared
cat > /etc/systemd/system/cloudflared.service << EOF
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=$CONFIG_DIR
ExecStart=/usr/local/bin/cloudflared tunnel --config $CONFIG_FILE run
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Systemd service created"

# Enable and start service
systemctl daemon-reload
systemctl enable cloudflared.service

echo "✅ Cloudflare tunnel service enabled"

# Instructions for completing setup
echo ""
echo "🔧 Next steps:"
echo "1. Create a Cloudflare tunnel:"
echo "   cloudflared tunnel create $TUNNEL_NAME"
echo ""
echo "2. Copy the tunnel credentials to:"
echo "   $CONFIG_DIR/tunnel-credentials.json"
echo ""
echo "3. Configure DNS records in Cloudflare:"
echo "   - dashboard.$DOMAIN_NAME -> CNAME -> $TUNNEL_NAME.trycloudflare.com"
echo "   - api.$DOMAIN_NAME -> CNAME -> $TUNNEL_NAME.trycloudflare.com"
echo "   - *.novnc.$DOMAIN_NAME -> CNAME -> $TUNNEL_NAME.trycloudflare.com"
echo "   - *.agent.$DOMAIN_NAME -> CNAME -> $TUNNEL_NAME.trycloudflare.com"
echo ""
echo "4. Start the tunnel service:"
echo "   systemctl start cloudflared.service"
echo ""
echo "5. Check tunnel status:"
echo "   systemctl status cloudflared.service"
echo "   cloudflared tunnel list"
echo ""
echo "🎉 Cloudflare tunnel setup completed!"
