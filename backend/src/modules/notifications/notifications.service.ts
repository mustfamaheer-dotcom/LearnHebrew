import { Response } from 'express';
import { prisma } from '../../config/database';
import { NotificationCategory, NotificationPriority } from '@prisma/client';

export interface CreateNotificationDTO {
  userId: string;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  type: string;
  titleEn: string;
  titleHe: string;
  bodyEn: string;
  bodyHe: string;
  actionUrl?: string;
  metaJson?: any;
}

export class NotificationService {
  // In-memory active Server-Sent Events client connections keyed by userId
  private sseClients: Map<string, Set<Response>> = new Map();

  /**
   * Register an open SSE stream connection for real-time dispatch
   */
  public registerClient(userId: string, res: Response) {
    if (!this.sseClients.has(userId)) {
      this.sseClients.set(userId, new Set());
    }
    this.sseClients.get(userId)!.add(res);

    // Send initial keep-alive ping
    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', timestamp: new Date().toISOString() })}\n\n`);

    res.on('close', () => {
      this.unregisterClient(userId, res);
    });
  }

  /**
   * Remove a closed SSE response connection
   */
  public unregisterClient(userId: string, res: Response) {
    const userSet = this.sseClients.get(userId);
    if (userSet) {
      userSet.delete(res);
      if (userSet.size === 0) {
        this.sseClients.delete(userId);
      }
    }
  }

  /**
   * Total number of active authenticated clients listening to SSE
   */
  public getActiveClientsCount(): number {
    let count = 0;
    this.sseClients.forEach((set) => {
      count += set.size;
    });
    return count;
  }

  /**
   * Push an event to all active SSE streams of a specific user
   */
  public pushToUser(userId: string, event: string, data: any) {
    const userSet = this.sseClients.get(userId);
    if (userSet && userSet.size > 0) {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      userSet.forEach((res) => {
        try {
          res.write(payload);
        } catch {
          // Socket closed or error
        }
      });
    }
  }

