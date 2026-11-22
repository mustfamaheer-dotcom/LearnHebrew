import { prisma } from '../../config/database';
import { hashPassword } from '../../utils/password';
import { Role } from '@prisma/client';
import crypto from 'crypto';

export interface SubmitPlacementTestInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nativeLanguage: 'he' | 'ar' | 'en';
  timeSpentSeconds?: number;
  answers: Array<{
    questionId: string;
    orderNumber: number;
    selectedOption: string; // 'A', 'B', 'C', 'D', 'DONT_KNOW'
  }>;
}

/**
 * Maps correct question count to CEFR language level
 */
export function calculateCEFRLevel(score: number): 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' {
  if (score >= 30) return 'C2';
  if (score >= 24) return 'C1';
  if (score >= 18) return 'B2';
  if (score >= 12) return 'B1';
  if (score >= 6) return 'A2';
  return 'A1';
}

/**
 * Public: Get active questions for the test (without exposing correctOption)
 */
export async function getPublicPlacementQuestions() {
  const questions = await prisma.placementTestQuestion.findMany({
    where: { isActive: true },
    orderBy: { orderNumber: 'asc' },
    select: {
      id: true,
      orderNumber: true,
      questionText: true,
      optionA: true,
      optionB: true,
      optionC: true,
      optionD: true,
      level: true,
    },
  });

  return questions;
}

/**
 * Public: Check if email or phone has already taken the exam
 */
