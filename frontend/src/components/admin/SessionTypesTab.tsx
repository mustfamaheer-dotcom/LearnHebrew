import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../hooks/useTranslation';
import { sessionTypesApi } from '../../lib/enterpriseApi';
import { SessionTypeModel } from '../../types';
import { toast } from '../../store/toastStore';
import { Clock, Plus, Trash2, Edit2, Check, X, ShieldAlert } from 'lucide-react';
import { PageHeaderBanner } from '../common/PageHeaderBanner';

export const SessionTypesTab: React.FC = () => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionTypeModel | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    durationMinutes: 25,
    labelEn: '',
    labelHe: '',
    sortOrder: 1,
  });

  const { data: sessionTypes = [], isLoading } = useQuery({
    queryKey: ['session-types'],
    queryFn: sessionTypesApi.list,
  });

  const createMutation = useMutation({
    mutationFn: sessionTypesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-types'] });
      toast.success(language === 'he' ? 'סוג השיעור נוצר בהצלחה' : 'Session type created successfully');
      setIsCreating(false);
      setFormData({ name: '', durationMinutes: 30, labelEn: '', labelHe: '', sortOrder: sessionTypes.length + 1 });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || (language === 'he' ? 'שגיאה ביצירת סוג שיעור' : 'Failed to create session type')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SessionTypeModel> }) =>
      sessionTypesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-types'] });
      toast.success(language === 'he' ? 'סוג השיעור עודכן בהצלחה' : 'Session type updated successfully');
      setEditingSession(null);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || (language === 'he' ? 'שגיאה בעדכון סוג שיעור' : 'Failed to update session type')),
  });

  const deleteMutation = useMutation({
    mutationFn: sessionTypesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-types'] });
      toast.success(language === 'he' ? 'סוג השיעור הוסר' : 'Session type removed');
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || (language === 'he' ? 'שגיאה במחיקת סוג שיעור' : 'Failed to remove session type')),
  });

  return (
    <div className="space-y-6">
      <PageHeaderBanner
        badgeIcon={Clock}
        badgeText={language === 'he' ? 'מערכת משכי מפגשים מגוונים' : 'Multi-Duration Session System'}
        statusText={language === 'he' ? 'פעיל' : 'Active'}
        title={language === 'he' ? 'סוגי ומשכי שיעורים' : 'Session Types & Durations'}
        description={
          language === 'he'
            ? 'מורים מזינים זמינות לפי משכי השיעורים (25, 40 ו-55 דק׳). תלמידים מזמינים ישירות מתוך מכסת החבילה הפעילה.'
            : 'Teachers add open availability slots. Session durations (25, 40, 55 mins) are defined here and booked by students using their active package session quotas.'
        }
        action={
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>{language === 'he' ? 'הוסף סוג שיעור' : 'Add Session Type'}</span>
          </button>
        }
      />

      {/* CREATE FORM */}
      {isCreating && (
        <div className="p-6 bg-brand-teal-50/40 dark:bg-slate-850/60 border border-brand-teal-200/70 dark:border-brand-teal-800/70 rounded-3xl space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            {language === 'he' ? 'הגדרת סוג שיעור ומשך חדש' : 'Create New Session Duration Model'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'he' ? 'מפתח פנימי / שם' : 'Internal Key / Name'}
              </label>
              <input
                type="text"
                placeholder={language === 'he' ? 'לדוגמה: 45min' : 'e.g. 45min'}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'he' ? 'משך שיעור (דקות)' : 'Duration (Minutes)'}
              </label>
              <input
                type="number"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'he' ? 'שם באנגלית' : 'English Label'}
              </label>
              <input
                type="text"
                placeholder={language === 'he' ? 'לדוגמה: 45 Min Focused' : 'e.g. 45 Min Focused'}
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
                placeholder="45 דקות - שיעור ממוקד"
                value={formData.labelHe}
                onChange={(e) => setFormData({ ...formData, labelHe: e.target.value })}
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
              disabled={!formData.name || !formData.labelEn}
              className="px-5 py-2 bg-brand-teal-800 hover:bg-brand-teal-900 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
            >
              {language === 'he' ? 'שמור סוג שיעור' : 'Save Duration'}
            </button>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-brand-teal-100 dark:bg-brand-teal-900/60 text-brand-teal-800 dark:text-brand-teal-200">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {language === 'he' ? 'עריכת סוג שיעור' : 'Edit Session Type'}
                </h3>
              </div>
              <button
                onClick={() => setEditingSession(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'he' ? 'מפתח פנימי / שם' : 'Internal Key / Name'}
                  </label>
                  <input
                    type="text"
                    value={editingSession.name}
                    onChange={(e) => setEditingSession({ ...editingSession, name: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'he' ? 'משך שיעור (דקות)' : 'Duration (Minutes)'}
                  </label>
                  <input
                    type="number"
                    value={editingSession.durationMinutes}
                    onChange={(e) => setEditingSession({ ...editingSession, durationMinutes: Number(e.target.value) })}
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
                  value={editingSession.labelEn || ''}
                  onChange={(e) => setEditingSession({ ...editingSession, labelEn: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {language === 'he' ? 'שם בעברית' : 'Hebrew Label'}
                </label>
                <input
                  type="text"
                  value={editingSession.labelHe || ''}
                  onChange={(e) => setEditingSession({ ...editingSession, labelHe: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={editingSession.isActive}
                    onChange={(e) => setEditingSession({ ...editingSession, isActive: e.target.checked })}
                    className="rounded text-brand-teal-800 focus:ring-brand-teal-700 w-4 h-4"
                  />
                  <span>{language === 'he' ? 'סוג שיעור פעיל במערכת' : 'Active Session Type'}</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingSession(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editingSession) {
                    updateMutation.mutate({
                      id: editingSession.id,
                      data: {
                        name: editingSession.name,
                        durationMinutes: editingSession.durationMinutes,
                        labelEn: editingSession.labelEn,
                        labelHe: editingSession.labelHe,
                        isActive: editingSession.isActive,
                      },
                    });
                  }
                }}
                disabled={updateMutation.isPending || !editingSession.name}
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

      {/* SESSION TYPES CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sessionTypes.map((st) => (
          <div
            key={st.id}
            className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs flex flex-col justify-between hover:shadow-md transition-all group"
          >
            <div>
              <div className="flex justify-between items-start">
                <span className="text-3xl font-black text-brand-teal-800 dark:text-brand-teal-300">
                  {st.durationMinutes} <span className="text-sm font-medium text-slate-500">{language === 'he' ? 'דק׳' : 'min'}</span>
                </span>
                <button
                  onClick={() => updateMutation.mutate({ id: st.id, data: { isActive: !st.isActive } })}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition ${
                    st.isActive
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 hover:bg-emerald-200'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                  title={language === 'he' ? 'לחץ לשינוי מצב פעילות' : 'Click to toggle active status'}
                >
                  {st.isActive ? (language === 'he' ? 'פעיל' : 'Active') : (language === 'he' ? 'מושבת' : 'Disabled')}
                </button>
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                {language === 'he' && st.labelHe ? st.labelHe : st.labelEn}
              </h4>
              <p className="text-sm text-slate-500 font-medium">
                {language === 'he' ? st.labelEn : st.labelHe}
              </p>
              <div className="mt-1 text-[11px] font-mono text-slate-400">
                {language === 'he' ? 'מפתח:' : 'Key:'} {st.name}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
              <span className="font-semibold">
                {language === 'he' ? `${st._count?.lessons || 0} שיעורים הושלמו` : `${st._count?.lessons || 0} Lessons Completed`}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingSession(st)}
                  className="p-1.5 text-slate-500 hover:text-brand-teal-700 dark:hover:text-brand-teal-300 rounded-lg hover:bg-brand-teal-50 dark:hover:bg-slate-800 transition-colors"
                  title={language === 'he' ? 'ערוך סוג שיעור' : 'Edit Session Type'}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(language === 'he' ? `האם למחוק את סוג השיעור ${st.name}?` : `Remove session type ${st.name}?`)) {
                      deleteMutation.mutate(st.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  title={language === 'he' ? 'מחק' : 'Delete'}
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
