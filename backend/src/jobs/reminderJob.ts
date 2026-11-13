import { prisma } from '../config/database';
import { notificationService } from '../modules/notifications/notifications.service';
import { logSystemEvent } from '../utils/systemLogger';
import { LogCategory, LogLevel } from '@prisma/client';

export interface ReminderCheckResult {
  scannedLessonsCount: number;
  dispatchedCount: number;
  timestamp: string;
}

/**
 * Enhanced notification scheduler checking 1-day (24h) and 1-hour reminders
 * customized per student/user preference with idempotency guards.
 */
export const executeReminderCheck = async (): Promise<ReminderCheckResult> => {
  let dispatchedCount = 0;
  let scannedLessonsCount = 0;

  try {
    const now = new Date();
    const future25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // 1. Fetch upcoming scheduled lessons in the next 25 hours
    const lessons = await prisma.lesson.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { gte: now, lte: future25h },
      },
      include: {
        student: {
          include: {
            user: { include: { notificationPreference: true } },
          },
        },
        teacher: {
          include: { user: true },
        },
      },
    });

    scannedLessonsCount = lessons.length;

    for (const lesson of lessons) {
      const scheduledTime = new Date(lesson.scheduledAt).getTime();
      const diffMinutes = Math.round((scheduledTime - now.getTime()) / (60 * 1000));

      const pref = lesson.student.user.notificationPreference;
      const is24hEnabled = pref ? pref.reminder24hEnabled : true;
      const is1hEnabled = pref ? pref.reminder1hEnabled : true;
      const custom24hMins = pref?.reminder24hMinutes || 1440; // 24 hours default
      const custom1hMins = pref?.reminder1hMinutes || 60;    // 1 hour default

      // Check 24-hour reminder trigger
      if (
        is24hEnabled &&
        !lesson.reminder24hSentAt &&
        diffMinutes <= custom24hMins &&
        diffMinutes > custom1hMins
      ) {
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { reminder24hSentAt: new Date() },
        });

        await prisma.notification.create({
          data: {
            userId: lesson.student.userId,
            type: 'LESSON_REMINDER_24H',
            title: 'Upcoming Hebrew Session Tomorrow 📅',
            titleEn: 'Upcoming Hebrew Session Tomorrow 📅',
            titleHe: 'תזכורת: שיעור עברית מחר 📅',
            body: `Your session with ${lesson.teacher.user.firstName} is scheduled for tomorrow at ${new Date(lesson.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
            bodyEn: `Your session with ${lesson.teacher.user.firstName} is scheduled for tomorrow at ${new Date(lesson.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
            bodyHe: `השיעור שלך עם ${lesson.teacher.user.firstName} מתוכנן למחר בשעה ${new Date(lesson.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          },
        });
        dispatchedCount++;
      }

      // Check 1-hour reminder trigger
      if (
        is1hEnabled &&
        !lesson.reminder1hSentAt &&
        diffMinutes <= custom1hMins &&
        diffMinutes >= 0
      ) {
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { reminder1hSentAt: new Date() },
        });

        await prisma.notification.create({
          data: {
            userId: lesson.student.userId,
            type: 'LESSON_REMINDER_1H',
            title: 'Class Starts in 1 Hour! ⏰',
            titleEn: 'Class Starts in 1 Hour! ⏰',
            titleHe: 'השיעור מתחיל בעוד שעה! ⏰',
            body: `Get ready! Your Hebrew lesson with ${lesson.teacher.user.firstName} starts in ${diffMinutes} minutes.`,
            bodyEn: `Get ready! Your Hebrew lesson with ${lesson.teacher.user.firstName} starts in ${diffMinutes} minutes.`,
            bodyHe: `היכונו! השיעור שלך עם ${lesson.teacher.user.firstName} יתחיל בעוד ${diffMinutes} דקות.`,
          },
        });
        dispatchedCount++;
      }
    }

    // 2. Package & Session Balance Expiry Check (Daily sweep)
    const expiredBalances = await prisma.studentSessionBalance.findMany({
      where: {
        expiresAt: { lt: now },
        balance: { gt: 0 },
      },
      include: {
        student: { include: { user: true } },
        sessionType: true,
      },
    });

    for (const exp of expiredBalances) {
      await prisma.$transaction([
        prisma.studentSessionBalance.update({
          where: { id: exp.id },
          data: { balance: 0 },
        }),
        prisma.sessionBalanceLedger.create({
          data: {
            studentId: exp.studentId,
            sessionTypeId: exp.sessionTypeId,
            delta: -exp.balance,
            balanceAfter: 0,
            reason: 'EXPIRY',
            createdById: 'system',
          },
        }),
        prisma.notification.create({
          data: {
            userId: exp.student.userId,
            type: 'PACKAGE_EXPIRED',
            title: 'Session Package Expired ⏳',
            titleEn: 'Session Package Expired ⏳',
            titleHe: 'תוקף חבילת השיעורים פג ⏳',
            body: `Your unused sessions for ${exp.sessionType.labelEn} expired after the 30-day validity window.`,
            bodyEn: `Your unused sessions for ${exp.sessionType.labelEn} expired after the 30-day validity window.`,
            bodyHe: `השיעורים שנותרו עבור ${exp.sessionType.labelHe} פגו בתום 30 ימי התוקף.`,
          },
        }),
      ]);
    }
  } catch (error: any) {
    console.error('[ReminderJob Scheduler Error]', error);
  }

  return {
    scannedLessonsCount,
    dispatchedCount,
    timestamp: new Date().toISOString(),
  };
};

export const startReminderJob = () => {
  console.log('⏰ [ReminderJob] Initialized 1-day & 1-hour reminder scheduler and 30-day package balance auditor.');
  setTimeout(executeReminderCheck, 5000);
  setInterval(executeReminderCheck, 60 * 1000);
};
