import { PrismaClient, Role, HebrewLevel, GameType, SlotType, LessonStatus, HomeworkStatus, PointsEventType, PaymentStatus, AttendanceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import process from 'process';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting full dataset seeding for Engrew Hebrew & English Academy...');

  // Clean existing transactional and relational data in safe foreign-key order
  console.log('🧹 Purging old sample data...');
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

  // 1. Languages
  console.log('🌐 Seeding platform languages...');
  const langEn = await prisma.language.create({
    data: { code: 'en', labelEn: 'English', labelNative: 'English', flagEmoji: '🇺🇸', isActive: true },
  });
  const langHe = await prisma.language.create({
    data: { code: 'he', labelEn: 'Hebrew', labelNative: 'עברית', flagEmoji: '🇮🇱', isActive: true },
  });
  const langAr = await prisma.language.create({
    data: { code: 'ar', labelEn: 'Arabic', labelNative: 'العربية', flagEmoji: '🇪🇬', isActive: true },
  });
  const langFr = await prisma.language.create({
    data: { code: 'fr', labelEn: 'French', labelNative: 'Français', flagEmoji: '🇫🇷', isActive: true },
  });
  const langRu = await prisma.language.create({
    data: { code: 'ru', labelEn: 'Russian', labelNative: 'Русский', flagEmoji: '🇷🇺', isActive: true },
  });

  // 2. Dynamic Curriculum Levels
  console.log('📚 Seeding Hebrew proficiency levels (Alef - Vav)...');
  const levelAlef = await prisma.level.create({
    data: {
      code: 'BEGINNER',
      labelEn: '🌱 Beginner (Alef)',
      labelHe: '🌱 רמה א׳ - מתחילים',
      sortOrder: 1,
      color: '#0D9488',
      description: 'Foundations of reading Alef-Bet, vowel signs (Nikkud), basic greetings, and introduction phrases.',
    },
  });
  const levelBet = await prisma.level.create({
    data: {
      code: 'ELEMENTARY',
      labelEn: '🌿 Elementary (Bet)',
      labelHe: '🌿 רמה ב׳ - יסודי',
      sortOrder: 2,
      color: '#10B981',
      description: 'Present tense verbs (Paal), essential daily vocabulary, shopping, ordering at cafes, and asking directions.',
    },
  });
  const levelGimel = await prisma.level.create({
    data: {
      code: 'INTERMEDIATE',
      labelEn: '🌲 Intermediate (Gimel)',
      labelHe: '🌲 רמה ג׳ - בינוני',
      sortOrder: 3,
      color: '#F59E0B',
      description: 'Past and future tenses, prepositions, connecting words, reading easy Israeli news, and intermediate dialogs.',
    },
  });
  const levelDalet = await prisma.level.create({
    data: {
      code: 'UPPER_INTERMEDIATE',
      labelEn: '🌳 Upper Intermediate (Dalet)',
      labelHe: '🌳 רמה ד׳ - מתקדם קל',
      sortOrder: 4,
      color: '#6366F1',
      description: 'Advanced verb groups (Piel, Hifil), idioms, conversational slang, debating topics, and business culture.',
    },
  });
  const levelHei = await prisma.level.create({
    data: {
      code: 'ADVANCED',
      labelEn: '👑 Advanced (Hei)',
      labelHe: '👑 רמה ה׳ - מתקדמים',
      sortOrder: 5,
      color: '#8B5CF6',
      description: 'Complex syntactic structures, academic literature, media analysis, professional negotiation, and nuance.',
    },
  });
  const levelVav = await prisma.level.create({
    data: {
      code: 'FLUENT',
      labelEn: '🏆 Mastery / Native-Like (Vav)',
      labelHe: '🏆 רמה ו׳ - שפת אם ופטור',
      sortOrder: 6,
      color: '#EC4899',
      description: 'Exemption level (Ptor), complete linguistic mastery, Israeli humor, legal/medical terminology, and effortless fluency.',
    },
  });

  // 3. Multi-Duration Session Types
  console.log('⏱️ Seeding session types (25m Focus, 40m Standard, 55m Intensive)...');
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

  // 4. Session Packages with Duration Allocations
  console.log('📦 Seeding learning packages with session allocations...');
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
      validityDays: 30,
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
      name: 'Executive Immersion Pack',
      nameHe: 'חבילת פרימיום למנהלים',
      description: 'Executive mastery: 16 express sessions (25m), 8 standard sessions (40m), and 4 deep-dive sessions (55m).',
      descriptionHe: 'מסלול פרימיום מקיף: 16 שיעורי מיקוד, 8 שיעורים סטנדרטיים ו-4 שיעורי עומק.',
      validityDays: 30,
      totalLessons: 28,
      price: 480,
      originalPrice: 580,
      onSale: false,
      isPopular: false,
      currency: 'USD',
      isActive: true,
      sessionItems: {
        create: [
          { sessionTypeId: st25.id, quantity: 16 },
          { sessionTypeId: st40.id, quantity: 8 },
          { sessionTypeId: st55.id, quantity: 4 },
        ],
      },
    },
  });

  const pkgExpress = await prisma.package.create({
    data: {
      name: 'Alef-Bet Express Pass',
      nameHe: 'כרטיסיית אקספרס לאלף-בית',
      description: '4 focused 25-minute sessions for fast reading and pronunciation tune-up.',
      descriptionHe: '4 מפגשי מיקוד בני 25 דקות לרכישת קריאה מהירה ודיוק בהגייה.',
      validityDays: 30,
      totalLessons: 4,
      price: 80,
      originalPrice: 95,
      onSale: false,
      isPopular: false,
      currency: 'USD',
      isActive: true,
      sessionItems: {
        create: [{ sessionTypeId: st25.id, quantity: 4 }],
      },
    },
  });

  // 5. Granular Permissions (58 Enterprise Actions) & Role Definitions
  console.log('🛡️ Seeding 58 granular permissions & system role matrices...');
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

  // 6. Gamification Point Rules
  console.log('🏆 Seeding gamification point rules...');
  await prisma.pointRule.createMany({
    data: [
      { eventType: PointsEventType.LESSON_COMPLETED, points: 50, description: 'Points earned for completing a live 1-on-1 session' },
      { eventType: PointsEventType.GAME_PLAYED, points: 15, description: 'Points earned for vocabulary practice games' },
      { eventType: PointsEventType.HOMEWORK_SUBMITTED, points: 25, description: 'Points awarded for on-time homework submission' },
      { eventType: PointsEventType.STREAK_BONUS, points: 30, description: 'Weekly consistency streak bonus' },
      { eventType: PointsEventType.MANUAL, points: 0, description: 'Instructor manual excellence points award' },
    ],
  });

  // 7. Users & Profiles
  console.log('👥 Seeding enterprise staff, teachers, and students...');
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

  // Sales Representative
  const salesUser = await prisma.user.create({
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

  // Customer Service Specialist
  const csUser = await prisma.user.create({
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

  // 5 Certified Native Teachers
  const teacherData = [
    {
      email: 'mona.khalil@learnhebrew.com',
      firstName: 'Mona',
      lastName: 'Khalil',
      bio: 'Tel Aviv University linguist with 8+ years experience. Expert in modern Israeli slang, rapid conversational fluency, and confident accent reduction.',
      specialties: ['Conversational Hebrew', 'Tel Aviv Slang', 'Accent Coaching', 'Beginner Foundations'],
      ratingAvg: 4.96,
      ratingCount: 32,
      zoomLink: 'https://zoom.us/my/mona.hebrew',
    },
    {
      email: 'karim.mahmoud@learnhebrew.com',
      firstName: 'Karim',
      lastName: 'Mahmoud',
      bio: 'Certified Ulpan instructor with deep focus on structured grammar, root morphology (Shoresh), and classical Hebrew literature.',
      specialties: ['Ulpan Grammar', 'Root System (Binyanim)', 'Reading Fluency', 'Biblical Texts'],
      ratingAvg: 4.88,
      ratingCount: 24,
      zoomLink: 'https://zoom.us/my/karim.hebrew',
    },
    {
      email: 'yael.cohen@learnhebrew.com',
      firstName: 'Yael',
      lastName: 'Cohen',
      bio: 'Former Hi-Tech product manager turned Hebrew specialist. Teaches business communication, tech sector terminology, and executive negotiation.',
      specialties: ['Business Hebrew', 'Hi-Tech Terminology', 'Interview Prep', 'Advanced Grammar'],
      ratingAvg: 4.98,
      ratingCount: 29,
      zoomLink: 'https://zoom.us/my/yael.hebrew',
    },
    {
      email: 'noam.levi@learnhebrew.com',
      firstName: 'Noam',
      lastName: 'Levi',
      bio: 'Patient, warm educator specializing in complete beginners (Alef), kids, and visual mnemonic techniques for fast alphabet mastery.',
      specialties: ['Beginner Reading', 'Alphabet (Alef-Bet)', 'Interactive Games', 'Everyday Phrases'],
      ratingAvg: 4.92,
      ratingCount: 18,
      zoomLink: 'https://zoom.us/my/noam.hebrew',
    },
    {
      email: 'maya.bendavid@learnhebrew.com',
      firstName: 'Maya',
      lastName: 'Ben-David',
      bio: 'Haifa-based journalist and cultural educator. Focuses on Israeli culture, news analysis, songs, and effortless social small talk.',
      specialties: ['Israeli Culture & Media', 'News & Journalism', 'Intermediate Dialogs', 'Vocabulary Expansion'],
      ratingAvg: 4.90,
      ratingCount: 15,
      zoomLink: 'https://zoom.us/my/maya.hebrew',
    },
  ];

  const teachers = [];
  for (const td of teacherData) {
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
    teachers.push(tUser);
  }

  // 10 Students Across Various Proficiency Levels
  const studentsData = [
    {
      email: 'omar.farouk@gmail.com',
      firstName: 'Omar',
      lastName: 'Farouk',
      levelId: levelAlef.id,
      levelEnum: HebrewLevel.BEGINNER,
      points: 420,
      streak: 7,
      notes: 'Motivated beginner student focusing on daily vocabulary and alphabet reading.',
      pkgId: pkgStarter.id,
      lessonsTotal: 8,
      lessonsUsed: 2,
      b25: 4,
      b40: 2,
      b55: 0,
    },
    {
      email: 'mustfa.maheer@gmail.com',
      firstName: 'Moustafa',
      lastName: 'Maher',
      levelId: levelBet.id,
      levelEnum: HebrewLevel.ELEMENTARY,
      points: 580,
      streak: 14,
      notes: 'Elementary student aiming for conversational fluency. Great grasp of present tense verbs.',
      pkgId: pkgIntensive.id,
      lessonsTotal: 16,
      lessonsUsed: 5,
      b25: 6,
      b40: 3,
      b55: 2,
    },
    {
      email: 'daniel.miller@gmail.com',
      firstName: 'Daniel',
      lastName: 'Miller',
      levelId: levelGimel.id,
      levelEnum: HebrewLevel.INTERMEDIATE,
      points: 710,
      streak: 11,
      notes: 'Software engineer relocating to Tel Aviv. Focuses on tech workplace vocabulary and idioms.',
      pkgId: pkgExecutive.id,
      lessonsTotal: 28,
      lessonsUsed: 8,
      b25: 11,
      b40: 6,
      b55: 3,
    },
    {
      email: 'sophia.chen@gmail.com',
      firstName: 'Sophia',
      lastName: 'Chen',
      levelId: levelAlef.id,
      levelEnum: HebrewLevel.BEGINNER,
      points: 310,
      streak: 5,
      notes: 'Beginner student. Practicing letter sounds, vowel points, and basic introductions.',
      pkgId: pkgStarter.id,
      lessonsTotal: 8,
      lessonsUsed: 3,
      b25: 3,
      b40: 2,
      b55: 0,
    },
    {
      email: 'liam.smith@gmail.com',
      firstName: 'Liam',
      lastName: 'Smith',
      levelId: levelDalet.id,
      levelEnum: HebrewLevel.UPPER_INTERMEDIATE,
      points: 1040,
      streak: 34,
      notes: 'Advanced learner preparing for university entrance examination in Jerusalem.',
      pkgId: pkgExecutive.id,
      lessonsTotal: 28,
      lessonsUsed: 12,
      b25: 8,
      b40: 5,
      b55: 3,
    },
    {
      email: 'charlotte.brown@gmail.com',
      firstName: 'Charlotte',
      lastName: 'Brown',
      levelId: levelGimel.id,
      levelEnum: HebrewLevel.INTERMEDIATE,
      points: 620,
      streak: 9,
      notes: 'Practicing past tense verbs and storytelling. Dedicated homework submitter.',
      pkgId: pkgIntensive.id,
      lessonsTotal: 16,
      lessonsUsed: 6,
      b25: 5,
      b40: 3,
      b55: 2,
    },
    {
      email: 'lucas.garcia@gmail.com',
      firstName: 'Lucas',
      lastName: 'Garcia',
      levelId: levelBet.id,
      levelEnum: HebrewLevel.ELEMENTARY,
      points: 460,
      streak: 8,
      notes: 'Works well with flashcards and speed rounds. Needs practice on verb prepositions.',
      pkgId: pkgStarter.id,
      lessonsTotal: 8,
      lessonsUsed: 7, // Low remaining quota (1 left) -> triggers top-up alert!
      b25: 1,
      b40: 0,
      b55: 0,
    },
    {
      email: 'emily.watson@gmail.com',
      firstName: 'Emily',
      lastName: 'Watson',
      levelId: levelAlef.id,
      levelEnum: HebrewLevel.BEGINNER,
      points: 230,
      streak: 3,
      notes: 'Brand new student. Completed first session with Mona and loved the pronunciation drills.',
      pkgId: pkgExpress.id,
      lessonsTotal: 4,
      lessonsUsed: 1,
      b25: 3,
      b40: 0,
      b55: 0,
    },
    {
      email: 'alex.taylor@gmail.com',
      firstName: 'Alex',
      lastName: 'Taylor',
      levelId: levelDalet.id,
      levelEnum: HebrewLevel.UPPER_INTERMEDIATE,
      points: 820,
      streak: 18,
      notes: 'Fast reader. Analyzing Israeli editorial articles and news broadcasts.',
      pkgId: pkgIntensive.id,
      lessonsTotal: 16,
      lessonsUsed: 7,
      b25: 4,
      b40: 3,
      b55: 2,
    },
    {
      email: 'hannah.klein@gmail.com',
      firstName: 'Hannah',
      lastName: 'Klein',
      levelId: levelHei.id,
      levelEnum: HebrewLevel.ADVANCED,
      points: 950,
      streak: 22,
      notes: 'High proficiency. Refining nuanced academic writing and formal conversation.',
      pkgId: pkgExecutive.id,
      lessonsTotal: 28,
      lessonsUsed: 14,
      b25: 6,
      b40: 5,
      b55: 3,
    },
  ];

  const students = [];
  const now = new Date();
  const expires30d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  for (const sd of studentsData) {
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
        createdById: salesUser.id,
        studentProfile: {
          create: {
            levelId: sd.levelId,
            level: sd.levelEnum,
            totalPoints: sd.points,
            streakDays: sd.streak,
            notes: sd.notes,
          },
        },
        notificationPreference: {
          create: { reminder24hEnabled: true, reminder1hEnabled: true, inAppEnabled: true, emailEnabled: true },
        },
      },
      include: { studentProfile: true },
    });

    // Create Verified Payment Proof
    const payment = await prisma.payment.create({
      data: {
        studentId: sUser.studentProfile!.id,
        packageId: sd.pkgId,
        createdById: salesUser.id,
        screenshotUrl: '/uploads/payments/demo-payment-proof.webp',
        screenshotOriginalName: `${sd.firstName.toLowerCase()}_receipt.pdf`,
        notes: `Verified bank transfer for package order. Customer ID: ${sUser.id.slice(0, 8)}`,
        status: PaymentStatus.APPROVED,
        approvedById: adminUser.id,
        approvedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      },
    });

    // Create Active Student Package
    const studentPkg = await prisma.studentPackage.create({
      data: {
        studentId: sUser.studentProfile!.id,
        packageId: sd.pkgId,
        assignedById: salesUser.id,
        paymentId: payment.id,
        lessonsTotal: sd.lessonsTotal,
        lessonsUsed: sd.lessonsUsed,
        startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        endDate: expires30d,
        status: 'ACTIVE',
      },
    });

    // Create Multi-Duration Session Balances
    if (sd.b25 > 0) {
      await prisma.studentSessionBalance.create({
        data: {
          studentId: sUser.studentProfile!.id,
          sessionTypeId: st25.id,
          balance: sd.b25,
          expiresAt: expires30d,
        },
      });
    }
    if (sd.b40 > 0) {
      await prisma.studentSessionBalance.create({
        data: {
          studentId: sUser.studentProfile!.id,
          sessionTypeId: st40.id,
          balance: sd.b40,
          expiresAt: expires30d,
        },
      });
    }
    if (sd.b55 > 0) {
      await prisma.studentSessionBalance.create({
        data: {
          studentId: sUser.studentProfile!.id,
          sessionTypeId: st55.id,
          balance: sd.b55,
          expiresAt: expires30d,
        },
      });
    }

    students.push({ ...sUser, studentPkg });
  }

  // 8. Teacher Open Time Slots (Booking Calendar)
  console.log('📅 Seeding 30+ open teacher availability slots...');
  const slotDays = [0, 1, 2, 3, 4, 5, 6, 7]; // today through next 7 days
  const timeStrings = ['09:00', '10:00', '11:30', '14:00', '16:00', '17:30', '19:00', '20:30'];

  let slotIndex = 0;
  for (const t of teachers) {
    for (const d of slotDays) {
      const slotDate = new Date();
      slotDate.setDate(slotDate.getDate() + d);

      const time1 = timeStrings[slotIndex % timeStrings.length];
      slotIndex++;

      await prisma.timeSlot.create({
        data: {
          teacherId: t.teacherProfile!.id,
          date: slotDate,
          startTime: time1,
          isAvailable: true,
          isBooked: false,
        },
      });
    }
  }

  // 9. Realistic Lessons (14 Completed, 5 Scheduled, 1 Cancelled)
  console.log('🎓 Seeding realistic lessons (Completed with recordings, Scheduled, and Cancelled)...');
  const pastLessons = [];

  // Completed Lessons
  const completedLessonDetails = [
    { sIdx: 0, tIdx: 0, dur: 25, daysAgo: 5, notes: 'Great progress on Alef-Bet vowel signs (Kamatz & Patach) and letter Bet.', stId: st25.id },
    { sIdx: 0, tIdx: 0, dur: 25, daysAgo: 2, notes: 'Conversational greetings: Shalom, Ma Nishma, Boker Tov, and basic replies.', stId: st25.id },
    { sIdx: 1, tIdx: 1, dur: 40, daysAgo: 6, notes: 'Paal present tense verb conjugation (Kotev, Medaber, Oved). Excellent retention.', stId: st40.id },
    { sIdx: 1, tIdx: 1, dur: 25, daysAgo: 3, notes: 'Practice dialogue at an Israeli cafe: Ordering coffee, bakery goods, and asking for bill.', stId: st25.id },
    { sIdx: 2, tIdx: 2, dur: 25, daysAgo: 7, notes: 'Hi-tech job interview simulation. Discussed career backgrounds and project management.', stId: st25.id },
    { sIdx: 2, tIdx: 2, dur: 40, daysAgo: 4, notes: 'Email writing in corporate Hebrew, formal salutations, and scheduling meetings.', stId: st40.id },
    { sIdx: 3, tIdx: 0, dur: 25, daysAgo: 5, notes: 'Alphabet letters Shin, Tav, Mem, and Lamed with word matching games.', stId: st25.id },
    { sIdx: 4, tIdx: 2, dur: 55, daysAgo: 8, notes: 'In-depth analysis of Israeli economic articles and tech startup vocabulary.', stId: st55.id },
    { sIdx: 4, tIdx: 1, dur: 25, daysAgo: 3, notes: 'Binyan Piel past tense drill and sentence construction with regular verbs.', stId: st25.id },
    { sIdx: 5, tIdx: 3, dur: 25, daysAgo: 6, notes: 'Storytelling exercise about weekend plans and daily routines.', stId: st25.id },
    { sIdx: 6, tIdx: 4, dur: 25, daysAgo: 4, notes: 'Vocabulary expansion: Transportation, train stations, and asking directions.', stId: st25.id },
    { sIdx: 7, tIdx: 0, dur: 25, daysAgo: 2, notes: 'First session diagnostic. Mastered vowels and first 5 letters with perfect pronunciation.', stId: st25.id },
    { sIdx: 8, tIdx: 4, dur: 25, daysAgo: 5, notes: 'Discussion of Israeli music, lyrics translation, and slang expressions.', stId: st25.id },
    { sIdx: 9, tIdx: 2, dur: 40, daysAgo: 3, notes: 'Academic essay review and advanced prepositions (Al yedey, Biglal, Ekev).', stId: st40.id },
  ];

  for (const c of completedLessonDetails) {
    const lDate = new Date();
    lDate.setDate(lDate.getDate() - c.daysAgo);
    lDate.setHours(15, 30, 0, 0);

    const s = students[c.sIdx];
    const t = teachers[c.tIdx];

    const lesson = await prisma.lesson.create({
      data: {
        studentId: s.studentProfile!.id,
        teacherId: t.teacherProfile!.id,
        sessionTypeId: c.stId,
        studentPackageId: s.studentPkg.id,
        durationMinutes: c.dur,
        scheduledAt: lDate,
        status: LessonStatus.COMPLETED,
        attendanceStatus: AttendanceStatus.ATTENDED,
        attendanceMarkedAt: lDate,
        attendanceMarkedById: t.id,
        teacherNotes: c.notes,
        zoomLink: 'https://zoom.us/j/98234710293',
        recordingUrl: 'https://drive.google.com/file/d/1demo-hebrew-session-recording-2026/view',
      },
    });

    pastLessons.push({ lesson, s, t });
  }

  // Scheduled Upcoming Lessons (Next 1-4 days)
  const upcomingLessonDetails = [
    { sIdx: 0, tIdx: 0, dur: 25, inDays: 1, hour: 11, min: 0, stId: st25.id },
    { sIdx: 1, tIdx: 1, dur: 25, inDays: 1, hour: 16, min: 30, stId: st25.id },
    { sIdx: 2, tIdx: 2, dur: 40, inDays: 2, hour: 14, min: 0, stId: st40.id },
    { sIdx: 3, tIdx: 3, dur: 25, inDays: 2, hour: 18, min: 0, stId: st25.id },
    { sIdx: 4, tIdx: 2, dur: 25, inDays: 3, hour: 10, min: 30, stId: st25.id },
  ];

  for (const u of upcomingLessonDetails) {
    const uDate = new Date();
    uDate.setDate(uDate.getDate() + u.inDays);
    uDate.setHours(u.hour, u.min, 0, 0);

    const s = students[u.sIdx];
    const t = teachers[u.tIdx];

    await prisma.lesson.create({
      data: {
        studentId: s.studentProfile!.id,
        teacherId: t.teacherProfile!.id,
        sessionTypeId: u.stId,
        studentPackageId: s.studentPkg.id,
        durationMinutes: u.dur,
        scheduledAt: uDate,
        status: LessonStatus.SCHEDULED,
        zoomLink: `https://zoom.us/j/98234710${u.sIdx}${u.tIdx}`,
      },
    });
  }

  // Cancelled Lesson (with balance restored)
  const cancDate = new Date();
  cancDate.setDate(cancDate.getDate() - 1);
  await prisma.lesson.create({
    data: {
      studentId: students[0].studentProfile!.id,
      teacherId: teachers[0].teacherProfile!.id,
      sessionTypeId: st25.id,
      durationMinutes: 25,
      scheduledAt: cancDate,
      status: LessonStatus.CANCELLED,
      cancelledAt: cancDate,
      cancelledById: students[0].id,
      cancelReason: 'Student had an unexpected business conflict. Session balance automatically returned.',
    },
  });

  // 10. Student Lesson Feedback & Teacher Surveys
  console.log('⭐ Seeding verified student feedback & teacher surveys...');
  const feedbackData = [
    { rating: 5, diff: 3, pace: 3, comments: 'Mona is wonderful! Her pronunciation tips and warm approach made me feel so confident from day one.' },
    { rating: 5, diff: 4, pace: 3, comments: 'Extremely clear explanation of Paal verb forms. Karim is a master of grammar.' },
    { rating: 5, diff: 4, pace: 4, comments: 'Super practical tech industry vocabulary. Yael knew every software term in Hebrew!' },
    { rating: 5, diff: 3, pace: 3, comments: 'Loved the cafe roleplay! Ordered my first real espresso in Hebrew today!' },
    { rating: 4, diff: 3, pace: 3, comments: 'Very good lesson, learned 15 new adjectives. Looking forward to the next session.' },
    { rating: 5, diff: 3, pace: 4, comments: 'Fast-paced, energetic, and 100% focused. Best 25 minutes of my week.' },
    { rating: 5, diff: 2, pace: 3, comments: 'Noam is so patient. I finally remembered the difference between Bet and Vet!' },
    { rating: 5, diff: 4, pace: 3, comments: 'Great article on Israeli startups. Insightful conversation and natural idioms.' },
    { rating: 4, diff: 4, pace: 3, comments: 'Challenging verb drills but very helpful. Homework helped lock in the concepts.' },
    { rating: 5, diff: 3, pace: 3, comments: 'Maya introduced me to classic Israeli songs. Amazing way to absorb natural phrasing.' },
  ];

  for (let i = 0; i < Math.min(feedbackData.length, pastLessons.length); i++) {
    const pl = pastLessons[i];
    const fd = feedbackData[i];

    await prisma.lessonFeedback.create({
      data: {
        lessonId: pl.lesson.id,
        studentId: pl.s.studentProfile!.id,
        qualityRating: fd.rating,
        difficulty: fd.diff,
        paceRating: fd.pace,
        comments: fd.comments,
        submittedAt: pl.lesson.scheduledAt,
      },
    });
  }

  // Teacher Surveys
  for (let i = 0; i < 5; i++) {
    const s = students[i];
    const t = teachers[i % teachers.length];
    await prisma.teacherSurvey.create({
      data: {
        studentId: s.studentProfile!.id,
        teacherId: t.teacherProfile!.id,
        communication: 5,
        knowledge: 5,
        punctuality: 5,
        overallRating: 5,
        comments: `${t.firstName} is an exceptional Hebrew teacher. Punctual, encouraging, and highly knowledgeable!`,
        submittedAt: new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000),
      },
    });
  }

  // 11. Homework Assignments (Reviewed, Submitted, and Pending)
  console.log('📝 Seeding homework tasks across students...');
  const homeworks = [
    {
      sIdx: 0, tIdx: 0, title: 'Alef-Bet Writing Drill 1', status: HomeworkStatus.REVIEWED,
      desc: 'Write letters Alef to Vav 5 times each and record a voice clip reading them aloud.',
      grade: '98%', feedback: 'Outstanding handwriting and spot-on pronunciation on the guttural Alef!'
    },
    {
      sIdx: 1, tIdx: 1, title: 'Present Tense Verb Conjugation', status: HomeworkStatus.REVIEWED,
      desc: 'Conjugate verbs K-T-V (write) and L-M-D (learn) in masculine, feminine, singular, and plural.',
      grade: '95%', feedback: 'Perfect singular and plural forms! Notice the vowel shift in lomdot.'
    },
    {
      sIdx: 2, tIdx: 2, title: 'Draft Tech Intro & Elevator Pitch', status: HomeworkStatus.SUBMITTED,
      desc: 'Write a 6-sentence summary of your software background in Hebrew using present and past tense.',
      grade: null, feedback: null
    },
    {
      sIdx: 3, tIdx: 0, title: 'Greetings & Introduction Dialogue', status: HomeworkStatus.SUBMITTED,
      desc: 'Fill in missing conversational words in dialogue between Dan and Rina at Dizengoff cafe.',
      grade: null, feedback: null
    },
    {
      sIdx: 4, tIdx: 2, title: 'Summary of High-Tech News Article', status: HomeworkStatus.REVIEWED,
      desc: 'Read the Calcalist article provided in class and summarize 3 main challenges facing Israeli startups.',
      grade: '92%', feedback: 'Great use of connecting words (lamrot, be-nosaf). Excellent work.'
    },
    {
      sIdx: 5, tIdx: 3, title: 'Daily Routine Story (10 Sentences)', status: HomeworkStatus.PENDING,
      desc: 'Describe what you do on Sunday mornings from waking up until starting work.',
      grade: null, feedback: null
    },
    {
      sIdx: 6, tIdx: 4, title: 'Ordering Food & Market Dialogue', status: HomeworkStatus.PENDING,
      desc: 'Translate 8 English phrases you would say at Carmel Market into authentic colloquial Hebrew.',
      grade: null, feedback: null
    },
  ];

  for (const hw of homeworks) {
    await prisma.homework.create({
      data: {
        studentId: students[hw.sIdx].studentProfile!.id,
        teacherId: teachers[hw.tIdx].teacherProfile!.id,
        title: hw.title,
        description: hw.desc,
        status: hw.status,
        teacherFeedback: hw.feedback,
        studentNote: hw.status !== HomeworkStatus.PENDING ? 'Completed and uploaded exercises for review.' : null,
        dueDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // 12. Level Progression Exams
  console.log('🏅 Seeding Level Progression Exams...');
  await prisma.levelExam.create({
    data: {
      levelId: levelAlef.id,
      title: 'Level Alef (Beginner) Graduation Assessment',
      titleHe: 'מבחן סיום רמה א׳ (מתחילים)',
      description: 'Comprehensive test covering reading fluency, basic greetings, and introduction phrases.',
      passingScore: 70,
      questions: [
        {
          id: 'q1', type: 'MCQ',
          questionEn: 'Which letter produces the "Sh" sound in "Shalom"?',
          questionHe: 'איזו אות מייצרת את הצליל "שׁ"?',
          options: ['ס (Samekh)', 'ש (Shin)', 'צ (Tsadi)', 'ת (Tav)'],
          correctAnswer: 'ש (Shin)', points: 25,
        },
        {
          id: 'q2', type: 'MCQ',
          questionEn: 'What is the correct translation of "Boker Tov"?',
          questionHe: 'מה התרגום של "בוקר טוב"?',
          options: ['Good evening', 'Good morning', 'Have a nice day', 'Welcome'],
          correctAnswer: 'Good morning', points: 25,
        },
        {
          id: 'q3', type: 'TRUE_FALSE',
          questionEn: 'In Hebrew, text is written and read from right to left.',
          questionHe: 'בעברית קוראים וכותבים מימין לשמאל.',
          options: ['True', 'False'],
          correctAnswer: 'True', points: 25,
        },
        {
          id: 'q4', type: 'MCQ',
          questionEn: 'What does "תודה רבה" (Toda Raba) mean?',
          questionHe: 'מה המשמעות של "תודה רבה"?',
          options: ['Please', 'Excuse me', 'Thank you very much', 'You are welcome'],
          correctAnswer: 'Thank you very much', points: 25,
        },
      ],
    },
  });

  await prisma.levelExam.create({
    data: {
      levelId: levelBet.id,
      title: 'Level Bet (Elementary) Grammar & Dialogue Exam',
      titleHe: 'מבחן סיום רמה ב׳ (יסודי)',
      description: 'Testing present tense verb conjugations, everyday dialogues, and essential vocabulary.',
      passingScore: 75,
      questions: [
        {
          id: 'b1', type: 'MCQ',
          questionEn: 'How do you say "I (female) speak Hebrew" in present tense?',
          questionHe: 'איך אומרים "אני מדברת עברית"?',
          options: ['אני מדבר עברית', 'אני מדברת עברית', 'אני דיברתי עברית', 'אני מדברים עברית'],
          correctAnswer: 'אני מדברת עברית', points: 25,
        },
        {
          id: 'b2', type: 'MCQ',
          questionEn: 'What is the root (Shoresh) of the verb "לִכְתּוֹב" (to write)?',
          questionHe: 'מה השורש של הפועל "לכתוב"?',
          options: ['כ-ת-ב', 'מ-כ-ת', 'ס-פ-ר', 'ק-ר-א'],
          correctAnswer: 'כ-ת-ב', points: 25,
        },
        {
          id: 'b3', type: 'MCQ',
          questionEn: 'Translate: "Where is the train station?"',
          questionHe: 'איך מתרגמים: "איפה תחנת הרכבת?"?',
          options: ['איפה תחנת הרכבת?', 'מתי הרכבת מגיעה?', 'כמה עולה כרטיס?', 'איפה נמל התעופה?'],
          correctAnswer: 'איפה תחנת הרכבת?', points: 25,
        },
        {
          id: 'b4', type: 'TRUE_FALSE',
          questionEn: 'In Hebrew present tense, verbs decline by grammatical gender and number.',
          questionHe: 'בהווה הפועל בעברית משתנה לפי מין ומספר.',
          options: ['True', 'False'],
          correctAnswer: 'True', points: 25,
        },
      ],
    },
  });

  // 13. Interactive Vocabulary Games
  console.log('🎮 Seeding interactive vocabulary games...');
  await prisma.game.create({
    data: {
      title: 'Alef-Bet Mastery Flashcards',
      titleHe: 'כרטיסיות שליטה באלף-בית',
      description: 'Master all 22 letters and final letters (Sofiot) with visual mnemonics and audio.',
      gameType: GameType.FLASHCARD,
      levelId: levelAlef.id,
      difficulty: 'EASY',
      pointsReward: 15,
      configJson: {
        cards: [
          { front: 'א', back: 'Alef (Silent)', example: 'אבא (Abba - Dad)' },
          { front: 'ב / בּ', back: 'Bet / Vet (B or V)', example: 'בית (Bayit - House)' },
          { front: 'ג', back: 'Gimel (G)', example: 'גמל (Gamal - Camel)' },
          { front: 'ד', back: 'Dalet (D)', example: 'דלת (Delet - Door)' },
          { front: 'ש / שׁ', back: 'Shin / Sin (Sh or S)', example: 'שלום (Shalom - Peace)' },
        ],
      },
    },
  });

  await prisma.game.create({
    data: {
      title: 'Tel Aviv Cafe Speed Round',
      titleHe: 'סיבוב מהיר: בית קפה תל אביבי',
      description: 'Quick fire 60-second quiz to test food, drinks, and restaurant vocabulary.',
      gameType: GameType.SPEED_ROUND,
      levelId: levelBet.id,
      difficulty: 'MEDIUM',
      pointsReward: 25,
      configJson: {
        timeLimitSeconds: 60,
        questions: [
          { q: 'Kafe Hafuch', a: 'Cappuccino / Latte' },
          { q: 'Mayim Kar', a: 'Cold Water' },
          { q: 'Cheshbon Bevakasha', a: 'Check please' },
          { q: 'Ugiyya', a: 'Cookie' },
          { q: 'Lekhem', a: 'Bread' },
        ],
      },
    },
  });

  // 14. Demo Review Link
  console.log('🔗 Generating verified demo review link...');
  await prisma.reviewLink.create({
    data: {
      token: 'engrew-review-vip-2026',
      createdById: adminUser.id,
      targetUrl: 'https://engrew.com/reviews',
      label: 'VIP Student Review Link - Daniel Miller',
      isUsed: false,
    },
  });

  // 15. Audit Logs
  console.log('🔒 Seeding audit trails...');
  await prisma.auditLog.createMany({
    data: [
      { userId: adminUser.id, action: 'PLATFORM_INITIALIZED', entityType: 'System', metaJson: { details: 'Full 2026 platform dataset provisioned.' } },
      { userId: salesUser.id, action: 'PACKAGE_ASSIGNED', entityType: 'Package', metaJson: { details: 'Executive Immersion Pack assigned to Daniel Miller ($480).' } },
      { userId: adminUser.id, action: 'PAYMENT_VERIFIED', entityType: 'Payment', metaJson: { details: 'Approved payment proof for Mustfa Maher ($260).' } },
    ],
  });

  console.log('🎉 Full dataset seeded successfully!');
  console.log('====================================================');
  console.log('Platform Telemetry Summary:');
  console.log('  👨‍💼 Staff:       3 (Super Admin, Sales, CS)');
  console.log('  👩‍🏫 Teachers:    5 (Mona, Karim, Yael, Noam, Maya)');
  console.log('  🎓 Students:    10 (Omar, Moustafa, Daniel, Sophia, Liam, etc.)');
  console.log('  📦 Packages:    4 (Starter, Intensive, Executive, Express)');
  console.log('  🎓 Lessons:     20 (14 Completed, 5 Scheduled, 1 Cancelled)');
  console.log('  ⭐ Feedback:    10 Lesson Feedbacks, 5 Teacher Surveys');
  console.log('  📝 Homework:    7 Tasks (Reviewed, Submitted, Pending)');
  console.log('  📅 Slots:       30+ Open Time Slots across all Teachers');
  console.log('====================================================');
  console.log('Sign-in Credentials for Testing:');
  console.log('  👑 Super Admin: admin@learnhebrew.com       / Admin@2026!');
  console.log('  💼 Sales Rep:   sales@learnhebrew.com       / Password123!');
  console.log('  🎧 CS Agent:    cs@learnhebrew.com          / Password123!');
  console.log('  👩‍🏫 Teacher:     mona.khalil@learnhebrew.com / Password123!');
  console.log('  🎓 Student:     mustfa.maheer@gmail.com     / Password123!');
  console.log('  🎓 Student:     omar.farouk@gmail.com       / Password123!');
  console.log('====================================================');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
