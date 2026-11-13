import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../hooks/useTranslation';
import { levelsApi } from '../../lib/enterpriseApi';
import { LevelModel } from '../../types';
import { toast } from '../../store/toastStore';
import { Plus, Trash2, Edit2, Check, X, Layers, AlertCircle } from 'lucide-react';
import { PageHeaderBanner } from '../common/PageHeaderBanner';

export const LevelsTab: React.FC = () => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingLevel, setEditingLevel] = useState<LevelModel | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    labelEn: '',
    labelHe: '',
    sortOrder: 1,
    color: '#0d9488',
    description: '',
  });

  const { data: levels = [], isLoading } = useQuery({
    queryKey: ['levels'],
    queryFn: levelsApi.list,
  });

  const createMutation = useMutation({
    mutationFn: levelsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['levels'] });
      toast.success(language === 'he' ? 'רמת הלימוד נוצרה בהצלחה' : 'Level created successfully');
      setIsCreating(false);
      setFormData({ code: '', labelEn: '', labelHe: '', sortOrder: levels.length + 1, color: '#0d9488', description: '' });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || (language === 'he' ? 'שגיאה ביצירת רמה' : 'Failed to create level')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LevelModel> }) =>
      levelsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['levels'] });
      toast.success(language === 'he' ? 'רמת הלימוד עודכנה בהצלחה' : 'Level updated successfully');
      setEditingLevel(null);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || (language === 'he' ? 'שגיאה בעדכון רמה' : 'Failed to update level')),
  });

  const deleteMutation = useMutation({
    mutationFn: levelsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['levels'] });
      toast.success(language === 'he' ? 'רמת הלימוד נמחקה' : 'Level deleted successfully');
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || (language === 'he' ? 'שגיאה במחיקת רמה' : 'Failed to delete level')),
  });

  return (
    <div className="space-y-6">
      <PageHeaderBanner
        badgeIcon={Layers}
        badgeText={language === 'he' ? 'ניהול רמות פלטפורמה מותאמות' : 'Custom Platform Levels Management'}
        statusText={language === 'he' ? 'פעיל' : 'Active'}
        title={language === 'he' ? 'רמות מיומנות ושליטה בעברית' : 'Hebrew Proficiency Levels'}
        description={
          language === 'he'
            ? 'הגדרת רמות לימוד אקדמיות עם שמות בעברית ובאנגלית, סדר התקדמות וגווני הדגשה מותאמים.'
            : 'Define custom academic proficiency levels with dynamic Hebrew/English labels, ordering, and theme accents.'
        }
        action={
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>{language === 'he' ? 'הוסף רמה' : 'Add Level'}</span>
          </button>
        }
      />

      {/* CREATE LEVEL FORM */}
      {isCreating && (
        <div className="p-6 bg-brand-teal-50/40 dark:bg-slate-850/60 border border-brand-teal-200/70 dark:border-brand-teal-800/70 rounded-3xl space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            {language === 'he' ? 'יצירת רמת לימוד חדשה' : 'Create New Proficiency Level'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'he' ? 'קוד ייחודי' : 'Code (Unique Key)'}
              </label>
              <input
                type="text"
                placeholder={language === 'he' ? 'לדוגמה: MASTERY_C1' : 'e.g. MASTERY_C1'}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'he' ? 'שם באנגלית' : 'English Label'}
              </label>
              <input
                type="text"
                placeholder={language === 'he' ? 'לדוגמה: Advanced C1' : 'e.g. Advanced C1'}
                value={formData.labelEn}
                onChange={(e) => setFormData({ ...formData, labelEn: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'he' ? 'שם בעברית' : 'Hebrew Label'}
              </label>
              <input
                type="text"
                placeholder="לדוגמה: רמה ו׳ - שוטף"
                value={formData.labelHe}
                onChange={(e) => setFormData({ ...formData, labelHe: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'he' ? 'סדר התקדמות' : 'Progression Order'}
              </label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'he' ? 'צבע הדגשה' : 'Accent Color'}
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700"
                />
                <span className="text-xs font-mono text-slate-500">{formData.color}</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'he' ? 'תיאור הרמה' : 'Description'}
              </label>
              <input
                type="text"
                placeholder={language === 'he' ? 'תיאור קצר של מטרות השלב' : 'Brief description of this stage'}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-brand-teal-100 dark:border-slate-800">
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {language === 'he' ? 'ביטול' : 'Cancel'}
            </button>
            <button
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.code || !formData.labelEn || !formData.labelHe}
              className="px-5 py-2 bg-brand-teal-800 hover:bg-brand-teal-900 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
            >
              {language === 'he' ? 'שמור רמה' : 'Save Level'}
            </button>
          </div>
        </div>
      )}

      {/* EDIT LEVEL MODAL */}
      {editingLevel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-brand-teal-100 dark:bg-brand-teal-900/60 text-brand-teal-800 dark:text-brand-teal-200">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {language === 'he' ? 'עריכת רמת לימוד' : 'Edit Proficiency Level'}
                </h3>
              </div>
              <button
                onClick={() => setEditingLevel(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'he' ? 'קוד ייחודי' : 'Code'}
                  </label>
                  <input
                    type="text"
                    value={editingLevel.code}
                    onChange={(e) => setEditingLevel({ ...editingLevel, code: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'he' ? 'סדר התקדמות' : 'Progression Order'}
                  </label>
                  <input
                    type="number"
                    value={editingLevel.sortOrder}
                    onChange={(e) => setEditingLevel({ ...editingLevel, sortOrder: Number(e.target.value) })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {language === 'he' ? 'שם באנגלית' : 'English Label'}
                </label>
                <input
                  type="text"
                  value={editingLevel.labelEn}
                  onChange={(e) => setEditingLevel({ ...editingLevel, labelEn: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {language === 'he' ? 'שם בעברית' : 'Hebrew Label'}
                </label>
                <input
                  type="text"
                  value={editingLevel.labelHe || ''}
                  onChange={(e) => setEditingLevel({ ...editingLevel, labelHe: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'he' ? 'צבע הדגשה' : 'Accent Color'}
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={editingLevel.color || '#0d9488'}
                      onChange={(e) => setEditingLevel({ ...editingLevel, color: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700"
                    />
                    <span className="text-xs font-mono text-slate-500">{editingLevel.color || '#0d9488'}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300 mt-4">
                    <input
                      type="checkbox"
                      checked={editingLevel.isActive}
                      onChange={(e) => setEditingLevel({ ...editingLevel, isActive: e.target.checked })}
                      className="rounded text-brand-teal-800 focus:ring-brand-teal-700 w-4 h-4"
                    />
                    <span>{language === 'he' ? 'רמה פעילה' : 'Active Level'}</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {language === 'he' ? 'תיאור הרמה' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  value={editingLevel.description || ''}
                  onChange={(e) => setEditingLevel({ ...editingLevel, description: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingLevel(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editingLevel) {
                    updateMutation.mutate({
                      id: editingLevel.id,
                      data: {
                        code: editingLevel.code,
                        labelEn: editingLevel.labelEn,
                        labelHe: editingLevel.labelHe,
                        sortOrder: editingLevel.sortOrder,
                        color: editingLevel.color,
                        description: editingLevel.description,
                        isActive: editingLevel.isActive,
                      },
                    });
                  }
                }}
                disabled={updateMutation.isPending || !editingLevel.code}
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

      {/* LEVELS CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {levels.map((lvl) => (
          <div
            key={lvl.id}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs relative overflow-hidden transition hover:shadow-md flex flex-col justify-between group"
          >
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ backgroundColor: lvl.color || '#0d9488' }}
            />
            <div>
              <div className="flex justify-between items-start mt-1">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {language === 'he' ? `סדר #${lvl.sortOrder} • ${lvl.code}` : `Order #${lvl.sortOrder} • ${lvl.code}`}
                  </span>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1.5">
                    {language === 'he' && lvl.labelHe ? lvl.labelHe : lvl.labelEn}
                  </h4>
                  <p className="text-sm text-slate-500 font-medium">
                    {language === 'he' ? lvl.labelEn : lvl.labelHe}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateMutation.mutate({ id: lvl.id, data: { isActive: !lvl.isActive } })}
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition ${
                      lvl.isActive
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 hover:bg-emerald-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 hover:bg-red-200'
                    }`}
                    title={language === 'he' ? 'לחץ לשינוי סטטוס' : 'Click to toggle status'}
                  >
                    {lvl.isActive ? (language === 'he' ? 'פעיל' : 'Active') : (language === 'he' ? 'לא פעיל' : 'Inactive')}
                  </button>
                  <button
                    onClick={() => setEditingLevel(lvl)}
                    className="p-1.5 text-slate-500 hover:text-brand-teal-700 dark:hover:text-brand-teal-300 rounded-lg hover:bg-brand-teal-50 dark:hover:bg-slate-800 transition-colors"
                    title={language === 'he' ? 'ערוך רמה' : 'Edit Level'}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(language === 'he' ? `האם למחוק את רמה ${lvl.labelEn}?` : `Delete level ${lvl.labelEn}?`)) {
                        deleteMutation.mutate(lvl.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    title={language === 'he' ? 'מחק' : 'Delete'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {lvl.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                  {lvl.description}
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-500">
              <span className="font-semibold">{language === 'he' ? `${lvl._count?.students || 0} תלמידים` : `${lvl._count?.students || 0} Students`}</span>
              <span className="font-semibold">{language === 'he' ? `${lvl._count?.games || 0} משחקים` : `${lvl._count?.games || 0} Games`}</span>
              <span className="font-semibold">{language === 'he' ? `${lvl._count?.levelExams || 0} מבחנים` : `${lvl._count?.levelExams || 0} Exams`}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
