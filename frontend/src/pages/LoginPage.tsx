import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../hooks/useTranslation';
import { toast } from '../store/toastStore';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  Clock,
  Gamepad2,
  FolderOpen,
  CheckCircle2,
  Globe2,
  Users,
  Briefcase,
  Headphones,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  const setAuth = useAuthStore((state) => state.setAuth);
  const { t, language } = useTranslation();
  const navigate = useNavigate();

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

      setAuth(res.data.user, res.data.accessToken);
      setLockoutSeconds(0);
      setRemainingAttempts(null);

      toast.success(
        language === 'he' ? `שלום ${res.data.user.firstName}, התחברת בהצלחה!` : `Welcome back, ${res.data.user.firstName}!`,
        language === 'he' ? 'התחברות הצליחה' : 'Signed In'
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
        const msg = resData?.error || (language === 'he'
          ? 'החשבון נחסם עקב 5 ניסיונות שגויים. נסה שוב בעוד 15 דקות.'
          : 'Account locked due to 5 consecutive failed login attempts. Please try again in 15 minutes.');
        setError(msg);
        toast.error(msg, language === 'he' ? 'חשבון נחסם זמנית' : 'Account Locked');
      } else {
        if (resData?.remainingAttempts !== undefined) {
          setRemainingAttempts(resData.remainingAttempts);
        }
        const msg =
          resData?.error ||
          (language === 'he'
            ? 'פרטי ההתחברות שגויים. אנא נסה שוב או השתמש במשתמש הדגמה.'
            : 'Invalid login credentials. Please verify your details or use a 1-click demo account.');
        setError(msg);
        toast.error(msg, language === 'he' ? 'שגיאת התחברות' : 'Login Error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    handleLogin(undefined, demoEmail, demoPass);
  };

  return (
    <div className="min-h-[calc(100dvh-4.5rem)] sm:min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-6 sm:p-6 lg:p-10 relative overflow-hidden">
      {/* Background ambient Apple-style glow */}
      <div className="absolute top-1/4 start-1/4 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-brand-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 end-1/4 translate-x-1/2 translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-brand-olive-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassy Card: Single sleek card on mobile, Split-Screen on Desktop */}
      <div className="w-full max-w-md lg:max-w-5xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-[0_20px_60px_-15px_rgba(12,74,96,0.15)] overflow-hidden lg:grid lg:grid-cols-12 relative z-10 transition-all">
        
        {/* DESKTOP-ONLY LEFT PANEL: Engrew Platform Info, Logo & Utilities Brief */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-b from-brand-teal-950 via-brand-teal-900 to-brand-teal-800 text-white p-8 lg:p-10 flex-col justify-between relative overflow-hidden">
          {/* Subtle decorative glow overlay */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-olive-400/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Brand Header */}
          <div className="space-y-6 relative z-10">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0">
                <img src="/logo.png" alt="Engrew" className="w-full h-full object-contain drop-shadow-2xs" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-white block">Engrew</span>
                <span className="text-[11px] text-brand-olive-300 font-semibold tracking-wider uppercase block">
                  {language === 'he' ? 'אקדמיה לעברית' : 'Hebrew Language Academy'}
                </span>
              </div>
            </Link>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-brand-olive-300 text-xs font-bold border border-white/15 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{language === 'he' ? 'הדור הבא בלימוד עברית' : 'Next-Gen Hebrew Learning'}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
                {language === 'he' ? 'לדבר עברית מודרנית בביטחון ובקלות' : 'Speak Modern Hebrew with Confidence'}
              </h1>
              <p className="text-brand-teal-100 text-xs sm:text-sm mt-2 leading-relaxed">
                {language === 'he'
                  ? 'שיעורים פרטיים ממוקדים אחד-על-אחד, למידה חווייתית מבוססת משחקים ומורים ישראלים מקצועיים בסנכרון מלא ללוח הזמנים שלך.'
                  : 'Personalized 1-on-1 micro-lessons, gamified acquisition, and native Israeli teachers synchronized to your schedule.'}
              </p>
            </div>

            {/* Platform Utilities & Functions Brief */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center shrink-0 text-brand-olive-300">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-white">
                    {language === 'he' ? 'שיעורים ממוקדים בני 25 דקות' : '25-Minute High-Retention Slots'}
                  </h2>
                  <p className="text-[11px] text-brand-teal-100/90 leading-tight mt-0.5">
                    {language === 'he'
                      ? 'מפגשים פרטיים ממוקדים המונעים עייפות ומגדילים את כושר הזכירה ב-40%.'
                      : 'Focused private sessions designed to eliminate mental fatigue and maximize recall.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center shrink-0 text-brand-olive-300">
                  <Globe2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-white">
                    {language === 'he' ? 'סנכרון מלא לשעון ישראל (IST)' : 'Synchronized Israel Timing (IST)'}
                  </h2>
                  <p className="text-[11px] text-brand-teal-100/90 leading-tight mt-0.5">
                    {language === 'he'
                      ? 'לוח זמנים ברור בפורמט 12 שעות AM/PM המחובר ישירות לאזור הזמן של ישראל.'
                      : 'Clear 12-hour AM/PM schedule linked directly to Jerusalem & Tel Aviv time zones.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center shrink-0 text-brand-olive-300">
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-white">
                    {language === 'he' ? 'מערך משחקים אמיתיים ואינטראקטיביים' : 'Interactive Real Games Suite'}
                  </h2>
                  <p className="text-[11px] text-brand-teal-100/90 leading-tight mt-0.5">
                    {language === 'he'
                      ? 'כרטיסיות שמע תלת-ממדיות לאלף-בית, התאמת אוצר מילים וחידוני מהירות לצבירת נקודות.'
                      : '3D Alef-Bet audio flashcards, vocabulary pairing, and timed quizzes for points.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center shrink-0 text-brand-olive-300">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-white">
                    {language === 'he' ? 'הקלטות שיעורים ב-Google Drive' : 'Google Drive Class Recordings'}
                  </h2>
                  <p className="text-[11px] text-brand-teal-100/90 leading-tight mt-0.5">
                    {language === 'he'
                      ? 'גישה קבועה לצפייה חוזרת בשיעורים המוקלטים והערות אישיות מהמורה.'
                      : 'Permanent access to recorded lesson videos and customized teacher notes.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Social Proof / Stat */}
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-brand-teal-100 relative z-10">
            <span className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-brand-olive-400" />
              {language === 'he' ? '100% מורים ישראלים מוסמכים' : '100% Native Instructors'}
            </span>
            <span className="text-xs text-brand-olive-300 font-bold">
              {language === 'he' ? 'עברית שוטפת בביטחון' : 'Fluent Hebrew with Confidence'}
            </span>
          </div>
        </div>

        {/* SIGN IN FORM PANEL: Optimized for Mobile Touch & Desktop Clarity */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl transition-colors">
          <div>
            {/* MOBILE BRAND HEADER (Hidden on desktop) */}
            <div className="lg:hidden text-center mb-6">
              <Link to="/" className="inline-flex flex-col items-center gap-2 group">
                <div className="relative flex items-center justify-center p-1.5 rounded-2xl bg-gradient-to-br from-brand-teal-50 to-brand-olive-50 dark:from-brand-teal-950/50 dark:to-slate-900 border border-brand-teal-100/60 dark:border-brand-teal-800/50 shadow-sm group-hover:shadow-md transition-all group-hover:scale-105 duration-200">
                  <img src="/logo.png" alt="Engrew" className="h-14 w-auto object-contain drop-shadow-xs" />
                </div>
                <div>
                  <span className="text-2xl font-black tracking-tight text-brand-teal-900 dark:text-brand-teal-100">Engrew</span>
                  <span className="text-[11px] font-bold text-brand-teal-700 dark:text-brand-teal-400 uppercase tracking-widest block">
                    {language === 'he' ? 'אקדמיה לעברית' : 'Hebrew Academy'}
                  </span>
                </div>
              </Link>
            </div>

            {/* DESKTOP HEADING (Hidden on mobile) */}
            <div className="hidden lg:flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {language === 'he' ? 'ברוכים הבאים ל-Engrew' : 'Welcome to Engrew'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {language === 'he'
                    ? 'התחבר לחשבונך כדי לגשת לשיעורים, למשחקים ולמערכת השעות'
                    : 'Sign in to access your Hebrew learning dashboard, lessons, and games'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-brand-teal-50 dark:bg-brand-teal-950/70 border border-brand-teal-100 dark:border-brand-teal-900 flex items-center justify-center text-brand-teal-800 dark:text-brand-teal-300 shadow-2xs">
                <Lock className="w-5 h-5" />
              </div>
            </div>

            {/* MOBILE HEADING */}
            <div className="lg:hidden text-center mb-5">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {language === 'he' ? 'כניסה לחשבון' : 'Sign In'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'he'
                  ? 'הזן פרטי משתמש או השתמש במשתמש הדגמה'
                  : 'Enter credentials or choose a 1-click demo'}
              </p>
            </div>

            {/* Rate Limiting & Error States */}
            {lockoutSeconds > 0 ? (
              <div className="mb-5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold space-y-1.5 shadow-sm animate-pulse">
                <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    <span>{language === 'he' ? 'החשבון נחסם זמנית (5 שגיאות)' : 'Account Temporarily Locked'}</span>
                  </div>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-rose-200/80 dark:bg-rose-900/60 font-bold">
                    {Math.floor(lockoutSeconds / 60)}:{String(lockoutSeconds % 60).padStart(2, '0')}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {language === 'he'
                    ? `בוצעו 5 ניסיונות כושלים ברצף. לצורכי אבטחה, הכניסה חסומה למשך 15 דקות. ניתן לנסות שוב בעוד ${Math.floor(lockoutSeconds / 60)} דקות ו-${lockoutSeconds % 60} שניות.`
                    : `5 consecutive failed attempts detected. For your security, this account is locked for 15 minutes. Please wait for the timer to expire.`}
                </p>
              </div>
            ) : error ? (
              <div className={`mb-5 p-3.5 sm:p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-2xs ${
                remainingAttempts !== null && remainingAttempts <= 2
                  ? 'bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                  : 'bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
              }`}>
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  remainingAttempts !== null && remainingAttempts <= 2 ? 'bg-amber-500' : 'bg-rose-500'
                }`} />
                <span>{error}</span>
              </div>
            ) : null}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {language === 'he' ? 'כתובת אימייל' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute start-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={lockoutSeconds > 0}
                    required
                    className="w-full ps-10 pe-4 py-3 sm:py-3 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-teal-800 dark:focus:ring-brand-teal-500 transition-all shadow-2xs disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900"
                    placeholder="you@learnhebrew.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {language === 'he' ? 'סיסמה' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute start-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={lockoutSeconds > 0}
                    required
                    className="w-full ps-10 pe-4 py-3 sm:py-3 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-teal-800 dark:focus:ring-brand-teal-500 transition-all shadow-2xs disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || lockoutSeconds > 0}
                className="w-full py-3.5 px-4 bg-brand-teal-800 hover:bg-brand-teal-900 dark:bg-brand-teal-700 dark:hover:bg-brand-teal-600 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all hover:shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
              >
                {lockoutSeconds > 0 ? (
                  <>
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>
                      {language === 'he' ? 'נעול' : 'Locked'} ({Math.floor(lockoutSeconds / 60)}:{String(lockoutSeconds % 60).padStart(2, '0')})
                    </span>
                  </>
                ) : (
                  <>
                    <span>{loading ? (language === 'he' ? 'מתחבר למערכת...' : 'Signing In...') : (language === 'he' ? 'כניסה למערכת' : 'Sign In')}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180 text-brand-olive-300" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Login Cards: Compact 3-Column on Both Mobile & Desktop */}
            <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-teal-700 dark:text-brand-teal-400" />
                  {language === 'he' ? 'כניסה מהירה למשתמשי בדיקה' : '1-Click Demo Accounts'}
                </span>
                <span className="text-[10px] sm:text-[11px] text-brand-teal-700 dark:text-brand-teal-400 font-bold">
                  {language === 'he' ? 'לחץ להתחברות' : 'Tap to Login'}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {/* Admin Button */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@learnhebrew.com', 'Admin@2026!')}
                  className="p-2 text-center rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-slate-700/50 transition-all active:scale-95 group flex flex-col items-center justify-center shadow-2xs"
                  title="Super Admin"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center mb-1 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white text-[11px] sm:text-xs block">
                    {language === 'he' ? 'מנהל' : 'Admin'}
                  </span>
                  <p className="text-[9px] text-slate-400 font-mono truncate hidden sm:block">admin@</p>
                </button>

                {/* Sales Button (NEW) */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('sales@learnhebrew.com', 'Admin@2026!')}
                  className="p-2 text-center rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-all active:scale-95 group flex flex-col items-center justify-center shadow-2xs"
                  title="Sales Representative"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center mb-1 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white text-[11px] sm:text-xs block">
                    {language === 'he' ? 'מכירות' : 'Sales'}
                  </span>
                  <p className="text-[9px] text-slate-400 font-mono truncate hidden sm:block">sales@</p>
                </button>

                {/* CS Button (NEW) */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('cs@learnhebrew.com', 'Admin@2026!')}
                  className="p-2 text-center rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:border-teal-500 dark:hover:border-teal-400 hover:bg-teal-50/50 dark:hover:bg-slate-700/50 transition-all active:scale-95 group flex flex-col items-center justify-center shadow-2xs"
                  title="Customer Service"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/60 flex items-center justify-center mb-1 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
                    <Headphones className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white text-[11px] sm:text-xs block">
                    {language === 'he' ? 'שירות' : 'CS'}
                  </span>
                  <p className="text-[9px] text-slate-400 font-mono truncate hidden sm:block">cs@</p>
                </button>

                {/* Teacher Button */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('mona.khalil@learnhebrew.com', 'Teacher@2026!')}
                  className="p-2 text-center rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-slate-700/50 transition-all active:scale-95 group flex flex-col items-center justify-center shadow-2xs"
                  title="Teacher Mona"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center mb-1 text-emerald-700 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                    <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white text-[11px] sm:text-xs block">
                    {language === 'he' ? 'מורה' : 'Teacher'}
                  </span>
                  <p className="text-[9px] text-slate-400 font-mono truncate hidden sm:block">mona@</p>
                </button>

                {/* Student Button */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('omar.farouk@gmail.com', 'Student@2026!')}
                  className="p-2 text-center rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:border-cyan-500 dark:hover:border-cyan-400 hover:bg-cyan-50/50 dark:hover:bg-slate-700/50 transition-all active:scale-95 group flex flex-col items-center justify-center shadow-2xs"
                  title="Student Omar"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200/60 dark:border-cyan-800/60 flex items-center justify-center mb-1 text-cyan-700 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white text-[11px] sm:text-xs block">
                    {language === 'he' ? 'תלמיד' : 'Student'}
                  </span>
                  <p className="text-[9px] text-slate-400 font-mono truncate hidden sm:block">omar@</p>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Back Link & Security Badge */}
          <div className="mt-6 pt-4 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-3">
            <Link to="/" className="text-brand-teal-800 dark:text-brand-teal-400 font-bold hover:underline">
              {language === 'he' ? 'חזרה לדף הבית' : 'Back to Home'}
            </Link>
            <span>•</span>
            <span>{language === 'he' ? 'פרוטוקול כניסה מאובטח' : 'Encrypted Access'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
