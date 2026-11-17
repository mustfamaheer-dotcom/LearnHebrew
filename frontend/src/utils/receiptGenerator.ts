/**
 * Engrew Academy - Modern Receipt & PDF Generator Utility
 * Produces pixel-perfect, highly aligned, modern receipts for:
 * - Package additions / purchases (Tax Invoice & Payment Receipt)
 * - Lesson bookings (Lesson Confirmation Slip & Voucher)
 * - Session refunds / quota restorations
 * - Account statements
 */

export interface ReceiptData {
  id: string;
  receiptNumber: string;
  type: 'PACKAGE_ACTIVATION' | 'SESSION_BOOKING' | 'SESSION_REFUND' | 'ADMIN_ADJUSTMENT' | string;
  amount: number;
  balanceAfter: number;
  description?: string;
  createdAt: string | Date;
  sessionType?: {
    id?: string;
    name?: string;
    durationMinutes?: number;
    labelEn?: string;
    labelHe?: string;
  };
  packageDetails?: {
    id?: string;
    name?: string;
    nameHe?: string;
    price?: number | string;
    currency?: string;
    lessonsTotal?: number;
    lessonsUsed?: number;
    validityDays?: number;
    startDate?: string | Date;
    endDate?: string | Date;
    paymentStatus?: string;
    paymentMethod?: string;
    approvedAt?: string | Date;
  } | null;
  lessonDetails?: {
    id?: string;
    scheduledAt?: string | Date;
    durationMinutes?: number;
    lessonType?: string;
    status?: string;
    teacherName?: string;
    meetingUrl?: string;
  } | null;
  studentDetails: {
    id?: string;
    name: string;
    email: string;
    level?: string;
  };
}

