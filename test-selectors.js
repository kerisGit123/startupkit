// Quick test to verify data-testid attributes exist
const puppeteer = require('puppeteer');

async function testSelectors() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/manga-studio/playground');
  await page.waitForTimeout(2000);
  
  const selectors = [
    '[data-testid="manga-studio"]',
    '[data-testid="add-panel-btn"]',
    '[data-testid="add-bubble-btn"]',
    '[data-testid="fullpage-view-btn"]',
    '[data-testid="timeline-toggle-btn"]',
    '[data-testid="aimanga-tab"]',
    '[data-testid="panel-tab"]',
    '[data-testid="bubbles-tab"]'
  ];
  
  console.log('Testing selectors...');
  for (const selector of selectors) {
    const element = await page.$(selector);
    console.log(`${selector}: ${element ? '✅ Found' : '❌ Missing'}`);
  }
  
  await browser.close();
}

testSelectors().catch(console.error);