export async function checkTestEligibility(email: string, phone: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedPhone = phone.trim().replace(/\s+/g, '');

  const existing = await prisma.placementTestSubmission.findFirst({
    where: {
      OR: [
        { email: normalizedEmail },
        { phone: normalizedPhone },
      ],
      status: { not: 'RETAKE_ALLOWED' },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existing) {
    return {
      eligible: false,
      message: 'You have already taken the placement test.',
      submission: {
        id: existing.id,
        firstName: existing.firstName,
        lastName: existing.lastName,
        score: existing.score,
        totalQuestions: existing.totalQuestions,
        evaluatedLevel: existing.evaluatedLevel,
        createdAt: existing.createdAt,
      },
    };
  }

  return { eligible: true };
}

/**
 * Public: Process exam submission, evaluate answers, calculate CEFR level
 */
export async function submitPlacementTest(
  data: SubmitPlacementTestInput,
  meta?: { ipAddress?: string; userAgent?: string }
) {
  const normalizedEmail = data.email.toLowerCase().trim();
  const normalizedPhone = data.phone.trim().replace(/\s+/g, '');

  // 1. Enforce single attempt check
  const eligibility = await checkTestEligibility(normalizedEmail, normalizedPhone);
  if (!eligibility.eligible) {
    throw {
      status: 400,
      message: 'You have already completed the placement test. Each candidate can take the exam once.',
      previousSubmission: eligibility.submission,
    };
  }

  // 2. Fetch all real questions to grade
  const questions = await prisma.placementTestQuestion.findMany({
    where: { isActive: true },
    orderBy: { orderNumber: 'asc' },
  });

  const questionMap = new Map(questions.map((q) => [q.id, q]));

  let score = 0;
  let wrongCount = 0;
  let stoppedEarly = false;
  const gradedAnswers: any[] = [];

  for (const ans of data.answers) {
    const q = questionMap.get(ans.questionId) || questions.find((x) => x.orderNumber === ans.orderNumber);
    if (!q) continue;

    const isDontKnow = ans.selectedOption === 'DONT_KNOW' || ans.selectedOption === "I don't know";
    const isCorrect = !isDontKnow && ans.selectedOption.toUpperCase() === q.correctOption.toUpperCase();
    const isWrong = !isCorrect && !isDontKnow;

    if (isCorrect) {
      score += 1;
    } else if (isWrong) {
      wrongCount += 1;
    }

    gradedAnswers.push({
      questionId: q.id,
      orderNumber: q.orderNumber,
      questionText: q.questionText,
      selectedOption: ans.selectedOption,
      correctOption: q.correctOption,
      isCorrect,
      isDontKnow,
      level: q.level,
      explanation: q.explanation,
    });

    // 4 wrong answers early stop rule
    if (wrongCount >= 4) {
      stoppedEarly = true;
      break;
    }
  }

  const evaluatedLevel = calculateCEFRLevel(score);

  // 3. Persist submission
  const submission = await prisma.placementTestSubmission.create({
    data: {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      nativeLanguage: data.nativeLanguage || 'he',
      score,
      totalQuestions: 36,
      wrongCount,
      stoppedEarly,
      evaluatedLevel,
      timeSpentSeconds: data.timeSpentSeconds || null,
      answers: gradedAnswers,
      status: 'COMPLETED',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    },
  });

  return {
    submissionId: submission.id,
    firstName: submission.firstName,
    lastName: submission.lastName,
    score,
    totalQuestions: 36,
    evaluatedLevel,
    wrongCount,
    stoppedEarly,
    createdAt: submission.createdAt,
  };
}

/**
 * Admin: List all submissions with filtering & pagination
 */
export async function listSubmissions(params: {
  page?: number;
  limit?: number;
  search?: string;
  level?: string;
  status?: string;
}) {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (params.search) {
    const s = params.search.trim();
    where.OR = [
      { firstName: { contains: s, mode: 'insensitive' } },
      { lastName: { contains: s, mode: 'insensitive' } },
      { email: { contains: s, mode: 'insensitive' } },
      { phone: { contains: s, mode: 'insensitive' } },
    ];
  }

  if (params.level && params.level !== 'ALL') {
    where.evaluatedLevel = params.level;
  }

  if (params.status && params.status !== 'ALL') {
    where.status = params.status;
  }

  const [total, submissions] = await Promise.all([
    prisma.placementTestSubmission.count({ where }),
    prisma.placementTestSubmission.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    submissions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Admin: Get single submission details
 */
export async function getSubmissionById(id: string) {
  const submission = await prisma.placementTestSubmission.findUnique({
    where: { id },
  });
  if (!submission) {
    throw { status: 404, message: 'Placement test submission not found' };
  }
  return submission;
}

/**
 * Admin: Allow candidate to retake the test
 */
export async function allowCandidateRetake(id: string) {
  const submission = await prisma.placementTestSubmission.findUnique({
    where: { id },
  });
  if (!submission) {
    throw { status: 404, message: 'Submission not found' };
  }

  const updated = await prisma.placementTestSubmission.update({
    where: { id },
    data: {
      status: 'RETAKE_ALLOWED',
      notes: `Retake authorized by administrator on ${new Date().toISOString()}`,
    },
  });

  return updated;
}

/**
 * Admin: Convert placement test candidate directly to student
 */
export async function convertSubmissionToStudent(id: string) {
  const submission = await prisma.placementTestSubmission.findUnique({
    where: { id },
  });
  if (!submission) {
    throw { status: 404, message: 'Submission not found' };
  }

  if (submission.convertedToStudent && submission.convertedStudentId) {
    return {
      message: 'Candidate has already been converted to student',
      studentId: submission.convertedStudentId,
    };
  }

  // Check if User already exists with this email
  let existingUser = await prisma.user.findUnique({
    where: { email: submission.email },
    include: { studentProfile: true },
  });

  let targetUserId = existingUser?.id;

  if (!existingUser) {
    const rawPass = 'Student@2026!';
    const passwordHash = await hashPassword(rawPass);

    // Map CEFR level to existing HebrewLevel enum
    const levelMapping: Record<string, any> = {
      A1: 'BEGINNER',
      A2: 'ELEMENTARY',
      B1: 'INTERMEDIATE',
      B2: 'UPPER_INTERMEDIATE',
      C1: 'ADVANCED',
      C2: 'FLUENT',
    };
    const mappedLevel = levelMapping[submission.evaluatedLevel] || 'BEGINNER';

    // Find Level model with matching code if available
    const levelRecord = await prisma.level.findFirst({
      where: { code: submission.evaluatedLevel },
    });

    const newUser = await prisma.user.create({
      data: {
        email: submission.email,
        firstName: submission.firstName,
        lastName: submission.lastName,
        phone: submission.phone,
        passwordHash,
        role: Role.STUDENT,
        languagePref: submission.nativeLanguage === 'ar' ? 'ar' : submission.nativeLanguage === 'he' ? 'he' : 'en',
        studentProfile: {
          create: {
            level: mappedLevel,
            levelId: levelRecord?.id || null,
            totalPoints: 50, // Welcome bonus
          },
        },
      },
      include: { studentProfile: true },
    });

    targetUserId = newUser.id;
    existingUser = newUser;
  }

  // Update submission status
  await prisma.placementTestSubmission.update({
    where: { id },
    data: {
      convertedToStudent: true,
      convertedStudentId: targetUserId,
    },
  });

  return {
    success: true,
    user: {
      id: targetUserId,
      email: existingUser.email,
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      role: existingUser.role,
      level: submission.evaluatedLevel,
    },
  };
}

/**
 * Admin: Get question bank for placement test
 */
export async function getAdminPlacementQuestions() {
  return prisma.placementTestQuestion.findMany({
    orderBy: { orderNumber: 'asc' },
  });
}

/**
 * Admin: Create or update question
 */
export async function savePlacementQuestion(data: {
  id?: string;
  orderNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  level: string;
  explanation?: string;
  isActive?: boolean;
}) {
  if (data.id) {
    return prisma.placementTestQuestion.update({
      where: { id: data.id },
      data: {
        orderNumber: data.orderNumber,
        questionText: data.questionText,
        optionA: data.optionA,
        optionB: data.optionB,
        optionC: data.optionC,
        optionD: data.optionD,
        correctOption: data.correctOption.toUpperCase(),
        level: data.level,
        explanation: data.explanation,
        isActive: data.isActive ?? true,
      },
    });
  }

  return prisma.placementTestQuestion.create({
    data: {
      orderNumber: data.orderNumber,
      questionText: data.questionText,
      optionA: data.optionA,
      optionB: data.optionB,
      optionC: data.optionC,
      optionD: data.optionD,
      correctOption: data.correctOption.toUpperCase(),
      level: data.level,
      explanation: data.explanation,
      isActive: data.isActive ?? true,
    },
  });
}

/**
 * Admin: Delete question
 */
export async function deletePlacementQuestion(id: string) {
  return prisma.placementTestQuestion.delete({
    where: { id },
  });
}
