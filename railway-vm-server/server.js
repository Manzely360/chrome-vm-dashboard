const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const VM_ID = process.env.VM_ID || uuidv4();

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
      `--user-data-dir=/tmp/chrome-profile-${VM_ID}`,
      '--window-size=1920,1080',
      '--start-maximized',
      '--headless'
    ];

    browser = await puppeteer.launch({
      headless: true,
      args: browserArgs,
      defaultViewport: null
    });

    page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navigate to Google by default
    await page.goto('https://www.google.com', { waitUntil: 'networkidle2' });
    
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

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Chrome VM Server',
    vm_id: VM_ID,
    status: browser ? 'ready' : 'initializing',
    endpoints: {
      health: '/health',
      info: '/info',
      run: 'POST /run',
      navigate: 'POST /browser/navigate',
      restart: 'POST /browser/restart'
    }
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Chrome VM Server running on port ${PORT}`);
  console.log(`🆔 VM ID: ${VM_ID}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
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
