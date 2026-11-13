import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { LevelsTab } from './LevelsTab';
import { SessionTypesTab } from './SessionTypesTab';
import { RolesPermissionsTab } from './RolesPermissionsTab';
import { PaymentsReviewTab } from './PaymentsReviewTab';
import { LevelExamsTab } from './LevelExamsTab';
import { ReviewLinksTab } from './ReviewLinksTab';
import { PointRulesTab } from './PointRulesTab';
import { LanguagesTab } from './LanguagesTab';
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
} from 'lucide-react';

export type EnterpriseSubTab =
  | 'levels'
  | 'session_types'
  | 'roles'
  | 'payments'
  | 'exams'
  | 'review_links'
  | 'point_rules'
  | 'languages';

interface EnterpriseTabsContainerProps {
  currentTab?: EnterpriseSubTab;
  onTabChange?: (tab: EnterpriseSubTab) => void;
}

export const EnterpriseTabsContainer: React.FC<EnterpriseTabsContainerProps> = ({
  currentTab,
  onTabChange,
}) => {
  const { language } = useTranslation();
  const [internalTab, setInternalTab] = useState<EnterpriseSubTab>(currentTab || 'levels');

  useEffect(() => {
    if (currentTab && currentTab !== internalTab) {
      setInternalTab(currentTab);
    }
  }, [currentTab]);

  const activeSubTab = currentTab || internalTab;

  const handleSelectTab = (tabId: EnterpriseSubTab) => {
    setInternalTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  const tabs = [
    { id: 'levels', label: 'Levels', labelHe: 'רמות לימוד', icon: Layers },
    { id: 'session_types', label: 'Session Types', labelHe: 'סוגי שיעורים', icon: Clock },
    { id: 'roles', label: 'Roles & RBAC', labelHe: 'תפקידים והרשאות', icon: ShieldCheck },
    { id: 'payments', label: 'Payments Review', labelHe: 'בדיקת תשלומים', icon: Receipt },
    { id: 'exams', label: 'Level Exams', labelHe: 'מבחני מעבר רמה', icon: Award },
    { id: 'review_links', label: 'Review Links', labelHe: 'קישורי משוב', icon: Link2 },
    { id: 'point_rules', label: 'Point Rules', labelHe: 'חוקי נקודות', icon: Coins },
    { id: 'languages', label: 'Languages', labelHe: 'שפות', icon: Globe },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Mobile-Optimized Sub-tab Navigation Header & Bar */}
      <div className="sticky top-16 sm:top-20 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-2.5 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="flex items-center justify-between gap-3 mb-2 sm:hidden">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-brand-teal-100 dark:bg-brand-teal-900/60 text-brand-teal-800 dark:text-brand-teal-200">
              <Settings className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-xs text-slate-900 dark:text-white">
              {language === 'he' ? 'הגדרות פלטפורמה (8 מודולים)' : 'Platform Settings (8 Modules)'}
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-teal-100 dark:bg-brand-teal-900 text-brand-teal-900 dark:text-teal-200">
            {tabs.find((t) => t.id === activeSubTab)?.[language === 'he' ? 'labelHe' : 'label']}
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none touch-pan-x">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeSubTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleSelectTab(t.id)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all active:scale-95 shrink-0 ${
                  isActive
                    ? 'bg-brand-teal-800 hover:bg-brand-teal-900 dark:bg-brand-teal-700 dark:hover:bg-brand-teal-600 text-white shadow-sm shadow-brand-teal-950/20'
                    : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-brand-teal-800 dark:hover:text-brand-teal-300 hover:bg-brand-teal-50/50 dark:hover:bg-slate-850'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-olive-300' : 'text-slate-400'}`} />
                <span>{language === 'he' ? t.labelHe : t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render selected configuration subtab */}
      <div>
        {activeSubTab === 'levels' && <LevelsTab />}
        {activeSubTab === 'session_types' && <SessionTypesTab />}
        {activeSubTab === 'roles' && <RolesPermissionsTab />}
        {activeSubTab === 'payments' && <PaymentsReviewTab />}
        {activeSubTab === 'exams' && <LevelExamsTab />}
        {activeSubTab === 'review_links' && <ReviewLinksTab />}
        {activeSubTab === 'point_rules' && <PointRulesTab />}
        {activeSubTab === 'languages' && <LanguagesTab />}
      </div>
    </div>
  );
};
