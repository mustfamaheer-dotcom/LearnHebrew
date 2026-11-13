import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionTypesApi } from '../../lib/enterpriseApi';
import { SessionTypeModel } from '../../types';
import { toast } from '../../store/toastStore';
import { Clock, Plus, Trash2, Edit2, ShieldAlert } from 'lucide-react';

export const SessionTypesTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

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
      toast.success('Session type created successfully');
      setIsCreating(false);
      setFormData({ name: '', durationMinutes: 30, labelEn: '', labelHe: '', sortOrder: sessionTypes.length + 1 });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create session type'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SessionTypeModel> }) =>
      sessionTypesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-types'] });
      toast.success('Updated successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update session type'),
  });

  const deleteMutation = useMutation({
    mutationFn: sessionTypesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-types'] });
      toast.success('Session type removed');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to remove session type'),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            Session Types & Durations (Admin Managed)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Teachers only add open time slots. Session durations (25, 40, 55 mins) are defined here and purchased by students as balance units.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Session Type
        </button>
      </div>

      {isCreating && (
        <div className="p-6 bg-indigo-50 dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">Create New Session Duration Model</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Internal Key / Name</label>
              <input
                type="text"
                placeholder="e.g. 45min"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Duration (Minutes)</label>
              <input
                type="number"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">English Label</label>
              <input
                type="text"
                placeholder="e.g. 45 Min Focused"
                value={formData.labelEn}
                onChange={(e) => setFormData({ ...formData, labelEn: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Hebrew Label</label>
              <input
                type="text"
                placeholder="45 דקות - שיעור ממוקד"
                value={formData.labelHe}
                onChange={(e) => setFormData({ ...formData, labelHe: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.name || !formData.labelEn}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              Save Duration
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sessionTypes.map((st) => (
          <div
            key={st.id}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start">
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                  {st.durationMinutes} <span className="text-sm font-medium text-slate-500">min</span>
                </span>
                <button
                  onClick={() => updateMutation.mutate({ id: st.id, data: { isActive: !st.isActive } })}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    st.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {st.isActive ? 'Active' : 'Disabled'}
                </button>
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-2">{st.labelEn}</h4>
              <p className="text-sm text-slate-500 font-medium" dir="rtl">{st.labelHe}</p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
              <span>{st._count?.lessons || 0} Lessons Completed</span>
              <button
                onClick={() => {
                  if (confirm(`Remove session type ${st.name}?`)) deleteMutation.mutate(st.id);
                }}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