  /**
   * Create and persist a notification, then immediately push via SSE
   */
  public async createNotification(dto: CreateNotificationDTO) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: dto.userId,
          category: dto.category || NotificationCategory.SYSTEM,
          priority: dto.priority || NotificationPriority.NORMAL,
          type: dto.type,
          title: dto.titleEn,
          body: dto.bodyEn,
          titleEn: dto.titleEn,
          titleHe: dto.titleHe,
          bodyEn: dto.bodyEn,
          bodyHe: dto.bodyHe,
          actionUrl: dto.actionUrl || null,
          metaJson: dto.metaJson || null,
        },
      });

      // Real-time instant delivery to client browser session
      this.pushToUser(dto.userId, 'notification', notification);

      return notification;
    } catch (error) {
      console.error('[NotificationService.createNotification Error]', error);
      return null;
    }
  }

  /**
   * Trigger when a student books a session
   */
  public async notifyBookingCreated(lesson: {
    id: string;
    scheduledAt: Date;
    durationMinutes: number;
    student: { user: { id: string; firstName: string; lastName: string } };
    teacher: { user: { id: string; firstName: string; lastName: string } };
    zoomLink?: string | null;
  }) {
    const studentUser = lesson.student.user;
    const teacherUser = lesson.teacher.user;
    const dateFormatted = new Date(lesson.scheduledAt).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // 1. Notify Student
    await this.createNotification({
      userId: studentUser.id,
      category: NotificationCategory.LESSON,
      priority: NotificationPriority.HIGH,
      type: 'LESSON_BOOKED',
      titleEn: `Lesson Confirmed with ${teacherUser.firstName}`,
      titleHe: `שיעור נקבע עם ${teacherUser.firstName}`,
      bodyEn: `Your ${lesson.durationMinutes}-minute lesson is scheduled for ${dateFormatted} (Israel Time).`,
      bodyHe: `שיעור ה-25 דקות שלך נקבע ל-${dateFormatted} (שעון ישראל).`,
      actionUrl: lesson.zoomLink || '/student',
      metaJson: { lessonId: lesson.id, teacherId: teacherUser.id, zoomLink: lesson.zoomLink },
    });

    // 2. Notify Teacher
    await this.createNotification({
      userId: teacherUser.id,
      category: NotificationCategory.LESSON,
      priority: NotificationPriority.HIGH,
      type: 'LESSON_BOOKED',
      titleEn: `New Lesson Booked: ${studentUser.firstName} ${studentUser.lastName}`,
      titleHe: `שיעור חדש נקבע: ${studentUser.firstName} ${studentUser.lastName}`,
      bodyEn: `${studentUser.firstName} booked a ${lesson.durationMinutes}-min lesson for ${dateFormatted}.`,
      bodyHe: `${studentUser.firstName} קבע/ה שיעור של ${lesson.durationMinutes} דקות לתאריך ${dateFormatted}.`,
      actionUrl: '/teacher',
      metaJson: { lessonId: lesson.id, studentId: studentUser.id, zoomLink: lesson.zoomLink },
    });
  }

  /**
   * Trigger pre-lesson countdown reminder (called by cron worker)
   */
  public async notifyLessonReminder(
    lesson: {
      id: string;
      scheduledAt: Date;
      durationMinutes: number;
      zoomLink?: string | null;
      student: { user: { id: string; firstName: string; lastName: string } };
      teacher: { user: { id: string; firstName: string; lastName: string } };
    },
    leadMinutes: number
  ) {
    const studentUser = lesson.student.user;
    const teacherUser = lesson.teacher.user;

    // To Student
    await this.createNotification({
      userId: studentUser.id,
      category: NotificationCategory.REMINDER,
      priority: NotificationPriority.URGENT,
      type: 'LESSON_REMINDER',
      titleEn: `Session in ${leadMinutes} Minutes with ${teacherUser.firstName}`,
      titleHe: `תזכורת: שיעור בעוד ${leadMinutes} דקות עם ${teacherUser.firstName}`,
      bodyEn: `Get ready! Your live lesson starts shortly. Click to join the Zoom classroom.`,
      bodyHe: `התכונן! השיעור שלך מתחיל בקרוב. לחץ כאן לכניסה לחדר הזום.`,
      actionUrl: lesson.zoomLink || '/student',
      metaJson: { lessonId: lesson.id, leadMinutes, zoomLink: lesson.zoomLink },
    });

    // To Teacher
    await this.createNotification({
      userId: teacherUser.id,
      category: NotificationCategory.REMINDER,
      priority: NotificationPriority.URGENT,
      type: 'LESSON_REMINDER',
      titleEn: `Session in ${leadMinutes} Minutes with ${studentUser.firstName}`,
      titleHe: `תזכורת: שיעור בעוד ${leadMinutes} דקות עם ${studentUser.firstName}`,
      bodyEn: `Your student is expecting you in ${leadMinutes} minutes. Prepare your lesson materials.`,
      bodyHe: `התלמיד ממתין לשיעור בעוד ${leadMinutes} דקות. חדר השיעור פתוח.`,
      actionUrl: lesson.zoomLink || '/teacher',
      metaJson: { lessonId: lesson.id, leadMinutes, zoomLink: lesson.zoomLink },
    });
  }

  /**
   * Trigger when teacher assigns homework
   */
  public async notifyHomeworkAssigned(homework: {
    id: string;
    title: string;
    student: { user: { id: string } };
    teacher: { user: { firstName: string; lastName: string } };
  }) {
    await this.createNotification({
      userId: homework.student.user.id,
      category: NotificationCategory.HOMEWORK,
      priority: NotificationPriority.NORMAL,
      type: 'HOMEWORK_ASSIGNED',
      titleEn: `New Homework: ${homework.title}`,
      titleHe: `שיעורי בית חדשים: ${homework.title}`,
      bodyEn: `${homework.teacher.user.firstName} assigned new practice tasks for your Hebrew progression.`,
      bodyHe: `${homework.teacher.user.firstName} הקצה/תה משימת תרגול חדשה לקידום העברית שלך.`,
      actionUrl: '/student',
      metaJson: { homeworkId: homework.id },
    });
  }

  /**
   * Trigger when student submits homework
   */
  public async notifyHomeworkSubmitted(homework: {
    id: string;
    title: string;
    teacher: { user: { id: string } };
    student: { user: { firstName: string; lastName: string } };
  }) {
    await this.createNotification({
      userId: homework.teacher.user.id,
      category: NotificationCategory.HOMEWORK,
      priority: NotificationPriority.NORMAL,
      type: 'HOMEWORK_SUBMITTED',
      titleEn: `Homework Submitted: ${homework.student.user.firstName}`,
      titleHe: `שיעורי בית הוגשו: ${homework.student.user.firstName}`,
      bodyEn: `${homework.student.user.firstName} submitted "${homework.title}" for your review.`,
      bodyHe: `${homework.student.user.firstName} הגיש/ה את "${homework.title}" לבדיקה שלך.`,
      actionUrl: '/teacher',
      metaJson: { homeworkId: homework.id },
    });
  }

  /**
   * Trigger when teacher grades or reviews homework
   */
  public async notifyHomeworkReviewed(homework: {
    id: string;
    title: string;
    student: { user: { id: string } };
    teacher: { user: { firstName: string } };
  }) {
    await this.createNotification({
      userId: homework.student.user.id,
      category: NotificationCategory.HOMEWORK,
      priority: NotificationPriority.NORMAL,
      type: 'HOMEWORK_REVIEWED',
      titleEn: `Homework Reviewed: ${homework.title}`,
      titleHe: `שיעורי הבית נבדקו: ${homework.title}`,
      bodyEn: `${homework.teacher.user.firstName} provided feedback and awarded points for your work.`,
      bodyHe: `${homework.teacher.user.firstName} בדק/ה את שיעורי הבית והוסיף/ה משוב ונקודות.`,
      actionUrl: '/student',
      metaJson: { homeworkId: homework.id },
    });
  }

  /**
   * Trigger when class recording is added
   */
  public async notifyRecordingCreated(recording: {
    id: string;
    title: string;
    student: { user: { id: string } };
    teacher: { user: { firstName: string } };
  }) {
    await this.createNotification({
      userId: recording.student.user.id,
      category: NotificationCategory.RECORDING,
      priority: NotificationPriority.NORMAL,
      type: 'RECORDING_ADDED',
      titleEn: `New Lesson Recording: ${recording.title}`,
      titleHe: `הקלטת שיעור חדשה: ${recording.title}`,
      bodyEn: `Watch your recorded 25-minute practice session directly in your student hub.`,
      bodyHe: `צפה בהקלטת שיעור 25 הדקות שלך ישירות במרכז התלמיד.`,
      actionUrl: '/student',
      metaJson: { recordingId: recording.id },
    });
  }

  /**
   * Trigger when a lesson is cancelled
   */
  public async notifyLessonCancelled(lesson: {
    id: string;
    scheduledAt: Date;
    cancelledByUserId: string;
    cancelledByName: string;
    student: { user: { id: string } };
    teacher: { user: { id: string } };
  }) {
    const isStudentCanceller = lesson.cancelledByUserId === lesson.student.user.id;
    const recipientUserId = isStudentCanceller ? lesson.teacher.user.id : lesson.student.user.id;
    const targetUrl = isStudentCanceller ? '/teacher' : '/student';

    const dateFormatted = new Date(lesson.scheduledAt).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    await this.createNotification({
      userId: recipientUserId,
      category: NotificationCategory.LESSON,
      priority: NotificationPriority.HIGH,
      type: 'LESSON_CANCELLED',
      titleEn: `Lesson Cancelled by ${lesson.cancelledByName}`,
      titleHe: `שיעור בוטל על ידי ${lesson.cancelledByName}`,
      bodyEn: `The session on ${dateFormatted} was cancelled. Student wallet has been refunded.`,
      bodyHe: `השיעור בתאריך ${dateFormatted} בוטל. יתרת התלמיד זוכתה במלואה.`,
      actionUrl: targetUrl,
      metaJson: { lessonId: lesson.id },
    });
  }

  /**
   * Global broadcast to all active users or a specific role
   */
  public async broadcast(params: {
    titleEn: string;
    titleHe: string;
    bodyEn: string;
    bodyHe: string;
    targetRole?: string;
    actionUrl?: string;
  }) {
    const whereClause: any = { isActive: true };
    if (params.targetRole && params.targetRole !== 'ALL') {
      whereClause.role = params.targetRole;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: { id: true },
    });

    for (const u of users) {
      await this.createNotification({
        userId: u.id,
        category: NotificationCategory.SYSTEM,
        priority: NotificationPriority.NORMAL,
        type: 'ADMIN_BROADCAST',
        titleEn: params.titleEn,
        titleHe: params.titleHe,
        bodyEn: params.bodyEn,
        bodyHe: params.bodyHe,
        actionUrl: params.actionUrl || '/',
      });
    }

    return { totalSent: users.length };
  }
}

export const notificationService = new NotificationService();

