const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = '/tmp/chrome-agent-uploads';
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

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
        '--user-data-dir=/home/chromeuser/.config/google-chrome',
        '--profile-directory=Default',
        '--window-size=1920,1080',
        '--start-maximized'
      ],
      defaultViewport: null
    });

    page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('✅ Chrome browser initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize browser:', error);
    return false;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    browser: browser ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// VM info endpoint
app.get('/info', (req, res) => {
  try {
    const vmInfo = fs.readJsonSync('/opt/chrome-agent/vm-info.json');
    res.json(vmInfo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read VM info' });
  }
});

// Script execution endpoint
app.post('/run', async (req, res) => {
  const { job_id, script, screenshot = false, selector = null, wait_time = 0 } = req.body;
  
  if (!job_id || !script) {
    return res.status(400).json({ error: 'job_id and script are required' });
  }

  console.log(`🎯 Executing job ${job_id}...`);

  try {
    // Ensure browser is initialized
    if (!browser || !page) {
      const initialized = await initBrowser();
      if (!initialized) {
        return res.status(500).json({ error: 'Failed to initialize browser' });
      }
    }

    // Wait if specified
    if (wait_time > 0) {
      await new Promise(resolve => setTimeout(resolve, wait_time));
    }

    // Execute the script in browser context
    const result = await page.evaluate(async (script) => {
      // Create a safe evaluation context
      const context = {
        page: {
          goto: (url) => window.location.href = url,
          title: () => document.title,
          url: () => window.location.href,
          content: () => document.documentElement.outerHTML,
          click: (selector) => {
            const element = document.querySelector(selector);
            if (element) element.click();
          },
          type: (selector, text) => {
            const element = document.querySelector(selector);
            if (element) {
              element.focus();
              element.value = text;
              element.dispatchEvent(new Event('input', { bubbles: true }));
            }
          },
          waitForSelector: (selector, timeout = 30000) => {
            return new Promise((resolve, reject) => {
              const element = document.querySelector(selector);
              if (element) {
                resolve(element);
                return;
              }
              
              const observer = new MutationObserver((mutations, obs) => {
                const element = document.querySelector(selector);
                if (element) {
                  obs.disconnect();
                  resolve(element);
                }
              });
              
              observer.observe(document.body, {
                childList: true,
                subtree: true
              });
              
              setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
              }, timeout);
            });
          },
          screenshot: () => {
            return new Promise((resolve) => {
              html2canvas(document.body).then(canvas => {
                resolve(canvas.toDataURL('image/png'));
              });
            });
          }
        },
        console: {
          log: (...args) => console.log(...args),
          error: (...args) => console.error(...args),
          warn: (...args) => console.warn(...args)
        },
        setTimeout: (fn, delay) => setTimeout(fn, delay),
        setInterval: (fn, delay) => setInterval(fn, delay),
        clearTimeout: (id) => clearTimeout(id),
        clearInterval: (id) => clearInterval(id)
      };

      // Execute the script with context
      const func = new Function('context', `
        const { page, console, setTimeout, setInterval, clearTimeout, clearInterval } = context;
        return (async () => {
          ${script}
        })();
      `);

      return await func(context);
    }, script);

    let screenshotData = null;
    let selectedText = null;

    // Take screenshot if requested
    if (screenshot) {
      try {
        screenshotData = await page.screenshot({
          fullPage: true,
          encoding: 'base64'
        });
      } catch (error) {
        console.error('Screenshot failed:', error);
      }
    }

    // Extract text from selector if specified
    if (selector) {
      try {
        selectedText = await page.$eval(selector, el => el.textContent);
      } catch (error) {
        console.error('Text extraction failed:', error);
      }
    }

    const response = {
      job_id,
      status: 'completed',
      result,
      timestamp: new Date().toISOString(),
      screenshot: screenshotData,
      selected_text: selectedText
    };

    console.log(`✅ Job ${job_id} completed successfully`);
    res.json(response);

  } catch (error) {
    console.error(`❌ Job ${job_id} failed:`, error);
    res.status(500).json({
      job_id,
      status: 'failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// File upload endpoint for scripts
app.post('/upload-script', upload.single('script'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const scriptContent = fs.readFileSync(req.file.path, 'utf8');
  const scriptId = uuidv4();

  // Save script to persistent storage
  const scriptPath = `/opt/chrome-agent/scripts/${scriptId}.js`;
  fs.ensureDirSync(path.dirname(scriptPath));
  fs.writeFileSync(scriptPath, scriptContent);

  // Clean up uploaded file
  fs.removeSync(req.file.path);

  res.json({
    script_id: scriptId,
    path: scriptPath,
    size: scriptContent.length
  });
});

// Get available scripts
app.get('/scripts', (req, res) => {
  try {
    const scriptsDir = '/opt/chrome-agent/scripts';
    fs.ensureDirSync(scriptsDir);
    
    const files = fs.readdirSync(scriptsDir)
      .filter(file => file.endsWith('.js'))
      .map(file => ({
        id: file.replace('.js', ''),
        name: file,
        path: path.join(scriptsDir, file),
        size: fs.statSync(path.join(scriptsDir, file)).size,
        modified: fs.statSync(path.join(scriptsDir, file)).mtime
      }));

    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read scripts directory' });
  }
});

// Execute script by ID
app.post('/run-script/:scriptId', async (req, res) => {
  const { scriptId } = req.params;
  const { screenshot = false, selector = null, wait_time = 0 } = req.body;

  try {
    const scriptPath = `/opt/chrome-agent/scripts/${scriptId}.js`;
    
    if (!fs.existsSync(scriptPath)) {
      return res.status(404).json({ error: 'Script not found' });
    }

    const script = fs.readFileSync(scriptPath, 'utf8');
    const job_id = uuidv4();

    // Execute the script
    req.body = { job_id, script, screenshot, selector, wait_time };
    return app._router.handle(req, res, () => {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to execute script' });
  }
});

// Browser control endpoints
app.post('/browser/restart', async (req, res) => {
  try {
    if (browser) {
      await browser.close();
    }
    browser = null;
    page = null;
    
    const initialized = await initBrowser();
    if (initialized) {
      res.json({ status: 'success', message: 'Browser restarted' });
    } else {
      res.status(500).json({ error: 'Failed to restart browser' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/browser/navigate', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    if (!page) {
      return res.status(500).json({ error: 'Browser not initialized' });
    }

    await page.goto(url, { waitUntil: 'networkidle2' });
    res.json({ 
      status: 'success', 
      url: page.url(),
      title: await page.title()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cleanup endpoint
app.post('/cleanup', async (req, res) => {
  try {
    if (browser) {
      await browser.close();
    }
    browser = null;
    page = null;
    
    // Run cleanup script
    const { exec } = require('child_process');
    exec('/opt/chrome-agent/cleanup.sh', (error, stdout, stderr) => {
      if (error) {
        console.error('Cleanup error:', error);
      }
    });

    res.json({ status: 'success', message: 'Cleanup completed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
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

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Chrome Agent running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 VM Info: http://localhost:${PORT}/info`);
  
  // Initialize browser on startup
  await initBrowser();
  
  // Register VM with dashboard (if available)
  try {
    const { exec } = require('child_process');
    exec('/opt/chrome-agent/register-vm.sh', (error, stdout, stderr) => {
      if (error) {
        console.log('VM registration failed (dashboard may not be available):', error.message);
      } else {
        console.log('✅ VM registered with dashboard');
      }
    });
  } catch (error) {
    console.log('VM registration skipped:', error.message);
  }
});

module.exports = app;
