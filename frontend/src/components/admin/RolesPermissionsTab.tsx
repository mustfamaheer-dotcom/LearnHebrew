import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../hooks/useTranslation';
import { rolesApi } from '../../lib/enterpriseApi';
import { RoleDefinitionModel, PermissionModel } from '../../types';
import { toast } from '../../store/toastStore';
import {
  ShieldCheck,
  Plus,
  Check,
  Save,
  Lock,
  Search,
  CheckSquare,
  Square,
  Shield,
  Layers,
  Users,
  Calendar,
  CreditCard,
  Award,
  Gamepad2,
  BellRing,
  MessageSquare,
  Settings,
  X,
} from 'lucide-react';
import { PageHeaderBanner } from '../common/PageHeaderBanner';

// Category icon helper
const getGroupIcon = (group: string) => {
  switch (group.toLowerCase()) {
    case 'users':
      return Users;
    case 'students':
      return Users;
    case 'lessons':
      return Calendar;
    case 'packages':
      return Layers;
    case 'payments':
      return CreditCard;
    case 'exams':
      return Award;
    case 'games':
      return Gamepad2;
    case 'notifications':
      return BellRing;
    case 'reviews':
      return MessageSquare;
    case 'roles':
      return ShieldCheck;
    case 'settings':
      return Settings;
    default:
      return Shield;
  }
};

// Bilingual permission descriptions dictionary
const PERMISSION_DESCRIPTIONS_HE: Record<string, string> = {
  'users:view': 'צפייה ברשימת כל המשתמשים במערכת',
  'users:create': 'יצירת חשבונות משתמשים חדשים',
  'users:edit': 'עריכת פרטי משתמשים, סיסמאות ותפקידים',
  'users:delete': 'השבתה או מחיקת חשבונות משתמשים',
  'students:view_balance': 'צפייה במכסות החבילות של התלמידים',
  'students:adjust_balance': 'הקצאה או עדכון ידני של מכסות שיעורים',
  'students:set_level': 'שינוי רמת הלימוד והשליטה של התלמיד',
  'lessons:book': 'קביעת ושיבוץ שיעורים פרטיים ביומן',
  'lessons:cancel': 'ביטול שיעורים מתוזמנים עם החזרת מכסה',
  'lessons:mark_attendance': 'רישום נוכחות שיעור (נוכח / נעדר)',
  'lessons:view_all': 'צפייה בכל השיעורים והיומנים בפלטפורמה',
  'packages:create': 'יצירה ועריכה של חבילות ומחירי שיעורים',
  'packages:assign': 'הקצאת חבילות שיעורים ישירות לתלמיד',
  'payments:create': 'העלאת אסמכתת תשלום עם צילום מסך',
  'payments:approve': 'אישור או דחיית תשלומי חבילות ממתינים',
  'payments:view_all': 'צפייה בכל היסטוריית התשלומים וההעברות',
  'exams:create': 'בנייה ועריכה של מבחני מעבר רמה',
  'exams:open_for_student': 'פתיחת מבחן מעבר רמה יחיד לתלמיד',
  'exams:reset_attempt': 'איפוס ניסיון מבחן למתן הזדמנות חוזרת',
  'games:create': 'יצירה והגדרה של משחקי תרגול אינטראקטיביים',
  'games:unlock_for_student': 'פתיחת משחק תרגול לאחר סיום שיעור',
  'notifications:send_manual': 'שליחת התראות ושידורים ממוקדים לתלמידים/מורים',
  'reviews:manage_links': 'הפקת קישורי משוב חד-פעמיים מאובטחים',
  'roles:manage': 'שינוי הרשאות תפקידים במטריצת ה-RBAC',
  'settings:manage': 'שליטה בהגדרות מערכת, שפות וחוקי נקודות',
};

