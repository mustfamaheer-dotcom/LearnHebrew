import React, { useState, useEffect, Suspense } from 'react';
import { LevelsTab } from './LevelsTab';
import { SessionTypesTab } from './SessionTypesTab';
import { RolesPermissionsTab } from './RolesPermissionsTab';
import { PaymentsReviewTab } from './PaymentsReviewTab';
import { LevelExamsTab } from './LevelExamsTab';
import { ReviewLinksTab } from './ReviewLinksTab';
import { PointRulesTab } from './PointRulesTab';
import { LanguagesTab } from './LanguagesTab';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuthStore } from '../../store/authStore';
import { ShieldAlert } from 'lucide-react';

const StoreManagementTab = React.lazy(() => import('./StoreManagementTab'));
const ShortsManagementTab = React.lazy(() => import('./ShortsManagementTab'));

export type EnterpriseSubTab =
  | 'levels'
  | 'session_types'
  | 'roles'
  | 'payments'
  | 'exams'
  | 'review_links'
  | 'point_rules'
  | 'store_management'
  | 'shorts_management'
  | 'languages';

interface EnterpriseTabsContainerProps {
  currentTab?: EnterpriseSubTab;
  onTabChange?: (tab: EnterpriseSubTab) => void;
}

const AccessRestrictedCard: React.FC<{ permCode: string; language: string }> = ({ permCode, language }) => (
  <div className="p-8 rounded-3xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center space-y-3 shadow-xs">
    <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto">
      <ShieldAlert className="w-6 h-6" />
    </div>
    <div className="space-y-1">
      <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200">
        {language === 'he' ? 'אין הרשאת גישה ללשונית זו' : 'Access Restricted by Role Policy'}
      </h3>
      <p className="text-xs text-amber-800/90 dark:text-amber-300/90 max-w-md mx-auto">
        {language === 'he'
          ? `תפקידך במערכת אינו כולל את ההרשאה [${permCode}] הנדרשת לצפייה בעמוד זה.`
          : `Your account role does not have the required permission [${permCode}] to view this tab.`}
      </p>
    </div>
  </div>
);

export const EnterpriseTabsContainer: React.FC<EnterpriseTabsContainerProps> = ({
  currentTab,
}) => {
  const { can } = usePermissions();
  const { language } = useAuthStore();
  const [internalTab, setInternalTab] = useState<EnterpriseSubTab>(currentTab || 'levels');

  useEffect(() => {
    if (currentTab && currentTab !== internalTab) {
      setInternalTab(currentTab);
    }
  }, [currentTab]);

  const activeSubTab = currentTab || internalTab;

  return (
    <div className="space-y-6">
      {/* Render selected configuration subtab strictly managed by role permissions */}
      <div>
        {activeSubTab === 'levels' && (
          can('levels:view') ? <LevelsTab /> : <AccessRestrictedCard permCode="levels:view" language={language} />
        )}
        {activeSubTab === 'session_types' && (
          can('settings:manage') ? <SessionTypesTab /> : <AccessRestrictedCard permCode="settings:manage" language={language} />
        )}
        {activeSubTab === 'roles' && (
          can('roles:manage') ? <RolesPermissionsTab /> : <AccessRestrictedCard permCode="roles:manage" language={language} />
        )}
        {activeSubTab === 'payments' && (
          can('payments:view_all') ? <PaymentsReviewTab /> : <AccessRestrictedCard permCode="payments:view_all" language={language} />
        )}
        {activeSubTab === 'exams' && (
          can('exams:view') ? <LevelExamsTab /> : <AccessRestrictedCard permCode="exams:view" language={language} />
        )}
        {activeSubTab === 'review_links' && (
          can('reviews:manage_links') ? <ReviewLinksTab /> : <AccessRestrictedCard permCode="reviews:manage_links" language={language} />
        )}
        {activeSubTab === 'point_rules' && (
          can('rewards:view_rules') ? <PointRulesTab /> : <AccessRestrictedCard permCode="rewards:view_rules" language={language} />
        )}
        {activeSubTab === 'store_management' && (
          can('store:manage_items') ? (
            <Suspense
              fallback={
                <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {language === 'he' ? 'טוען ניהול חנות...' : language === 'ar' ? 'جاري تحميل إدارة المتجر...' : 'Loading Store Management...'}
                </div>
              }
            >
              <StoreManagementTab />
            </Suspense>
          ) : (
            <AccessRestrictedCard permCode="store:manage_items" language={language} />
          )
        )}
        {activeSubTab === 'shorts_management' && (
          can('shorts:manage') ? (
            <Suspense
              fallback={
                <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {language === 'he' ? 'טוען ניהול סרטונים לתרגול...' : language === 'ar' ? 'جاري تحميل إدارة مقاطع التدريب...' : 'Loading Shorts Management...'}
                </div>
              }
            >
              <ShortsManagementTab />
            </Suspense>
          ) : (
            <AccessRestrictedCard permCode="shorts:manage" language={language} />
          )
        )}
        {activeSubTab === 'languages' && (
          can('languages:manage') ? <LanguagesTab /> : <AccessRestrictedCard permCode="languages:manage" language={language} />
        )}
      </div>
    </div>
  );
};
