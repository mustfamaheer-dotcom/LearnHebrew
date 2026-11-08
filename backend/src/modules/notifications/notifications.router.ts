import { Router, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { authenticate, AuthRequest, requireRoles } from '../../middleware/auth';
import { notificationService } from './notifications.service';
import { NotificationCategory, Role } from '@prisma/client';
import { executeReminderCheck } from '../../jobs/reminderJob';

const router = Router();
router.use(authenticate);

/**
 * Admin: Get Notification Hub & Reminder Engine Statistics
 */
router.get(
  '/admin/stats',
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const now = new Date();
      const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const [
        totalRemindersDispatched,
        totalBroadcastsSent,
        totalNotificationsAllTime,
        upcomingLessonsNext24h,
        totalUnreadOverall,
      ] = await Promise.all([
        prisma.notification.count({
          where: { category: NotificationCategory.REMINDER },
        }),
        prisma.notification.count({
          where: { type: 'BROADCAST_ANNOUNCEMENT' },
        }),
        prisma.notification.count(),
        prisma.lesson.count({
          where: {
            status: 'SCHEDULED',
            scheduledAt: { gte: now, lte: in24h },
          },
        }),
        prisma.notification.count({
          where: { isRead: false },
        }),
      ]);

      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'notification_config' },
      });
      const config = (setting?.valueJson as any) || {
        lessonReminderMinutes: 30,
        enableSoundChime: true,
      };

      res.json({
        stats: {
          totalRemindersDispatched,
          totalBroadcastsSent,
          totalNotificationsAllTime,
          upcomingLessonsNext24h,
          totalUnreadOverall,
          activeSubscribers: notificationService.getActiveClientsCount(),
          workerStatus: 'RUNNING',
          workerIntervalSeconds: 60,
          currentLeadMinutes: Number(config.lessonReminderMinutes) || 30,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Admin: Trigger Manual Sweep of Pre-Lesson Reminder Check
 */
router.post(
  '/reminders/trigger-check',
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await executeReminderCheck();
      res.json({
        message: 'Reminder sweep executed successfully',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Admin: View Dispatched Notifications & Audit Stream Across Entire System
 */
router.get(
  '/admin/all',
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const category = req.query.category as string | undefined;
      const search = req.query.search as string | undefined;
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(Number(req.query.limit) || 25, 100);
      const skip = (page - 1) * limit;

      const where: any = {};
      if (category && category !== 'ALL') {
        where.category = category as NotificationCategory;
      }

      if (search && search.trim()) {
        const query = search.trim();
        where.OR = [
          { titleEn: { contains: query, mode: 'insensitive' } },
          { titleHe: { contains: query, mode: 'insensitive' } },
          { bodyEn: { contains: query, mode: 'insensitive' } },
          { bodyHe: { contains: query, mode: 'insensitive' } },
          {
            user: {
              OR: [
                { firstName: { contains: query, mode: 'insensitive' } },
                { lastName: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
              ],
            },
          },
        ];
      }

      const [notifications, totalCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.notification.count({ where }),
      ]);

      res.json({
        notifications,
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Real-Time Server-Sent Events (SSE) Stream
 */
router.get('/stream', (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // For Nginx reverse proxies

  res.flushHeaders?.();

  notificationService.registerClient(userId, res);
});

/**
 * Get Paginated Notifications for authenticated user
 */
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const category = req.query.category as string | undefined;
    const isUnreadOnly = req.query.unread === 'true';
    const limit = Math.min(Number(req.query.limit) || 30, 100);

    const where: any = { userId: req.user!.userId };
    if (category && category !== 'ALL') {
      where.category = category as NotificationCategory;
    }
    if (isUnreadOnly) {
      where.isRead = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId: req.user!.userId, isRead: false },
      }),
    ]);

    res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
});

/**
 * Get unread notifications count
 */
router.get('/unread-count', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.userId, isRead: false },
    });
    res.json({ unreadCount });
  } catch (error) {
    next(error);
  }
});

/**
 * Mark single notification as read
 */
router.patch('/:id/read', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.userId },
      data: { isRead: true, readAt: new Date() },
    });
    res.json({ message: 'Marked as read' });
  } catch (error) {
    next(error);
  }
});

/**
 * Mark all user notifications as read
 */
router.patch('/read-all', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

/**
 * Clear all read notifications for user
 */
router.delete('/clear/read', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await prisma.notification.deleteMany({
      where: { userId: req.user!.userId, isRead: true },
    });
    res.json({ message: 'Read notifications cleared', count: result.count });
  } catch (error) {
    next(error);
  }
});

/**
 * Delete a notification
 */
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.deleteMany({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
});

/**
 * Admin broadcast notification to users
 */
router.post('/broadcast', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Forbidden. Admin privileges required.' });
    }

    const { titleEn, titleHe, bodyEn, bodyHe, targetRole, actionUrl } = req.body;
    if (!titleEn || !titleHe || !bodyEn || !bodyHe) {
      return res.status(400).json({ message: 'Missing bilingual title or body fields' });
    }

    const result = await notificationService.broadcast({
      titleEn,
      titleHe,
      bodyEn,
      bodyHe,
      targetRole,
      actionUrl,
    });

    res.json({ message: 'Broadcast sent successfully', ...result });
  } catch (error) {
    next(error);
  }
});

export default router;
