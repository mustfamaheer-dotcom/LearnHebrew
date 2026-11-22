const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SCREENSHOTS_DIR = path.join(__dirname, '../docs/manual/screenshots');
const LOGO_PATH = path.join(__dirname, '../Logo/EngrewLogo.png');
const OUTPUT_PDF = path.join(__dirname, '../Engrew_Platform_Owner_Manual.pdf');
const DOCS_PDF = path.join(__dirname, '../docs/Engrew_Platform_Owner_Manual.pdf');

function getBase64Image(filePath) {
  if (!fs.existsSync(filePath)) return '';
  const ext = path.extname(filePath).replace('.', '');
  const data = fs.readFileSync(filePath).toString('base64');
  return `data:image/${ext === 'png' ? 'png' : 'jpeg'};base64,${data}`;
}

const logoBase64 = getBase64Image(LOGO_PATH);

// Helper to load screenshots as base64
const img = (filename) => {
  const p = path.join(SCREENSHOTS_DIR, filename);
  return getBase64Image(p);
};

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Engrew Academy - Platform Owner & Administrator Manual</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    @page {
      size: A4;
      margin: 18mm 16mm 22mm 16mm;
      @bottom-right {
        content: counter(page);
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1e293b;
      line-height: 1.6;
      font-size: 10pt;
      margin: 0;
      padding: 0;
      background-color: #ffffff;
    }

    /* Page Breaks */
    .page-break {
      page-break-before: always;
      break-before: page;
    }

    .no-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Cover Page */
    .cover-page {
      min-height: 98vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      padding: 20px 10px;
    }

    .cover-header {
      border-bottom: 2px solid #0d9488;
      padding-bottom: 25px;
    }

    .cover-logo-wrapper {
      max-width: 280px;
      margin-bottom: 20px;
    }

    .cover-logo-wrapper img {
      width: 100%;
      height: auto;
      object-fit: contain;
    }

    .cover-badge {
      display: inline-block;
      background: #f0fdfa;
      color: #0f766e;
      border: 1px solid #ccfbf1;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .cover-body {
      margin: 50px 0;
    }

    .cover-title {
      font-size: 28pt;
      font-weight: 800;
      line-height: 1.15;
      color: #0f172a;
      margin: 0 0 15px 0;
      letter-spacing: -0.02em;
    }

    .cover-title span {
      color: #0d9488;
    }

    .cover-subtitle {
      font-size: 13pt;
      color: #475569;
      line-height: 1.5;
      margin: 0 0 30px 0;
      max-width: 650px;
    }

    .cover-meta-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin-top: 30px;
    }

    .cover-meta-item {
      display: flex;
      flex-direction: column;
    }

    .cover-meta-label {
      font-size: 7.5pt;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.06em;
      margin-bottom: 4px;
    }

    .cover-meta-value {
      font-size: 10pt;
      font-weight: 700;
      color: #0f172a;
    }

    .cover-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8.5pt;
      color: #64748b;
    }

    /* Headings & Typography */
    h1, h2, h3, h4 {
      color: #0f172a;
      font-weight: 800;
      letter-spacing: -0.015em;
      margin-top: 0;
    }

    .chapter-header {
      margin-bottom: 24px;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 12px;
    }

    .chapter-tag {
      font-size: 8pt;
      font-weight: 800;
      color: #0d9488;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 4px;
      display: block;
    }

    .chapter-title {
      font-size: 18pt;
      margin: 0 0 6px 0;
      line-height: 1.25;
    }

    .chapter-desc {
      font-size: 10pt;
      color: #475569;
      margin: 0;
    }

    h3 {
      font-size: 12pt;
      margin: 20px 0 10px 0;
      color: #0f172a;
    }

    p {
      margin: 0 0 12px 0;
      color: #334155;
    }

    /* Callout Boxes */
    .callout {
      border-radius: 10px;
      padding: 14px 16px;
      margin: 16px 0;
      font-size: 9pt;
      border-left: 4px solid;
    }

    .callout-info {
      background: #f0fdfa;
      border-color: #0d9488;
      color: #134e4a;
    }

    .callout-warning {
      background: #fffbeb;
      border-color: #d97706;
      color: #78350f;
    }

    .callout-pro-tip {
      background: #f5f3ff;
      border-color: #7c3aed;
      color: #4c1d95;
    }

    .callout-title {
      font-weight: 800;
      margin-bottom: 4px;
      font-size: 9.5pt;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* Numbered Step Instructions */
    .steps-list {
      margin: 14px 0 20px 0;
      padding: 0;
      list-style: none;
      counter-reset: step-counter;
    }

    .step-item {
      counter-increment: step-counter;
      position: relative;
      padding-left: 36px;
      margin-bottom: 14px;
    }

    .step-item::before {
      content: counter(step-counter);
      position: absolute;
      left: 0;
      top: 0;
      width: 24px;
      height: 24px;
      background: #0f172a;
      color: #ffffff;
      font-weight: 800;
      font-size: 9pt;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 24px;
      text-align: center;
    }

    .step-title {
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 2px;
      font-size: 9.5pt;
    }

    .step-body {
      color: #475569;
      font-size: 9pt;
    }

    /* Screenshots */
    .screenshot-container {
      margin: 18px 0;
      border-radius: 10px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .screenshot-header {
      background: #f1f5f9;
      border-bottom: 1px solid #e2e8f0;
      padding: 6px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 7.5pt;
      font-family: 'JetBrains Mono', monospace;
      color: #64748b;
    }

    .screenshot-dots {
      display: flex;
      gap: 5px;
    }

    .screenshot-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #cbd5e1;
    }

    .screenshot-img-wrapper {
      width: 100%;
      background: #ffffff;
    }

    .screenshot-img-wrapper img {
      width: 100%;
      height: auto;
      display: block;
    }

    .screenshot-caption {
      padding: 8px 14px;
      background: #ffffff;
      border-top: 1px solid #f1f5f9;
      font-size: 8pt;
      color: #475569;
      font-style: italic;
    }

    .screenshot-caption strong {
      color: #0f172a;
      font-style: normal;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }

    th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 8px 12px;
      border: 1px solid #0f172a;
    }

    td {
      padding: 7px 12px;
      border: 1px solid #e2e8f0;
      color: #334155;
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 700;
    }

    .badge-teal { background: #ccfbf1; color: #0f766e; }
    .badge-indigo { background: #e0e7ff; color: #3730a3; }
    .badge-amber { background: #fef3c7; color: #92400e; }
    .badge-slate { background: #f1f5f9; color: #334155; }

    /* Key Value Grid */
    .kv-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin: 16px 0;
    }

    .kv-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
    }

    .kv-key {
      font-size: 7.5pt;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    .kv-val {
      font-size: 9.5pt;
      font-weight: 600;
      color: #0f172a;
    }

    /* TOC */
    .toc-container {
      margin: 20px 0;
    }

    .toc-item {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 4px 0;
      border-bottom: 1px dotted #cbd5e1;
      font-size: 8.5pt;
    }

    .toc-title {
      font-weight: 600;
      color: #0f172a;
    }

    .toc-page {
      font-weight: 700;
      color: #0d9488;
      font-family: 'JetBrains Mono', monospace;
    }
  </style>
</head>
<body>

  <!-- ==================== COVER PAGE ==================== -->
  <div class="cover-page">
    <div class="cover-header">
      <div class="cover-logo-wrapper">
        <img src="${logoBase64}" alt="Engrew Logo" />
      </div>
      <div class="cover-badge">Confidential & Proprietary • Platform Owner Eyes Only</div>
    </div>

    <div class="cover-body">
      <h1 class="cover-title">Engrew Academy<br><span>Platform Owner Manual</span></h1>
      <p class="cover-subtitle">
        The Definitive Operational, Pedagogical, Financial & Architectural Guide for Managing the Complete Hebrew & English Academy Platform.
      </p>

      <div class="cover-meta-grid">
        <div class="cover-meta-item">
          <span class="cover-meta-label">Platform Edition</span>
          <span class="cover-meta-value">Version 2.5 Enterprise</span>
        </div>
        <div class="cover-meta-item">
          <span class="cover-meta-label">Primary Authority</span>
          <span class="cover-meta-value">Platform Owner / Super Admin</span>
        </div>
        <div class="cover-meta-item">
          <span class="cover-meta-label">Publication Date</span>
          <span class="cover-meta-value">November 2026 (Updated)</span>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <div>Engrew Hebrew & English Academy • Multi-Duration Learning Architecture</div>
      <div>Israel / Global Operations</div>
    </div>
  </div>

  <!-- ==================== TABLE OF CONTENTS ==================== -->
  <div class="page-break"></div>
  <div class="chapter-header">
    <span class="chapter-tag">Document Navigation</span>
    <h2 class="chapter-title">Table of Contents</h2>
    <p class="chapter-desc">Quick reference index to all platform operational domains and workflows.</p>
  </div>

  <div class="toc-container">
    <div class="toc-item"><span class="toc-title">1. Platform Architecture & Ecosystem Overview</span><span class="toc-page">Ch. 1</span></div>
    <div class="toc-item"><span class="toc-title">2. Authentication, Security Gateway & Session Policies</span><span class="toc-page">Ch. 2</span></div>
    <div class="toc-item"><span class="toc-title">3. Executive Analytics, Revenue & KPI Scorecard</span><span class="toc-page">Ch. 3</span></div>
    <div class="toc-item"><span class="toc-title">4. User Management, Staff Onboarding & Family Accounts</span><span class="toc-page">Ch. 4</span></div>
    <div class="toc-item"><span class="toc-title">5. Roles & Permissions Action Matrix (Enterprise RBAC)</span><span class="toc-page">Ch. 5</span></div>
    <div class="toc-item"><span class="toc-title">6. Curriculum Framework & Hebrew CEFR Proficiency Levels</span><span class="toc-page">Ch. 6</span></div>
    <div class="toc-item"><span class="toc-title">7. Multi-Duration Session Engine (25, 40, 55 Minutes)</span><span class="toc-page">Ch. 7</span></div>
    <div class="toc-item"><span class="toc-title">8. Teacher Operations, Calendars & 1-Click Zoom Classrooms</span><span class="toc-page">Ch. 8</span></div>
    <div class="toc-item"><span class="toc-title">9. Central Booking Management & Slot Conflict Resolution</span><span class="toc-page">Ch. 9</span></div>
    <div class="toc-item"><span class="toc-title">10. Post-Session Attendance & Practice Game Unlocking</span><span class="toc-page">Ch. 10</span></div>
    <div class="toc-item"><span class="toc-title">11. Lesson Packages, Student Allocations & Checkout Engine</span><span class="toc-page">Ch. 11</span></div>
    <div class="toc-item"><span class="toc-title">12. Financial Transactions, Revenue Ledger & Refunds</span><span class="toc-page">Ch. 12</span></div>
    <div class="toc-item"><span class="toc-title">13. Exams, Assessments & Level Certification</span><span class="toc-page">Ch. 13</span></div>
    <div class="toc-item"><span class="toc-title">14. Gamification Engine: XP, Streaks & CEFR Interactive Games</span><span class="toc-page">Ch. 14</span></div>
    <div class="toc-item"><span class="toc-title">15. 24/7 Automated Reminders Hub & Notification Center</span><span class="toc-page">Ch. 15</span></div>
    <div class="toc-item"><span class="toc-title">16. Sales CRM Pipeline & Deal Conversion Tracking</span><span class="toc-page">Ch. 16</span></div>
    <div class="toc-item"><span class="toc-title">17. Customer Support Helpdesk & SLA Resolution Engine</span><span class="toc-page">Ch. 17</span></div>
    <div class="toc-item"><span class="toc-title">18. Feedback Analytics & Multi-Use Review Links</span><span class="toc-page">Ch. 18</span></div>
    <div class="toc-item"><span class="toc-title">19. Landing Page CMS & Brand Management</span><span class="toc-page">Ch. 19</span></div>
    <div class="toc-item"><span class="toc-title">20. System Audit Logs, Health Monitoring & Owner Routine Checklist</span><span class="toc-page">Ch. 20</span></div>
    <div class="toc-item"><span class="toc-title">21. Full Right-to-Left (RTL) & Bilingual Platform Experience</span><span class="toc-page">Ch. 21</span></div>
    <div class="toc-item"><span class="toc-title">22. Production Deployment, Security Hardening & DevOps Operations</span><span class="toc-page">Ch. 22</span></div>
  </div>

  <div class="callout callout-info no-break">
    <div class="callout-title">Owner Authority Notice</div>
    As the Platform Owner, you have complete unfettered access across all 5 user portals (Admin, Teacher, Student, Sales, Customer Support). You can switch contexts, audit transactions, override schedules, and grant elevated access. Use this manual as your day-to-day blueprint to ensure peak operational reliability.
  </div>

  <!-- ==================== CHAPTER 1: PLATFORM ARCHITECTURE ==================== -->
  <div class="page-break"></div>
  <div class="chapter-header">
    <span class="chapter-tag">Chapter 1</span>
    <h2 class="chapter-title">Platform Architecture & Ecosystem Overview</h2>
    <p class="chapter-desc">Understanding the dual Hebrew/English multi-role educational platform structure.</p>
  </div>

  <p>
    <strong>Engrew Hebrew & English Academy</strong> is engineered as a modern, full-stack educational platform built with React 18, TypeScript, Tailwind CSS, Node.js Express, PostgreSQL (via Prisma ORM), and Redis. The ecosystem supports seamless bilingual execution (English LTR and Hebrew RTL) with real-time SSE notification synchronization.
  </p>

  <div class="kv-grid no-break">
    <div class="kv-card">
      <div class="kv-key">Frontend Architecture</div>
      <div class="kv-val">React 18 + Vite + Tailwind CSS + Lucide Icons</div>
    </div>
    <div class="kv-card">
      <div class="kv-key">Backend Architecture</div>
      <div class="kv-val">Node.js Express + TypeScript + Prisma ORM</div>
    </div>
    <div class="kv-card">
      <div class="kv-key">Database & Cache</div>
      <div class="kv-val">PostgreSQL (Relational Core) + Redis (Cache/Jobs)</div>
    </div>
    <div class="kv-card">
      <div class="kv-key">Communications & Video</div>
      <div class="kv-val">Native Zoom Integration + SSE EventSource Real-Time Stream</div>
    </div>
  </div>

  <h3>Platform Role Topology</h3>
  <table class="no-break">
    <thead>
      <tr>
        <th>Role Name</th>
        <th>Portal Route</th>
        <th>Primary Purpose & Capabilities</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge badge-teal">SUPER_ADMIN</span></td>
        <td><code>/admin</code></td>
        <td>Owner master authority. Access to all financial, curriculum, user, security, and CMS controls.</td>
      </tr>
      <tr>
        <td><span class="badge badge-indigo">TEACHER</span></td>
        <td><code>/teacher</code></td>
        <td>Availability calendar management, 1-click Zoom room setup, attendance marking, post-lesson game unlocks.</td>
      </tr>
      <tr>
        <td><span class="badge badge-slate">STUDENT</span></td>
        <td><code>/student</code></td>
        <td>Interactive learning portal, booking calendar, level-specific leaderboards, practice games, homework.</td>
      </tr>
      <tr>
        <td><span class="badge badge-amber">SALES</span></td>
        <td><code>/sales</code></td>
        <td>Visual Kanban deal pipeline, lead contact management, conversion analytics, enterprise inquiries.</td>
      </tr>
      <tr>
        <td><span class="badge badge-slate">CS</span></td>
        <td><code>/cs</code></td>
        <td>Customer support ticketing desk, priority issue triage, live customer chat, SLA tracking.</td>
      </tr>
    </tbody>
  </table>

  <div class="screenshot-container no-break">
    <div class="screenshot-header">
      <div class="screenshot-dots">
        <div class="screenshot-dot"></div><div class="screenshot-dot"></div><div class="screenshot-dot"></div>
      </div>
      <span>Landing Page Hero • http://localhost:3000/</span>
    </div>
    <div class="screenshot-img-wrapper">
      <img src="${img('01_landing_hero.png')}" alt="Landing Page Hero" />
    </div>
    <div class="screenshot-caption">
      <strong>Figure 1.1:</strong> Public Landing Page featuring bilingual language switcher (EN/HE), global command palette trigger (Cmd+K), and call-to-actions.
    </div>
  </div>

  <!-- ==================== CHAPTER 2: SECURITY & AUTHENTICATION ==================== -->
  <div class="page-break"></div>
  <div class="chapter-header">
    <span class="chapter-tag">Chapter 2</span>
    <h2 class="chapter-title">Authentication, Security Gateway & Session Policies</h2>
    <p class="chapter-desc">Access control, password encryption, brute-force mitigation, and account management.</p>
  </div>

  <p>
    Security is built directly into the core authentication engine. Passwords are encrypted using salted <code>bcryptjs</code> hashes, and user sessions are governed by dual security tokens: a short-lived JWT Access Token paired with an HTTP-only Refresh Token cookie.
  </p>

  <h3>Standard Operating Procedure: Logging into the Platform</h3>
  <ol class="steps-list">
    <li class="step-item">
      <div class="step-title">Navigate to the Login Gateway</div>
      <div class="step-body">Open <code>https://engrew.com/login</code> (or <code>http://localhost:3000/login</code> in development).</div>
    </li>
    <li class="step-item">
      <div class="step-title">Enter Super Admin Credentials</div>
      <div class="step-body">Enter your authorized email address (e.g. <code>admin@learnhebrew.com</code>) and complex password.</div>
    </li>
    <li class="step-item">
      <div class="step-title">Role Redirection & Token Storing</div>
      <div class="step-body">Upon verification, the authentication engine automatically stores the session and redirects you to the specialized Admin Dashboard (<code>/admin</code>).</div>
    </li>
  </ol>

  <div class="screenshot-container no-break">
    <div class="screenshot-header">
      <div class="screenshot-dots">
        <div class="screenshot-dot"></div><div class="screenshot-dot"></div><div class="screenshot-dot"></div>
      </div>
      <span>Authentication Gateway • http://localhost:3000/login</span>
    </div>
    <div class="screenshot-img-wrapper">
      <img src="${img('03_login_page.png')}" alt="Login Page" />
    </div>
    <div class="screenshot-caption">
      <strong>Figure 2.1:</strong> Dedicated Login Screen with branded aesthetics, password visibility toggle, and instant demo test accounts for staging.
    </div>
  </div>

  <div class="callout callout-warning no-break">
    <div class="callout-title">Security Policy: Account Lockout Safeguard</div>
    The backend features an automated rate limiter. If 5 consecutive failed login attempts occur within 15 minutes from an IP or account, the account is temporarily locked to protect against brute-force attacks. As Super Admin, you can unlock any account immediately in the <strong>Users Tab</strong>.
  </div>

  <!-- ==================== CHAPTER 3: EXECUTIVE ANALYTICS ==================== -->
  <div class="page-break"></div>
  <div class="chapter-header">
    <span class="chapter-tag">Chapter 3</span>
    <h2 class="chapter-title">Executive Analytics, Revenue & KPI Scorecard</h2>
    <p class="chapter-desc">Monitoring real-time business health, monthly recurring revenue, and lesson volume.</p>
  </div>

  <p>
    The <strong>Executive Overview</strong> tab provides the Platform Owner with high-level command intelligence across financial, operational, and student satisfaction metrics.
  </p>

  <h3>Key Operational Indicators</h3>
  <table class="no-break">
    <thead>
      <tr>
        <th>KPI Card</th>
        <th>Calculation Method</th>
        <th>Target Benchmark</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Total Revenue (MRR)</strong></td>
        <td>Sum of all paid lesson package checkouts within the rolling 30-day window.</td>
        <td>Consistent month-over-month growth (&gt;15%).</td>
      </tr>
      <tr>
        <td><strong>Active Students</strong></td>
        <td>Students who completed at least one lesson or logged in within the past 14 days.</td>
        <td>&gt;85% retention rate.</td>
      </tr>
      <tr>
        <td><strong>Completed Lessons</strong></td>
        <td>Total lessons verified with attendance marked as Attended.</td>
        <td>Tracked per teacher capacity.</td>
      </tr>
      <tr>
        <td><strong>Average Lesson Rating</strong></td>
        <td>Weighted mean of student reviews across audio, clarity, and pacing (1 to 5 stars).</td>
        <td>&gt;4.8 / 5.0 stars.</td>
      </tr>
    </tbody>
  </table>

  <div class="screenshot-container no-break">
    <div class="screenshot-header">
      <div class="screenshot-dots">
        <div class="screenshot-dot"></div><div class="screenshot-dot"></div><div class="screenshot-dot"></div>
      </div>
      <span>Admin Dashboard • Executive Overview Tab (?tab=overview)</span>
    </div>
    <div class="screenshot-img-wrapper">
      <img src="${img('04_admin_overview.png')}" alt="Admin Overview" />
    </div>
    <div class="screenshot-caption">
      <strong>Figure 3.1:</strong> Executive KPI Dashboard displaying real-time metrics cards, revenue visualizer, quick action buttons, and active cohort tracking.
    </div>
  </div>

  <!-- ==================== CHAPTER 4: USER MANAGEMENT ==================== -->
  <div class="page-break"></div>
  <div class="chapter-header">
    <span class="chapter-tag">Chapter 4</span>
    <h2 class="chapter-title">User Management & Staff Onboarding Directory</h2>
    <p class="chapter-desc">Provisioning accounts, adjusting student levels, and managing platform staff.</p>
  </div>

  <p>
    The <strong>Users Directory</strong> is your central control point for managing every student, teacher, sales rep, customer support agent, and administrator.
  </p>

  <h3>Step-by-Step: Onboarding a New Teacher or Staff Member</h3>
  <ol class="steps-list">
    <li class="step-item">
      <div class="step-title">Open User Management</div>
      <div class="step-body">Navigate to <strong>Admin Dashboard &rarr; Users Tab</strong>.</div>
    </li>
    <li class="step-item">
      <div class="step-title">Launch Create User Modal</div>
      <div class="step-body">Click the primary <strong>"+ Add New User"</strong> button in the top right.</div>
    </li>
    <li class="step-item">
      <div class="step-title">Specify Profile & Role</div>
      <div class="step-body">Enter first name, last name, business email, and temporary password. Select role (<code>TEACHER</code>, <code>STUDENT</code>, <code>SALES</code>, <code>CS</code>, <code>ADMIN</code>).</div>
    </li>
    <li class="step-item">
      <div class="step-title">Set Conditional Hebrew Level (Students Only)</div>
      <div class="step-body">If creating a student, assign their initial Hebrew proficiency level (<code>BEGINNER</code> to <code>FLUENT</code>). This immediately places them in the corresponding curriculum and leaderboard.</div>
    </li>
    <li class="step-item">
      <div class="step-title">Commit & Issue Credentials</div>
      <div class="step-body">Click <strong>"Save User"</strong>. The user receives their onboarding credentials immediately.</div>
    </li>
  </ol>

  <div class="screenshot-container no-break">
    <div class="screenshot-header">
      <div class="screenshot-dots">
        <div class="screenshot-dot"></div><div class="screenshot-dot"></div><div class="screenshot-dot"></div>
      </div>
      <span>Admin Dashboard • User Management Tab (?tab=users)</span>
    </div>
    <div class="screenshot-img-wrapper">
      <img src="${img('05_admin_users.png')}" alt="Admin Users" />
    </div>
    <div class="screenshot-caption">
      <strong>Figure 4.1:</strong> User Directory with multi-criteria filtering by role, status, language preference, and search bar.
    </div>
  </div>

  <h3>Family Accounts & Household Management (Parent-Child Ecosystem)</h3>
  <p>
    Engrew supports multi-member household accounts, enabling parents to oversee, fund, and manage lessons for multiple children under one primary contact profile:
  </p>
  <ul>
    <li><strong>Parent Account Authority:</strong> The parent profile serves as the billing contact, receives automated WhatsApp & SMS notifications, and can book sessions for any dependent.</li>
    <li><strong>Child Profile Isolation:</strong> Each child maintains their own learning progress, level placement, attendance history, teacher notes, and gamified XP points.</li>
    <li><strong>Contact & Phone Inheritance:</strong> When creating a child student, the system automatically inherits the parent's verified phone number with a distinctive child suffix (e.g. <code>+972543402227+Amir</code>) preventing communication breakdown.</li>
    <li><strong>Shared Package Hours:</strong> Lessons purchased by the parent can either be placed into a flexible shared household pool or assigned to a specific child's balance.</li>
  </ul>

  <div class="screenshot-container no-break">
    <div class="screenshot-header">
      <div class="screenshot-dots">
        <div class="screenshot-dot"></div><div class="screenshot-dot"></div><div class="screenshot-dot"></div>
      </div>
      <span>Admin Dashboard • Family Management & Household Modal (?tab=users)</span>
    </div>
    <div class="screenshot-img-wrapper">
      <img src="${img('25_family_management_modal.png')}" alt="Family Management Modal" />
    </div>
    <div class="screenshot-caption">
      <strong>Figure 4.2:</strong> Family & Household Modal in Admin CRM enabling staff to link dependent children, track shared package hours, and manage family relationships.
    </div>
  </div>

  <!-- ==================== CHAPTER 5: ROLES & PERMISSIONS MATRIX ==================== -->
  <div class="page-break"></div>
  <div class="chapter-header">
    <span class="chapter-tag">Chapter 5</span>
    <h2 class="chapter-title">Roles & Permissions Action Matrix (Enterprise RBAC)</h2>
    <p class="chapter-desc">Configuring granular action matrices and enforcing least-privilege policies.</p>
  </div>

  <p>
    The platform features an advanced <strong>Role-Based Access Control (RBAC) Action Matrix</strong>. Rather than monolithic permissions, each role has explicit permissions (Create, Read, Update, Delete, Export) across 15 modular system domains.
  </p>

  <div class="screenshot-container no-break">
    <div class="screenshot-header">
      <div class="screenshot-dots">
        <div class="screenshot-dot"></div><div class="screenshot-dot"></div><div class="screenshot-dot"></div>
      </div>
      <span>Admin Dashboard • Roles & Permissions Action Matrix (?tab=roles)</span>
    </div>
    <div class="screenshot-img-wrapper">
      <img src="${img('06_admin_roles_matrix.png')}" alt="Roles Matrix" />
    </div>
    <div class="screenshot-caption">
      <strong>Figure 5.1:</strong> Granular Permission Matrix enabling one-click toggle of capabilities across modules with instant persistence and audit logging.
    </div>
  </div>

  <div class="callout callout-pro-tip no-break">
    <div class="callout-title">Owner Pro-Tip: Delegating Operations without Risk</div>
    When hiring operations staff, assign them the <code>ADMIN</code> role with financial deletion and user deletion toggled OFF in the Matrix. This allows them to assist with scheduling and curriculum without access to modify payment balances or delete core data.
  </div>

  <!-- ==================== CHAPTER 6: CURRICULUM & LEVELS ==================== -->
  <div class="page-break"></div>
  <div class="chapter-header">
    <span class="chapter-tag">Chapter 6</span>
    <h2 class="chapter-title">Curriculum Framework & Hebrew Proficiency Levels</h2>
    <p class="chapter-desc">Managing the 6-tier pedagogical ladder from Alef-Bet to Fluent Hebrew.</p>
  </div>

  <p>
    Engrew structures Hebrew and English language acquisition into standardized proficiency tiers rigorously aligned with the international <strong>CEFR (Common European Framework of Reference for Languages)</strong> benchmarks:
  </p>

  <table class="no-break">
    <thead>
      <tr>
        <th>CEFR Code</th>
        <th>Proficiency Level</th>
        <th>Hebrew Equivalence</th>
        <th>Target Pedagogical Competency</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>A1</code></td>
        <td>Level 1: Absolute Beginner</td>
        <td>מתחילים (Alef)</td>
        <td>Alef-Bet recognition, vowel signs (Nikkud), foundational greetings, and phonetic decoding.</td>
      </tr>
      <tr>
        <td><code>A2</code></td>
        <td>Level 2: Elementary</td>
        <td>יסודי (Bet)</td>
        <td>Essential vocabulary, present tense verb conjugations (Pa'al), and simple daily situational dialogues.</td>
      </tr>
      <tr>
        <td><code>B1</code></td>
        <td>Level 3: Intermediate</td>
        <td>בינוני (Gimel)</td>
        <td>Past tense verb forms, directional prepositions, and reading simplified Israeli media articles.</td>
      </tr>
      <tr>
        <td><code>B2</code></td>
        <td>Level 4: Upper-Intermediate</td>
        <td>מתקדמים א (Dalet)</td>
        <td>Future tense, complex verb binyanim (Pi'el, Hif'il, Hitpa'el), and fluent conversational flow.</td>
      </tr>
      <tr>
        <td><code>C1</code></td>
        <td>Level 5: Advanced</td>
        <td>מתקדמים ב (Heh)</td>
        <td>Nuanced literature, Israeli podcasts and news broadcasts, formal vs colloquial slang registers.</td>
      </tr>
      <tr>
        <td><code>C2</code></td>
        <td>Level 6: Fluent / Mastery</td>
        <td>שליטה מלאה (Vav)</td>
        <td>Native-speed professional and cultural fluency, idiomatic debate, and Ulpan graduation standards.</td>
      </tr>
      <tr>
        <td><code>NATIVE</code></td>
        <td>Level 7: Native Speaker</td>
        <td>שפת אם (Native)</td>
        <td>Mother-tongue fluency, cultural nuance, dialectal idioms, and advanced stylistic expression.</td>
      </tr>
    </tbody>
  </table>

  <p>
    <strong>CEFR Integration Across Systems:</strong> A student's assigned CEFR level dynamically controls their syllabus topics, automatically categorizes them into fair leaderboard cohorts, unlocks level-appropriate practice games, and sets the prerequisite threshold for transition placement exams.
  </p>

  <div class="screenshot-container no-break">
    <div class="screenshot-header">
      <div class="screenshot-dots">
        <div class="screenshot-dot"></div><div class="screenshot-dot"></div><div class="screenshot-dot"></div>
      </div>
      <span>Admin Dashboard • Curriculum & Levels Management (?tab=levels)</span>
    </div>
    <div class="screenshot-img-wrapper">
      <img src="${img('07_admin_curriculum_levels.png')}" alt="Curriculum Levels" />
    </div>
    <div class="screenshot-caption">
      <strong>Figure 6.1:</strong> Curriculum Framework Editor allowing the Owner to configure syllabus items, vocabulary goals, and target exam prerequisites.
    </div>
  </div>

  <!-- ==================== CHAPTER 7: MULTI-DURATION SESSIONS ==================== -->
  <div class="page-break"></div>
  <div class="chapter-header">
    <span class="chapter-tag">Chapter 7</span>
    <h2 class="chapter-title">Multi-Duration Session Engine (25, 40, 55 Minutes)</h2>
    <p class="chapter-desc">Configuring flexible lesson durations and credit allocation formulas.</p>
  </div>

  <p>
    Engrew supports 3 distinct session durations to cater to diverse learning styles:
  </p>
  <ul>
    <li><strong>25 Minutes (Express / Kids / Daily Habit):</strong> Ideal for high-frequency vocabulary drills and young learners.</li>
    <li><strong>40 Minutes (Standard Focused):</strong> Balanced duration for grammatical instruction and active conversation.</li>
    <li><strong>55 Minutes (Comprehensive Masterclass):</strong> Deep dive session covering advanced reading, essay review, and cultural immersion.</li>
  </ul>

  <div class="screenshot-container no-break">
    <div class="screenshot-header">
      <div class="screenshot-dots">
        <div class="screenshot-dot"></div><div class="screenshot-dot"></div><div class="screenshot-dot"></div>
      </div>
      <span>Admin Dashboard • Session Types & Durations (?tab=session_types)</span>
    </div>
    <div class="screenshot-img-wrapper">
      <img src="${img('08_admin_session_types.png')}" alt="Session Types" />
    </div>
    <div class="screenshot-caption">
      <strong>Figure 7.1:</strong> Multi-Duration Session Configuration allowing custom credit multipliers, buffer times, and pricing formulas.
    </div>
  </div>

  <!-- ==================== CHAPTER 8: TEACHER OPERATIONS & ZOOM ==================== -->
  <div class="page-break"></div>
  <div class="chapter-header">
    <span class="chapter-tag">Chapter 8</span>
    <h2 class="chapter-title">Teacher Operations, Calendars & 1-Click Zoom Classrooms</h2>
    <p class="chapter-desc">How instructors manage weekly availability and link live video classrooms.</p>
  </div>

  <p>
    Instructors configure their weekly availability in <strong>25-minute slot intervals</strong> on Israel Time (IST). When a teacher opens an availability slot, students can book that slot for 25, 40, or 55 minutes, and the calendar automatically reserves contiguous intervals.
  </p>

  <h3>Permanent Classroom Zoom Integration (1-Click Workflow)</h3>
  <p>
    To eliminate repetitive link copying, instructors enter their permanent Zoom meeting link once into the <strong>Permanent Classroom Zoom Link</strong> card. Every slot opened automatically inherits this link.
  </p>

  <div class="screenshot-container no-break">
    <div class="screenshot-header">
      <div class="screenshot-dots">
        <div class="screenshot-dot"></div><div class="screenshot-dot"></div><div class="screenshot-dot"></div>
      </div>
      <span>Teacher Dashboard • Availability Calendar & Zoom Card (/teacher?tab=calendar)</span>
    </div>
    <div class="screenshot-img-wrapper">
      <img src="${img('21_teacher_availability_calendar.png')}" alt="Teacher Availability" />
    </div>
    <div class="screenshot-caption">
      <strong>Figure 8.1:</strong> Instructor Availability Grid with high-contrast Permanent Classroom Zoom link card, period filters, and batch slot creation.
    </div>
  </div>

  <!-- ==================== CHAPTER 9: CENTRAL BOOKINGS ==================== -->
  <div class="page-break"></div>
  <div class="chapter-header">
    <span class="chapter-tag">Chapter 9</span>
    <h2 class="chapter-title">Central Booking Management & Slot Conflict Resolution</h2>
    <p class="chapter-desc">Tracking active bookings, rescheduling requests, and resolving schedule overlaps.</p>
  </div>

  <p>
    The <strong>Bookings Tab</strong> gives the Owner complete visibility over every scheduled, upcoming, completed, and cancelled session across all teachers and students.
  </p>

  <div class="screenshot-container no-break">
    <div class="screenshot-header">
      <div class="screenshot-dots">
        <div class="screenshot-dot"></div><div class="screenshot-dot"></div><div class="screenshot-dot"></div>
      </div>
      <span>Admin Dashboard • Bookings & Calendar Operations (?tab=bookings)</span>
    </div>
    <div class="screenshot-img-wrapper">
      <img src="${img('10_admin_bookings.png')}" alt="Admin Bookings" />
    </div>
    <div class="screenshot-caption">
      <strong>Figure 9.1:</strong> Central Booking Registry detailing student name, teacher, exact time (IST & Local), duration, status, and direct Zoom launch button.
    </div>
  </div>

  <!-- ==================== CHAPTER 10: ATTENDANCE & GAMES UNLOCK ==================== -->
  <div class="page-break"></div>
  <div class="chapter-header">
    <span class="chapter-tag">Chapter 10</span>
    <h2 class="chapter-title">Post-Session Attendance & Practice Game Unlocking</h2>
    <p class="chapter-desc">Verifying lesson completion, crediting teacher payouts, and unlocking student games.</p>
  </div>

  <p>
    Following each lesson, the instructor opens the <strong>Post-Session Management Modal</strong> to complete three crucial educational steps:
  </p>
  <ol class="steps-list">
    <li class="step-item">
      <div class="step-title">Select Student & Completed Session</div>
      <div class="step-body">Select the student from the filtered dropdown list. The session duration and date are displayed for verification.</div>
    </li>
    <li class="step-item">
      <div class="step-title">Record Attendance Status</div>
      <div class="step-body">Click <strong>Attended</strong> (deducts credit, triggers XP reward, logs teacher hours), <strong>Absent</strong>, or <strong>Excused</strong>.</div>
    </li>
    <li class="step-item">
      <div class="step-title">Unlock Practice Game</div>
      <div class="step-body">Select a tailor-made Hebrew game (Word Matching, Verb Conjugation, Flashcards) to unlock on the student's dashboard. The student gets 1 play cycle to reinforce what they learned.</div>
    </li>
  </ol>

  <div class="screenshot-container no-break">
    <div class="screenshot-header">
      <div class="screenshot-dots">
        <div class="screenshot-dot"></div><div class="screenshot-dot"></div><div class="screenshot-dot"></div>
      </div>
      <span>Post-Session Management Modal • Attendance & Practice Game Unlocking</span>
    </div>
    <div class="screenshot-img-wrapper">
      <img src="${img('24_teacher_attendance_modal.png')}" alt="Attendance Modal" />
    </div>
    <div class="screenshot-caption">
      <strong>Figure 10.1:</strong> Post-Session Modal enabling quick attendance toggles and automated practice game unlocking.
    </div>
  </div>

  <!-- ==================== CHAPTER 11: LESSON PACKAGES & PRICING ==================== -->
  <div class="page-break"></div>
  <div class="chapter-header">
    <span class="chapter-tag">Chapter 11</span>
    <h2 class="chapter-title">Lesson Packages, Student Allocations & Checkout Engine</h2>
    <p class="chapter-desc">Catalog management, discounts, student hours balances, and payment links.</p>
  </div>

  <p>
    Packages represent the primary revenue driver of Engrew Academy. The Owner can define packaged hours (e.g. 5, 10, 20, 50 hours) with custom validity windows (e.g. 60 to 180 days).
  </p>

  <div class="screenshot-container no-break">
    <div class="screenshot-header">
      <div class="screenshot-dots">
        <div class="screenshot-dot"></div><div class="screenshot-dot"></div><div class="screenshot-dot"></div>
      </div>
      <span>Admin Dashboard • Lesson Packages & Student Allocations (?tab=packages)</span>
    </div>
    <div class="screenshot-img-wrapper">
      <img src="${img('11_admin_packages.png')}" alt="Admin Packages" />
    </div>
    <div class="screenshot-caption">
      <strong>Figure 11.1:</strong> Package Management showing active packages, student balance allocations, and manual balance adjustment tools.
    </div>
  </div>

  <div class="screenshot-container no-break">
    <div class="screenshot-header">
      <div class="screenshot-dots">
        <div class="screenshot-dot"></div><div class="screenshot-dot"></div><div class="screenshot-dot"></div>
      </div>
      <span>Landing Page • Interactive Public Packages Slider (#packages)</span>
    </div>
    <div class="screenshot-img-wrapper">
      <img src="${img('02_landing_packages.png')}" alt="Landing Packages" />
    </div>
    <div class="screenshot-caption">
      <strong>Figure 11.2:</strong> Public Packages Section with smooth horizontal scroll navigation, discount badges, and direct checkout triggers.
    </div>
  </div>

  <!-- ==================== CHAPTER 12: FINANCIAL TRANSACTIONS ==================== -->
  <div class="page-break"></div>
  <div class="chapter-header">
    <span class="chapter-tag">Chapter 12</span>
    <h2 class="chapter-title">Financial Transactions, Revenue Ledger & Refunds</h2>
    <p class="chapter-desc">Tracking Stripe/PayPal webhooks, invoicing, and auditing payment logs.</p>
  </div>

  <p>
    The <strong>Payments Tab</strong> maintains an immutable audit ledger of every financial event. Every transaction logs the customer email, gateway transaction ID, gross amount, currency (USD / EUR / ILS), payment status, and allocated hours.
  </p>

  <div class="screenshot-container no-break">
    <div class="screenshot-header">
      <div class="screenshot-dots">
        <div class="screenshot-dot"></div><div class="screenshot-dot"></div><div class="screenshot-dot"></div>
      </div>
      <span>Admin Dashboard • Payments & Revenue Analytics (?tab=payments)</span>
    </div>
    <div class="screenshot-img-wrapper">
      <img src="${img('12_admin_payments.png')}" alt="Admin Payments" />
    </div>
    <div class="screenshot-caption">
      <strong>Figure 12.1:</strong> Complete Financial Transaction Ledger with refund processing, gateway status badges, and invoice download links.
    </div>
  </div>

  <!-- ==================== CHAPTER 13: EXAMS & ASSESSMENTS ==================== -->
  <div class="page-break"></div>
  <div class="chapter-header">
    <span class="chapter-tag">Chapter 13</span>
    <h2 class="chapter-title">Exams, Assessments & Level Certification</h2>
    <p class="chapter-desc">Structuring proficiency milestones, grading submissions, and issuing certificates.</p>
  </div>

  <p>
    Students prove their mastery through standardized exams created by the Owner or lead instructors. Exams feature automated multiple-choice scoring and manual oral/essay evaluation sections.
  </p>

  <div class="screenshot-container no-break">
    <div class="screenshot-header">
      <div class="screenshot-dots">
        <div class="screenshot-dot"></div><div class="screenshot-dot"></div><div class="screenshot-dot"></div>
      </div>
      <span>Admin Dashboard • Exams & Assessments (?tab=exams)</span>
    </div>
    <div class="screenshot-img-wrapper">
      <img src="${img('13_admin_exams.png')}" alt="Admin Exams" />
    </div>
    <div class="screenshot-caption">
      <strong>Figure 13.1:</strong> Exam Management Hub displaying active exams, passing scores, question counts, and student completion rates.
    </div>
  </div>

  <!-- ==================== CHAPTER 14: GAMIFICATION ENGINE ==================== -->
  <div class="page-break"></div>
  <div class="chapter-header">
    <span class="chapter-tag">Chapter 14</span>
    <h2 class="chapter-title">Gamification Engine: XP, Streaks & Level-Ranked Leaderboards</h2>
    <p class="chapter-desc">Motivating student engagement through personalized, fair level competition.</p>
  </div>

  <p>
    The gamification architecture utilizes a real-time <strong>Points Ledger</strong> where students earn Experience Points (XP) for educational actions:
  </p>
  <ul>
    <li>Attending a live lesson: <strong>+100 XP</strong></li>
    <li>Submitting homework on time: <strong>+50 XP</strong></li>
    <li>Winning a custom practice game: <strong>+30 XP</strong></li>
    <li>Maintaining a 7-day study streak: <strong>+200 XP Bonus</strong></li>
  </ul>

  <h3>Fair Competition: Scoped Level Leaderboards</h3>
  <p>
    To ensure fair motivation, students compete exclusively within their enrolled Hebrew level. An absolute beginner is never ranked against an advanced student. The Olympic Podium (Gold, Silver, Bronze) showcases top performers in each tier.
  </p>

  <div class="screenshot-container no-break">
    <div class="screenshot-header">
      <div class="screenshot-dots">
        <div class="screenshot-dot"></div><div class="screenshot-dot"></div><div class="screenshot-dot"></div>
      </div>
      <span>Student Dashboard • Scoped Level Leaderboard (/student)</span>
    </div>
    <div class="screenshot-img-wrapper">
      <img src="${img('23_student_level_leaderboard.png')}" alt="Student Leaderboard" />
    </div>
    <div class="screenshot-caption">
      <strong>Figure 14.1:</strong> Student Leaderboard with interactive level switcher tabs, personal rank standing banner, and top-3 podium medals.
    </div>
  </div>

  <div class="screenshot-container no-break">
    <div class="screenshot-header">
      <div class="screenshot-dots">
        <div class="screenshot-dot"></div><div class="screenshot-dot"></div><div class="screenshot-dot"></div>
      </div>
      <span>Admin Dashboard • Gamification Engine Rules (?tab=point_rules)</span>
    </div>
    <div class="screenshot-img-wrapper">
      <img src="${img('14_admin_gamification.png')}" alt="Admin Gamification" />
    </div>
    <div class="screenshot-caption">
      <strong>Figure 14.2:</strong> Gamification Rule Editor allowing the Owner to tune point multipliers, seasonal resets, and custom game triggers.
    </div>
  </div>

  <h3>Comprehensive Suite of 6 Interactive CEFR Practice Games</h3>
  <p>
    Engrew provides a multi-modal practice suite with 23 authentic educational games seeded directly into the platform database, dynamically filtered to match each student's exact CEFR proficiency level (A1 through Native):
  </p>

  <table class="no-break">
    <thead>
      <tr>
        <th>Game Engine</th>
        <th>Learning Mechanic</th>
        <th>CEFR Suitability</th>
        <th>Pedagogical Focus</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Sentence Builder</strong></td>
        <td>Syntactic tile assembly</td>
        <td>A2 – C1</td>
        <td>Word order, prepositions, verb positioning, and complex Hebrew sentence structure.</td>
      </tr>
      <tr>
        <td><strong>Word Scramble</strong></td>
        <td>Letter rearrangement tiles</td>
        <td>A1 – B2</td>
        <td>Root letter (Shoresh) recognition, vowel pattern recall, and rapid orthography drilling.</td>
      </tr>
      <tr>
        <td><strong>Speed Round</strong></td>
        <td>High-pressure timed sprint</td>
        <td>A1 – C2</td>
        <td>Cognitive fluency, split-second recall under a countdown timer, and exam prep.</td>
      </tr>
      <tr>
        <td><strong>Interactive Flashcards</strong></td>
        <td>3D flipping cards with native audio</td>
        <td>A1 – B1</td>
        <td>Phonetic Alef-Bet mastery, vocalized Nikkud, transliteration, and audio pronunciation.</td>
      </tr>
      <tr>
        <td><strong>Vocabulary Matcher</strong></td>
        <td>Interactive pair connecting</td>
        <td>A1 – C1</td>
        <td>Associative vocabulary recall, idioms, situational nouns, and synonym recognition.</td>
      </tr>
      <tr>
        <td><strong>Multiple Choice Quiz</strong></td>
        <td>Cognitive retrieval & feedback</td>
        <td>All Levels</td>
        <td>Grammar rules, cultural context, reading comprehension, and post-lesson retention.</td>
      </tr>
    </tbody>
  </table>

  <div class="screenshot-container no-break">
    <div class="screenshot-header">
      <div class="screenshot-dots">
        <div class="screenshot-dot"></div><div class="screenshot-dot"></div><div class="screenshot-dot"></div>
      </div>
      <span>Student Portal • CEFR Level-Filtered Practice Games (/student?tab=games)</span>
    </div>
    <div class="screenshot-img-wrapper">
      <img src="${img('26_cefr_games_practice.png')}" alt="Student Practice Games" />
    </div>
    <div class="screenshot-caption">
      <strong>Figure 14.3:</strong> Student Gamification Center displaying CEFR level selector pills, game unlock status, completion scores, and earned XP.
    </div>
  </div>

  <!-- ==================== CHAPTER 15: AUTOMATED REMINDERS HUB ==================== -->
  <div class="page-break"></div>
  <div class="chapter-header">
    <span class="chapter-tag">Chapter 15</span>
    <h2 class="chapter-title">24/7 Automated Reminders Hub & Notification Center</h2>
    <p class="chapter-desc">Preventing no-shows with automated background cron schedulers.</p>
  </div>

  <p>
    The platform runs an autonomous background cron scheduler (<code>ReminderJob</code>) that audits upcoming lessons every minute to eliminate missed sessions:
  </p>
  <ul>
    <li><strong>24-Hour Reminder:</strong> Dispatched exactly 24 hours before class with Zoom details and preparation tips.</li>
    <li><strong>1-Hour Alert:</strong> High-priority dispatch with direct 1-click Zoom classroom launch link.</li>
    <li><strong>Package Depletion Warning:</strong> Triggered when a student's remaining balance drops below 2 hours.</li>
  </ul>

  <div class="screenshot-container no-break">
    <div class="screenshot-header">
      <div class="screenshot-dots">
        <div class="screenshot-dot"></div><div class="screenshot-dot"></div><div class="screenshot-dot"></div>
      </div>
      <span>Admin Dashboard • Automated Reminders Hub (?tab=reminders_hub)</span>
    </div>
    <div class="screenshot-img-wrapper">
      <img src="${img('15_admin_reminders_hub.png')}" alt="Admin Reminders" />
    </div>
    <div class="screenshot-caption">
      <strong>Figure 15.1:</strong> Reminders Hub showing real-time dispatch logs, delivery status (In-App, Email, SMS), and background scheduler controls.
    </div>
  </div>

  <!-- ==================== CHAPTER 16: SALES CRM ==================== -->
  <div class="page-break"></div>
  <div class="chapter-header">
    <span class="chapter-tag">Chapter 16</span>
    <h2 class="chapter-title">Sales CRM Pipeline & Deal Conversion Tracking</h2>
    <p class="chapter-desc">Managing prospective student leads, trial bookings, and conversion stages.</p>
  </div>

  <p>
    Accessible at <code>/sales</code>, the Sales CRM organizes inbound leads into an intuitive drag-and-drop Kanban pipeline: <strong>New Inquiries &rarr; Trial Booked &rarr; Proposal Sent &rarr; Won &rarr; Closed</strong>.
  </p>

  <div class="screenshot-container no-break">
    <div class="screenshot-header">
      <div class="screenshot-dots">
        <div class="screenshot-dot"></div><div class="screenshot-dot"></div><div class="screenshot-dot"></div>
      </div>
      <span>Sales CRM Dashboard • Kanban Deal Pipeline (/sales)</span>
    </div>
    <div class="screenshot-img-wrapper">
      <img src="${img('19_sales_crm_pipeline.png')}" alt="Sales CRM" />
    </div>
    <div class="screenshot-caption">
      <strong>Figure 16.1:</strong> Visual Sales Pipeline showing deal values, lead communication history, and sales representative quota trackers.
    </div>
  </div>

  <!-- ==================== CHAPTER 17: CUSTOMER SUPPORT ==================== -->
  <div class="page-break"></div>
  <div class="chapter-header">
    <span class="chapter-tag">Chapter 17</span>
    <h2 class="chapter-title">Customer Support Helpdesk & SLA Resolution Engine</h2>
    <p class="chapter-desc">Handling inquiries, technical assistance, and resolving student tickets.</p>
  </div>

  <p>
    Accessible at <code>/cs</code>, the Helpdesk allows support specialists to manage incoming tickets with automated SLA countdowns and canned responses for common questions (rescheduling, Zoom troubleshooting, homework upload help).
  </p>

  <div class="screenshot-container no-break">
    <div class="screenshot-header">
      <div class="screenshot-dots">
        <div class="screenshot-dot"></div><div class="screenshot-dot"></div><div class="screenshot-dot"></div>
      </div>
      <span>Customer Support Helpdesk • Ticket Resolution Center (/cs)</span>
    </div>
    <div class="screenshot-img-wrapper">
      <img src="${img('20_support_helpdesk.png')}" alt="Support Helpdesk" />
    </div>
    <div class="screenshot-caption">
      <strong>Figure 17.1:</strong> Customer Support Portal showing open tickets, priority queues, response time metrics, and customer interaction logs.
    </div>
  </div>

  <!-- ==================== CHAPTER 18: REVIEWS & TESTIMONIALS ==================== -->
  <div class="page-break"></div>
  <div class="chapter-header">
    <span class="chapter-tag">Chapter 18</span>
    <h2 class="chapter-title">Feedback Analytics & Live Student Testimonials Scorecards</h2>
    <p class="chapter-desc">Moderating student reviews, rating instructor effectiveness, and featuring testimonials.</p>
  </div>

  <p>
    Student reviews provide qualitative insights into teacher excellence and curriculum satisfaction. The Owner reviews incoming ratings, filters by star count, and toggles the <strong>"Feature on Landing Page"</strong> switch to showcase top testimonials in the public carousel.
  </p>

  <div class="screenshot-container no-break">
    <div class="screenshot-header">
      <div class="screenshot-dots">
        <div class="screenshot-dot"></div><div class="screenshot-dot"></div><div class="screenshot-dot"></div>
      </div>
      <span>Admin Dashboard • Reviews & Feedback Scorecards (?tab=surveys)</span>
    </div>
    <div class="screenshot-img-wrapper">
      <img src="${img('16_admin_reviews_surveys.png')}" alt="Admin Reviews" />
    </div>
    <div class="screenshot-caption">
      <strong>Figure 18.1:</strong> Review Management Console with live scorecards, rating distribution bars, and public display approval toggles.
    </div>
  </div>

  <h3>Permanent & Multi-Use Review Links Architecture</h3>
  <p>
    In addition to automated post-lesson feedback prompts, Engrew supports <strong>Permanent & Multi-Use Review Links</strong> generated via <code>/review/:token</code>:
  </p>
  <ul>
    <li><strong>Reusable Campaign Links:</strong> Review URLs can be generated with multi-use tokens, allowing administrators and marketing teams to distribute them across student WhatsApp groups, community channels, and graduation emails without the link expiring after a single submission.</li>
    <li><strong>Anti-Abuse Safeguards:</strong> Client IP throttling and submission fingerprinting prevent duplicate review spam while allowing legitimate students to share authentic feedback effortlessly.</li>
    <li><strong>Live Homepage Syndication:</strong> Approved 5-star testimonials can be published to the public landing page with one click, showing verified student tags and ratings.</li>
  </ul>

  <!-- ==================== CHAPTER 19: LANDING CMS ==================== -->
  <div class="page-break"></div>
  <div class="chapter-header">
    <span class="chapter-tag">Chapter 19</span>
    <h2 class="chapter-title">Landing Page CMS & Brand Management</h2>
    <p class="chapter-desc">Modifying homepage text, value props, banners, and bilingual marketing content.</p>
  </div>

  <p>
    The <strong>Landing CMS</strong> tab empowers the Platform Owner to update marketing copy, hero banners, feature bullet points, and social links in real time without touching code or redeploying.
  </p>

  <div class="screenshot-container no-break">
    <div class="screenshot-header">
      <div class="screenshot-dots">
        <div class="screenshot-dot"></div><div class="screenshot-dot"></div><div class="screenshot-dot"></div>
      </div>
      <span>Admin Dashboard • Landing Page CMS (?tab=landing_cms)</span>
    </div>
    <div class="screenshot-img-wrapper">
      <img src="${img('17_admin_landing_cms.png')}" alt="Admin Landing CMS" />
    </div>
    <div class="screenshot-caption">
      <strong>Figure 19.1:</strong> Content Management System providing instant updates for hero headlines, subheadings, and promotional callouts.
    </div>
  </div>

  <!-- ==================== CHAPTER 20: AUDIT LOGS & CHECKLIST ==================== -->
  <div class="page-break"></div>
  <div class="chapter-header">
    <span class="chapter-tag">Chapter 20</span>
    <h2 class="chapter-title">System Audit Logs, Health Monitoring & Owner Routine Checklist</h2>
    <p class="chapter-desc">Ensuring system integrity, tracking administrative actions, and daily operating procedures.</p>
  </div>

  <p>
    The <strong>System Logs</strong> tab records every significant platform event: user logins, role modifications, balance top-ups, schedule overrides, and data exports.
  </p>

  <div class="screenshot-container no-break">
    <div class="screenshot-header">
      <div class="screenshot-dots">
        <div class="screenshot-dot"></div><div class="screenshot-dot"></div><div class="screenshot-dot"></div>
      </div>
      <span>Admin Dashboard • System Security & Audit Trail (?tab=system_logs)</span>
    </div>
    <div class="screenshot-img-wrapper">
      <img src="${img('18_admin_system_logs.png')}" alt="Admin System Logs" />
    </div>
    <div class="screenshot-caption">
      <strong>Figure 20.1:</strong> Live System Audit Trail detailing IP addresses, timestamps, actor accounts, and event severity levels.
    </div>
  </div>

  <h3>Daily Owner Operating Checklist</h3>
  <table class="no-break">
    <thead>
      <tr>
        <th>Time of Day</th>
        <th>Target Domain</th>
        <th>Standard Action Item</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Morning (09:00 IST)</strong></td>
        <td>Executive Overview & Bookings</td>
        <td>Check today's scheduled lesson volume. Verify all teachers have active Zoom links attached. Review overnight revenue.</td>
      </tr>
      <tr>
        <td><strong>Midday (13:00 IST)</strong></td>
        <td>Reminders & Sales Pipeline</td>
        <td>Ensure ReminderJob dispatched 24h & 1h alerts. Check Sales CRM for trial requests submitted through the contact form.</td>
      </tr>
      <tr>
        <td><strong>Afternoon (17:00 IST)</strong></td>
        <td>Support Desk & Attendance</td>
        <td>Verify all completed afternoon sessions have attendance marked. Review open high-priority customer support tickets.</td>
      </tr>
      <tr>
        <td><strong>Evening (21:00 IST)</strong></td>
        <td>Audit Logs & System Health</td>
        <td>Review failed login attempts in System Logs. Audit package balances. Confirm system backup is intact.</td>
      </tr>
    </tbody>
  </table>

  <div class="callout callout-info no-break">
    <div class="callout-title">Emergency Contact & Escalation Protocol</div>
    If a teacher experiences an urgent connectivity issue during a lesson, use the <strong>Quick-Action Override</strong> in the Bookings tab to assign an available substitute teacher or issue an automatic 1-lesson credit refund to the student's package balance.
  </div>

  <!-- ==================== CHAPTER 21: RTL & BILINGUAL EXPERIENCE ==================== -->
  <div class="page-break"></div>
  <div class="chapter-header">
    <span class="chapter-tag">Chapter 21</span>
    <h2 class="chapter-title">Full Right-to-Left (RTL) & Bilingual Platform Experience</h2>
    <p class="chapter-desc">Delivering an authentic native Arabic, Hebrew, and English experience with complete layout mirroring.</p>
  </div>

  <p>
    Engrew is architected from the foundation up as a true <strong>Bi-Directional, Multi-Language Platform</strong>. Rather than superficial translations, the platform dynamically mirrors its entire interface layout when users select Arabic (<code>ar</code>) or Hebrew (<code>he</code>):
  </p>

  <div class="kv-grid no-break">
    <div class="kv-card">
      <div class="kv-key">Complete Bidirectional Mirroring</div>
      <div class="kv-val">Navigation bars, sidebar drawers, CRM tables, and calendar matrices automatically invert axis to standard Right-to-Left (<code>dir="rtl"</code>) flow without breaking responsiveness.</div>
    </div>
    <div class="kv-card">
      <div class="kv-key">Hebrew Vocalization (Nikkud) Engine</div>
      <div class="kv-val">Phonetic vowel marks (Nikkud) render cleanly on modern browsers and mobile screens, supporting beginner literacy in flashcards, games, and teacher notes.</div>
    </div>
    <div class="kv-card">
      <div class="kv-key">Cultural Arabic Localization</div>
      <div class="kv-val">Every user-facing label, button, status badge, and financial summary is localized into natural Arabic for students and parents across the Middle East.</div>
    </div>
    <div class="kv-card">
      <div class="kv-key">1-Click Persistent Switcher</div>
      <div class="kv-val">The top navigation bar features a quick language switcher (Arabic, English, Hebrew) that immediately updates the interface and saves user preference to database storage.</div>
    </div>
  </div>

  <div class="screenshot-container no-break">
    <div class="screenshot-header">
      <div class="screenshot-dots">
        <div class="screenshot-dot"></div><div class="screenshot-dot"></div><div class="screenshot-dot"></div>
      </div>
      <span>Student Portal • Arabic RTL Full-Page Experience (/student?lang=ar)</span>
    </div>
    <div class="screenshot-img-wrapper">
      <img src="${img('27_rtl_bilingual_view.png')}" alt="Arabic RTL Dashboard" />
    </div>
    <div class="screenshot-caption">
      <strong>Figure 21.1:</strong> Student Portal dynamically mirrored to full Right-to-Left (RTL) Arabic layout with native typography, mirrored progress bars, and localized navigation.
    </div>
  </div>

  <!-- ==================== CHAPTER 22: DEVOPS & PRODUCTION DEPLOYMENT ==================== -->
  <div class="page-break"></div>
  <div class="chapter-header">
    <span class="chapter-tag">Chapter 22</span>
    <h2 class="chapter-title">Production Deployment, Security Hardening & DevOps Operations</h2>
    <p class="chapter-desc">Operational guide for containerization, clustering, reverse-proxy setup, and OWASP security compliance.</p>
  </div>

  <p>
    Engrew is built for enterprise uptime, horizontal scalability, and bank-grade data security. This chapter outlines the deployment architecture and production infrastructure runbook:
  </p>

  <h3>1. Production Architecture Overview</h3>
  <table class="no-break">
    <thead>
      <tr>
        <th>Layer</th>
        <th>Technology</th>
        <th>Production Role</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Web & Proxy</strong></td>
        <td>Nginx (Reverse Proxy)</td>
        <td>SSL termination, Gzip asset compression, 1-year immutable caching for Vite bundles, and DDoS rate dampening.</td>
      </tr>
      <tr>
        <td><strong>Application Core</strong></td>
        <td>Node.js 20 LTS + Express</td>
        <td>Clustered across all CPU cores with PM2 (<code>ecosystem.config.js</code>) or containerized with multi-stage Docker.</td>
      </tr>
      <tr>
        <td><strong>Database</strong></td>
        <td>PostgreSQL 16 (Prisma ORM)</td>
        <td>Relational ledger with connection pooling, automated indexes on hot queries, and transactional integrity.</td>
      </tr>
      <tr>
        <td><strong>In-Memory Cache</strong></td>
        <td>Redis 7 / Memory TTL Cache</td>
        <td>High-speed caching for user permissions, session validation, and real-time active user tracking.</td>
      </tr>
      <tr>
        <td><strong>Static Storage</strong></td>
        <td>Uploads Directory / Cloud CDN</td>
        <td>MIME-validated storage for teacher avatars, payment receipt screenshots, and structured lesson notes.</td>
      </tr>
    </tbody>
  </table>

  <h3>2. Security & OWASP Hardening Runbook</h3>
  <ul>
    <li><strong>Zero Demo Backdoor in Production:</strong> Demo emails and bypass passwords are strictly removed in production builds. Only authentic bcrypt hash comparisons (cost factor 12) are accepted.</li>
    <li><strong>Account Lockout Policy:</strong> Users are automatically locked out for 15 minutes after 5 consecutive failed login attempts, logged with IP address and user-agent forensics to prevent brute-forcing.</li>
    <li><strong>Content Security Policy (CSP):</strong> Configured via Helmet to eliminate cross-site scripting (XSS), disallowing inline untrusted scripts and enforcing strict origin trust.</li>
    <li><strong>MIME-Type Upload Validation:</strong> Multer file upload filters strictly validate file headers, accepting only legitimate images (JPEG, PNG, WebP, GIF) and PDFs under 10MB.</li>
    <li><strong>Graceful Shutdown:</strong> The backend catches <code>SIGTERM</code> and <code>SIGINT</code> signals to complete pending transactions and cleanly close database pools before restart.</li>
  </ul>

  <h3>3. Step-by-Step Production Launch Sequence</h3>
  <ol class="steps-list">
    <li class="step-item">
      <div class="step-title">Configure Production Environment Variables</div>
      <div class="step-body">Copy <code>backend/.env.example</code> to <code>backend/.env</code>. Supply strong 64-character cryptographic keys for <code>JWT_SECRET</code> and <code>JWT_REFRESH_SECRET</code>. Set <code>NODE_ENV=production</code>.</div>
    </li>
    <li class="step-item">
      <div class="step-title">Synchronize Database Schema</div>
      <div class="step-body">Run <code>npx prisma db push</code> and <code>npx prisma generate</code> inside <code>backend/</code> to apply all foreign keys, enums, and hot query indexes to PostgreSQL.</div>
    </li>
    <li class="step-item">
      <div class="step-title">Build Frontend & Backend Bundles</div>
      <div class="step-body">Execute <code>npm run build</code> in both directories. The frontend outputs minified assets with code splitting into <code>frontend/dist/</code>.</div>
    </li>
    <li class="step-item">
      <div class="step-title">Deploy with Docker Compose or PM2</div>
      <div class="step-body">For containerized hosting, run <code>docker compose up -d --build</code>. For VPS bare-metal hosting, start the API via <code>pm2 start ecosystem.config.js</code> and configure Nginx using the supplied <code>nginx.conf</code> template.</div>
    </li>
  </ol>

  <div style="margin-top: 40px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 25px; color: #94a3b8; font-size: 8.5pt;">
    <strong>Engrew Hebrew & English Academy</strong> • Official Platform Owner Operational Manual<br>
    Copyright &copy; 2026 Engrew Academy. All Rights Reserved. Confidential & Proprietary.
  </div>

</body>
</html>
`;

async function generatePDF() {
  console.log('Writing HTML manual file...');
  const htmlPath = path.join(__dirname, '../docs/manual/Engrew_Manual.html');
  fs.writeFileSync(htmlPath, htmlContent);

  console.log('Launching Chrome for high-precision PDF compilation...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files'],
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 2000));

  console.log('Rendering PDF document...');
  const pdfBuffer = await page.pdf({
    path: OUTPUT_PDF,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="font-size: 8pt; width: 100%; color: #94a3b8; font-family: 'Plus Jakarta Sans', sans-serif; padding: 0 16mm; display: flex; justify-content: space-between; align-items: center;">
        <span>Engrew Academy • Platform Owner & Super Administrator Manual</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `,
    margin: {
      top: '16mm',
      right: '16mm',
      bottom: '18mm',
      left: '16mm'
    }
  });

  // Output PDF
  console.log('PDF generated successfully!');
  const stats = fs.statSync(OUTPUT_PDF);
  console.log(`File Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Location: ${OUTPUT_PDF}`);

  fs.copyFileSync(OUTPUT_PDF, DOCS_PDF);
  console.log(`Also saved to docs: ${DOCS_PDF}`);

  await browser.close();
}

generatePDF().catch(console.error);
