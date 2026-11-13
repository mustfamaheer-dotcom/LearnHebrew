import React, { useState } from 'react';
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
} from 'lucide-react';

export const EnterpriseTabsContainer: React.FC = () => {
  const [subTab, setSubTab] = useState<
    'levels' | 'session_types' | 'roles' | 'payments' | 'exams' | 'review_links' | 'point_rules' | 'languages'
  >('levels');

  const tabs = [
    { id: 'levels', label: 'Levels', icon: Layers },
    { id: 'session_types', label: 'Session Types', icon: Clock },
    { id: 'roles', label: 'Roles & RBAC', icon: ShieldCheck },
    { id: 'payments', label: 'Payments Review', icon: Receipt },
    { id: 'exams', label: 'Level Exams', icon: Award },
    { id: 'review_links', label: 'Review Links', icon: Link2 },
    { id: 'point_rules', label: 'Point Rules', icon: Coins },
    { id: 'languages', label: 'Languages', icon: Globe },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = subTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-brand-teal-800 hover:bg-brand-teal-900 dark:bg-brand-teal-700 dark:hover:bg-brand-teal-600 text-white shadow-sm shadow-brand-teal-950/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-brand-teal-800 dark:hover:text-brand-teal-300 hover:bg-brand-teal-50/50 dark:hover:bg-slate-850'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-brand-olive-300' : 'text-slate-400'}`} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Render selected configuration subtab */}
      <div>
        {subTab === 'levels' && <LevelsTab />}
        {subTab === 'session_types' && <SessionTypesTab />}
        {subTab === 'roles' && <RolesPermissionsTab />}
        {subTab === 'payments' && <PaymentsReviewTab />}
        {subTab === 'exams' && <LevelExamsTab />}
        {subTab === 'review_links' && <ReviewLinksTab />}
        {subTab === 'point_rules' && <PointRulesTab />}
        {subTab === 'languages' && <LanguagesTab />}
      </div>
    </div>
  );
};
