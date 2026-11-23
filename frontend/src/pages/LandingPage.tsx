import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useTranslation } from '../hooks/useTranslation';
import { useAuthStore } from '../store/authStore';
import { PriceDisplay } from '../components/common/PriceDisplay';
import { haptics } from '../utils/haptics';
import { formatWhatsAppUrl } from '../utils/whatsapp';
import { getAvatarUrl } from '../utils/avatar';
import {
  WhatsAppIcon,
  InstagramIcon,
  YouTubeIcon,
  TelegramIcon,
} from '../components/common/SocialIcons';
import {
  Video,
  Award,
  Sparkles,
  CheckCircle2,
  Check,
  Clock,
  Gamepad2,
  ArrowRight,
  FolderOpen,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
  X,
  Film,
  Star,
  Globe2,
  Users,
  GraduationCap,
  ExternalLink,
  BookOpen,
  Heart,
  TrendingUp,
  ShieldCheck,
  Zap,
  Calendar,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { t, language } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const isAr = language === 'ar';
  const isHe = language === 'he';
  const isRtl = isAr || isHe;
  const loc = (ar: string, he: string, en: string) => (isAr ? ar : isHe ? he : en);

  // Audio preview state for interactive Alef-Bet widget
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Fetch real-time CMS settings from backend
  const { data: settingsData } = useQuery({
    queryKey: ['landingSettings'],
    queryFn: async () => {
      const res = await api.get('/settings/landing-page');
      return res.data?.config;
    },
    staleTime: 1000 * 60 * 2,
  });

  // Fetch dynamic packages from database
  const { data: packagesData } = useQuery({
    queryKey: ['landingPackages'],
    queryFn: async () => {
      const res = await api.get('/packages');
      return res.data?.packages;
    },
    staleTime: 1000 * 60 * 5,
  });

  // State & query for Teacher Introductory Videos
  const [activeTeacherVideo, setActiveTeacherVideo] = useState<any | null>(null);
  const { data: teacherVideosData } = useQuery({
    queryKey: ['landingTeacherVideos'],
    queryFn: async () => {
      const res = await api.get('/settings/teacher-videos');
      return res.data?.videos || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const teacherVideos = (teacherVideosData || []).filter((v: any) => v.isActive !== false);

  const config = settingsData || {};

  // Trilingual fallbacks
  const badge = isAr
    ? config.badgeAr || t('landing.badge') || 'الأكاديمية الرائدة لتعليم اللغة العبرية والإنجليزية'
    : isHe
    ? config.badgeHe || 'האקדמיה המובילה לעברית ואנגלית'
    : config.badgeEn || 'Premier Modern Hebrew & English Academy';

  const heroTitle = isAr
    ? config.heroTitleAr || t('landing.heroTitle') || 'تحدث العبرية المعاصرة بطلاقة وثقة تامة'
    : isHe
    ? config.heroTitleHe || 'לדבר עברית מודרנית בביטחון ובטבעיות'
    : config.heroTitleEn || 'Speak Real Modern Hebrew with Confident Fluency';

  const heroSubtitle = isAr
    ? config.heroSubtitleAr ||
      t('landing.heroSubtitle') ||
      'حصص فردية مباشرة مركزة مدتها 25 دقيقة مع معلمين ناطقين أصليين، ألعاب تفاعلية، تسجيلات فيديو لكل درس، ومتابعة دقيقة مخصصة لسرعة تقدمك.'
    : isHe
    ? config.heroSubtitleHe ||
      'שיעורים פרטיים ממוקדים של 25 דקות עם מורים מוסמכים מישראל, משחקים חווייתיים, הקלטות וידאו לכל שיעור וליווי אישי מותאם לקצב שלך.'
    : config.heroSubtitleEn ||
      'Live 1-on-1 private video lessons (25-minute focused sessions) with certified native tutors in Israel, interactive gamification, and permanent cloud recordings.';

  const ctaStudent = isAr
    ? config.ctaStudentAr || t('landing.ctaStudent') || 'الانتقال إلى لوحة التحكم'
    : isHe
    ? config.ctaStudentHe || 'מעבר ללוח הבקרה שלי'
    : config.ctaStudentEn || 'Go to My Dashboard';

  const ctaLogin = isAr
    ? config.ctaLoginAr || t('landing.ctaLogin') || 'ابدأ التعلم الآن'
    : isHe
    ? config.ctaLoginHe || 'התחל ללמוד עכשיו'
    : config.ctaLoginEn || 'Start Learning Today';

  const announcement = isAr
    ? config.announcementAr || 'عرض خاص: احصل على 50 نقطة إضافية وتسجيل فيديو كامل مع أول حصة دراسية لك!'
    : isHe
    ? config.announcementHe || 'מבצע מיוחד: 50 נקודות בונוס XP והקלטת וידאו לכל שיעור ראשון'
    : config.announcementEn || 'Special Offer: 50 Bonus XP points and full video recording included with your first lesson';

  // Stats Counters
  const stats = config.stats && config.stats.length > 0 ? config.stats : [
    {
      num: '500+',
      labelEn: 'Active Hebrew Learners',
      labelHe: 'תלמידים פעילים בעולם',
      labelAr: 'متعلم نشط للغة العبرية',
      icon: 'users',
    },
    {
      num: '2,400+',
      labelEn: '25-Min Focused Lessons',
      labelHe: 'שיעורים ממוקדים של 25 דק׳',
      labelAr: 'حصة مركزة (25 دقيقة)',
      icon: 'clock',
    },
    {
      num: '98.8%',
      labelEn: 'Fluency Retention Rate',
      labelHe: 'שיעור הצלחה ושימור שפה',
      labelAr: 'معدل الاحتفاظ باللغة والطلاقة',
      icon: 'trending',
    },
    {
      num: '4.95 / 5',
      labelEn: 'Average Teacher Rating',
      labelHe: 'דירוג מורים ממוצע',
      labelAr: 'متوسط تقييم المعلمين',
      icon: 'star',
    },
  ];

  // Core Features
  const features =
    config.features && config.features.length > 0
      ? config.features
      : [
          {
            icon: 'video',
            titleEn: '25-Minute Focused Live Lessons',
            titleHe: 'שיעורים חיים ממוקדים של 25 דקות',
            titleAr: 'حصص مباشرة مركزة مدتها 25 دقيقة',
            descEn:
              'High-intensity 25-minute private 1-on-1 sessions designed for maximum cognitive retention without fatigue.',
            descHe: 'מפגשים אישיים של 25 דקות המתוכננים לקליטה מיטבית וללא עומס קוגניטיבי.',
            descAr: 'جلسات فردية تفاعلية ومكثفة مدتها 25 دقيقة مصممة لتحقيق أعلى استيعاب ذهني دون أي إجهاد.',
          },
          {
            icon: 'gamepad',
            titleEn: 'Real Hebrew Interactive Games',
            titleHe: 'משחקי שפה אינטראקטיביים אמיתיים',
            titleAr: 'ألعاب تعليمية تفاعلية للغة العبرية',
            descEn:
              'Interactive 3D Alef-Bet flashcards with native audio pronunciation, timed vocabulary quizzes, and matching challenges.',
            descHe: 'כרטיסיות תלת-ממד עם הגייה קולית, חידונים מתוזמנים ואתגרי התאמת מילים לצבירת נקודות.',
            descAr: 'بطاقات Alef-Bet ثلاثية الأبعاد مع نطق صوتي أصلي، مسابقات كلمات سريعة، وتحديات مطابقة لكسب النقاط.',
          },
          {
            icon: 'drive',
            titleEn: 'Lesson Recordings & Notes',
            titleHe: 'הקלטות וידאו וסיכומי שיעור',
            titleAr: 'تسجيلات الدروس وملاحظات المعلم',
            descEn:
              'Access Google Drive recordings and teacher notes after every class to review grammar and vocabulary anytime.',
            descHe: 'גישה נוחה להקלטות Google Drive ולהערות המורה לאחר כל מפגש לחיזוק הלמידה.',
            descAr: 'وصول مباشر لتسجيلات Google Drive وملاحظات المعلم التفصيلية بعد كل حصة لمراجعة المفردات في أي وقت.',
          },
        ];

  // Testimonials
  const defaultTestimonials = [
    {
      name: 'Michael Bronstein',
      location: isAr ? 'نيويورك، الولايات المتحدة' : 'New York, USA',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      rating: 5,
      levelTag: loc('ألف - مبتدئ', 'רמה א׳ - מתחיל', 'Alef - Beginner'),
      teacherName: 'Maya Ben-David',
      textEn:
        'The 25-minute format is a genius invention! I can easily fit a lesson during my lunch break. My teacher explains Hebrew verb roots (Shoresh) with incredible clarity.',
      textHe:
        'מתכונת 25 הדקות היא פשוט המצאה גאונית! אני קובע שיעור בהפסקת הצהריים בעבודה. המורה מסבירה שורשים ודקדוק בבהירות מדהימה.',
      textAr:
        'نظام الـ 25 دقيقة فكرة عبقرية بحق! يمكنني حضور حصة بسهولة أثناء استراحة الغداء. المعلمة تشرح جذور الأفعال وقواعد الصرف بوضوح فائق.',
    },
    {
      name: 'Rachel Dayan',
      location: isAr ? 'لندن، المملكة المتحدة' : 'London, UK',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
      rating: 5,
      levelTag: loc('بيت - أساسي', 'רמה ב׳ - יסודי', 'Bet - Elementary'),
      teacherName: 'Daniel Mizrahi',
      textEn:
        'The Google Drive recorded sessions and interactive games make revision so engaging. I went from zero to holding full conversations with Israeli relatives in 3 months!',
      textHe:
        'הקלטות הווידאו ומשחקי השפה עם הנקודות עושים את כל ההבדל. התחלתי מאפס והיום אני מנהלת שיחות חופשיות עם המשפחה בישראל!',
      textAr:
        'تسجيلات الفيديو على Google Drive وألعاب النقاط تجعل المراجعة ممتعة للغاية. بدأت من الصفر والآن أتحدث بطلاقة مع أقاربي بعد 3 أشهر فقط!',
    },
    {
      name: 'Daniel Chen',
      location: isAr ? 'تورونتو، كندا' : 'Toronto, Canada',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      rating: 5,
      levelTag: loc('جيمل - متوسط', 'רמה ג׳ - בינוני', 'Gimel - Intermediate'),
      teacherName: 'Noam Levi',
      textEn:
        'Strict Israel Timing (IDT) schedule and 1-on-1 focus makes Engrew the most authentic and reliable Hebrew academy available. Noam is patient and exceptionally skilled.',
      textHe:
        'סנכרון מדויק לשעון ישראל ויחס אישי של אחד-על-אחד הפכו את Engrew לפלטפורמה הכי מקצועית שיש. נעם סבלני ומלמד בצורה מעולה.',
      textAr:
        'التزامن الدقيق مع توقيت إسرائيل والتركيز الفردي 1-على-1 جعل إنجرو المنصة الأكثر احترافية ومصداقية. نوعام صبور وأسلوبه ممتاز في التدريس.',
    },
    {
      name: 'Sophie Laurent',
      location: isAr ? 'باريس، فرنسا' : 'Paris, France',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
      rating: 5,
      levelTag: loc('دالت - فوق المتوسط', 'רמה ד׳ - מתקדם נמוך', 'Dalet - Upper Intermediate'),
      teacherName: 'Liora Katz',
      textEn:
        'I work in tech and needed conversational Hebrew for meetings in Tel Aviv. The specialized vocabulary and slang focus helped me pass my Israeli job interview!',
      textHe:
        'אני עובדת בהייטק והייתי צריכה עברית עסקית לפגישות בתל אביב. אוצר המילים המעשי והסלנג עזרו לי לעבור ראיון עבודה בחברה ישראלית!',
      textAr:
        'أعمل في مجال التكنولوجيا وكنت بحاجة للعبرية المعاصرة لاجتماعات تل أبيب. التركيز على المفردات المهنية ساعدني في اجتياز مقابلة العمل بنجاح!',
    },
    {
      name: 'David Miller',
      location: isAr ? 'ميامي، فلوريدا' : 'Miami, Florida',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
      rating: 5,
      levelTag: loc('ألف - مبتدئ', 'רמה א׳ - מתחיל', 'Alef - Beginner'),
      teacherName: 'Talia Friedman',
      textEn:
        'The homework assignments with the built-in PDF viewer and teacher audio feedback are top notch. I look forward to my lessons every Tuesday and Thursday.',
      textHe:
        'שיעורי הבית עם צפיית ה-PDF המובנית ומשובי השמע מהמורה ברמה הגבוהה ביותר. אני מחכה לשיעורים שלי בכל שלישי וחמישי.',
      textAr:
        'الواجبات المنزلية مع قارئ PDF المدمج والملاحظات الصوتية من المعلمة ممتازة للغاية. أنتظر حصصي بشغف كل ثلاثاء وخميس.',
    },
    {
      name: 'Elena Rostova',
      location: isAr ? 'برلين، ألمانيا' : 'Berlin, Germany',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      rating: 5,
      levelTag: loc('جيمل - متوسط', 'רמה ג׳ - בינוני', 'Gimel - Intermediate'),
      teacherName: 'Erez Golan',
      textEn:
        'The XP leaderboard and gamification kept me motivated daily. Erez is such an encouraging teacher who makes complex binyanim easy to understand.',
      textHe:
        'לוח המובילים והמשחקים שמרו על המוטיבציה שלי בכל יום. ארז מורה מעודד שמפשט גזרות ובניינים מורכבים בצורה קלה להבנה.',
      textAr:
        'لوحة المتصدرين ونقاط الألعاب تحفزني يومياً. إيريز معلم رائع يبسط القواعد المعقدة وأوزان الأفعال بطريقة سهلة وممتعة جداً.',
    },
    {
      name: 'Julian Meyer',
      location: isAr ? 'زيورخ، سويسرا' : 'Zurich, Switzerland',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
      rating: 5,
      levelTag: loc('هي - متقدم', 'רמה ה׳ - מתקדם', 'Hei - Advanced'),
      teacherName: 'Maya Ben-David',
      textEn:
        'After studying Hebrew in university for years, Engrew finally gave me the spontaneous speaking confidence I lacked. The 25m private format is unbeatable.',
      textHe:
        'אחרי שנים של לימוד עברית באוניברסיטה, Engrew סוף סוף העניקה לי את הביטחון לדבר בספונטניות. הפורמט של 25 דקות פשוט מנצח.',
      textAr:
        'بعد سنوات من دراسة العبرية في الجامعة، منحتني إنجرو أخيراً الثقة في التحدث التلقائي. نظام الحصص الفردية 25 دقيقة لا يُعلى عليه.',
    },
    {
      name: 'Sarah Al-Mansoor',
      location: isAr ? 'دبي، الإمارات' : 'Dubai, UAE',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200',
      rating: 5,
      levelTag: loc('ألف - مبتدئ', 'רמה א׳ - מתחיל', 'Alef - Beginner'),
      teacherName: 'Karim Mahmoud',
      textEn:
        'The teachers are culturally welcoming and so patient. Learning the Alef-Bet through the interactive 3D flashcards was smooth and enjoyable.',
      textHe:
        'המורים מקבלים בחום ובסבלנות רבה. לימוד האלף-בית דרך כרטיסיות השמע האינטראקטיביות היה מהנה וקל להפליא.',
      textAr:
        'المعلمون ودودون وصبورون للغاية. تعلمت حروف الأبجدية عبر بطاقات الفلاش ثلاثية الأبعاد بنطق واضح وكان الأمر ممتعاً وسلساً.',
    },
    {
      name: 'Marcos Silva',
      location: isAr ? 'بوينس آيرس، الأرجنتين' : 'Buenos Aires, Argentina',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200',
      rating: 5,
      levelTag: loc('بيت - أساسي', 'רמה ב׳ - יסודי', 'Bet - Elementary'),
      teacherName: 'Noam Levi',
      textEn:
        'Great platform! Fast booking, instant Zoom links, and my sessions balance is clearly visible. Every minute of the 25 minutes is utilized efficiently.',
      textHe:
        'פלטפורמה נהדרת! קביעת שיעורים מהירה, קישורי זום מיידיים ומכסת שיעורים שקופה. כל דקה מ-25 הדקות מנוצלת ביעילות מקסימלית.',
      textAr:
        'منصة ممتازة وسريعة الحجز، روابط Zoom فورية ورصيد الحصص واضح ومباشر. كل دقيقة من الـ 25 دقيقة تُستثمر بأعلى كفاءة.',
    },
  ];

  const testimonials =
    config.testimonials && config.testimonials.length > 0
      ? config.testimonials
      : defaultTestimonials;

  // Social Media Links (CMS Managed)
  const socials = config?.socials || {};
  const hasSocialLink = (url?: string): boolean => {
    return typeof url === 'string' && url.trim().length > 0;
  };
  const hasAnySocials = ['whatsapp', 'instagram', 'youtube', 'telegram'].some((key) =>
    hasSocialLink(socials[key as keyof typeof socials])
  );

  // Curated Interactive Soundboard Words
  const soundboardWords = [
    { he: 'שָׁלוֹם', phonetic: 'Sha-lom', trans: loc('مرحباً / سلام', 'שלום / ברכה', 'Hello & Peace') },
    { he: 'סַבָּבָה', phonetic: 'Sa-ba-ba', trans: loc('رائع / تمام', 'מעולה / אחלה', 'Awesome & Great') },
    { he: 'תּוֹדָה רַבָּה', phonetic: 'To-da Ra-ba', trans: loc('شكراً جزيلاً', 'תודה מעומק הלב', 'Thank you very much') },
    { he: 'מַה נִּשְׁמַע?', phonetic: 'Ma Nish-ma?', trans: loc('كيف الحال؟ / شو الأخبار؟', 'איך הולך?', "How's it going?") },
    { he: 'יַאלְלָה!', phonetic: 'Yal-la!', trans: loc('يلا! / هيا بنا!', 'קדימה / זזנו', "Let's do this!") },
    { he: 'בְּתֵאָבוֹן', phonetic: 'Be-te-a-von', trans: loc('بالهناء والشفاء / صحتين', 'אכילה מהנה', 'Bon Appétit') },
  ];

  // Interactive Hebrew Pronunciation Sample
  const playSampleAudio = (text: string) => {
    haptics.tap();
    setPlayingWord(text);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'he-IL';
      utterance.rate = 0.85;
      utterance.onend = () => setPlayingWord(null);
      utterance.onerror = () => setPlayingWord(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setPlayingWord(null), 1200);
    }
  };

  const getFeatureIcon = (iconName: string) => {
    switch (iconName) {
      case 'gamepad':
        return <Gamepad2 className="w-6 h-6" />;
      case 'drive':
        return <FolderOpen className="w-6 h-6" />;
      default:
        return <Video className="w-6 h-6" />;
    }
  };

  const faqs =
    config.faqs && config.faqs.length > 0
      ? config.faqs
      : [
          {
            qEn: 'Why are lessons strictly 25 minutes long?',
            qHe: 'למה השיעורים הם בדיוק 25 דקות?',
            qAr: 'لماذا مدة الحصص 25 دقيقة تحديداً؟',
            aEn: 'Cognitive linguistics research demonstrates that intensive 25-minute 1-on-1 language sessions yield up to 40% higher retention compared to long 60-minute classes, eliminating attention fatigue.',
            aHe: 'מחקרים בבלשנות קוגניטיבית מראים שמפגשים ממוקדים של 25 דקות מאפשרים קליטה וזיכרון גבוהים ב-40% ביחס לשיעורים ארוכים ומעייפים.',
            aAr: 'تؤكد أبحاث اللسانيات المعرفية أن الحصص الفردية المكثفة لمدة 25 دقيقة تحقق نسبة استيعاب وحفظ أعلى بنسبة تصل إلى 40% مقارنة بالحصص الطويلة الممتدة لـ 60 دقيقة، مع تفادي التشتت والإرهاق الذهني.',
          },
          {
            qEn: 'What time zone are the lesson slots based on?',
            qHe: 'לפי איזה אזור זמן נקבעים השיעורים?',
            qAr: 'وفقاً لأي منطقة زمنية يتم جدولة الحصص؟',
            aEn: 'All schedules coordinate with Israel Timing (IDT/IST, UTC+2 / UTC+3 in Tel Aviv & Jerusalem) and are automatically displayed in clean 12-hour AM/PM format.',
            aHe: 'כל לוחות הזמנים מסונכרנים לשעון ישראל (UTC+2 / UTC+3) ומוצגים בפורמט נוח של 12 שעות עם ציון AM ו-PM.',
            aAr: 'جميع مواعيد الحصص منسقة بدقة وفقاً لتوقيت إسرائيل (UTC+2 / UTC+3 في القدس وتل أبيب)، ويتم عرضها بوضوح بنظام 12 ساعة مع مؤشرات AM وPM لتسهيل الاختيار.',
          },
          {
            qEn: 'How do Google Drive recordings work?',
            qHe: 'כיצד פועלות הקלטות השיעורים ב-Google Drive?',
            qAr: 'كيف تعمل تسجيلات الدروس على Google Drive؟',
            aEn: 'Following every 25-minute class, your teacher attaches a secure Google Drive video link directly to your student dashboard alongside vocabulary notes.',
            aHe: 'בסיום כל שיעור, המורה מצרף קישור וידאו ישיר מ-Google Drive ללוח הבקרה שלך יחד עם סיכום אוצר המילים וההערות.',
            aAr: 'بعد انتهاء كل حصة مدتها 25 دقيقة، يرفق معلمك رابط فيديو آمن على Google Drive مباشرة في لوحة تحكم الطالب الخاصة بك بالإضافة إلى ملخص القواعد والمفردات.',
          },
          {
            qEn: 'Can I earn points by playing the language games?',
            qHe: 'האם צבירת נקודות במשחקים משפיעה על הדירוג?',
            qAr: 'هل يمكنني كسب نقاط خبرة من خلال الألعاب التعليمية؟',
            aEn: 'Yes! Playing 3D flashcards, quizzes, and word matching earns gamification points that rank you on the public Hebrew Academy leaderboard.',
            aHe: 'כן בהחלט! תרגול בכרטיסיות שמע, חידונים והתאמות מילים מעניק נקודות שמקדמות אותך בלוח המובילים של האקדמיה.',
            aAr: 'نعم بالتأكيد! التدرب عبر بطاقات الفلاش ثلاثية الأبعاد، المسابقات التفاعلية، ومطابقة الكلمات يمنحك نقاطاً ترفع ترتيبك في لوحة صدارة الأكاديمية.',
          },
        ];

  // Duration Switcher State: 25 min | 40 min | 55 min
  const [selectedDuration, setSelectedDuration] = useState<number>(25);

  const fallbackPackagesByDuration: Record<number, any[]> = {
    25: [
      { id: '1db0c871-1ba9-4a88-8633-7fceac117649', name: '1 lesson a week', nameHe: 'פעם בשבוע', totalLessons: 4, price: 99, originalPrice: 119, isPopular: false },
      { id: 'd820bbaa-d1b6-4bb0-b23e-27f0b2d56b35', name: '2 lessons a week', nameHe: 'שני שיעורים בשבוע', totalLessons: 8, price: 190, originalPrice: 219, isPopular: false },
      { id: 'd8999585-a113-485e-bd62-87fe9a9cceaf', name: '3 lessons a week', nameHe: 'שלושה שיעורים בשבוע', totalLessons: 12, price: 270, originalPrice: 294, isPopular: true },
      { id: '31a4f5f9-b334-40e0-a737-5dcb3086ae44', name: '4 lessons a week', nameHe: '4 שיעורים בשבוע', totalLessons: 16, price: 340, originalPrice: 360, isPopular: false },
    ],
    40: [
      { id: 'd1fb2d17-1513-47db-add5-047ec7536d98', name: '1 lesson a week', nameHe: 'שיעור בשבוע', totalLessons: 4, price: 150, originalPrice: 164, isPopular: false },
      { id: '74d4e967-b17e-46af-bd9b-8bed9d8d5b7d', name: '2 lessons a week', nameHe: 'שני שיעורים בשבוע', totalLessons: 8, price: 295, originalPrice: 319, isPopular: false },
      { id: 'e8bbdd12-7570-425b-b874-1f309bcedb78', name: '3 lessons a week', nameHe: 'שלושה שיעורים בשבוע', totalLessons: 12, price: 420, originalPrice: 440, isPopular: true },
      { id: 'd3b5375f-e492-4ef4-a8ff-8b0b150069ca', name: '4 lessons a week', nameHe: '4 שיעורים בשבוע', totalLessons: 16, price: 535, originalPrice: 555, isPopular: false },
    ],
    55: [
      { id: 'ab3c3f62-7b1d-4118-ac87-0d50ccb703a7', name: '1 lesson a week', nameHe: 'שיעור בשבוע', totalLessons: 4, price: 190, originalPrice: 209, isPopular: false },
      { id: 'd20299a4-f0e6-4ba4-900c-92fe60562f95', name: '2 lessons a week', nameHe: 'שני שיעורים בשבוע', totalLessons: 8, price: 359, originalPrice: 379, isPopular: false },
      { id: 'bc72a182-bc59-436f-8f76-6e8e354f147e', name: '3 lessons a week', nameHe: '3 שיעורים בשבוע', totalLessons: 12, price: 469, originalPrice: 486, isPopular: true },
      { id: 'bd5ec5f6-574f-478e-9d18-c73d1df08878', name: '4 lessons a week', nameHe: '4 שיעורים בשבוע', totalLessons: 16, price: 590, originalPrice: 612, isPopular: false },
    ],
  };

  const getPackageDuration = (pkg: any): number => {
    const firstSi = pkg.sessionItems?.[0];
    if (firstSi?.sessionType?.durationMinutes) {
      return Number(firstSi.sessionType.durationMinutes);
    }
    const txt = `${pkg.name || ''} ${pkg.nameHe || ''} ${pkg.description || ''} ${pkg.descriptionHe || ''}`.toLowerCase();
    if (txt.includes('55') || txt.includes('deep dive')) return 55;
    if (txt.includes('40') || txt.includes('standard')) return 40;
    return 25;
  };

  const displayPackages = useMemo(() => {
    const active = (packagesData || []).filter((p: any) => p.isActive !== false);
    const matched = active.filter((p: any) => getPackageDuration(p) === selectedDuration);
    if (matched.length > 0) {
      return [...matched].sort((a: any, b: any) => (Number(a.totalLessons) || 0) - (Number(b.totalLessons) || 0));
    }
    return fallbackPackagesByDuration[selectedDuration] || fallbackPackagesByDuration[25];
  }, [packagesData, selectedDuration]);

  const getWeeklyFrequency = (pkg: any) => {
    const lessons = Number(pkg.totalLessons) || 4;
    if (lessons <= 4) return loc('درس واحد أسبوعياً', 'שיעור אחד בשבוע', '1 lesson a week');
    if (lessons <= 8) return loc('درسان أسبوعياً', '2 שיעורים בשבוע', '2 lessons a week');
    if (lessons <= 12) return loc('3 دروس أسبوعياً', '3 שיעורים בשבוע', '3 lessons a week');
    return loc('4 دروس أسبوعياً', '4 שיעורים בשבוע', '4 lessons a week');
  };

  // Feedback Carousel State (Manual Only - Never Auto-Scrolls the page)
  const feedbackScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollFeedbackLeft, setCanScrollFeedbackLeft] = useState(false);
  const [canScrollFeedbackRight, setCanScrollFeedbackRight] = useState(true);
  const [activeFeedbackIndex, setActiveFeedbackIndex] = useState(0);

  const isFeedbackMouseDownRef = useRef(false);
  const feedbackStartXRef = useRef(0);
  const feedbackScrollLeftRef = useRef(0);
  const hasFeedbackDraggedRef = useRef(false);

  const updateFeedbackScrollButtons = () => {
    if (!feedbackScrollRef.current) return;
    const container = feedbackScrollRef.current;
    const cards = container.querySelectorAll<HTMLElement>(':scope > div');
    if (!cards.length) return;

    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;

    let closestIndex = 0;
    let minDistance = Infinity;

    cards.forEach((card, idx) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const dist = Math.abs(cardCenter - containerCenter);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = idx;
      }
    });

    setActiveFeedbackIndex(closestIndex);

    const isRtl = language === 'he' || language === 'ar';
    if (isRtl) {
      setCanScrollFeedbackLeft(closestIndex < cards.length - 1);
      setCanScrollFeedbackRight(closestIndex > 0);
    } else {
      setCanScrollFeedbackLeft(closestIndex > 0);
      setCanScrollFeedbackRight(closestIndex < cards.length - 1);
    }
  };

  useEffect(() => {
    const container = feedbackScrollRef.current;
    if (!container) return;
    updateFeedbackScrollButtons();
    container.addEventListener('scroll', updateFeedbackScrollButtons, { passive: true });
    window.addEventListener('resize', updateFeedbackScrollButtons);
    return () => {
      container.removeEventListener('scroll', updateFeedbackScrollButtons);
      window.removeEventListener('resize', updateFeedbackScrollButtons);
    };
  }, [testimonials.length, language]);

  const scrollFeedback = (direction: 'left' | 'right') => {
    if (!feedbackScrollRef.current) return;
    haptics.tap();
    const container = feedbackScrollRef.current;
    const cards = container.querySelectorAll<HTMLElement>(':scope > div');
    if (!cards.length) return;

    const isRtl = language === 'he' || language === 'ar';
    let targetIndex = activeFeedbackIndex;
    if (direction === 'left') {
      targetIndex = isRtl ? activeFeedbackIndex + 1 : activeFeedbackIndex - 1;
    } else {
      targetIndex = isRtl ? activeFeedbackIndex - 1 : activeFeedbackIndex + 1;
    }

    targetIndex = Math.max(0, Math.min(targetIndex, cards.length - 1));

    const targetCard = cards[targetIndex];
    if (targetCard) {
      const containerRect = container.getBoundingClientRect();
      const cardRect = targetCard.getBoundingClientRect();
      const offset = cardRect.left - containerRect.left - (containerRect.width / 2 - cardRect.width / 2);
      container.scrollBy({ left: offset, behavior: 'smooth' });
      setActiveFeedbackIndex(targetIndex);
    }
  };

  const scrollFeedbackToIndex = (index: number) => {
    if (!feedbackScrollRef.current) return;
    haptics.tap();
    const container = feedbackScrollRef.current;
    const cards = container.querySelectorAll<HTMLElement>(':scope > div');
    const targetCard = cards[index];
    if (targetCard) {
      const containerRect = container.getBoundingClientRect();
      const cardRect = targetCard.getBoundingClientRect();
      const offset = cardRect.left - containerRect.left - (containerRect.width / 2 - cardRect.width / 2);
      container.scrollBy({ left: offset, behavior: 'smooth' });
      setActiveFeedbackIndex(index);
    }
  };

  const handleFeedbackMouseDown = (e: React.MouseEvent) => {
    if (!feedbackScrollRef.current) return;
    isFeedbackMouseDownRef.current = true;
    hasFeedbackDraggedRef.current = false;
    feedbackStartXRef.current = e.pageX - feedbackScrollRef.current.offsetLeft;
    feedbackScrollLeftRef.current = feedbackScrollRef.current.scrollLeft;
  };

  const handleFeedbackMouseMove = (e: React.MouseEvent) => {
    if (!isFeedbackMouseDownRef.current || !feedbackScrollRef.current) return;
    const x = e.pageX - feedbackScrollRef.current.offsetLeft;
    const walk = x - feedbackStartXRef.current;
    if (Math.abs(walk) > 5) {
      hasFeedbackDraggedRef.current = true;
    }
    feedbackScrollRef.current.scrollLeft = feedbackScrollLeftRef.current - walk;
  };

  const handleFeedbackMouseUpOrLeave = () => {
    isFeedbackMouseDownRef.current = false;
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-10 sm:space-y-20 pb-20">
      {/* HERO SECTION */}
      <section className="relative pt-6 sm:pt-16 pb-12 sm:pb-24 overflow-hidden w-full max-w-full">
        {/* Modern Luminous Background Atmosphere - Clear, Modern & Professional */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-teal-50/60 via-white to-slate-50/30 dark:from-slate-950 dark:via-slate-900/60 dark:to-slate-950 pointer-events-none" />

        {/* Soft Radial Spotlight from top center */}
        <div className="absolute top-0 start-1/2 -translate-x-1/2 w-full max-w-7xl h-[42rem] bg-[radial-gradient(ellipse_75%_55%_at_50%_0%,rgba(77,167,197,0.14),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_75%_55%_at_50%_0%,rgba(12,74,96,0.35),rgba(2,6,23,0))] pointer-events-none" />

        {/* Crisp Architectural Micro-Grid (Subtle & High-Tech) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c4a600a_1px,transparent_1px),linear-gradient(to_bottom,#0c4a600a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff07_1px,transparent_1px),linear-gradient(to_bottom,#ffffff07_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_55%_at_50%_15%,#000_50%,transparent_100%)] pointer-events-none" />

        {/* Subtle Horizontal Ambient Accent Horizon Line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-teal-500/25 dark:via-brand-teal-400/30 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10 w-full min-w-0">
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-12 items-center w-full min-w-0">
            
            {/* Left Column: Core Value Proposition & CTAs */}
            <div className="lg:col-span-7 text-start space-y-3.5 sm:space-y-5 w-full min-w-0">
              {/* Real-time CMS Announcement Pill */}
              {announcement && (
                <div className="inline-flex max-w-full items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-teal-50/90 dark:bg-brand-teal-950/80 border border-brand-teal-200/80 dark:border-brand-teal-800/80 text-brand-teal-950 dark:text-brand-teal-200 text-[10px] sm:text-xs font-semibold shadow-2xs backdrop-blur-md">
                  <Sparkles className="w-3 h-3 text-brand-olive-600 dark:text-brand-olive-400 shrink-0" />
                  <span className="truncate">{announcement}</span>
                </div>
              )}

              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-gradient-to-r from-brand-olive-100 to-brand-olive-50 dark:from-brand-olive-950/90 dark:to-brand-olive-900/80 text-brand-olive-900 dark:text-brand-olive-300 text-[10px] sm:text-[11px] font-black uppercase rounded-full tracking-wider border border-brand-olive-300/70 dark:border-brand-olive-800 shadow-2xs mb-2 sm:mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{badge}</span>
                </div>

                <h1 className="text-xl sm:text-3xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-snug sm:leading-[1.15] break-words whitespace-normal">
                  {heroTitle}
                </h1>
              </div>

              <p className="text-xs sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal max-w-2xl">
                {heroSubtitle}
              </p>

              {/* Action Buttons */}
              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full">
                {user ? (
                  <Link
                    to={
                      user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
                        ? '/admin'
                        : user.role === 'TEACHER'
                        ? '/teacher'
                        : '/student'
                    }
                    onClick={() => haptics.tap()}
                    className="w-full sm:w-auto px-5 sm:px-8 py-2.5 sm:py-3.5 text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-brand-teal-800 to-brand-teal-950 hover:from-brand-teal-700 hover:to-brand-teal-900 rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-2 group ring-2 ring-brand-teal-600/30 text-center"
                  >
                    <span>{ctaStudent}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => haptics.tap()}
                    className="w-full sm:w-auto px-5 sm:px-8 py-2.5 sm:py-3.5 text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-brand-teal-800 to-brand-teal-950 hover:from-brand-teal-700 hover:to-brand-teal-900 rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-2 group ring-2 ring-brand-teal-600/30 text-center"
                  >
                    <span>{ctaLogin}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                  </Link>
                )}

                <a
                  href="#packages"
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800/90 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 backdrop-blur-md transition-all shadow-2xs hover:shadow-md text-center"
                >
                  {loc('استكشف باقات التعلم', 'צפייה במסלולים וחבילות לימוד', 'Explore Learning Packages')}
                </a>
              </div>

              {/* Social Media Floating Channels Bar */}
              {hasAnySocials && (
                <div className="pt-1 flex items-center gap-2">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {loc('مجتمعنا:', 'קהילה ברשתות:', 'Community:')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {hasSocialLink(socials.whatsapp) && (
                      <a
                        href={formatWhatsAppUrl(socials.whatsapp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:scale-110 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-all shadow-2xs"
                        title="WhatsApp"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {hasSocialLink(socials.instagram) && (
                      <a
                        href={socials.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-pink-50 dark:bg-pink-950/70 border border-pink-200/80 dark:border-pink-800/80 text-pink-600 dark:text-pink-400 flex items-center justify-center hover:scale-110 hover:bg-pink-100 dark:hover:bg-pink-900 transition-all shadow-2xs"
                        title="Instagram"
                      >
                        <InstagramIcon className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {hasSocialLink(socials.youtube) && (
                      <a
                        href={socials.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-50 dark:bg-rose-950/70 border border-rose-200/80 dark:border-rose-800/80 text-rose-600 dark:text-rose-400 flex items-center justify-center hover:scale-110 hover:bg-rose-100 dark:hover:bg-rose-900 transition-all shadow-2xs"
                        title="YouTube"
                      >
                        <YouTubeIcon className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {hasSocialLink(socials.telegram) && (
                      <a
                        href={socials.telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-50 dark:bg-sky-950/70 border border-sky-200/80 dark:border-sky-800/80 text-sky-600 dark:text-sky-400 flex items-center justify-center hover:scale-110 hover:bg-sky-100 dark:hover:bg-sky-900 transition-all shadow-2xs"
                        title="Telegram"
                      >
                        <TelegramIcon className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Trust Guarantees Row - Wrapped in Responsive Chip Pills */}
              <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/70 dark:bg-slate-850/80 border border-slate-200/70 dark:border-slate-800 text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span>{loc('معلمون ناطقون أصليون ومعتمدون', 'מורים מוסמכים מישראל', 'Native Certified Tutors')}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/70 dark:bg-slate-850/80 border border-slate-200/70 dark:border-slate-800 text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
                  <Clock className="w-3 h-3 text-brand-teal-600 dark:text-brand-teal-400 shrink-0" />
                  <span>{loc('حصص 25 دقيقة لتركيز فائق', '25 דק׳ למיקוד שיא', '25-Min Focused Slots')}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/70 dark:bg-slate-850/80 border border-slate-200/70 dark:border-slate-800 text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
                  <Globe2 className="w-3 h-3 text-brand-teal-600 dark:text-brand-teal-400 shrink-0" />
                  <span>{loc('توقيت إسرائيل (IST)', 'שעון ישראל (IST/IDT)', 'Israel Timing (IST)')}</span>
                </span>
              </div>
            </div>

            {/* Right Column: Interactive Live Session Experience Card */}
            <div className="lg:col-span-5 w-full min-w-0">
              <div className="relative rounded-3xl bg-white/95 dark:bg-slate-900/95 p-4 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-[0_20px_50px_-12px_rgba(12,74,96,0.08)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl space-y-3 sm:space-y-4 w-full max-w-full overflow-hidden transition-all">
                {/* Subtle Top Specular Edge Highlight */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-teal-400/40 to-transparent pointer-events-none" />

                {/* Card Top: Live Badge & Session Meta */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      {loc('حصة فردية تفاعلية 1-على-1', 'שיעור 1-על-1 אינטראקטיבי', 'Live 1-on-1 Session')}
                    </span>
                  </div>
                  <div className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] sm:text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                    25 MIN
                  </div>
                </div>

                {/* Interactive Hebrew Soundboard */}
                <div className="space-y-2 w-full min-w-0">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 text-brand-teal-800 dark:text-brand-teal-300 font-extrabold text-[10px] sm:text-xs truncate">
                      <Volume2 className="w-3.5 h-3.5 text-brand-teal-600 dark:text-teal-400 shrink-0" />
                      <span>{loc('صوت حي — اضغط للنطق', 'לוח שמע חי — לחץ להגייה', 'Live Audio — Tap to Listen')}</span>
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono shrink-0">
                      {loc('نطق محلي أصلي', 'הגייה ישראלית', 'Native Israeli')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 w-full min-w-0">
                    {soundboardWords.map((word) => {
                      const isPlaying = playingWord === word.he;
                      return (
                        <button
                          key={word.he}
                          type="button"
                          onClick={() => playSampleAudio(word.he)}
                          className={`p-2 sm:p-2.5 rounded-2xl border text-center transition-all duration-200 flex flex-col items-center justify-center relative overflow-hidden group min-w-0 w-full active:scale-95 ${
                            isPlaying
                              ? 'bg-brand-teal-800 text-white border-brand-teal-800 scale-[1.02] shadow-md ring-2 ring-emerald-400/50'
                              : 'bg-slate-50/70 hover:bg-white dark:bg-slate-850/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200/70 dark:border-slate-700/70 hover:border-brand-teal-300 dark:hover:border-brand-teal-600 shadow-2xs hover:shadow-xs'
                          }`}
                        >
                          <span className="font-hebrew text-xs sm:text-base font-bold block truncate max-w-full">
                            {word.he}
                          </span>
                          <span
                            className={`text-[9px] sm:text-[10px] font-semibold truncate block mt-0.5 max-w-full ${
                              isPlaying ? 'text-brand-olive-300' : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {word.phonetic}
                          </span>
                          <span
                            className={`text-[8px] sm:text-[9px] truncate block opacity-75 max-w-full ${
                              isPlaying ? 'text-teal-100' : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            {word.trans}
                          </span>

                          {isPlaying && (
                            <span className="absolute bottom-0.5 w-4 h-0.5 rounded-full bg-brand-olive-400 animate-pulse" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Simulation Bottom Bar: Zoom Launcher Ready */}
                <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-1.5 text-[9px] sm:text-xs w-full min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <Video className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate text-[10px] sm:text-xs">
                      {loc('غرفة Zoom فائقة الدقة + تسجيل سحابي', 'חדר Zoom מאובטח + הקלטת Drive', 'Zoom HD + Cloud Recording')}
                    </span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-extrabold text-brand-teal-800 dark:text-brand-teal-400 font-mono shrink-0">
                    IST 12h AM/PM
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* STATS COUNTERS BAR (CMS Managed) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full min-w-0">
        <div className="bg-gradient-to-r from-brand-teal-900 via-brand-teal-950 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-10 text-white shadow-xl border border-brand-teal-800/50 relative overflow-hidden w-full">
          <div className="hidden sm:block absolute top-0 end-0 w-80 h-80 bg-brand-olive-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative z-10 text-center">
            {stats.map((st: any, idx: number) => {
              const label = isAr ? st.labelAr || st.labelEn : isHe ? st.labelHe || st.labelEn : st.labelEn;
              return (
                <div key={idx} className="space-y-1">
                  <div className="text-2xl sm:text-4xl font-black text-brand-olive-300 font-mono tracking-tight">
                    {st.num}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-brand-teal-100">
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3-STEP LEARNING JOURNEY (HOW IT WORKS) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full min-w-0">
        <div className="text-center mb-12 sm:mb-16">
          <span className="text-xs font-bold text-brand-olive-700 dark:text-brand-olive-400 uppercase tracking-wider block mb-2">
            {loc('أسرع طريق نحو الطلاقة', 'הדרך המהירה לשליטה בעברית', 'The Fastest Route to Fluency')}
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {loc('كيف تعمل إنجرو في 3 خطوات بسيطة', 'איך זה עובד ב-3 שלבים פשוטים', 'How Engrew Works in 3 Simple Steps')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-xs sm:text-base max-w-xl mx-auto">
            {loc(
              'منهجية مصممة خصيصاً للمحترفين والأفراد الراغبين في تحقيق نتائج ملموسة في التحدث.',
              'מתודולוגיה מדויקת שנבנתה לאנשים עסוקים שרוצים תוצאות אמיתיות בדיבור.',
              'Engineered for busy professionals who want tangible results in speaking.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Step 1 */}
          <div className="p-7 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs relative flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 flex items-center justify-center font-black text-lg mb-5 border border-teal-200 dark:border-teal-800">
                1
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                {loc('الحجز في 30 ثانية', 'הזמנה ב-30 שניות', 'Book in 30 Seconds')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {loc(
                  'اختر معلمك المفضل واحجز أي فترة 25 دقيقة متزامنة مع توقيت إسرائيل بنظام 12 ساعة AM/PM بكل سهولة.',
                  'בחר את המורה הישראלי המועדף עליך וקבע משבצת של 25 דקות המסונכרנת לשעון ישראל בפורמט 12 שעות AM/PM.',
                  'Select your preferred native instructor and book any 25-minute slot synchronized to Israel Timing (IDT) with AM/PM ease.'
                )}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-7 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs relative flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-brand-olive-100 dark:bg-brand-olive-950/80 text-brand-olive-800 dark:text-brand-olive-300 flex items-center justify-center font-black text-lg mb-5 border border-brand-olive-200 dark:border-brand-olive-800">
                2
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                {loc('حصة فيديو مباشرة 1-على-1', 'שיעור וידאו ממוקד 1-על-1', 'Live 1-on-1 Video Class')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {loc(
                  'انضم بنقرة واحدة عبر Zoom وتحدث العبرية المعاصرة من الدقيقة الأولى بدون أي إجهاد ذهني.',
                  'התחבר בלחיצה לשיעור Zoom אישי, דבר עברית מודרנית מהדקה הראשונה בלי לחץ ובלי עומס קוגניטיבי.',
                  'Join via 1-click Zoom and converse in contemporary Hebrew from minute one with zero cognitive fatigue.'
                )}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-7 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs relative flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 flex items-center justify-center font-black text-lg mb-5 border border-indigo-200 dark:border-indigo-800">
                3
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                {loc('التسجيلات، الملاحظات والألعاب', 'הקלטות, סיכומים ומשחקים', 'Replays, Notes & Gamification')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {loc(
                  'راجع تسجيل الحصة على Google Drive، وذاكر الملاحظات المنظمة، وعزز المفردات بالألعاب التفاعلية لكسب نقاط XP.',
                  'צפה בהקלטת השיעור ב-Google Drive, עיין בהערות המורה ותרגל בכרטיסיות שמע וחידונים לצבירת נקודות XP.',
                  'Review your Google Drive video replay, study structured notes, and reinforce vocabulary with gamified quizzes for XP.'
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES (Live CMS Driven) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full min-w-0">
        <div className="text-center mb-12 sm:mb-16">
          <span className="text-xs font-bold text-brand-olive-700 dark:text-brand-olive-400 uppercase tracking-wider block mb-2">
            {loc('منظومة تعليمية متكاملة لنجاحك', 'מותאם במיוחד ללמידה מודרנית', 'Engineered for Modern Acquisition')}
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('landing.featuresTitle')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-xs sm:text-base max-w-xl mx-auto">
            {loc(
              'كل ما تحتاجه للقراءة، الكتابة، والتحدث بالعبرية المعاصرة بطلاقة وثقة.',
              'כל מה שנדרש כדי לקרוא, לכתוב ולשוחח בעברית עכשווית בביטחון.',
              'Everything you need to read, write, and converse fluently in contemporary Hebrew.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feat: any, idx: number) => {
            const title = isAr ? feat.titleAr || feat.titleEn : isHe ? feat.titleHe || feat.titleEn : feat.titleEn;
            const desc = isAr ? feat.descAr || feat.descEn : isHe ? feat.descHe || feat.descEn : feat.descEn;

            const iconStyles = [
              'bg-brand-teal-50 dark:bg-brand-teal-950/80 text-brand-teal-800 dark:text-brand-teal-300 border-brand-teal-200/80 dark:border-brand-teal-800',
              'bg-brand-olive-50 dark:bg-brand-olive-950/80 text-brand-olive-800 dark:text-brand-olive-300 border-brand-olive-200/80 dark:border-brand-olive-800',
              'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800',
            ];

            return (
              <div
                key={idx}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-lg hover:border-brand-teal-300 dark:hover:border-brand-teal-600 transition-all flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border shadow-2xs ${
                      iconStyles[idx % 3]
                    }`}
                  >
                    {getFeatureIcon(feat.icon)}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2.5">
                    {title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* WHY 25-MINUTES MICRO-LESSONS SECTION */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full min-w-0">
        <div className="bg-gradient-to-br from-brand-teal-950 via-brand-teal-900 to-brand-teal-800 rounded-2xl sm:rounded-3xl p-5 sm:p-12 lg:p-16 text-white relative overflow-hidden shadow-xl w-full max-w-full">
          <div className="hidden sm:block absolute top-0 right-0 w-96 h-96 bg-brand-olive-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-4">
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-brand-olive-300 text-xs font-bold border border-white/15">
                {loc('الأساس العلمي لنمط الـ 25 دقيقة', 'המחקר המדעי מאחורי מתכונת 25 הדקות', 'Cognitive Science Behind 25-Min Format')}
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                {loc(
                  'لماذا تُعد الحصص المركزة (25 دقيقة) أكثر فاعلية؟',
                  'מדוע שיעורים ממוקדים בני 25 דקות יעילים יותר',
                  'Why 25-Minute Focused Sessions Work Better'
                )}
              </h2>
              <p className="text-brand-teal-100 text-xs sm:text-sm leading-relaxed">
                {loc(
                  'تؤدي الجلسات التقليدية التي تمتد لـ 60 دقيقة إلى تشتت الانتباه وتراجع الاستيعاب. تعتمد إنجرو فترات مكثفة مدتها 25 دقيقة متزامنة مع توقيت إسرائيل لضمان أعلى مستوى من التركيز دون إرهاق ذهني.',
                  'שיעורים מסורתיים של 60 דקות גורמים לעומס קוגניטיבי וירידה בריכוז. Engrew משתמשת באימונים ממוקדים של 25 דקות המסונכרנים לשעון ישראל בפורמט 12 שעות.',
                  'Traditional 60-minute tutoring sessions lead to cognitive overload and diminishing recall. Engrew utilizes high-frequency 25-minute immersive intervals calibrated in 12-hour Israel Timing (Asia/Jerusalem).'
                )}
              </p>
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-white/10 border border-white/15">
                  <h4 className="text-xl font-black text-white">
                    {loc('أعلى بنسبة 40%', '40% יותר', '40% Higher')}
                  </h4>
                  <p className="text-xs text-brand-teal-100 mt-1">
                    {loc('في استرجاع وحفظ المفردات', 'כושר זכירת אוצר מילים', 'Vocabulary retention rate')}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/10 border border-white/15">
                  <h4 className="text-xl font-black text-white">
                    {loc('بدون إرهاق ذهني', 'ללא שחיקה ועייפות', 'Zero Burnout')}
                  </h4>
                  <p className="text-xs text-brand-teal-100 mt-1">
                    {loc('تناسب جدول أعمالك اليومي المزدحم بكل سلاسة', 'משתלב בקלות ביום עבודה עמוס', 'Fits smoothly into busy workdays')}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 space-y-3">
              <h3 className="font-bold text-sm text-brand-olive-300 uppercase tracking-wider">
                {loc('جدول متزامن مع توقيت إسرائيل (IST)', 'לוח זמנים מסונכרן לשעון ישראל (IST)', 'Israel Timing (IST) Schedule')}
              </h3>
              <p className="text-xs text-brand-teal-100">
                {loc(
                  'احجز حصصك مباشرة مع معلمين في القدس وتل أبيب بفترات واضحة بنظام 12 ساعة AM/PM:',
                  'קבע שיעורים עם מורים מקצועיים בירושלים ותל אביב במרווחים ברורים של 12 שעות AM/PM:',
                  'Book native teachers live in Tel Aviv & Jerusalem with clear 12-hour AM/PM intervals:'
                )}
              </p>
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/10 text-xs">
                  <span>{loc('فترة الصباح:', 'משבצת בוקר:', 'Morning Slot:')}</span>
                  <span className="font-mono font-bold text-brand-olive-300">09:00 AM – 09:25 AM IST</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/10 text-xs">
                  <span>{loc('فترة الظهيرة:', 'משבצת צהריים:', 'Afternoon Slot:')}</span>
                  <span className="font-mono font-bold text-brand-olive-300">02:30 PM – 02:55 PM IST</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/10 text-xs">
                  <span>{loc('فترة المساء:', 'משבצת ערב:', 'Evening Slot:')}</span>
                  <span className="font-mono font-bold text-brand-olive-300">06:00 PM – 06:25 PM IST</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TEACHER INTRODUCTORY VIDEOS SHOWCASE (CMS Managed) */}
      {teacherVideos.length > 0 && (
        <section id="teachers" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full min-w-0">
          <div className="text-center mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-olive-500/15 text-brand-olive-800 dark:text-brand-olive-300 text-xs font-black uppercase tracking-wider mb-2 border border-brand-olive-500/20">
              <Video className="w-3.5 h-3.5 text-brand-olive-600 dark:text-brand-olive-400 shrink-0" />
              <span>{loc('فيديوهات تعريفية بنخبة المعلمين', 'הכירו את המורים בסרטוני וידאו', 'Meet Our Certified Mentors on Video')}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {loc('شاهد، استمع واختر معلمك المثالي', 'לשמוע, להתרשם ולבחור את המורה האידיאלי עבורך', 'Watch, Listen & Choose Your Perfect Mentor')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-xs sm:text-base max-w-2xl mx-auto">
              {loc(
                'استمع إلى أسلوب ونطق معلّمينا المعتمدين في تل أبيب والقدس، وتعرّف على تخصصاتهم قبل بدء رحلتك التعليمية.',
                'צפו בסרטוני היכרות קצרים של המורים המוסמכים שלנו, הכירו את סגנון ההוראה וההגייה, ובחרו את המורה המתאים בדיוק למטרות שלכם.',
                'Watch short introduction videos from our certified native teachers, experience their accents and teaching styles, and start learning with confidence.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {teacherVideos.map((tv: any, idx: number) => {
              const name = isAr && tv.teacherNameAr ? tv.teacherNameAr : isHe && tv.teacherNameHe ? tv.teacherNameHe : tv.teacherName;
              const specialty = isAr && tv.specialtyAr ? tv.specialtyAr : isHe && tv.specialtyHe ? tv.specialtyHe : tv.specialtyEn;
              const title = isAr && tv.titleAr ? tv.titleAr : isHe && tv.titleHe ? tv.titleHe : tv.title;
              const bio = isAr && tv.bioAr ? tv.bioAr : isHe && tv.bioHe ? tv.bioHe : tv.bioEn;

              return (
                <div
                  key={tv.id || idx}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1.5"
                >
                  <div>
                    {/* Video Thumbnail with Hover Play Button */}
                    <div
                      onClick={() => setActiveTeacherVideo(tv)}
                      className="relative aspect-video bg-slate-950 overflow-hidden cursor-pointer group/video"
                    >
                      {tv.thumbnailUrl ? (
                        <img
                          src={tv.thumbnailUrl}
                          alt={name}
                          className="w-full h-full object-cover group-hover/video:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-teal-950 to-slate-900">
                          <Film className="w-12 h-12 text-teal-700/60" />
                        </div>
                      )}

                      {/* Dark Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

                      {/* Play Button */}
                      <div className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-brand-olive-500 text-slate-950 flex items-center justify-center shadow-2xl group-hover/video:scale-110 group-hover/video:bg-brand-olive-400 transition-all duration-300 ring-4 ring-white/20">
                        <Play className="w-6 h-6 fill-slate-950 ms-0.5" />
                      </div>

                      {/* Video Duration Badge */}
                      {tv.duration && (
                        <span className="absolute bottom-3 end-3 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-white text-[11px] font-mono font-bold">
                          {tv.duration}
                        </span>
                      )}

                      {/* Specialty Tag Top Left */}
                      {specialty && (
                        <span className="absolute top-3 start-3 px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md text-brand-teal-200 text-[10px] font-black uppercase tracking-wider border border-white/10">
                          {specialty}
                        </span>
                      )}
                    </div>

                    {/* Teacher Details */}
                    <div className="p-5 sm:p-6 space-y-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={getAvatarUrl(tv.avatarUrl) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={name}
                          className="w-12 h-12 rounded-2xl object-cover ring-2 ring-brand-teal-500/30"
                          loading="lazy"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-black text-slate-900 dark:text-white truncate">
                            {name}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            {tv.rating && (
                              <div className="flex items-center gap-1 text-xs font-black text-amber-600 dark:text-amber-400">
                                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                <span>{tv.rating}</span>
                              </div>
                            )}
                            {tv.lessonsCount && (
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">
                                • {tv.lessonsCount} {loc('حصة مكتملة', 'שיעורים', 'sessions')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Video Title */}
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                        {title}
                      </h4>

                      {/* Teacher Bio / Intro */}
                      {bio && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {bio}
                        </p>
                      )}

                      {/* Badges */}
                      {tv.badges && tv.badges.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {tv.badges.map((b: string, bIdx: number) => (
                            <span
                              key={bIdx}
                              className="px-2 py-0.5 rounded-md bg-brand-teal-50 dark:bg-brand-teal-950/50 text-brand-teal-800 dark:text-brand-teal-300 border border-brand-teal-200/50 dark:border-brand-teal-800/40 text-[10px] font-bold"
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Action */}
                  <div className="p-5 pt-0">
                    <Link
                      to={`/login?teacherId=${tv.teacherId || tv.id}&teacherName=${encodeURIComponent(name)}`}
                      onClick={() => haptics.tap()}
                      className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-brand-olive-500 dark:bg-slate-800 dark:hover:bg-brand-olive-500 text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-slate-950 text-xs font-black text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>{loc(`احجز حصة مع ${name}`, `קבע שיעור עם ${name}`, `Book with ${name}`)}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Teacher Video Modal Overlay */}
          {activeTeacherVideo && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md"
              onClick={() => setActiveTeacherVideo(null)}
            >
              <div
                className="relative w-full max-w-4xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Close Button */}
                <button
                  onClick={() => setActiveTeacherVideo(null)}
                  className="absolute top-4 end-4 z-20 w-10 h-10 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Video Player */}
                <div className="aspect-video w-full bg-black flex items-center justify-center">
                  <video
                    src={activeTeacherVideo.videoUrl}
                    controls
                    autoPlay
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Video Footer Info & Booking Link */}
                <div className="p-5 sm:p-6 bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <img
                      src={getAvatarUrl(activeTeacherVideo.avatarUrl) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={activeTeacherVideo.teacherName}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-brand-teal-500/40"
                    />
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-white">
                        {isAr && activeTeacherVideo.teacherNameAr ? activeTeacherVideo.teacherNameAr : isHe && activeTeacherVideo.teacherNameHe ? activeTeacherVideo.teacherNameHe : activeTeacherVideo.teacherName}
                      </h4>
                      <p className="text-xs text-brand-teal-300 font-bold">
                        {isAr && activeTeacherVideo.specialtyAr ? activeTeacherVideo.specialtyAr : isHe && activeTeacherVideo.specialtyHe ? activeTeacherVideo.specialtyHe : activeTeacherVideo.specialtyEn}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/login?teacherId=${activeTeacherVideo.teacherId || activeTeacherVideo.id}`}
                    onClick={() => {
                      haptics.tap();
                      setActiveTeacherVideo(null);
                    }}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg text-center transition-all cursor-pointer"
                  >
                    {loc('קבע שיעור היכרות עכשיו', 'קבע שיעור היכרות עכשיו', 'Book a Lesson with Mentor')}
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* PRICING PACKAGES (Compare plans at a glance with 25m / 40m / 55m switcher) */}
      <section id="packages" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full min-w-0">
        <div className="text-center mb-8 sm:mb-10">
          <span className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider block mb-2">
            {loc('استثمار شفاف وباقات مرنة', 'מסלולי השקעה שקופים', 'Transparent Investment')}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {loc('قارن بين الباقات في نظرة واحدة.', 'השווה בין המסלולים במבט אחד.', 'Compare plans at a glance.')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-xs sm:text-base">
            {loc('اختر مدة الجلسة المناسبة لك واستكشف الباقات المتاحة مع أسعار الحصص الشفافة', 'בחר את משך השיעור הרצוי והשווה בין החבילות והמחירים השקופים לכל שיעור', 'Select your preferred session duration and compare plan options.')}
          </p>
        </div>

        {/* Duration Switcher Tabs: 25 min | 40 min | 55 min */}
        <div className="flex items-center justify-center gap-8 sm:gap-12 border-b border-slate-200/80 dark:border-slate-800 pb-2.5 max-w-sm mx-auto mb-10 sm:mb-12">
          {[25, 40, 55].map((dur) => {
            const isSel = selectedDuration === dur;
            return (
              <button
                key={dur}
                type="button"
                onClick={() => {
                  haptics.tap();
                  setSelectedDuration(dur);
                }}
                className={`relative pb-2.5 text-sm sm:text-base font-extrabold transition-all cursor-pointer ${
                  isSel
                    ? 'text-teal-600 dark:text-teal-400'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <span>
                  {dur} {loc('دقيقة', 'דק׳', 'min')}
                </span>
                {isSel && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-teal-500 dark:bg-teal-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* 4 Plans Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 items-stretch">
          {displayPackages.map((pkg: any, idx: number) => {
            const isFeatured = pkg.isPopular || (displayPackages.length === 4 ? idx === 2 : idx === 1);
            const name = isAr && pkg.nameAr ? pkg.nameAr : language === 'he' && pkg.nameHe ? pkg.nameHe : pkg.name;
            const desc = isAr && pkg.descriptionAr ? pkg.descriptionAr : language === 'he' && pkg.descriptionHe ? pkg.descriptionHe : pkg.description;
            const lessonsCount = Number(pkg.totalLessons) || (idx === 0 ? 4 : idx === 1 ? 8 : idx === 2 ? 12 : 16);
            const origPrice = Number(pkg.originalPrice) || 0;
            const currentPrice = Number(pkg.price) || 0;
            const hasDiscount = origPrice > currentPrice;
            const discountPct = hasDiscount ? Math.round(((origPrice - currentPrice) / origPrice) * 100) : 0;
            const perLesson = (currentPrice / lessonsCount).toFixed(2);
            const frequency = getWeeklyFrequency(pkg);

            return (
              <div
                key={pkg.id || idx}
                className={`rounded-[28px] p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 relative text-center bg-white dark:bg-slate-900 ${
                  isFeatured
                    ? 'border-2 border-emerald-400 dark:border-emerald-400 shadow-xl shadow-emerald-500/10 text-slate-900 dark:text-white -translate-y-1'
                    : 'border border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-white shadow-sm hover:shadow-lg hover:-translate-y-1'
                }`}
              >
                {/* Most Popular Choice Badge for Featured Card */}
                {isFeatured && (
                  <div className="absolute -top-3.5 start-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-[#7da83b] text-slate-950 font-black text-[10px] sm:text-[11px] uppercase tracking-wider shadow-md flex items-center gap-1.5 whitespace-nowrap z-10">
                    <Sparkles className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                    <span>{loc('الخيار الأكثر طلباً', 'הבחירה הפופולרית ביותר', 'Most Popular Choice')}</span>
                  </div>
                )}

                <div>
                  {/* Sale Offer & Discount Badges */}
                  <div className="flex items-center justify-center gap-1.5 mb-2 min-h-[22px]">
                    {hasDiscount && (
                      <>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400">
                          {loc('عرض خاص', 'מבצע מיוחד', 'Sale Offer')}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black border bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300">
                          {loc(`وفر ${discountPct}%`, `חיסכון ${discountPct}%`, `Save ${discountPct}%`)}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Big Number of Classes */}
                  <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                    {lessonsCount}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">
                    {loc('حصص شهرياً', 'שיעורים בחודש', 'classes a month')}
                  </div>

                  {/* Frequency Badge */}
                  <div className="mt-3">
                    <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300">
                      {language === 'he' && pkg.nameHe ? pkg.nameHe : isAr && pkg.nameAr ? pkg.nameAr : frequency}
                    </span>
                  </div>

                  {/* Pricing Box */}
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    {hasDiscount ? (
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <span className="line-through text-sm sm:text-base font-semibold text-slate-400 dark:text-slate-500">
                          ₪{origPrice}
                        </span>
                        <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                          {loc(`وفر ${discountPct}%`, `חיסכון ${discountPct}%`, `Save ${discountPct}%`)}
                        </span>
                      </div>
                    ) : (
                      <div className="h-5" />
                    )}
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        ₪{pkg.price}
                      </span>
                      <span className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500">
                        {pkg.currency || 'ILS'}
                      </span>
                    </div>
                    <div className="text-[11px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                      {loc('شهرياً', 'לחודש', 'per month')}
                    </div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1.5">
                      ₪{perLesson} {loc('للحصة', 'לשיעור', 'a lesson')}
                    </div>
                  </div>

                  {/* Duration & Validity specs */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <span className="px-2.5 py-0.5 rounded-md border bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60">
                      {lessonsCount} × {selectedDuration} {loc('دقيقة', 'דק׳', 'min')}
                    </span>
                    <span>•</span>
                    <span>{loc('صلاحية 30 يوماً', 'תוקף 30 יום', `Valid ${pkg.validityDays || 30} days`)}</span>
                  </div>

                  {/* Features Bullet List */}
                  <ul className="mt-5 mb-7 space-y-2.5 text-xs text-start text-slate-600 dark:text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 stroke-[2] text-brand-olive-600 dark:text-brand-olive-400" />
                      <span>{loc('حصص فردية 1-على-1 مباشرة', 'שיעורים פרטיים 1 על 1', '1-on-1 live English/Hebrew lessons')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 stroke-[2] text-brand-olive-600 dark:text-brand-olive-400" />
                      <span>{loc('برنامج تعليمي مخصص', 'תוכנית לימוד אישית', 'Personalized learning')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 stroke-[2] text-brand-olive-600 dark:text-brand-olive-400" />
                      <span>{loc('تمارين ذكية بالذكاء الاصطناعي', 'תרגול חכם מבוסס AI ומשחקים', 'AI-powered practice')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 stroke-[2] text-brand-olive-600 dark:text-brand-olive-400" />
                      <span>{loc('متابعة مستمرة وتسجيلات للحصص', 'מעקב התקדמות והקלטות שיעורים', 'Progress tracking')}</span>
                    </li>
                  </ul>
                </div>

                {/* Choose Plan CTA */}
                <Link
                  to={`/login?packageId=${pkg.id}&pkgName=${encodeURIComponent(name)}`}
                  onClick={() => haptics.tap()}
                  className={`w-full py-3.5 rounded-2xl font-black text-xs sm:text-sm text-center transition-all block cursor-pointer ${
                    isFeatured
                      ? 'bg-[#8ea73e] hover:bg-[#7e9636] text-slate-950 shadow-lg shadow-[#8ea73e]/25 hover:scale-[1.02]'
                      : 'border-2 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 text-slate-900 dark:text-white bg-white dark:bg-slate-900 shadow-2xs hover:shadow-xs'
                  }`}
                >
                  {loc('اختر الباقة', 'בחר מסלול', 'Choose plan')}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Advisor Consultation & WhatsApp Bar */}
        <div className="mt-12 rounded-3xl bg-[#081e24] text-white p-5 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-5 shadow-2xl border border-teal-900/40">
          <div className="text-center md:text-start flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-extrabold text-base sm:text-lg text-white">
              {loc('غير متأكد أي باقة تناسبك؟', 'מתלבט איזה מסלול הכי מתאים לך?', 'Not sure which plan is right for you?')}
            </span>
            <span className="text-slate-300 text-xs sm:text-sm font-medium">
              {loc('تحدث مع مستشارينا التعليميين — نحن هنا للمساعدة.', 'דבר עם יועצי הלימוד שלנו — אנחנו כאן לעזור.', "Talk to our learning advisors — we're here to help.")}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <Link
              to="/placement-test"
              className="px-5 py-2.5 rounded-xl bg-[#00a896] hover:bg-[#009688] text-white font-bold text-xs sm:text-sm transition-all shadow-md hover:scale-105"
            >
              {loc('احجز استشارة', 'קבע שיחת ייעוץ', 'Book a consultation')}
            </Link>
            <a
              href={formatWhatsAppUrl(
                socials.whatsapp,
                isAr
                  ? (config.whatsappMessageAr || 'مرحباً Engrew، أود الاستفسار والحصول على استشارة بخصوص باقات ومسارات الدروس.')
                  : isHe
                  ? (config.whatsappMessageHe || 'שלום Engrew, אשמח לקבל ייעוץ ופרטים לגבי מסלולי הלימוד.')
                  : (config.whatsappMessageEn || 'Hi Engrew, I would like to get consultation regarding your lesson packages.')
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs sm:text-sm transition-all shadow-md hover:scale-105 cursor-pointer"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>{loc('تواصل عبر واتساب', 'שוחח בוואטסאפ', 'Chat with us')}</span>
            </a>
          </div>
        </div>
      </section>

      {/* STUDENT TESTIMONIALS & FEEDBACK (Auto-Scrollable Carousel) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full min-w-0">
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-wider mb-2 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{loc('تقييمات وآراء الطلاب المعتمدة', 'משובים חיים של תלמידים', 'Verified Student Reviews')}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {loc('محل ثقة طلاب العبرية حول العالم', 'מה התלמידים שלנו אומרים', 'Loved by Hebrew Students Worldwide')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-xs sm:text-base max-w-2xl mx-auto">
            {loc(
              'آراء وتجارب حقيقية لطلابنا الذين أتقنوا المحادثة بالعبرية من خلال حصصنا الفردية المركزة مدة 25 دقيقة.',
              'משובים אמיתיים מתלמידים שלומדים עברית מודרנית עם Engrew במפגשים אישיים של 25 דקות.',
              'Authentic reviews and testimonials from students mastering conversational Hebrew through private 25-minute sessions.'
            )}
          </p>
        </div>

        {/* Carousel Wrapper with Manual Navigation Arrows */}
        <div className="relative group/feedback">
          {/* Left Navigation Arrow (Physical Left of Screen) */}
          <button
            type="button"
            onClick={() => scrollFeedback('left')}
            aria-label={loc('مشاهدة التقييم السابق', 'משוב קודם', 'Previous feedback')}
            disabled={!canScrollFeedbackLeft}
            className="flex absolute left-0 sm:-left-3 lg:-left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-700 shadow-xl items-center justify-center text-slate-800 dark:text-white hover:bg-brand-olive-500 hover:text-slate-950 dark:hover:bg-brand-olive-500 dark:hover:text-slate-950 transition-all hover:scale-110 active:scale-95 disabled:opacity-20 disabled:pointer-events-none cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-brand-teal-500 backdrop-blur-md"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
          </button>

          {/* Right Navigation Arrow (Physical Right of Screen) */}
          <button
            type="button"
            onClick={() => scrollFeedback('right')}
            aria-label={loc('مشاهدة التقييم التالي', 'משוב הבא', 'Next feedback')}
            disabled={!canScrollFeedbackRight}
            className="flex absolute right-0 sm:-right-3 lg:-right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-700 shadow-xl items-center justify-center text-slate-800 dark:text-white hover:bg-brand-olive-500 hover:text-slate-950 dark:hover:bg-brand-olive-500 dark:hover:text-slate-950 transition-all hover:scale-110 active:scale-95 disabled:opacity-20 disabled:pointer-events-none cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-brand-teal-500 backdrop-blur-md"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
          </button>

          {/* Edge Fade Masks for Smooth Scroll Look */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-6 w-8 sm:w-14 bg-gradient-to-r from-slate-50 dark:from-slate-950 to-transparent z-10 opacity-70 hidden sm:block" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-6 w-8 sm:w-14 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent z-10 opacity-70 hidden sm:block" />

          {/* Horizontal Touch & Drag Scrollable Container with Auto-Scroll */}
          <div
            ref={feedbackScrollRef}
            onMouseDown={handleFeedbackMouseDown}
            onMouseMove={handleFeedbackMouseMove}
            onMouseUp={handleFeedbackMouseUpOrLeave}
            onMouseLeave={handleFeedbackMouseUpOrLeave}
            className="flex items-stretch gap-5 sm:gap-7 overflow-x-auto snap-x snap-mandatory scroll-smooth py-6 px-4 sm:px-8 touch-pan-x cursor-grab active:cursor-grabbing select-none"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {testimonials.map((t: any, idx: number) => {
              const quote = isAr && t.textAr ? t.textAr : isHe && t.textHe ? t.textHe : t.textEn;
              const initials = t.name
                ? t.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                : 'S';

              return (
                <div
                  key={idx}
                  className="w-[85vw] sm:w-[380px] md:w-[420px] shrink-0 snap-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between select-auto hover:-translate-y-1 relative"
                >
                  <div>
                    {/* Header: Star Rating & Level Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: t.rating || 5 }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-amber-400" />
                          ))}
                        </div>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 ms-1">
                          {(t.rating || 5).toFixed(1)}
                        </span>
                      </div>

                      {t.levelTag && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-teal-50 dark:bg-brand-teal-950/70 text-brand-teal-800 dark:text-brand-teal-300 border border-brand-teal-200 dark:border-brand-teal-800">
                          {t.levelTag}
                        </span>
                      )}
                    </div>

                    {/* Quote text */}
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium mb-6">
                      &ldquo;{quote}&rdquo;
                    </p>
                  </div>

                  {/* Student Details & Teacher Info */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-teal-700 to-emerald-700 text-white font-black flex items-center justify-center text-xs shadow-xs shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {t.name}
                          </h4>
                          <span title="Verified Student" className="inline-flex">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {t.location}
                        </p>
                      </div>
                    </div>

                    {t.teacherName && (
                      <div className="text-end shrink-0 hidden sm:block">
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {loc('المعلم المعتمد:', 'מורה מלווה', 'Teacher')}
                        </span>
                        <span className="text-[11px] font-bold text-brand-olive-600 dark:text-brand-olive-400">
                          {t.teacherName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Carousel Bottom Controls: Pagination Dots */}
        <div className="flex items-center justify-center mt-6">
          <div className="flex items-center gap-2">
            {testimonials.map((_: any, dotIdx: number) => (
              <button
                key={dotIdx}
                type="button"
                onClick={() => scrollFeedbackToIndex(dotIdx)}
                aria-label={`Go to review ${dotIdx + 1}`}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  activeFeedbackIndex === dotIdx
                    ? 'w-8 bg-brand-olive-500 shadow-xs'
                    : 'w-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS (FAQ Accordion - CMS Managed) */}
      <section className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 w-full min-w-0">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {loc('الأسئلة الشائعة', 'שאלות נפוצות', 'Frequently Asked Questions')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            {loc(
              'كل ما تود معرفته عن منصة إنجرو وطريقة الحصص التفاعلية.',
              'כל מה שחשוב לדעת על הפלטפורמה והשיעורים',
              'Everything you need to know about the platform.'
            )}
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq: any, idx: number) => {
            const isOpen = openFaqIndex === idx;
            const q = isAr ? faq.qAr || faq.qEn : isHe ? faq.qHe || faq.qEn : faq.qEn;
            const a = isAr ? faq.aAr || faq.aEn : isHe ? faq.aHe || faq.aEn : faq.aEn;

            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => {
                    haptics.tap();
                    setOpenFaqIndex(isOpen ? null : idx);
                  }}
                  className="w-full p-4 sm:p-5 text-start flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-brand-teal-800 dark:hover:text-brand-teal-300"
                >
                  <span>{q}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isOpen
                        ? 'rotate-180 text-brand-teal-800 dark:text-brand-teal-400'
                        : 'text-slate-400'
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                    {a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 pt-10 sm:pt-12 pb-8 bg-slate-50/50 dark:bg-slate-950/40 w-full min-w-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full min-w-0">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <img src="/logo.png" alt="Engrew" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <span className="font-black text-lg text-brand-teal-900 dark:text-brand-teal-100">
                  Engrew
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {loc('الأكاديمية الرائدة لتعليم اللغة العبرية والإنجليزية', 'האקדמיה המובילה לעברית ואנגלית', 'Premier Modern Hebrew & English Academy')}
                </p>
              </div>
            </div>

            {/* Social Icons Row */}
            {hasAnySocials && (
              <div className="flex items-center gap-3">
                {hasSocialLink(socials.whatsapp) && (
                  <a
                    href={formatWhatsAppUrl(socials.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:border-emerald-300 transition-colors shadow-2xs"
                    title="WhatsApp"
                  >
                    <WhatsAppIcon className="w-4 h-4" />
                  </a>
                )}
                {hasSocialLink(socials.instagram) && (
                  <a
                    href={socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-pink-600 hover:border-pink-300 transition-colors shadow-2xs"
                    title="Instagram"
                  >
                    <InstagramIcon className="w-4 h-4" />
                  </a>
                )}
                {hasSocialLink(socials.youtube) && (
                  <a
                    href={socials.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:border-rose-300 transition-colors shadow-2xs"
                    title="YouTube"
                  >
                    <YouTubeIcon className="w-4 h-4" />
                  </a>
                )}
                {hasSocialLink(socials.telegram) && (
                  <a
                    href={socials.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-sky-600 hover:border-sky-300 transition-colors shadow-2xs"
                    title="Telegram"
                  >
                    <TelegramIcon className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
            <p>
              {loc(
                `© ${new Date().getFullYear()} أكاديمية إنجرو للغة العبرية والإنجليزية. جميع الحقوق محفوظة.`,
                `© ${new Date().getFullYear()} Engrew Hebrew & English Academy. כל הזכויות שמורות.`,
                `© ${new Date().getFullYear()} Engrew Hebrew & English Academy. All rights reserved.`
              )}
            </p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Globe2 className="w-3.5 h-3.5 text-brand-teal-700" />
                {loc('سحابة مشفرة آمنة · توقيت إسرائيل', 'שרת מאובטח ושעון ישראל', 'Secure Cloud · Israel Timing')}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
