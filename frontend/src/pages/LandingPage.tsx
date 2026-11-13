import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useTranslation } from '../hooks/useTranslation';
import { useAuthStore } from '../store/authStore';
import { PriceDisplay } from '../components/common/PriceDisplay';
import { haptics } from '../utils/haptics';
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
  Clock,
  Gamepad2,
  ArrowRight,
  FolderOpen,
  Volume2,
  VolumeX,
  ChevronDown,
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
  Play,
  Calendar,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { t, language } = useTranslation();
  const user = useAuthStore((state) => state.user);

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

  const config = settingsData || {};

  // Bilingual fallbacks
  const badge =
    language === 'he'
      ? config.badgeHe || 'האקדמיה המובילה לעברית ואנגלית'
      : config.badgeEn || 'Premier Modern Hebrew & English Academy';

  const heroTitle =
    language === 'he'
      ? config.heroTitleHe || 'לדבר עברית מודרנית בביטחון ובטבעיות'
      : config.heroTitleEn || 'Speak Real Modern Hebrew with Confident Fluency';

  const heroSubtitle =
    language === 'he'
      ? config.heroSubtitleHe ||
        'שיעורים פרטיים ממוקדים של 25 דקות עם מורים מוסמכים מישראל, משחקים חווייתיים, הקלטות וידאו לכל שיעור וליווי אישי מותאם לקצב שלך.'
      : config.heroSubtitleEn ||
        'Live 1-on-1 private video lessons (25-minute focused sessions) with certified native tutors in Israel, interactive gamification, and permanent cloud recordings.';

  const ctaStudent =
    language === 'he'
      ? config.ctaStudentHe || 'מעבר ללוח הבקרה שלי'
      : config.ctaStudentEn || 'Go to My Dashboard';

  const ctaLogin =
    language === 'he'
      ? config.ctaLoginHe || 'התחל ללמוד עכשיו'
      : config.ctaLoginEn || 'Start Learning Today';

  const announcement =
    language === 'he'
      ? config.announcementHe || 'מבצע מיוחד: 50 נקודות בונוס XP והקלטת וידאו לכל שיעור ראשון'
      : config.announcementEn || 'Special Offer: 50 Bonus XP points and full video recording included with your first lesson';

  // Stats Counters
  const stats = config.stats && config.stats.length > 0 ? config.stats : [
    {
      num: '500+',
      labelEn: 'Active Hebrew Learners',
      labelHe: 'תלמידים פעילים בעולם',
      icon: 'users',
    },
    {
      num: '2,400+',
      labelEn: '25-Min Focused Lessons',
      labelHe: 'שיעורים ממוקדים של 25 דק׳',
      icon: 'clock',
    },
    {
      num: '98.8%',
      labelEn: 'Fluency Retention Rate',
      labelHe: 'שיעור הצלחה ושימור שפה',
      icon: 'trending',
    },
    {
      num: '4.95 / 5',
      labelEn: 'Average Teacher Rating',
      labelHe: 'דירוג מורים ממוצע',
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
            descEn:
              'High-intensity 25-minute private 1-on-1 sessions designed for maximum cognitive retention without fatigue.',
            descHe: 'מפגשים אישיים של 25 דקות המתוכננים לקליטה מיטבית וללא עומס קוגניטיבי.',
          },
          {
            icon: 'gamepad',
            titleEn: 'Real Hebrew Interactive Games',
            titleHe: 'משחקי שפה אינטראקטיביים אמיתיים',
            descEn:
              'Interactive 3D Alef-Bet flashcards with native audio pronunciation, timed vocabulary quizzes, and matching challenges.',
            descHe: 'כרטיסיות תלת-ממד עם הגייה קולית, חידונים מתוזמנים ואתגרי התאמת מילים לצבירת נקודות.',
          },
          {
            icon: 'drive',
            titleEn: 'Lesson Recordings & Notes',
            titleHe: 'הקלטות וידאו וסיכומי שיעור',
            descEn:
              'Access Google Drive recordings and teacher notes after every class to review grammar and vocabulary anytime.',
            descHe: 'גישה נוחה להקלטות Google Drive ולהערות המורה לאחר כל מפגש לחיזוק הלמידה.',
          },
        ];

  // Testimonials
  const testimonials =
    config.testimonials && config.testimonials.length > 0
      ? config.testimonials
      : [
          {
            name: 'Michael Bronstein',
            location: 'New York, USA',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
            rating: 5,
            textEn:
              'The 25-minute format is a genius invention! I can easily fit a lesson during my lunch break. My Hebrew teacher Mona is phenomenal.',
            textHe:
              'מתכונת 25 הדקות היא פשוט המצאה גאונית! אני קובע שיעור בהפסקת הצהריים בעבודה וההתקדמות בדיבור מדהימה.',
          },
          {
            name: 'Rachel Dayan',
            location: 'London, UK',
            avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
            rating: 5,
            textEn:
              'The Google Drive recorded sessions and interactive games make revision so engaging. I went from zero to holding full conversations in 3 months!',
            textHe:
              'הקלטות הווידאו ומשחקי השפה עם הנקודות עושים את כל ההבדל. התחלתי מאפס והיום אני מנהלת שיחות חופשיות!',
          },
          {
            name: 'Daniel Chen',
            location: 'Toronto, Canada',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
            rating: 5,
            textEn:
              'Strict Israel Timing (IDT) schedule and 1-on-1 focus makes Engrew the most authentic and reliable Hebrew academy available.',
            textHe:
              'סנכרון מדויק לשעון ישראל ויחס אישי של אחד-על-אחד הפכו את Engrew לפלטפורמה הכי מקצועית שיש.',
          },
        ];

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
    { he: 'שָׁלוֹם', phonetic: 'Sha-lom', en: language === 'he' ? 'שלום / ברכה' : 'Hello & Peace' },
    { he: 'סַבָּבָה', phonetic: 'Sa-ba-ba', en: language === 'he' ? 'מעולה / אחלה' : 'Awesome & Great' },
    { he: 'תּוֹדָה רַבָּה', phonetic: 'To-da Ra-ba', en: language === 'he' ? 'תודה מעומק הלב' : 'Thank you very much' },
    { he: 'מַה נִּשְׁמַע?', phonetic: 'Ma Nish-ma?', en: language === 'he' ? 'איך הולך?' : "How's it going?" },
    { he: 'יַאלְלָה!', phonetic: 'Yal-la!', en: language === 'he' ? 'קדימה / זזנו' : "Let's do this!" },
    { he: 'בְּתֵאָבוֹן', phonetic: 'Be-te-a-von', en: language === 'he' ? 'אכילה מהנה' : 'Bon Appétit' },
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
            aEn: 'Cognitive linguistics research demonstrates that intensive 25-minute 1-on-1 language sessions yield up to 40% higher retention compared to long 60-minute classes, eliminating attention fatigue.',
            aHe: 'מחקרים בבלשנות קוגניטיבית מראים שמפגשים ממוקדים של 25 דקות מאפשרים קליטה וזיכרון גבוהים ב-40% ביחס לשיעורים ארוכים ומעייפים.',
          },
          {
            qEn: 'What time zone are the lesson slots based on?',
            qHe: 'לפי איזה אזור זמן נקבעים השיעורים?',
            aEn: 'All schedules coordinate with Israel Timing (IDT/IST, UTC+2 / UTC+3 in Tel Aviv & Jerusalem) and are automatically displayed in clean 12-hour AM/PM format.',
            aHe: 'כל לוחות הזמנים מסונכרנים לשעון ישראל (UTC+2 / UTC+3) ומוצגים בפורמט נוח של 12 שעות עם ציון AM ו-PM.',
          },
          {
            qEn: 'How do Google Drive recordings work?',
            qHe: 'כיצד פועלות הקלטות השיעורים ב-Google Drive?',
            aEn: 'Following every 25-minute class, your teacher attaches a secure Google Drive video link directly to your student dashboard alongside vocabulary notes.',
            aHe: 'בסיום כל שיעור, המורה מצרף קישור וידאו ישיר מ-Google Drive ללוח הבקרה שלך יחד עם סיכום אוצר המילים וההערות.',
          },
          {
            qEn: 'Can I earn points by playing the language games?',
            qHe: 'האם צבירת נקודות במשחקים משפיעה על הדירוג?',
            aEn: 'Yes! Playing 3D flashcards, quizzes, and word matching earns gamification points that rank you on the public Hebrew Academy leaderboard.',
            aHe: 'כן בהחלט! תרגול בכרטיסיות שמע, חידונים והתאמות מילים מעניק נקודות שמקדמות אותך בלוח המובילים של האקדמיה.',
          },
        ];

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-10 sm:space-y-20 pb-20">
      {/* HERO SECTION */}
      <section className="relative pt-4 sm:pt-14 pb-8 sm:pb-20 overflow-hidden w-full max-w-full">
        {/* Layered Atmospheric Glows - Contained to desktop to prevent mobile horizontal expansion */}
        <div className="hidden sm:block absolute top-0 start-1/2 -translate-x-1/2 w-[54rem] h-[30rem] bg-gradient-to-tr from-brand-teal-500/15 via-emerald-500/10 to-brand-olive-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="hidden sm:block absolute -top-12 -end-12 w-96 h-96 bg-brand-olive-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="hidden sm:block absolute top-1/2 -start-24 w-80 h-80 bg-brand-teal-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="sm:hidden absolute inset-0 bg-gradient-to-b from-teal-500/5 via-transparent to-transparent pointer-events-none" />

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
                  {language === 'he' ? 'צפייה בחבילות 25 דקות' : 'Explore 25-Min Packages'}
                </a>
              </div>

              {/* Social Media Floating Channels Bar */}
              {hasAnySocials && (
                <div className="pt-1 flex items-center gap-2">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {language === 'he' ? 'קהילה ברשתות:' : 'Community:'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {hasSocialLink(socials.whatsapp) && (
                      <a
                        href={socials.whatsapp}
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
                  <span>{language === 'he' ? 'מורים מוסמכים מישראל' : 'Native Certified Tutors'}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/70 dark:bg-slate-850/80 border border-slate-200/70 dark:border-slate-800 text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
                  <Clock className="w-3 h-3 text-brand-teal-600 dark:text-brand-teal-400 shrink-0" />
                  <span>{language === 'he' ? '25 דק׳ למיקוד שיא' : '25-Min Focused Slots'}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/70 dark:bg-slate-850/80 border border-slate-200/70 dark:border-slate-800 text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
                  <Globe2 className="w-3 h-3 text-brand-teal-600 dark:text-brand-teal-400 shrink-0" />
                  <span>{language === 'he' ? 'שעון ישראל (IST/IDT)' : 'Israel Timing (IST)'}</span>
                </span>
              </div>
            </div>

            {/* Right Column: Interactive Live Session Experience Card */}
            <div className="lg:col-span-5 w-full min-w-0">
              <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/95 via-white/85 to-teal-50/60 dark:from-slate-900/95 dark:via-slate-900/85 dark:to-teal-950/40 p-3 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xl backdrop-blur-2xl space-y-3 sm:space-y-4 w-full max-w-full overflow-hidden">
                {/* Specular Ambient Glow - Hidden on mobile */}
                <div className="hidden sm:block absolute -top-10 -end-10 w-44 h-44 rounded-full bg-emerald-400/15 blur-2xl pointer-events-none" />

                {/* Card Top: Live Badge & Session Meta */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      {language === 'he' ? 'שיעור 1-על-1 אינטראקטיבי' : 'Live 1-on-1 Session'}
                    </span>
                  </div>
                  <div className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] sm:text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                    25 MIN
                  </div>
                </div>



                {/* Interactive Hebrew Soundboard */}
                <div className="space-y-1.5 w-full min-w-0">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 text-brand-teal-800 dark:text-brand-teal-400 font-extrabold text-[10px] sm:text-xs truncate">
                      <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-teal-600 dark:text-teal-400 shrink-0" />
                      <span>{language === 'he' ? 'לוח שמע חי — לחץ להגייה' : 'Live Audio — Tap to Listen'}</span>
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono shrink-0">
                      {language === 'he' ? 'הגייה ישראלית' : 'Native Israeli'}
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
                          className={`p-1.5 sm:p-2.5 rounded-xl border text-center transition-all duration-200 flex flex-col items-center justify-center relative overflow-hidden group min-w-0 w-full ${
                            isPlaying
                              ? 'bg-brand-teal-800 text-white border-brand-teal-800 scale-[1.02] shadow-md ring-2 ring-emerald-400/50'
                              : 'bg-white/80 dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/80 shadow-2xs'
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
                            {word.en}
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
                <div className="p-2 sm:p-2.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/90 flex items-center justify-between gap-1.5 text-[9px] sm:text-xs w-full min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <Video className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate text-[10px] sm:text-xs">
                      {language === 'he' ? 'חדר Zoom מאובטח + הקלטת Drive' : 'Zoom HD + Cloud Recording'}
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
              const label = language === 'he' ? st.labelHe || st.labelEn : st.labelEn;
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
            {language === 'he' ? 'הדרך המהירה לשליטה בעברית' : 'The Fastest Route to Fluency'}
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {language === 'he' ? 'איך זה עובד ב-3 שלבים פשוטים' : 'How Engrew Works in 3 Simple Steps'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-xs sm:text-base max-w-xl mx-auto">
            {language === 'he'
              ? 'מתודולוגיה מדויקת שנבנתה לאנשים עסוקים שרוצים תוצאות אמיתיות בדיבור.'
              : 'Engineered for busy professionals who want tangible results in speaking.'}
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
                {language === 'he' ? 'הזמנה ב-30 שניות' : 'Book in 30 Seconds'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {language === 'he'
                  ? 'בחר את המורה הישראלי המועדף עליך וקבע משבצת של 25 דקות המסונכרנת לשעון ישראל בפורמט 12 שעות AM/PM.'
                  : 'Select your preferred native instructor and book any 25-minute slot synchronized to Israel Timing (IDT) with AM/PM ease.'}
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
                {language === 'he' ? 'שיעור וידאו ממוקד 1-על-1' : 'Live 1-on-1 Video Class'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {language === 'he'
                  ? 'התחבר בלחיצה לשיעור Zoom אישי, דבר עברית מודרנית מהדקה הראשונה בלי לחץ ובלי עומס קוגניטיבי.'
                  : 'Join via 1-click Zoom and converse in contemporary Hebrew from minute one with zero cognitive fatigue.'}
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
                {language === 'he' ? 'הקלטות, סיכומים ומשחקים' : 'Replays, Notes & Gamification'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {language === 'he'
                  ? 'צפה בהקלטת השיעור ב-Google Drive, עיין בהערות המורה ותרגל בכרטיסיות שמע וחידונים לצבירת נקודות XP.'
                  : 'Review your Google Drive video replay, study structured notes, and reinforce vocabulary with gamified quizzes for XP.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES (Live CMS Driven) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full min-w-0">
        <div className="text-center mb-12 sm:mb-16">
          <span className="text-xs font-bold text-brand-olive-700 dark:text-brand-olive-400 uppercase tracking-wider block mb-2">
            {language === 'he' ? 'מותאם במיוחד ללמידה מודרנית' : 'Engineered for Modern Acquisition'}
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('landing.featuresTitle')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-xs sm:text-base max-w-xl mx-auto">
            {language === 'he'
              ? 'כל מה שנדרש כדי לקרוא, לכתוב ולשוחח בעברית עכשווית בביטחון.'
              : 'Everything you need to read, write, and converse fluently in contemporary Hebrew.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feat: any, idx: number) => {
            const title = language === 'he' ? feat.titleHe || feat.titleEn : feat.titleEn;
            const desc = language === 'he' ? feat.descHe || feat.descEn : feat.descEn;

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
                {language === 'he' ? 'המחקר המדעי מאחורי מתכונת 25 הדקות' : 'Cognitive Science Behind 25-Min Format'}
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                {language === 'he'
                  ? 'מדוע שיעורים ממוקדים בני 25 דקות יעילים יותר'
                  : 'Why 25-Minute Focused Sessions Work Better'}
              </h2>
              <p className="text-brand-teal-100 text-xs sm:text-sm leading-relaxed">
                {language === 'he'
                  ? 'שיעורים מסורתיים של 60 דקות גורמים לעומס קוגניטיבי וירידה בריכוז. Engrew משתמשת באימונים ממוקדים של 25 דקות המסונכרנים לשעון ישראל בפורמט 12 שעות.'
                  : 'Traditional 60-minute tutoring sessions lead to cognitive overload and diminishing recall. Engrew utilizes high-frequency 25-minute immersive intervals calibrated in 12-hour Israel Timing (Asia/Jerusalem).'}
              </p>
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-white/10 border border-white/15">
                  <h4 className="text-xl font-black text-white">
                    {language === 'he' ? '40% יותר' : '40% Higher'}
                  </h4>
                  <p className="text-xs text-brand-teal-100 mt-1">
                    {language === 'he' ? 'כושר זכירת אוצר מילים' : 'Vocabulary retention rate'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/10 border border-white/15">
                  <h4 className="text-xl font-black text-white">
                    {language === 'he' ? 'ללא שחיקה ועייפות' : 'Zero Burnout'}
                  </h4>
                  <p className="text-xs text-brand-teal-100 mt-1">
                    {language === 'he' ? 'משתלב בקלות ביום עבודה עמוס' : 'Fits smoothly into busy workdays'}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 space-y-3">
              <h3 className="font-bold text-sm text-brand-olive-300 uppercase tracking-wider">
                {language === 'he' ? 'לוח זמנים מסונכרן לשעון ישראל (IST)' : 'Israel Timing (IST) Schedule'}
              </h3>
              <p className="text-xs text-brand-teal-100">
                {language === 'he'
                  ? 'קבע שיעורים עם מורים מקצועיים בירושלים ותל אביב במרווחים ברורים של 12 שעות AM/PM:'
                  : 'Book native teachers live in Tel Aviv & Jerusalem with clear 12-hour AM/PM intervals:'}
              </p>
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/10 text-xs">
                  <span>{language === 'he' ? 'משבצת בוקר:' : 'Morning Slot:'}</span>
                  <span className="font-mono font-bold text-brand-olive-300">09:00 AM – 09:25 AM IST</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/10 text-xs">
                  <span>{language === 'he' ? 'משבצת צהריים:' : 'Afternoon Slot:'}</span>
                  <span className="font-mono font-bold text-brand-olive-300">02:30 PM – 02:55 PM IST</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/10 text-xs">
                  <span>{language === 'he' ? 'משבצת ערב:' : 'Evening Slot:'}</span>
                  <span className="font-mono font-bold text-brand-olive-300">06:00 PM – 06:25 PM IST</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING PACKAGES (Driven dynamically from DB or default) */}
      <section id="packages" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full min-w-0">
        <div className="text-center mb-12 sm:mb-16">
          <span className="text-xs font-bold text-brand-teal-800 dark:text-brand-teal-400 uppercase tracking-wider block mb-2">
            {language === 'he' ? 'מסלולי השקעה שקופים' : 'Transparent Investment'}
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('landing.packagesTitle')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-xs sm:text-base">
            {t('landing.packagesSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {((packagesData || []).filter((p: any) => p.isActive !== false)).map((pkg: any, idx: number) => {
            const isFeatured = pkg.isPopular || idx === 1;
            const name = language === 'he' && pkg.nameHe ? pkg.nameHe : pkg.name;
            const desc = language === 'he' && pkg.descriptionHe ? pkg.descriptionHe : pkg.description;

            if (isFeatured) {
              return (
                <div
                  key={pkg.id || idx}
                  className="bg-gradient-to-b from-brand-teal-900 via-brand-teal-950 to-brand-teal-950 text-white p-7 sm:p-8 rounded-3xl shadow-xl relative flex flex-col justify-between ring-2 ring-brand-olive-400"
                >
                  <span className="absolute -top-3 start-1/2 -translate-x-1/2 bg-brand-olive-500 text-slate-950 text-[10px] sm:text-[11px] font-black uppercase px-3 py-1 rounded-full shadow-xs tracking-wider">
                    {language === 'he' ? 'הבחירה הפופולרית ביותר' : 'Most Popular Choice'}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-brand-olive-300 uppercase tracking-wider">
                      {language === 'he' ? 'התקדמות מואצת' : 'Accelerated Fluency'}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mt-1 mb-2">{name}</h3>
                    <p className="text-xs sm:text-sm text-brand-teal-100 mb-6">{desc}</p>
                    <div className="mb-6">
                      <PriceDisplay
                        price={pkg.price}
                        originalPrice={pkg.originalPrice}
                        onSale={pkg.onSale}
                        currency={pkg.currency || 'USD'}
                        size="xl"
                        isLightOnDark={true}
                      />
                      <span className="text-xs font-normal text-brand-teal-200 block mt-1">
                        {language === 'he'
                          ? `/ תוקף ל-${pkg.validityDays} יום`
                          : `/ ${pkg.validityDays} days validity`}
                      </span>
                    </div>
                    <ul className="space-y-3 text-xs sm:text-sm text-brand-teal-100 mb-8">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-brand-olive-400 shrink-0" />
                        {language === 'he'
                          ? `${pkg.totalLessons} שיעורים ממוקדים של 25 דקות`
                          : `${pkg.totalLessons} Focused 25-min sessions`}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-brand-olive-400 shrink-0" />
                        {language === 'he'
                          ? 'הקלטות וידאו מלאות ב-Google Drive'
                          : 'Full Google Drive video recordings'}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-brand-olive-400 shrink-0" />
                        {language === 'he'
                          ? 'שיעורי בית ותרגול אינטראקטיבי'
                          : 'Custom homework with PDF viewer'}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-brand-olive-400 shrink-0" />
                        {language === 'he' ? 'משוב אישי וצבירת נקודות' : 'Dedicated teacher feedback'}
                      </li>
                    </ul>
                  </div>
                  <Link
                    to="/login"
                    onClick={() => haptics.tap()}
                    className="w-full py-3.5 text-center bg-brand-olive-500 hover:bg-brand-olive-600 text-slate-950 font-black text-xs sm:text-sm rounded-2xl transition-all shadow-md hover:scale-[1.02]"
                  >
                    {t('landing.getStarted')}
                  </Link>
                </div>
              );
            }

            return (
              <div
                key={pkg.id || idx}
                className="bg-white dark:bg-slate-900 p-7 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {language === 'he' ? 'חבילת לימוד' : 'Learning Package'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1 mb-2">
                    {name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-6">{desc}</p>
                  <div className="mb-6">
                    <PriceDisplay
                      price={pkg.price}
                      originalPrice={pkg.originalPrice}
                      onSale={pkg.onSale}
                      currency={pkg.currency || 'USD'}
                      size="xl"
                    />
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400 block mt-1">
                      {language === 'he'
                        ? `/ תוקף ל-${pkg.validityDays} יום`
                        : `/ ${pkg.validityDays} days validity`}
                    </span>
                  </div>
                  <ul className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-8">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-brand-olive-600 shrink-0" />
                      {language === 'he'
                        ? `${pkg.totalLessons} שיעורים ממוקדים של 25 דקות`
                        : `${pkg.totalLessons} Focused 25-min sessions`}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-brand-olive-600 shrink-0" />
                      {language === 'he'
                        ? 'מורים מוסמכים מישראל (שעון IST)'
                        : 'Certified native teachers (IST)'}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-brand-olive-600 shrink-0" />
                      {language === 'he'
                        ? 'משחקי שפה ותרגול הגייה קולי'
                        : 'Interactive games & audio voice'}
                    </li>
                  </ul>
                </div>
                <Link
                  to="/login"
                  onClick={() => haptics.tap()}
                  className="w-full py-3.5 text-center bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs sm:text-sm rounded-2xl transition-colors shadow-xs"
                >
                  {t('landing.getStarted')}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* STUDENT TESTIMONIALS (CMS Managed) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full min-w-0">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-brand-teal-800 dark:text-brand-teal-400 uppercase tracking-wider block mb-2">
            {language === 'he' ? 'סיפורי הצלחה' : 'Learner Reviews'}
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {language === 'he' ? 'מה התלמידים שלנו אומרים' : 'Loved by Hebrew Students Worldwide'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-xs sm:text-base">
            {language === 'he'
              ? 'ביקורות אמיתיות מתלמידים שלומדים עברית מודרנית עם Engrew.'
              : 'Real feedback from students mastering modern Hebrew through 25-minute sessions.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((t: any, idx: number) => {
            const quote = language === 'he' && t.textHe ? t.textHe : t.textEn;
            return (
              <div
                key={idx}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Star Rating */}
                  <div className="flex items-center gap-1 text-amber-400 mb-4">
                    {Array.from({ length: t.rating || 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic mb-6">
                    &ldquo;{quote}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-teal-600 to-emerald-700 text-white font-black flex items-center justify-center text-xs shadow-xs ring-1 ring-teal-400/30 shrink-0">
                    {t.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'S'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t.name}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.location}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS (FAQ Accordion - CMS Managed) */}
      <section className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 w-full min-w-0">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {language === 'he' ? 'שאלות נפוצות' : 'Frequently Asked Questions'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            {language === 'he'
              ? 'כל מה שחשוב לדעת על הפלטפורמה והשיעורים'
              : 'Everything you need to know about the platform.'}
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq: any, idx: number) => {
            const isOpen = openFaqIndex === idx;
            const q = language === 'he' ? faq.qHe || faq.qEn : faq.qEn;
            const a = language === 'he' ? faq.aHe || faq.aEn : faq.aEn;

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
                  {language === 'he'
                    ? 'האקדמיה המובילה לעברית ואנגלית'
                    : 'Premier Modern Hebrew & English Academy'}
                </p>
              </div>
            </div>

            {/* Social Icons Row */}
            {hasAnySocials && (
              <div className="flex items-center gap-3">
                {hasSocialLink(socials.whatsapp) && (
                  <a
                    href={socials.whatsapp}
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
              &copy; {new Date().getFullYear()} Engrew Hebrew & English Academy. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Globe2 className="w-3.5 h-3.5 text-brand-teal-700" />
                {language === 'he' ? 'שרת מאובטח ושעון ישראל' : 'Secure Cloud · Israel Timing'}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