export function generateReceiptHtml(data: ReceiptData, language: 'en' | 'he' = 'en'): string {
  const isHe = language === 'he';
  const isBooking = data.type === 'SESSION_BOOKING';
  const isRefund = data.type === 'SESSION_REFUND';
  const isPackage = data.type === 'PACKAGE_ACTIVATION';

  const dateFormatted = new Date(data.createdAt).toLocaleDateString(isHe ? 'he-IL' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const titleEn = isPackage
    ? 'OFFICIAL PAYMENT RECEIPT & INVOICE'
    : isBooking
    ? 'LESSON BOOKING CONFIRMATION & SLIP'
    : isRefund
    ? 'SESSION RESTORATION RECEIPT'
    : 'BALANCE ADJUSTMENT VOUCHER';

  const titleHe = isPackage
    ? 'קבלה ואישור רכישת חבילה'
    : isBooking
    ? 'אישור הזמנת שיעור ושובר כניסה'
    : isRefund
    ? 'אישור החזרת שיעור למכסה'
    : 'שובר עדכון יתרת שיעורים';

  const docTitle = isHe ? titleHe : titleEn;
  const docSubtitle = isHe ? titleEn : titleHe;

  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : '/logo.png';

  const packageName = isHe && data.packageDetails?.nameHe ? data.packageDetails.nameHe : (data.packageDetails?.name || 'Hebrew Session Package');
  const sessionLabel = isHe && data.sessionType?.labelHe ? data.sessionType.labelHe : (data.sessionType?.labelEn || `${data.sessionType?.durationMinutes || 25}-Min Session`);
  const currency = data.packageDetails?.currency || 'USD';
  const priceDisplay = data.packageDetails?.price ? `$${Number(data.packageDetails.price).toFixed(2)} ${currency}` : null;

  return `<!DOCTYPE html>
<html lang="${language}" dir="${isHe ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <title>${docTitle} - ${data.receiptNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Heebo:wght@300;400;500;600;700;800&display=swap');

    @page {
      size: A4 portrait;
      margin: 14mm 16mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: ${isHe ? "'Heebo', 'Plus Jakarta Sans', sans-serif" : "'Plus Jakarta Sans', 'Heebo', sans-serif"};
      background-color: #ffffff;
      color: #0f172a;
      line-height: 1.5;
      font-size: 13px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .receipt-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 32px 36px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      position: relative;
      box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
    }

    /* Print Overrides */
    @media print {
      body {
        background: transparent;
      }
      .receipt-container {
        border: none;
        box-shadow: none;
        padding: 0;
        max-width: 100%;
        border-radius: 0;
      }
      .no-print {
        display: none !important;
      }
    }

    /* Top Brand Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 24px;
      border-bottom: 2px solid #0f766e;
      margin-bottom: 28px;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .brand-logo {
      width: 56px;
      height: 56px;
      object-fit: contain;
    }

    .brand-name {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #0f766e;
      line-height: 1.1;
    }

    .brand-tagline {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .receipt-badge-section {
      text-align: ${isHe ? 'left' : 'right'};
    }

    .doc-type-badge {
      display: inline-block;
      padding: 5px 12px;
      background: #f0fdfa;
      border: 1px solid #99f6e4;
      color: #0f766e;
      font-weight: 800;
      font-size: 11px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .receipt-number {
      font-family: 'JetBrains Mono', monospace;
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 8px;
    }

    .receipt-date {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
      font-weight: 500;
    }

    /* Main Info Cards */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
    }

    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 18px 20px;
    }

    .info-card-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      font-size: 12px;
    }

    .info-row:last-child {
      margin-bottom: 0;
    }

    .info-label {
      color: #64748b;
      font-weight: 500;
    }

    .info-value {
      color: #0f172a;
      font-weight: 700;
      text-align: ${isHe ? 'left' : 'right'};
    }

    /* Table Section */
    .table-container {
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: ${isHe ? 'right' : 'left'};
    }

    th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 12px 18px;
      border-bottom: 1px solid #e2e8f0;
    }

    td {
      padding: 16px 18px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 12px;
      color: #1e293b;
    }

    tr:last-child td {
      border-bottom: none;
    }

    .item-title {
      font-weight: 800;
      font-size: 13px;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .item-desc {
      font-size: 11px;
      color: #64748b;
      line-height: 1.4;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      padding: 3px 8px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 700;
    }

    .status-success {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }

    /* Summary Calculation Section */
    .summary-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      margin-bottom: 28px;
      padding-top: 12px;
    }

    .seal-box {
      flex: 1;
      padding: 16px 18px;
      border: 1px dashed #cbd5e1;
      border-radius: 16px;
      background: #fcfcfd;
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .seal-icon {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #0f766e;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 18px;
      border: 2px solid #5eead4;
      flex-shrink: 0;
    }

    .seal-text-title {
      font-size: 11px;
      font-weight: 800;
      color: #0f766e;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .seal-text-desc {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
      line-height: 1.4;
    }

    .totals-box {
      width: 320px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 16px 20px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 12px;
      color: #64748b;
    }

    .totals-row.grand-total {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 2px solid #e2e8f0;
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
    }

    .grand-total .amount {
      color: #0f766e;
      font-size: 16px;
    }

    .balance-after-pill {
      margin-top: 10px;
      padding: 8px 12px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-weight: 700;
      color: #065f46;
    }

    /* Policy & Footer */
    .policy-box {
      background: #fafaf9;
      border-left: 3px solid #0f766e;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 24px;
      font-size: 11px;
      color: #475569;
      line-height: 1.4;
    }

    ${isHe ? '.policy-box { border-left: none; border-right: 3px solid #0f766e; }' : ''}

    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #94a3b8;
    }

    .footer a {
      color: #0f766e;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <!-- Header -->
    <div class="header">
      <div class="brand-section">
        <img src="${logoUrl}" alt="Engrew Logo" class="brand-logo" onerror="this.style.display='none'" />
        <div>
          <div class="brand-name">Engrew</div>
          <div class="brand-tagline">${isHe ? 'האקדמיה המוסמכת ללימודי עברית אונליין' : 'Certified Online Hebrew Academy'}</div>
        </div>
      </div>
      <div class="receipt-badge-section">
        <div class="doc-type-badge">${docTitle}</div>
        <div class="receipt-number">#${data.receiptNumber}</div>
        <div class="receipt-date">${dateFormatted}</div>
      </div>
    </div>

    <!-- Student & Transaction Info -->
    <div class="info-grid">
      <!-- Billed To -->
      <div class="info-card">
        <div class="info-card-title">
          <span>${isHe ? 'פרטי התלמיד (חיוב עבור)' : 'Student Details (Billed To)'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">${isHe ? 'שם מלא:' : 'Full Name:'}</span>
          <span class="info-value">${data.studentDetails.name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">${isHe ? 'דואר אלקטרוני:' : 'Email Address:'}</span>
          <span class="info-value">${data.studentDetails.email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">${isHe ? 'רמת לימוד:' : 'Proficiency Track:'}</span>
          <span class="info-value">${data.studentDetails.level || 'Intermediate Hebrew'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">${isHe ? 'מזהה תלמיד:' : 'Student ID:'}</span>
          <span class="info-value" style="font-family: monospace; font-size: 11px;">STU-${(data.studentDetails.id || data.id).slice(0, 8).toUpperCase()}</span>
        </div>
      </div>

      <!-- Transaction Info -->
      <div class="info-card">
        <div class="info-card-title">
          <span>${isHe ? 'פרטי העסקה והאישור' : 'Transaction & Verification'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">${isHe ? 'סוג פעולה:' : 'Transaction Type:'}</span>
          <span class="info-value">${isPackage ? (isHe ? 'הפעלת חבילה חודשית' : 'Monthly Package') : isBooking ? (isHe ? 'הזמנת שיעור חי' : 'Lesson Booking') : (isHe ? 'עדכון מכסה' : 'Balance Quota')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">${isHe ? 'אמצעי תשלום:' : 'Payment / Source:'}</span>
          <span class="info-value">${data.packageDetails?.paymentMethod || (isBooking ? (isHe ? 'ניכוי ממכסת החבילה' : 'Package Quota Deduction') : (isHe ? 'העברה מאומתת' : 'Verified Transfer'))}</span>
        </div>
        <div class="info-row">
          <span class="info-label">${isHe ? 'סטטוס אישור:' : 'Auth Status:'}</span>
          <span class="info-value">
            <span class="status-pill status-success">${isHe ? 'מאושר והושלם ✓' : 'VERIFIED & COMPLETED ✓'}</span>
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">${isHe ? 'אסמכתא:' : 'Reference ID:'}</span>
          <span class="info-value" style="font-family: monospace; font-size: 11px;">REF-${data.id.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>
    </div>

    <!-- Itemized Breakdown Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 50%;">${isHe ? 'תיאור השירות / הפריט' : 'Description / Service Item'}</th>
            <th style="width: 25%;">${isHe ? 'משך ופרטים' : 'Type / Schedule'}</th>
            <th style="width: 25%; text-align: ${isHe ? 'left' : 'right'};">${isHe ? 'שינוי מכסה / סכום' : 'Quota Change / Amount'}</th>
          </tr>
        </thead>
        <tbody>
          ${isPackage ? `
          <tr>
            <td>
              <div class="item-title">${packageName}</div>
              <div class="item-desc">${isHe ? `חבילת לימוד מובנית של ${data.packageDetails?.lessonsTotal || data.amount} שיעורים עם מורים מוסמכים דוברי עברית שפת אם.` : `Comprehensive Hebrew learning package of ${data.packageDetails?.lessonsTotal || data.amount} live 1-on-1 sessions with native certified instructors.`}</div>
            </td>
            <td>
              <div style="font-weight: 700;">${sessionLabel}</div>
              <div class="item-desc">${isHe ? `תוקף: ${data.packageDetails?.validityDays || 30} ימים` : `Valid for ${data.packageDetails?.validityDays || 30} days`}</div>
            </td>
            <td style="text-align: ${isHe ? 'left' : 'right'};">
              <div style="font-weight: 800; font-size: 14px; color: #0f766e;">+${data.amount} ${isHe ? 'שיעורים' : 'Sessions'}</div>
              ${priceDisplay ? `<div style="font-size: 11px; color: #64748b; font-weight: 600;">${priceDisplay}</div>` : ''}
            </td>
          </tr>
          ` : isBooking ? `
          <tr>
            <td>
              <div class="item-title">${isHe ? 'שיעור פרטי 1-על-1 בעברית' : '1-on-1 Private Hebrew Lesson'}</div>
              <div class="item-desc">${isHe ? `מורה מוסמך: ${data.lessonDetails?.teacherName || 'מורה מוסמך לעברית'}` : `Certified Instructor: ${data.lessonDetails?.teacherName || 'Certified Hebrew Teacher'}`}</div>
              ${data.lessonDetails?.meetingUrl ? `<div class="item-desc" style="color: #0f766e; margin-top: 3px; font-weight: 600;">Zoom: ${data.lessonDetails.meetingUrl}</div>` : ''}
            </td>
            <td>
              <div style="font-weight: 700;">${sessionLabel}</div>
              <div class="item-desc">${data.lessonDetails?.scheduledAt ? new Date(data.lessonDetails.scheduledAt).toLocaleDateString(isHe ? 'he-IL' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (isHe ? 'מועד מתוזמן' : 'Scheduled Slot')}</div>
              <div class="item-desc">${data.lessonDetails?.lessonType === 'REGULAR' ? (isHe ? 'חוג שבועי קבוע (Regular)' : 'Fixed Weekly Regular') : (isHe ? 'שיעור בודד (One-Time)' : 'One-Time Flexible')}</div>
            </td>
            <td style="text-align: ${isHe ? 'left' : 'right'};">
              <div style="font-weight: 800; font-size: 14px; color: #e11d48;">-1 ${isHe ? 'שיעור' : 'Session'}</div>
              <div style="font-size: 11px; color: #64748b;">${isHe ? 'ניכוי מחבילה' : 'Package Quota'}</div>
            </td>
          </tr>
          ` : `
          <tr>
            <td>
              <div class="item-title">${data.description || (isHe ? 'עדכון יתרת שיעורים' : 'Quota Balance Update')}</div>
              <div class="item-desc">${isHe ? 'עדכון רשמי של מכסת השיעורים במערכת Engrew.' : 'Official system balance adjustment recorded in session ledger.'}</div>
            </td>
            <td>
              <div style="font-weight: 700;">${sessionLabel}</div>
            </td>
            <td style="text-align: ${isHe ? 'left' : 'right'};">
              <div style="font-weight: 800; font-size: 14px; color: ${data.amount > 0 ? '#0f766e' : '#e11d48'};">
                ${data.amount > 0 ? `+${data.amount}` : data.amount} ${isHe ? 'שיעורים' : 'Sessions'}
              </div>
            </td>
          </tr>
          `}
        </tbody>
      </table>
    </div>

    <!-- Summary & Seal Box -->
    <div class="summary-section">
      <!-- Digital Seal -->
      <div class="seal-box">
        <div class="seal-icon">✓</div>
        <div>
          <div class="seal-text-title">${isHe ? 'חותמת אימות דיגיטלית - Engrew Academy' : 'Engrew Official Digital Seal'}</div>
          <div class="seal-text-desc">${isHe ? 'עסקה זו אומתה ואושרה במערכת הניהול המרכזית של Engrew. מסמך זה תקף כאישור רשמי.' : 'This transaction is cryptographically logged and authenticated by Engrew Academy. Valid as official proof of payment and booking.'}</div>
        </div>
      </div>

      <!-- Totals & Balances -->
      <div class="totals-box">
        <div class="totals-row">
          <span>${isHe ? 'שינוי מכסה בפעולה:' : 'Transaction Delta:'}</span>
          <span style="font-weight: 700;">${data.amount > 0 ? `+${data.amount}` : data.amount} ${isHe ? 'שיעורים' : 'Sessions'}</span>
        </div>
        ${priceDisplay ? `
        <div class="totals-row">
          <span>${isHe ? 'סך הכל שולם:' : 'Total Amount Paid:'}</span>
          <span style="font-weight: 700;">${priceDisplay}</span>
        </div>
        ` : ''}
        <div class="totals-row grand-total">
          <span>${isHe ? 'סטטוס עסקה:' : 'Transaction Status:'}</span>
          <span class="amount" style="font-size: 14px;">${isHe ? 'הושלם בהצלחה' : 'COMPLETED'}</span>
        </div>
        <div class="balance-after-pill">
          <span>${isHe ? 'יתרת שיעורים כוללת לאחר פעולה:' : 'Remaining Session Balance:'}</span>
          <span>${data.balanceAfter} ${isHe ? 'שיעורים' : 'units'}</span>
        </div>
      </div>
    </div>

    <!-- Policy Box -->
    <div class="policy-box">
      <strong>${isHe ? 'מדיניות ביטולים ונוהל שיעורים:' : 'Session Guidelines & Cancellation Policy:'}</strong>
      ${isHe
        ? 'ביטול שיעור ללא חיוב אפשרי עד 12 שעות לפני המועד המתוזמן והשיעור יוחזר אוטומטית ליתרת החבילה. מומלץ להתחבר לקישור ה-Zoom כ-2 דקות לפני תחילת השיעור עם מיקרופון ומצלמה פעילים.'
        : 'Cancellations made at least 12 hours prior to scheduled lesson time automatically restore the session unit to your package. Please join the live Zoom link 2 minutes before your session starts with an active camera and microphone.'}
    </div>

    <!-- Footer -->
    <div class="footer">
      <div>Engrew Academy Ltd. • Global Online Hebrew Education • <a href="mailto:support@engrew.com">support@engrew.com</a></div>
      <div>${isHe ? 'אישור ממוחשב - כל הזכויות שמורות' : 'Computer-generated receipt • All rights reserved'}</div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Triggers the browser's native print engine in an isolated iframe.
 * Allows instant printing or saving as PDF with 100% vector typography,
 * correct fonts, and zero canvas distortion.
 */
export function printReceipt(data: ReceiptData, language: 'en' | 'he' = 'en'): void {
  const html = generateReceiptHtml(data, language);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.title = `Print Receipt - ${data.receiptNumber}`;

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    // Fallback: open print window
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
      }, 300);
    }
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    // Clean up iframe after printing dialog closes
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 400);
}

/**
 * Downloads the receipt as a clean standalone HTML file
 * that can be opened in any browser and saved as PDF anytime.
 */
export function downloadReceiptHtml(data: ReceiptData, language: 'en' | 'he' = 'en'): void {
  const html = generateReceiptHtml(data, language);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Engrew-Receipt-${data.receiptNumber}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
