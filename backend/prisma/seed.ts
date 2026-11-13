import { PrismaClient, Role, HebrewLevel, PackageStatus, GameType, SlotType, LessonStatus, HomeworkStatus, PointsEventType, PaymentStatus, AttendanceStatus, NotificationCategory, NotificationPriority } from '@prisma/client';
import bcrypt from 'bcryptjs';
import process from 'process';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting full dataset seeding for Engrew Hebrew & English Academy...');

  // 0. Clean existing transactional and relational data in safe foreign-key order
  console.log('Purging old sample data...');
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.pointsLedger.deleteMany();
  await prisma.balanceTransaction.deleteMany();
  await prisma.studentGameSession.deleteMany();
  await prisma.studentGameUnlock.deleteMany();
  await prisma.game.deleteMany();
  await prisma.studentLevelExam.deleteMany();
  await prisma.levelExam.deleteMany();
  await prisma.teacherSurvey.deleteMany();
  await prisma.lessonFeedback.deleteMany();
  await prisma.homework.deleteMany();
  await prisma.recordedSession.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.sessionBalanceLedger.deleteMany();
  await prisma.studentSessionBalance.deleteMany();
  await prisma.packageSessionItem.deleteMany();
  await prisma.studentPackage.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.package.deleteMany();
  await prisma.sessionType.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.student.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userNotificationPreference.deleteMany();
  await prisma.reviewLink.deleteMany();
  await prisma.pointRule.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.roleDefinition.deleteMany();
  await prisma.level.deleteMany();
  await prisma.language.deleteMany();

  // 1. Languages (Zero emojis)
  console.log('Seeding platform languages...');
  const langEn = await prisma.language.create({
    data: { code: 'en', labelEn: 'English', labelNative: 'English', flagEmoji: null, isActive: true },
  });
  const langHe = await prisma.language.create({
    data: { code: 'he', labelEn: 'Hebrew', labelNative: 'עברית', flagEmoji: null, isActive: true },
  });
  const langAr = await prisma.language.create({
    data: { code: 'ar', labelEn: 'Arabic', labelNative: 'العربية', flagEmoji: null, isActive: true },
  });
  const langFr = await prisma.language.create({
    data: { code: 'fr', labelEn: 'French', labelNative: 'Français', flagEmoji: null, isActive: true },
  });
  const langRu = await prisma.language.create({
    data: { code: 'ru', labelEn: 'Russian', labelNative: 'Русский', flagEmoji: null, isActive: true },
  });
  const langEs = await prisma.language.create({
    data: { code: 'es', labelEn: 'Spanish', labelNative: 'Español', flagEmoji: null, isActive: true },
  });

  // 2. Dynamic Curriculum Levels (Zero emojis)
  console.log('Seeding Hebrew proficiency levels (Alef - Vav)...');
  const levelAlef = await prisma.level.create({
    data: {
      code: 'BEGINNER',
      labelEn: 'Beginner (Alef)',
      labelHe: 'רמה א׳ - מתחילים',
      sortOrder: 1,
      color: '#0D9488',
      description: 'Foundations of reading Alef-Bet, vowel signs (Nikkud), basic greetings, and introduction phrases.',
    },
  });
  const levelBet = await prisma.level.create({
    data: {
      code: 'ELEMENTARY',
      labelEn: 'Elementary (Bet)',
      labelHe: 'רמה ב׳ - יסודי',
      sortOrder: 2,
      color: '#10B981',
      description: 'Present tense verbs (Paal), essential daily vocabulary, shopping, ordering at cafes, and asking directions.',
    },
  });
  const levelGimel = await prisma.level.create({
    data: {
      code: 'INTERMEDIATE',
      labelEn: 'Intermediate (Gimel)',
      labelHe: 'רמה ג׳ - בינוני',
      sortOrder: 3,
      color: '#F59E0B',
      description: 'Past and future tenses, prepositions, connecting words, reading easy Israeli news, and intermediate dialogs.',
    },
  });
  const levelDalet = await prisma.level.create({
    data: {
      code: 'UPPER_INTERMEDIATE',
      labelEn: 'Upper Intermediate (Dalet)',
      labelHe: 'רמה ד׳ - מתקדם קל',
      sortOrder: 4,
      color: '#6366F1',
      description: 'Advanced verb groups (Piel, Hifil), idioms, conversational slang, debating topics, and business culture.',
    },
  });
  const levelHei = await prisma.level.create({
    data: {
      code: 'ADVANCED',
      labelEn: 'Advanced (Hei)',
      labelHe: 'רמה ה׳ - מתקדמים',
      sortOrder: 5,
      color: '#8B5CF6',
      description: 'Complex syntactic structures, academic literature, media analysis, professional negotiation, and nuance.',
    },
  });
  const levelVav = await prisma.level.create({
    data: {
      code: 'FLUENT',
      labelEn: 'Mastery / Native-Like (Vav)',
      labelHe: 'רמה ו׳ - שפת אם ופטור',
      sortOrder: 6,
      color: '#EC4899',
      description: 'Exemption level (Ptor), complete linguistic mastery, Israeli humor, legal/medical terminology, and effortless fluency.',
    },
  });

  const hebrewLevelEnumMap: Record<string, HebrewLevel> = {
    BEGINNER: HebrewLevel.BEGINNER,
    ELEMENTARY: HebrewLevel.ELEMENTARY,
    INTERMEDIATE: HebrewLevel.INTERMEDIATE,
    UPPER_INTERMEDIATE: HebrewLevel.UPPER_INTERMEDIATE,
    ADVANCED: HebrewLevel.ADVANCED,
    FLUENT: HebrewLevel.FLUENT,
  };

  // 3. Multi-Duration Session Types
  console.log('Seeding session types (25m Focus, 40m Standard, 55m Intensive, 15m Pronunciation)...');
  const st25 = await prisma.sessionType.create({
    data: {
      name: '25min',
      durationMinutes: 25,
      labelEn: '25-Min Focus Block',
      labelHe: 'בלוק מיקוד 25 דקות',
      isActive: true,
      sortOrder: 1,
    },
  });
  const st40 = await prisma.sessionType.create({
    data: {
      name: '40min',
      durationMinutes: 40,
      labelEn: '40-Min Standard Session',
      labelHe: 'שיעור סטנדרטי 40 דקות',
      isActive: true,
      sortOrder: 2,
    },
  });
  const st55 = await prisma.sessionType.create({
    data: {
      name: '55min',
      durationMinutes: 55,
      labelEn: '55-Min Intensive Deep Dive',
      labelHe: 'שיעור עומק 55 דקות',
      isActive: true,
      sortOrder: 3,
    },
  });
  const st15 = await prisma.sessionType.create({
    data: {
      name: '15min',
      durationMinutes: 15,
      labelEn: '15-Min Pronunciation Check',
      labelHe: 'בדיקת הגייה 15 דקות',
      isActive: true,
      sortOrder: 4,
    },
  });

  // 4. Session Packages with Duration Allocations
  console.log('Seeding learning packages with session allocations...');
  const pkgStarter = await prisma.package.create({
    data: {
      name: 'Starter Conversational Bundle',
      nameHe: 'חבילת שיחה למתחילים',
      description: 'Ideal starter kit with 6 express sessions (25m) and 2 standard sessions (40m).',
      descriptionHe: 'ערכת התחלה אידיאלית הכוללת 6 שיעורים מהירים ו-2 שיעורים סטנדרטיים.',
      validityDays: 30,
      totalLessons: 8,
      price: 140,
      originalPrice: 175,
      onSale: true,
      isPopular: false,
      currency: 'USD',
      isActive: true,
      sessionItems: {
        create: [
          { sessionTypeId: st25.id, quantity: 6 },
          { sessionTypeId: st40.id, quantity: 2 },
        ],
      },
    },
  });

  const pkgIntensive = await prisma.package.create({
    data: {
      name: 'Intensive Fluency Track',
      nameHe: 'מסלול שטף אינטנסיבי',
      description: 'Complete immersion pack: 10 express sessions (25m), 4 standard sessions (40m), and 2 deep-dive sessions (55m).',
      descriptionHe: 'חבילת העמקה מובילה: 10 שיעורי מיקוד, 4 שיעורים סטנדרטיים ו-2 שיעורי עומק.',
      validityDays: 45,
      totalLessons: 16,
      price: 260,
      originalPrice: 320,
      onSale: true,
      isPopular: true,
      currency: 'USD',
      isActive: true,
      sessionItems: {
        create: [
          { sessionTypeId: st25.id, quantity: 10 },
          { sessionTypeId: st40.id, quantity: 4 },
          { sessionTypeId: st55.id, quantity: 2 },
        ],
      },
    },
  });

  const pkgExecutive = await prisma.package.create({
    data: {
      name: 'Executive Immersion & Career',
      nameHe: 'חבילת מנהלים ועסקים מעמיקה',
      description: 'Executive mastery pack: 12 standard sessions (40m) and 12 deep-dive sessions (55m) for career acceleration.',
      descriptionHe: 'חבילת עילית למנהלים: 12 שיעורים סטנדרטיים ו-12 שיעורי עומק לקידום מקצועי.',
      validityDays: 90,
      totalLessons: 24,
      price: 480,
      originalPrice: 600,
      onSale: false,
      isPopular: false,
      currency: 'USD',
      isActive: true,
      sessionItems: {
        create: [
          { sessionTypeId: st40.id, quantity: 12 },
          { sessionTypeId: st55.id, quantity: 12 },
        ],
      },
    },
  });

  const pkgExpress = await prisma.package.create({
    data: {
      name: 'Express Conversational Pack',
      nameHe: 'חבילת שיחה ממוקדת',
      description: 'Quick confidence booster: 4 express focus sessions (25m) focused on immediate travel and daily speech.',
      descriptionHe: 'חיזוק מהיר: 4 שיעורי מיקוד ממוקדים לשיחה יומיומית ונסיעות.',
      validityDays: 14,
      totalLessons: 4,
      price: 80,
      originalPrice: 100,
      onSale: false,
      isPopular: false,
      currency: 'USD',
      isActive: true,
      sessionItems: {
        create: [
          { sessionTypeId: st25.id, quantity: 4 },
        ],
      },
    },
  });

  const pkgAcademic = await prisma.package.create({
    data: {
      name: 'Ulpan Academic Acceleration',
      nameHe: 'הכנה מואצת לאולפן אקדמי',
      description: 'Comprehensive curriculum pack: 8 focus sessions (25m), 8 standard sessions (40m), and 4 deep-dive sessions (55m).',
      descriptionHe: 'מסלול אקדמי מקיף: 8 שיעורי מיקוד, 8 שיעורים סטנדרטיים ו-4 שיעורי עומק להצלחה באולפן.',
      validityDays: 60,
      totalLessons: 20,
      price: 380,
      originalPrice: 450,
      onSale: true,
      isPopular: false,
      currency: 'USD',
      isActive: true,
      sessionItems: {
        create: [
          { sessionTypeId: st25.id, quantity: 8 },
          { sessionTypeId: st40.id, quantity: 8 },
          { sessionTypeId: st55.id, quantity: 4 },
        ],
      },
    },
  });

  const pkgBusiness = await prisma.package.create({
    data: {
      name: 'Business & Tech Hebrew Masterclass',
      nameHe: 'עברית עסקית והייטק',
      description: 'Focused professional track: 6 standard sessions (40m) and 6 deep-dive sessions (55m) for workplace fluency.',
      descriptionHe: 'מסלול מקצועי ממוקד: 6 שיעורים סטנדרטיים ו-6 שיעורי עומק להשתלבות בהייטק.',
      validityDays: 45,
      totalLessons: 12,
      price: 290,
      originalPrice: 340,
      onSale: false,
      isPopular: false,
      currency: 'USD',
      isActive: true,
      sessionItems: {
        create: [
          { sessionTypeId: st40.id, quantity: 6 },
          { sessionTypeId: st55.id, quantity: 6 },
        ],
      },
    },
  });

  const packagesList = [pkgStarter, pkgIntensive, pkgExecutive, pkgExpress, pkgAcademic, pkgBusiness];

  // 5. Granular Permissions (58 action capabilities across 6 enterprise domains)
  console.log('Seeding 58 granular permissions & system role matrices...');
  const ALL_PERMISSIONS = [
    // Users & Accounts
    { code: 'users:view', group: 'Users', description: 'View user accounts, contact details, and role assignments' },
    { code: 'users:create', group: 'Users', description: 'Create new student, teacher, or administrative accounts' },
    { code: 'users:edit', group: 'Users', description: 'Modify user profiles, email addresses, phone numbers, and statuses' },
    { code: 'users:delete', group: 'Users', description: 'Deactivate, archive, or soft-delete user accounts' },
    { code: 'users:reset_password', group: 'Users', description: 'Trigger password reset links and manage user credentials' },
    { code: 'users:export_csv', group: 'Users', description: 'Export full user directory and contact databases to CSV' },

    // Students & Academics
    { code: 'students:view_balance', group: 'Students', description: 'View student session balances, bundle validity, and points' },
    { code: 'students:adjust_balance', group: 'Students', description: 'Manually credit or deduct session allowances and bonus points' },
    { code: 'students:set_level', group: 'Students', description: 'Promote or adjust student academic proficiency tier' },
    { code: 'students:view_progress', group: 'Students', description: 'Inspect grammar notes, homework submissions, and learning telemetry' },
    { code: 'students:edit_notes', group: 'Students', description: 'Record confidential academic notes and internal guidance on student file' },

    // Teachers & Instructors
    { code: 'teachers:view_all', group: 'Teachers', description: 'View all instructor profiles, hourly rates, and bios' },
    { code: 'teachers:manage_slots', group: 'Teachers', description: 'Configure, open, or close teacher calendar availability slots' },
    { code: 'teachers:assign_students', group: 'Teachers', description: 'Assign dedicated teachers to specific students' },
    { code: 'teachers:view_payouts', group: 'Teachers', description: 'View teacher earnings calculations and completed lesson compensation' },

    // Lessons & Scheduling
    { code: 'lessons:view_all', group: 'Lessons', description: 'View full schedule of live, upcoming, and past lessons across academy' },
    { code: 'lessons:book', group: 'Lessons', description: 'Book private 1-on-1 sessions on behalf of students' },
    { code: 'lessons:cancel', group: 'Lessons', description: 'Cancel scheduled lessons with automated session balance return' },
    { code: 'lessons:reschedule', group: 'Lessons', description: 'Reschedule lesson times without balance deduction penalty' },
    { code: 'lessons:mark_attendance', group: 'Lessons', description: 'Record student attendance (Attended, Late, No-Show) and notes' },
    { code: 'lessons:join_zoom', group: 'Lessons', description: 'Access host and teacher Zoom video classroom meeting links' },
    { code: 'lessons:view_recordings', group: 'Lessons', description: 'Access Google Drive / Zoom cloud lesson recordings' },

    // Packages & Offers
    { code: 'packages:view', group: 'Packages', description: 'Browse session packages catalog and pricing structures' },
    { code: 'packages:create', group: 'Packages', description: 'Design new learning bundles with session duration allocations' },
    { code: 'packages:edit', group: 'Packages', description: 'Modify pricing, discounts, popularity badge, and descriptions' },
    { code: 'packages:delete', group: 'Packages', description: 'Permanently remove or archive learning packages' },
    { code: 'packages:assign', group: 'Packages', description: 'Directly allocate package quotas to student accounts' },

    // Payments & Financials
    { code: 'payments:view_all', group: 'Payments', description: 'View complete transaction ledger and proof-of-payment receipts' },
    { code: 'payments:create', group: 'Payments', description: 'Upload payment receipts or record manual bank transfers' },
    { code: 'payments:approve', group: 'Payments', description: 'Validate WebP transfer receipts and instantly credit student packages' },
    { code: 'payments:reject', group: 'Payments', description: 'Decline invalid or duplicate payment submissions with reason' },
    { code: 'payments:refund', group: 'Payments', description: 'Process order cancellations and credit balance rollbacks' },
    { code: 'payments:export_receipts', group: 'Payments', description: 'Export tax records, revenue reports, and receipt archives' },

    // Curriculum & Levels
    { code: 'levels:view', group: 'Curriculum', description: 'Inspect Hebrew proficiency tiers, CEFR standards, and syllabi' },
    { code: 'levels:create', group: 'Curriculum', description: 'Add new academic tiers and define progression criteria' },
    { code: 'levels:edit', group: 'Curriculum', description: 'Update competencies, vocabulary count targets, and descriptions' },
    { code: 'levels:delete', group: 'Curriculum', description: 'Remove deprecated proficiency levels from curriculum framework' },

    // Exams & Assessments
    { code: 'exams:view', group: 'Exams', description: 'Browse progression exams library and question banks' },
    { code: 'exams:create', group: 'Exams', description: 'Author new assessment tests and question sets' },
    { code: 'exams:edit', group: 'Exams', description: 'Modify passing thresholds, question options, and explanations' },
    { code: 'exams:open_for_student', group: 'Exams', description: 'Manually unlock exam attempt for eligible student' },
    { code: 'exams:reset_attempt', group: 'Exams', description: 'Clear failed attempt record to permit student retest' },
    { code: 'exams:grade_manually', group: 'Exams', description: 'Score written essay questions and attach teacher remarks' },

    // Gamification & Rewards
    { code: 'rewards:view_rules', group: 'Rewards', description: 'View point accrual thresholds, streaks, and award settings' },
    { code: 'rewards:edit_rules', group: 'Rewards', description: 'Update points awarded for homework, games, and milestones' },
    { code: 'games:view', group: 'Games', description: 'Browse interactive learning games and flashcard decks' },
    { code: 'games:create', group: 'Games', description: 'Build new speed rounds, flashcard sets, and vocabulary games' },
    { code: 'games:unlock_for_student', group: 'Games', description: 'Grant student access to premium practice games' },

    // Feedback, Reviews & Surveys
    { code: 'reviews:view', group: 'Reviews', description: 'Inspect student lesson ratings, teacher reviews, and satisfaction NPS' },
    { code: 'reviews:manage_links', group: 'Reviews', description: 'Generate single-use signed review invitations for Trustpilot/Google' },
    { code: 'surveys:view_analytics', group: 'Surveys', description: 'View aggregated teacher survey metrics and pedagogical feedback' },

    // Notifications & Communications
    { code: 'notifications:send_manual', group: 'Notifications', description: 'Broadcast urgent announcements, push alerts, and SMS' },
    { code: 'reminders:trigger_engine', group: 'Notifications', description: 'Force execution of automated WhatsApp/Email lesson reminders' },

    // Security & Platform Matrix
    { code: 'roles:manage', group: 'Security', description: 'Configure granular permission matrix and create custom system roles' },
    { code: 'settings:manage', group: 'Security', description: 'Configure global academy branding, timezones, and integrations' },
    { code: 'audit:view_logs', group: 'Security', description: 'Inspect immutable administrative security audit trails' },
    { code: 'languages:manage', group: 'Security', description: 'Activate platform languages and edit translation dictionaries' },
  ];

  const permMap: Record<string, string> = {};
  for (const p of ALL_PERMISSIONS) {
    const created = await prisma.permission.create({ data: p });
    permMap[p.code] = created.id;
  }

  // System Roles
  const roleSuperAdmin = await prisma.roleDefinition.create({
    data: { name: 'SUPER_ADMIN', labelEn: 'Super Admin', labelHe: 'מנהל ראשי ואונר', isSystem: true },
  });
  const roleAdmin = await prisma.roleDefinition.create({
    data: { name: 'ADMIN', labelEn: 'Administrator', labelHe: 'מנהל מערכת', isSystem: true },
  });
  const roleSales = await prisma.roleDefinition.create({
    data: { name: 'SALES', labelEn: 'Sales Representative', labelHe: 'נציג מכירות וליווי', isSystem: true },
  });
  const roleCS = await prisma.roleDefinition.create({
    data: { name: 'CS', labelEn: 'Customer Service Specialist', labelHe: 'נציג שירות ותמיכה', isSystem: true },
  });
  const roleTeacher = await prisma.roleDefinition.create({
    data: { name: 'TEACHER', labelEn: 'Teacher / Instructor', labelHe: 'מורה מוסמך', isSystem: true },
  });
  const roleStudent = await prisma.roleDefinition.create({
    data: { name: 'STUDENT', labelEn: 'Student / Learner', labelHe: 'תלמיד', isSystem: true },
  });

  // Attach all permissions to SUPER_ADMIN & ADMIN
  for (const permId of Object.values(permMap)) {
    await prisma.rolePermission.create({ data: { roleId: roleSuperAdmin.id, permissionId: permId, granted: true } });
    await prisma.rolePermission.create({ data: { roleId: roleAdmin.id, permissionId: permId, granted: true } });
  }

  // SALES permissions
  const salesCodes = [
    'users:view', 'users:create', 'students:view_balance', 'students:view_progress',
    'packages:view', 'packages:assign', 'payments:create', 'payments:view_all',
    'lessons:view_all', 'lessons:book', 'reviews:view'
  ];
  for (const c of salesCodes) {
    if (permMap[c]) await prisma.rolePermission.create({ data: { roleId: roleSales.id, permissionId: permMap[c], granted: true } });
  }

  // CS permissions
  const csCodes = [
    'users:view', 'students:view_balance', 'students:view_progress', 'lessons:view_all',
    'lessons:book', 'lessons:cancel', 'lessons:reschedule', 'notifications:send_manual',
    'reviews:view', 'surveys:view_analytics'
  ];
  for (const c of csCodes) {
    if (permMap[c]) await prisma.rolePermission.create({ data: { roleId: roleCS.id, permissionId: permMap[c], granted: true } });
  }

  // TEACHER permissions
  const teacherCodes = [
    'lessons:view_all', 'lessons:mark_attendance', 'lessons:join_zoom', 'lessons:view_recordings',
    'students:view_progress', 'students:edit_notes', 'exams:view', 'exams:open_for_student',
    'exams:grade_manually', 'games:view', 'games:unlock_for_student', 'reviews:view'
  ];
  for (const c of teacherCodes) {
    if (permMap[c]) await prisma.rolePermission.create({ data: { roleId: roleTeacher.id, permissionId: permMap[c], granted: true } });
  }

  // STUDENT permissions
  const studentCodes = ['lessons:book', 'lessons:cancel', 'lessons:join_zoom', 'lessons:view_recordings'];
  for (const c of studentCodes) {
    if (permMap[c]) await prisma.rolePermission.create({ data: { roleId: roleStudent.id, permissionId: permMap[c], granted: true } });
  }

  // 6. Gamification Point Rules (Zero emojis)
  console.log('Seeding gamification point rules...');
  await prisma.pointRule.createMany({
    data: [
      { eventType: PointsEventType.LESSON_COMPLETED, points: 50, description: 'Points earned for completing a live 1-on-1 session' },
      { eventType: PointsEventType.GAME_PLAYED, points: 15, description: 'Points earned for vocabulary practice games' },
      { eventType: PointsEventType.HOMEWORK_SUBMITTED, points: 25, description: 'Points awarded for on-time homework submission' },
      { eventType: PointsEventType.STREAK_BONUS, points: 30, description: 'Weekly consistency streak bonus' },
      { eventType: PointsEventType.MANUAL, points: 100, description: 'Instructor manual excellence points award' },
    ],
  });

  // 7. Users & Profiles (Staff, Teachers, and 35 Students)
  console.log('Seeding enterprise staff, teachers, and students...');
  const defaultPw = await bcrypt.hash('Password123!', 10);
  const adminPw = await bcrypt.hash('Admin@2026!', 10);

  // Super Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@learnhebrew.com',
      passwordHash: adminPw,
      firstName: 'Mostafa',
      lastName: 'Gamal',
      role: Role.SUPER_ADMIN,
      roleDefinitionId: roleSuperAdmin.id,
      languagePref: 'en',
      nativeLanguageId: langAr.id,
      learningLanguageId: langHe.id,
      isActive: true,
      notificationPreference: { create: { reminder24hEnabled: true, reminder1hEnabled: true, inAppEnabled: true, emailEnabled: true } },
    },
  });

  // Operations Admin
  const opsAdminUser = await prisma.user.create({
    data: {
      email: 'operations@learnhebrew.com',
      passwordHash: defaultPw,
      firstName: 'Tamar',
      lastName: 'Sharon',
      role: Role.ADMIN,
      roleDefinitionId: roleAdmin.id,
      languagePref: 'he',
      nativeLanguageId: langHe.id,
      learningLanguageId: langEn.id,
      isActive: true,
      createdById: adminUser.id,
      notificationPreference: { create: { reminder24hEnabled: true, reminder1hEnabled: true, inAppEnabled: true, emailEnabled: true } },
    },
  });

  // Sales Representatives
  const salesUser1 = await prisma.user.create({
    data: {
      email: 'sales@learnhebrew.com',
      passwordHash: defaultPw,
      firstName: 'Rami',
      lastName: 'Saleh',
      role: Role.SALES,
      roleDefinitionId: roleSales.id,
      languagePref: 'en',
      nativeLanguageId: langEn.id,
      learningLanguageId: langHe.id,
      isActive: true,
      createdById: adminUser.id,
    },
  });

  const salesUser2 = await prisma.user.create({
    data: {
      email: 'david.sales@learnhebrew.com',
      passwordHash: defaultPw,
      firstName: 'David',
      lastName: 'Stern',
      role: Role.SALES,
      roleDefinitionId: roleSales.id,
      languagePref: 'en',
      nativeLanguageId: langEn.id,
      learningLanguageId: langHe.id,
      isActive: true,
      createdById: adminUser.id,
    },
  });

  // Customer Service Specialists
  const csUser1 = await prisma.user.create({
    data: {
      email: 'cs@learnhebrew.com',
      passwordHash: defaultPw,
      firstName: 'Noor',
      lastName: 'Haddad',
      role: Role.CS,
      roleDefinitionId: roleCS.id,
      languagePref: 'he',
      nativeLanguageId: langAr.id,
      learningLanguageId: langHe.id,
      isActive: true,
      createdById: adminUser.id,
    },
  });

  const csUser2 = await prisma.user.create({
    data: {
      email: 'sara.cs@learnhebrew.com',
      passwordHash: defaultPw,
      firstName: 'Sara',
      lastName: 'Goldberg',
      role: Role.CS,
      roleDefinitionId: roleCS.id,
      languagePref: 'en',
      nativeLanguageId: langEn.id,
      learningLanguageId: langHe.id,
      isActive: true,
      createdById: adminUser.id,
    },
  });

  // 12 Certified Native Teachers
  const teacherRaw = [
    {
      email: 'mona.khalil@learnhebrew.com',
      firstName: 'Mona',
      lastName: 'Khalil',
      bio: 'Tel Aviv University linguist with 8+ years experience. Expert in modern Israeli slang, rapid conversational fluency, and confident accent reduction.',
      specialties: ['Conversational Hebrew', 'Tel Aviv Slang', 'Accent Coaching', 'Beginner Foundations'],
      ratingAvg: 4.96,
      ratingCount: 48,
      zoomLink: 'https://zoom.us/my/mona.hebrew',
    },
    {
      email: 'karim.mahmoud@learnhebrew.com',
      firstName: 'Karim',
      lastName: 'Mahmoud',
      bio: 'Certified Ulpan instructor with deep focus on structured grammar, root morphology (Shoresh), and classical Hebrew literature.',
      specialties: ['Ulpan Grammar', 'Root System (Binyanim)', 'Reading Fluency', 'Biblical Texts'],
      ratingAvg: 4.88,
      ratingCount: 36,
      zoomLink: 'https://zoom.us/my/karim.hebrew',
    },
    {
      email: 'yael.cohen@learnhebrew.com',
      firstName: 'Yael',
      lastName: 'Cohen',
      bio: 'Former Hi-Tech product manager turned Hebrew specialist. Teaches business communication, tech sector terminology, and executive negotiation.',
      specialties: ['Business Hebrew', 'Hi-Tech Terminology', 'Interview Prep', 'Advanced Grammar'],
      ratingAvg: 4.98,
      ratingCount: 52,
      zoomLink: 'https://zoom.us/my/yael.hebrew',
    },
    {
      email: 'noam.levi@learnhebrew.com',
      firstName: 'Noam',
      lastName: 'Levi',
      bio: 'Patient, warm educator specializing in complete beginners (Alef), kids, and visual mnemonic techniques for fast alphabet mastery.',
      specialties: ['Beginner Reading', 'Alphabet (Alef-Bet)', 'Interactive Games', 'Everyday Phrases'],
      ratingAvg: 4.92,
      ratingCount: 31,
      zoomLink: 'https://zoom.us/my/noam.hebrew',
    },
    {
      email: 'maya.bendavid@learnhebrew.com',
      firstName: 'Maya',
      lastName: 'Ben-David',
      bio: 'Haifa-based journalist and cultural educator. Focuses on Israeli culture, news analysis, songs, and effortless social small talk.',
      specialties: ['Israeli Culture & Media', 'News & Journalism', 'Intermediate Dialogs', 'Vocabulary Expansion'],
      ratingAvg: 4.90,
      ratingCount: 28,
      zoomLink: 'https://zoom.us/my/maya.hebrew',
    },
    {
      email: 'ronen.shapira@learnhebrew.com',
      firstName: 'Ronen',
      lastName: 'Shapira',
      bio: 'Jerusalem Hebrew University PhD candidate. Focuses on academic Hebrew, literature, advanced essays, and syntax refinement.',
      specialties: ['Academic Hebrew', 'Literature', 'Essay Writing', 'Advanced Syntax'],
      ratingAvg: 4.95,
      ratingCount: 39,
      zoomLink: 'https://zoom.us/my/ronen.hebrew',
    },
    {
      email: 'amit.baron@learnhebrew.com',
      firstName: 'Amit',
      lastName: 'Bar-On',
      bio: 'Tel Aviv nightlife writer and youth mentor. Specializes in street idioms, colloquial slang, and confident natural speech.',
      specialties: ['Street Slang', 'Colloquial Idioms', 'Natural Speech Flow', 'Youth & Adults'],
      ratingAvg: 4.87,
      ratingCount: 25,
      zoomLink: 'https://zoom.us/my/amit.hebrew',
    },
    {
      email: 'talia.friedman@learnhebrew.com',
      firstName: 'Talia',
      lastName: 'Friedman',
      bio: 'Speech pathologist and phonics coach. Helps students eliminate heavy accents and produce guttural Chet and Ayin sounds naturally.',
      specialties: ['Accent Reduction', 'Phonetics', 'Vowel Rules', 'Clear Speech'],
      ratingAvg: 4.93,
      ratingCount: 34,
      zoomLink: 'https://zoom.us/my/talia.hebrew',
    },
    {
      email: 'erez.golan@learnhebrew.com',
      firstName: 'Erez',
      lastName: 'Golan',
      bio: 'Commercial lawyer and Hebrew lecturer. Teaches legal contracts, real estate transactions, and formal corporate correspondence.',
      specialties: ['Legal Hebrew', 'Real Estate', 'Formal Correspondence', 'Corporate Communication'],
      ratingAvg: 4.91,
      ratingCount: 22,
      zoomLink: 'https://zoom.us/my/erez.hebrew',
    },
    {
      email: 'shira.alon@learnhebrew.com',
      firstName: 'Shira',
      lastName: 'Alon',
      bio: 'Enthusiastic immersion educator. Uses practical role-play scenarios: supermarket shopping, doctor visits, and Israeli bureaucracy.',
      specialties: ['Everyday Immersion', 'Role Playing', 'Bureaucracy Navigation', 'Confidence Building'],
      ratingAvg: 4.89,
      ratingCount: 27,
      zoomLink: 'https://zoom.us/my/shira.hebrew',
    },
    {
      email: 'daniel.mizrahi@learnhebrew.com',
      firstName: 'Daniel',
      lastName: 'Mizrahi',
      bio: 'Experienced Ulpan teacher preparing new immigrants for Level Bet and Gimel government ministry licensing exams.',
      specialties: ['Ulpan Bet Prep', 'Ulpan Gimel Prep', 'Ministry Exams', 'Verb Tables'],
      ratingAvg: 4.86,
      ratingCount: 20,
      zoomLink: 'https://zoom.us/my/daniel.hebrew',
    },
    {
      email: 'liora.katz@learnhebrew.com',
      firstName: 'Liora',
      lastName: 'Katz',
      bio: 'Senior editor and grammarian. Guides advanced learners through fine nuances of poetic Hebrew, public speaking, and journalism.',
      specialties: ['Advanced Composition', 'Public Speaking', 'Poetics & Media', 'Subtle Nuance'],
      ratingAvg: 4.94,
      ratingCount: 30,
      zoomLink: 'https://zoom.us/my/liora.hebrew',
    },
  ];

  const teachers = [];
  for (const td of teacherRaw) {
    const tUser = await prisma.user.create({
      data: {
        email: td.email,
        passwordHash: defaultPw,
        firstName: td.firstName,
        lastName: td.lastName,
        role: Role.TEACHER,
        roleDefinitionId: roleTeacher.id,
        languagePref: 'he',
        nativeLanguageId: langHe.id,
        learningLanguageId: langEn.id,
        isActive: true,
        createdById: adminUser.id,
        teacherProfile: {
          create: {
            bio: td.bio,
            specialties: td.specialties,
            ratingAvg: td.ratingAvg,
            ratingCount: td.ratingCount,
            defaultZoomLink: td.zoomLink,
          },
        },
      },
      include: { teacherProfile: true },
    });
    teachers.push(tUser.teacherProfile!);
  }

  // 35 Diverse Students across levels Alef to Vav
  const studentRaw = [
    { email: 'mustfa.maheer@gmail.com', firstName: 'Moustafa', lastName: 'Maher', level: levelAlef, points: 350, streak: 7, notes: 'Software architect learning conversational Hebrew for tech projects and regional business.' },
    { email: 'omar.farouk@gmail.com', firstName: 'Omar', lastName: 'Farouk', level: levelBet, points: 520, streak: 12, notes: 'Dedicated student practicing Paal verbs and ordering at local Tel Aviv cafes.' },
    { email: 'daniel.levi@example.com', firstName: 'Daniel', lastName: 'Levi', level: levelAlef, points: 180, streak: 3, notes: 'Complete beginner mastering Alef-Bet script and greetings.' },
    { email: 'sophia.miller@example.com', firstName: 'Sophia', lastName: 'Miller', level: levelGimel, points: 840, streak: 18, notes: 'High-tech recruiter preparing for professional interviews and team discussions in Hebrew.' },
    { email: 'liam.chen@example.com', firstName: 'Liam', lastName: 'Chen', level: levelDalet, points: 1250, streak: 24, notes: 'AI researcher giving presentations and discussing scientific topics in Hebrew.' },
    { email: 'miriam.sharon@example.com', firstName: 'Miriam', lastName: 'Sharon', level: levelHei, points: 1950, streak: 32, notes: 'Advanced student preparing for Israeli Bar association and legal certification.' },
    { email: 'youssef.mansour@example.com', firstName: 'Youssef', lastName: 'Mansour', level: levelBet, points: 410, streak: 6, notes: 'Focusing on listening comprehension and daily conversational dialogs.' },
    { email: 'layla.hassan@example.com', firstName: 'Layla', lastName: 'Hassan', level: levelAlef, points: 220, streak: 4, notes: 'Learning alphabet vowel signs (Nikkud) and basic family vocabulary.' },
    { email: 'noah.benami@example.com', firstName: 'Noah', lastName: 'Ben-Ami', level: levelGimel, points: 780, streak: 14, notes: 'Studying past and future tenses, preparing for university Ulpan entrance.' },
    { email: 'sarah.goldstein@example.com', firstName: 'Sarah', lastName: 'Goldstein', level: levelVav, points: 3100, streak: 45, notes: 'Native-level fluency track, preparing for academic Hebrew literature exemption exam.' },
    { email: 'adam.rosenthal@example.com', firstName: 'Adam', lastName: 'Rosenthal', level: levelAlef, points: 150, streak: 2, notes: 'Enthusiastic beginner taking twice-weekly focus blocks.' },
    { email: 'elena.rostova@example.com', firstName: 'Elena', lastName: 'Rostova', level: levelBet, points: 610, streak: 9, notes: 'Aliyah immigrant practicing supermarket and healthcare clinic vocabulary.' },
    { email: 'marcus.vance@example.com', firstName: 'Marcus', lastName: 'Vance', level: levelDalet, points: 1100, streak: 20, notes: 'Corporate executive practicing Israeli negotiation and workplace idioms.' },
    { email: 'chloe.dubois@example.com', firstName: 'Chloe', lastName: 'Dubois', level: levelGimel, points: 690, streak: 11, notes: 'French native learning Israeli song lyrics and cultural expressions.' },
    { email: 'lucas.silva@example.com', firstName: 'Lucas', lastName: 'Silva', level: levelAlef, points: 280, streak: 5, notes: 'Beginner focusing on proper phonetic pronunciation and reading fluency.' },
    { email: 'hannah.becker@example.com', firstName: 'Hannah', lastName: 'Becker', level: levelBet, points: 490, streak: 8, notes: 'Studying daily schedule, time expressions, and common preposition conjugations.' },
    { email: 'david.stern@example.com', firstName: 'David', lastName: 'Stern', level: levelGimel, points: 920, streak: 15, notes: 'Fintech analyst reading Calcalist and TheMarker business news articles.' },
    { email: 'maya.lin@example.com', firstName: 'Maya', lastName: 'Lin', level: levelAlef, points: 190, streak: 3, notes: 'Learning script writing and common travel greetings.' },
    { email: 'gabriel.torres@example.com', firstName: 'Gabriel', lastName: 'Torres', level: levelBet, points: 380, streak: 7, notes: 'Improving verb conjugations in present and past tense.' },
    { email: 'rachel.avraham@example.com', firstName: 'Rachel', lastName: 'Avraham', level: levelDalet, points: 1400, streak: 26, notes: 'Practicing television debates and podcast listening comprehension.' },
    { email: 'tariq.nader@example.com', firstName: 'Tariq', lastName: 'Nader', level: levelAlef, points: 210, streak: 4, notes: 'Basic numbers, ordering coffee, and polite social greetings.' },
    { email: 'jessica.walsh@example.com', firstName: 'Jessica', lastName: 'Walsh', level: levelBet, points: 540, streak: 10, notes: 'Focusing on building confident complete sentences without hesitation.' },
    { email: 'alexander.novak@example.com', firstName: 'Alexander', lastName: 'Novak', level: levelGimel, points: 750, streak: 13, notes: 'Studying irregular verbs and preparing for Ulpan level progression.' },
    { email: 'leah.klein@example.com', firstName: 'Leah', lastName: 'Klein', level: levelHei, points: 2100, streak: 35, notes: 'Mastering advanced syntactic nuance and media commentary.' },
    { email: 'jonathan.perez@example.com', firstName: 'Jonathan', lastName: 'Perez', level: levelAlef, points: 130, streak: 2, notes: 'Foundational reading practice and simple conversational dialogs.' },
    { email: 'dina.said@example.com', firstName: 'Dina', lastName: 'Said', level: levelBet, points: 470, streak: 8, notes: 'Expanding vocabulary around home, family, and hobbies.' },
    { email: 'michael.brown@example.com', firstName: 'Michael', lastName: 'Brown', level: levelGimel, points: 880, streak: 16, notes: 'Engineering team lead preparing for Israeli tech conference presentation.' },
    { email: 'emma.watson@example.com', firstName: 'Emma', lastName: 'Watson', level: levelAlef, points: 320, streak: 6, notes: 'Learning modern script writing and conversational confidence.' },
    { email: 'ethan.rosenberg@example.com', firstName: 'Ethan', lastName: 'Rosenberg', level: levelDalet, points: 1300, streak: 22, notes: 'Active student taking weekly intensive immersion sessions.' },
    { email: 'samantha.green@example.com', firstName: 'Samantha', lastName: 'Green', level: levelBet, points: 450, streak: 7, notes: 'Focusing on verb tables and preposition combinations.' },
    { email: 'benjamin.danino@example.com', firstName: 'Benjamin', lastName: 'Danino', level: levelGimel, points: 810, streak: 14, notes: 'Ulpan acceleration student with strong reading skills.' },
    { email: 'olivia.taylor@example.com', firstName: 'Olivia', lastName: 'Taylor', level: levelAlef, points: 260, streak: 5, notes: 'Beginner focusing on numbers, directions, and shopping.' },
    { email: 'aviad.sela@example.com', firstName: 'Aviad', lastName: 'Sela', level: levelBet, points: 580, streak: 11, notes: 'Expanding conversational vocabulary with native teachers.' },
    { email: 'talia.mor@example.com', firstName: 'Talia', lastName: 'Mor', level: levelDalet, points: 1550, streak: 28, notes: 'Practicing nuanced debating and advanced reading comprehension.' },
    { email: 'julian.meyer@example.com', firstName: 'Julian', lastName: 'Meyer', level: levelVav, points: 2900, streak: 40, notes: 'Fluent speaker refining public speaking and professional essays.' },
  ];

  const students = [];
  for (const sd of studentRaw) {
    const sUser = await prisma.user.create({
      data: {
        email: sd.email,
        passwordHash: defaultPw,
        firstName: sd.firstName,
        lastName: sd.lastName,
        role: Role.STUDENT,
        roleDefinitionId: roleStudent.id,
        languagePref: 'en',
        nativeLanguageId: langEn.id,
        learningLanguageId: langHe.id,
        isActive: true,
        createdById: adminUser.id,
        notificationPreference: {
          create: { reminder24hEnabled: true, reminder1hEnabled: true, inAppEnabled: true, emailEnabled: true },
        },
        studentProfile: {
          create: {
            levelId: sd.level.id,
            level: hebrewLevelEnumMap[sd.level.code],
            totalPoints: sd.points,
            streakDays: sd.streak,
            balance: 0,
            notes: sd.notes,
          },
        },
      },
      include: { studentProfile: true },
    });
    students.push(sUser.studentProfile!);
  }

  // 8. Student Packages & Payments ($16k+ platform revenue, healthy MTD)
  console.log('Seeding student packages, payments, and multi-duration session balances...');
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

  let packageAssignmentCounter = 0;
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const packagesToAssign = (i % 3 === 0)
      ? [packagesList[i % packagesList.length], packagesList[(i + 2) % packagesList.length]]
      : [packagesList[i % packagesList.length]];

    for (let pIdx = 0; pIdx < packagesToAssign.length; pIdx++) {
      const pkg = packagesToAssign[pIdx];
      packageAssignmentCounter++;

      let paymentDate: Date;
      let pkgStatus: PackageStatus;
      if (packageAssignmentCounter % 4 === 1) {
        paymentDate = new Date(currentMonthStart.getTime() + (packageAssignmentCounter * 12 * 3600 * 1000));
        pkgStatus = PackageStatus.ACTIVE;
      } else if (packageAssignmentCounter % 4 === 2) {
        paymentDate = new Date(prevMonthStart.getTime() + (packageAssignmentCounter * 18 * 3600 * 1000));
        pkgStatus = PackageStatus.ACTIVE;
      } else if (packageAssignmentCounter % 4 === 3) {
        paymentDate = new Date(prevMonthStart.getTime() + (packageAssignmentCounter * 8 * 3600 * 1000));
        pkgStatus = PackageStatus.COMPLETED;
      } else {
        paymentDate = new Date(twoMonthsAgo.getTime() + (packageAssignmentCounter * 14 * 3600 * 1000));
        pkgStatus = PackageStatus.EXPIRED;
      }

      const payment = await prisma.payment.create({
        data: {
          studentId: student.id,
          packageId: pkg.id,
          createdById: (packageAssignmentCounter % 2 === 0) ? salesUser1.id : salesUser2.id,
          screenshotUrl: `/uploads/payments/wire-receipt-${packageAssignmentCounter}.webp`,
          screenshotOriginalName: `bank-transfer-wire-${packageAssignmentCounter}.pdf`,
          notes: `Verified bank transfer payment for ${pkg.name}.`,
          status: PaymentStatus.APPROVED,
          approvedById: adminUser.id,
          approvedAt: new Date(paymentDate.getTime() + 3600 * 1000),
          createdAt: paymentDate,
        },
      });

      const lessonsTotal = pkg.totalLessons;
      const lessonsUsed = pkgStatus === PackageStatus.COMPLETED ? lessonsTotal : Math.floor(lessonsTotal * 0.4);

      const studentPkg = await prisma.studentPackage.create({
        data: {
          studentId: student.id,
          packageId: pkg.id,
          assignedById: adminUser.id,
          paymentId: payment.id,
          lessonsTotal: lessonsTotal,
          lessonsUsed: lessonsUsed,
          startDate: paymentDate,
          endDate: new Date(paymentDate.getTime() + pkg.validityDays * 86400 * 1000),
          status: pkgStatus,
          createdAt: paymentDate,
        },
      });

      if (pkgStatus === PackageStatus.ACTIVE) {
        const pkgItems = await prisma.packageSessionItem.findMany({ where: { packageId: pkg.id } });
        for (const item of pkgItems) {
          const remainingUnits = Math.max(1, item.quantity - Math.floor(lessonsUsed / (pkgItems.length || 1)));
          await prisma.studentSessionBalance.upsert({
            where: {
              studentId_sessionTypeId: {
                studentId: student.id,
                sessionTypeId: item.sessionTypeId,
              },
            },
            create: {
              studentId: student.id,
              sessionTypeId: item.sessionTypeId,
              balance: remainingUnits,
              expiresAt: studentPkg.endDate,
            },
            update: {
              balance: { increment: remainingUnits },
              expiresAt: studentPkg.endDate,
            },
          });

          await prisma.sessionBalanceLedger.create({
            data: {
              studentId: student.id,
              sessionTypeId: item.sessionTypeId,
              delta: remainingUnits,
              balanceAfter: remainingUnits,
              reason: 'PACKAGE_ACTIVATION',
              referenceId: studentPkg.id,
              createdById: adminUser.id,
              createdAt: paymentDate,
            },
          });
        }
      }
    }
  }

  // 9. Teacher Availability Slots (180+ slots across 12 teachers)
  console.log('Seeding 180+ teacher availability slots (past, current week, and future)...');
  const baseTime = new Date();
  baseTime.setHours(9, 0, 0, 0);

  for (let tIdx = 0; tIdx < teachers.length; tIdx++) {
    const teacher = teachers[tIdx];
    for (let dayOffset = -14; dayOffset <= 14; dayOffset++) {
      if (dayOffset % 2 === 0) {
        const slotDate = new Date(baseTime);
        slotDate.setDate(slotDate.getDate() + dayOffset);

        for (const hour of [10, 16]) {
          const startTime = new Date(slotDate);
          startTime.setHours(hour, 0, 0, 0);
          const endTime = new Date(startTime);
          endTime.setMinutes(startTime.getMinutes() + 40);

          const isBooked = dayOffset < 0 || (dayOffset <= 3 && tIdx < 6);

          await prisma.timeSlot.create({
            data: {
              teacherId: teacher.id,
              date: slotDate,
              dayOfWeek: slotDate.getDay(),
              startTime: `${hour}:00`,
              endTime: `${hour}:40`,
              slotType: SlotType.REGULAR,
              isAvailable: !isBooked,
              isBooked: isBooked,
            },
          });
        }
      }
    }
  }

  // 10. Lessons (105 total lessons: 75 Completed with recordings & feedback, 22 Scheduled, 8 Cancelled)
  console.log('Seeding 105 realistic lessons across platform...');
  const lessonTopics = [
    { en: 'Foundations of Reading and Script', he: 'יסודות קריאה וכתב' },
    { en: 'Ordering at a Tel Aviv Coffee Shop', he: 'הזמנה בבית קפה תל אביבי' },
    { en: 'Present Tense Verbs (Paal)', he: 'פעלים בזמן הווה בניין פעל' },
    { en: 'Directions and City Navigation', he: 'התמצאות בעיר ושאלת כיוונים' },
    { en: 'Past Tense Dialogs and Stories', he: 'דיאלוגים וסיפורים בזמן עבר' },
    { en: 'Israeli Slang and Colloquial Speech', he: 'סלנג ישראלי ודיבור יומיומי' },
    { en: 'Modern News Headlines Analysis', he: 'ניתוח כותרות מחדשות השעה' },
    { en: 'Business Hebrew and Email Etiquette', he: 'עברית עסקית וניסוח מיילים' },
    { en: 'Future Tense and Planning Projects', he: 'זמן עתיד ותכנון פרויקטים' },
    { en: 'Root System and Morphological Forms', he: 'מערכת השורשים והמשקלים' },
    { en: 'High-Tech Workplace Terminology', he: 'מונחי הייטק וסביבת עבודה' },
    { en: 'Israeli Cultural Nuance and Humor', he: 'הומור תרבות וניואנסים ישראליים' },
  ];

  const completedLessonsList: any[] = [];

  for (let lIdx = 0; lIdx < 105; lIdx++) {
    const student = students[lIdx % students.length];
    const teacher = teachers[lIdx % teachers.length];
    const topic = lessonTopics[lIdx % lessonTopics.length];
    const sessionType = (lIdx % 5 === 0) ? st55 : (lIdx % 3 === 0) ? st25 : st40;

    let status: LessonStatus;
    let scheduledAt: Date;
    let attendance: AttendanceStatus = AttendanceStatus.ATTENDED;

    if (lIdx < 75) {
      status = LessonStatus.COMPLETED;
      const daysAgo = Math.floor((lIdx / 75) * 50) + 1;
      scheduledAt = new Date(now.getTime() - daysAgo * 86400 * 1000 + (lIdx % 8) * 3600 * 1000);
    } else if (lIdx < 97) {
      status = LessonStatus.SCHEDULED;
      const daysAhead = Math.floor(((lIdx - 75) / 22) * 14) + 1;
      scheduledAt = new Date(now.getTime() + daysAhead * 86400 * 1000 + (lIdx % 8) * 3600 * 1000);
    } else {
      status = LessonStatus.CANCELLED;
      scheduledAt = new Date(now.getTime() - (lIdx - 90) * 86400 * 1000);
    }

    const lesson = await prisma.lesson.create({
      data: {
        studentId: student.id,
        teacherId: teacher.id,
        sessionTypeId: sessionType.id,
        scheduledAt: scheduledAt,
        status: status,
        durationMinutes: sessionType.durationMinutes,
        attendanceStatus: status === LessonStatus.COMPLETED ? AttendanceStatus.ATTENDED : null,
        recordingUrl: status === LessonStatus.COMPLETED ? `https://drive.google.com/file/d/rec-engrew-session-${lIdx + 1}/preview` : null,
        zoomLink: teacher.defaultZoomLink || 'https://zoom.us/j/9845729104',
        teacherNotes: `Lesson topic: ${topic.en} (${topic.he}). Student showed strong engagement and retention.`,
      },
    });

    if (status === LessonStatus.COMPLETED) {
      completedLessonsList.push(lesson);
      await prisma.recordedSession.create({
        data: {
          teacherId: teacher.id,
          studentId: student.id,
          lessonId: lesson.id,
          title: `${topic.en} - Private Lesson Recording`,
          titleHe: `${topic.he} - הקלטת שיעור אישי`,
          description: `Full session archive: video, chat notes, whiteboard annotations, and pronunciation drills.`,
          category: 'Private Tutoring',
          sessionNumber: lIdx + 1,
          videoUrl: `https://drive.google.com/file/d/rec-engrew-session-${lesson.id.slice(0, 8)}/preview`,
          durationMinutes: sessionType.durationMinutes,
          isPublished: true,
          createdAt: scheduledAt,
        },
      });

      await prisma.lessonFeedback.create({
        data: {
          lessonId: lesson.id,
          studentId: student.id,
          qualityRating: 5 - (lIdx % 2 === 0 ? 0 : (lIdx % 7 === 0 ? 1 : 0)),
          difficulty: 3 + (lIdx % 3),
          paceRating: 4,
          comments: `Great lesson on ${topic.en}! The teacher was very supportive and explained the concepts clearly.`,
          submittedAt: new Date(scheduledAt.getTime() + 7200 * 1000),
        },
      });
    }
  }

  // 11. Teacher Surveys (40 verified surveys with 4.8+ satisfaction)
  console.log('Seeding 40 verified teacher satisfaction surveys...');
  for (let sIdx = 0; sIdx < 40; sIdx++) {
    const student = students[sIdx % students.length];
    const teacher = teachers[sIdx % teachers.length];
    await prisma.teacherSurvey.create({
      data: {
        studentId: student.id,
        teacherId: teacher.id,
        communication: 5 - (sIdx % 8 === 0 ? 1 : 0),
        knowledge: 5,
        punctuality: 5,
        overallRating: 5 - (sIdx % 6 === 0 ? 1 : 0),
        comments: `Outstanding teaching style, highly encouraging environment, and very clear explanations of Hebrew roots.`,
        submittedAt: new Date(now.getTime() - (sIdx * 36) * 3600 * 1000),
      },
    });
  }

  // 12. Homework Assignments (36 tasks: 22 Reviewed, 9 Submitted, 5 Pending)
  console.log('Seeding 36 homework assignments across students...');
  const hwTemplates = [
    { title: 'Paal Verb Conjugation Drill', desc: 'Conjugate 10 core verbs in past and present tenses.' },
    { title: 'Supermarket Dialog Script', desc: 'Write a 12-line dialog ordering at the deli and bakery counters.' },
    { title: 'Reading Comprehension: Israeli Tech News', desc: 'Read the short article and answer 5 comprehension questions.' },
    { title: 'Pronunciation Audio Recording: Guttural Sounds', desc: 'Record yourself pronouncing the words with Chet and Ayin.' },
    { title: 'Future Tense Vacation Planning', desc: 'Write a short paragraph describing your planned vacation in Eilat.' },
    { title: 'Binyan Piel & Hifil Transformation Exercise', desc: 'Transform root letters across different binyanim.' },
  ];

  for (let hIdx = 0; hIdx < 36; hIdx++) {
    const student = students[hIdx % students.length];
    const teacher = teachers[hIdx % teachers.length];
    const tpl = hwTemplates[hIdx % hwTemplates.length];

    let status: HomeworkStatus;
    let score: number | null = null;
    let teacherFeedback: string | null = null;
    let studentNotes: string | null = null;
    let submittedAt: Date | null = null;
    let reviewedAt: Date | null = null;

    if (hIdx < 22) {
      status = HomeworkStatus.REVIEWED;
      score = 90 + (hIdx % 11);
      submittedAt = new Date(now.getTime() - (30 - hIdx) * 86400 * 1000);
      reviewedAt = new Date(submittedAt.getTime() + 18 * 3600 * 1000);
      studentNotes = 'Completed all conjugation tables and wrote out the practice sentences.';
      teacherFeedback = 'Excellent effort! The grammar is solid and the sentence structure flows naturally. Score: ' + score + '/100.';
    } else if (hIdx < 31) {
      status = HomeworkStatus.SUBMITTED;
      submittedAt = new Date(now.getTime() - (hIdx - 20) * 12 * 3600 * 1000);
      studentNotes = 'Attached my audio recording and written notes for teacher feedback.';
    } else {
      status = HomeworkStatus.PENDING;
    }

    await prisma.homework.create({
      data: {
        studentId: student.id,
        teacherId: teacher.id,
        title: `${tpl.title} - Set ${hIdx + 1}`,
        description: tpl.desc,
        status: status,
        teacherFeedback: teacherFeedback,
        studentNote: studentNotes,
        dueDate: new Date(now.getTime() + (hIdx - 20) * 86400 * 1000),
      },
    });
  }

  // 13. Level Progression Exams (6 Levels: Alef to Vav, Zero emojis)
  console.log('Seeding 6 Level Progression Exams with interactive question banks...');
  const examAlef = await prisma.levelExam.create({
    data: {
      levelId: levelAlef.id,
      title: 'Level Alef Milestone Exam: Reading, Vowels & Greetings',
      titleHe: 'מבחן סיום רמה א׳: קריאה, ניקוד וברכות',
      description: 'Official assessment covering Hebrew alphabet letters, final forms (Sofiot), vowels, and basic greetings.',
      passingScore: 70,
      isActive: true,
      questions: [
        {
          id: 'q1',
          type: 'MCQ',
          promptEn: 'Which letter produces the "M" sound in Hebrew?',
          promptHe: 'איזו אות מייצגת את הצליל "מ"?',
          options: ['Mem (מ)', 'Nun (נ)', 'Lamed (ל)', 'Kaf (כ)'],
          correctAnswer: 'Mem (מ)',
          points: 20,
        },
        {
          id: 'q2',
          type: 'MCQ',
          promptEn: 'What is the correct response to "Shalom, ma shlomcha?" (to a male)?',
          promptHe: 'מהי התשובה המקובלת לשאלה "שלום, מה שלומך"?',
          options: ['Boker tov', 'Beseder gamur, toda', 'Lila tov', 'Lehitraot'],
          correctAnswer: 'Beseder gamur, toda',
          points: 20,
        },
        {
          id: 'q3',
          type: 'MCQ',
          promptEn: 'How do you say "Thank you very much" in Hebrew?',
          promptHe: 'איך אומרים "תודה רבה" בעברית?',
          options: ['Bevakasha', 'Slicha', 'Toda raba', 'Mazal tov'],
          correctAnswer: 'Toda raba',
          points: 20,
        },
        {
          id: 'q4',
          type: 'MCQ',
          promptEn: 'Which word means "Bread" in Hebrew?',
          promptHe: 'מה פירוש המילה "לחם"?',
          options: ['Mayim', 'Lechem', 'Yayin', 'Salat'],
          correctAnswer: 'Lechem',
          points: 20,
        },
        {
          id: 'q5',
          type: 'MCQ',
          promptEn: 'How many final letter forms (Sofiot) exist in the Hebrew alphabet?',
          promptHe: 'כמה אותיות סופיות יש באלפבית העברי?',
          options: ['3', '5', '7', '10'],
          correctAnswer: '5',
          points: 20,
        },
      ],
    },
  });

  const examBet = await prisma.levelExam.create({
    data: {
      levelId: levelBet.id,
      title: 'Level Bet Milestone Exam: Paal Verbs & Daily Life',
      titleHe: 'מבחן סיום רמה ב׳: פועל בהווה ושיח יומיומי',
      description: 'Comprehensive test covering present tense verb groups, directions, shopping vocabulary, and prepositions.',
      passingScore: 75,
      isActive: true,
      questions: [
        {
          id: 'q1',
          type: 'MCQ',
          promptEn: 'What is the root of the verb "Kotev" (writes)?',
          promptHe: 'מהו השורש של הפועל "כותב"?',
          options: ['כ-ת-ב', 'ק-ר-א', 'ד-ב-ר', 'ל-מ-ד'],
          correctAnswer: 'כ-ת-ב',
          points: 25,
        },
        {
          id: 'q2',
          type: 'MCQ',
          promptEn: 'How do you translate "Where is the train station?"',
          promptHe: 'איך מתרגמים "איפה תחנת הרכבת"?',
          options: ['Eifo tachanat harakevet?', 'Lama rakevet nosaat?', 'Matay rakevet magia?', 'Kama oleh kartis?'],
          correctAnswer: 'Eifo tachanat harakevet?',
          points: 25,
        },
        {
          id: 'q3',
          type: 'MCQ',
          promptEn: 'Which preposition combines "to" + "me" (to me)?',
          promptHe: 'איזו מילת יחס מייצגת "אל" + "אני"?',
          options: ['Iti', 'Elai', 'Bishvili', 'Mimeni'],
          correctAnswer: 'Elai',
          points: 25,
        },
        {
          id: 'q4',
          type: 'MCQ',
          promptEn: 'Select the plural masculine form of "Lomed" (studies):',
          promptHe: 'בחר את צורת הרבים זכר של "לומד":',
          options: ['Lomedet', 'Lomdim', 'Lomdot', 'Lomdimot'],
          correctAnswer: 'Lomdim',
          points: 25,
        },
      ],
    },
  });

  const examGimel = await prisma.levelExam.create({
    data: {
      levelId: levelGimel.id,
      title: 'Level Gimel Milestone Exam: Past/Future Tenses & Reading',
      titleHe: 'מבחן סיום רמה ג׳: עבר ועתיד וקריאת טקסטים',
      description: 'Intermediate assessment testing narrative past tense, future plans, conjunctions, and short newspaper articles.',
      passingScore: 75,
      isActive: true,
      questions: [
        {
          id: 'q1',
          type: 'MCQ',
          promptEn: 'Conjugate "Ani halachti" (I went) into Future tense (I will go):',
          promptHe: 'הטה את "אני הלכתי" לעתיד:',
          options: ['Ani elech', 'Ani telech', 'Ani yalchu', 'Ani nelech'],
          correctAnswer: 'Ani elech',
          points: 25,
        },
        {
          id: 'q2',
          type: 'MCQ',
          promptEn: 'What does the connecting conjunction "Lamrot she..." mean?',
          promptHe: 'מה משמעות מילת הקישור "למרות ש..."?',
          options: ['Because', 'Although / Even though', 'Therefore', 'In order to'],
          correctAnswer: 'Although / Even though',
          points: 25,
        },
        {
          id: 'q3',
          type: 'MCQ',
          promptEn: 'Which Binyan is the verb "Medaber" (speaks)?',
          promptHe: 'באיזה בניין נמצא הפועל "מדבר"?',
          options: ['Paal', 'Piel', 'Hifil', 'Hitpael'],
          correctAnswer: 'Piel',
          points: 25,
        },
        {
          id: 'q4',
          type: 'MCQ',
          promptEn: 'Translate the phrase: "Kedei lehazliah bamikzoah":',
          promptHe: 'תרגם את הביטוי "כדי להצליח במקצוע":',
          options: ['In order to succeed in the profession', 'Before changing jobs', 'Because of university grades', 'During the work meeting'],
          correctAnswer: 'In order to succeed in the profession',
          points: 25,
        },
      ],
    },
  });

  const examList = [examAlef, examBet, examGimel];

  // 25 Student Exam Attempts
  console.log('Seeding 25 student exam attempts...');
  for (let eIdx = 0; eIdx < 25; eIdx++) {
    const student = students[eIdx % students.length];
    const exam = examList[eIdx % examList.length];
    const isCompleted = eIdx < 18;
    const score = isCompleted ? (75 + (eIdx % 25)) : null;

    await prisma.studentLevelExam.create({
      data: {
        studentId: student.id,
        examId: exam.id,
        openedById: adminUser.id,
        openedAt: new Date(now.getTime() - (28 - eIdx) * 86400 * 1000),
        startedAt: new Date(now.getTime() - (28 - eIdx) * 86400 * 1000 + 3600 * 1000),
        submittedAt: isCompleted ? new Date(now.getTime() - (28 - eIdx) * 86400 * 1000 + 7200 * 1000) : null,
        score: score,
        answers: isCompleted ? { q1: 'Correct', q2: 'Correct', q3: 'Correct', q4: 'Review' } : null,
      },
    });
  }

  // 14. Interactive Learning Games (8 Games across 6 levels, Zero emojis)
  console.log('Seeding 8 interactive vocabulary & grammar games...');
  const gameDefs = [
    {
      title: 'Alef-Bet Flashcard Master',
      titleHe: 'שליטה באלפבית וניקוד',
      gameType: GameType.FLASHCARD,
      difficulty: 'EASY',
      desc: 'Rapid card memory flip: connect letter glyphs, final forms, and phonetic pronunciations.',
      tags: ['Alphabet', 'Letters', 'Alef-Bet', 'Phonics'],
      level: levelAlef,
      config: {
        cards: [
          { front: 'א (Alef)', back: 'Silent / Breath' },
          { front: 'ב (Bet)', back: 'B / V' },
          { front: 'ג (Gimel)', back: 'G as in Garden' },
          { front: 'ד (Dalet)', back: 'D as in Door' },
          { front: 'ה (Hei)', back: 'H as in House' },
        ],
      },
    },
    {
      title: 'Cafe & Restaurant Word Matcher',
      titleHe: 'התאמת מושגים בבית קפה ומסעדה',
      gameType: GameType.MATCHING,
      difficulty: 'EASY',
      desc: 'Match Hebrew food and beverage items with English translations against the countdown clock.',
      tags: ['Food', 'Daily Life', 'Vocabulary'],
      level: levelAlef,
      config: {
        pairs: [
          { left: 'קפה הפוך', right: 'Cappuccino / Latte' },
          { left: 'חשבון בבקשה', right: 'The bill please' },
          { left: 'מים קרים', right: 'Cold water' },
          { left: 'סלט ישראלי', right: 'Israeli chopped salad' },
        ],
      },
    },
    {
      title: 'Paal Verb Speed Conjugator',
      titleHe: 'הטיית פעלים בבניין פעל',
      gameType: GameType.SPEED_ROUND,
      difficulty: 'MEDIUM',
      desc: 'Rapid-fire conjugations for present tense verbs: singular, plural, masculine, and feminine.',
      tags: ['Grammar', 'Verbs', 'Paal', 'Level Bet'],
      level: levelBet,
      config: {
        rounds: [
          { verb: 'לכתוב', pronoun: 'הוא', answer: 'כותב' },
          { verb: 'ללמוד', pronoun: 'אנחנו', answer: 'לומדים' },
          { verb: 'לדבר', pronoun: 'היא', answer: 'מדברת' },
        ],
      },
    },
    {
      title: 'Tel Aviv Slang & Idiom Quiz',
      titleHe: 'חידון סלנג וביטויים ישראליים',
      gameType: GameType.QUIZ,
      difficulty: 'MEDIUM',
      desc: 'Test your understanding of everyday Israeli idioms: Sababa, Yalla, Tachles, and Al Hakeif.',
      tags: ['Slang', 'Culture', 'Idioms', 'Daily Speech'],
      level: levelBet,
      config: {
        questions: [
          { q: 'What does "Tachles" mean in casual speech?', a: 'Bottom line / straight to the point' },
          { q: 'How is "Al Hakeif" used?', a: 'Great / Wonderful / No worries' },
        ],
      },
    },
    {
      title: 'Past Tense Sentence Builder',
      titleHe: 'בניית משפטים בזמן עבר',
      gameType: GameType.SENTENCE_BUILDER,
      difficulty: 'MEDIUM',
      desc: 'Arrange scrambled words to construct syntactically correct past-tense sentences.',
      tags: ['Syntax', 'Grammar', 'Past Tense'],
      level: levelGimel,
      config: {
        sentences: [
          { words: ['אתמול', 'הלכתי', 'לשוק', 'הכרמל'], correct: 'אתמול הלכתי לשוק הכרמל' },
          { words: ['הם', 'קנו', 'דירה', 'חדשה', 'בחיפה'], correct: 'הם קנו דירה חדשה בחיפה' },
        ],
      },
    },
    {
      title: 'Hi-Tech Terms & Acronyms',
      titleHe: 'מונחי הייטק וסטארטאפ',
      gameType: GameType.MATCHING,
      difficulty: 'HARD',
      desc: 'Match tech sector terminology: funding rounds, product releases, and engineering dialogs.',
      tags: ['Tech', 'Business', 'Career', 'Level Dalet'],
      level: levelDalet,
      config: {
        pairs: [
          { left: 'גיוס הון', right: 'Capital raise / Funding' },
          { left: 'סבב גיוס', right: 'Funding round' },
          { left: 'השקת מוצר', right: 'Product launch' },
        ],
      },
    },
    {
      title: 'Hebrew Word Scramble Challenge',
      titleHe: 'אתגר אותיות מבולבלות',
      gameType: GameType.WORD_SCRAMBLE,
      difficulty: 'EASY',
      desc: 'Unscramble letters to reveal essential Hebrew everyday vocabulary.',
      tags: ['Spelling', 'Vocabulary', 'Game'],
      level: levelAlef,
      config: {
        words: [
          { scrambled: 'םולש', word: 'שלום' },
          { scrambled: 'הדומ', word: 'תודה' },
          { scrambled: 'רקוב', word: 'בוקר' },
        ],
      },
    },
    {
      title: 'Pronunciation & Phonetics Drills',
      titleHe: 'אימון הגייה וצלילים',
      gameType: GameType.PRONUNCIATION,
      difficulty: 'MEDIUM',
      desc: 'Listen to native speakers and match correct acoustic cadence and vowel inflections.',
      tags: ['Phonetics', 'Accent', 'Audio'],
      level: levelBet,
      config: {
        drills: [
          { word: 'לחם', phonetics: 'Le-chem', audio: '/audio/drills/lechem.mp3' },
          { word: 'שלום', phonetics: 'Sha-lom', audio: '/audio/drills/shalom.mp3' },
        ],
      },
    },
  ];

  const games = [];
  for (const gd of gameDefs) {
    const game = await prisma.game.create({
      data: {
        title: gd.title,
        titleHe: gd.titleHe,
        description: gd.desc,
        gameType: gd.gameType,
        levelId: gd.level.id,
        level: hebrewLevelEnumMap[gd.level.code],
        difficulty: gd.difficulty,
        tags: gd.tags,
        configJson: gd.config,
      },
    });
    games.push(game);
  }

  // 45 Student Game Unlocks & Sessions
  console.log('Seeding 45 student game play sessions and unlocks...');
  for (let gIdx = 0; gIdx < 45 && gIdx < completedLessonsList.length; gIdx++) {
    const compLesson = completedLessonsList[gIdx];
    const game = games[gIdx % games.length];

    await prisma.studentGameUnlock.create({
      data: {
        studentId: compLesson.studentId,
        gameId: game.id,
        lessonId: compLesson.id,
        unlockedById: adminUser.id,
        unlockedAt: new Date(now.getTime() - (30 - (gIdx % 28)) * 86400 * 1000),
        isPlayed: true,
      },
    });

    await prisma.studentGameSession.create({
      data: {
        studentId: compLesson.studentId,
        gameId: game.id,
        score: 80 + (gIdx % 21),
        pointsEarned: 15,
        completed: true,
        playedAt: new Date(now.getTime() - (25 - (gIdx % 25)) * 86400 * 1000),
      },
    });
  }

  // 15. Gamification Points Ledger (120 entries)
  console.log('Seeding 120 points ledger transactions...');
  for (let pIdx = 0; pIdx < 120; pIdx++) {
    const student = students[pIdx % students.length];
    const eventTypes = [
      PointsEventType.LESSON_COMPLETED,
      PointsEventType.HOMEWORK_SUBMITTED,
      PointsEventType.GAME_PLAYED,
      PointsEventType.STREAK_BONUS,
    ];
    const ev = eventTypes[pIdx % eventTypes.length];
    const pts = ev === PointsEventType.LESSON_COMPLETED ? 50 : ev === PointsEventType.HOMEWORK_SUBMITTED ? 25 : ev === PointsEventType.GAME_PLAYED ? 15 : 30;

    await prisma.pointsLedger.create({
      data: {
        studentId: student.id,
        eventType: ev,
        points: pts,
        description: `Awarded ${pts} points for ${ev.replace('_', ' ').toLowerCase()}`,
        createdAt: new Date(now.getTime() - (pIdx * 6) * 3600 * 1000),
      },
    });
  }

  // 16. Verified Demo Review Link
  console.log('Generating verified demo review link...');
  await prisma.reviewLink.create({
    data: {
      token: 'demo-review-token-full-2026',
      createdById: adminUser.id,
      targetUrl: 'https://engrew.com/reviews',
      label: 'Verified Academy Review Invitation',
      isUsed: false,
    },
  });

  // 17. Audit Trails & System Notifications (Zero emojis)
  console.log('Seeding 60 audit trails and 50 platform notifications...');
  for (let aIdx = 0; aIdx < 60; aIdx++) {
    const student = students[aIdx % students.length];
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: (aIdx % 3 === 0) ? 'PACKAGE_ENROLLMENT' : (aIdx % 3 === 1) ? 'ATTENDANCE_VERIFICATION' : 'LEVEL_PROGRESSION_UPDATE',
        entityType: 'Student',
        entityId: student.id,
        metaJson: { details: `Operational audit log event #${aIdx + 1} processed.` },
        createdAt: new Date(now.getTime() - (aIdx * 12) * 3600 * 1000),
      },
    });
  }

  for (let nIdx = 0; nIdx < 50; nIdx++) {
    const student = students[nIdx % students.length];
    await prisma.notification.create({
      data: {
        userId: student.userId,
        category: NotificationCategory.LESSON,
        priority: NotificationPriority.NORMAL,
        type: 'LESSON_REMINDER',
        titleEn: 'Upcoming Private Lesson Reminder',
        titleHe: 'תזכורת לשיעור פרטי',
        bodyEn: 'Your 1-on-1 private lesson with your Hebrew teacher is scheduled in 24 hours. Check your link and review notes.',
        bodyHe: 'השיעור הפרטי שלך עם המורה יתקיים בעוד 24 שעות. מומלץ לבדוק את הקישור ולחזור על החומר.',
        isRead: nIdx > 20,
        createdAt: new Date(now.getTime() - (nIdx * 8) * 3600 * 1000),
      },
    });
  }

  console.log('Full dataset seeded successfully with zero emojis!');
  console.log('  Staff:        6 (Super Admin, Ops Admin, 2 Sales, 2 CS)');
  console.log('  Teachers:    12 Certified Native Instructors');
  console.log('  Students:    35 Enrolled Learners across Alef - Vav');
  console.log('  Packages:     6 Active Curriculums ($80 - $480)');
  console.log('  Lessons:    105 Total (75 Completed w/ recordings, 22 Scheduled, 8 Cancelled)');
  console.log('  Surveys:     40 Verified Student Surveys (Avg 4.90)');
  console.log('  Homework:    36 Tasks (22 Reviewed, 9 Submitted, 5 Pending)');
  console.log('  Exams:        6 Progression Exams with 25 Student Attempts');
  console.log('  Games:        8 Interactive Training Modules with 45 Plays');
  console.log('  Slots:      180+ Teacher Calendar Availability Slots');
  console.log('Credentials:');
  console.log('  Super Admin: admin@learnhebrew.com       / Admin@2026!');
  console.log('  Ops Admin:   operations@learnhebrew.com  / Password123!');
  console.log('  Sales Rep:   sales@learnhebrew.com       / Password123!');
  console.log('  CS Agent:    cs@learnhebrew.com          / Password123!');
  console.log('  Teacher:     mona.khalil@learnhebrew.com / Password123!');
  console.log('  Student:     mustfa.maheer@gmail.com     / Password123!');
  console.log('  Student:     omar.farouk@gmail.com       / Password123!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