export const RolesPermissionsTab: React.FC = () => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({ name: '', labelEn: '', labelHe: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['roles-matrix'],
    queryFn: rolesApi.getMatrix,
  });

  const roles = data?.roles || [];
  const permissions: PermissionModel[] = data?.permissions || [];

  const activeRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  React.useEffect(() => {
    if (activeRole && !selectedRoleId) {
      setSelectedRoleId(activeRole.id);
      setSelectedPermIds(
        activeRole.permissions.filter((p) => p.granted).map((p) => p.permission.id)
      );
    }
  }, [data, activeRole, selectedRoleId]);

  const handleSelectRole = (r: RoleDefinitionModel) => {
    setSelectedRoleId(r.id);
    setSelectedPermIds(r.permissions.filter((p) => p.granted).map((p) => p.permission.id));
  };

  const updatePermissionsMutation = useMutation({
    mutationFn: () => rolesApi.updatePermissions(selectedRoleId!, selectedPermIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-matrix'] });
      toast.success(language === 'he' ? 'הרשאות התפקיד נשמרו בהצלחה' : 'Role permissions updated successfully');
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || (language === 'he' ? 'שגיאה בעדכון הרשאות' : 'Failed to update permissions')),
  });

  const createRoleMutation = useMutation({
    mutationFn: () => rolesApi.createRole({ ...newRoleForm, permissionIds: selectedPermIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-matrix'] });
      toast.success(language === 'he' ? 'תפקיד חדש נוצר בהצלחה' : 'Custom role created');
      setIsCreatingRole(false);
      setNewRoleForm({ name: '', labelEn: '', labelHe: '' });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || (language === 'he' ? 'שגיאה ביצירת תפקיד' : 'Failed to create role')),
  });

  // Filter permissions by search term
  const filteredPermissions = useMemo(() => {
    if (!searchTerm.trim()) return permissions;
    const term = searchTerm.toLowerCase();
    return permissions.filter(
      (p) =>
        p.code.toLowerCase().includes(term) ||
        p.group.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        PERMISSION_DESCRIPTIONS_HE[p.code]?.toLowerCase().includes(term)
    );
  }, [permissions, searchTerm]);

  // Group permissions by category
  const groupedPermissions: Record<string, PermissionModel[]> = useMemo(() => {
    const groups: Record<string, PermissionModel[]> = {};
    filteredPermissions.forEach((p) => {
      if (!groups[p.group]) groups[p.group] = [];
      groups[p.group].push(p);
    });
    return groups;
  }, [filteredPermissions]);

  const togglePermission = (permId: string) => {
    if (selectedPermIds.includes(permId)) {
      setSelectedPermIds(selectedPermIds.filter((id) => id !== permId));
    } else {
      setSelectedPermIds([...selectedPermIds, permId]);
    }
  };

  const handleToggleGroup = (groupPerms: PermissionModel[]) => {
    const groupIds = groupPerms.map((p) => p.id);
    const allChecked = groupIds.every((id) => selectedPermIds.includes(id));
    if (allChecked) {
      // Uncheck all in group
      setSelectedPermIds(selectedPermIds.filter((id) => !groupIds.includes(id)));
    } else {
      // Check all in group
      const newIds = new Set([...selectedPermIds, ...groupIds]);
      setSelectedPermIds(Array.from(newIds));
    }
  };

  const handleGrantAll = () => {
    setSelectedPermIds(permissions.map((p) => p.id));
  };

  const handleRevokeAll = () => {
    setSelectedPermIds([]);
  };

  return (
    <div className="space-y-6">
      <PageHeaderBanner
        badgeIcon={ShieldCheck}
        badgeText={language === 'he' ? 'מערכת הרשאות ותפקידים מפורטת' : 'Granular RBAC System'}
        statusText={language === 'he' ? 'פעיל' : 'Active'}
        title={language === 'he' ? 'מטריצת תפקידים והרשאות' : 'Role & Permission Matrix'}
        description={
          language === 'he'
            ? 'שליטה מלאה בהרשאות של כל פעולה בפלטפורמה (משתמשים, שיעורים, חבילות, תשלומים, מבחנים, משחקים, הגדרות). ניתן להתאים אישית כל תפקיד.'
            : 'Complete governance over every platform action. Fine-tune granular permissions for Sales, CS, Teachers, Students, Admins, or custom roles.'
        }
        action={
          <button
            onClick={() => setIsCreatingRole(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>{language === 'he' ? 'צור תפקיד מותאם' : 'Create Custom Role'}</span>
          </button>
        }
      />

      {/* CREATE ROLE MODAL */}
      {isCreatingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {language === 'he' ? 'הגדרת תפקיד חדש' : 'Define New Platform Role'}
              </h3>
              <button
                onClick={() => setIsCreatingRole(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {language === 'he' ? 'מפתח תפקיד (אותיות גדולות)' : 'Role Key (e.g. OPERATIONS_LEAD)'}
                </label>
                <input
                  type="text"
                  placeholder="OPERATIONS_LEAD"
                  value={newRoleForm.name}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, name: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {language === 'he' ? 'שם באנגלית' : 'English Label'}
                </label>
                <input
                  type="text"
                  placeholder="Operations Lead"
                  value={newRoleForm.labelEn}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, labelEn: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {language === 'he' ? 'שם בעברית' : 'Hebrew Label'}
                </label>
                <input
                  type="text"
                  placeholder="מוביל תפעול"
                  value={newRoleForm.labelHe}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, labelHe: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreatingRole(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => createRoleMutation.mutate()}
                disabled={!newRoleForm.name || !newRoleForm.labelEn}
                className="px-5 py-2 bg-brand-teal-800 hover:bg-brand-teal-900 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 transition active:scale-95"
              >
                {language === 'he' ? 'צור תפקיד' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN RBAC WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Roles List (Left Column) */}
        <div className="space-y-3 lg:col-span-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              {language === 'he' ? 'תפקידי פלטפורמה' : 'Platform Roles'}
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
              {roles.length}
            </span>
          </div>

          <div className="space-y-2">
            {roles.map((r) => {
              const isActive = (selectedRoleId || activeRole?.id) === r.id;
              const grantedCount = r.permissions.filter((p) => p.granted).length;
              return (
                <button
                  key={r.id}
                  onClick={() => handleSelectRole(r)}
                  className={`w-full text-start p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden ${
                    isActive
                      ? 'bg-brand-teal-900 text-white border-brand-teal-700 shadow-md ring-2 ring-brand-teal-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-brand-teal-300 hover:bg-brand-teal-50/30 dark:hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-extrabold text-sm">
                        {language === 'he' && r.labelHe ? r.labelHe : r.labelEn}
                      </div>
                      <div
                        className={`text-[10px] font-mono mt-0.5 ${
                          isActive ? 'text-brand-olive-300' : 'text-slate-400'
                        }`}
                      >
                        {r.name}
                      </div>
                    </div>
                    {r.isSystem && (
                      <span
                        className={`p-1 rounded-md ${
                          isActive
                            ? 'bg-white/10 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}
                        title={language === 'he' ? 'תפקיד מערכת מוגן' : 'System protected role'}
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span
                      className={`font-semibold ${
                        isActive ? 'text-brand-teal-200' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {language === 'he' ? `${grantedCount} הרשאות פעילות` : `${grantedCount} Active Permissions`}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        grantedCount > 0 ? 'bg-emerald-400' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Permissions Configuration Workspace (Right 3 Columns) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {language === 'he' ? 'הגדרת הרשאות' : 'Configuring Permissions'}
                </span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-brand-teal-100 dark:bg-brand-teal-900/60 text-brand-teal-900 dark:text-brand-teal-200">
                  {language === 'he' && activeRole?.labelHe ? activeRole.labelHe : activeRole?.labelEn}
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {language === 'he' ? 'בחר פעולות מורשות עבור התפקיד' : 'Manage Granted Actions for this Role'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedPermIds.length} {language === 'he' ? 'מתוך' : 'of'} {permissions.length} {language === 'he' ? 'פעולות מורשות' : 'actions enabled'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleGrantAll}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 transition"
              >
                {language === 'he' ? 'בחר הכל' : 'Grant All'}
              </button>
              <button
                type="button"
                onClick={handleRevokeAll}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 transition"
              >
                {language === 'he' ? 'בטל הכל' : 'Revoke All'}
              </button>
              <button
                type="button"
                onClick={() => updatePermissionsMutation.mutate()}
                disabled={updatePermissionsMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-teal-800 hover:bg-brand-teal-900 dark:bg-brand-teal-700 dark:hover:bg-brand-teal-600 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-brand-olive-300" />
                <span>
                  {updatePermissionsMutation.isPending
                    ? (language === 'he' ? 'שומר שינויים...' : 'Saving...')
                    : (language === 'he' ? 'שמור שינויים' : 'Save Changes')}
                </span>
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                language === 'he'
                  ? 'חפש פעולה או הרשאה (לדוגמה: ביטול שיעור, הרשאות, מחיקת משתמש)...'
                  : 'Search action permissions (e.g. cancel, attendance, create, balance)...'
              }
              className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
            />
          </div>

          {/* Permission Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Object.entries(groupedPermissions).map(([group, perms]) => {
              const Icon = getGroupIcon(group);
              const groupIds = perms.map((p) => p.id);
              const grantedInGroup = groupIds.filter((id) => selectedPermIds.includes(id)).length;
              const allGroupGranted = grantedInGroup === perms.length && perms.length > 0;

              return (
                <div
                  key={group}
                  className="border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 bg-slate-50/40 dark:bg-slate-850/40 space-y-3.5 transition-all hover:border-brand-teal-200 dark:hover:border-brand-teal-800"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-brand-teal-100 dark:bg-brand-teal-900/60 text-brand-teal-800 dark:text-brand-teal-200">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                          {group}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {grantedInGroup} / {perms.length} {language === 'he' ? 'פעילות' : 'granted'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleGroup(perms)}
                      className="text-[11px] font-bold text-brand-teal-700 dark:text-brand-teal-300 hover:underline px-2 py-1 rounded-lg hover:bg-brand-teal-50 dark:hover:bg-slate-800"
                    >
                      {allGroupGranted
                        ? (language === 'he' ? 'בטל קבוצה' : 'Deselect Group')
                        : (language === 'he' ? 'בחר קבוצה' : 'Select Group')}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {perms.map((p) => {
                      const isChecked = selectedPermIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-start gap-3 p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-white dark:bg-slate-900 border-brand-teal-500/80 dark:border-brand-teal-600 shadow-2xs'
                              : 'bg-white/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(p.id)}
                            className="mt-0.5 rounded text-brand-teal-800 focus:ring-brand-teal-700 w-4 h-4 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`font-mono text-[11px] font-bold ${
                                  isChecked
                                    ? 'text-brand-teal-900 dark:text-brand-teal-200'
                                    : 'text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {p.code}
                              </span>
                              {isChecked && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  {language === 'he' ? 'מורשה' : 'Granted'}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                              {language === 'he'
                                ? PERMISSION_DESCRIPTIONS_HE[p.code] || p.description
                                : p.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
