import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { haptics } from '../../utils/haptics';
import {
  Layers,
  Clock,
  ShieldCheck,
  Receipt,
  Award,
  Link2,
  Coins,
  Globe,
  Settings,
  X,
  Search,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { EnterpriseSubTab } from './EnterpriseTabsContainer';

export interface PlatformSettingsNavModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: EnterpriseSubTab;
  onSelectTab: (tabId: EnterpriseSubTab) => void;
}

export interface PlatformSettingsModuleItem {
  id: EnterpriseSubTab;
  label: string;
  labelHe: string;
  desc: string;
  descHe: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  badge?: string;
  badgeHe?: string;
}

export const PLATFORM_SETTINGS_MODULES: PlatformSettingsModuleItem[] = [
  {
    id: 'levels',
    label: 'Levels & Curriculum',
    labelHe: 'רמות לימוד ומסלולים',
    desc: 'Hebrew proficiency tiers, CEFR standards & progression paths',
    descHe: 'רמות שליטה בעברית, תקני CEFR וסדר מעבר רמות אקדמי',
    icon: Layers,
    colorClass: 'from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
  {
    id: 'session_types',
    label: 'Session Types & Durations',
    labelHe: 'סוגי ומשכי שיעורים',
    desc: 'Manage 25, 40, and 55-minute lesson types, descriptions & rates',
    descHe: 'הגדרת סוגי מפגשים (25, 40 ו-55 דק׳), שמות ותיאורים',
    icon: Clock,
    colorClass: 'from-sky-500/20 to-blue-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30',
  },
  {
    id: 'roles',
    label: 'Role & Permission Matrix',
    labelHe: 'תפקידים והרשאות (RBAC)',
    desc: 'Granular access control, privileges & capabilities by system role',
    descHe: 'מטריצת הרשאות אבטחה, צפייה ועריכה לכל תפקיד במערכת',
    icon: ShieldCheck,
    colorClass: 'from-purple-500/20 to-indigo-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
    badge: 'Security',
    badgeHe: 'אבטחה',
  },
  {
    id: 'payments',
    label: 'Proof-of-Payment Reviews',
    labelHe: 'בדיקת תשלומי חבילות',
    desc: 'Verify uploaded WebP transfer receipts and credit quotas',
    descHe: 'בדיקת אסמכתאות WebP, אישור עסקאות והעברת מכסות לתלמידים',
    icon: Receipt,
    colorClass: 'from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  {
    id: 'exams',
    label: 'Level Progression Exams',
    labelHe: 'מבחני מעבר רמה',
    desc: 'Automated assessment tests, question banks & CSV exam imports',
    descHe: 'מבחני הערכה ממוחשבים, בנק שאלות ויבוא קובצי CSV',
    icon: Award,
    colorClass: 'from-teal-500/20 to-emerald-500/20 text-teal-600 dark:text-teal-400 border-teal-500/30',
  },
  {
    id: 'review_links',
    label: 'Single-Use Review Links',
    labelHe: 'קישורי משוב חד-פעמיים',
    desc: 'Generate time-limited rating links for students & testimonials',
    descHe: 'יצירת קישורים מאובטחים לדירוג מורים וחוות דעת תלמידים',
    icon: Link2,
    colorClass: 'from-rose-500/20 to-pink-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30',
  },
  {
    id: 'point_rules',
    label: 'Reward & Point Rules',
    labelHe: 'חוקי נקודות וגיימיפיקציה',
    desc: 'Configure XP multipliers, attendance points & reward criteria',
    descHe: 'קביעת נקודות XP, בונוס נוכחות וחוקי תגמול לתלמידים',
    icon: Coins,
    colorClass: 'from-yellow-500/20 to-amber-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
  },
  {
    id: 'languages',
    label: 'Multi-Language Registry',
    labelHe: 'שפות פלטפורמה נתמכות',
    desc: 'Configure supported languages, flag keyboard & display options',
    descHe: 'ניהול שפות ממשק, מקלדת דגלים אימוג׳י והגדרות שפה',
    icon: Globe,
    colorClass: 'from-cyan-500/20 to-blue-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
  },
];

export const PlatformSettingsNavModal: React.FC<PlatformSettingsNavModalProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
}) => {
  const { language } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const isHe = language === 'he';

  const filteredModules = PLATFORM_SETTINGS_MODULES.filter((m) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      m.label.toLowerCase().includes(term) ||
      m.labelHe.toLowerCase().includes(term) ||
      m.desc.toLowerCase().includes(term) ||
      m.descHe.toLowerCase().includes(term)
    );
  });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xl max-h-[90vh] sm:max-h-[85vh] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Grabber Handle */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 sm:hidden" />

        {/* Executive Gradient Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-brand-teal-950 via-brand-teal-900 to-slate-900 text-white p-5 sm:p-6 shrink-0">
          <div className="absolute top-0 end-0 -mt-8 -me-8 w-44 h-44 bg-brand-olive-500/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-brand-olive-400/20 text-brand-olive-300 border border-brand-olive-400/30 flex items-center justify-center shrink-0 shadow-xs">
                <Settings className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-brand-olive-300 text-[10px] font-black uppercase tracking-wider mb-1 border border-white/10">
                  <Sparkles className="w-3 h-3 text-brand-olive-400" />
                  <span>{isHe ? '8 מודולים פעילים' : '8 Modules Active'}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {isHe ? 'הגדרות פלטפורמה' : 'Platform Settings'}
                </h2>
                <p className="text-xs text-brand-teal-100/80 font-medium mt-0.5">
                  {isHe
                    ? 'בחר מודול הגדרות לעריכה וניהול ישיר'
                    : 'Select a configuration module to edit and manage'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative mt-4">
            <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-brand-teal-200/60 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isHe ? 'חיפוש מודול הגדרות...' : 'Search settings module...'}
              className="w-full ps-10 pe-4 py-2 rounded-xl bg-white/10 border border-white/15 text-white placeholder-brand-teal-200/60 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-brand-olive-400 transition-all"
            />
          </div>
        </div>

        {/* Scrollable List of All 8 Modules */}
        <div className="p-4 sm:p-5 space-y-2.5 overflow-y-auto flex-1">
          {filteredModules.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  haptics.tap();
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-2xl text-start transition-all flex items-center justify-between gap-3 group active:scale-[0.98] border ${
                  isActive
                    ? 'bg-brand-teal-50/80 dark:bg-brand-teal-950/40 border-brand-teal-500/80 dark:border-brand-teal-400 shadow-xs ring-2 ring-brand-teal-500/20'
                    : 'bg-white hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 hover:border-brand-teal-300 dark:hover:border-brand-teal-700'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-br border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-2xs ${item.colorClass}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 flex-1 text-start">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                        {isHe ? item.labelHe : item.label}
                      </span>
                      {item.badge && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200/60 shrink-0">
                          {isHe ? item.badgeHe : item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-snug">
                      {isHe ? item.descHe : item.desc}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-teal-600 text-white text-[10px] font-black shadow-xs">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isHe ? 'פעיל' : 'Active'}</span>
                    </span>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700/60 text-slate-400 group-hover:text-brand-teal-600 dark:group-hover:text-brand-teal-400 group-hover:bg-brand-teal-50 dark:group-hover:bg-brand-teal-950/60 flex items-center justify-center transition-colors">
                      {isHe ? (
                        <ChevronLeft className="w-4 h-4 rtl:rotate-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          {filteredModules.length === 0 && (
            <div className="py-10 text-center text-slate-400 text-xs font-semibold">
              {isHe ? 'לא נמצא מודול התואם לחיפוש' : 'No settings modules match your search'}
            </div>
          )}
        </div>

        {/* Modal Bottom Close Bar */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-bold text-slate-400 px-2">
            {isHe ? '8 מודולים ניתנים לניהול מלא' : '8 Fully Manageable Modules'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
          >
            {isHe ? 'סגור' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
