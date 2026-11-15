const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox'],
    defaultViewport: { width: 1440, height: 960, deviceScaleFactor: 2 }
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  await page.type('input[type="email"]', 'mona.khalil@learnhebrew.com');
  await page.type('input[type="password"]', 'Password123!');
  const btn = await page.$('button[type="submit"]');
  if (btn) await btn.click();
  await new Promise(r => setTimeout(r, 3000));
  await page.goto('http://localhost:3000/teacher?tab=calendar', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('Attendance')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(__dirname, '../docs/manual/screenshots/24_teacher_attendance_modal.png') });
  await browser.close();
  console.log('Captured teacher attendance modal successfully!');
})();
