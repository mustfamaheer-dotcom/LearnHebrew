import { Router, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { notificationService } from './notifications.service';
import { NotificationCategory } from '@prisma/client';

const router = Router();
router.use(authenticate);

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
