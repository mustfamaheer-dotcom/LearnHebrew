import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../hooks/useTranslation';
import { languagesApi } from '../../lib/enterpriseApi';
import { LanguageModel } from '../../types';
import { toast } from '../../store/toastStore';
import { Globe, Plus, Check } from 'lucide-react';
import { PageHeaderBanner } from '../common/PageHeaderBanner';

export const LanguagesTab: React.FC = () => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({ code: '', labelEn: '', labelNative: '', flagEmoji: '🌐' });

  const { data: languages = [], isLoading } = useQuery({
    queryKey: ['languages'],
    queryFn: languagesApi.list,
  });

  const createMutation = useMutation({
    mutationFn: languagesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['languages'] });
      toast.success('Language added');
      setIsCreating(false);
      setForm({ code: '', labelEn: '', labelNative: '', flagEmoji: '🌐' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      languagesApi.toggle(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['languages'] });
      toast.success('Language status updated');
    },
  });

  return (
    <div className="space-y-6">
      <PageHeaderBanner
        badgeIcon={Globe}
        badgeText={language === 'he' ? 'מנוע לוקליזציה ורב-לשוניות' : 'Bilingual & Localization Engine'}
        statusText={language === 'he' ? 'פעיל' : 'Active'}
        title={language === 'he' ? 'מאגר השפות הנתמכות בפלטפורמה' : 'Platform Multi-Language Registry'}
        description={
          language === 'he'
            ? 'הגדרת שפות אם ושפות יעד. מתאים אוטומטית את תהליך ההצטרפות של התלמיד, שאלוני המשוב ושפת הממשק.'
            : 'Configure native mother tongues and target learning languages. Automatically adapts student onboarding, review flows, and default locale.'
        }
        action={
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>{language === 'he' ? 'הוסף שפה נתמכת' : 'Add Supported Language'}</span>
          </button>
        }
      />

      {isCreating && (
        <div className="p-6 bg-brand-teal-50/40 dark:bg-slate-850/60 border border-brand-teal-200/70 dark:border-brand-teal-800/70 rounded-3xl space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            {language === 'he' ? 'הוספת אפשרות שפה חדשה' : 'Add New Language Option'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {language === 'he' ? 'קוד שפה (ISO)' : 'Code (ISO)'}
              </label>
              <input
                type="text"
                placeholder={language === 'he' ? 'לדוגמה: es' : 'e.g. es'}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {language === 'he' ? 'שם באנגלית' : 'English Name'}
              </label>
              <input
                type="text"
                placeholder={language === 'he' ? 'לדוגמה: Spanish' : 'e.g. Spanish'}
                value={form.labelEn}
                onChange={(e) => setForm({ ...form, labelEn: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {language === 'he' ? 'שם בשפת המקור' : 'Native Name'}
              </label>
              <input
                type="text"
                placeholder={language === 'he' ? 'לדוגמה: Español' : 'e.g. Español'}
                value={form.labelNative}
                onChange={(e) => setForm({ ...form, labelNative: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {language === 'he' ? 'אמוג׳י דגל' : 'Flag Emoji'}
              </label>
              <input
                type="text"
                placeholder="🇪🇸"
                value={form.flagEmoji}
                onChange={(e) => setForm({ ...form, flagEmoji: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
            >
              {language === 'he' ? 'ביטול' : 'Cancel'}
            </button>
            <button
              onClick={() => createMutation.mutate(form)}
              className="px-5 py-2 bg-brand-teal-800 hover:bg-brand-teal-900 text-white rounded-xl text-sm font-semibold"
            >
              {language === 'he' ? 'שמור שפה' : 'Save Language'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {languages.map((lng) => (
          <div
            key={lng.id}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{lng.flagEmoji || '🌐'}</span>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">{lng.labelEn}</h4>
                <p className="text-xs text-slate-500 font-medium">{lng.labelNative} ({lng.code})</p>
              </div>
            </div>
            <button
              onClick={() => toggleMutation.mutate({ id: lng.id, isActive: !lng.isActive })}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                lng.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {lng.isActive ? 'Active' : 'Off'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
