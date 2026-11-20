import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Baby, X, UserPlus, Mail, Phone, Lock, Sparkles, BookOpen } from 'lucide-react';
import { api } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import { toast } from '../../store/toastStore';

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentUser: any | null;
  levels?: any[];
}

export const AddChildModal: React.FC<AddChildModalProps> = ({
  isOpen,
  onClose,
  parentUser,
  levels = [],
}) => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const isAr = language === 'ar';
  const isHe = language === 'he';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState(parentUser?.lastName || '');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('LearnHebrew@2026');
  const [levelId, setLevelId] = useState(levels[0]?.id || '');

  // Auto-generate suggested email and phone aliases when first name changes
  const handleFirstNameChange = (val: string) => {
    setFirstName(val);
    const cleanName = val.trim().replace(/\s+/g, '');
    if (parentUser?.email && (!email || email.includes('+'))) {
      const parts = parentUser.email.split('@');
      if (parts.length === 2) {
        setEmail(cleanName ? `${parts[0]}+${cleanName}@${parts[1]}` : parentUser.email);
      }
    }
    if (parentUser?.phone && (!phone || phone.includes('+'))) {
      setPhone(cleanName ? `${parentUser.phone}+${cleanName}` : parentUser.phone);
    }
  };

  const createChildMutation = useMutation({
    mutationFn: async () => {
      if (!parentUser?.id) throw new Error('Parent user is missing');
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim() || parentUser.lastName || '',
        email: email.trim() || undefined,
        phone: phone.trim() || parentUser.phone || undefined,
        password: password || 'LearnHebrew@2026',
        levelId: levelId || undefined,
        familyRole: 'CHILD',
      };
      const res = await api.post(`/users/${parentUser.id}/children`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['family-details', parentUser?.id] });
      toast.success(
        isAr
          ? `تم إنشاء حساب الابن (${firstName}) وربطه بحساب العائلة بنجاح!`
          : isHe
          ? `חשבון הילד (${firstName}) נוצר וקושר למשפחה בהצלחה!`
          : `Child account (${firstName}) successfully created and linked to family!`
      );
      onClose();
      setFirstName('');
      setEmail('');
      setPhone('');
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message || (isAr ? 'فشل إنشاء حساب الابن' : isHe ? 'שגיאה ביצירת חשבון ילד' : 'Failed to create child account')
      );
    },
  });

  if (!isOpen || !parentUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full my-8 shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-6 sm:p-7">
          <div className="absolute top-0 end-0 -mt-8 -me-8 w-44 h-44 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center shrink-0 shadow-xs">
                <Baby className="w-6 h-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-300 text-[10px] font-black uppercase tracking-wider mb-1 border border-white/10">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>
                    {isAr ? 'إضافة ابن لحساب العائلة' : isHe ? 'הוספת ילד לחשבון משפחה' : 'Add Child to Family'}
                  </span>
                </div>
                <h2 className="text-xl font-black text-white">
                  {isAr ? 'إنشاء حساب فرعي (ابن)' : isHe ? 'יצירת חשבון ילד חדש' : 'Create Child Account'}
                </h2>
                <p className="text-xs text-emerald-100/80 font-medium mt-0.5">
                  {isAr ? 'التابع لولي الأمر: ' : isHe ? 'מקושר להורה: ' : 'Linked to Parent: '}
                  <span className="font-bold text-white">{parentUser.firstName} {parentUser.lastName}</span>
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

        {/* Form Body */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createChildMutation.mutate();
          }}
          className="p-6 sm:p-7 space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {isAr ? 'اسم الابن (الأول)' : isHe ? 'שם פרטי של הילד' : 'Child First Name'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Talin"
                value={firstName}
                onChange={(e) => handleFirstNameChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {isAr ? 'اسم العائلة' : isHe ? 'שם משפחה' : 'Last Name'}
              </label>
              <input
                type="text"
                placeholder={parentUser.lastName || 'alknawi'}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {isAr ? 'البريد الإلكتروني للابن (أو اسم بديل للإيميل)' : isHe ? 'אימייל של הילד (או כתובת מקושרת)' : 'Child Email (or Alias)'}
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={`${parentUser.email?.replace('@', '+child@') || 'parent+child@domain.com'}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {isAr
                ? 'يمكن تركه فارغاً ليتم توليد إيميل مخصص تلقائياً يتيح البحث برقم الهاتف أو إيميل العائلة'
                : isHe
                ? 'ניתן להשאיר כפי שהוא או לריק לסנכרון אוטומטי תחת מייל ההורה'
                : 'Auto-aliased so family search by parent email or phone automatically returns this child'}
            </p>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {isAr ? 'رقم الهاتف' : isHe ? 'טלפון' : 'Phone Number'}
            </label>
            <input
              type="text"
              placeholder={parentUser.phone || '+972...'}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {levels.length > 0 && (
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {isAr ? 'المستوى التعليمي للغة العبرية' : isHe ? 'רמת עברית התחלתית' : 'Starting Hebrew Level'}
              </label>
              <select
                value={levelId}
                onChange={(e) => setLevelId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {levels.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {isHe ? lvl.labelHe : lvl.labelEn} ({lvl.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {isAr ? 'كلمة المرور المؤقتة' : isHe ? 'סיסמה ראשונית' : 'Initial Password'}
            </label>
            <input
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold transition-colors cursor-pointer"
            >
              {isAr ? 'إلغاء' : isHe ? 'ביטול' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={createChildMutation.isPending || !firstName.trim()}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>
                {createChildMutation.isPending
                  ? isAr ? 'جاري الإنشاء...' : isHe ? 'יוצר חשבון...' : 'Creating...'
                  : isAr ? 'إنشاء حساب الابن' : isHe ? 'צור חשבון ילד' : 'Create Child Account'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
