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
  PlatformSettingsNavModal,
  PLATFORM_SETTINGS_MODULES,
} from './PlatformSettingsNavModal';
import {
  ChevronDown,
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
  const [isNavModalOpen, setIsNavModalOpen] = useState(false);

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

  const currentModuleItem = PLATFORM_SETTINGS_MODULES.find((m) => m.id === activeSubTab) || PLATFORM_SETTINGS_MODULES[0];
  const CurrentIcon = currentModuleItem?.icon;

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation: Mobile Window Trigger & Desktop Tab Bar */}
      <div className="sticky top-16 sm:top-20 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-2.5 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        {/* Mobile View: High-End Capsule Trigger Bar that opens the Navigation Window */}
        <div className="sm:hidden">
          <button
            type="button"
            onClick={() => setIsNavModalOpen(true)}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-brand-teal-950 via-brand-teal-900 to-slate-900 text-white shadow-xl border border-white/15 flex items-center justify-between gap-3 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-brand-olive-400/20 text-brand-olive-300 border border-brand-olive-400/30 flex items-center justify-center shrink-0 shadow-xs">
                {CurrentIcon && <CurrentIcon className="w-5 h-5 text-brand-olive-300" />}
              </div>
              <div className="min-w-0 text-start">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand-olive-300">
                    {language === 'he' ? 'הגדרות פלטפורמה' : 'Platform Settings'}
                  </span>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-white/10 text-white/90">
                    8
                  </span>
                </div>
                <h3 className="font-black text-sm text-white truncate">
                  {currentModuleItem ? (language === 'he' ? currentModuleItem.labelHe : currentModuleItem.label) : ''}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white text-brand-teal-950 font-black text-xs shrink-0 shadow-md">
              <span>{language === 'he' ? 'החלף מודול' : 'Navigate'}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>

        {/* Desktop View: Full Tab Strip */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          {PLATFORM_SETTINGS_MODULES.map((t) => {
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

      {/* Navigation Window Modal on Mobile */}
      <PlatformSettingsNavModal
        isOpen={isNavModalOpen}
        onClose={() => setIsNavModalOpen(false)}
        currentTab={activeSubTab}
        onSelectTab={handleSelectTab}
      />

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
