import { PrismaClient, Role, HebrewLevel, GameType, SlotType, LessonStatus, HomeworkStatus, PointsEventType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import process from 'process';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding LearnHebrew database...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.pointsLedger.deleteMany();
  await prisma.studentGameSession.deleteMany();
  await prisma.game.deleteMany();
  await prisma.teacherSurvey.deleteMany();
  await prisma.lessonFeedback.deleteMany();
  await prisma.homework.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.studentPackage.deleteMany();
  await prisma.package.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.student.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash('Admin@2026!', 10);
  const teacherPassword = await bcrypt.hash('Teacher@2026!', 10);
  const studentPassword = await bcrypt.hash('Student@2026!', 10);

  // 1. Create Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@learnhebrew.com',
      passwordHash: adminPassword,
      firstName: 'Avi',
      lastName: 'Barak',
      role: Role.SUPER_ADMIN,
      languagePref: 'en',
      mustChangePw: false,
      isActive: true,
      avatarUrl: null,
    },
  });

  // 2. Create Teachers
  const teacherUser1 = await prisma.user.create({
    data: {
      email: 'sarah.cohen@learnhebrew.com',
      passwordHash: teacherPassword,
      firstName: 'Sarah',
      lastName: 'Cohen',
      role: Role.TEACHER,
      languagePref: 'he',
      mustChangePw: false,
      isActive: true,
      createdById: adminUser.id,
      avatarUrl: null,
      teacherProfile: {
        create: {
          bio: 'Certified Hebrew linguist with 8+ years teaching experience in Tel Aviv and online. Specializes in conversational fluency and modern idioms.',
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
      email: 'david.levi@learnhebrew.com',
      passwordHash: teacherPassword,
      firstName: 'David',
      lastName: 'Levi',
      role: Role.TEACHER,
      languagePref: 'en',
      mustChangePw: false,
      isActive: true,
      createdById: adminUser.id,
      avatarUrl: null,
      teacherProfile: {
        create: {
          bio: 'Passionate educator focusing on beginners, pronunciation, and reading comprehension. Warm, patient, and highly interactive classes.',
          specialties: ['Beginner Reading', 'Pronunciation', 'Biblical & Classical Hebrew'],
          ratingAvg: 4.88,
          ratingCount: 19,
        },
      },
    },
    include: { teacherProfile: true },
  });

  // 3. Create Students
  const studentUser1 = await prisma.user.create({
    data: {
      email: 'noah.miller@gmail.com',
      passwordHash: studentPassword,
      firstName: 'Noah',
      lastName: 'Miller',
      role: Role.STUDENT,
      languagePref: 'en',
      mustChangePw: false,
      isActive: true,
      createdById: adminUser.id,
      avatarUrl: null,
      studentProfile: {
        create: {
          level: HebrewLevel.BEGINNER,
          totalPoints: 340,
          streakDays: 6,
          notes: 'Wants to travel to Israel next summer. Highly motivated with daily flashcards.',
        },
      },
    },
    include: { studentProfile: true },
  });

  const studentUser2 = await prisma.user.create({
    data: {
      email: 'emma.watson@gmail.com',
      passwordHash: studentPassword,
      firstName: 'Emma',
      lastName: 'Watson',
      role: Role.STUDENT,
      languagePref: 'he',
      mustChangePw: false,
      isActive: true,
      createdById: adminUser.id,
      avatarUrl: null,
      studentProfile: {
        create: {
          level: HebrewLevel.INTERMEDIATE,
          totalPoints: 680,
          streakDays: 14,
          notes: 'Preparing for university studies in Jerusalem. Focus on academic writing and complex grammar.',
        },
      },
    },
    include: { studentProfile: true },
  });

  const studentUser3 = await prisma.user.create({
    data: {
      email: 'liam.smith@gmail.com',
      passwordHash: studentPassword,
      firstName: 'Liam',
      lastName: 'Smith',
      role: Role.STUDENT,
      languagePref: 'en',
      mustChangePw: false,
      isActive: true,
      createdById: adminUser.id,
      avatarUrl: null,
      studentProfile: {
        create: {
          level: HebrewLevel.ELEMENTARY,
          totalPoints: 210,
          streakDays: 3,
        },
      },
    },
    include: { studentProfile: true },
  });

  // 4. Create Packages
  const pkgStarter = await prisma.package.create({
    data: {
      name: 'Starter Hebrew',
      nameHe: 'עברית למתחילים',
      description: '4 live 1-on-1 private lessons with a certified teacher. Perfect for getting started.',
      descriptionHe: '4 שיעורים פרטיים אחד-על-אחד עם מורה מוסמך. מושלם לצעדים הראשונים.',
      totalLessons: 4,
      validityDays: 30,
      price: 120.0,
      currency: 'USD',
      isActive: true,
    },
  });

  const pkgProgress = await prisma.package.create({
    data: {
      name: 'Progress Bundle',
      nameHe: 'חבילת התקדמות',
      description: '10 live 1-on-1 sessions. The ideal path to conversational confidence.',
      descriptionHe: '10 מפגשים אישיים. המסלול המושלם לרכישת ביטחון בשיחה.',
      totalLessons: 10,
      validityDays: 60,
      price: 270.0,
      currency: 'USD',
      isActive: true,
    },
  });

  const pkgFluency = await prisma.package.create({
    data: {
      name: 'Fluency Mastery',
      nameHe: 'שליטה מלאה',
      description: '20 intensive private lessons + dedicated homework reviews & progress tracking.',
      descriptionHe: '20 שיעורים אינטנסיביים כולל ליווי צמוד, בדיקת שיעורי בית ומעקב התקדמות.',
      totalLessons: 20,
      validityDays: 120,
      price: 480.0,
      currency: 'USD',
      isActive: true,
    },
  });

  // 5. Assign Packages
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const nextTwoMonths = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const sp1 = await prisma.studentPackage.create({
    data: {
      studentId: studentUser1.studentProfile!.id,
      packageId: pkgStarter.id,
      assignedById: adminUser.id,
      lessonsTotal: 4,
      lessonsUsed: 2,
      startDate: now,
      endDate: nextMonth,
      status: 'ACTIVE',
    },
  });

  const sp2 = await prisma.studentPackage.create({
    data: {
      studentId: studentUser2.studentProfile!.id,
      packageId: pkgProgress.id,
      assignedById: adminUser.id,
      lessonsTotal: 10,
      lessonsUsed: 4,
      startDate: now,
      endDate: nextTwoMonths,
      status: 'ACTIVE',
    },
  });

  // 6. Create Availability Slots for Teachers (25 min slots)
  const slotsSarah = [
    { dayOfWeek: 1, startTime: '09:00', endTime: '09:25' },
    { dayOfWeek: 1, startTime: '09:30', endTime: '09:55' },
    { dayOfWeek: 1, startTime: '10:00', endTime: '10:25' },
    { dayOfWeek: 2, startTime: '14:00', endTime: '14:25' },
    { dayOfWeek: 2, startTime: '14:30', endTime: '14:55' },
    { dayOfWeek: 3, startTime: '11:00', endTime: '11:25' },
    { dayOfWeek: 4, startTime: '16:00', endTime: '16:25' },
  ];

  for (const s of slotsSarah) {
    await prisma.timeSlot.create({
      data: {
        teacherId: teacherUser1.teacherProfile!.id,
        ...s,
        slotType: SlotType.REGULAR,
        isAvailable: true,
      },
    });
  }

  const slotsDavid = [
    { dayOfWeek: 1, startTime: '11:00', endTime: '11:25' },
    { dayOfWeek: 2, startTime: '10:00', endTime: '10:25' },
    { dayOfWeek: 2, startTime: '10:30', endTime: '10:55' },
    { dayOfWeek: 3, startTime: '13:00', endTime: '13:25' },
    { dayOfWeek: 4, startTime: '15:00', endTime: '15:25' },
  ];

  for (const s of slotsDavid) {
    await prisma.timeSlot.create({
      data: {
        teacherId: teacherUser2.teacherProfile!.id,
        ...s,
        slotType: SlotType.REGULAR,
        isAvailable: true,
      },
    });
  }

  // 7. Create Lessons (Past and Upcoming)
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  tomorrow.setHours(10, 0, 0, 0);

  const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  inThreeDays.setHours(14, 0, 0, 0);

  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  twoDaysAgo.setHours(10, 0, 0, 0);

  const pastLesson = await prisma.lesson.create({
    data: {
      studentId: studentUser1.studentProfile!.id,
      teacherId: teacherUser1.teacherProfile!.id,
      studentPackageId: sp1.id,
      scheduledAt: twoDaysAgo,
      durationMinutes: 25,
      status: LessonStatus.COMPLETED,
      lessonType: SlotType.REGULAR,
      zoomLink: 'https://zoom.us/j/1234567890',
      recordingUrl: 'https://drive.google.com/file/d/demo-hebrew-lesson-1/view',
      teacherNotes: 'Great job today! Noah mastered the vowels (Nikkud) and practiced basic greetings. Remember to review the Shin/Sin differences.',
    },
  });

  const upcomingLesson1 = await prisma.lesson.create({
    data: {
      studentId: studentUser1.studentProfile!.id,
      teacherId: teacherUser1.teacherProfile!.id,
      studentPackageId: sp1.id,
      scheduledAt: tomorrow,
      durationMinutes: 25,
      status: LessonStatus.SCHEDULED,
      lessonType: SlotType.REGULAR,
      zoomLink: 'https://zoom.us/j/1234567890',
    },
  });

  const upcomingLesson2 = await prisma.lesson.create({
    data: {
      studentId: studentUser2.studentProfile!.id,
      teacherId: teacherUser2.teacherProfile!.id,
      studentPackageId: sp2.id,
      scheduledAt: inThreeDays,
      durationMinutes: 25,
      status: LessonStatus.SCHEDULED,
      lessonType: SlotType.REGULAR,
      zoomLink: 'https://zoom.us/j/9876543210',
    },
  });

  // 8. Homework
  await prisma.homework.create({
    data: {
      lessonId: pastLesson.id,
      studentId: studentUser1.studentProfile!.id,
      teacherId: teacherUser1.teacherProfile!.id,
      title: 'Practice Alef-Bet Vowel Combinations',
      description: 'Write 10 common words with Patach and Kamatz vowels. Record an audio clip saying Shalom, Toda, and Boker Tov.',
      dueDate: tomorrow,
      status: HomeworkStatus.PENDING,
    },
  });

  await prisma.homework.create({
    data: {
      studentId: studentUser2.studentProfile!.id,
      teacherId: teacherUser2.teacherProfile!.id,
      title: 'Paal Verb Conjugation in Present Tense',
      description: 'Conjugate the verbs לכתוב, לקרוא, ללמוד for masculine, feminine, singular and plural.',
      dueDate: twoDaysAgo,
      status: HomeworkStatus.REVIEWED,
      studentNote: 'Completed! Checked the Irregularities with Gutturals.',
      teacherFeedback: 'Outstanding work, Emma! All 12 forms were 100% accurate. You are ready for the past tense next week.',
    },
  });

  // 9. Feedback on past lesson
  await prisma.lessonFeedback.create({
    data: {
      lessonId: pastLesson.id,
      studentId: studentUser1.studentProfile!.id,
      qualityRating: 5,
      difficulty: 3,
      paceRating: 3,
      comments: 'Sarah is an amazing teacher! Very clear explanations and patient with my pronunciation.',
    },
  });

  // Teacher survey
  await prisma.teacherSurvey.create({
    data: {
      studentId: studentUser1.studentProfile!.id,
      teacherId: teacherUser1.teacherProfile!.id,
      communication: 5,
      knowledge: 5,
      punctuality: 5,
      overallRating: 5,
      comments: 'Best Hebrew teacher I have ever had. The live whiteboard and notes make studying effortless.',
    },
  });

  // 10. Games
  await prisma.game.create({
    data: {
      title: 'Alef-Bet Flashcards',
      titleHe: 'כרטיסיות האלף-בית',
      description: 'Master all 22 letters of the Hebrew alphabet and their final forms (Sofit).',
      gameType: GameType.FLASHCARD,
      level: HebrewLevel.BEGINNER,
      pointsReward: 10,
      configJson: {
        cards: [
          { front: 'א', back: 'Alef (Silent/Glottal)', example: 'אבא (Abba - Dad)' },
          { front: 'ב', back: 'Bet / Vet (B or V)', example: 'בית (Bayit - Home)' },
          { front: 'ג', back: 'Gimel (G)', example: 'גמל (Gamal - Camel)' },
          { front: 'ד', back: 'Dalet (D)', example: 'דלת (Delet - Door)' },
          { front: 'ה', back: 'He (H)', example: 'הוא (Hu - He)' },
          { front: 'ו', back: 'Vav (V / O / U)', example: 'וורוד (Varod - Pink)' },
          { front: 'ז', back: 'Zayin (Z)', example: 'זברה (Zebra)' },
          { front: 'ח', back: 'Chet (Ch / Throat)', example: 'חבר (Chaver - Friend)' },
          { front: 'ט', back: 'Tet (T)', example: 'טוב (Tov - Good)' },
          { front: 'י', back: 'Yod (Y)', example: 'יום (Yom - Day)' },
          { front: 'כ / ך', back: 'Kaf / Chaf (K or Ch)', example: 'כלב (Kelev - Dog)' },
          { front: 'ל', back: 'Lamed (L)', example: 'לילה (Layla - Night)' },
          { front: 'מ / ם', back: 'Mem / Mem Sofit (M)', example: 'מים (Mayim - Water)' },
          { front: 'ש', back: 'Shin / Sin (Sh or S)', example: 'שלום (Shalom - Peace/Hello)' },
          { front: 'ת', back: 'Tav (T)', example: 'תודה (Toda - Thank you)' },
        ],
      },
    },
  });

  await prisma.game.create({
    data: {
      title: 'Essential Hebrew Vocabulary Quiz',
      titleHe: 'חידון אוצר מילים בסיסי',
      description: 'Test your vocabulary on everyday greetings, food, numbers, and family.',
      gameType: GameType.QUIZ,
      level: HebrewLevel.BEGINNER,
      pointsReward: 15,
      configJson: {
        questions: [
          {
            question: 'What is the Hebrew word for "Thank you"?',
            questionHe: 'מה הפירוש של "תודה"?',
            options: ['שלום (Shalom)', 'בבקשה (Bevakasha)', 'תודה (Toda)', 'סליחה (Slicha)'],
            correctIndex: 2,
          },
          {
            question: 'How do you say "Good morning" in Hebrew?',
            questionHe: 'איך אומרים "בוקר טוב"?',
            options: ['בוקר טוב (Boker Tov)', 'לילה טוב (Layla Tov)', 'ערב טוב (Erev Tov)', 'יום טוב (Yom Tov)'],
            correctIndex: 0,
          },
          {
            question: 'What does "מים" (Mayim) mean?',
            questionHe: 'מה המשמעות של "מים"?',
            options: ['Bread', 'Water', 'Wine', 'Apple'],
            correctIndex: 1,
          },
          {
            question: 'Which word means "House / Home"?',
            questionHe: 'איזו מילה פירושה "בית"?',
            options: ['ספר (Sefer)', 'שולחן (Shulchan)', 'בית (Bayit)', 'עיר (Ir)'],
            correctIndex: 2,
          },
        ],
      },
    },
  });

  await prisma.game.create({
    data: {
      title: 'Hebrew Word Match: Colors & Numbers',
      titleHe: 'התאמת מילים: צבעים ומספרים',
      description: 'Match the Hebrew word to its correct English meaning as fast as you can.',
      gameType: GameType.MATCHING,
      level: HebrewLevel.ELEMENTARY,
      pointsReward: 20,
      configJson: {
        pairs: [
          { hebrew: 'כחול (Kachol)', english: 'Blue' },
          { hebrew: 'אדום (Adom)', english: 'Red' },
          { hebrew: 'ירוק (Yarok)', english: 'Green' },
          { hebrew: 'אחד (Echad)', english: 'One' },
          { hebrew: 'שניים (Shnayim)', english: 'Two' },
          { hebrew: 'שלוש (Shalosh)', english: 'Three' },
        ],
      },
    },
  });

  // 11. Initial Ledger & Notifications
  await prisma.pointsLedger.create({
    data: {
      studentId: studentUser1.studentProfile!.id,
      eventType: PointsEventType.LESSON_COMPLETED,
      points: 50,
      referenceId: pastLesson.id,
      description: 'Completed lesson with Sarah Cohen',
    },
  });

  await prisma.notification.create({
    data: {
      userId: studentUser1.id,
      type: 'LESSON_REMINDER',
      title: 'Upcoming Lesson Tomorrow',
      body: 'Your Hebrew session with Sarah Cohen is tomorrow at 10:00 AM.',
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: studentUser1.id,
      type: 'HOMEWORK_ASSIGNED',
      title: 'New Homework Assigned',
      body: 'Practice Alef-Bet Vowel Combinations is due tomorrow.',
      isRead: false,
    },
  });

  console.log('Seeding completed successfully!');
  console.log('Demo Credentials:');
  console.log('  Admin:   admin@learnhebrew.com       / Admin@2026!');
  console.log('  Teacher: sarah.cohen@learnhebrew.com / Teacher@2026!');
  console.log('  Student: noah.miller@gmail.com       / Student@2026!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

