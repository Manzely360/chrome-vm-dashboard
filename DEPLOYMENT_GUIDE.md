# Chrome VM Dashboard - External Server Deployment Guide

This guide shows you how to deploy Chrome VMs on external cloud services (Railway, Cloudflare, Heroku, etc.) without needing Docker on your local machine.

## 🚀 Quick Start

### 1. Deploy to Railway (Recommended)

Railway is the easiest platform for this setup:

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Create new project
railway init

# 4. Deploy the VM service
railway up
```

### 2. Deploy to Cloudflare Workers

```bash
# 1. Install Wrangler CLI
npm install -g wrangler

# 2. Login to Cloudflare
wrangler login

# 3. Deploy
wrangler deploy
```

### 3. Deploy to Heroku

```bash
# 1. Install Heroku CLI
# Download from https://devcenter.heroku.com/articles/heroku-cli

# 2. Login to Heroku
heroku login

# 3. Create app
heroku create your-chrome-vm-app

# 4. Deploy
git push heroku main
```

## 📋 Server Requirements

Your external server needs to run the Chrome VM Agent with these endpoints:

### Required Endpoints

```javascript
// Health check
GET /health
Response: { "status": "healthy", "browser": "connected" }

// VM info
GET /info
Response: { "vm_id": "vm-1", "status": "ready", "chrome_version": "120.0.0.0" }

// Execute script
POST /run
Body: { "job_id": "test-1", "script": "return document.title;", "screenshot": false }
Response: { "job_id": "test-1", "status": "completed", "result": "..." }

// Navigate browser
POST /browser/navigate
Body: { "url": "https://www.google.com" }
Response: { "success": true }
```

### Required Environment Variables

```bash
NODE_ENV=production
PORT=3000
VM_ID=your-vm-id
DISPLAY=:1
```

## 🔧 Setting Up External Servers

### Option 1: Railway Deployment

1. **Create a new Railway project**
2. **Add these files to your project:**

```dockerfile
# Dockerfile
FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \\
    wget \\
    curl \\
    gnupg \\
    software-properties-common \\
    xvfb \\
    x11vnc \\
    novnc \\
    websockify \\
    xfce4 \\
    xfce4-goodies \\
    google-chrome-stable \\
    nodejs \\
    npm

# Install Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \\
    && apt-get install -y nodejs

# Create user
RUN useradd -m -s /bin/bash chromeuser \\
    && usermod -aG audio chromeuser

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install --production

# Copy application files
COPY agent.js ./
COPY start.sh ./

# Make scripts executable
RUN chmod +x start.sh

# Create directories
RUN mkdir -p /home/chromeuser/.config/google-chrome \\
    && mkdir -p /var/log/supervisor \\
    && chown -R chromeuser:chromeuser /home/chromeuser \\
    && chown -R chromeuser:chromeuser /app

# Expose ports
EXPOSE 3000 6080

# Switch to chrome user
USER chromeuser

# Start all services
CMD ["/app/start.sh"]
```

```json
// package.json
{
  "name": "chrome-vm-agent",
  "version": "1.0.0",
  "main": "agent.js",
  "scripts": {
    "start": "node agent.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "puppeteer": "^21.5.0",
    "cors": "^2.8.5",
    "uuid": "^9.0.1"
  }
}
```

```javascript
// agent.js
const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Global browser instance
let browser = null;
let page = null;

// Initialize browser
async function initBrowser() {
  try {
    console.log('🚀 Initializing Chrome browser...');
    
    browser = await puppeteer.launch({
      headless: false,
      executablePath: '/usr/bin/google-chrome',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        `--user-data-dir=/tmp/chrome-profile-${process.env.VM_ID || 'default'}`,
        '--window-size=1920,1080',
        '--start-maximized'
      ],
      defaultViewport: null
    });

    page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('✅ Chrome browser initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize browser:', error);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    browser: browser ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    vm_id: process.env.VM_ID || 'unknown'
  });
});

// VM info endpoint
app.get('/info', (req, res) => {
  res.json({
    vm_id: process.env.VM_ID || 'unknown',
    status: browser ? 'ready' : 'initializing',
    chrome_version: '120.0.0.0',
    node_version: process.version,
    created_at: new Date().toISOString(),
    type: 'cloud'
  });
});

