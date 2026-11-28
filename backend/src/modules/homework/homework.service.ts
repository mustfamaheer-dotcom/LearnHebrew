import { prisma } from '../../config/database';
import { HomeworkStatus, PointsEventType } from '@prisma/client';
import { notificationService } from '../notifications/notifications.service';
import { cacheInvalidatePrefix } from '../../lib/cache';

// ====================================================
// 1. HOMEWORK TEMPLATES (Admin Central Bank)
// ====================================================

export async function listHomeworkTemplates(filters: {
  levelCode?: string;
  targetTrack?: string;
  search?: string;
  isActive?: boolean;
}) {
  const where: any = {};

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters.levelCode && filters.levelCode !== 'ALL') {
    where.OR = [
      { levelCode: filters.levelCode },
      { levelCodes: { has: filters.levelCode } },
      { levelCode: 'ALL' },
    ];
  }

  if (filters.targetTrack && filters.targetTrack !== 'ALL') {
    where.OR = (where.OR || []).concat([
      { targetTrack: filters.targetTrack },
      { targetTrack: 'ALL' },
    ]);
  }

  if (filters.search) {
    const q = filters.search.trim();
    where.AND = [
      {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { readingPassageTitle: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { readingPassage: { contains: q, mode: 'insensitive' } },
        ],
      },
    ];
  }

  return prisma.homeworkTemplate.findMany({
    where,
    include: {
      createdBy: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      _count: {
        select: { assignments: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getHomeworkTemplateById(id: string) {
  const template = await prisma.homeworkTemplate.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      _count: {
        select: { assignments: true },
      },
    },
  });

  if (!template) {
    throw { status: 404, message: 'Homework template not found' };
  }

  return template;
}

export async function createHomeworkTemplate(data: {
  title: string;
  titleAr?: string;
  titleHe?: string;
  description?: string;
  readingPassageTitle?: string;
  readingPassage: string;
  levelCode?: string;
  levelCodes?: string[];
  targetTrack?: string;
  questions: Array<{
    id: string;
    order: number;
    type: 'TRUE_FALSE' | 'MULTIPLE_CHOICE' | 'SHORT_ANSWER';
    prompt: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
    points?: number;
  }>;
  passingPercentage?: number;
  isActive?: boolean;
  createdById: string;
}) {
  const totalPoints = (data.questions || []).reduce(
    (sum, q) => sum + (Number(q.points) || 1),
    0
  );

  const template = await prisma.homeworkTemplate.create({
    data: {
      title: data.title,
      titleAr: data.titleAr,
      titleHe: data.titleHe,
      description: data.description,
      readingPassageTitle: data.readingPassageTitle,
      readingPassage: data.readingPassage,
      levelCode: data.levelCode || 'A1',
      levelCodes: data.levelCodes || (data.levelCode ? [data.levelCode] : ['A1']),
      targetTrack: data.targetTrack || 'ALL',
      questions: data.questions || [],
      totalPoints: totalPoints || 10,
      passingPercentage: data.passingPercentage || 70,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdById: data.createdById,
    },
    include: {
      createdBy: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  await cacheInvalidatePrefix('homework:catalog');
  return template;
}

export async function updateHomeworkTemplate(
  id: string,
  data: Partial<{
    title: string;
    titleAr?: string;
    titleHe?: string;
    description?: string;
    readingPassageTitle?: string;
    readingPassage: string;
    levelCode?: string;
    levelCodes?: string[];
    targetTrack?: string;
    questions: any[];
    passingPercentage?: number;
    isActive?: boolean;
  }>
) {
  const existing = await prisma.homeworkTemplate.findUnique({ where: { id } });
  if (!existing) {
    throw { status: 404, message: 'Homework template not found' };
  }

  let totalPoints = existing.totalPoints;
  if (data.questions) {
    totalPoints = data.questions.reduce(
      (sum, q) => sum + (Number(q.points) || 1),
      0
    );
  }

  const updated = await prisma.homeworkTemplate.update({
    where: { id },
    data: {
      ...data,
      totalPoints: data.questions ? totalPoints : undefined,
    },
    include: {
      createdBy: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  await cacheInvalidatePrefix('homework:catalog');
  return updated;
}

export async function deleteHomeworkTemplate(id: string) {
  const existing = await prisma.homeworkTemplate.findUnique({ where: { id } });
  if (!existing) {
    throw { status: 404, message: 'Homework template not found' };
  }

  await prisma.homeworkTemplate.delete({ where: { id } });
  await cacheInvalidatePrefix('homework:catalog');
  return { success: true, message: 'Homework template deleted successfully' };
}

// ====================================================
// 2. TEACHER CATALOG & ASSIGNMENT
// ====================================================

export async function listHomeworkCatalog(filters: {
  levelCode?: string;
  targetTrack?: string;
  search?: string;
}) {
  const where: any = { isActive: true };

  if (filters.levelCode && filters.levelCode !== 'ALL') {
    where.OR = [
      { levelCode: filters.levelCode },
      { levelCodes: { has: filters.levelCode } },
      { levelCode: 'ALL' },
    ];
  }

  if (filters.targetTrack && filters.targetTrack !== 'ALL') {
    where.OR = (where.OR || []).concat([
      { targetTrack: filters.targetTrack },
      { targetTrack: 'ALL' },
    ]);
  }

  if (filters.search) {
    const q = filters.search.trim();
    where.AND = [
      {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { readingPassageTitle: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
    ];
  }

  const templates = await prisma.homeworkTemplate.findMany({
    where,
    select: {
      id: true,
      title: true,
      titleAr: true,
      titleHe: true,
      description: true,
      readingPassageTitle: true,
      readingPassage: true,
      levelCode: true,
      levelCodes: true,
      targetTrack: true,
      totalPoints: true,
      passingPercentage: true,
      questions: true,
      createdAt: true,
      _count: {
        select: { assignments: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return templates;
}

export async function assignHomeworkTemplate(data: {
  templateId: string;
  studentId: string;
  teacherUserId: string;
  lessonId?: string;
  dueDate?: Date;
  customNotes?: string;
}) {
  const template = await prisma.homeworkTemplate.findUnique({
    where: { id: data.templateId },
  });
  if (!template) {
    throw { status: 404, message: 'Homework template not found' };
  }

  const student = await prisma.student.findFirst({
    where: { OR: [{ id: data.studentId }, { userId: data.studentId }] },
    include: { user: true },
  });
  if (!student) {
    throw { status: 404, message: 'Student not found' };
  }

  const teacher = await prisma.teacher.findFirst({
    where: { OR: [{ id: data.teacherUserId }, { userId: data.teacherUserId }] },
    include: { user: true },
  });
  if (!teacher) {
    throw { status: 404, message: 'Teacher profile not found' };
  }

  const homework = await prisma.homework.create({
    data: {
      templateId: template.id,
      studentId: student.id,
      teacherId: teacher.id,
      lessonId: data.lessonId,
      title: template.title,
      description: data.customNotes || template.description || 'Interactive Reading Comprehension Assignment',
      maxScore: template.totalPoints,
      dueDate: data.dueDate,
      status: HomeworkStatus.PENDING,
    },
    include: {
      student: { include: { user: true } },
      teacher: { include: { user: true } },
      template: true,
    },
  });

  notificationService.notifyHomeworkAssigned(homework).catch((err) =>
    console.error('[Notification Trigger Error - notifyHomeworkAssigned]', err)
  );

  await cacheInvalidatePrefix('student:');
  await cacheInvalidatePrefix('teachers:');

  return homework;
}

// ====================================================
// 3. STUDENT SOLVE & SUBMIT INTERACTIVE HOMEWORK
// ====================================================

export async function getHomeworkForSolving(homeworkId: string, studentUserId: string) {
  const student = await prisma.student.findUnique({
    where: { userId: studentUserId },
  });
  if (!student) {
    throw { status: 404, message: 'Student profile not found' };
  }

  const hw = await prisma.homework.findUnique({
    where: { id: homeworkId },
    include: {
      template: true,
      teacher: { include: { user: true } },
      lesson: true,
    },
  });

  if (!hw || hw.studentId !== student.id) {
    throw { status: 404, message: 'Homework not found or unauthorized' };
  }

  // If interactive template exists, prepare sanitized questions (omit correctAnswer & explanation)
  let interactiveData = null;
  if (hw.template) {
    const rawQuestions = (hw.template.questions as any[]) || [];
    const isSubmitted = hw.status === HomeworkStatus.SUBMITTED || hw.status === HomeworkStatus.REVIEWED;

    const questions = rawQuestions.map((q) => ({
      id: q.id,
      order: q.order,
      type: q.type,
      prompt: q.prompt,
      options: q.options || [],
      points: q.points || 1,
      // Only include answers & explanations if student already submitted!
      correctAnswer: isSubmitted ? q.correctAnswer : undefined,
      explanation: isSubmitted ? q.explanation : undefined,
    }));

    interactiveData = {
      templateId: hw.template.id,
      title: hw.template.title,
      readingPassageTitle: hw.template.readingPassageTitle,
      readingPassage: hw.template.readingPassage,
      levelCode: hw.template.levelCode,
      targetTrack: hw.template.targetTrack,
      totalPoints: hw.template.totalPoints,
      passingPercentage: hw.template.passingPercentage,
      questions,
    };
  }

  return {
    homework: hw,
    interactiveData,
  };
}

export async function submitInteractiveHomework(
  homeworkId: string,
  studentUserId: string,
  answers: Record<string, any>
) {
  const student = await prisma.student.findUnique({
    where: { userId: studentUserId },
  });
  if (!student) {
    throw { status: 404, message: 'Student profile not found' };
  }

  const hw = await prisma.homework.findUnique({
    where: { id: homeworkId },
    include: { template: true },
  });

  if (!hw || hw.studentId !== student.id) {
    throw { status: 404, message: 'Homework not found or unauthorized' };
  }

  if (!hw.template) {
    throw { status: 400, message: 'This homework is not an interactive template assignment' };
  }

  const questions = (hw.template.questions as any[]) || [];
  let earnedPoints = 0;
  let totalPossiblePoints = 0;

  const questionBreakdown = questions.map((q) => {
    const studentAnswer = answers[q.id];
    const maxPoints = Number(q.points) || 1;
    totalPossiblePoints += maxPoints;

    let isCorrect = false;
    if (studentAnswer !== undefined && studentAnswer !== null) {
      if (q.type === 'TRUE_FALSE') {
        isCorrect = String(studentAnswer).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
      } else if (q.type === 'MULTIPLE_CHOICE') {
        isCorrect = String(studentAnswer).trim() === String(q.correctAnswer).trim();
      } else {
        isCorrect = String(studentAnswer).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
      }
    }

    const points = isCorrect ? maxPoints : 0;
    earnedPoints += points;

    return {
      id: q.id,
      prompt: q.prompt,
      studentAnswer: studentAnswer ?? null,
      correctAnswer: q.correctAnswer,
      isCorrect,
      points,
      maxPoints,
      explanation: q.explanation || null,
    };
  });

  const percentage = totalPossiblePoints > 0 ? Math.round((earnedPoints / totalPossiblePoints) * 100) : 0;

  // Execute database transaction: update homework and award +20 XP to student
  const updatedHomework = await prisma.$transaction(async (tx) => {
    const updated = await tx.homework.update({
      where: { id: hw.id },
      data: {
        status: HomeworkStatus.SUBMITTED,
        submittedAnswers: answers,
        score: earnedPoints,
        maxScore: totalPossiblePoints,
        percentage,
        submittedAt: new Date(),
        studentNote: `Auto-graded: ${earnedPoints}/${totalPossiblePoints} (${percentage}%)`,
      },
      include: {
        student: { include: { user: true } },
        teacher: { include: { user: true } },
        template: true,
      },
    });

    // Award +20 points for homework submission
    await tx.student.update({
      where: { id: student.id },
      data: { totalPoints: { increment: 20 } },
    });

    await tx.pointsLedger.create({
      data: {
        studentId: student.id,
        eventType: PointsEventType.HOMEWORK_SUBMITTED,
        points: 20,
        referenceId: hw.id,
        description: `Interactive Homework Submitted: ${hw.title} (${percentage}%)`,
      },
    });

    return updated;
  });

  notificationService.notifyHomeworkSubmitted(updatedHomework).catch((err) =>
    console.error('[Notification Trigger Error - notifyHomeworkSubmitted]', err)
  );

  await cacheInvalidatePrefix('student:');
  await cacheInvalidatePrefix('teachers:');
  await cacheInvalidatePrefix('games:leaderboard');

  return {
    homework: updatedHomework,
    score: earnedPoints,
    maxScore: totalPossiblePoints,
    percentage,
    passed: percentage >= (hw.template.passingPercentage || 70),
    questionBreakdown,
    pointsAwarded: 20,
    message: `Homework submitted successfully! Score: ${earnedPoints}/${totalPossiblePoints} (${percentage}%). +20 XP awarded!`,
  };
}

// ====================================================
// 4. LISTING & LEGACY HOMEWORK SUPPORT
// ====================================================

export async function listHomework(params: {
  studentId?: string;
  teacherId?: string;
  userRole?: string;
  userId?: string;
}) {
  const where: any = {};

  if (params.userRole === 'STUDENT' && params.userId) {
    const student = await prisma.student.findUnique({ where: { userId: params.userId } });
    if (student) where.studentId = student.id;
  } else if (params.studentId) {
    const student = await prisma.student.findFirst({
      where: { OR: [{ id: params.studentId }, { userId: params.studentId }] },
    });
    if (student) where.studentId = student.id;
  }

  if (params.userRole === 'TEACHER' && params.userId) {
    const teacher = await prisma.teacher.findUnique({ where: { userId: params.userId } });
    if (teacher) where.teacherId = teacher.id;
  } else if (params.teacherId) {
    const teacher = await prisma.teacher.findFirst({
      where: { OR: [{ id: params.teacherId }, { userId: params.teacherId }] },
    });
    if (teacher) where.teacherId = teacher.id;
  }

  return prisma.homework.findMany({
    where,
    include: {
      student: { include: { user: true } },
      teacher: { include: { user: true } },
      lesson: true,
      template: {
        select: {
          id: true,
          title: true,
          readingPassageTitle: true,
          readingPassage: true,
          levelCode: true,
          targetTrack: true,
          totalPoints: true,
          questions: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createHomework(data: {
  lessonId?: string;
  studentId: string;
  teacherId: string;
  title: string;
  description?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  dueDate?: Date;
}) {
  const student = await prisma.student.findFirst({
    where: { OR: [{ id: data.studentId }, { userId: data.studentId }] },
  });
  if (!student) throw { status: 404, message: 'Student not found' };

  const teacher = await prisma.teacher.findFirst({
    where: { OR: [{ id: data.teacherId }, { userId: data.teacherId }] },
  });
  if (!teacher) throw { status: 404, message: 'Teacher not found' };

  const homework = await prisma.homework.create({
    data: {
      lessonId: data.lessonId,
      studentId: student.id,
      teacherId: teacher.id,
      title: data.title,
      description: data.description,
      attachmentUrl: data.attachmentUrl,
      attachmentType: data.attachmentType,
      dueDate: data.dueDate,
      status: HomeworkStatus.PENDING,
    },
    include: {
      student: { include: { user: true } },
      teacher: { include: { user: true } },
      template: true,
    },
  });

  notificationService.notifyHomeworkAssigned(homework).catch((err) =>
    console.error('[Notification Trigger Error - notifyHomeworkAssigned]', err)
  );

  await cacheInvalidatePrefix('student:');
  await cacheInvalidatePrefix('teachers:');

  return homework;
}

export async function submitHomework(id: string, studentNote: string) {
  const hw = await prisma.homework.findUnique({ where: { id } });
  if (!hw) throw { status: 404, message: 'Homework not found' };

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.homework.update({
      where: { id },
      data: {
        status: HomeworkStatus.SUBMITTED,
        studentNote,
      },
      include: {
        student: { include: { user: true } },
        teacher: { include: { user: true } },
        template: true,
      },
    });

    // Award +20 points for homework submission
    await tx.student.update({
      where: { id: hw.studentId },
      data: { totalPoints: { increment: 20 } },
    });

    await tx.pointsLedger.create({
      data: {
        studentId: hw.studentId,
        eventType: PointsEventType.HOMEWORK_SUBMITTED,
        points: 20,
        referenceId: hw.id,
        description: `Submitted homework: ${hw.title}`,
      },
    });

    return res;
  });

  notificationService.notifyHomeworkSubmitted(updated).catch((err) =>
    console.error('[Notification Trigger Error - notifyHomeworkSubmitted]', err)
  );

  await cacheInvalidatePrefix('student:');
  await cacheInvalidatePrefix('teachers:');
  await cacheInvalidatePrefix('games:leaderboard');

  return updated;
}

export async function reviewHomework(id: string, teacherFeedback: string) {
  const reviewed = await prisma.homework.update({
    where: { id },
    data: {
      status: HomeworkStatus.REVIEWED,
      teacherFeedback,
    },
    include: {
      student: { include: { user: true } },
      teacher: { include: { user: true } },
      template: true,
    },
  });

  notificationService.notifyHomeworkReviewed(reviewed).catch((err) =>
    console.error('[Notification Trigger Error - notifyHomeworkReviewed]', err)
  );

  await cacheInvalidatePrefix('student:');
  await cacheInvalidatePrefix('teachers:');

  return reviewed;
}
