import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as service from './payments.service';
import { processAndSaveWebP } from '../../utils/imageProcessor';

export async function listPayments(req: AuthRequest, res: Response) {
  const role = req.user?.role;
  const userId = req.user?.userId;

  let filters: any = {};
  if (role === 'SALES') {
    // Sales sees their created payments
    filters.createdById = userId;
  }
  if (req.query.status) {
    filters.status = req.query.status as any;
  }
  if (req.query.studentId) {
    filters.studentId = req.query.studentId as string;
  }

  const items = await service.listPayments(filters);
  res.json(items);
}

export async function createPayment(req: AuthRequest, res: Response) {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'Screenshot proof is required' });
  }

  // Optimize and convert to WebP format
  const { relativePath } = await processAndSaveWebP(file.buffer, 'payments', 85);

  const payment = await service.createPaymentWithScreenshot({
    studentId: req.body.studentId,
    packageId: req.body.packageId,
    notes: req.body.notes,
    createdById: req.user!.userId,
    screenshotUrl: relativePath,
    screenshotOriginalName: file.originalname,
  });

  res.status(201).json(payment);
}

export async function approvePayment(req: AuthRequest, res: Response) {
  const result = await service.approvePayment(req.params.id, req.user!.userId);
  res.json(result);
}

export async function rejectPayment(req: AuthRequest, res: Response) {
  const result = await service.rejectPayment(req.params.id, req.user!.userId, req.body.reason);
  res.json(result);
}
