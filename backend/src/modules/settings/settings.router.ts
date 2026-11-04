import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { authenticate, requireRoles, AuthRequest } from '../../middleware/auth';
import { Role } from '@prisma/client';

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

// GET Landing Page Config (Public)
router.get('/landing-page', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'landing_page_config' },
    });

    if (!setting) {
      return res.json({ config: DEFAULT_LANDING_CONFIG });
    }

    res.json({ config: setting.valueJson });
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

      res.json({
        message: 'Landing page updated successfully!',
        config: setting.valueJson,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

