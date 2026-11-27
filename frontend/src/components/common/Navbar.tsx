import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from '../../hooks/useTranslation';
import { LanguagePref } from '../../types';
import {
  Globe,
  LogOut,
  Sun,
  Moon,
  Settings,
  Search,
  ChevronDown,
  Check,
  Award,
  LayoutDashboard,
  ArrowRight,
  LogIn,
} from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';
import { getAvatarUrl } from '../../utils/avatar';
import { AvatarWithFrame } from './AvatarWithFrame';
import { StyledNickname } from './StyledNickname';
import { getUserDashboardPath, getDashboardButtonLabel } from '../../utils/navigation';

const LANGUAGES_LIST: { code: LanguagePref; label: string; nativeLabel: string; flag: string; short: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇺🇸', short: 'EN' },
  { code: 'he', label: 'Hebrew', nativeLabel: 'עברית', flag: '🇮🇱', short: 'עב' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', flag: '🇸🇦', short: 'عر' },
];

export const Navbar: React.FC = () => {
  const { user, accessToken, logout, openProfileModal } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { t, language, setLanguage } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  // Securely verify authentication state
  const storedToken = typeof window !== 'undefined' ? localStorage.getItem('learnhebrew_token') : null;
  const isAuthenticated = Boolean(user && (accessToken || storedToken));

  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    if (isLangMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLangMenuOpen]);

  const currentLangObj = LANGUAGES_LIST.find((l) => l.code === language) || LANGUAGES_LIST[0];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/80 shadow-xs transition-colors duration-200">
        <div className="w-full px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          {/* Logo & Brand Name */}
          <div className="flex items-center min-w-0 shrink-0">
            <Link to="/" className="flex items-center gap-1.5 sm:gap-3 group py-1 min-w-0 shrink-0">
              <div className="relative flex items-center justify-center p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-brand-teal-50 to-brand-olive-50 dark:from-brand-teal-950/50 dark:to-slate-900 border border-brand-teal-100/60 dark:border-brand-teal-800/50 shadow-xs group-hover:shadow-sm transition-all group-hover:scale-105 duration-200 shrink-0">
                <img
                  src="/logo.png"
                  alt="Engrew Logo"
                  className="h-7 sm:h-11 w-auto object-contain drop-shadow-xs"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="text-base sm:text-2xl font-black tracking-tight text-brand-teal-900 dark:text-brand-teal-100 group-hover:text-brand-teal-700 dark:group-hover:text-brand-teal-300 transition-colors whitespace-nowrap">
                    Engrew
                  </span>
                  <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-brand-olive-500 animate-pulse shrink-0"></span>
                </div>
                <span className="hidden sm:block text-[9px] sm:text-[11px] font-semibold text-brand-teal-700/80 dark:text-brand-teal-300/80 uppercase tracking-wider truncate">
                  {language === 'he' ? 'אקדמיה לעברית ואנגלית' : (language === 'ar' ? 'أكاديمية اللغة العبرية والإنجليزية' : 'Hebrew & English Academy')}
                </span>
              </div>
            </Link>
          </div>

          {/* Right Controls: Dark Mode Toggle, Language switch & User profile */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Direct Link to English Placement Test */}
            <Link
              to="/placement-test"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/30 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 font-extrabold text-xs shadow-2xs hover:shadow-xs transition-all hover:scale-105"
            >
              <Award className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>
                {language === 'he' ? 'מבחן רמה' : language === 'ar' ? 'اختبار تحديد المستوى' : 'Placement Test'}
              </span>
            </Link>
            {/* Spotlight / Command Palette Button (⌘K) - hidden on Landing Page and Mobile */}
            {!isLandingPage && user && (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('engrew:open-command-palette'))}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all shadow-2xs group shrink-0"
                title={language === 'he' ? 'חיפוש מהיר ופקודות (⌘K)' : 'Quick command palette (⌘K)'}
                aria-label="Quick Command Palette"
              >
                <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-brand-teal-600 dark:group-hover:text-teal-400 transition-colors" />
                <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 border border-slate-200 dark:border-slate-700 font-mono">
                  <span>⌘</span>
                  <span>K</span>
                </kbd>
              </button>
            )}

            {/* Dark Mode Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all shadow-2xs group shrink-0"
              title={theme === 'dark' ? (language === 'he' ? 'מעבר למצב יום' : 'Switch to Light Mode') : (language === 'he' ? 'מעבר למצב לילה' : 'Switch to Dark Mode')}
              aria-label="Toggle Dark Mode"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 group-hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Multilingual Selector Dropdown */}
            <div className="relative shrink-0" ref={langMenuRef}>
              <button
                type="button"
                onClick={() => setIsLangMenuOpen((prev) => !prev)}
                className="h-8 sm:h-9 px-2 sm:px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 hover:bg-brand-teal-50/60 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all shadow-2xs group shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
                title="Change Platform Language / تغيير لغة الموقع"
                aria-label="Change Language"
                aria-expanded={isLangMenuOpen}
              >
                <Globe className="w-3.5 h-3.5 text-brand-teal-600 dark:text-brand-teal-400 group-hover:rotate-45 transition-transform shrink-0" />
                <span className="text-base leading-none shrink-0">{currentLangObj.flag}</span>
                <span className="font-bold hidden sm:inline">{currentLangObj.nativeLabel}</span>
                <span className="font-black text-xs sm:hidden">{currentLangObj.short}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isLangMenuOpen ? 'rotate-180 text-brand-teal-600' : ''}`} />
              </button>

              {/* Language Options Dropdown Menu */}
              {isLangMenuOpen && (
                <div
                  role="menu"
                  className="absolute end-0 top-full mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 mb-1">
                    {language === 'he' ? 'בחר שפה' : (language === 'ar' ? 'اختر لغة الموقع' : 'Select Language')}
                  </div>
                  <div className="space-y-0.5">
                    {LANGUAGES_LIST.map((langItem) => {
                      const isSelected = language === langItem.code;
                      return (
                        <button
                          key={langItem.code}
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setLanguage(langItem.code);
                            setIsLangMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-brand-teal-50 dark:bg-brand-teal-950/60 text-brand-teal-800 dark:text-brand-teal-200'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base leading-none">{langItem.flag}</span>
                            <div className="flex flex-col text-start">
                              <span className="leading-tight">{langItem.nativeLabel}</span>
                              <span className="text-[10px] text-slate-400 font-normal leading-tight">
                                {langItem.label}
                              </span>
                            </div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-brand-teal-600 dark:text-brand-teal-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2.5 sm:gap-3">
                {/* Real-time Notification Bell & Drawer */}
                <div className="relative shrink-0 flex items-center">
                  <NotificationBell />
                </div>

                {/* User Profile Pill -> Links directly to Dashboard */}
                <Link
                  to={getUserDashboardPath(user.role)}
                  className="flex items-center gap-2 md:gap-2.5 min-h-[38px] md:min-h-[40px] p-1 md:ps-1.5 md:pe-3 md:py-1 bg-white/90 dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors cursor-pointer group shrink-0"
                  title={getDashboardButtonLabel(user.role, language as any)}
                >
                  {user.role === 'STUDENT' ? (
                    <AvatarWithFrame
                      avatarUrl={user.avatarUrl}
                      studentName={`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Student'}
                      frameItem={user.studentProfile?.equippedAvatarFrame}
                      size="xs"
                      className="shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 sm:w-7 sm:h-7 rounded-lg overflow-hidden bg-gradient-to-br from-brand-teal-600 to-indigo-700 text-white flex items-center justify-center font-black text-xs shadow-2xs shrink-0 ring-1 ring-teal-400/30 group-hover:ring-teal-400 transition-all">
                      {user.avatarUrl ? (
                        <img src={getAvatarUrl(user.avatarUrl)} alt={user.firstName} className="w-full h-full object-cover" />
                      ) : (
                        `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() || 'U'
                      )}
                    </div>
                  )}
                  <div className="text-start hidden md:block">
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {user.role === 'STUDENT' ? (
                        <StyledNickname
                          name={`${user.firstName || ''} ${user.lastName || ''}`.trim()}
                          nicknameItem={user.studentProfile?.equippedNickname}
                          compact
                          truncate
                        />
                      ) : (
                        `${user.firstName} ${user.lastName}`
                      )}
                    </p>
                    <span className="text-[10px] font-extrabold text-brand-olive-600 dark:text-brand-olive-400 uppercase tracking-wider block">
                      {language === 'he'
                        ? user.role === 'SUPER_ADMIN'
                          ? 'בעלים ומנהל ראשי'
                          : user.role === 'ADMIN'
                          ? 'מנהל מערכת'
                          : user.role === 'SALES'
                          ? 'נציג מכירות'
                          : user.role === 'CS'
                          ? 'שירות לקוחות'
                          : user.role === 'TEACHER'
                          ? 'מורה'
                          : 'תלמיד'
                        : language === 'ar'
                        ? user.role === 'SUPER_ADMIN'
                          ? 'مالك المنصة'
                          : user.role === 'ADMIN'
                          ? 'مدير النظام'
                          : user.role === 'SALES'
                          ? 'مبيعات'
                          : user.role === 'CS'
                          ? 'خدمة العملاء'
                          : user.role === 'TEACHER'
                          ? 'معلم'
                          : 'طالب'
                        : user.role === 'SUPER_ADMIN'
                        ? 'Platform Owner'
                        : user.role === 'SALES'
                        ? 'Sales Representative'
                        : user.role === 'CS'
                        ? 'Customer Service'
                        : user.role}
                    </span>
                  </div>
                </Link>

                {/* Dashboard Navigator Button (Placed next to profile) - Visible ONLY on Landing Page */}
                {isLandingPage && (
                  <Link
                    to={getUserDashboardPath(user.role)}
                    className="flex items-center gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-700 to-brand-teal-900 hover:from-emerald-500 hover:via-teal-600 hover:to-brand-teal-800 text-white font-black text-xs shadow-sm hover:shadow-md transition-all group shrink-0 ring-1 ring-emerald-400/40 hover:scale-[1.02] active:scale-[0.98]"
                    title={getDashboardButtonLabel(user.role, language as any)}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-emerald-300 group-hover:rotate-12 transition-transform" />
                    <span className="inline whitespace-nowrap">
                      {language === 'he'
                        ? user.role === 'TEACHER'
                          ? 'אזור המורה'
                          : user.role === 'STUDENT'
                          ? 'אזור התלמיד'
                          : user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'
                          ? 'ניהול המערכת'
                          : user.role === 'SALES'
                          ? 'אזור מכירות'
                          : user.role === 'CS'
                          ? 'שירות לקוחות'
                          : 'מעבר למערכת'
                        : language === 'ar'
                        ? user.role === 'TEACHER'
                          ? 'مركز المعلمين'
                          : user.role === 'STUDENT'
                          ? 'مركز الطلاب'
                          : user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'
                          ? 'إدارة المنصة'
                          : user.role === 'SALES'
                          ? 'مركز المبيعات'
                          : user.role === 'CS'
                          ? 'مركز الدعم'
                          : 'لوحة التحكم'
                        : user.role === 'TEACHER'
                        ? 'Teacher Hub'
                        : user.role === 'STUDENT'
                        ? 'Student Hub'
                        : user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'
                        ? 'Admin Hub'
                        : user.role === 'SALES'
                        ? 'Sales Hub'
                        : user.role === 'CS'
                        ? 'Support Hub'
                        : 'Dashboard'}
                    </span>
                    <ArrowRight className="w-3 h-3 rtl:rotate-180 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform text-emerald-200" />
                  </Link>
                )}

                {/* Settings button shown on sm+ screens; on mobile the avatar already opens profile & settings */}
                <button
                  type="button"
                  onClick={openProfileModal}
                  className="hidden sm:flex w-8 h-8 sm:w-9 sm:h-9 items-center justify-center text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-slate-200/40 dark:border-slate-800 transition-colors shrink-0"
                  title={language === 'he' ? 'הגדרות פרופיל וסיסמה' : 'Profile & Password Settings'}
                >
                  <Settings className="w-4 h-4" />
                </button>

                <button
                  onClick={handleLogout}
                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200/40 dark:border-slate-800 transition-colors shrink-0"
                  title={t('nav.logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 h-8 sm:h-9 px-3.5 sm:px-4 text-xs font-black text-white bg-gradient-to-r from-brand-teal-700 via-brand-teal-800 to-brand-teal-950 hover:from-brand-teal-600 hover:to-brand-teal-900 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0 ring-1 ring-brand-teal-500/30"
              >
                <LogIn className="w-3.5 h-3.5 text-brand-olive-300" />
                <span>
                  {language === 'he' ? 'כניסה למערכת' : language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
                </span>
                <ArrowRight className="w-3 h-3 rtl:rotate-180" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
    {/* Structural layout spacer preserving exact 64px (mobile) / 80px (desktop) height across the entire platform */}
    <div className="h-16 sm:h-20 shrink-0 pointer-events-none" aria-hidden="true" />
  </>
  );
};
