# Chrome VM Dashboard

A complete browser farm dashboard system that allows you to create and manage Chrome VMs in the cloud, run automated scripts via Puppeteer, and control VMs through NoVNC web interfaces.

## 🚀 Live Deployment

**Frontend Dashboard**: https://chrome-vm-frontend-mp5mog8xn-manzely360-apps.vercel.app  
**Backend API**: https://pacific-blessing-production.up.railway.app  
**VM Hosting**: https://chrome-vm-workers.mgmt-5e1.workers.dev

## 🚀 Features

- **VM Management**: Create, monitor, and delete Chrome VMs on demand
- **NoVNC Integration**: Control VMs directly from your browser
- **Script Execution**: Run JavaScript/Puppeteer scripts on any VM
- **Real-time Monitoring**: Track VM status and script execution
- **Secure Access**: Cloudflare Tunnels for secure remote access
- **Persistent Sessions**: Chrome profiles persist across sessions
- **Auto-scaling**: Automatic VM provisioning and cleanup

## 🏗️ Architecture

```
┌─────────────────────────────────┐    ┌─────────────────────────────────┐    ┌─────────────────────────────────┐
│        Frontend Dashboard       │    │         Backend API             │    │        VM Hosting Service       │
│        (Vercel)                 │◄──►│        (Railway)                │◄──►│     (Cloudflare Workers)        │
│  chrome-vm-frontend.vercel.app  │    │ pacific-blessing.railway.app    │    │ chrome-vm-workers.workers.dev   │
└─────────────────────────────────┘    └─────────────────────────────────┘    └─────────────────────────────────┘
         │                                       │                                       │
         │                                       │                                       │
         ▼                                       ▼                                       ▼
┌─────────────────────────────────┐    ┌─────────────────────────────────┐    ┌─────────────────────────────────┐
│        Cloudflare CDN           │    │        D1 Database              │    │      Google Cloud VMs           │
│        (Global Edge)            │    │     (Persistent Storage)        │    │     (Real VM Provisioning)      │
└─────────────────────────────────┘    └─────────────────────────────────┘    └─────────────────────────────────┘
```

## 📋 Prerequisites

- **Node.js** 18+ 
- **Terraform** 1.0+
- **AWS Account** (or GCP)
- **Cloudflare Account** (for secure access)
- **SSH Key Pair** for EC2 access

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd chrome-vm-dashboard
```

### 2. Set Up Infrastructure

#### AWS Setup

1. **Configure AWS credentials**:
   ```bash
   aws configure
   ```

2. **Create SSH key pair**:
   ```bash
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/chrome-vm-key
   ```

3. **Configure Terraform**:
   ```bash
   cd terraform
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

4. **Deploy infrastructure**:
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

### 3. Set Up Backend API

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

### 4. Set Up Dashboard Frontend

```bash
cd dashboard
npm install
npm run dev
```

### 5. Configure Cloudflare Tunnels

```bash
cd cloudflare
chmod +x setup-tunnel.sh
./setup-tunnel.sh your-domain.com
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=http://localhost:3000
DOMAIN_NAME=your-domain.com
LOG_LEVEL=info
```

#### Dashboard (next.config.js)
```javascript
module.exports = {
  // Update API URL if different
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
};
```

### Terraform Variables

```hcl
aws_region = "us-west-2"
instance_type = "t3.medium"
min_instances = 1
max_instances = 10
desired_instances = 3
ssh_public_key = "ssh-rsa AAAAB3NzaC1yc2E..."
dashboard_url = "https://your-dashboard.com"
domain_name = "your-domain.com"
```

## 🚀 Usage

### 1. Access the Dashboard

Open your browser and navigate to:
- **Live Production**: https://chrome-vm-frontend-mp5mog8xn-manzely360-apps.vercel.app
- **Local Development**: http://localhost:3000

### 2. Create a VM

1. Click the **"+VM"** button
2. Enter a name for your VM
3. Select an instance type
4. Click **"Create VM"**

The VM will be provisioned automatically (takes ~2-3 minutes).

### 3. Control VMs via NoVNC

1. Once a VM is ready, click the **external link icon** on the VM card
2. This opens the NoVNC interface in a new tab
3. You can now control the VM directly from your browser
4. Log into Google or other services as needed

### 4. Run Scripts

1. Click **"Run Script"** on any ready VM
2. Enter your JavaScript code or upload a script file
3. Configure options:
   - **Screenshot**: Take a screenshot after execution
   - **CSS Selector**: Extract text from specific elements
   - **Wait Time**: Add delay before execution
