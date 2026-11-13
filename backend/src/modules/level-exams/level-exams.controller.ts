import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as service from './level-exams.service';

export async function listExams(req: AuthRequest, res: Response) {
  const exams = await service.listExams();
  res.json(exams);
}

export async function createExam(req: AuthRequest, res: Response) {
  const exam = await service.createExam(req.body);
  res.status(201).json(exam);
}

export async function openExam(req: AuthRequest, res: Response) {
  const attempt = await service.openExamForStudent(
    req.params.examId,
    req.params.studentId,
    req.user!.userId
  );
  res.json(attempt);
}

export async function getMyExams(req: AuthRequest, res: Response) {
  const attempts = await service.getStudentExams(req.user!.userId);
  res.json(attempts);
}

export async function submitExam(req: AuthRequest, res: Response) {
  const result = await service.submitExamAttempt(
    req.params.id,
    req.user!.userId,
    req.body.answers
  );
  res.json(result);
}

export async function adminReset(req: AuthRequest, res: Response) {
  const result = await service.adminResetExam(req.params.id);
  res.json(result);
}
