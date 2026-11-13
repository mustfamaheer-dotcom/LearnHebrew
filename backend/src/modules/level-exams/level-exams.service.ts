import { prisma } from '../../config/database';
import { ExamStatus, Prisma } from '@prisma/client';

export async function listExams() {
  return prisma.levelExam.findMany({
    include: {
      level: true,
      _count: { select: { studentAttempts: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createExam(data: {
  levelId: string;
  title: string;
  titleHe: string;
  description?: string;
  passingScore?: number;
  questions: any[];
}) {
  return prisma.levelExam.create({
    data: {
      levelId: data.levelId,
      title: data.title,
      titleHe: data.titleHe,
      description: data.description,
      passingScore: data.passingScore || 70,
      questions: data.questions,
    },
    include: { level: true },
  });
}

/**
 * Teacher or Admin unlocks an exam attempt for a student.
 * Enforces ONE attempt rule unless admin explicitly resets it.
 */
export async function openExamForStudent(examId: string, studentId: string, openedById: string) {
  const student = await prisma.student.findFirst({
    where: { OR: [{ id: studentId }, { userId: studentId }] },
    include: { user: true },
  });
  if (!student) throw { status: 404, message: 'Student profile not found' };

  const exam = await prisma.levelExam.findUnique({
    where: { id: examId },
    include: { level: true },
  });
  if (!exam) throw { status: 404, message: 'Exam not found' };

  const existingAttempt = await prisma.studentLevelExam.findUnique({
    where: {
      studentId_examId: {
        studentId: student.id,
        examId: exam.id,
      },
    },
  });

  if (existingAttempt) {
    if (existingAttempt.status === 'SUBMITTED' || existingAttempt.status === 'GRADED') {
      throw {
        status: 400,
        message: 'Student has already attempted this exam. Only an administrator can authorize a retake reset.',
      };
    }
    return existingAttempt;
  }

  const attempt = await prisma.studentLevelExam.create({
    data: {
      studentId: student.id,
      examId: exam.id,
      openedById,
      status: ExamStatus.PENDING,
    },
    include: { exam: { include: { level: true } } },
  });

  // Notify student
  await prisma.notification.create({
    data: {
      userId: student.userId,
      type: 'LEVEL_EXAM_OPENED',
      title: `Level Exam Opened: ${exam.title}`,
      titleEn: `Level Exam Opened: ${exam.title}`,
      titleHe: `נפתח מבחן רמה: ${exam.titleHe}`,
      body: 'Your teacher has opened your level advancement exam. You have one attempt to complete it!',
      bodyEn: 'Your teacher has opened your level advancement exam. You have one attempt to complete it!',
      bodyHe: 'המורה פתח עבורך את מבחן הרמה. יש לך ניסיון אחד בלבד להשלמתו!',
    },
  });

  return attempt;
}

export async function getStudentExams(studentUserId: string) {
  const student = await prisma.student.findUnique({ where: { userId: studentUserId } });
  if (!student) return [];

  return prisma.studentLevelExam.findMany({
    where: { studentId: student.id },
    include: {
      exam: {
        include: { level: true },
      },
    },
    orderBy: { openedAt: 'desc' },
  });
}

export async function submitExamAttempt(attemptId: string, studentUserId: string, answers: any) {
  const student = await prisma.student.findUnique({ where: { userId: studentUserId } });
  if (!student) throw { status: 404, message: 'Student not found' };

  const attempt = await prisma.studentLevelExam.findUnique({
    where: { id: attemptId },
    include: { exam: { include: { level: true } } },
  });

  if (!attempt || attempt.studentId !== student.id) {
    throw { status: 404, message: 'Exam attempt not found' };
  }

  if (attempt.status === 'SUBMITTED' || attempt.status === 'GRADED') {
    throw { status: 400, message: 'This exam has already been submitted and completed.' };
  }

  // Automatic Grading logic
  const questions = attempt.exam.questions as any[];
  let totalEarned = 0;
  let totalPossible = 0;

  for (const q of questions) {
    const qPoints = q.points || 10;
    totalPossible += qPoints;
    const studentAns = answers[q.id];

    if (q.correctAnswer !== undefined) {
      if (typeof q.correctAnswer === 'string' && typeof studentAns === 'string') {
        if (q.correctAnswer.trim().toLowerCase() === studentAns.trim().toLowerCase()) {
          totalEarned += qPoints;
        }
      } else if (Array.isArray(q.correctAnswer) && Array.isArray(studentAns)) {
        if (JSON.stringify(q.correctAnswer.sort()) === JSON.stringify(studentAns.sort())) {
          totalEarned += qPoints;
        }
      }
    }
  }

  const finalScore = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;
  const passed = finalScore >= attempt.exam.passingScore;

  // Determine next level if passed
  let nextLevel = null;
  if (passed) {
    nextLevel = await prisma.level.findFirst({
      where: { sortOrder: { gt: attempt.exam.level.sortOrder }, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  return prisma.$transaction(async (tx) => {
    const updatedAttempt = await tx.studentLevelExam.update({
      where: { id: attemptId },
      data: {
        answers,
        score: finalScore,
        passed,
        newLevelId: nextLevel?.id || null,
        submittedAt: new Date(),
        status: ExamStatus.GRADED,
      },
    });

    if (passed && nextLevel) {
      await tx.student.update({
        where: { id: student.id },
        data: {
          levelId: nextLevel.id,
          totalPoints: { increment: 100 },
        },
      });

      await tx.notification.create({
        data: {
          userId: studentUserId,
          type: 'LEVEL_PROMOTED',
          title: `Congratulations! Advanced to ${nextLevel.labelEn} 🎉`,
          titleEn: `Congratulations! Advanced to ${nextLevel.labelEn} 🎉`,
          titleHe: `מזל טוב! עלית ל-${nextLevel.labelHe} 🎉`,
          body: `You passed your exam with a score of ${finalScore}% and advanced to the next level!`,
          bodyEn: `You passed your exam with a score of ${finalScore}% and advanced to the next level!`,
          bodyHe: `עברת את המבחן בציון ${finalScore}% והתקדמת לרמה הבאה בהצלחה!`,
        },
      });
    }

    return updatedAttempt;
  });
}

/**
 * Admin override to reset student attempt
 */
export async function adminResetExam(attemptId: string) {
  return prisma.studentLevelExam.update({
    where: { id: attemptId },
    data: {
      status: ExamStatus.PENDING,
      score: null,
      passed: null,
      submittedAt: null,
      answers: Prisma.JsonNull,
      adminResetCount: { increment: 1 },
    },
  });
}
