const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUTPUT_DIR = path.join(__dirname, '../docs/manual/screenshots');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureNew() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Launching Chrome to capture new feature screenshots...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960'],
    defaultViewport: {
      width: 1440,
      height: 960,
      deviceScaleFactor: 2,
    },
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(20000);

  try {
    // 1. Admin login & capture Family Modal / CRM
    console.log('Logging in as Admin...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
    await sleep(1500);

    await page.type('input[type="email"]', 'admin@learnhebrew.com');
    await page.type('input[type="password"]', 'Admin@2026!');
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    await sleep(3500);

    // Go to admin users tab
    console.log('Navigating to Admin CRM...');
    await page.goto('http://localhost:3000/admin?tab=users', { waitUntil: 'domcontentloaded' });
    await sleep(2500);

    // Click on Family modal button if present (Users with family / children or quick actions)
    const familyButtons = await page.$$('button');
    for (const btn of familyButtons) {
      const text = await page.evaluate(el => el.innerText || el.title || el.getAttribute('aria-label'), btn);
      if (text && (text.includes('Family') || text.includes('عائلة') || text.includes('Household'))) {
        await btn.click();
        await sleep(1500);
        break;
      }
    }

    await page.screenshot({ path: path.join(OUTPUT_DIR, '25_family_management_modal.png') });
    console.log('Captured 25_family_management_modal.png');

    // 2. Student Dashboard with CEFR Games & Levels
    console.log('Switching to Student Portal...');
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
    await sleep(1000);

    await page.type('input[type="email"]', 'omar.farouk@gmail.com');
    await page.type('input[type="password"]', 'Student@2026!');
    const studentSubmit = await page.$('button[type="submit"]');
    if (studentSubmit) await studentSubmit.click();
    await sleep(3000);

    await page.goto('http://localhost:3000/student?tab=games', { waitUntil: 'domcontentloaded' });
    await sleep(2500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '26_cefr_games_practice.png') });
    console.log('Captured 26_cefr_games_practice.png');

    // 3. Arabic / RTL View
    console.log('Switching to Arabic RTL View...');
    await page.goto('http://localhost:3000/student', { waitUntil: 'domcontentloaded' });
    await sleep(1500);

    // Find language switcher button or set localStorage
    await page.evaluate(() => {
      try {
        const authData = JSON.parse(localStorage.getItem('auth-storage') || '{}');
        if (authData.state) {
          authData.state.language = 'ar';
          localStorage.setItem('auth-storage', JSON.stringify(authData));
        }
        document.documentElement.dir = 'rtl';
        document.documentElement.lang = 'ar';
      } catch (e) {}
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await sleep(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '27_rtl_bilingual_view.png') });
    console.log('Captured 27_rtl_bilingual_view.png');

  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

captureNew();
