const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Dashboard
    console.log('Navigating to Dashboard...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/dashboard.png', fullPage: true });
    console.log('✓ Dashboard screenshot captured');

    // Turns Management
    console.log('Navigating to Turns Management...');
    await page.goto('http://localhost:3000/turns');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/turns.png', fullPage: true });
    console.log('✓ Turns Management screenshot captured');

    // Properties
    console.log('Navigating to Properties...');
    await page.goto('http://localhost:3000/properties');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/properties.png', fullPage: true });
    console.log('✓ Properties screenshot captured');

    // Vendors
    console.log('Navigating to Vendors...');
    await page.goto('http://localhost:3000/vendors');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/vendors.png', fullPage: true });
    console.log('✓ Vendors screenshot captured');

    // Reports
    console.log('Navigating to Reports...');
    await page.goto('http://localhost:3000/reports');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/reports.png', fullPage: true });
    console.log('✓ Reports screenshot captured');

    // Settings
    console.log('Navigating to Settings...');
    await page.goto('http://localhost:3000/settings');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/settings.png', fullPage: true });
    console.log('✓ Settings screenshot captured');

    console.log('\nAll screenshots captured successfully!');
  } catch (error) {
    console.error('Error capturing screenshots:', error);
  } finally {
    await browser.close();
  }
})();