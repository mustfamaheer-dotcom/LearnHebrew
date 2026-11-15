const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUTPUT_DIR = path.join(__dirname, '../docs/manual/screenshots');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function capture() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Launching Chrome for User Manual captures...');
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
    // 1. Landing Page
    console.log('1. Capturing Landing Page Hero...');
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01_landing_hero.png') });

    // 2. Landing Page Packages
    console.log('2. Capturing Landing Page Packages...');
    const packageSection = await page.$('#packages');
    if (packageSection) {
      await packageSection.scrollIntoView();
      await sleep(1500);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '02_landing_packages.png') });
    }

    // 3. Login Page
    console.log('3. Capturing Login Page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
    await sleep(1500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03_login_page.png') });

    // 4. Log in as Super Admin
    console.log('4. Logging in as Super Admin...');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await sleep(1000);
    
    await page.type('input[type="email"]', 'admin@learnhebrew.com');
    await page.type('input[type="password"]', 'Admin@2026!');
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    await sleep(3500);

    // Ensure we are on /admin
    if (!page.url().includes('/admin')) {
      await page.goto('http://localhost:3000/admin', { waitUntil: 'domcontentloaded' });
      await sleep(2500);
    }

    const adminTabs = [
      { tab: 'overview', file: '04_admin_overview.png', desc: 'Executive Analytics & KPI Overview' },
      { tab: 'users', file: '05_admin_users.png', desc: 'User Directory & Account Creation' },
      { tab: 'roles', file: '06_admin_roles_matrix.png', desc: 'Roles & Permissions Action Matrix' },
      { tab: 'levels', file: '07_admin_curriculum_levels.png', desc: 'Curriculum & Hebrew Levels' },
      { tab: 'session_types', file: '08_admin_session_types.png', desc: 'Session Durations (25/40/55 min)' },
      { tab: 'teachers', file: '09_admin_teachers.png', desc: 'Teacher Rosters & Schedules' },
      { tab: 'bookings', file: '10_admin_bookings.png', desc: 'Lesson Bookings & Operations' },
      { tab: 'packages', file: '11_admin_packages.png', desc: 'Lesson Packages & Allocations' },
      { tab: 'payments', file: '12_admin_payments.png', desc: 'Financial Transactions & Revenue' },
      { tab: 'exams', file: '13_admin_exams.png', desc: 'Exams & Proficiency Assessments' },
      { tab: 'point_rules', file: '14_admin_gamification.png', desc: 'Gamification & Points Engine Rules' },
      { tab: 'reminders_hub', file: '15_admin_reminders_hub.png', desc: 'Automated Reminders & Notifications Hub' },
      { tab: 'surveys', file: '16_admin_reviews_surveys.png', desc: 'Reviews & Feedback Scorecards' },
      { tab: 'landing_cms', file: '17_admin_landing_cms.png', desc: 'Landing Page CMS & Content Editor' },
      { tab: 'system_logs', file: '18_admin_system_logs.png', desc: 'System Audit & Activity Logs' },
    ];

    for (const item of adminTabs) {
      console.log(`Switching to Admin Tab: ${item.desc}...`);
      await page.evaluate((tabName) => {
        window.dispatchEvent(new CustomEvent('engrew:navigate-tab', { detail: { tab: tabName } }));
      }, item.tab);
      await sleep(1500);
      await page.screenshot({ path: path.join(OUTPUT_DIR, item.file) });
    }

    // 5. Sales CRM Dashboard
    console.log('5. Navigating to Sales CRM Dashboard (/sales)...');
    await page.goto('http://localhost:3000/sales', { waitUntil: 'domcontentloaded' });
    await sleep(2500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '19_sales_crm_pipeline.png') });

    // 6. Customer Support Dashboard
    console.log('6. Navigating to Customer Support Helpdesk (/cs)...');
    await page.goto('http://localhost:3000/cs', { waitUntil: 'domcontentloaded' });
    await sleep(2500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '20_support_helpdesk.png') });

    // 7. Teacher Dashboard
    console.log('7. Logging in as Teacher (Mona Khalil)...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await sleep(1000);
    await page.type('input[type="email"]', 'mona.khalil@learnhebrew.com');
    await page.type('input[type="password"]', 'Password123!');
    const teacherSubmit = await page.$('button[type="submit"]');
    if (teacherSubmit) await teacherSubmit.click();
    await sleep(3500);

    console.log('Capturing Teacher Availability Calendar...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '21_teacher_availability_calendar.png') });

    // 8. Student Dashboard
    console.log('8. Logging in as Student (Mustfa Maheer)...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await sleep(1000);
    await page.type('input[type="email"]', 'mustfa.maheer@gmail.com');
    await page.type('input[type="password"]', 'Password123!');
    const studentSubmit = await page.$('button[type="submit"]');
    if (studentSubmit) await studentSubmit.click();
    await sleep(3500);

    console.log('Capturing Student Dashboard & Leaderboards...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '22_student_dashboard_overview.png') });

    await page.evaluate(() => window.scrollBy(0, 600));
    await sleep(1500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '23_student_level_leaderboard.png') });

    console.log('ALL SCREENSHOTS CAPTURED PERFECTLY!');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

capture();
