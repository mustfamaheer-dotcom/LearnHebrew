import { Request, Response, NextFunction } from 'express';
import { logSystemEvent } from '../utils/systemLogger';
import { AuthRequest } from './auth';
import { LogCategory, LogLevel } from '@prisma/client';

const IGNORED_PATHS = [
  '/api/health',
  '/api/v1/notifications/sse',
  '/api/v1/notifications/stream',
];

function determineCategory(path: string): LogCategory {
  if (path.includes('/auth')) return LogCategory.AUTH;
  if (path.includes('/lessons')) return LogCategory.LESSON;
  if (path.includes('/balance') || path.includes('/transactions')) return LogCategory.BALANCE;
  if (path.includes('/notifications')) return LogCategory.NOTIFICATION;
  if (path.includes('/system-logs')) return LogCategory.SYSTEM;
  return LogCategory.API;
}

function redactSensitive(data: any): any {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(redactSensitive);

  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('password') ||
      lowerKey.includes('token') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('hash') ||
      lowerKey.includes('authorization')
    ) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = redactSensitive(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Ignore noise paths
  if (IGNORED_PATHS.some((p) => req.originalUrl.startsWith(p) || req.path.startsWith(p))) {
    return next();
  }

  // Only log API requests
  if (!req.path.startsWith('/api')) {
    return next();
  }

  const startTime = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const statusCode = res.statusCode;
    const userId = (req as AuthRequest).user?.userId;
    const path = req.originalUrl || req.path;

    // Severity mapping
    let level: LogLevel = LogLevel.INFO;
    if (statusCode >= 500) {
      level = LogLevel.ERROR;
    } else if (statusCode === 401 || statusCode === 403 || statusCode === 429) {
      level = LogLevel.WARN;
    } else if (statusCode >= 400) {
      level = LogLevel.WARN;
    }

    const category = determineCategory(path);
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'] as string | undefined;

    // Capture metadata for non-2xx responses or slow queries (>800ms)
    let meta: Record<string, any> | undefined = undefined;
    if (statusCode >= 400 || durationMs > 800) {
      meta = {
        query: req.query && Object.keys(req.query).length > 0 ? req.query : undefined,
        body: req.body && Object.keys(req.body).length > 0 ? redactSensitive(req.body) : undefined,
        params: req.params && Object.keys(req.params).length > 0 ? req.params : undefined,
      };
    }

    logSystemEvent({
      level,
      category,
      message: `${req.method} ${path} → ${statusCode} (${durationMs}ms)`,
      statusCode,
      method: req.method,
      path,
      durationMs,
      userId,
      ipAddress: clientIp,
      userAgent,
      meta,
    });
  });

  next();
}

