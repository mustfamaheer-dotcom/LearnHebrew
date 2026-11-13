import { PrismaClient, Role, HebrewLevel, GameType, SlotType, LessonStatus, HomeworkStatus, PointsEventType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import process from 'process';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding LearnHebrew database with 2026 enterprise features...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.pointsLedger.deleteMany();
  await prisma.studentGameSession.deleteMany();
  await prisma.studentGameUnlock.deleteMany();
  await prisma.game.deleteMany();
  await prisma.studentLevelExam.deleteMany();
  await prisma.levelExam.deleteMany();
  await prisma.teacherSurvey.deleteMany();
  await prisma.lessonFeedback.deleteMany();
  await prisma.homework.deleteMany();
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

  // 1. Seed Languages
  console.log('Seeding platform languages...');
  const langEn = await prisma.language.create({
    data: { code: 'en', labelEn: 'English', labelNative: 'English', flagEmoji: '🇺🇸' },
  });
  const langHe = await prisma.language.create({
    data: { code: 'he', labelEn: 'Hebrew', labelNative: 'עברית', flagEmoji: '🇮🇱' },
  });
  const langAr = await prisma.language.create({
    data: { code: 'ar', labelEn: 'Arabic', labelNative: 'العربية', flagEmoji: '🇪🇬' },
  });
  const langFr = await prisma.language.create({
    data: { code: 'fr', labelEn: 'French', labelNative: 'Français', flagEmoji: '🇫🇷' },
  });
  const langRu = await prisma.language.create({
    data: { code: 'ru', labelEn: 'Russian', labelNative: 'Русский', flagEmoji: '🇷🇺' },
  });

  // 2. Seed Dynamic Levels
  console.log('Seeding dynamic levels...');
  const level1 = await prisma.level.create({
    data: {
      code: 'BEGINNER',
      labelEn: 'Beginner (Alef)',
      labelHe: 'רמה א׳ - מתחילים',
      sortOrder: 1,
      color: '#3B82F6',
      description: 'Foundations of reading Alef-Bet, basic vocabulary & greetings',
    },
  });
  const level2 = await prisma.level.create({
    data: {
      code: 'ELEMENTARY',
      labelEn: 'Elementary (Bet)',
      labelHe: 'רמה ב׳ - יסודי',
      sortOrder: 2,
      color: '#10B981',
      description: 'Basic verbs, present tense, everyday shopping and travel phrasing',
    },
  });
  const level3 = await prisma.level.create({
    data: {
      code: 'INTERMEDIATE',
      labelEn: 'Intermediate (Gimel)',
      labelHe: 'רמה ג׳ - בינוני',
      sortOrder: 3,
      color: '#F59E0B',
      description: 'Past and future tenses, intermediate conversations and reading articles',
    },
  });
  const level4 = await prisma.level.create({
    data: {
      code: 'ADVANCED',
      labelEn: 'Advanced (Dalet/Hey)',
      labelHe: 'רמה ד׳/ה׳ - מתקדמים',
      sortOrder: 4,
      color: '#8B5CF6',
      description: 'Newspaper Hebrew, idioms, professional debate, and advanced grammar structures',
    },
  });

  // 3. Seed Session Types (Admin Managed: 25, 40, 55 mins)
  console.log('Seeding session types...');
  const st25 = await prisma.sessionType.create({
    data: {
      name: '25min',
      durationMinutes: 25,
      labelEn: '25 Min Express',
      labelHe: '25 דקות - מהיר וממוקד',
      sortOrder: 1,
    },
  });
  const st40 = await prisma.sessionType.create({
    data: {
      name: '40min',
      durationMinutes: 40,
      labelEn: '40 Min Standard',
      labelHe: '40 דקות - מסלול סטנדרטי',
      sortOrder: 2,
    },
  });
  const st55 = await prisma.sessionType.create({
    data: {
      name: '55min',
      durationMinutes: 55,
      labelEn: '55 Min Intensive',
      labelHe: '55 דקות - אינטנסיבי ועמוק',
      sortOrder: 3,
    },
  });

  // 4. Seed Permissions & Role Definitions
  console.log('Seeding RBAC permission registry...');
  const permissionsList = [
    { code: 'users:view', group: 'Users', description: 'View any user in system' },
    { code: 'users:create', group: 'Users', description: 'Create new users' },
    { code: 'users:edit', group: 'Users', description: 'Edit user profile and roles' },
    { code: 'users:delete', group: 'Users', description: 'Deactivate user accounts' },
    { code: 'students:view_balance', group: 'Students', description: 'View session balances' },
    { code: 'students:adjust_balance', group: 'Students', description: 'Manually adjust session balances' },
    { code: 'students:set_level', group: 'Students', description: 'Change student academic level' },
    { code: 'lessons:book', group: 'Lessons', description: 'Book private lessons' },
    { code: 'lessons:cancel', group: 'Lessons', description: 'Cancel scheduled lessons' },
    { code: 'lessons:mark_attendance', group: 'Lessons', description: 'Mark attendance (Attended/Absent)' },
    { code: 'lessons:view_all', group: 'Lessons', description: 'View all lessons in platform' },
    { code: 'packages:create', group: 'Packages', description: 'Create and edit session packages' },
    { code: 'packages:assign', group: 'Packages', description: 'Assign packages directly to students' },
    { code: 'payments:create', group: 'Payments', description: 'Submit proof of payment with screenshot' },
    { code: 'payments:approve', group: 'Payments', description: 'Approve or reject pending payments' },
    { code: 'payments:view_all', group: 'Payments', description: 'View all incoming payments' },
    { code: 'exams:create', group: 'Exams', description: 'Create level progression exams' },
    { code: 'exams:open_for_student', group: 'Exams', description: 'Unlock exam attempt for student' },
    { code: 'exams:reset_attempt', group: 'Exams', description: 'Reset student exam attempt' },
    { code: 'games:create', group: 'Games', description: 'Create custom games' },
    { code: 'games:unlock_for_student', group: 'Games', description: 'Unlock game after lesson completion' },
    { code: 'notifications:send_manual', group: 'Notifications', description: 'Send targeted push/in-app notifications' },
    { code: 'reviews:manage_links', group: 'Reviews', description: 'Generate single-use review links' },
    { code: 'roles:manage', group: 'Roles', description: 'Configure role permissions matrix' },
    { code: 'settings:manage', group: 'Settings', description: 'Configure system settings & rules' },
  ];

  const permissionRecords: Record<string, string> = {};
  for (const p of permissionsList) {
    const created = await prisma.permission.create({ data: p });
    permissionRecords[p.code] = created.id;
  }

  // Create System Role Definitions
  const superAdminRoleDef = await prisma.roleDefinition.create({
    data: { name: 'SUPER_ADMIN', labelEn: 'Super Admin', labelHe: 'מנהל ראשי', isSystem: true },
  });
  const adminRoleDef = await prisma.roleDefinition.create({
    data: { name: 'ADMIN', labelEn: 'Administrator', labelHe: 'מנהל מערכת', isSystem: true },
  });
  const salesRoleDef = await prisma.roleDefinition.create({
    data: { name: 'SALES', labelEn: 'Sales Representative', labelHe: 'נציג מכירות', isSystem: true },
  });
  const csRoleDef = await prisma.roleDefinition.create({
    data: { name: 'CS', labelEn: 'Customer Service', labelHe: 'שירות לקוחות', isSystem: true },
  });
  const teacherRoleDef = await prisma.roleDefinition.create({
    data: { name: 'TEACHER', labelEn: 'Teacher / Instructor', labelHe: 'מורה', isSystem: true },
  });
  const studentRoleDef = await prisma.roleDefinition.create({
    data: { name: 'STUDENT', labelEn: 'Student / Learner', labelHe: 'תלמיד', isSystem: true },
  });

  // Attach all permissions to SUPER_ADMIN & ADMIN
  for (const permId of Object.values(permissionRecords)) {
    await prisma.rolePermission.create({
      data: { roleId: superAdminRoleDef.id, permissionId: permId, granted: true },
    });
    await prisma.rolePermission.create({
      data: { roleId: adminRoleDef.id, permissionId: permId, granted: true },
    });
  }

  // Attach SALES permissions
  const salesPermCodes = [
    'users:view', 'users:create', 'students:view_balance', 'packages:assign',
    'payments:create', 'payments:view_all', 'lessons:view_all'
  ];
  for (const code of salesPermCodes) {
    if (permissionRecords[code]) {
      await prisma.rolePermission.create({
        data: { roleId: salesRoleDef.id, permissionId: permissionRecords[code], granted: true },
      });
    }
  }

  // Attach CS permissions
  const csPermCodes = [
    'users:view', 'students:view_balance', 'lessons:view_all', 'notifications:send_manual'
  ];
  for (const code of csPermCodes) {
    if (permissionRecords[code]) {
      await prisma.rolePermission.create({
        data: { roleId: csRoleDef.id, permissionId: permissionRecords[code], granted: true },
      });
    }
  }

  // Attach TEACHER permissions
  const teacherPermCodes = [
    'lessons:mark_attendance', 'exams:open_for_student', 'games:unlock_for_student'
  ];
  for (const code of teacherPermCodes) {
    if (permissionRecords[code]) {
      await prisma.rolePermission.create({
        data: { roleId: teacherRoleDef.id, permissionId: permissionRecords[code], granted: true },
      });
    }
  }

  // Attach STUDENT permissions
  const studentPermCodes = ['lessons:book', 'lessons:cancel'];
  for (const code of studentPermCodes) {
    if (permissionRecords[code]) {
      await prisma.rolePermission.create({
        data: { roleId: studentRoleDef.id, permissionId: permissionRecords[code], granted: true },
      });
    }
  }

  // 5. Seed Point Rules
  console.log('Seeding point rules...');
  await prisma.pointRule.createMany({
    data: [
      { eventType: PointsEventType.LESSON_COMPLETED, points: 50, description: 'Points earned for completing a live 1-on-1 session' },
      { eventType: PointsEventType.GAME_PLAYED, points: 15, description: 'Points earned for playing practice games' },
      { eventType: PointsEventType.HOMEWORK_SUBMITTED, points: 25, description: 'Points earned for on-time homework submission' },
      { eventType: PointsEventType.STREAK_BONUS, points: 30, description: 'Points awarded for daily activity streaks' },
      { eventType: PointsEventType.MANUAL, points: 0, description: 'Admin manual points adjustment' },
    ],
  });

  // 6. Users & Profiles
  console.log('Seeding users and profiles...');
  const adminPassword = await bcrypt.hash('Admin@2026!', 10);
  const teacherPassword = await bcrypt.hash('Teacher@2026!', 10);
  const studentPassword = await bcrypt.hash('Student@2026!', 10);

  // Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@learnhebrew.com',
      passwordHash: adminPassword,
      firstName: 'Mostafa',
      lastName: 'Gamal',
      role: Role.SUPER_ADMIN,
      roleDefinitionId: superAdminRoleDef.id,
      languagePref: 'en',
      nativeLanguageId: langAr.id,
      learningLanguageId: langHe.id,
      mustChangePw: false,
      isActive: true,
      notificationPreference: {
        create: {
          reminder24hEnabled: true,
          reminder1hEnabled: true,
        },
      },
    },
  });

  // Sales
  const salesUser = await prisma.user.create({
    data: {
      email: 'sales@learnhebrew.com',
      passwordHash: adminPassword,
      firstName: 'Rami',
      lastName: 'Saleh',
      role: Role.SALES,
      roleDefinitionId: salesRoleDef.id,
      languagePref: 'en',
      nativeLanguageId: langEn.id,
      learningLanguageId: langHe.id,
      mustChangePw: false,
      isActive: true,
      createdById: adminUser.id,
    },
  });

  // CS
  const csUser = await prisma.user.create({
    data: {
      email: 'cs@learnhebrew.com',
      passwordHash: adminPassword,
      firstName: 'Noor',
      lastName: 'Haddad',
      role: Role.CS,
      roleDefinitionId: csRoleDef.id,
      languagePref: 'he',
      nativeLanguageId: langAr.id,
      learningLanguageId: langHe.id,
      mustChangePw: false,
      isActive: true,
      createdById: adminUser.id,
    },
  });

  // Teachers
  const teacherUser1 = await prisma.user.create({
    data: {
      email: 'mona.khalil@learnhebrew.com',
      passwordHash: teacherPassword,
      firstName: 'Mona',
      lastName: 'Khalil',
      role: Role.TEACHER,
      roleDefinitionId: teacherRoleDef.id,
      languagePref: 'he',
      nativeLanguageId: langHe.id,
      learningLanguageId: langEn.id,
      mustChangePw: false,
      isActive: true,
      createdById: adminUser.id,
      teacherProfile: {
        create: {
          bio: 'Certified Hebrew linguist with 8+ years teaching experience. Conversational fluency & grammar specialist.',
          specialties: ['Conversational Hebrew', 'Modern Idioms', 'Grammar Mastery'],
          ratingAvg: 4.95,
          ratingCount: 28,
        },
      },
    },
    include: { teacherProfile: true },
  });

  const teacherUser2 = await prisma.user.create({
    data: {
      email: 'karim.mahmoud@learnhebrew.com',
      passwordHash: teacherPassword,
      firstName: 'Karim',
      lastName: 'Mahmoud',
      role: Role.TEACHER,
      roleDefinitionId: teacherRoleDef.id,
      languagePref: 'en',
      nativeLanguageId: langHe.id,
      learningLanguageId: langEn.id,
      mustChangePw: false,
      isActive: true,
      createdById: adminUser.id,
      teacherProfile: {
        create: {
          bio: 'Passionate educator focusing on beginners, pronunciation, and reading comprehension.',
          specialties: ['Beginner Reading', 'Pronunciation', 'Biblical & Classical Hebrew'],
          ratingAvg: 4.88,
          ratingCount: 19,
        },
      },
    },
    include: { teacherProfile: true },
  });

  // Students
  const studentUser1 = await prisma.user.create({
    data: {
      email: 'omar.farouk@gmail.com',
      passwordHash: studentPassword,
      firstName: 'Omar',
      lastName: 'Farouk',
      role: Role.STUDENT,
      roleDefinitionId: studentRoleDef.id,
      languagePref: 'en',
      nativeLanguageId: langAr.id,
      learningLanguageId: langHe.id,
      mustChangePw: false,
      isActive: true,
      createdById: salesUser.id,
      studentProfile: {
        create: {
          levelId: level1.id,
          level: HebrewLevel.BEGINNER,
          totalPoints: 340,
          streakDays: 6,
          notes: 'Motivated beginner student focusing on daily vocabulary.',
        },
      },
      notificationPreference: {
        create: {
          reminder24hEnabled: true,
          reminder1hEnabled: true,
        },
      },
    },
    include: { studentProfile: true },
  });

  const studentUser2 = await prisma.user.create({
    data: {
      email: 'mustfa.maheer@gmail.com',
      passwordHash: studentPassword,
      firstName: 'Moustafa',
      lastName: 'Maher',
      role: Role.STUDENT,
      roleDefinitionId: studentRoleDef.id,
      languagePref: 'en',
      nativeLanguageId: langAr.id,
      learningLanguageId: langHe.id,
      mustChangePw: false,
      isActive: true,
      createdById: salesUser.id,
      studentProfile: {
        create: {
          levelId: level2.id,
          level: HebrewLevel.ELEMENTARY,
          totalPoints: 520,
          streakDays: 12,
          notes: 'Elementary level student aiming for conversational fluency.',
        },
      },
      notificationPreference: {
        create: {
          reminder24hEnabled: true,
          reminder1hEnabled: true,
        },
      },
    },
    include: { studentProfile: true },
  });

  // 7. Seed Session Packages with Session Items (Quotas per duration)
  console.log('Seeding session packages with session type quotas...');
  const pkg1 = await prisma.package.create({
    data: {
      name: 'Starter Conversational Bundle',
      nameHe: 'חבילת שיחה למתחילים',
      description: 'Ideal starter kit with 6 express sessions (25m) and 2 standard sessions (40m).',
      descriptionHe: 'ערכת התחלה אידיאלית הכוללת 6 שיעורים מהירים ו-2 שיעורים סטנדרטיים.',
      validityDays: 30,
      totalLessons: 8,
      price: 120,
      sessionItems: {
        create: [
          { sessionTypeId: st25.id, quantity: 6 },
          { sessionTypeId: st40.id, quantity: 2 },
        ],
      },
    },
  });

  const pkg2 = await prisma.package.create({
    data: {
      name: 'Intensive Fluency Track',
      nameHe: 'מסלול שטף אינטנסיבי',
      description: 'Complete immersion pack: 10 standard sessions (40m) and 4 deep-dive sessions (55m).',
      descriptionHe: 'חבילת העמקה: 10 שיעורים סטנדרטיים ו-4 שיעורי עומק אינטנסיביים.',
      validityDays: 30,
      totalLessons: 14,
      price: 260,
      sessionItems: {
        create: [
          { sessionTypeId: st40.id, quantity: 10 },
          { sessionTypeId: st55.id, quantity: 4 },
        ],
      },
    },
  });

  // 8. Grant Student 1 active session balances
  console.log('Assigning session package and wallet balances to Omar...');
  const now = new Date();
  const expires30d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const paymentRecord = await prisma.payment.create({
    data: {
      studentId: studentUser1.studentProfile!.id,
      packageId: pkg1.id,
      createdById: salesUser.id,
      screenshotUrl: '/uploads/payments/demo-payment-proof.webp',
      screenshotOriginalName: 'bank_transfer_receipt.png',
      status: 'APPROVED',
      approvedById: adminUser.id,
      approvedAt: now,
      notes: 'Bank transfer received and verified.',
    },
  });

  await prisma.studentPackage.create({
    data: {
      studentId: studentUser1.studentProfile!.id,
      packageId: pkg1.id,
      assignedById: salesUser.id,
      paymentId: paymentRecord.id,
      lessonsTotal: 8,
      lessonsUsed: 1,
      startDate: now,
      endDate: expires30d,
      status: 'ACTIVE',
    },
  });

  // Assign session wallets
  await prisma.studentSessionBalance.create({
    data: {
      studentId: studentUser1.studentProfile!.id,
      sessionTypeId: st25.id,
      balance: 5, // 6 granted - 1 used
      expiresAt: expires30d,
    },
  });
  await prisma.studentSessionBalance.create({
    data: {
      studentId: studentUser1.studentProfile!.id,
      sessionTypeId: st40.id,
      balance: 2,
      expiresAt: expires30d,
    },
  });

  // 9. Teacher Open Time Slots (Planned for next 45 days)
  console.log('Creating open time slots for Mona (no duration locked)...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const slot1 = await prisma.timeSlot.create({
    data: {
      teacherId: teacherUser1.teacherProfile!.id,
      date: tomorrow,
      startTime: '10:00',
      isAvailable: true,
      isBooked: false,
    },
  });

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  const slot2 = await prisma.timeSlot.create({
    data: {
      teacherId: teacherUser1.teacherProfile!.id,
      date: dayAfter,
      startTime: '14:00',
      isAvailable: true,
      isBooked: false,
    },
  });

  // 10. Sample Completed Lesson with Attendance Marked
  console.log('Creating sample lesson with attendance...');
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 3);

  const pastLesson = await prisma.lesson.create({
    data: {
      studentId: studentUser1.studentProfile!.id,
      teacherId: teacherUser1.teacherProfile!.id,
      sessionTypeId: st25.id,
      durationMinutes: 25,
      scheduledAt: pastDate,
      status: LessonStatus.COMPLETED,
      attendanceStatus: 'ATTENDED',
      attendanceMarkedAt: pastDate,
      attendanceMarkedById: teacherUser1.id,
      teacherNotes: 'Excellent progress on vowel sounds and letters Bet and Vet!',
    },
  });

  // 11. Level Exam for Level 1 (Alef)
  console.log('Creating Level 1 Progression Exam...');
  const levelExam1 = await prisma.levelExam.create({
    data: {
      levelId: level1.id,
      title: 'Level Alef (Beginner) Graduation Exam',
      titleHe: 'מבחן סיום רמה א׳ (מתחילים)',
      description: 'Comprehensive test covering reading fluency, basic greetings and verbs.',
      passingScore: 70,
      questions: [
        {
          id: 'q1',
          type: 'MCQ',
          questionEn: 'Which letter produces the "Sh" sound in "Shalom"?',
          questionHe: 'איזו אות מייצרת את הצליל "שׁ"?',
          options: ['ס (Samekh)', 'ש (Shin)', 'צ (Tsadi)', 'ת (Tav)'],
          correctAnswer: 'ש (Shin)',
          points: 25,
        },
        {
          id: 'q2',
          type: 'MCQ',
          questionEn: 'What is the correct translation of "Boker Tov"?',
          questionHe: 'מה התרגום של "בוקר טוב"?',
          options: ['Good evening', 'Good morning', 'Have a nice day', 'Welcome'],
          correctAnswer: 'Good morning',
          points: 25,
        },
        {
          id: 'q3',
          type: 'TRUE_FALSE',
          questionEn: 'In Hebrew, you read from left to right.',
          questionHe: 'בעברית קוראים משמאל לימין.',
          options: ['True', 'False'],
          correctAnswer: 'False',
          points: 25,
        },
        {
          id: 'q4',
          type: 'MCQ',
          questionEn: 'What does "תודה רבה" (Toda Raba) mean?',
          questionHe: 'מה המשמעות של "תודה רבה"?',
          options: ['Please', 'Excuse me', 'Thank you very much', 'You are welcome'],
          correctAnswer: 'Thank you very much',
          points: 25,
        },
      ],
    },
  });

  // 12. Custom Games & Unlock for Post-Lesson Play
  console.log('Creating custom games...');
  const gameFlashcard = await prisma.game.create({
    data: {
      title: 'Alef-Bet Mastery Flashcards',
      titleHe: 'כרטיסיות שליטה באלף-בית',
      description: 'Master all 22 letters and final letters (Sofit) with interactive audio drills.',
      gameType: GameType.FLASHCARD,
      levelId: level1.id,
      difficulty: 'EASY',
      pointsReward: 15,
      configJson: {
        cards: [
          { front: 'א', back: 'Alef (Silent / Glottal Stop)', example: 'אבא (Abba - Dad)' },
          { front: 'ב / בּ', back: 'Vet / Bet (V or B)', example: 'בית (Bayit - House)' },
          { front: 'ג', back: 'Gimel (G)', example: 'גשר (Gesher - Bridge)' },
          { front: 'ד', back: 'Dalet (D)', example: 'דלת (Delet - Door)' },
          { front: 'ש', back: 'Shin / Sin (Sh or S)', example: 'שלום (Shalom - Peace/Hello)' },
        ],
      },
    },
  });

  const gameQuiz = await prisma.game.create({
    data: {
      title: 'Speed Round: Hebrew Numbers & Food',
      titleHe: 'סיבוב מהיר: מספרים ומאכלים',
      description: 'Quick fire quiz against the clock for high score points.',
      gameType: GameType.SPEED_ROUND,
      levelId: level1.id,
      difficulty: 'MEDIUM',
      pointsReward: 25,
      configJson: {
        timeLimitSeconds: 60,
        questions: [
          { q: 'Echad', a: '1' },
          { q: 'Shtayim', a: '2' },
          { q: 'Shalosh', a: '3' },
          { q: 'Lekhem', a: 'Bread' },
          { q: 'Mayim', a: 'Water' },
        ],
      },
    },
  });

  // Unlock Flashcards for Omar after his completed lesson!
  await prisma.studentGameUnlock.create({
    data: {
      studentId: studentUser1.studentProfile!.id,
      gameId: gameFlashcard.id,
      lessonId: pastLesson.id,
      unlockedById: teacherUser1.id,
      unlockedAt: pastDate,
      isPlayed: false,
    },
  });

  // 13. One-Time Review Link
  console.log('Generating demo one-time review link...');
  await prisma.reviewLink.create({
    data: {
      token: 'engrew-review-vip-2026',
      createdById: adminUser.id,
      targetUrl: 'https://www.trustpilot.com/review/engrew.com',
      label: 'VIP Student Review Link - Omar Farouk',
      isUsed: false,
    },
  });

  console.log('✅ Seeding completed successfully!');
  console.log('----------------------------------------------------');
  console.log('Enterprise Test Accounts:');
  console.log('  👑 Super Admin: admin@learnhebrew.com   / Admin@2026!');
  console.log('  💼 Sales Rep:   sales@learnhebrew.com   / Admin@2026!');
  console.log('  🎧 CS Agent:    cs@learnhebrew.com      / Admin@2026!');
  console.log('  👩‍🏫 Teacher:     mona.khalil@learnhebrew.com / Teacher@2026!');
  console.log('  🎓 Student 1:   omar.farouk@gmail.com   / Student@2026!');
  console.log('  🎓 Student 2:   mustfa.maheer@gmail.com / Student@2026!');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
