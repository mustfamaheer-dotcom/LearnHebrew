import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../hooks/useTranslation';
import { languagesApi } from '../../lib/enterpriseApi';
import { LanguageModel } from '../../types';
import { toast } from '../../store/toastStore';
import { confirmDialog } from '../../store/confirmDialogStore';
import {
  Globe,
  Plus,
  Check,
  Edit2,
  Trash2,
  X,
  Search,
  Smile,
  ShieldCheck,
} from 'lucide-react';
import { PageHeaderBanner } from '../common/PageHeaderBanner';

// Comprehensive catalog of country flags with English and Hebrew names
const WORLD_FLAGS = [
  { flag: '🇮🇱', nameEn: 'Israel', nameHe: 'ישראל', code: 'he' },
  { flag: '🇺🇸', nameEn: 'United States', nameHe: 'ארצות הברית', code: 'en' },
  { flag: '🇬🇧', nameEn: 'United Kingdom', nameHe: 'בריטניה', code: 'en' },
  { flag: '🇫🇷', nameEn: 'France', nameHe: 'צרפת', code: 'fr' },
  { flag: '🇪🇸', nameEn: 'Spain', nameHe: 'ספרד', code: 'es' },
  { flag: '🇩🇪', nameEn: 'Germany', nameHe: 'גרמניה', code: 'de' },
  { flag: '🇮🇹', nameEn: 'Italy', nameHe: 'איטליה', code: 'it' },
  { flag: '🇷🇺', nameEn: 'Russia', nameHe: 'רוסיה', code: 'ru' },
  { flag: '🇦🇪', nameEn: 'United Arab Emirates', nameHe: 'איחוד האמירויות', code: 'ar' },
  { flag: '🇸🇦', nameEn: 'Saudi Arabia', nameHe: 'ערב הסעודית', code: 'ar' },
  { flag: '🇪🇬', nameEn: 'Egypt', nameHe: 'מצרים', code: 'ar' },
  { flag: '🇯🇴', nameEn: 'Jordan', nameHe: 'ירדן', code: 'ar' },
  { flag: '🇲🇦', nameEn: 'Morocco', nameHe: 'מרוקו', code: 'ar' },
  { flag: '🇵🇹', nameEn: 'Portugal', nameHe: 'פורטוגל', code: 'pt' },
  { flag: '🇧🇷', nameEn: 'Brazil', nameHe: 'ברזיל', code: 'pt' },
  { flag: '🇨🇳', nameEn: 'China', nameHe: 'סין', code: 'zh' },
  { flag: '🇯🇵', nameEn: 'Japan', nameHe: 'יפן', code: 'ja' },
  { flag: '🇰🇷', nameEn: 'South Korea', nameHe: 'דרום קוריאה', code: 'ko' },
  { flag: '🇹🇷', nameEn: 'Turkey', nameHe: 'טורקיה', code: 'tr' },
  { flag: '🇺🇦', nameEn: 'Ukraine', nameHe: 'אוקראינה', code: 'uk' },
  { flag: '🇵🇱', nameEn: 'Poland', nameHe: 'פולין', code: 'pl' },
  { flag: '🇳🇱', nameEn: 'Netherlands', nameHe: 'הולנד', code: 'nl' },
  { flag: '🇸🇪', nameEn: 'Sweden', nameHe: 'שוודיה', code: 'sv' },
  { flag: '🇬🇷', nameEn: 'Greece', nameHe: 'יוון', code: 'el' },
  { flag: '🇮🇳', nameEn: 'India', nameHe: 'הודו', code: 'hi' },
  { flag: '🇦🇷', nameEn: 'Argentina', nameHe: 'ארגנטינה', code: 'es' },
  { flag: '🇨🇦', nameEn: 'Canada', nameHe: 'קנדה', code: 'en' },
  { flag: '🇦🇺', nameEn: 'Australia', nameHe: 'אוסטרליה', code: 'en' },
  { flag: '🇲🇽', nameEn: 'Mexico', nameHe: 'מקסיקו', code: 'es' },
  { flag: '🇿🇦', nameEn: 'South Africa', nameHe: 'דרום אפריקה', code: 'en' },
  { flag: '🇨🇭', nameEn: 'Switzerland', nameHe: 'שווייץ', code: 'de' },
  { flag: '🇳🇴', nameEn: 'Norway', nameHe: 'נורווגיה', code: 'no' },
  { flag: '🇩🇰', nameEn: 'Denmark', nameHe: 'דנמרק', code: 'da' },
  { flag: '🇫🇮', nameEn: 'Finland', nameHe: 'פינלנד', code: 'fi' },
  { flag: '🇨🇿', nameEn: 'Czechia', nameHe: 'צ׳כיה', code: 'cs' },
  { flag: '🇷🇴', nameEn: 'Romania', nameHe: 'רומניה', code: 'ro' },
  { flag: '🇭🇺', nameEn: 'Hungary', nameHe: 'הונגריה', code: 'hu' },
  { flag: '🇹🇭', nameEn: 'Thailand', nameHe: 'תאילנד', code: 'th' },
  { flag: '🇻🇳', nameEn: 'Vietnam', nameHe: 'וייטנאם', code: 'vi' },
  { flag: '🇮🇩', nameEn: 'Indonesia', nameHe: 'אינדונזיה', code: 'id' },
  { flag: '🇵🇭', nameEn: 'Philippines', nameHe: 'פיליפינים', code: 'tl' },
  { flag: '🇨🇴', nameEn: 'Colombia', nameHe: 'קולומביה', code: 'es' },
  { flag: '🇨🇱', nameEn: 'Chile', nameHe: 'צ׳ילה', code: 'es' },
  { flag: '🇵🇪', nameEn: 'Peru', nameHe: 'פרו', code: 'es' },
  { flag: '🇦🇹', nameEn: 'Austria', nameHe: 'אוסטריה', code: 'de' },
  { flag: '🇧🇪', nameEn: 'Belgium', nameHe: 'בלגיה', code: 'fr' },
  { flag: '🇮🇪', nameEn: 'Ireland', nameHe: 'אירלנד', code: 'en' },
  { flag: '🌐', nameEn: 'International / Other', nameHe: 'בינלאומי / כללי', code: 'intl' },
];

