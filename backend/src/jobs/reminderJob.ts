import { prisma } from '../config/database';
import { notificationService } from '../modules/notifications/notifications.service';
import { logSystemEvent } from '../utils/systemLogger';
import { LogCategory, LogLevel } from '@prisma/client';

export interface ReminderCheckResult {
  leadMinutes: number;
  windowStart: string;
  windowEnd: string;
  scannedLessonsCount: number;
  dispatchedCount: number;
  timestamp: string;
}

/**
 * Execute a single sweep of the pre-lesson reminder check.
 * Callable by both background cron and admin manual trigger.
 */
export const executeReminderCheck = async (): Promise<ReminderCheckResult> => {
  try {
    // 1. Fetch Admin lead minutes setting (default: 30)
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'notification_config' },
    });
    const config = (setting?.valueJson as any) || {};
    const leadMinutes = Number(config.lessonReminderMinutes) || 30;

    // 2. Compute search window (within leadMinutes +/- 2 minutes)
    const now = Date.now();
    const windowStart = new Date(now + (leadMinutes - 2) * 60 * 1000);
    const windowEnd = new Date(now + (leadMinutes + 2) * 60 * 1000);

    // 3. Find lessons requiring reminders that haven't been alerted
    const upcomingLessons = await prisma.lesson.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { gte: windowStart, lte: windowEnd },
        reminderSentAt: null,
      },
      include: {
        student: { include: { user: true } },
        teacher: { include: { user: true } },
      },
    });

    let dispatchedCount = 0;

    // 4. Concurrently process reminders in bounded chunks of 10 to avoid sequential event-loop blocking
    const CHUNK_SIZE = 10;
    for (let i = 0; i < upcomingLessons.length; i += CHUNK_SIZE) {
      const chunk = upcomingLessons.slice(i, i + CHUNK_SIZE);
      await Promise.allSettled(
        chunk.map(async (lesson) => {
          try {
            // Atomic lock to guarantee single dispatch
            await prisma.lesson.update({
              where: { id: lesson.id },
              data: { reminderSentAt: new Date() },
            });

            await notificationService.notifyLessonReminder(lesson, leadMinutes);
            dispatchedCount++;

            console.log(
              `🔔 [ReminderJob] Dispatched ${leadMinutes}-min reminder for lesson ${lesson.id} (${lesson.student.user.firstName} & ${lesson.teacher.user.firstName}).`
            );

            await logSystemEvent({
              level: LogLevel.INFO,
              category: LogCategory.JOB,
              message: `[ReminderJob] Dispatched ${leadMinutes}-min reminder for lesson ${lesson.id}`,
              meta: {
                lessonId: lesson.id,
                studentEmail: lesson.student.user.email,
                teacherEmail: lesson.teacher.user.email,
                leadMinutes,
              },
            });
          } catch (itemError) {
            console.error(`[ReminderJob] Failed to dispatch reminder for lesson ${lesson.id}:`, itemError);
          }
        })
      );
    }

    return {
      leadMinutes,
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      scannedLessonsCount: upcomingLessons.length,
      dispatchedCount,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('[ReminderJob Error]', error);
    await logSystemEvent({
      level: LogLevel.ERROR,
      category: LogCategory.JOB,
      message: `[ReminderJob Error] ${error?.message || 'Unknown reminder worker failure'}`,
      errorClass: error?.constructor?.name,
      stack: error?.stack,
    });
    throw error;
  }
};

/**
 * 60-Second Background Job for Pre-Lesson Reminders with DB Idempotency
 */
export const startReminderJob = () => {
  console.log('⏰ [ReminderJob] Initialized 60-second background pre-lesson reminder worker.');

  logSystemEvent({
    level: LogLevel.INFO,
    category: LogCategory.JOB,
    message: '[ReminderJob] Initialized 60-second background pre-lesson reminder worker.',
  });

  // Run on startup after 5 seconds, then every 60 seconds
  setTimeout(executeReminderCheck, 5000);
  setInterval(executeReminderCheck, 60 * 1000);
};
