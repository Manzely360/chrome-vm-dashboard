// Demo Script for Chrome VM Dashboard
// This script demonstrates various automation capabilities

// Example 1: Basic Navigation and Data Extraction
async function basicNavigation() {
  console.log('🚀 Starting basic navigation demo...');
  
  // Navigate to a website
  await page.goto('https://example.com');
  
  // Get page information
  const title = await page.title();
  const url = page.url();
  const content = await page.content();
  
  console.log('Page Title:', title);
  console.log('Current URL:', url);
  
  return {
    title,
    url,
    contentLength: content.length,
    timestamp: new Date().toISOString()
  };
}

// Example 2: Form Interaction
async function formInteraction() {
  console.log('📝 Starting form interaction demo...');
  
  // Navigate to a form page
  await page.goto('https://httpbin.org/forms/post');
  
  // Fill out the form
  await page.type('input[name="custname"]', 'John Doe');
  await page.type('input[name="custtel"]', '555-1234');
  await page.type('input[name="custemail"]', 'john@example.com');
  await page.select('select[name="size"]', 'large');
  await page.type('textarea[name="comments"]', 'This is a test order');
  
  // Submit the form
  await page.click('input[type="submit"]');
  
  // Wait for response
  await page.waitForNavigation();
  
  return {
    success: true,
    url: page.url(),
    message: 'Form submitted successfully'
  };
}

// Example 3: Data Scraping
async function dataScraping() {
  console.log('📊 Starting data scraping demo...');
  
  // Navigate to a page with data
  await page.goto('https://quotes.toscrape.com/');
  
  // Extract quotes
  const quotes = await page.$$eval('.quote', elements => 
    elements.map(el => ({
      text: el.querySelector('.text')?.textContent?.trim(),
      author: el.querySelector('.author')?.textContent?.trim(),
      tags: Array.from(el.querySelectorAll('.tag')).map(tag => tag.textContent?.trim())
    }))
  );
  
  return {
    quotes,
    count: quotes.length,
    timestamp: new Date().toISOString()
  };
}

// Example 4: Screenshot and Element Interaction
async function screenshotDemo() {
  console.log('📸 Starting screenshot demo...');
  
  // Navigate to a page
  await page.goto('https://github.com');
  
  // Take a full page screenshot
  const screenshot = await page.screenshot({ fullPage: true });
  
  // Get specific element text
  const heroText = await page.$eval('h1', el => el.textContent);
  
  return {
    screenshot: screenshot.toString('base64'),
    heroText,
    url: page.url()
  };
}

// Example 5: API Testing
async function apiTesting() {
  console.log('🔌 Starting API testing demo...');
  
  // Navigate to a page that makes API calls
  await page.goto('https://httpbin.org/json');
  
  // Wait for content to load
  await page.waitForSelector('pre');
  
  // Get the JSON content
  const jsonContent = await page.$eval('pre', el => el.textContent);
  const data = JSON.parse(jsonContent);
  
  return {
    apiData: data,
    success: true
  };
}

// Main execution function
async function runDemo() {
  try {
    console.log('🎯 Chrome VM Dashboard Demo Starting...');
    
    // Run different demos based on URL or parameters
    const currentUrl = page.url();
    
    if (currentUrl.includes('example.com')) {
      return await basicNavigation();
    } else if (currentUrl.includes('httpbin.org/forms')) {
      return await formInteraction();
    } else if (currentUrl.includes('quotes.toscrape.com')) {
      return await dataScraping();
    } else if (currentUrl.includes('github.com')) {
      return await screenshotDemo();
    } else if (currentUrl.includes('httpbin.org/json')) {
      return await apiTesting();
    } else {
      // Default demo
      return await basicNavigation();
    }
  } catch (error) {
    console.error('❌ Demo failed:', error);
    return {
      error: error.message,
      success: false
    };
  }
}

// Execute the demo
return await runDemo();