export const LanguagesTab: React.FC = () => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingLang, setEditingLang] = useState<LanguageModel | null>(null);

  // Flag keyboard / picker states
  const [showFlagPicker, setShowFlagPicker] = useState(false);
  const [flagSearch, setFlagSearch] = useState('');
  const [isPickerForEdit, setIsPickerForEdit] = useState(false);

  const [form, setForm] = useState({
    code: '',
    labelEn: '',
    labelNative: '',
    flagEmoji: '🌐',
  });

  const { data: languages = [], isLoading } = useQuery({
    queryKey: ['languages'],
    queryFn: languagesApi.list,
  });

  const createMutation = useMutation({
    mutationFn: languagesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['languages'] });
      toast.success(language === 'he' ? 'השפה נוספה בהצלחה למאגר' : 'Language added successfully');
      setIsCreating(false);
      setForm({ code: '', labelEn: '', labelNative: '', flagEmoji: '🌐' });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || (language === 'he' ? 'שגיאה בהוספת שפה' : 'Failed to add language')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LanguageModel> }) =>
      languagesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['languages'] });
      toast.success(language === 'he' ? 'פרטי השפה עודכנו בהצלחה' : 'Language updated successfully');
      setEditingLang(null);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || (language === 'he' ? 'שגיאה בעדכון שפה' : 'Failed to update language')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => languagesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['languages'] });
      toast.success(language === 'he' ? 'השפה נמחקה מהמאגר' : 'Language deleted');
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || (language === 'he' ? 'שגיאה במחיקת שפה' : 'Failed to delete language')),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      languagesApi.toggle(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['languages'] });
      toast.success(language === 'he' ? 'סטטוס השפה עודכן' : 'Language status updated');
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || (language === 'he' ? 'שגיאה בשינוי סטטוס שפה' : 'Failed to update status')),
  });

  // Filter flags in keyboard
  const filteredFlags = useMemo(() => {
    if (!flagSearch.trim()) return WORLD_FLAGS;
    const term = flagSearch.toLowerCase();
    return WORLD_FLAGS.filter(
      (f) =>
        f.nameEn.toLowerCase().includes(term) ||
        f.nameHe.includes(term) ||
        f.code.includes(term) ||
        f.flag.includes(term)
    );
  }, [flagSearch]);

  const handleSelectFlag = (item: (typeof WORLD_FLAGS)[0]) => {
    if (isPickerForEdit && editingLang) {
      setEditingLang({
        ...editingLang,
        flagEmoji: item.flag,
      });
    } else {
      setForm((prev) => ({
        ...prev,
        flagEmoji: item.flag,
        // Autofill code and name if empty
        code: prev.code ? prev.code : item.code,
        labelEn: prev.labelEn ? prev.labelEn : item.nameEn,
      }));
    }
    setShowFlagPicker(false);
  };

  return (
    <div className="space-y-6">
      <PageHeaderBanner
        badgeIcon={Globe}
        badgeText={language === 'he' ? 'מנוע לוקליזציה ורב-לשוניות' : 'Bilingual & Localization Engine'}
        statusText={language === 'he' ? 'פעיל' : 'Active'}
        title={language === 'he' ? 'מאגר השפות הנתמכות בפלטפורמה' : 'Platform Multi-Language Registry'}
        description={
          language === 'he'
            ? 'הגדרת שפות אם ושפות יעד. ניתן להוסיף, לערוך או למחוק כל שפה, ולבחור דגל מתוך מקלדת הדגלים האינטראקטיבית.'
            : 'Configure mother tongues and target learning languages. Add, edit, or delete languages and pick custom nation flags from the interactive flag keyboard.'
        }
        action={
          <button
            onClick={() => {
              setIsPickerForEdit(false);
              setIsCreating(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>{language === 'he' ? 'הוסף שפה נתמכת' : 'Add Supported Language'}</span>
          </button>
        }
      />

      {/* CREATE LANGUAGE FORM */}
      {isCreating && (
        <div className="p-6 bg-brand-teal-50/40 dark:bg-slate-850/60 border border-brand-teal-200/70 dark:border-brand-teal-800/70 rounded-3xl space-y-4 shadow-xs animate-in fade-in duration-200 relative">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            {language === 'he' ? 'הוספת אפשרות שפה חדשה' : 'Add New Language Option'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">
                {language === 'he' ? 'קוד שפה (ISO)' : 'Code (ISO)'}
              </label>
              <input
                type="text"
                placeholder={language === 'he' ? 'לדוגמה: es' : 'e.g. es'}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">
                {language === 'he' ? 'שם באנגלית' : 'English Name'}
              </label>
              <input
                type="text"
                placeholder={language === 'he' ? 'לדוגמה: Spanish' : 'e.g. Spanish'}
                value={form.labelEn}
                onChange={(e) => setForm({ ...form, labelEn: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">
                {language === 'he' ? 'שם בשפת המקור' : 'Native Name'}
              </label>
              <input
                type="text"
                placeholder={language === 'he' ? 'לדוגמה: Español' : 'e.g. Español'}
                value={form.labelNative}
                onChange={(e) => setForm({ ...form, labelNative: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
              />
            </div>

            {/* Flag Picker Trigger */}
            <div className="relative">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>{language === 'he' ? 'דגל (מקלדת דגלים)' : 'Flag Emoji (Picker)'}</span>
                <span className="text-[10px] text-brand-teal-700 dark:text-brand-teal-300 font-bold">
                  {language === 'he' ? 'לחץ לבחירה' : 'Click to pick'}
                </span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsPickerForEdit(false);
                  setShowFlagPicker(!showFlagPicker);
                }}
                className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between gap-2 shadow-2xs hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{form.flagEmoji}</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {WORLD_FLAGS.find((f) => f.flag === form.flagEmoji)?.[language === 'he' ? 'nameHe' : 'nameEn'] || (language === 'he' ? 'בחר דגל' : 'Choose flag')}
                  </span>
                </div>
                <Smile className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-400" />
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-brand-teal-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {language === 'he' ? 'ביטול' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => createMutation.mutate(form)}
              disabled={!form.code || !form.labelEn || !form.labelNative || createMutation.isPending}
              className="px-5 py-2 bg-brand-teal-800 hover:bg-brand-teal-900 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 transition active:scale-95"
            >
              {createMutation.isPending
                ? (language === 'he' ? 'שומר...' : 'Saving...')
                : (language === 'he' ? 'שמור שפה' : 'Save Language')}
            </button>
          </div>
        </div>
      )}

      {/* EDIT LANGUAGE MODAL */}
      {editingLang && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{editingLang.flagEmoji}</span>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {language === 'he' ? 'עריכת שפה' : 'Edit Language'} ({editingLang.code})
                </h3>
              </div>
              <button
                onClick={() => setEditingLang(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {language === 'he' ? 'קוד שפה' : 'Code'}
                </label>
                <input
                  type="text"
                  value={editingLang.code}
                  onChange={(e) => setEditingLang({ ...editingLang, code: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {language === 'he' ? 'שם באנגלית' : 'English Name'}
                </label>
                <input
                  type="text"
                  value={editingLang.labelEn}
                  onChange={(e) => setEditingLang({ ...editingLang, labelEn: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {language === 'he' ? 'שם בשפת המקור' : 'Native Name'}
                </label>
                <input
                  type="text"
                  value={editingLang.labelNative}
                  onChange={(e) => setEditingLang({ ...editingLang, labelNative: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
                />
              </div>

              {/* Flag Selection */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'he' ? 'דגל מייצג' : 'Flag Emoji'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsPickerForEdit(true);
                    setShowFlagPicker(true);
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{editingLang.flagEmoji}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {WORLD_FLAGS.find((f) => f.flag === editingLang.flagEmoji)?.[language === 'he' ? 'nameHe' : 'nameEn'] || (language === 'he' ? 'בחר דגל' : 'Choose flag')}
                    </span>
                  </div>
                  <Smile className="w-4 h-4 text-brand-teal-700" />
                </button>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={editingLang.isActive !== false}
                    onChange={(e) => setEditingLang({ ...editingLang, isActive: e.target.checked })}
                    className="rounded text-brand-teal-800 focus:ring-brand-teal-700 w-4 h-4"
                  />
                  <span>{language === 'he' ? 'שפה פעילה במערכת' : 'Active Language'}</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingLang(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editingLang) {
                    updateMutation.mutate({
                      id: editingLang.id,
                      data: {
                        code: editingLang.code,
                        labelEn: editingLang.labelEn,
                        labelNative: editingLang.labelNative,
                        flagEmoji: editingLang.flagEmoji,
                        isActive: editingLang.isActive,
                      },
                    });
                  }
                }}
                disabled={updateMutation.isPending || !editingLang.code}
                className="px-5 py-2 bg-brand-teal-800 hover:bg-brand-teal-900 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 transition active:scale-95"
              >
                {updateMutation.isPending
                  ? (language === 'he' ? 'שומר...' : 'Saving...')
                  : (language === 'he' ? 'שמור שינויים' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE FLAG KEYBOARD POPUP MODAL */}
      {showFlagPicker && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowFlagPicker(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Smile className="w-5 h-5 text-brand-teal-700 dark:text-brand-teal-300" />
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {language === 'he' ? 'מקלדת דגלי מדינות ושפות' : 'World Nation Flag Keyboard'}
                </h4>
              </div>
              <button
                onClick={() => setShowFlagPicker(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Flag Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={flagSearch}
                onChange={(e) => setFlagSearch(e.target.value)}
                placeholder={language === 'he' ? 'חיפוש דגל מדינה (לדוגמה: ישראל, ספרד, צרפת)...' : 'Search country flag (e.g. Israel, Spain, France)...'}
                className="w-full ps-9 pe-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-teal-800"
              />
            </div>

            {/* Flags Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-72 overflow-y-auto p-1 scrollbar-none">
              {filteredFlags.map((item) => (
                <button
                  key={item.nameEn + item.flag}
                  type="button"
                  onClick={() => handleSelectFlag(item)}
                  className="flex flex-col items-center justify-center p-2 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 hover:bg-brand-teal-50 dark:hover:bg-brand-teal-950/60 hover:border-brand-teal-300 dark:hover:border-brand-teal-700 transition group active:scale-95"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{item.flag}</span>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mt-1 truncate max-w-full text-center">
                    {language === 'he' ? item.nameHe : item.nameEn}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFlagPicker(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                {language === 'he' ? 'סגור' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LANGUAGES LIST */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {languages.map((lng) => (
          <div
            key={lng.id}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs flex flex-col justify-between hover:shadow-md transition-all group"
          >
            <div>
              <div className="flex items-start justify-between">
                <span className="text-4xl p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 shadow-2xs">
                  {lng.flagEmoji || '🌐'}
                </span>
                <button
                  onClick={() => toggleMutation.mutate({ id: lng.id, isActive: !lng.isActive })}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition ${
                    lng.isActive
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 hover:bg-emerald-200'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                  title={language === 'he' ? 'לחץ לשינוי מצב פעילות' : 'Click to toggle active status'}
                >
                  {lng.isActive ? (language === 'he' ? 'פעיל' : 'Active') : (language === 'he' ? 'מושבת' : 'Disabled')}
                </button>
              </div>

              <div className="mt-3">
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {lng.labelEn}
                </h4>
                <p className="text-xs text-slate-500 font-semibold">{lng.labelNative}</p>
                <div className="text-[10px] font-mono text-slate-400 mt-1 uppercase">
                  {language === 'he' ? 'קוד:' : 'Code:'} {lng.code}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 font-semibold">
                {lng.isActive ? (language === 'he' ? 'מוכן לשימוש' : 'Available') : (language === 'he' ? 'לא זמין' : 'Unavailable')}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingLang(lng)}
                  className="p-1.5 text-slate-500 hover:text-brand-teal-700 dark:hover:text-brand-teal-300 rounded-lg hover:bg-brand-teal-50 dark:hover:bg-slate-800 transition"
                  title={language === 'he' ? 'ערוך שפה' : 'Edit Language'}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={async () => {
                    const confirmed = await confirmDialog({
                      title: 'Delete Language',
                      titleHe: 'מחיקת שפה',
                      message: `Are you sure you want to permanently delete the language "${lng.labelEn}" (${lng.code}) from the registry?`,
                      messageHe: `האם למחוק לצמיתות את השפה "${lng.labelNative || lng.labelEn}" (${lng.code}) מרישום השפות במערכת?`,
                      confirmText: 'Delete Language',
                      confirmTextHe: 'מחק שפה',
                      variant: 'danger',
                    });
                    if (confirmed) {
                      deleteMutation.mutate(lng.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                  title={language === 'he' ? 'מחק שפה' : 'Delete Language'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
