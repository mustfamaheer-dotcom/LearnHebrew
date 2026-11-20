import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserCheck, ChevronDown, Check, ArrowRightLeft, Sparkles, Shield, Baby } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../hooks/useTranslation';
import { toast } from '../../store/toastStore';

export const FamilyProfileSwitcher: React.FC = () => {
  const { user, setAuth } = useAuthStore();
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const isAr = language === 'ar';
  const isHe = language === 'he';

  const [isOpen, setIsOpen] = useState(false);

  // Fetch family profiles for the authenticated user
  const { data: familyData, isLoading } = useQuery({
    queryKey: ['student-family-profiles', user?.id],
    queryFn: async () => {
      const res = await api.get('/students/family/profiles');
      return res.data;
    },
    enabled: !!user?.id,
  });

  const switchMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const res = await api.post(`/students/family/switch/${targetUserId}`);
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.token && data?.user) {
        setAuth(data.user, data.token);
        toast.success(
          isAr
            ? `تم التبديل بنجاح إلى ملف: ${data.user.firstName} ${data.user.lastName}`
            : isHe
            ? `המעבר לפרופיל ${data.user.firstName} ${data.user.lastName} בוצע בהצלחה`
            : `Switched profile to ${data.user.firstName} ${data.user.lastName}`
        );
        // Invalidate queries so dashboard reflects newly selected child/parent profile
        queryClient.invalidateQueries();
        window.location.reload();
      }
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message ||
          (isAr ? 'تعذر تبديل الملف الشخصي' : isHe ? 'שגיאה במעבר בין פרופילים' : 'Failed to switch profile')
      );
    },
  });

  if (isLoading || !familyData?.hasFamily) {
    return null;
  }

  const members = familyData.members || [];
  if (members.length <= 1) {
    return null;
  }

  const currentMember = members.find((m: any) => m.id === user?.id) || user;
  const isCurrentParent = currentMember?.isParent || currentMember?.familyRole === 'PARENT' || !currentMember?.parentId;

  return (
    <div className="relative mb-6">
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 end-0 -mt-6 -me-6 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Active Family Member Info */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center font-black text-lg shrink-0 shadow-inner">
              {isCurrentParent ? <Users className="w-6 h-6 text-indigo-300" /> : <Baby className="w-6 h-6 text-indigo-300" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-[10px] font-black uppercase tracking-wider border border-indigo-400/20">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>
                    {isAr
                      ? 'حساب العائلة الموحد (Family Account)'
                      : isHe
                      ? 'חשבון משפחתי מאוחד'
                      : 'Unified Family Account'}
                  </span>
                </span>
                <span className="text-[11px] text-slate-300 font-medium">
                  {members.length}{' '}
                  {isAr ? 'أفراد مسجلين تحت هذا الحساب' : isHe ? 'חברים מקושרים' : 'Linked Family Profiles'}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <p className="text-base sm:text-lg font-black text-white">
                  {isAr ? 'الملف النشط حالياً:' : isHe ? 'פרופיל פעיל כעת:' : 'Active Learner Profile:'}
                </p>
                <span className="font-extrabold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20 text-sm sm:text-base">
                  {currentMember?.firstName} {currentMember?.lastName}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-200 font-bold border border-white/10">
                  {isCurrentParent
                    ? isAr
                      ? 'ولي الأمر (Parent)'
                      : isHe
                      ? 'הורה'
                      : 'Parent / Head'
                    : isAr
                    ? 'حساب الابن (Child)'
                    : isHe
                    ? 'ילד/ה'
                    : 'Child Account'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Profile Switching Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-300 hidden sm:inline me-1">
              <ArrowRightLeft className="w-3.5 h-3.5 inline me-1 text-indigo-300" />
              {isAr ? 'تبديل سريع إلى:' : isHe ? 'מעבר מהיר אל:' : 'Switch to:'}
            </span>

            {members.map((member: any) => {
              const isSelected = member.id === user?.id;
              const isParent = member.isParent || member.familyRole === 'PARENT' || (!member.parentId && member.id === familyData.parentId);

              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    if (!isSelected && !switchMutation.isPending) {
                      switchMutation.mutate(member.id);
                    }
                  }}
                  disabled={isSelected || switchMutation.isPending}
                  className={`px-3 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 font-black shadow-md ring-2 ring-amber-300/40 cursor-default'
                      : 'bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/15'
                  }`}
                  title={`${member.firstName} ${member.lastName} (${member.email})`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                      isSelected
                        ? 'bg-slate-950 text-amber-300'
                        : isParent
                        ? 'bg-indigo-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {isParent ? 'P' : 'C'}
                  </div>
                  <span className="truncate max-w-[110px]">{member.firstName}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
