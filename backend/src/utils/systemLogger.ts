import { prisma } from '../config/database';
import { LogLevel, LogCategory } from '@prisma/client';

export interface LogSystemEventParams {
  level: LogLevel;
  category: LogCategory;
  message: string;
  statusCode?: number;
  method?: string;
  path?: string;
  durationMs?: number;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  errorClass?: string;
  stack?: string;
  meta?: Record<string, any>;
}

/**
 * Robust async system logger.
 * Never throws exceptions or interrupts critical business flows.
 */
export async function logSystemEvent(params: LogSystemEventParams): Promise<void> {
  try {
    await prisma.systemLog.create({
      data: {
        level: params.level,
        category: params.category,
        message: params.message.substring(0, 1000),
        statusCode: params.statusCode,
        method: params.method,
        path: params.path,
        durationMs: params.durationMs,
        userId: params.userId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent ? params.userAgent.substring(0, 500) : undefined,
        errorClass: params.errorClass,
        stack: params.stack ? params.stack.substring(0, 3000) : undefined,
        metaJson: params.meta ?? undefined,
      },
    });
  } catch (err) {
    // Fail-safe: Fallback to process console without disrupting execution
    console.error('[SystemLogger Failed to write log]', err);
  }
}
