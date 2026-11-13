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
  LayoutGrid,
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
      {/* Sub-tab Navigation: Executive Unified Module Header & Modal Navigation Trigger */}
      <div className="sticky top-16 sm:top-20 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-2.5 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <button
          type="button"
          onClick={() => setIsNavModalOpen(true)}
          className="w-full p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-brand-teal-950 via-brand-teal-900 to-slate-900 text-white shadow-lg sm:shadow-xl border border-white/15 flex items-center justify-between gap-3 sm:gap-4 hover:border-brand-olive-400/50 hover:shadow-brand-teal-950/40 active:scale-[0.99] transition-all group"
        >
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-olive-400/20 text-brand-olive-300 border border-brand-olive-400/30 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              {CurrentIcon && <CurrentIcon className="w-5 h-5 sm:w-6 sm:h-6 text-brand-olive-300" />}
            </div>
            <div className="min-w-0 text-start">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-brand-olive-300">
                  {language === 'he' ? 'הגדרות פלטפורמה' : 'Platform Settings'}
                </span>
                <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/10">
                  {language === 'he' ? '8 מודולים' : '8 Modules'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-white truncate">
                  {currentModuleItem ? (language === 'he' ? currentModuleItem.labelHe : currentModuleItem.label) : ''}
                </h3>
                <span className="hidden sm:inline-block text-xs text-brand-teal-200/70 font-medium truncate max-w-md">
                  • {currentModuleItem ? (language === 'he' ? currentModuleItem.descHe : currentModuleItem.desc) : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white text-brand-teal-950 font-black text-xs sm:text-sm shrink-0 shadow-md group-hover:bg-brand-olive-300 group-hover:text-brand-teal-950 transition-colors">
            <LayoutGrid className="w-4 h-4 text-brand-teal-800 group-hover:text-brand-teal-950" />
            <span>{language === 'he' ? 'החלף מודול' : 'Navigate Modules'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-brand-teal-700 group-hover:text-brand-teal-950" />
          </div>
        </button>
      </div>

      {/* Platform Settings Navigation Window Modal */}
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
