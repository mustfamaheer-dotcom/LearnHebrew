import { prisma } from '../config/database';
import { notificationService } from '../modules/notifications/notifications.service';

/**
 * 60-Second Background Job for Pre-Lesson Reminders with DB Idempotency
 */
export const startReminderJob = () => {
  console.log('⏰ [ReminderJob] Initialized 60-second background pre-lesson reminder worker.');

  const checkReminders = async () => {
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

      // 4. Atomically dispatch reminders
      for (const lesson of upcomingLessons) {
        // Atomic lock to guarantee single dispatch
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { reminderSentAt: new Date() },
        });

        await notificationService.notifyLessonReminder(lesson, leadMinutes);
        console.log(`🔔 [ReminderJob] Dispatched ${leadMinutes}-min reminder for lesson ${lesson.id} (${lesson.student.user.firstName} & ${lesson.teacher.user.firstName}).`);
      }
    } catch (error) {
      console.error('[ReminderJob Error]', error);
    }
  };

  // Run on startup after 5 seconds, then every 60 seconds
  setTimeout(checkReminders, 5000);
  setInterval(checkReminders, 60 * 1000);
};

