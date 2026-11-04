import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from '../../hooks/useTranslation';
import {
  Globe,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { t, language, setLanguage } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'he' : 'en');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/80 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand Name - No extra navigation links */}
          <Link to="/" className="flex items-center gap-3.5 group py-1">
            <div className="relative flex items-center justify-center p-1 rounded-2xl bg-gradient-to-br from-brand-teal-50 to-brand-olive-50 dark:from-brand-teal-950/50 dark:to-slate-900 border border-brand-teal-100/60 dark:border-brand-teal-800/50 shadow-xs group-hover:shadow-sm transition-all group-hover:scale-105 duration-200">
              <img
                src="/logo.png"
                alt="Engrew Logo"
                className="h-12 sm:h-14 w-auto object-contain drop-shadow-xs"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-brand-teal-900 dark:text-brand-teal-100 group-hover:text-brand-teal-700 dark:group-hover:text-brand-teal-300 transition-colors">
                  Engrew
                </span>
                <span className="w-2 h-2 rounded-full bg-brand-olive-500 animate-pulse"></span>
              </div>
              <span className="text-[11px] font-semibold text-brand-teal-700/80 dark:text-brand-teal-300/80 uppercase tracking-wider">
                {language === 'he' ? 'אקדמיה לעברית' : 'Hebrew Academy'}
              </span>
            </div>
          </Link>

          {/* Right Controls: Dark Mode Toggle, Language switch & User profile */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Dark Mode Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all shadow-2xs group"
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
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-brand-teal-50/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all shadow-2xs group"
              title={language === 'en' ? 'החלף לעברית' : 'Switch to English'}
            >
              <Globe className="w-3.5 h-3.5 text-brand-teal-600 dark:text-brand-teal-400 group-hover:rotate-45 transition-transform" />
              <span className="font-semibold">{language === 'en' ? 'עברית' : 'English'}</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 p-1.5 ps-2 pe-3 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-2xs">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.firstName}
                      className="w-8 h-8 rounded-xl object-cover ring-2 ring-brand-teal-100 dark:ring-brand-teal-900"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-teal-700 to-brand-teal-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                      {user.firstName[0]}
                    </div>
                  )}
                  <div className="text-start hidden sm:block">
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {user.firstName} {user.lastName}
                    </p>
                    <span className="text-[10px] font-extrabold text-brand-olive-600 dark:text-brand-olive-400 uppercase tracking-wider block">
                      {language === 'he'
                        ? user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
                          ? 'מנהל מערכת'
                          : user.role === 'TEACHER'
                          ? 'מורה'
                          : 'תלמיד'
                        : user.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent transition-colors"
                  title={t('nav.logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 sm:px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-brand-teal-800 to-brand-teal-950 hover:from-brand-teal-700 hover:to-brand-teal-900 rounded-xl shadow-xs transition-all hover:shadow-md"
              >
                {t('nav.login')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
