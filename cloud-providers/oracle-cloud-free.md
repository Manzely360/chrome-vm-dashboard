# Oracle Cloud Always Free - Complete Setup Guide

## 🎉 Why Oracle Cloud Always Free?

- **100% FREE forever** - no credit card required for free tier
- **2 ARM VMs** (1GB RAM each) + 1 AMD VM (1GB RAM)
- **200GB storage** total
- **No time limits** - unlike other free tiers
- **Perfect for Chrome VM dashboard**

## Step 1: Create Oracle Cloud Account

1. Go to [oracle.com/cloud/free](https://oracle.com/cloud/free)
2. Click "Start for free"
3. Fill out the form (no credit card needed for free tier)
4. Verify your email
5. Sign in to Oracle Cloud Console

## Step 2: Create Your First Free VM

### Create ARM Instance (Recommended)

1. **Go to Compute → Instances**
2. **Click "Create Instance"**
3. **Configure:**
   - Name: `chrome-vm-1`
   - Image: `Canonical Ubuntu 22.04`
   - Shape: `VM.Standard.A1.Flex` (ARM)
   - OCPU Count: `1`
   - Memory: `6 GB` (max for free tier)
   - Boot Volume: `50 GB` (free tier limit)

4. **Add SSH Key:**
   ```bash
   # Generate SSH key
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/oracle-cloud-key
   
   # Copy public key
   cat ~/.ssh/oracle-cloud-key.pub
   ```

5. **Click "Create"**

### Create Second ARM Instance

1. Repeat the process for `chrome-vm-2`
2. Use remaining resources (1 OCPU, 2GB RAM)

## Step 3: Configure Your VMs

```bash
# Get VM IP from Oracle Console
# SSH into your VM
ssh -i ~/.ssh/oracle-cloud-key ubuntu@YOUR_VM_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Chrome dependencies
sudo apt-get install -y \
    wget \
    gnupg \
    software-properties-common \
    apt-transport-https \
    ca-certificates

# Install Google Chrome
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt update
sudo apt install -y google-chrome-stable

# Install NoVNC
sudo apt install -y xvfb x11vnc novnc websockify

# Install Xfce desktop
sudo apt install -y xfce4 xfce4-goodies

# Install Puppeteer
npm install -g puppeteer
```

## Step 4: Set Up Chrome VM Agent

```bash
# Create agent directory
mkdir -p /home/ubuntu/chrome-agent
cd /home/ubuntu/chrome-agent

# Download agent files (you'll need to upload these)
# Or clone from your repo
git clone https://github.com/your-username/chrome-vm-dashboard.git
cd chrome-vm-dashboard

# Install dependencies
npm install

# Start the agent
node agent.js
```

## Step 5: Configure Cloudflare Tunnel (Free)

```bash
# Download cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/

# Create tunnel
cloudflared tunnel login
cloudflared tunnel create chrome-vm-tunnel

# Configure tunnel
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml << EOF
tunnel: chrome-vm-tunnel
credentials-file: /home/ubuntu/.cloudflared/tunnel-credentials.json

ingress:
  - hostname: chrome-vm-1.your-domain.com
    service: http://localhost:3000
  - hostname: novnc-1.your-domain.com
    service: http://localhost:6080
  - catch-all:
      service: http-status:404
EOF

# Start tunnel
cloudflared tunnel run chrome-vm-tunnel
```

## Step 6: Add to Your Dashboard

1. Open your local dashboard at http://localhost:3000
2. Go to "Servers" tab
3. Click "Add Server"
4. Enter:
   - Name: "Oracle Cloud VM 1"
   - Host: `chrome-vm-1.your-domain.com` (or VM IP)
   - Port: 3000
   - NoVNC Port: 6080
   - Location: "Oracle Cloud Free"

## Step 7: Create Startup Script

```bash
# Create systemd service for auto-start
sudo tee /etc/systemd/system/chrome-agent.service > /dev/null << EOF
[Unit]
Description=Chrome VM Agent
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/chrome-agent
ExecStart=/usr/bin/node agent.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl enable chrome-agent.service
sudo systemctl start chrome-agent.service
```

## Cost Breakdown: $0.00/month! 🎉

- **VM 1**: 1 OCPU, 6GB RAM, 50GB storage - **FREE**
- **VM 2**: 1 OCPU, 2GB RAM, 50GB storage - **FREE**
- **Storage**: 200GB total - **FREE**
- **Bandwidth**: 10TB/month - **FREE**
- **Cloudflare**: Tunnel and DNS - **FREE**

## Scaling Up (When You Need More)

- **Upgrade to paid**: $0.03/hour for additional VMs
- **Add more regions**: Free tier available in multiple regions
- **Use different shapes**: Try different VM configurations

## Security Tips

1. **Use SSH keys only** (no passwords)
2. **Enable firewall** in Oracle Console
3. **Use Cloudflare** for DDoS protection
4. **Regular updates** on your VMs
5. **Monitor usage** to stay within free limits

## Troubleshooting

### VM Won't Start
- Check if you're within free tier limits
- Verify your SSH key is correct
- Check Oracle Console for error messages

### Can't Connect
- Verify security lists allow your IP
- Check if services are running
- Test with `curl localhost:3000`

### Out of Resources
- Delete unused VMs
- Use smaller boot volumes
- Check Oracle Console for usage

## Next Steps

1. Set up monitoring with free tools
2. Configure automated backups
3. Add more VMs in different regions
4. Set up CI/CD for deployments

