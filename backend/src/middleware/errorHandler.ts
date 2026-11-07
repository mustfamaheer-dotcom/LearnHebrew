import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logSystemEvent } from '../utils/systemLogger';
import { AuthRequest } from './auth';
import { LogCategory, LogLevel } from '@prisma/client';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('[Error Handler]', err);

  const statusCode = err.status || err.statusCode || (err instanceof ZodError ? 400 : 500);
  const message = err.message || 'Internal server error';
  const level = statusCode >= 500 ? LogLevel.CRITICAL : LogLevel.WARN;
  const errorClass = err.constructor?.name || err.name || 'Error';
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;

  logSystemEvent({
    level,
    category: LogCategory.API,
    message: `[${errorClass}] ${message}`,
    statusCode,
    method: req.method,
    path: req.originalUrl || req.path,
    userId: (req as AuthRequest).user?.userId,
    ipAddress: clientIp,
    userAgent: req.headers['user-agent'] as string | undefined,
    errorClass,
    stack: err.stack,
    meta: {
      query: req.query,
      params: req.params,
      validationErrors: err instanceof ZodError ? err.errors : undefined,
    },
  });

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
