import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Command,
  Sun,
  Moon,
  Globe,
  User,
  LogOut,
  ArrowRight,
  BookOpen,
  Calendar,
  Gamepad2,
  Users,
  Video,
  Layers,
  Sliders,
  MessageSquare,
  BellRing,
  Award,
  TrendingUp,
  Wallet,
  FolderOpen,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from '../../hooks/useTranslation';
import { haptics } from '../../utils/haptics';

interface CommandItem {
  id: string;
  category: string;
  categoryHe: string;
  title: string;
  titleHe: string;
  icon: React.ElementType;
  badge?: string;
  action: () => void;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tabId: string) => void;
}

export const CommandPaletteModal: React.FC<Props> = ({ isOpen, onClose, onNavigateTab }) => {
  const navigate = useNavigate();
  const { user, logout, openProfileModal } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { language, setLanguage } = useTranslation();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleNavigate = (tabId: string) => {
    if (onNavigateTab) {
      onNavigateTab(tabId);
    }
    window.dispatchEvent(new CustomEvent('engrew:navigate-tab', { detail: { tab: tabId } }));
    if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
      navigate(`/admin?tab=${tabId}`);
    } else if (user?.role === 'TEACHER') {
      navigate(`/teacher?tab=${tabId}`);
    } else {
      navigate(`/student?tab=${tabId}`);
    }
  };

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Construct items based on user role
  const items: CommandItem[] = [];

  // 1. Role-specific Navigation
  if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
    items.push(
      {
        id: 'overview',
        category: 'Navigation',
        categoryHe: 'ניווט',
        title: 'KPIs & Overview Dashboard',
        titleHe: 'לוח מדדים וראשי',
        icon: Sliders,
        action: () => handleNavigate('overview'),
      },
      {
        id: 'users',
        category: 'Navigation',
        categoryHe: 'ניווט',
        title: 'User Management & Roles',
        titleHe: 'ניהול משתמשים והרשאות',
        icon: Users,
        action: () => handleNavigate('users'),
      },
      {
        id: 'teachers',
        category: 'Navigation',
        categoryHe: 'ניווט',
        title: 'Teacher Applications & Profiles',
        titleHe: 'ניהול מורים ובקשות הצטרפות',
        icon: ShieldCheck,
        action: () => handleNavigate('teachers'),
      },
      {
        id: 'bookings',
        category: 'Navigation',
        categoryHe: 'ניווט',
        title: 'Bookings & Session Calendar',
        titleHe: 'יומן שיעורים והזמנות',
        icon: Calendar,
        action: () => handleNavigate('bookings'),
      },
      {
        id: 'packages',
        category: 'Navigation',
        categoryHe: 'ניווט',
        title: 'Pricing & Lesson Packages',
        titleHe: 'חבילות ומחירונים',
        icon: Layers,
        action: () => handleNavigate('packages'),
      },
      {
        id: 'landing_cms',
        category: 'Navigation',
        categoryHe: 'ניווט',
        title: 'Landing Page CMS Editor',
        titleHe: 'ניהול תוכן עמוד הבית',
        icon: Sliders,
        action: () => handleNavigate('landing_cms'),
      },
      {
        id: 'surveys',
        category: 'Navigation',
        categoryHe: 'ניווט',
        title: 'Student Reviews & Feedback',
        titleHe: 'סקרי שביעות רצון ומשוב',
        icon: MessageSquare,
        action: () => handleNavigate('surveys'),
      },
      {
        id: 'reminders_hub',
        category: 'Navigation',
        categoryHe: 'ניווט',
        title: 'Reminder Engine & Notifications Hub',
        titleHe: 'מנוע תזכורות והתראות',
        icon: BellRing,
        action: () => handleNavigate('reminders_hub'),
      },
      {
        id: 'system_logs',
        category: 'Navigation',
        categoryHe: 'ניווט',
        title: 'System & Audit Logs',
        titleHe: 'יומני מערכת וביקורת',
        icon: Sliders,
        action: () => handleNavigate('system_logs'),
      }
    );
  } else if (user?.role === 'TEACHER') {
    items.push(
      {
        id: 'calendar',
        category: 'Navigation',
        categoryHe: 'ניווט',
        title: 'Availability & Slot Management',
        titleHe: 'יומן זמינות וניהול שעות',
        icon: Calendar,
        action: () => handleNavigate('calendar'),
      },
      {
        id: 'lessons',
        category: 'Navigation',
        categoryHe: 'ניווט',
        title: 'Scheduled Lessons & Zoom Links',
        titleHe: 'שיעורים קבועים וקישורי זום',
        icon: Video,
        action: () => handleNavigate('lessons'),
      },
      {
        id: 'students',
        category: 'Navigation',
        categoryHe: 'ניווט',
        title: 'Student Profiles & Notes',
        titleHe: 'פרופילי תלמידים והערות',
        icon: Users,
        action: () => handleNavigate('students'),
      },
      {
        id: 'homework',
        category: 'Navigation',
        categoryHe: 'ניווט',
        title: 'Assign & Grade Homework',
        titleHe: 'מתן ובדיקת שיעורי בית',
        icon: BookOpen,
        action: () => handleNavigate('homework'),
      },
      {
        id: 'recordings',
        category: 'Navigation',
        categoryHe: 'ניווט',
        title: 'Google Drive Class Recordings',
        titleHe: 'הקלטות שיעורים ב-Drive',
        icon: FolderOpen,
        action: () => handleNavigate('recordings'),
      },
      {
        id: 'games',
        category: 'Navigation',
        categoryHe: 'ניווט',
        title: 'Custom Vocabulary Games',
        titleHe: 'משחקי מילים ותרגול',
        icon: Gamepad2,
        action: () => handleNavigate('games'),
      }
    );
  } else {
    // STUDENT
    items.push(
      {
        id: 'overview',
        category: 'Navigation',
        categoryHe: 'ניווט',
        title: 'Home Dashboard',
        titleHe: 'עמוד ראשי',
        icon: Sliders,
        action: () => handleNavigate('overview'),
      },
      {
        id: 'booking',
        category: 'Navigation',
        categoryHe: 'ניווט',
        title: 'Book a New Hebrew Lesson',
        titleHe: 'הזמנת שיעור עברית חדש',
        icon: Calendar,
        action: () => handleNavigate('booking'),
      },
      {
        id: 'lessons',
        category: 'Navigation',
        categoryHe: 'ניווט',
        title: 'Upcoming & Past Lessons',
        titleHe: 'השיעורים שלי',
        icon: Video,
        action: () => handleNavigate('lessons'),
      },
      {
        id: 'recordings',
        category: 'Navigation',
        categoryHe: 'ניווט',
        title: 'Lesson Recordings & Replays',
        titleHe: 'הקלטות שיעורים וצפייה חוזרת',
        icon: FolderOpen,
        action: () => handleNavigate('recordings'),
      },
      {
        id: 'games',
        category: 'Navigation',
        categoryHe: 'ניווט',
        title: 'Vocabulary & Hebrew Games',
        titleHe: 'משחקי לימוד ואוצר מילים',
        icon: Gamepad2,
        action: () => handleNavigate('games'),
      },
      {
        id: 'leaderboard',
        category: 'Navigation',
        categoryHe: 'ניווט',
        title: 'XP Leaderboard & Rankings',
        titleHe: 'לוח נקודות ודירוג תלמידים',
        icon: Award,
        action: () => handleNavigate('leaderboard'),
      },
      {
        id: 'homework',
        category: 'Navigation',
        categoryHe: 'ניווט',
        title: 'Homework Tasks & Feedback',
        titleHe: 'מטלות שיעורי בית ומשוב',
        icon: BookOpen,
        action: () => handleNavigate('homework'),
      },
      {
        id: 'balance',
        category: 'Navigation',
        categoryHe: 'ניווט',
        title: 'Wallet Balance & Top-Up',
        titleHe: 'יתרת ארנק ורכישת חבילות',
        icon: Wallet,
        action: () => handleNavigate('balance'),
      },
      {
        id: 'progress',
        category: 'Navigation',
        categoryHe: 'ניווט',
        title: 'My Learning Progress & Roadmaps',
        titleHe: 'התקדמות הלמידה ומפת דרכים',
        icon: TrendingUp,
        action: () => handleNavigate('progress'),
      }
    );
  }

  // 2. Global Actions
  items.push(
    {
      id: 'theme',
      category: 'Preferences',
      categoryHe: 'העדפות',
      title: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      titleHe: theme === 'dark' ? 'החלף למצב בהיר' : 'החלף למצב כהה',
      icon: theme === 'dark' ? Sun : Moon,
      action: toggleTheme,
    },
    {
      id: 'language',
      category: 'Preferences',
      categoryHe: 'העדפות',
      title: language === 'he' ? 'Switch to English' : 'החלף לעברית (Hebrew)',
      titleHe: language === 'he' ? 'החלף לאנגלית' : 'החלף לעברית',
      icon: Globe,
      action: () => setLanguage(language === 'he' ? 'en' : 'he'),
    },
    {
      id: 'profile',
      category: 'Account',
      categoryHe: 'חשבון',
      title: 'Profile & Avatar Settings',
      titleHe: 'הגדרות פרופיל ותמונה',
      icon: User,
      action: openProfileModal,
    },
    {
      id: 'logout',
      category: 'Account',
      categoryHe: 'חשבון',
      title: 'Sign Out of Engrew',
      titleHe: 'התנתקות מהמערכת',
      icon: LogOut,
      action: () => {
        logout();
        navigate('/login');
      },
    }
  );

  // Filter items based on query
  const filteredItems = items.filter((item) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.titleHe.includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.categoryHe.includes(q)
    );
  });

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(filteredItems.length, 1));
      haptics.tap();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev === 0 ? Math.max(filteredItems.length - 1, 0) : prev - 1
      );
      haptics.tap();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected) {
        haptics.success();
        selected.action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Bar Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={
              language === 'he'
                ? 'חפש פעולה, שיעור או עמוד... (או הקש Esc ליציאה)'
                : 'Search commands, tabs, or settings... (Esc to exit)'
            }
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 text-sm sm:text-base outline-none font-semibold"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500">
            <span>ESC</span>
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              {language === 'he' ? 'לא נמצאו פקודות תואמות' : 'No matching commands found.'}
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    haptics.success();
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-start transition-all ${
                    isSelected
                      ? 'bg-brand-teal-50 dark:bg-brand-teal-950/70 text-brand-teal-900 dark:text-teal-200 border border-brand-teal-200/80 dark:border-teal-800/80'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isSelected
                          ? 'bg-brand-teal-100 dark:bg-teal-900/90 text-brand-teal-800 dark:text-teal-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold truncate">
                        {language === 'he' ? item.titleHe : item.title}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                        {language === 'he' ? item.categoryHe : item.category}
                      </p>
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected
                        ? 'text-brand-teal-600 dark:text-teal-400 translate-x-0.5'
                        : 'opacity-0'
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Legend */}
        <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{language === 'he' ? 'ניווט באמצעות' : 'Navigate with'}</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">
              ↑
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">
              ↓
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">
              ENTER
            </kbd>
          </div>
          <span className="font-semibold text-brand-teal-700 dark:text-teal-400">
            Engrew Spotlight
          </span>
        </div>
      </div>
    </div>
  );
};
