import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { authenticate, requireRoles, AuthRequest } from '../../middleware/auth';
import { Role } from '@prisma/client';
import { getCachedOrFetch, cacheDel } from '../../lib/cache';

const router = Router();

const DEFAULT_LANDING_CONFIG = {
  badgeEn: 'Bilingual Hebrew Platform',
  badgeHe: 'פלטפורמה דו-לשונית ללימוד עברית',
  heroTitleEn: 'Speak Modern Hebrew with Confidence',
  heroTitleHe: 'לדבר עברית בביטחון ובקלות',
  heroSubtitleEn:
    'Live 1-on-1 private video lessons (25-min focused slots) with native certified teachers, customized homework, and gamified progress from your very first Alef-Bet.',
  heroSubtitleHe:
    'שיעורים פרטיים ממוקדים של 25 דקות עם מורים מוסמכים ומנוסים, שיעורי בית מותאמים אישית, ומשחקים חווייתיים מהאלף-בית ועד שיחה שוטפת.',
  ctaStudentEn: 'Go to Student Dashboard',
  ctaStudentHe: 'מעבר ללוח הבקרה',
  ctaLoginEn: 'Start Learning Now',
  ctaLoginHe: 'התחל ללמוד עכשיו',
  announcementEn: 'Special Offer: All new students receive 50 bonus gamification points upon first booking!',
  announcementHe: 'מבצע מיוחד: כל תלמיד חדש מקבל 50 נקודות בונוס עם קביעת השיעור הראשון!',
  features: [
    {
      icon: 'video',
      titleEn: '25-Minute Focused Live Lessons',
      titleHe: 'שיעורים חיים ממוקדים של 25 דקות',
      descEn: 'High-intensity 25-minute private 1-on-1 sessions designed for maximum retention without cognitive fatigue.',
      descHe: 'מפגשים אישיים של 25 דקות המתוכננים לקליטה מיטבית וללא עומס קוגניטיבי.',
    },
    {
      icon: 'gamepad',
      titleEn: 'Real Hebrew Interactive Games',
      titleHe: 'משחקי שפה אינטראקטיביים אמיתיים',
      descEn: 'Interactive 3D Alef-Bet flashcards with audio pronunciation, timed vocabulary quizzes, and matching challenges.',
      descHe: 'כרטיסיות תלת-ממד עם הגייה קולית, חידונים מתוזמנים ואתגרי התאמת מילים לצבירת נקודות.',
    },
    {
      icon: 'drive',
      titleEn: 'Lesson Recordings & Notes',
      titleHe: 'הקלטות וידאו וסיכומי שיעור',
      descEn: 'Access Google Drive recordings and teacher notes after every class to review grammar and vocabulary anytime.',
      descHe: 'גישה נוחה להקלטות Google Drive ולהערות המורה לאחר כל מפגש לחיזוק הלמידה.',
    },
  ],
};

// GET Landing Page Config (Public with Redis cache)
router.get('/landing-page', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await getCachedOrFetch('settings:landing-page', 60, async () => {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'landing_page_config' },
      });
      return setting ? setting.valueJson : DEFAULT_LANDING_CONFIG;
    });

    res.json({ config });
  } catch (error) {
    next(error);
  }
});

// UPDATE Landing Page Config (Admin only)
router.put(
  '/landing-page',
  authenticate,
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const config = req.body;
      const setting = await prisma.systemSetting.upsert({
        where: { key: 'landing_page_config' },
        update: { valueJson: config },
        create: {
          key: 'landing_page_config',
          valueJson: config,
        },
      });

      await cacheDel('settings:landing-page');
      res.json({
        message: 'Landing page updated successfully!',
        config: setting.valueJson,
      });
    } catch (error) {
      next(error);
    }
  }
);

const DEFAULT_SESSION_PRICING = {
  '25': 25,
  '40': 40,
  '55': 55,
  currency: 'USD',
};

// GET Session Pricing by Duration (25m, 40m, 55m)
router.get('/session-pricing', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'session_pricing' },
    });
    res.json({ pricing: setting?.valueJson || DEFAULT_SESSION_PRICING });
  } catch (error) {
    next(error);
  }
});

// UPDATE Session Pricing (Admin only)
router.put(
  '/session-pricing',
  authenticate,
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const pricing = req.body.pricing || req.body;
      const setting = await prisma.systemSetting.upsert({
        where: { key: 'session_pricing' },
        update: { valueJson: pricing },
        create: {
          key: 'session_pricing',
          valueJson: pricing,
        },
      });
      res.json({
        message: 'Session pricing updated successfully!',
        pricing: setting.valueJson,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET Notification Config
router.get('/notification-config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'notification_config' },
    });
    res.json({
      config: setting?.valueJson || {
        lessonReminderMinutes: 30,
        enableSoundChime: true,
      },
    });
  } catch (error) {
    next(error);
  }
});

// UPDATE Notification Config (Admin only)
router.put(
  '/notification-config',
  authenticate,
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const config = req.body.config || req.body;
      const setting = await prisma.systemSetting.upsert({
        where: { key: 'notification_config' },
        update: { valueJson: config },
        create: {
          key: 'notification_config',
          valueJson: config,
        },
      });
      res.json({
        message: 'Notification settings updated successfully!',
        config: setting.valueJson,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

