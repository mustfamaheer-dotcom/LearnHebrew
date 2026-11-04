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
  GraduationCap,
  Sparkles,
  Clock,
  Gamepad2,
  FolderOpen,
  CheckCircle2,
  Globe2,
  Users,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAuth = useAuthStore((state) => state.setAuth);
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
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
      toast.success(
        language === 'he' ? `שלום ${res.data.user.firstName}, התחברת בהצלחה!` : `Welcome back, ${res.data.user.firstName}!`,
        language === 'he' ? 'התחברות הצליחה' : 'Signed In'
      );

      // Redirect by role
      const role = res.data.user.role;
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        navigate('/admin');
      } else if (role === 'TEACHER') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        (language === 'he'
          ? 'פרטי ההתחברות שגויים. אנא נסה שוב או השתמש במשתמש הדגמה.'
          : 'Invalid login credentials. Please verify your details or use a 1-click demo account.');
      setError(msg);
      toast.error(msg, language === 'he' ? 'שגיאת התחברות' : 'Login Error');
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
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-3 sm:p-6 lg:p-10 relative overflow-hidden">
      {/* Background ambient Apple-style glow */}
      <div className="absolute top-1/4 start-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 end-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-brand-olive-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassy Split-Screen Card */}
      <div className="w-full max-w-5xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-[0_20px_60px_-15px_rgba(12,74,96,0.15)] overflow-hidden grid lg:grid-cols-12 relative z-10">
        
        {/* LEFT PANEL: Engrew Platform Info, Logo & Utilities Brief */}
        <div className="lg:col-span-5 bg-gradient-to-b from-brand-teal-950 via-brand-teal-900 to-brand-teal-800 text-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle decorative glow overlay */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-olive-400/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Brand Header */}
          <div className="space-y-6 relative z-10">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-2 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <img src="/logo.png" alt="Engrew" className="w-full h-full object-contain brightness-0 invert" />
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

        {/* RIGHT PANEL: Sign In Form & Instant Demo Credentials */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl transition-colors">
          <div>
            <div className="flex items-center justify-between mb-8">
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

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5 shadow-2xs">
                <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

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
                    required
                    className="w-full ps-10 pe-4 py-3 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-teal-800 dark:focus:ring-brand-teal-500 transition-all shadow-2xs"
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
                    required
                    className="w-full ps-10 pe-4 py-3 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-teal-800 dark:focus:ring-brand-teal-500 transition-all shadow-2xs"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-brand-teal-800 hover:bg-brand-teal-900 dark:bg-brand-teal-700 dark:hover:bg-brand-teal-600 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all hover:shadow-lg flex items-center justify-center gap-2 mt-2"
              >
                <span>{loading ? (language === 'he' ? 'מתחבר למערכת...' : 'Signing In...') : (language === 'he' ? 'כניסה למערכת' : 'Sign In')}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180 text-brand-olive-300" />
              </button>
            </form>

            {/* Quick Demo Login Cards */}
            <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-teal-700 dark:text-brand-teal-400" />
                  {language === 'he' ? 'כניסה מיידית למשתמשי הדגמה' : '1-Click Demo Evaluation Sign-In'}
                </span>
                <span className="text-[11px] text-brand-teal-700 dark:text-brand-teal-400 font-semibold">
                  {language === 'he' ? 'לחץ לבדיקה' : 'Click to Test'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Admin Button */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@learnhebrew.com', 'Admin@2026!')}
                  className="p-3 text-start rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:border-brand-teal-500 dark:hover:border-brand-teal-400 hover:bg-brand-teal-50/40 dark:hover:bg-slate-700/50 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      {language === 'he' ? 'מנהל מערכת' : 'Super Admin'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">admin@learnhebrew.com</p>
                </button>

                {/* Teacher Button */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('sarah.cohen@learnhebrew.com', 'Teacher@2026!')}
                  className="p-3 text-start rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:border-brand-olive-500 dark:hover:border-brand-olive-400 hover:bg-brand-olive-50/40 dark:hover:bg-slate-700/50 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <GraduationCap className="w-4 h-4 text-brand-olive-700 dark:text-brand-olive-400 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      {language === 'he' ? 'מורה מוסמך' : 'Teacher'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">sarah.cohen@...</p>
                </button>

                {/* Student Button */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('daniel.cohen@learnhebrew.com', 'Student@2026!')}
                  className="p-3 text-start rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:border-brand-teal-500 dark:hover:border-brand-teal-400 hover:bg-brand-teal-50/40 dark:hover:bg-slate-700/50 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-400 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      {language === 'he' ? 'תלמיד' : 'Student'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">daniel.cohen@...</p>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 text-center text-xs text-slate-400 dark:text-slate-500">
            {language === 'he'
              ? 'מוגן באמצעות פרוטוקול אבטחה מתקדם ומדיניות ניטור כניסות.'
              : 'Protected by enterprise JWT authentication & rate-limiting policies.'}
          </div>
        </div>
      </div>
    </div>
  );
};
