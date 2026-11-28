import { Response, NextFunction } from 'express';
import { z } from 'zod';
import * as homeworkService from './homework.service';
import { AuthRequest } from '../../middleware/auth';

// Validation Schemas
const createTemplateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  titleAr: z.string().optional(),
  titleHe: z.string().optional(),
  description: z.string().optional(),
  readingPassageTitle: z.string().optional(),
  readingPassage: z.string().min(1, 'Reading passage is required'),
  levelCode: z.string().default('A1'),
  levelCodes: z.array(z.string()).optional(),
  targetTrack: z.string().default('ALL'),
  questions: z.array(
    z.object({
      id: z.string(),
      order: z.number().default(1),
      type: z.enum(['TRUE_FALSE', 'MULTIPLE_CHOICE', 'SHORT_ANSWER']),
      prompt: z.string().min(1, 'Question prompt is required'),
      options: z.array(z.string()).optional(),
      correctAnswer: z.string().min(1, 'Correct answer is required'),
      explanation: z.string().optional(),
      points: z.number().default(1),
    })
  ),
  passingPercentage: z.number().min(0).max(100).default(70),
  isActive: z.boolean().default(true),
});

const updateTemplateSchema = createTemplateSchema.partial();

const assignTemplateSchema = z.object({
  templateId: z.string().uuid(),
  studentId: z.string(),
  lessonId: z.string().optional(),
  dueDate: z.string().optional(),
  customNotes: z.string().optional(),
});

const submitInteractiveSchema = z.object({
  answers: z.record(z.any()),
});

const createHomeworkSchema = z.object({
  lessonId: z.string().optional(),
  studentId: z.string(),
  teacherId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  attachmentUrl: z.string().optional(),
  attachmentType: z.string().optional(),
  dueDate: z.string().optional(),
});

const submitHomeworkSchema = z.object({
  studentNote: z.string().min(1),
});

const reviewHomeworkSchema = z.object({
  teacherFeedback: z.string().min(1),
});

// ====================================================
// 1. ADMIN TEMPLATES CONTROLLERS
// ====================================================

export async function listTemplatesHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const levelCode = req.query.level as string | undefined;
    const targetTrack = req.query.track as string | undefined;
    const search = req.query.search as string | undefined;
    const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;

    const templates = await homeworkService.listHomeworkTemplates({
      levelCode,
      targetTrack,
      search,
      isActive,
    });
    res.json({ templates });
  } catch (error) {
    next(error);
  }
}

export async function getTemplateByIdHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const template = await homeworkService.getHomeworkTemplateById(req.params.id);
    res.json({ template });
  } catch (error) {
    next(error);
  }
}

export async function createTemplateHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createTemplateSchema.parse(req.body);
    const template = await homeworkService.createHomeworkTemplate({
      ...data,
      createdById: req.user!.userId,
    });
    res.status(201).json({ template, message: 'Homework template created successfully' });
  } catch (error) {
    next(error);
  }
}

export async function updateTemplateHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = updateTemplateSchema.parse(req.body);
    const template = await homeworkService.updateHomeworkTemplate(req.params.id, data);
    res.json({ template, message: 'Homework template updated successfully' });
  } catch (error) {
    next(error);
  }
}

export async function deleteTemplateHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await homeworkService.deleteHomeworkTemplate(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// ====================================================
// 2. TEACHER CATALOG & ASSIGNMENT CONTROLLERS
// ====================================================

export async function listCatalogHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const levelCode = req.query.level as string | undefined;
    const targetTrack = req.query.track as string | undefined;
    const search = req.query.search as string | undefined;

    const catalog = await homeworkService.listHomeworkCatalog({
      levelCode,
      targetTrack,
      search,
    });
    res.json({ catalog });
  } catch (error) {
    next(error);
  }
}

export async function assignTemplateHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = assignTemplateSchema.parse(req.body);
    const homework = await homeworkService.assignHomeworkTemplate({
      templateId: data.templateId,
      studentId: data.studentId,
      teacherUserId: req.user!.userId,
      lessonId: data.lessonId,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      customNotes: data.customNotes,
    });
    res.status(201).json({ homework, message: 'Homework assigned to student successfully' });
  } catch (error) {
    next(error);
  }
}

// ====================================================
// 3. STUDENT SOLVE & SUBMISSION CONTROLLERS
// ====================================================

export async function getHomeworkSolveHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await homeworkService.getHomeworkForSolving(req.params.id, req.user!.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function submitInteractiveHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = submitInteractiveSchema.parse(req.body);
    const result = await homeworkService.submitInteractiveHomework(
      req.params.id,
      req.user!.userId,
      data.answers
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// ====================================================
// 4. GENERAL / LEGACY HOMEWORK CONTROLLERS
// ====================================================

export async function listHomeworkHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const studentId = req.query.studentId as string | undefined;
    const teacherId = req.query.teacherId as string | undefined;
    const homework = await homeworkService.listHomework({
      studentId,
      teacherId,
      userRole: req.user?.role,
      userId: req.user?.userId,
    });
    res.json({ homework });
  } catch (error) {
    next(error);
  }
}

export async function createHomeworkHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createHomeworkSchema.parse(req.body);
    const homework = await homeworkService.createHomework({
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    });
    res.status(201).json({ homework });
  } catch (error) {
    next(error);
  }
}

export async function submitHomeworkHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = submitHomeworkSchema.parse(req.body);
    const homework = await homeworkService.submitHomework(req.params.id, data.studentNote);
    res.json({ homework, message: 'Homework submitted (+20 points awarded!)' });
  } catch (error) {
    next(error);
  }
}

export async function reviewHomeworkHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = reviewHomeworkSchema.parse(req.body);
    const homework = await homeworkService.reviewHomework(req.params.id, data.teacherFeedback);
    res.json({ homework, message: 'Homework reviewed successfully' });
  } catch (error) {
    next(error);
  }
}
