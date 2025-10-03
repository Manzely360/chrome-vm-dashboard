# DigitalOcean Setup Guide

## Why DigitalOcean?

- **Easiest to start**: No complex AWS configurations
- **Simple pricing**: $6-12/month per VM
- **Great API**: Easy to automate VM creation
- **One-click Ubuntu**: Pre-configured images
- **5-minute setup**: From signup to running VMs

## Step 1: Create DigitalOcean Account

1. Go to [digitalocean.com](https://digitalocean.com)
2. Sign up with email or GitHub
3. Add payment method (required but won't charge until you create VMs)

## Step 2: Get API Token

1. Go to API section in DigitalOcean dashboard
2. Generate new token
3. Copy the token (you'll need it)

## Step 3: Install DigitalOcean CLI (Optional)

```bash
# Install doctl (DigitalOcean CLI)
brew install doctl

# Authenticate
doctl auth init
# Enter your API token when prompted
```

## Step 4: Create Your First VM

### Option A: Using Web Interface (Easiest)
1. Click "Create" → "Droplets"
2. Choose Ubuntu 22.04
3. Select $6/month plan (1GB RAM, 1 CPU)
4. Add SSH key (create one if you don't have it)
5. Name it "chrome-vm-1"
6. Click "Create Droplet"

### Option B: Using CLI
```bash
# Create SSH key
ssh-keygen -t rsa -b 4096 -f ~/.ssh/digitalocean-key

# Add key to DigitalOcean
doctl compute ssh-key create chrome-vm-key --public-key-file ~/.ssh/digitalocean-key.pub

# Create droplet
doctl compute droplet create chrome-vm-1 \
  --image ubuntu-22-04-x64 \
  --size s-1vcpu-1gb \
  --region nyc1 \
  --ssh-keys $(doctl compute ssh-key list --format ID --no-header) \
  --wait
```

## Step 5: Configure Your VM

```bash
# Get VM IP
doctl compute droplet list

# SSH into your VM
ssh -i ~/.ssh/digitalocean-key root@YOUR_VM_IP

# Run the setup script
curl -fsSL https://raw.githubusercontent.com/your-repo/setup.sh | bash
```

## Step 6: Add to Dashboard

1. Open your dashboard at http://localhost:3000
2. Go to "Servers" tab
3. Click "Add Server"
4. Enter:
   - Name: "DigitalOcean VM 1"
   - Host: YOUR_VM_IP
   - Port: 3000
   - NoVNC Port: 6080
   - Location: "New York" (or your region)

## Cost Breakdown

- **Basic VM**: $6/month (1GB RAM, 1 CPU, 25GB SSD)
- **Standard VM**: $12/month (2GB RAM, 1 CPU, 50GB SSD)
- **CPU-Optimized**: $18/month (2GB RAM, 2 CPU, 25GB SSD)

## Scaling Up

- Start with 1-2 VMs for testing
- Scale to 10+ VMs as needed
- Use DigitalOcean's API to automate creation
- Set up monitoring and alerts

## Security Tips

1. **Use SSH keys** (not passwords)
2. **Enable firewall** in DigitalOcean dashboard
3. **Use Cloudflare** for secure access (free)
4. **Regular updates** on your VMs

## Next Steps

1. Set up Cloudflare Tunnel for secure access
2. Configure monitoring and alerts
3. Set up automated backups
4. Create multiple VMs in different regions

