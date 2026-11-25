import { Request, Response, NextFunction } from 'express';
import * as service from './placement-test.service';
import { z } from 'zod';

const submitSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100, 'First name too long'),
  lastName: z.string().trim().min(1, 'Last name is required').max(100, 'Last name too long'),
  email: z.string().trim().email('Valid email address is required').max(150, 'Email too long'),
  phone: z.string().trim().min(6, 'Valid phone number is required').max(30, 'Phone number too long'),
  nativeLanguage: z.enum(['he', 'ar', 'en']).default('he'),
  timeSpentSeconds: z.number().min(0).max(86400).optional(),
  answers: z.array(
    z.object({
      questionId: z.string().max(100),
      orderNumber: z.number().int().min(1).max(200),
      selectedOption: z.string().max(50),
    })
  ).max(100),
});

export async function getPublicQuestions(req: Request, res: Response, next: NextFunction) {
  try {
    const questions = await service.getPublicPlacementQuestions();
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=1200');
    res.json({ questions, total: questions.length });
  } catch (err) {
    next(err);
  }
}

export async function checkEligibility(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, phone } = req.body;
    if (!email || !phone) {
      return res.status(400).json({ error: 'Email and phone number are required' });
    }
    const result = await service.checkTestEligibility(email, phone);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

const checkAnswerSchema = z.object({
  questionId: z.string().max(100).optional(),
  orderNumber: z.number().int().min(1).max(200).optional(),
  selectedOption: z.string().min(1).max(50),
});

export async function checkAnswer(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = checkAnswerSchema.parse(req.body);
    const result = await service.checkPlacementAnswer(validated);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function submitTest(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = submitSchema.parse(req.body);
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await service.submitPlacementTest(validated, {
      ipAddress: clientIp,
      userAgent,
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function listSubmissions(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.listSubmissions(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getSubmission(req: Request, res: Response, next: NextFunction) {
  try {
    const submission = await service.getSubmissionById(req.params.id);
    res.json(submission);
  } catch (err) {
    next(err);
  }
}

export async function allowRetake(req: Request, res: Response, next: NextFunction) {
  try {
    const updated = await service.allowCandidateRetake(req.params.id);
    res.json({ success: true, submission: updated });
  } catch (err) {
    next(err);
  }
}

export async function convertToStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.convertSubmissionToStudent(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getAdminQuestions(req: Request, res: Response, next: NextFunction) {
  try {
    const questions = await service.getAdminPlacementQuestions();
    res.json({ questions });
  } catch (err) {
    next(err);
  }
}

export async function saveQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const question = await service.savePlacementQuestion(req.body);
    res.json({ success: true, question });
  } catch (err) {
    next(err);
  }
}

export async function deleteQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deletePlacementQuestion(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