4. Click **"Run Script"**

### 5. Example Scripts

#### Basic Navigation
```javascript
// Navigate to a website and get the title
await page.goto('https://example.com');
const title = await page.title();
const url = page.url();
return { title, url };
```

#### Form Interaction
```javascript
// Fill out a form and submit
await page.goto('https://example.com/login');
await page.type('#username', 'your-username');
await page.type('#password', 'your-password');
await page.click('#login-button');
await page.waitForNavigation();
return { success: true, url: page.url() };
```

#### Data Extraction
```javascript
// Extract data from a page
await page.goto('https://example.com/products');
const products = await page.$$eval('.product', elements => 
  elements.map(el => ({
    name: el.querySelector('.name')?.textContent,
    price: el.querySelector('.price')?.textContent
  }))
);
return { products };
```

## 🔒 Security

### Cloudflare Access

The system uses Cloudflare Access for secure authentication:

1. **Configure Access Policies**: Set up email-based access control
2. **Team Domain**: Configure your team domain in Cloudflare
3. **Zero Trust**: All access goes through Cloudflare's security layer

### VM Security

- **Isolated VMs**: Each VM runs in its own security group
- **No Direct Access**: VMs are not directly accessible from the internet
- **Encrypted Storage**: EBS volumes are encrypted
- **IAM Roles**: VMs use least-privilege IAM roles

## 📊 Monitoring

### Health Checks

- **Backend API**: `GET /api/health`
- **VM Agents**: `GET /health` on each VM
- **Database**: SQLite with connection monitoring

### Logs

- **Backend Logs**: `backend/logs/`
- **VM Logs**: `/var/log/chrome-agent/` on each VM
- **System Logs**: `journalctl -u chrome-agent.service`

### Metrics

- **VM Status**: Real-time status updates
- **Script Execution**: Success/failure rates
- **Resource Usage**: CPU, memory, disk usage

## 🛠️ Development

### Local Development

1. **Start Backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend**:
   ```bash
   cd dashboard
   npm run dev
   ```

3. **Access**: http://localhost:3000

### Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd dashboard
npm test
```

### Adding New Features

1. **Backend**: Add routes in `backend/routes/`
2. **Frontend**: Add components in `dashboard/components/`
3. **Database**: Update schema in `backend/database/init.js`

## 🚨 Troubleshooting

### Common Issues

#### VM Not Starting
```bash
# Check VM status
terraform show

# Check logs
aws logs describe-log-groups
aws logs get-log-events --log-group-name /aws/ec2/chrome-vm
```

#### Script Execution Failing
```bash
# Check agent logs
ssh -i ~/.ssh/chrome-vm-key ubuntu@<vm-ip>
journalctl -u chrome-agent.service -f
```

#### NoVNC Not Loading
```bash
# Check NoVNC service
systemctl status chrome-desktop.service
systemctl status cloudflared.service
```

### Debug Mode

Enable debug logging:

```bash
# Backend
export LOG_LEVEL=debug
npm start

# Frontend
NODE_ENV=development npm run dev
```

## 📈 Scaling

### Horizontal Scaling

- **Auto Scaling Group**: Automatically scales VMs based on demand
- **Load Balancer**: Distributes script execution across VMs
- **Database**: SQLite can be replaced with PostgreSQL for production

### Vertical Scaling

- **Instance Types**: Use larger instances for heavy workloads
- **Storage**: Increase EBS volume size
- **Memory**: Add swap space for Chrome processes

## 🔄 Updates

### Updating VMs

1. **Create new AMI** with updated software
2. **Update launch template** in Terraform
3. **Rolling update** through Auto Scaling Group

### Updating Dashboard

1. **Backend**: Deploy new version
2. **Frontend**: Build and deploy static files
3. **Database**: Run migration scripts if needed

## 📝 API Reference

### VM Management

```bash
# List VMs
GET /api/vms

# Create VM
POST /api/vms
{
  "name": "My VM",
  "instanceType": "t3.medium"
}

# Delete VM
DELETE /api/vms/{id}
```

### Script Execution

```bash
# Run script
POST /api/vms/{id}/run-script
{
  "script": "await page.goto('https://example.com');",
  "screenshot": true,
  "selector": "#main-content"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Documentation**: [Wiki](https://github.com/your-repo/wiki)

## 🙏 Acknowledgments

- [Puppeteer](https://pptr.dev/) for browser automation
- [NoVNC](https://novnc.com/) for web-based VNC
- [Cloudflare](https://cloudflare.com/) for secure tunneling
- [Terraform](https://terraform.io/) for infrastructure management
