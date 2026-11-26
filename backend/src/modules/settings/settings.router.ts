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
    const pricing = await getCachedOrFetch('setting:session_pricing', 300, async () => {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'session_pricing' },
      });
      return setting?.valueJson || DEFAULT_SESSION_PRICING;
    });
    res.json({ pricing });
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
      await cacheDel('setting:session_pricing');
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

// GET / PUT Platform Currency Configuration (USD or ILS)
router.get('/currency', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'platform_currency' },
    });
    res.json({
      currency: (setting?.valueJson as any)?.currency || 'USD',
      symbol: (setting?.valueJson as any)?.currency === 'ILS' ? '₪' : '$',
    });
  } catch (error) {
    next(error);
  }
});

router.put(
  '/currency',
  authenticate,
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const currency = req.body.currency === 'ILS' ? 'ILS' : 'USD';
      const setting = await prisma.systemSetting.upsert({
        where: { key: 'platform_currency' },
        update: { valueJson: { currency } },
        create: {
          key: 'platform_currency',
          valueJson: { currency },
        },
      });
      res.json({
        message: `Platform default currency set to ${currency}`,
        currency,
        symbol: currency === 'ILS' ? '₪' : '$',
      });
    } catch (error) {
      next(error);
    }
  }
);

export interface TeacherVideo {
  id: string;
  teacherId?: string;
  teacherName: string;
  teacherNameHe?: string;
  teacherNameAr?: string;
  avatarUrl?: string;
  title: string;
  titleHe?: string;
  titleAr?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: string;
  specialtyEn?: string;
  specialtyHe?: string;
  specialtyAr?: string;
  rating?: string;
  lessonsCount?: number;
  bioEn?: string;
  bioHe?: string;
  bioAr?: string;
  badges?: string[];
  isActive: boolean;
  order: number;
  createdAt: string;
}

const DEFAULT_TEACHER_VIDEOS: TeacherVideo[] = [
  {
    id: 'vid-1',
    teacherName: 'Noa Ben-David',
    teacherNameHe: 'נועה בן-דוד',
    teacherNameAr: 'نوعا بن دافيد',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    title: 'Modern Conversational Hebrew with Native Fluency',
    titleHe: 'עברית מדוברת יומיומית בביטחון מלא',
    titleAr: 'العبرية اليومية المعاصرة بطلاقة وثقة',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
    duration: '0:45',
    specialtyEn: 'Conversational Hebrew & Accent',
    specialtyHe: 'עברית מדוברת והגייה נכונה',
    specialtyAr: 'العبرية المحادثية والنطق السليم',
    rating: '5.0',
    lessonsCount: 420,
    bioEn: 'Certified Tel Aviv native teacher with 6+ years of experience helping students transition from hesitation to fluent speaking.',
    bioHe: 'מורה מוסמכת מתל אביב עם למעלה מ-6 שנות ניסיון בהוראת עברית מדוברת לתלמידים מכל העולם.',
    bioAr: 'معلمة معتمدة من تل أبيب بخبرة تزيد عن 6 سنوات في مساعدة الطلاب على التحدث بطلاقة وسلاسة.',
    badges: ['Native Speaker', 'Top Rated', '400+ Sessions'],
    isActive: true,
    order: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vid-2',
    teacherName: 'Daniel Cohen',
    teacherNameHe: 'דניאל כהן',
    teacherNameAr: 'دانيال كوهين',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80',
    title: 'Alef-Bet Mastery, Grammar & Reading Comprehension',
    titleHe: 'יסודות הקריאה, דקדוק והבנת הנקרא',
    titleAr: 'إتقان الأبجدية، القواعد والقراءة السليمة',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&auto=format&fit=crop&q=80',
    duration: '0:52',
    specialtyEn: 'Grammar & Reading Fundamentals',
    specialtyHe: 'יסודות הקריאה והדקדוק העברי',
    specialtyAr: 'أسس القراءة والقواعد العبرية',
    rating: '4.98',
    lessonsCount: 310,
    bioEn: 'Linguistics specialist passionate about making Hebrew grammar easy and engaging through structured interactive lessons.',
    bioHe: 'מומחה בבלשנות והוראת דקדוק בצורה קלילה ומובנית לכל הגילאים והרמות.',
    bioAr: 'متخصص في اللغويات وتدريس القواعد بطريقة تفاعلية سهلة ومبسطة للمبتدئين.',
    badges: ['Grammar Expert', 'Beginner Friendly', '300+ Sessions'],
    isActive: true,
    order: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vid-3',
    teacherName: 'Maya Levi',
    teacherNameHe: 'מאיה לוי',
    teacherNameAr: 'مايا ليفي',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
    title: 'Business Hebrew & Professional Workplace Communication',
    titleHe: 'עברית עסקית ותקשורת מקצועית',
    titleAr: 'العبرية للأعمال والتواصل المهني',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&auto=format&fit=crop&q=80',
    duration: '0:38',
    specialtyEn: 'Business & Career Hebrew',
    specialtyHe: 'עברית לקריירה ולעסקים',
    specialtyAr: 'العبرية المهنية وسوق العمل',
    rating: '5.0',
    lessonsCount: 280,
    bioEn: 'High-tech and corporate communication specialist preparing professionals for Israeli job interviews and business meetings.',
    bioHe: 'הכנה ממוקדת לראיונות עבודה בהייטק, פגישות עסקיות ותכתובת מקצועית בעברית.',
    bioAr: 'إعداد احترافي للمقابلات الوظيفية والاجتماعات وبيئة العمل في مجالات الأعمال والتكنولوجيا.',
    badges: ['Business Specialist', 'Interview Prep', '5.0 Star'],
    isActive: true,
    order: 3,
    createdAt: new Date().toISOString(),
  },
];

