import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../hooks/useTranslation';
import { toast } from '../store/toastStore';
import { getUserDashboardPath } from '../utils/navigation';
import {
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  Clock,
  Gamepad2,
  FolderOpen,
  CheckCircle2,
  Globe2,
  Eye,
  EyeOff,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  const setAuth = useAuthStore((state) => state.setAuth);
  const user = useAuthStore((state) => state.user);
  const { t, language, isRtl } = useTranslation();
  const navigate = useNavigate();

  // If candidate or user is already logged in, redirect directly to their dashboard
  React.useEffect(() => {
    if (user) {
      navigate(getUserDashboardPath(user.role), { replace: true });
    }
  }, [user, navigate]);

  // Active countdown timer for account lockout
  React.useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setError(null);
          setRemainingAttempts(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    if (lockoutSeconds > 0) return;

    setError(null);
    setLoading(true);

    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    try {
      const res = await api.post('/auth/login', {
        email: loginEmail,
        password: loginPass,
      });

      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      setLockoutSeconds(0);
      setRemainingAttempts(null);

      toast.success(
        language === 'he'
          ? `שלום ${res.data.user.firstName}, התחברת בהצלחה!`
          : language === 'ar'
          ? `أهلاً بك ${res.data.user.firstName}، تم تسجيل الدخول بنجاح!`
          : `Welcome back, ${res.data.user.firstName}!`,
        language === 'he' ? 'התחברות הצליחה' : language === 'ar' ? 'تم الدخول' : 'Signed In'
      );

      // Redirect by role
      const role = res.data.user.role;
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        navigate('/admin');
      } else if (role === 'SALES') {
        navigate('/sales');
      } else if (role === 'CS') {
        navigate('/cs');
      } else if (role === 'TEACHER') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
    } catch (err: any) {
      const resData = err.response?.data;
      const statusCode = err.response?.status;

      // Handle 429 Account Lockout (5 failed attempts -> 15 min lock)
      if (statusCode === 429 || resData?.retryAfterSeconds) {
        const seconds = Number(resData?.retryAfterSeconds) || 900;
        setLockoutSeconds(seconds);
        setRemainingAttempts(0);
        const msg =
          resData?.error ||
          (language === 'he'
            ? 'החשבון נחסם עקב 5 ניסיונות שגויים. נסה שוב בעוד 15 דקות.'
            : language === 'ar'
            ? 'تم قفل الحساب بسبب 5 محاولات خاطئة. يرجى المحاولة بعد 15 دقيقة.'
            : 'Account locked due to 5 consecutive failed login attempts. Please try again in 15 minutes.');
        setError(msg);
        toast.error(
          msg,
          language === 'he' ? 'חשבון נחסם זמנית' : language === 'ar' ? 'الحساب مقفل مؤقتاً' : 'Account Locked'
        );
      } else {
        if (resData?.remainingAttempts !== undefined) {
          setRemainingAttempts(resData.remainingAttempts);
        }
        const msg =
          resData?.error ||
          (language === 'he'
            ? 'פרטי ההתחברות שגויים. אנא ודא את הפרטים ונסה שוב.'
            : language === 'ar'
            ? 'بيانات تسجيل الدخول غير صحيحة. يرجى التحقق وإعادة المحاولة.'
            : 'Invalid login credentials. Please verify your details and try again.');
        setError(msg);
        toast.error(
          msg,
          language === 'he' ? 'שגיאת התחברות' : language === 'ar' ? 'خطأ في تسجيل الدخول' : 'Login Error'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-[calc(100dvh-4.5rem)] sm:min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-8 sm:p-6 lg:p-10 relative overflow-hidden"
    >
      {/* Background ambient lighting effects */}
      <div className="absolute top-1/4 start-1/4 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-[28rem] h-80 sm:h-[28rem] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 end-1/4 translate-x-1/2 translate-y-1/2 w-80 sm:w-[28rem] h-80 sm:h-[28rem] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <div className="w-full max-w-md lg:max-w-5xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-[0_20px_70px_-15px_rgba(15,80,100,0.18)] overflow-hidden lg:grid lg:grid-cols-12 relative z-10 transition-all">
        
        {/* ========================================================================= */}
        {/* DESKTOP-ONLY LEFT PANEL: Engrew Branded Experience                         */}
        {/* ========================================================================= */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-brand-teal-950 via-teal-900 to-slate-950 text-white p-8 lg:p-10 flex-col justify-between relative overflow-hidden">
          {/* Subtle decorative glow overlay */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand & Academy Info */}
          <div className="space-y-6 relative z-10">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform shrink-0">
                <img src="/logo.png" alt="Engrew" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-white block">Engrew</span>
                <span className="text-[11px] text-teal-300 font-bold tracking-wider uppercase block">
                  {language === 'he' ? 'אקדמיה לעברית ואנגלית' : language === 'ar' ? 'أكاديمية العبرية والإنجليزية' : 'Hebrew & English Academy'}
                </span>
              </div>
            </Link>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-bold border border-white/15 mb-3 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {language === 'he' ? 'לימוד שפות מתקדם • עברית ואנגלית' : language === 'ar' ? 'تعليم اللغات المتقدم • العبرية والإنجليزية' : 'Bilingual Excellence • Hebrew & English'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-[26px] font-black text-white leading-snug tracking-tight">
                {language === 'he'
                  ? 'לשלוט בשפות בביטחון ובקלות'
                  : language === 'ar'
                  ? 'تحدث اللغات بطلاقة وثقة مطلقة'
                  : 'Master Languages with Confidence'}
              </h1>
              <p className="text-teal-100/90 text-xs sm:text-sm mt-2 leading-relaxed">
                {language === 'he'
                  ? 'שיעורים פרטיים ממוקדים אחד-על-אחד, למידה חווייתית מבוססת משחקים ומורים ישראלים מקצועיים בסנכרון מלא ללוח הזמנים שלך.'
                  : language === 'ar'
                  ? 'حصص فردية مكثفة 1-على-1، تعلّم ممتع عبر الألعاب الحية، ونخبة المعلمين المعتمدين بتزامن تام مع جدولك.'
                  : 'Personalized 1-on-1 private lessons, gamified acquisition, and certified native teachers synchronized to your schedule.'}
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0 text-emerald-300">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-white">
                    {language === 'he' ? 'שיעורים ממוקדים בני 25 דקות' : language === 'ar' ? 'حصص مكثفة لمدة 25 دقيقة' : '25-Minute High-Retention Slots'}
                  </h2>
                  <p className="text-[11px] text-teal-200/80 leading-tight mt-0.5">
                    {language === 'he'
                      ? 'מפגשים פרטיים ממוקדים המונעים עייפות ומגדילים את כושר הזכירה.'
                      : language === 'ar'
                      ? 'جلسات فردية دقيقة تلغي التشتت وتضاعف سرعة الاستيعاب والتركيز.'
                      : 'Focused private sessions designed to eliminate mental fatigue and maximize recall.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0 text-emerald-300">
                  <Globe2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-white">
                    {language === 'he' ? 'סנכרון מלא לשעון ישראל ולעולם' : language === 'ar' ? 'تزامن ذكي مع توقيت القدس والعالم' : 'Synchronized Global Timetable'}
                  </h2>
                  <p className="text-[11px] text-teal-200/80 leading-tight mt-0.5">
                    {language === 'he'
                      ? 'לוח זמנים ברור בפורמט 12 שעות AM/PM המחובר ישירות לאזור הזמן שלך.'
                      : language === 'ar'
                      ? 'نظام مواعيد مرن بصيغة 12 ساعة متزامن مع منطقتك الزمنية بدقة.'
                      : 'Clear 12-hour AM/PM schedule linked directly to Jerusalem & your local time zone.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0 text-emerald-300">
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-white">
                    {language === 'he' ? 'משחקים אמיתיים ואינטראקטיביים' : language === 'ar' ? 'ألعاب حية وتفاعلية' : 'Interactive Real Games Suite'}
                  </h2>
                  <p className="text-[11px] text-teal-200/80 leading-tight mt-0.5">
                    {language === 'he'
                      ? 'כרטיסיות שמע, התאמת אוצר מילים וחידוני מהירות לצבירת נקודות.'
                      : language === 'ar'
                      ? 'بطاقات صوتية، مطابقة المفردات، واختبارات سرعة لجمع النقاط التنافسية.'
                      : 'Audio flashcards, vocabulary pairing, and timed quizzes for active points.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0 text-emerald-300">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-white">
                    {language === 'he' ? 'הקלטות שיעורים וחומרי לימוד' : language === 'ar' ? 'تسجيلات الدروس والملاحظات' : 'Cloud Lesson Recordings & Notes'}
                  </h2>
                  <p className="text-[11px] text-teal-200/80 leading-tight mt-0.5">
                    {language === 'he'
                      ? 'גישה קבועה לצפייה חוזרת בשיעורים המוקלטים והערות אישיות מהמורה.'
                      : language === 'ar'
                      ? 'وصول غير محدود لحصص الفيديو المسجلة وملاحظات المدرس الشخصية.'
                      : 'Permanent access to recorded lesson videos and customized teacher notes.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Social Proof & Trust */}
          <div className="mt-8 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-teal-100 relative z-10">
            <span className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{language === 'he' ? '100% מורים מוסמכים' : language === 'ar' ? 'معلمون أصليون معتمدون' : '100% Native Certified'}</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-teal-300 font-bold bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
              <span>{language === 'he' ? 'אבטחה מוצפנת' : language === 'ar' ? 'منصة مشفرة وآمنة' : '256-bit Encrypted'}</span>
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT PANEL: Sleek Modern Form & Discovery Hub                          */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-white dark:bg-slate-900 transition-colors">
          <div>
            {/* Top Toolbar: Mobile Brand & Desktop Greeting */}
            <div className="flex items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-100 dark:border-slate-800/80">
              {/* Mobile-only logo indicator */}
              <div className="lg:hidden flex items-center gap-2.5">
                <Link to="/" className="flex items-center gap-2">
                  <img src="/logo.png" alt="Engrew" className="h-9 w-auto object-contain" />
                  <span className="text-lg font-black text-slate-900 dark:text-white">Engrew</span>
                </Link>
              </div>

              {/* Desktop Greeting Header */}
              <div className="hidden lg:block">
                <span className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-widest block">
                  {language === 'he' ? 'כניסת משתמשים' : language === 'ar' ? 'بوابة الدخول' : 'Member Portal'}
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                  {language === 'he' ? 'ברוכים הבאים ל-Engrew' : language === 'ar' ? 'أهلاً بك في Engrew' : 'Welcome to Engrew'}
                </h2>
              </div>

              <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/70 border border-teal-100 dark:border-teal-900 flex items-center justify-center text-teal-800 dark:text-teal-300 shadow-2xs">
                <Lock className="w-5 h-5" />
              </div>
            </div>

            {/* Mobile Header Headline */}
            <div className="lg:hidden text-center mb-6">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'he' ? 'כניסה לחשבון' : language === 'ar' ? 'تسجيل الدخول' : 'Sign in to Engrew'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {language === 'he'
                  ? 'הזן את פרטי ההתחברות שלך כדי לגשת לשיעורים'
                  : language === 'ar'
                  ? 'أدخل بيانات حسابك للوصول إلى حصصك واختباراتك'
                  : 'Access your lessons, calendar, and learning games'}
              </p>
            </div>

            {/* Security Alerts & Rate Limiting Notifications */}
            {lockoutSeconds > 0 ? (
              <div className="mb-5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold space-y-2 shadow-xs animate-pulse">
                <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    <span>
                      {language === 'he'
                        ? 'החשבון נחסם זמנית (5 שגיאות)'
                        : language === 'ar'
                        ? 'تم قفل الحساب مؤقتاً (5 محاولات)'
                        : 'Account Temporarily Locked'}
                    </span>
                  </div>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-rose-200/80 dark:bg-rose-900/60 font-bold">
                    {Math.floor(lockoutSeconds / 60)}:{String(lockoutSeconds % 60).padStart(2, '0')}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {language === 'he'
                    ? `בוצעו 5 ניסיונות כושלים ברצף. לצורכי אבטחה, הכניסה חסומה למשך 15 דקות.`
                    : language === 'ar'
                    ? `تم رصد 5 محاولات خاطئة متتالية. لحماية حسابك، تم حظر الدخول مؤقتاً لمدة 15 دقيقة.`
                    : `5 consecutive failed attempts detected. For security purposes, access is locked for 15 minutes.`}
                </p>
              </div>
            ) : error ? (
              <div
                className={`mb-5 p-3.5 sm:p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-2xs ${
                  remainingAttempts !== null && remainingAttempts <= 2
                    ? 'bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                    : 'bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
                }`}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    remainingAttempts !== null && remainingAttempts <= 2 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                />
                <span className="leading-snug">{error}</span>
              </div>
            ) : null}

            {/* Main Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {language === 'he' ? 'כתובת אימייל' : language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={lockoutSeconds > 0}
                    required
                    className="w-full ps-10 pe-4 py-3 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-teal-600 dark:focus:border-teal-400 text-slate-900 dark:text-white rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all shadow-2xs disabled:opacity-50"
                    placeholder="student@example.com"
                  />
                </div>
              </div>

              {/* Password with Eye Show/Hide Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {language === 'he' ? 'סיסמה' : language === 'ar' ? 'كلمة المرور' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={lockoutSeconds > 0}
                    required
                    className="w-full ps-10 pe-11 py-3 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-teal-600 dark:focus:border-teal-400 text-slate-900 dark:text-white rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all shadow-2xs disabled:opacity-50"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-300 font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-md text-teal-700 focus:ring-teal-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                  />
                  <span>
                    {language === 'he' ? 'זכור אותי במכשיר זה' : language === 'ar' ? 'تذكرني على هذا الجهاز' : 'Remember me on this device'}
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || lockoutSeconds > 0}
                className="w-full py-3.5 px-5 bg-gradient-to-r from-brand-teal-800 via-teal-800 to-teal-700 hover:from-brand-teal-900 hover:via-teal-900 hover:to-teal-800 active:scale-[0.99] text-white font-black text-sm rounded-2xl shadow-lg shadow-teal-900/15 hover:shadow-xl hover:shadow-teal-900/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 mt-2"
              >
                {lockoutSeconds > 0 ? (
                  <>
                    <ShieldAlert className="w-4 h-4 text-rose-300" />
                    <span>
                      {language === 'he' ? 'נעול זמנית' : language === 'ar' ? 'مقفل مؤقتاً' : 'Locked'} ({Math.floor(lockoutSeconds / 60)}:{String(lockoutSeconds % 60).padStart(2, '0')})
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      {loading
                        ? language === 'he'
                          ? 'מתחבר למערכת...'
                          : language === 'ar'
                          ? 'جاري التحقق...'
                          : 'Signing In...'
                        : language === 'he'
                        ? 'כניסה למערכת'
                        : language === 'ar'
                        ? 'تسجيل الدخول'
                        : 'Sign In to Portal'}
                    </span>
                    {isRtl ? (
                      <ArrowLeft className="w-4 h-4 text-emerald-300" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-emerald-300" />
                    )}
                  </>
                )}
              </button>
            </form>

            {/* ========================================================================= */}
            {/* BALANCED CONTENT SECTION: Placement Test Invitation & Advisor Assistance  */}
            {/* (Eliminates the empty white void below the form with high-value actions) */}
            {/* ========================================================================= */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
              {/* Feature Box: English Placement Test */}
              <Link
                to="/placement-test"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-teal-50/70 via-emerald-50/40 to-slate-50 dark:from-teal-950/40 dark:via-slate-800/60 dark:to-slate-800/40 border border-teal-100 dark:border-teal-900/50 hover:border-teal-300 dark:hover:border-teal-700 transition-all group shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors flex items-center gap-1.5">
                      <span>
                        {language === 'he'
                          ? 'מבחן רמה באנגלית (חינם)'
                          : language === 'ar'
                          ? 'اختبار تحديد المستوى بالإنجليزية (مجانًا)'
                          : 'Free English Placement Test'}
                      </span>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 uppercase">
                        CEFR A1-C1
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {language === 'he'
                        ? 'בדוק את רמת הדקדוק שלך ב-36 שאלות אדפטיביות'
                        : language === 'ar'
                        ? 'قيّم مستواك بدقة خلال 36 سؤالاً مع شهادة فورية'
                        : 'Discover your exact CEFR level in 10 minutes'}
                    </p>
                  </div>
                </div>
                <div className="text-teal-700 dark:text-teal-300 font-bold text-xs shrink-0 px-2 py-1 rounded-lg group-hover:bg-teal-100/60 dark:group-hover:bg-teal-900/50 transition-colors">
                  {isRtl ? '←' : '→'}
                </div>
              </Link>
            </div>
          </div>

          {/* Bottom Footer Bar */}
          <div className="mt-8 pt-4 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/"
              className="text-teal-800 dark:text-teal-400 font-bold hover:underline flex items-center gap-1"
            >
              {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
              <span>{language === 'he' ? 'חזרה לדף הבית' : language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}</span>
            </Link>
            <div className="flex items-center gap-2 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                {language === 'he' ? 'חיבור מאובטח 256-bit SSL' : language === 'ar' ? 'اتصال آمن ومشفّر 256-bit' : '256-bit SSL Secured'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
