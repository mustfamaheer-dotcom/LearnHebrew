import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useTranslation } from '../hooks/useTranslation';
import { useAuthStore } from '../store/authStore';
import {
  Video,
  Award,
  Sparkles,
  CheckCircle2,
  Clock,
  Gamepad2,
  ArrowRight,
  FolderOpen,
  Calendar,
  Volume2,
  ChevronDown,
  Star,
  ShieldCheck,
  Globe2,
  Headphones,
  GraduationCap,
  Users,
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
    staleTime: 1000 * 60 * 5,
  });

  const config = settingsData || {};

  // Bilingual fallbacks
  const badge =
    language === 'he'
      ? config.badgeHe || 'פלטפורמה דו-לשונית ללימוד עברית'
      : config.badgeEn || 'Bilingual Hebrew Platform';

  const heroTitle =
    language === 'he'
      ? config.heroTitleHe || 'לדבר עברית מודרנית בביטחון ובקלות'
      : config.heroTitleEn || 'Speak Modern Hebrew with Confidence';

  const heroSubtitle =
    language === 'he'
      ? config.heroSubtitleHe ||
        'שיעורים פרטיים ממוקדים של 25 דקות עם מורים מוסמכים מישראל, משחקים חווייתיים והקלטות וידאו לכל שיעור.'
      : config.heroSubtitleEn ||
        'Live 1-on-1 private video lessons (25-min focused slots) with native certified teachers in Israel, interactive Hebrew games, and cloud video recordings.';

  const ctaStudent =
    language === 'he'
      ? config.ctaStudentHe || 'מעבר ללוח הבקרה'
      : config.ctaStudentEn || 'Go to Student Dashboard';

  const ctaLogin =
    language === 'he'
      ? config.ctaLoginHe || 'התחל ללמוד עכשיו'
      : config.ctaLoginEn || 'Start Learning Now';

  const announcement =
    language === 'he'
      ? config.announcementHe || 'מבצע מיוחד: כל תלמיד חדש מקבל 50 נקודות בונוס עם קביעת השיעור הראשון'
      : config.announcementEn || 'Special Offer: All new students receive 50 bonus gamification points upon first booking';

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

  // Interactive Hebrew Pronunciation Sample
  const playSampleAudio = (text: string) => {
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
      setTimeout(() => setPlayingWord(null), 1000);
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

  const faqs = [
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
    <div className="space-y-16 sm:space-y-24 pb-20 overflow-hidden">
      {/* HERO SECTION */}
      <section className="relative pt-8 sm:pt-14 pb-10 sm:pb-16 overflow-hidden">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 start-1/2 -translate-x-1/2 w-[40rem] h-[22rem] bg-gradient-to-tr from-brand-teal-500/15 via-brand-olive-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-12 -end-12 w-80 h-80 bg-brand-olive-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Real-time CMS Announcement Pill */}
          {announcement && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-teal-50 dark:bg-brand-teal-950/70 border border-brand-teal-200/80 dark:border-brand-teal-800/80 text-brand-teal-900 dark:text-brand-teal-200 text-xs font-semibold mb-6 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-brand-olive-600 dark:text-brand-olive-400" />
              <span>{announcement}</span>
            </div>
          )}

          <div className="inline-block px-3.5 py-1 bg-brand-olive-100 dark:bg-brand-olive-950/80 text-brand-olive-900 dark:text-brand-olive-300 text-xs font-extrabold uppercase rounded-full mb-4 tracking-wider border border-brand-olive-300/60 dark:border-brand-olive-800">
            {badge}
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            {heroTitle}
          </h1>

          <p className="mt-4 sm:mt-6 text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            {heroSubtitle}
          </p>

          {/* Action Buttons */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
            {user ? (
              <Link
                to={
                  user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
                    ? '/admin'
                    : user.role === 'TEACHER'
                    ? '/teacher'
                    : '/student'
                }
                className="w-full sm:w-auto px-7 py-3.5 text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-brand-teal-800 to-brand-teal-950 hover:from-brand-teal-700 hover:to-brand-teal-900 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>{ctaStudent}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="w-full sm:w-auto px-7 py-3.5 text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-brand-teal-800 to-brand-teal-950 hover:from-brand-teal-700 hover:to-brand-teal-900 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>{ctaLogin}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            )}

            <a
              href="#packages"
              className="w-full sm:w-auto px-6 py-3.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors shadow-2xs"
            >
              {language === 'he' ? 'צפייה בחבילות לימוד' : 'Explore 25-Min Packages'}
            </a>
          </div>

          <div className="mt-10 mb-6">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider block">
              {language === 'he' ? 'הדגמת שמע חיה לעברית מדוברת' : 'Interactive Hebrew Audio Preview'}
            </span>
          </div>

          {/* Interactive Alef-Bet Pronunciation Widget */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm max-w-xl mx-auto">
            <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-brand-teal-800 dark:text-brand-teal-400 font-bold">
                <Volume2 className="w-4 h-4" />
                {language === 'he' ? 'הדגמת שמע חיה' : 'Live Audio Preview'}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                {language === 'he' ? 'לחץ על מילה לשמיעת הגייה' : 'Click a Hebrew word to listen'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                {
                  he: 'שָׁלוֹם',
                  en: language === 'he' ? 'שלום (ברכה / שלום)' : 'Shalom (Hello/Peace)',
                },
                {
                  he: 'תּוֹדָה',
                  en: language === 'he' ? 'תודה (הכרת תודה)' : 'Toda (Thank you)',
                },
                {
                  he: 'אַהֲבָה',
                  en: language === 'he' ? 'אהבה (רגש)' : 'Ahava (Love)',
                },
              ].map((item) => (
                <button
                  key={item.he}
                  type="button"
                  onClick={() => playSampleAudio(item.he)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    playingWord === item.he
                      ? 'bg-brand-teal-800 text-white border-brand-teal-800 scale-105 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/80'
                  }`}
                >
                  <span className="font-hebrew text-xl sm:text-2xl font-bold block mb-0.5">
                    {item.he}
                  </span>
                  <span
                    className={`text-[10px] block truncate ${
                      playingWord === item.he ? 'text-brand-olive-300' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.en}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="mt-10 pt-6 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-olive-600 shrink-0" />
              {language === 'he' ? 'מורים ישראלים מוסמכים' : 'Native Certified Teachers'}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-400 shrink-0" />
              {language === 'he' ? 'מתכונת מדויקת של 25 דקות' : 'Strict 25-Min Lesson Engine'}
            </span>
            <span className="flex items-center gap-1.5">
              <Globe2 className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-400 shrink-0" />
              {language === 'he' ? 'שעון ישראל (IST / IDT)' : 'Israel Timing (IST / IDT)'}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-olive-600 shrink-0" />
              {language === 'he' ? 'פלטפורמה דו-לשונית מלאה' : 'Full RTL & LTR Bilingual'}
            </span>
          </div>
        </div>
      </section>

      {/* CORE FEATURES (Live CMS Driven) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-brand-teal-300 dark:hover:border-brand-teal-600 transition-all flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border shadow-2xs ${
                      iconStyles[idx % 3]
                    }`}
                  >
                    {getFeatureIcon(feat.icon)}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2.5">{title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* WHY 25-MINUTES MICRO-LESSONS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-brand-teal-950 via-brand-teal-900 to-brand-teal-800 rounded-3xl p-8 sm:p-12 lg:p-16 text-white relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-olive-500/10 rounded-full blur-3xl pointer-events-none" />

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

      {/* PRICING PACKAGES */}
      <section id="packages" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          {/* Package 1 */}
          <div className="bg-white dark:bg-slate-900 p-7 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {language === 'he' ? 'למתחילים' : 'Beginner Starter'}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1 mb-2">
                {language === 'he' ? 'עברית למתחילים' : 'Starter Hebrew'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-6">
                {language === 'he'
                  ? '4 שיעורים פרטיים ממוקדים של 25 דקות אחד-על-אחד עם מורה מוסמך.'
                  : '4 private 1-on-1 focused 25-minute lessons with a native teacher.'}
              </p>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-6">
                $120{' '}
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                  {language === 'he' ? '/ תוקף ל-30 יום' : '/ 30 days validity'}
                </span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-olive-600 shrink-0" />
                  {language === 'he' ? '4 שיעורים ממוקדים של 25 דקות' : '4 Focused 25-min sessions'}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-olive-600 shrink-0" />
                  {language === 'he' ? 'לימוד אותיות האלף-בית וניקוד' : 'Alef-Bet & vowels (Nikud)'}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-olive-600 shrink-0" />
                  {language === 'he' ? 'משחקי שפה ותרגול קולי' : 'Interactive games & audio'}
                </li>
              </ul>
            </div>
            <Link
              to="/login"
              className="w-full py-3.5 text-center bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs sm:text-sm rounded-2xl transition-colors shadow-xs"
            >
              {t('landing.getStarted')}
            </Link>
          </div>

          {/* Package 2 (Highlighted) */}
          <div className="bg-gradient-to-b from-brand-teal-900 via-brand-teal-950 to-brand-teal-950 text-white p-7 sm:p-8 rounded-3xl shadow-xl relative flex flex-col justify-between ring-2 ring-brand-olive-400">
            <span className="absolute -top-3 start-1/2 -translate-x-1/2 bg-brand-olive-500 text-slate-950 text-[10px] sm:text-[11px] font-black uppercase px-3 py-1 rounded-full shadow-xs tracking-wider">
              {language === 'he' ? 'הבחירה הפופולרית ביותר' : 'Most Popular Choice'}
            </span>
            <div>
              <span className="text-xs font-bold text-brand-olive-300 uppercase tracking-wider">
                {language === 'he' ? 'התקדמות מואצת' : 'Full Progression'}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white mt-1 mb-2">
                {language === 'he' ? 'חבילת התקדמות' : 'Progress Bundle'}
              </h3>
              <p className="text-xs sm:text-sm text-brand-teal-100 mb-6">
                {language === 'he'
                  ? '10 שיעורים פרטיים ממוקדים של 25 דקות עם הקלטות וידאו ושיעורי בית מותאמים.'
                  : '10 comprehensive private 25-min sessions with recording links and custom homework.'}
              </p>
              <div className="text-3xl sm:text-4xl font-extrabold text-white mb-6">
                $270{' '}
                <span className="text-xs font-normal text-brand-teal-200">
                  {language === 'he' ? '/ תוקף ל-60 יום' : '/ 60 days validity'}
                </span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-brand-teal-100 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-olive-400 shrink-0" />
                  {language === 'he' ? '10 שיעורים ממוקדים של 25 דקות' : '10 Focused 25-min sessions'}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-olive-400 shrink-0" />
                  {language === 'he' ? 'בסיס לשיחה שוטפת ודקדוק שימושי' : 'Conversational fluency roots'}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-olive-400 shrink-0" />
                  {language === 'he' ? 'הקלטות וידאו ב-Google Drive' : 'Google Drive video recordings'}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-olive-400 shrink-0" />
                  {language === 'he' ? 'משוב אישי והערות מהמורה' : 'Dedicated teacher feedback'}
                </li>
              </ul>
            </div>
            <Link
              to="/login"
              className="w-full py-3.5 text-center bg-brand-olive-500 hover:bg-brand-olive-600 text-slate-950 font-black text-xs sm:text-sm rounded-2xl transition-all shadow-md hover:scale-[1.02]"
            >
              {t('landing.getStarted')}
            </Link>
          </div>

          {/* Package 3 */}
          <div className="bg-white dark:bg-slate-900 p-7 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {language === 'he' ? 'שליטה מתקדמת' : 'Fluency Mastery'}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1 mb-2">
                {language === 'he' ? 'שליטה מלאה' : 'Fluency Mastery'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-6">
                {language === 'he'
                  ? '20 שיעורים פרטיים מעמיקים ללימוד דקדוק מתקדם, קריאה, ניבים ושיחה חופשית.'
                  : '20 intensive 25-min sessions covering grammar, reading & idiom fluency.'}
              </p>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-6">
                $480{' '}
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                  {language === 'he' ? '/ תוקף ל-120 יום' : '/ 120 days validity'}
                </span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-olive-600 shrink-0" />
                  {language === 'he' ? '20 שיעורים פרטיים של 25 דקות' : '20 Private 25-min lessons'}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-olive-600 shrink-0" />
                  {language === 'he' ? 'דקדוק מתקדם, סלנג ועברית עסקית' : 'Advanced grammar & media slang'}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-olive-600 shrink-0" />
                  {language === 'he' ? 'קדימות בבחירת מועדי השיעורים' : 'Priority 25-min slot reservation'}
                </li>
              </ul>
            </div>
            <Link
              to="/login"
              className="w-full py-3.5 text-center bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs sm:text-sm rounded-2xl transition-colors shadow-xs"
            >
              {t('landing.getStarted')}
            </Link>
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS (FAQ Accordion) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {language === 'he' ? 'שאלות נפוצות' : 'Frequently Asked Questions'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            {language === 'he' ? 'כל מה שחשוב לדעת על הפלטפורמה והשיעורים' : 'Everything you need to know about the platform.'}
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            const q = language === 'he' ? faq.qHe : faq.qEn;
            const a = language === 'he' ? faq.aHe : faq.aEn;

            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-start flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-brand-teal-800 dark:hover:text-brand-teal-300"
                >
                  <span>{q}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-brand-teal-800 dark:text-brand-teal-400' : 'text-slate-400'
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
    </div>
  );
};
