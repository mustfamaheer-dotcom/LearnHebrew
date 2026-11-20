import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Baby,
  X,
  Plus,
  Phone,
  Mail,
  Award,
  Layers,
  Trash2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import { toast } from '../../store/toastStore';
import { confirmDialog } from '../../store/confirmDialogStore';

interface FamilyManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any | null;
  onOpenAddChild: (parentUser: any) => void;
}

export const FamilyManagementModal: React.FC<FamilyManagementModalProps> = ({
  isOpen,
  onClose,
  user,
  onOpenAddChild,
}) => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const isAr = language === 'ar';
  const isHe = language === 'he';

  const { data: familyData, isLoading, refetch } = useQuery({
    queryKey: ['family-details', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await api.get(`/users/${user.id}/family`);
      return res.data;
    },
    enabled: isOpen && !!user?.id,
  });

  const unlinkMutation = useMutation({
    mutationFn: async (childUserId: string) => {
      const res = await api.delete(`/users/${childUserId}/unlink-family`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-details', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success(
        isAr ? 'تم فصل الحساب عن العائلة بنجاح' : isHe ? 'החשבון נותק מהמשפחה בהצלחה' : 'Account unlinked from family'
      );
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to unlink account');
    },
  });

  if (!isOpen || !user) return null;

  const parent = familyData?.parent || (user.isParent ? user : null);
  const children = familyData?.children || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full my-8 shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 sm:p-7">
          <div className="absolute top-0 end-0 -mt-8 -me-8 w-44 h-44 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center justify-center shrink-0 shadow-xs">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-300 text-[10px] font-black uppercase tracking-wider mb-1 border border-white/10">
                  <ShieldCheck className="w-3 h-3 text-indigo-400" />
                  <span>
                    {isAr
                      ? 'إدارة حسابات العائلة والأبناء'
                      : isHe
                      ? 'ניהול חשבונות משפחה וילדים'
                      : 'Family & Children Governance'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {parent ? `${parent.firstName} ${parent.lastName}` : `${user.firstName} ${user.lastName}`} -{' '}
                  {isAr ? 'شجرة العائلة' : isHe ? 'עץ משפחה' : 'Family Tree'}
                </h2>
                <p className="text-xs text-indigo-200/80 font-medium mt-0.5">
                  {isAr
                    ? 'ربط حسابات الأبناء بولي أمر واحد لتسهيل الحجز، المتابعة، والبحث برقم الهاتف أو الإيميل المشترك'
                    : isHe
                    ? 'קישור חשבונות ילדים תחת הורה אחד לצפייה משותפת, חיפוש מרוכז ומעבר מהיר'
                    : 'Manage parent and child linked accounts under one unified email or phone'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-6 text-xs max-h-[75vh] overflow-y-auto">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400">
              <p className="font-bold">{isAr ? 'جاري تحميل بيانات العائلة...' : isHe ? 'טוען נתוני משפחה...' : 'Loading family members...'}</p>
            </div>
          ) : (
            <>
              {/* Parent Card */}
              {parent && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700">
                      <Users className="w-3 h-3 text-indigo-600 dark:text-indigo-300" />
                      <span>{isAr ? 'ولي الأمر (رب الأسرة)' : isHe ? 'הורה / ראש משפחה' : 'Parent Account (Family Head)'}</span>
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {children.length} {isAr ? 'أبناء مسجلين' : isHe ? 'ילדים מקושרים' : 'Children linked'}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {parent.firstName} {parent.lastName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-medium">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{parent.email}</span>
                        </span>
                        {parent.phone && (
                          <span className="flex items-center gap-1 font-mono font-medium">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{parent.phone}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenAddChild(parent)}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAr ? 'إضافة ابن للعائلة' : isHe ? 'הוסף ילד למשפחה' : '+ Add Child Account'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Children List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Baby className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{isAr ? 'الأبناء والحسابات الفرعية' : isHe ? 'חשבונות ילדים מקושרים' : 'Linked Child Accounts'}</span>
                    <span className="text-slate-400 font-medium">({children.length})</span>
                  </h4>
                </div>

                {children.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-400 space-y-2">
                    <Baby className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                    <p className="font-bold">
                      {isAr
                        ? 'لا توجد حسابات أبناء مضافة بعد تحت هذا الحساب'
                        : isHe
                        ? 'אין עדיין חשבונות ילדים מקושרים תחת משתמש זה'
                        : 'No child accounts linked yet'}
                    </p>
                    <button
                      type="button"
                      onClick={() => onOpenAddChild(parent || user)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                      {isAr ? '+ أضف أول ابن الآن' : isHe ? '+ הוסף ילד ראשון כעת' : '+ Add first child now'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {children.map((child: any) => {
                      const levelName =
                        child.studentProfile?.levelModel?.labelEn ||
                        child.studentProfile?.level ||
                        'Elementary';
                      const packages = child.studentProfile?.packages || [];

                      return (
                        <div
                          key={child.id}
                          className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-black flex items-center justify-center text-sm shrink-0 border border-emerald-200 dark:border-emerald-800">
                                {child.firstName?.charAt(0) || 'C'}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="font-extrabold text-slate-900 dark:text-white text-sm">
                                    {child.firstName} {child.lastName}
                                  </h5>
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    {levelName}
                                  </span>
                                  {child.studentProfile?.totalPoints !== undefined && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                      <Award className="w-3 h-3 text-amber-500" />
                                      <span>{child.studentProfile.totalPoints} pts</span>
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-3 mt-1 text-slate-500 dark:text-slate-400 text-[11px]">
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-slate-400" />
                                    <span>{child.email}</span>
                                  </span>
                                  {child.phone && (
                                    <span className="flex items-center gap-1 font-mono">
                                      <Phone className="w-3 h-3 text-slate-400" />
                                      <span>{child.phone}</span>
                                    </span>
                                  )}
                                </div>

                                {/* Active Subscription / Package info */}
                                {packages.length > 0 ? (
                                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                                    {packages.map((sp: any) => (
                                      <span
                                        key={sp.id}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-teal-50 dark:bg-brand-teal-950/60 text-brand-teal-800 dark:text-brand-teal-200 border border-brand-teal-200 dark:border-brand-teal-800"
                                      >
                                        <Layers className="w-3 h-3 text-brand-teal-600" />
                                        <span>
                                          {sp.package?.name || 'Subscription Plan'} ({sp.lessonsTotal - (sp.lessonsUsed || 0)} lessons left)
                                        </span>
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="mt-1.5 text-[10px] text-slate-400 italic">
                                    {isAr ? 'لا توجد باقة نشطة حالياً' : isHe ? 'אין חבילה פעילה כרגע' : 'No active package'}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Unlink Action */}
                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              <button
                                type="button"
                                onClick={async () => {
                                  const confirmed = await confirmDialog({
                                    title: 'Unlink Child from Family',
                                    titleHe: 'ניתוק ילד מחשבון המשפחה',
                                    message: `Are you sure you want to unlink ${child.firstName} ${child.lastName} from this family account?`,
                                    messageHe: `האם לנתק את ${child.firstName} ${child.lastName} מחשבון המשפחה?`,
                                    confirmText: 'Unlink Account',
                                    confirmTextHe: 'נתק חשבון',
                                    variant: 'danger',
                                  });
                                  if (confirmed) {
                                    unlinkMutation.mutate(child.id);
                                  }
                                }}
                                disabled={unlinkMutation.isPending}
                                className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                                title={isAr ? 'فصل عن العائلة' : isHe ? 'נתק מהמשפחה' : 'Unlink from Family'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200/80 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : isHe ? 'סגור' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
