const puppeteer = require('puppeteer');
const path = require('path');

async function takeScreenshots() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Navigate to the Manga Studio
  await page.goto('http://localhost:3000/manga-studio/playground');
  
  // Wait for the app to load
  await page.waitForSelector('[data-testid="manga-studio"]', { timeout: 10000 });
  
  const screenshots = [];
  
  // 1. Initial view - empty canvas
  await page.screenshot({ 
    path: 'screenshots/01-initial-view.png',
    fullPage: true 
  });
  screenshots.push('01-initial-view.png');
  
  // 2. Add a panel
  await page.click('[data-testid="add-panel-btn"]');
  await page.waitForTimeout(1000);
  await page.screenshot({ 
    path: 'screenshots/02-panel-added.png',
    fullPage: true 
  });
  screenshots.push('02-panel-added.png');
  
  // 3. Add a speech bubble
  await page.click('[data-testid="add-bubble-btn"]');
  await page.waitForTimeout(500);
  await page.screenshot({ 
    path: 'screenshots/03-bubble-added.png',
    fullPage: true 
  });
  screenshots.push('03-bubble-added.png');
  
  // 4. Switch to full page view
  await page.click('[data-testid="fullpage-view-btn"]');
  await page.waitForTimeout(500);
  await page.screenshot({ 
    path: 'screenshots/04-fullpage-view.png',
    fullPage: true 
  });
  screenshots.push('04-fullpage-view.png');
  
  // 5. Show timeline
  await page.click('[data-testid="timeline-toggle-btn"]');
  await page.waitForTimeout(500);
  await page.screenshot({ 
    path: 'screenshots/05-timeline-visible.png',
    fullPage: true 
  });
  screenshots.push('05-timeline-visible.png');
  
  // 6. Open AI Manga tab
  await page.click('[data-testid="ai-manga-tab"]');
  await page.waitForTimeout(500);
  await page.screenshot({ 
    path: 'screenshots/06-ai-manga-tab.png',
    fullPage: true 
  });
  screenshots.push('06-ai-manga-tab.png');
  
  // 7. Show panel templates
  await page.click('[data-testid="panels-tab"]');
  await page.waitForTimeout(500);
  await page.screenshot({ 
    path: 'screenshots/07-panel-templates.png',
    fullPage: true 
  });
  screenshots.push('07-panel-templates.png');
  
  // 8. Show bubble presets
  await page.click('[data-testid="bubbles-tab"]');
  await page.waitForTimeout(500);
  await page.screenshot({ 
    path: 'screenshots/08-bubble-presets.png',
    fullPage: true 
  });
  screenshots.push('08-bubble-presets.png');
  
  console.log('Screenshots captured:', screenshots);
  await browser.close();
}

// Create screenshots directory
const fs = require('fs');
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

takeScreenshots().catch(console.error);