// Execute script endpoint
app.post('/run', async (req, res) => {
  try {
    const { job_id, script, screenshot = false } = req.body;

    if (!browser || !page) {
      return res.status(503).json({ error: 'Browser not initialized' });
    }

    // Execute script in browser
    const result = await page.evaluate(script);
    
    let screenshotData = null;
    if (screenshot) {
      screenshotData = await page.screenshot({ encoding: 'base64' });
    }

    res.json({
      job_id,
      status: 'completed',
      result,
      timestamp: new Date().toISOString(),
      screenshot: screenshotData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Navigate browser endpoint
app.post('/browser/navigate', async (req, res) => {
  try {
    const { url } = req.body;

    if (!browser || !page) {
      return res.status(503).json({ error: 'Browser not initialized' });
    }

    await page.goto(url, { waitUntil: 'networkidle2' });
    
    res.json({ success: true, url: page.url() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Chrome VM Agent running on port ${PORT}`);
  await initBrowser();
});
```

```bash
#!/bin/bash
# start.sh

# Start Xvfb in the background
Xvfb :1 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &
XVFB_PID=$!

# Wait for Xvfb to start
sleep 2

# Start x11vnc in the background
x11vnc -display :1 -nopw -listen localhost -xkb -ncache 10 -ncache_cr -forever &
VNC_PID=$!

# Start NoVNC in the background
websockify --web=/usr/share/novnc/ 6080 localhost:5900 &
NOVNC_PID=$!

# Start the Node.js agent
cd /app
node agent.js &
AGENT_PID=$!

# Function to handle shutdown
cleanup() {
    echo "Shutting down services..."
    kill $AGENT_PID $NOVNC_PID $VNC_PID $XVFB_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Wait for any process to exit
wait
```

3. **Set environment variables in Railway:**
   - `NODE_ENV=production`
   - `VM_ID=your-unique-vm-id`
   - `DISPLAY=:1`

4. **Deploy:**
   ```bash
   railway up
   ```

### Option 2: Cloudflare Workers

For Cloudflare Workers, you'll need a different approach since they don't support long-running processes. Use Cloudflare Pages with Functions instead.

### Option 3: Heroku

1. **Create a new Heroku app**
2. **Add the same files as Railway**
3. **Set environment variables:**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set VM_ID=your-vm-id
   heroku config:set DISPLAY=:1
   ```
4. **Deploy:**
   ```bash
   git push heroku main
   ```

## 🔗 Adding Servers to Dashboard

Once your external server is deployed, add it to the dashboard:

### Method 1: Through the UI

1. Click "Add Server" in the dashboard
2. Fill in the form:
   - **Name**: `My Railway Server`
   - **Host**: `your-app.railway.app` (or your domain)
   - **Port**: `3000` (or your port)
   - **NoVNC Port**: `6080`
   - **Location**: `Railway Cloud`
   - **Max VMs**: `5`

### Method 2: Via API

```bash
curl -X POST http://localhost:3001/api/servers \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My Railway Server",
    "host": "your-app.railway.app",
    "port": 3000,
    "novnc_port": 6080,
    "max_vms": 5,
    "location": "Railway Cloud"
  }'
```

## 🎯 Creating VMs on External Servers

Once a server is added, you can create VMs on it:

1. **Click "Add VM" in the dashboard**
2. **Select your external server from the dropdown**
3. **Choose instance type and name**
4. **Click "Create VM"**

The system will:
- Create a VM record in the database
- Connect to your external server
- Initialize a Chrome browser instance
- Provide NoVNC access for remote control
- Enable script execution

## 🔧 Troubleshooting

### Common Issues

1. **"Cannot connect to server"**
   - Check if your server is running
   - Verify the host and port are correct
   - Ensure the `/health` endpoint is accessible

2. **"Browser not initialized"**
   - Check server logs for Chrome startup errors
   - Ensure all dependencies are installed
   - Verify DISPLAY environment variable

3. **NoVNC not working**
   - Check if port 6080 is exposed
   - Verify x11vnc is running
   - Check firewall settings

### Server Health Check

Test your server manually:

```bash
# Health check
curl https://your-app.railway.app/health

# VM info
curl https://your-app.railway.app/info

# Execute script
curl -X POST https://your-app.railway.app/run \\
  -H "Content-Type: application/json" \\
  -d '{"job_id": "test", "script": "return document.title;"}'
```

## 📊 Monitoring

The dashboard will automatically:
- Monitor server health
- Show VM status
- Display logs and metrics
- Handle reconnections

## 🚀 Scaling

To scale your setup:

1. **Deploy multiple servers** on different platforms
2. **Add them all to the dashboard**
3. **Create VMs across different servers**
4. **Load balance between servers**

This gives you a distributed Chrome VM farm that can handle multiple users and scripts simultaneously!

## 💡 Pro Tips

1. **Use Railway** for the easiest deployment
2. **Set up monitoring** with external tools
3. **Use environment variables** for configuration
4. **Implement proper logging** for debugging
5. **Set up auto-scaling** based on demand

---

**Need help?** Check the logs in the dashboard terminal or contact support!
