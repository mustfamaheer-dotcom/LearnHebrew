import React, { useState, useEffect } from 'react';
import { LevelsTab } from './LevelsTab';
import { SessionTypesTab } from './SessionTypesTab';
import { RolesPermissionsTab } from './RolesPermissionsTab';
import { PaymentsReviewTab } from './PaymentsReviewTab';
import { LevelExamsTab } from './LevelExamsTab';
import { ReviewLinksTab } from './ReviewLinksTab';
import { PointRulesTab } from './PointRulesTab';
import { LanguagesTab } from './LanguagesTab';

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
}) => {
  const [internalTab, setInternalTab] = useState<EnterpriseSubTab>(currentTab || 'levels');

  useEffect(() => {
    if (currentTab && currentTab !== internalTab) {
      setInternalTab(currentTab);
    }
  }, [currentTab]);

  const activeSubTab = currentTab || internalTab;

  return (
    <div className="space-y-6">
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
