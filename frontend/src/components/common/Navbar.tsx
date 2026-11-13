import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from '../../hooks/useTranslation';
import {
  Globe,
  LogOut,
  Sun,
  Moon,
  Settings,
  Search,
} from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';
import { getAvatarUrl } from '../../utils/avatar';

export const Navbar: React.FC = () => {
  const { user, logout, openProfileModal } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { t, language, setLanguage } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'he' : 'en');
  };

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/80 shadow-xs transition-colors duration-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand Name */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3.5 group py-1 min-w-0 shrink">
            <div className="relative flex items-center justify-center p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-brand-teal-50 to-brand-olive-50 dark:from-brand-teal-950/50 dark:to-slate-900 border border-brand-teal-100/60 dark:border-brand-teal-800/50 shadow-xs group-hover:shadow-sm transition-all group-hover:scale-105 duration-200 shrink-0">
              <img
                src="/logo.png"
                alt="Engrew Logo"
                className="h-8 sm:h-12 w-auto object-contain drop-shadow-xs"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-2xl font-black tracking-tight text-brand-teal-900 dark:text-brand-teal-100 group-hover:text-brand-teal-700 dark:group-hover:text-brand-teal-300 transition-colors truncate">
                  Engrew
                </span>
                <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-brand-olive-500 animate-pulse shrink-0"></span>
              </div>
              <span className="text-[9px] sm:text-[11px] font-semibold text-brand-teal-700/80 dark:text-brand-teal-300/80 uppercase tracking-wider truncate">
                {language === 'he' ? 'אקדמיה לעברית ואנגלית' : 'Hebrew & English Academy'}
              </span>
            </div>
          </Link>

          {/* Right Controls: Dark Mode Toggle, Language switch & User profile */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
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
              className="p-1.5 sm:p-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all shadow-2xs group shrink-0"
              title={theme === 'dark' ? (language === 'he' ? 'מעבר למצב יום' : 'Switch to Light Mode') : (language === 'he' ? 'מעבר למצב לילה' : 'Switch to Dark Mode')}
              aria-label="Toggle Dark Mode"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 group-hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Bilingual Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-brand-teal-50/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all shadow-2xs group shrink-0"
              title={language === 'en' ? 'החלף לעברית' : 'Switch to English'}
            >
              <Globe className="w-3.5 h-3.5 text-brand-teal-600 dark:text-brand-teal-400 group-hover:rotate-45 transition-transform" />
              <span className="font-semibold hidden sm:inline">{language === 'en' ? 'עברית' : 'English'}</span>
              <span className="font-bold sm:hidden">{language === 'en' ? 'עב' : 'EN'}</span>
            </button>

            {/* Real-time Notification Bell & Drawer */}
            <NotificationBell />

            {user ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={openProfileModal}
                  className="flex items-center gap-2 p-1 sm:p-1.5 sm:ps-2 sm:pe-3 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-2xs transition-colors cursor-pointer group"
                  title={language === 'he' ? 'ערוך פרופיל ושנה סיסמה' : 'Edit profile & change password'}
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl overflow-hidden bg-gradient-to-br from-brand-teal-600 to-indigo-700 text-white flex items-center justify-center font-black text-xs shadow-2xs shrink-0 ring-1 ring-teal-400/30 group-hover:ring-teal-400 transition-all">
                    {user.avatarUrl ? (
                      <img src={getAvatarUrl(user.avatarUrl)} alt={user.firstName} className="w-full h-full object-cover" />
                    ) : (
                      `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="text-start hidden md:block">
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {user.firstName} {user.lastName}
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
                        : user.role === 'SUPER_ADMIN'
                        ? 'Platform Owner'
                        : user.role === 'SALES'
                        ? 'Sales Representative'
                        : user.role === 'CS'
                        ? 'Customer Service'
                        : user.role}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={openProfileModal}
                  className="p-1.5 sm:p-2 text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-slate-200/40 dark:border-slate-800 transition-colors shrink-0"
                  title={language === 'he' ? 'הגדרות פרופיל וסיסמה' : 'Profile & Password Settings'}
                >
                  <Settings className="w-4 h-4" />
                </button>

                <button
                  onClick={handleLogout}
                  className="p-1.5 sm:p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200/40 dark:border-slate-800 transition-colors shrink-0"
                  title={t('nav.logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3 sm:px-5 py-1.5 sm:py-2.5 text-xs font-bold text-white bg-gradient-to-r from-brand-teal-800 to-brand-teal-950 hover:from-brand-teal-700 hover:to-brand-teal-900 rounded-xl shadow-xs transition-all hover:shadow-md shrink-0"
              >
                {t('nav.login')}
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