// GET Teacher Videos (Public with Redis cache)
router.get('/teacher-videos', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const videos = await getCachedOrFetch('settings:teacher-videos', 60, async () => {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'teacher_videos' },
      });
      if (setting && Array.isArray((setting.valueJson as any)?.videos)) {
        return (setting.valueJson as any).videos;
      }
      return DEFAULT_TEACHER_VIDEOS;
    });

    res.json({ videos });
  } catch (error) {
    next(error);
  }
});

// UPDATE / SAVE All Teacher Videos List (Admin only)
router.put(
  '/teacher-videos',
  authenticate,
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const videos = Array.isArray(req.body.videos) ? req.body.videos : req.body;
      const setting = await prisma.systemSetting.upsert({
        where: { key: 'teacher_videos' },
        update: { valueJson: { videos } },
        create: {
          key: 'teacher_videos',
          valueJson: { videos },
        },
      });

      await cacheDel('settings:teacher-videos');
      res.json({
        message: 'Teacher videos updated successfully!',
        videos: (setting.valueJson as any)?.videos || [],
      });
    } catch (error) {
      next(error);
    }
  }
);

// ADD Single Teacher Video (Admin only)
router.post(
  '/teacher-videos',
  authenticate,
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'teacher_videos' },
      });
      const currentVideos: TeacherVideo[] =
        setting && Array.isArray((setting.valueJson as any)?.videos)
          ? (setting.valueJson as any).videos
          : DEFAULT_TEACHER_VIDEOS;

      const newVideo: TeacherVideo = {
        id: `vid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        teacherId: req.body.teacherId || '',
        teacherName: req.body.teacherName || 'Teacher',
        teacherNameHe: req.body.teacherNameHe || req.body.teacherName,
        teacherNameAr: req.body.teacherNameAr || req.body.teacherName,
        avatarUrl: req.body.avatarUrl || '',
        title: req.body.title || 'Teacher Introduction',
        titleHe: req.body.titleHe || req.body.title,
        titleAr: req.body.titleAr || req.body.title,
        videoUrl: req.body.videoUrl || '',
        thumbnailUrl: req.body.thumbnailUrl || '',
        duration: req.body.duration || '0:30',
        specialtyEn: req.body.specialtyEn || 'Hebrew Mentor',
        specialtyHe: req.body.specialtyHe || 'מורה לעברית',
        specialtyAr: req.body.specialtyAr || 'معلم عبرية',
        rating: req.body.rating || '5.0',
        lessonsCount: Number(req.body.lessonsCount) || 50,
        bioEn: req.body.bioEn || '',
        bioHe: req.body.bioHe || '',
        bioAr: req.body.bioAr || '',
        badges: Array.isArray(req.body.badges) ? req.body.badges : ['Native Speaker'],
        isActive: req.body.isActive !== false,
        order: currentVideos.length + 1,
        createdAt: new Date().toISOString(),
      };

      const updatedVideos = [newVideo, ...currentVideos];

      await prisma.systemSetting.upsert({
        where: { key: 'teacher_videos' },
        update: { valueJson: { videos: updatedVideos } as any },
        create: {
          key: 'teacher_videos',
          valueJson: { videos: updatedVideos } as any,
        },
      });

      await cacheDel('settings:teacher-videos');
      res.status(201).json({
        message: 'Teacher video added successfully!',
        video: newVideo,
        videos: updatedVideos,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE Teacher Video (Admin only)
router.delete(
  '/teacher-videos/:id',
  authenticate,
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'teacher_videos' },
      });
      const currentVideos: TeacherVideo[] =
        setting && Array.isArray((setting.valueJson as any)?.videos)
          ? (setting.valueJson as any).videos
          : DEFAULT_TEACHER_VIDEOS;

      const filteredVideos = currentVideos.filter((v) => v.id !== id);

      await prisma.systemSetting.upsert({
        where: { key: 'teacher_videos' },
        update: { valueJson: { videos: filteredVideos } as any },
        create: {
          key: 'teacher_videos',
          valueJson: { videos: filteredVideos } as any,
        },
      });

      await cacheDel('settings:teacher-videos');
      res.json({
        message: 'Teacher video removed successfully!',
        videos: filteredVideos,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
