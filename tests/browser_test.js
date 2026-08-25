import puppeteer from 'puppeteer';

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1300, height: 780 });

  const consoleErrors = [];
  const consoleLogs = [];

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      consoleErrors.push(text);
      console.error(`PAGE ERROR: ${text}`);
    } else {
      consoleLogs.push(text);
      console.log(`PAGE LOG: ${text}`);
    }
  });

  page.on('response', response => {
    const status = response.status();
    if (!response.ok() && status !== 304) {
      const url = response.url();
      consoleErrors.push(`Failed to load resource: ${url} - status ${status}`);
      console.error(`HTTP ERROR: ${url} - status ${status}`);
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.message);
    console.error(`PAGE UNCAUGHT EXCEPTION: ${err.message}`);
  });

  console.log('Navigating to http://localhost:5173/...');
  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 10000 });
  } catch (e) {
    console.error('Navigation failed, retrying once...', e);
    await page.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 10000 });
  }

  console.log('Page loaded, waiting 5 seconds for connection and canvas rendering...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  const screenshotPath = "C:\\Users\\SirBill's\\.gemini\\antigravity\\brain\\5edd0d75-1757-48f4-bc21-7bb7d7005d58\\phase14_screenshot.png";
  console.log(`Taking screenshot and saving to: ${screenshotPath}`);
  await page.screenshot({ path: screenshotPath });

  console.log('Closing browser...');
  await browser.close();

  console.log('\n--- BROWSER VERIFICATION SUMMARY ---');
  console.log(`Console Logs Captured: ${consoleLogs.length}`);
  console.log(`Console Errors Captured: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log('Errors:');
    consoleErrors.forEach(err => console.log(` - ${err}`));
    process.exit(1);
  } else {
    console.log('Success! No console errors detected.');
    process.exit(0);
  }
})();
