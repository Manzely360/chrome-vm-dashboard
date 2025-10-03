const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const VM_ID = process.env.VM_ID || uuidv4();
const NODE_ENV = process.env.NODE_ENV || 'production';
const RAILWAY_STATIC_URL = process.env.RAILWAY_STATIC_URL;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://chrome-vm-dashboard.vercel.app',
    'https://chrome-vm-frontend.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '50mb' }));

// Global browser instance
let browser = null;
let page = null;

// Initialize browser
async function initBrowser() {
  try {
    console.log('🚀 Initializing Chrome browser...');
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log(`🆔 VM ID: ${VM_ID}`);
    
    const browserArgs = [
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
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-default-apps',
      '--disable-sync',
      '--disable-translate',
      '--hide-scrollbars',
      '--mute-audio',
      '--no-default-browser-check',
      '--no-pings',
      '--no-zygote',
      '--single-process',
      `--user-data-dir=/tmp/chrome-profile-${VM_ID}`,
      '--window-size=1920,1080',
      '--start-maximized',
      '--headless'
    ];

    // Add executable path for Railway/Alpine
    const launchOptions = {
      headless: true,
      args: browserArgs,
      defaultViewport: null,
      timeout: 30000
    };

    // Use system Chrome on Railway/Alpine
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    browser = await puppeteer.launch(launchOptions);

    page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Set timeouts
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);
    
    // Navigate to Google by default
    await page.goto('https://www.google.com', { waitUntil: 'networkidle2' });
    
    console.log('✅ Chrome browser initialized successfully');
    console.log(`🌐 Browser version: ${await browser.version()}`);
  } catch (error) {
    console.error('❌ Failed to initialize browser:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    browser: browser ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    vm_id: VM_ID
  });
});

// VM info endpoint
app.get('/info', (req, res) => {
  res.json({
    vm_id: VM_ID,
    status: browser ? 'ready' : 'initializing',
    chrome_version: '120.0.0.0',
    node_version: process.version,
    created_at: new Date().toISOString(),
    type: 'railway',
    environment: NODE_ENV,
    railway_url: RAILWAY_STATIC_URL,
    platform: 'railway'
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
    console.error('Script execution error:', error);
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
    console.error('Navigation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Browser restart endpoint
app.post('/browser/restart', async (req, res) => {
  try {
    if (browser) {
      await browser.close();
    }
    
    await initBrowser();
    
    res.json({ success: true, message: 'Browser restarted' });
  } catch (error) {
    console.error('Browser restart error:', error);
    res.status(500).json({ error: error.message });
  }
});

// VM Management API Endpoints
app.get('/api/vms', (req, res) => {
  res.json([{
    id: VM_ID,
    name: 'Railway Chrome VM',
    status: browser ? 'ready' : 'initializing',
    novnc_url: `${RAILWAY_STATIC_URL || 'https://chrome-vm-hosting-production.up.railway.app'}/vnc/${VM_ID}`,
    agent_url: `${RAILWAY_STATIC_URL || 'https://chrome-vm-hosting-production.up.railway.app'}/agent/${VM_ID}`,
    public_ip: RAILWAY_STATIC_URL || 'chrome-vm-hosting-production.up.railway.app',
    created_at: new Date().toISOString(),
    chrome_version: '120.0.0.0',
    node_version: process.version,
    server_id: 'railway-server',
    server_name: 'Railway Cloud',
    location: 'Global (Railway)',
    type: 'railway'
  }]);
});

app.post('/api/vms', (req, res) => {
  const { name, server_id } = req.body;
  const newVMId = uuidv4();
  
  res.status(201).json({
    id: newVMId,
    name: name || 'New Railway VM',
    status: 'initializing',
    novnc_url: `${RAILWAY_STATIC_URL || 'https://chrome-vm-hosting-production.up.railway.app'}/vnc/${newVMId}`,
    agent_url: `${RAILWAY_STATIC_URL || 'https://chrome-vm-hosting-production.up.railway.app'}/agent/${newVMId}`,
    public_ip: RAILWAY_STATIC_URL || 'chrome-vm-hosting-production.up.railway.app',
    created_at: new Date().toISOString(),
    chrome_version: '120.0.0.0',
    node_version: process.version,
    server_id: server_id || 'railway-server',
    server_name: 'Railway Cloud',
    location: 'Global (Railway)',
    type: 'railway'
  });
});

app.get('/api/servers', (req, res) => {
  res.json([{
    id: 'railway-server',
    name: 'Railway Cloud',
    host: RAILWAY_STATIC_URL || 'chrome-vm-hosting-production.up.railway.app',
    port: 3000,
    novnc_port: 6080,
    max_vms: 5,
    location: 'Global (Railway)',
    status: 'active',
    health: 'healthy',
    created_at: new Date().toISOString(),
    last_check: new Date().toISOString(),
    type: 'railway'
  }]);
});

app.post('/api/servers', (req, res) => {
  const { name, host, port, novnc_port, max_vms, location } = req.body;
  const serverId = uuidv4();
  
  res.status(201).json({
    id: serverId,
    name: name || 'Custom Server',
    host: host || 'localhost',
    port: port || 3000,
    novnc_port: novnc_port || 6080,
    max_vms: max_vms || 10,
    location: location || 'Unknown',
    status: 'active',
    health: 'healthy',
    created_at: new Date().toISOString(),
    last_check: new Date().toISOString(),
    type: 'custom'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Chrome VM Server - Railway Deployment',
    vm_id: VM_ID,
    status: browser ? 'ready' : 'initializing',
    platform: 'railway',
    environment: NODE_ENV,
    railway_url: RAILWAY_STATIC_URL,
    endpoints: {
      health: '/health',
      info: '/info',
      vms: '/api/vms',
      servers: '/api/servers',
      run: 'POST /run',
      navigate: 'POST /browser/navigate',
      restart: 'POST /browser/restart'
    },
    features: [
      'Puppeteer integration',
      'Headless Chrome',
      'Screenshot capture',
      'Script execution',
      'Browser automation'
    ]
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Chrome VM Server running on port ${PORT}`);
  console.log(`🆔 VM ID: ${VM_ID}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`🚂 Platform: Railway`);
  if (RAILWAY_STATIC_URL) {
    console.log(`🌐 Railway URL: ${RAILWAY_STATIC_URL}`);
  }
  
  // Initialize browser after server starts
  setTimeout(initBrowser, 2000);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});
