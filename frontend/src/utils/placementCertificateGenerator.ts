export interface CertificateData {
  candidateName: string;
  email: string;
  phone: string;
  evaluatedLevel: string; // 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  score: number;
  totalQuestions: number;
  timeSpentSeconds?: number;
  submissionId?: string;
  issuedAt?: string | Date;
}

export function generateCertificateHtml(data: CertificateData, lang: 'he' | 'en' | 'ar' = 'en'): string {
  const isRtl = lang === 'he' || lang === 'ar';
  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : 'https://engrew.com/logo.png';

  const dateStr = data.issuedAt
    ? new Date(data.issuedAt).toLocaleDateString(lang === 'he' ? 'he-IL' : lang === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString(lang === 'he' ? 'he-IL' : lang === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  const certNumber = data.submissionId
    ? `ENG-${data.submissionId.slice(-8).toUpperCase()}`
    : `ENG-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  const accuracy = Math.round((data.score / (data.totalQuestions || 36)) * 100);

  // CEFR descriptions
  const levelDescriptions: Record<string, { en: string; he: string; ar: string; titleEn: string; titleHe: string; titleAr: string }> = {
    A1: {
      titleEn: 'Beginner / Elementary',
      titleHe: 'רמת מתחילים / יסוד (A1)',
      titleAr: 'مستوى تأسيسي / مبتدئ (A1)',
      en: 'Demonstrates basic capability to understand and use familiar everyday expressions and simple phrases for concrete communicative needs.',
      he: 'מפגין יכולת בסיסית להבין ולהשתמש בביטויים יומיומיים מוכרים ובמשפטים פשוטים לצרכים מעשיים.',
      ar: 'يظهر قدرة أساسية على فهم واستخدام التعبيرات اليومية المألوفة والجمل البسيطة لتلبية الاحتياجات العملية.',
    },
    A2: {
      titleEn: 'Pre-Intermediate',
      titleHe: 'קדם-בינוני (A2)',
      titleAr: 'ما قبل المتوسط (A2)',
      en: 'Can understand sentences and frequently used expressions related to immediate areas, communicating in simple and routine daily tasks.',
      he: 'מסוגל להבין משפטים וביטויים שכיחים בנושאים קרובים, ולתקשר במשימות שגרתיות ופשוטות.',
      ar: 'يستطيع فهم الجمل والتعبيرات المتداولة في المجالات المباشرة والتواصل في المهام الروتينية المعتادة.',
    },
    B1: {
      titleEn: 'Intermediate',
      titleHe: 'רמת ביניים (B1)',
      titleAr: 'المستوى المتوسط (B1)',
      en: 'Can understand standard speech on familiar matters in work and study, producing coherent texts and navigating most English environments.',
      he: 'מסוגל להבין שיחות וטקסטים סטנדרטיים בעבודה, לימודים ופנאי, ולהתמודד עם מרבית מצבי התקשורת באנגלית.',
      ar: 'يستطيع فهم النقاط الأساسية في المحادثات والنصوص القياسية في العمل والدراسة والتعامل مع معظم المواقف.',
    },
    B2: {
      titleEn: 'Upper-Intermediate',
      titleHe: 'בינוני-גבוה (B2)',
      titleAr: 'فوق المتوسط (B2)',
      en: 'Can comprehend complex ideas on both concrete and abstract topics, interacting with native speakers with a high degree of natural fluency.',
      he: 'מבין רעיונות מורכבים בנושאים מוחשיים ומופשטים, ומקיים אינטראקציה שוטפת וטבעית עם דוברי שפת אם ללא קושי.',
      ar: 'يستوعب الأفكار المعقدة في المواضيع الملموسة والمجردة ويتفاعل بطلاقة وعفوية مع المتحدثين الأصليين دون عناء.',
    },
    C1: {
      titleEn: 'Advanced',
      titleHe: 'רמה מתקדמת (C1)',
      titleAr: 'مستوى متقدم (C1)',
      en: 'Possesses fluent, flexible command of English for social, academic and professional environments with subtle idiomatic expression.',
      he: 'שליטה רהוטה וגמישה בשפה האנגלית לצרכים חברתיים, אקדמיים ומקצועיים ברמת דיוק גבוהה.',
      ar: 'يتمتع بكفاءة لغوية متقدمة ومرنة للأغراض الاجتماعية والأكاديمية والمهنية وتعبير طبيعي بليغ.',
    },
    C2: {
      titleEn: 'Proficient / Mastery',
      titleHe: 'מיומנות שפתית מלאה (C2)',
      titleAr: 'إتقان واحتراف كامل (C2)',
      en: 'Has attained complete mastery, comprehending virtually everything heard or read with native-level precision and spontaneity.',
      he: 'שליטה מלאה ושוטפת באנגלית ברמת שפת אם, עם הבנה ויכולת ניסוח מושלמת בכל הקשר.',
      ar: 'حقق إتقاناً تاماً وكفاءة تماثل المتحدثين الأصليين مع استيعاب دقيق وتعبير تلقائي فائق.',
    },
  };

  const currentLevelInfo = levelDescriptions[data.evaluatedLevel] || levelDescriptions.B1;
  const levelTitle = lang === 'he' ? currentLevelInfo.titleHe : lang === 'ar' ? currentLevelInfo.titleAr : currentLevelInfo.titleEn;
  const levelDesc = lang === 'he' ? currentLevelInfo.he : lang === 'ar' ? currentLevelInfo.ar : currentLevelInfo.en;

  // Bilingual strings
  const labels = {
    en: {
      docTitle: 'OFFICIAL CERTIFICATE OF ENGLISH PROFICIENCY',
      badgeText: 'CEFR BENCHMARK EVALUATION',
      awardedTo: 'THIS OFFICIAL CERTIFICATE IS PROUDLY AWARDED TO',
      evaluatedLevel: 'OFFICIALLY EVALUATED LEVEL',
      accuracy: 'Accuracy Rate',
      score: 'Correct Score',
      totalQuestions: 'Total Questions',
      framework: 'COMMON EUROPEAN FRAMEWORK (CEFR) BENCHMARK',
      certId: 'Certificate ID',
      issueDate: 'Issue Date',
      verifiedBy: 'Verified by Engrew Academy Academic Evaluation Committee',
      directorTitle: 'Academic Director & Assessment Board',
      watermark: 'OFFICIAL VERIFIED CERTIFICATE',
      footerNote: 'Issued under Engrew Academy Standardized Online Assessment System. Valid for academic placement and tracking.',
    },
    he: {
      docTitle: 'תעודה רשמית להערכת רמת אנגלית',
      badgeText: 'הערכת תקן אירופי CEFR',
      awardedTo: 'תעודה רשמית זו מוענקת בזאת בהערכה אל',
      evaluatedLevel: 'רמת האנגלית שהוערכה',
      accuracy: 'אחוז דיוק',
      score: 'תשובות נכונות',
      totalQuestions: 'שאלות במבחן',
      framework: 'מדרג הרמות האירופי המאוחד (CEFR)',
      certId: 'מספר תעודה',
      issueDate: 'תאריך הנפקה',
      verifiedBy: 'אושר ונבדק על ידי הוועדה הפדגוגית של אקדמיית אינגרו',
      directorTitle: 'הנהלה פדגוגית וועדת הערכה',
      watermark: 'תעודה רשמית מאומתת',
      footerNote: 'הונפק באמצעות מערכת ההערכה הממוחשבת של Engrew Academy. תקף לשיבוץ וקידום אקדמי.',
    },
    ar: {
      docTitle: 'شهادة رسمية لتقييم كفاءة اللغة الإنجليزية',
      badgeText: 'معيار الإطار الأوروبي المشترك CEFR',
      awardedTo: 'تُمنح هذه الشهادة الرسمية بكل فخر واعتزاز إلى',
      evaluatedLevel: 'المستوى المعتمد المقيّم',
      accuracy: 'نسبة الدقة',
      score: 'الإجابات الصحيحة',
      totalQuestions: 'إجمالي الأسئلة',
      framework: 'الإطار المرجعي الأوروبي المشترك للغات (CEFR)',
      certId: 'رقم الشهادة',
      issueDate: 'تاريخ الإصدار',
      verifiedBy: 'تم التدقيق والاعتماد من قبل الهيئة الأكاديمية لأكاديمية إنجرو',
      directorTitle: 'الإدارة الأكاديمية وهيئة التقييم',
      watermark: 'شهادة رسمية معتمدة',
      footerNote: 'صادرة عن نظام التقييم القياسي المعتمد لأكاديمية Engrew. معتمدة للتسكين والمسار التدريبي.',
    },
  }[lang];

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${isRtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <title>${labels.docTitle} - ${data.candidateName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Heebo:wght@400;500;600;700;800;900&family=Cairo:wght@500;600;700;800;900&display=swap');

    @page {
      size: A4 portrait;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: ${lang === 'ar' ? "'Cairo', sans-serif" : lang === 'he' ? "'Heebo', sans-serif" : "'Plus Jakarta Sans', sans-serif"};
      background-color: #f8fafc;
      color: #0f172a;
      line-height: 1.4;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }

    .cert-container {
      width: 794px; /* A4 width at 96 DPI */
      height: 1123px; /* A4 height at 96 DPI */
      max-width: 794px;
      max-height: 1123px;
      background: #ffffff;
      position: relative;
      padding: 50px 55px;
      border-radius: 0;
      box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.15);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }

    /* Print Overrides */
    @media print {
      body {
        background: transparent !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .cert-container {
        width: 100% !important;
        height: 100vh !important;
        max-width: none !important;
        max-height: none !important;
        box-shadow: none !important;
        border: none !important;
        padding: 48px 52px !important;
      }
    }

    /* Luxury Outer & Inner Borders */
    .outer-frame {
      position: absolute;
      top: 18px;
      left: 18px;
      right: 18px;
      bottom: 18px;
      border: 2px solid #0d9488;
      pointer-events: none;
    }

    .inner-frame {
      position: absolute;
      top: 24px;
      left: 24px;
      right: 24px;
      bottom: 24px;
      border: 1px solid #99f6e4;
      pointer-events: none;
    }

    .corner-ornament {
      position: absolute;
      width: 16px;
      height: 16px;
      border-color: #0d9488;
      border-style: solid;
      pointer-events: none;
    }
    .corner-tl { top: 12px; left: 12px; border-width: 3px 0 0 3px; }
    .corner-tr { top: 12px; right: 12px; border-width: 3px 3px 0 0; }
    .corner-bl { bottom: 12px; left: 12px; border-width: 0 0 3px 3px; }
    .corner-br { bottom: 12px; right: 12px; border-width: 0 3px 3px 0; }

    /* Top Brand Bar */
    .brand-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 20px;
      position: relative;
      z-index: 2;
    }

    .brand-logo-wrap {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .brand-logo-img {
      height: 48px;
      width: auto;
      object-fit: contain;
    }

    .brand-title {
      font-size: 20px;
      font-weight: 900;
      color: #042f2e;
      letter-spacing: -0.5px;
      line-height: 1.1;
    }

    .brand-subtitle {
      font-size: 10px;
      font-weight: 700;
      color: #0d9488;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }

    .badge-cefr-top {
      background: linear-gradient(135deg, #0d9488, #059669);
      color: #ffffff;
      padding: 6px 14px;
      border-radius: 30px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      box-shadow: 0 4px 12px rgba(13, 148, 136, 0.25);
    }

    /* Main Certificate Titles */
    .cert-heading-block {
      text-align: center;
      margin-top: 15px;
      margin-bottom: 15px;
      position: relative;
      z-index: 2;
    }

    .cert-main-title {
      font-size: 24px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }

    .cert-sub-title {
      font-size: 12px;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    /* Candidate Presentation */
    .candidate-block {
      text-align: center;
      margin: 10px 0 20px;
      position: relative;
      z-index: 2;
    }

    .awarded-to-label {
      font-size: 11px;
      font-weight: 700;
      color: #0d9488;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 10px;
    }

    .candidate-name {
      font-size: 34px;
      font-weight: 900;
      color: #042f2e;
      letter-spacing: -0.5px;
      display: inline-block;
      padding: 2px 28px 8px;
      border-bottom: 3px solid #14b8a6;
      margin-bottom: 6px;
    }

    .candidate-contact {
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
    }

    /* Level Highlight Card */
    .hero-level-card {
      background: linear-gradient(145deg, #f0fdfa, #ccfbf1);
      border: 1.5px solid #5eead4;
      border-radius: 20px;
      padding: 22px 28px;
      display: flex;
      align-items: center;
      gap: 28px;
      box-shadow: 0 6px 18px rgba(13, 148, 136, 0.08);
      position: relative;
      z-index: 2;
      margin-bottom: 20px;
    }

    .level-circle {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0d9488, #047857);
      color: #ffffff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 20px rgba(13, 148, 136, 0.35);
      border: 4px solid #ffffff;
      flex-shrink: 0;
    }

    .level-code {
      font-size: 38px;
      font-weight: 900;
      line-height: 1;
      letter-spacing: -1px;
    }

    .level-tag {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.9;
    }

    .level-details {
      flex: 1;
    }

    .level-title-text {
      font-size: 18px;
      font-weight: 800;
      color: #042f2e;
      margin-bottom: 6px;
    }

    .level-description-text {
      font-size: 12px;
      color: #334155;
      line-height: 1.5;
      font-weight: 500;
    }

    /* Metrics Grid */
    .metrics-bar {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-bottom: 22px;
      position: relative;
      z-index: 2;
    }

    .metric-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 12px 16px;
      text-align: center;
    }

    .metric-value {
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.1;
      margin-bottom: 4px;
    }

    .metric-label {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* CEFR Framework Scale Bar */
    .scale-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 16px 20px;
      margin-bottom: 24px;
      position: relative;
      z-index: 2;
    }

    .scale-title {
      font-size: 10px;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 1px;
      text-align: center;
      margin-bottom: 12px;
    }

    .scale-stages {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
    }

    .scale-stage {
      padding: 10px 4px;
      border-radius: 10px;
      text-align: center;
      background: #f1f5f9;
      color: #64748b;
      font-size: 11px;
      font-weight: 800;
      transition: all 0.2s;
    }

    .scale-stage.active {
      background: linear-gradient(135deg, #0d9488, #059669);
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
      transform: scale(1.05);
      border: 1.5px solid #2dd4bf;
    }

    .scale-stage-sub {
      display: block;
      font-size: 8px;
      font-weight: 700;
      opacity: 0.85;
      margin-top: 2px;
    }

    /* Verification & Signature Section */
    .cert-footer-section {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      border-top: 1.5px solid #e2e8f0;
      padding-top: 20px;
      position: relative;
      z-index: 2;
    }

    .cert-meta-info {
      font-size: 11px;
      color: #475569;
      line-height: 1.6;
    }

    .cert-meta-bold {
      font-weight: 800;
      color: #0f172a;
    }

    .cert-stamp-wrap {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .official-seal {
      width: 78px;
      height: 78px;
      border-radius: 50%;
      border: 2px dashed #0d9488;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      background: #f0fdfa;
      color: #0f766e;
      padding: 6px;
    }

    .seal-text-top {
      font-size: 7px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .seal-star {
      font-size: 12px;
      margin: 2px 0;
      color: #0d9488;
    }

    .seal-text-bottom {
      font-size: 6.5px;
      font-weight: 800;
      text-transform: uppercase;
    }

    .signature-block {
      text-align: center;
      width: 170px;
    }

    .signature-svg {
      width: 140px;
      height: 42px;
      margin: 0 auto 4px;
    }

    .signature-line {
      height: 1.5px;
      background: #0f172a;
      width: 100%;
      margin-bottom: 4px;
    }

    .signature-name {
      font-size: 11px;
      font-weight: 800;
      color: #0f172a;
    }

    .signature-role {
      font-size: 9px;
      color: #64748b;
      font-weight: 600;
    }

    /* Sub-footer Note */
    .legal-note {
      text-align: center;
      font-size: 8.5px;
      color: #94a3b8;
      font-weight: 500;
      margin-top: 14px;
      letter-spacing: 0.3px;
    }
  </style>
</head>
<body>

  <div class="cert-container">
    <!-- Ornaments & Borders -->
    <div class="outer-frame"></div>
    <div class="inner-frame"></div>
    <div class="corner-ornament corner-tl"></div>
    <div class="corner-ornament corner-tr"></div>
    <div class="corner-ornament corner-bl"></div>
    <div class="corner-ornament corner-br"></div>

    <!-- Header Section -->
    <div>
      <header class="brand-header">
        <div class="brand-logo-wrap">
          <img src="${logoUrl}" alt="Engrew Logo" class="brand-logo-img" onerror="this.style.display='none'" />
          <div>
            <div class="brand-title">ENGREW</div>
            <div class="brand-subtitle">Hebrew & English Academy</div>
          </div>
        </div>
        <div class="badge-cefr-top">
          ${labels.badgeText}
        </div>
      </header>

      <!-- Document Title -->
      <div class="cert-heading-block">
        <h1 class="cert-main-title">${labels.docTitle}</h1>
        <p class="cert-sub-title">${labels.framework}</p>
      </div>

      <!-- Candidate Name Block -->
      <div class="candidate-block">
        <div class="awarded-to-label">${labels.awardedTo}</div>
        <div class="candidate-name">${data.candidateName}</div>
        <div class="candidate-contact">${data.email} &bull; ${data.phone}</div>
      </div>

      <!-- Hero Level Badge Card -->
      <div class="hero-level-card">
        <div class="level-circle">
          <div class="level-code">${data.evaluatedLevel}</div>
          <div class="level-tag">CEFR</div>
        </div>
        <div class="level-details">
          <div class="level-title-text">${levelTitle}</div>
          <p class="level-description-text">${levelDesc}</p>
        </div>
      </div>

      <!-- Performance Metrics Grid -->
      <div class="metrics-bar">
        <div class="metric-item">
          <div class="metric-value">${data.score} / ${data.totalQuestions || 36}</div>
          <div class="metric-label">${labels.score}</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">${accuracy}%</div>
          <div class="metric-label">${labels.accuracy}</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">${data.evaluatedLevel}</div>
          <div class="metric-label">${labels.evaluatedLevel}</div>
        </div>
      </div>

      <!-- Visual CEFR Progression Scale -->
      <div class="scale-box">
        <div class="scale-title">${labels.framework}</div>
        <div class="scale-stages">
          <div class="scale-stage ${data.evaluatedLevel === 'A1' ? 'active' : ''}">
            A1
            <span class="scale-stage-sub">Elementary</span>
          </div>
          <div class="scale-stage ${data.evaluatedLevel === 'A2' ? 'active' : ''}">
            A2
            <span class="scale-stage-sub">Pre-Inter.</span>
          </div>
          <div class="scale-stage ${data.evaluatedLevel === 'B1' ? 'active' : ''}">
            B1
            <span class="scale-stage-sub">Intermediate</span>
          </div>
          <div class="scale-stage ${data.evaluatedLevel === 'B2' ? 'active' : ''}">
            B2
            <span class="scale-stage-sub">Upper-Inter.</span>
          </div>
          <div class="scale-stage ${data.evaluatedLevel === 'C1' ? 'active' : ''}">
            C1
            <span class="scale-stage-sub">Advanced</span>
          </div>
          <div class="scale-stage ${data.evaluatedLevel === 'C2' ? 'active' : ''}">
            C2
            <span class="scale-stage-sub">Proficient</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Verification & Signatures -->
    <div>
      <div class="cert-footer-section">
        <div class="cert-meta-info">
          <div><span class="cert-meta-bold">${labels.certId}:</span> ${certNumber}</div>
          <div><span class="cert-meta-bold">${labels.issueDate}:</span> ${dateStr}</div>
          <div><span class="cert-meta-bold">Verification:</span> engrew.com/placement-test</div>
          <div style="color: #0d9488; font-weight: 700; margin-top: 3px;">&#10003; ${labels.verifiedBy}</div>
        </div>

        <div class="cert-stamp-wrap">
          <div class="official-seal">
            <div class="seal-text-top">ENGREW ACADEMY</div>
            <div class="seal-star">&#9733; &#9733; &#9733;</div>
            <div class="seal-text-bottom">VERIFIED CEFR</div>
          </div>

          <div class="signature-block">
            <!-- Simulated elegant handwritten academic signature -->
            <svg class="signature-svg" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 35 C 35 15, 45 45, 65 25 C 80 10, 95 38, 115 28 C 135 18, 150 40, 185 20" stroke="#042f2e" stroke-width="2.5" stroke-linecap="round" fill="none"/>
              <path d="M45 40 C 60 50, 90 48, 140 42" stroke="#0d9488" stroke-width="1.8" stroke-linecap="round" fill="none"/>
            </svg>
            <div class="signature-line"></div>
            <div class="signature-name">Academic Board Director</div>
            <div class="signature-role">${labels.directorTitle}</div>
          </div>
        </div>
      </div>

      <p class="legal-note">
        ${labels.footerNote} &bull; &copy; ${new Date().getFullYear()} Engrew Hebrew & English Academy. All rights reserved.
      </p>
    </div>
  </div>

</body>
</html>`;
}

/**
 * Opens print preview immediately formatted for A4 PDF export
 */
export function printPlacementCertificate(data: CertificateData, lang: 'he' | 'en' | 'ar' = 'en'): void {
  const html = generateCertificateHtml(data, lang);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
      }, 400);
    }
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1200);
  }, 500);
}

/**
 * Downloads standalone HTML certificate
 */
export function downloadCertificateHtml(data: CertificateData, lang: 'he' | 'en' | 'ar' = 'en'): void {
  const html = generateCertificateHtml(data, lang);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Engrew-Certificate-${data.candidateName.replace(/\s+/g, '_')}-${data.evaluatedLevel}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
