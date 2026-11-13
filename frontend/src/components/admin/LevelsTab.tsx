import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { levelsApi } from '../../lib/enterpriseApi';
import { LevelModel } from '../../types';
import { toast } from '../../store/toastStore';
import { Plus, Trash2, Edit2, Check, X, Layers, AlertCircle } from 'lucide-react';

export const LevelsTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    labelEn: '',
    labelHe: '',
    sortOrder: 1,
    color: '#3B82F6',
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
      toast.success('Level created successfully');
      setIsCreating(false);
      setFormData({ code: '', labelEn: '', labelHe: '', sortOrder: levels.length + 1, color: '#3B82F6', description: '' });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create level'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LevelModel> }) =>
      levelsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['levels'] });
      toast.success('Level updated successfully');
      setEditingId(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update level'),
  });

  const deleteMutation = useMutation({
    mutationFn: levelsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['levels'] });
      toast.success('Level deleted successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete level'),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-500" />
            Custom Platform Levels Management
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Define custom academic proficiency levels with dynamic Hebrew/English labels, ordering, and theme accents.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Level
        </button>
      </div>

      {isCreating && (
        <div className="p-6 bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-blue-900/50 rounded-2xl space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">Create New Proficiency Level</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Code (Unique Key)</label>
              <input
                type="text"
                placeholder="e.g. MASTERY_C1"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">English Label</label>
              <input
                type="text"
                placeholder="e.g. Advanced C1"
                value={formData.labelEn}
                onChange={(e) => setFormData({ ...formData, labelEn: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Hebrew Label</label>
              <input
                type="text"
                placeholder="לדוגמה: רמה ו׳ - שוטף"
                value={formData.labelHe}
                onChange={(e) => setFormData({ ...formData, labelHe: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Progression Order</label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Accent Color</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border border-slate-300 dark:border-slate-700"
                />
                <span className="text-xs text-slate-500">{formData.color}</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Description</label>
              <input
                type="text"
                placeholder="Brief description of this stage"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              disabled={!formData.code || !formData.labelEn || !formData.labelHe}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              Save Level
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {levels.map((lvl) => (
          <div
            key={lvl.id}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm relative overflow-hidden transition hover:shadow-md"
          >
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ backgroundColor: lvl.color || '#3B82F6' }}
            />
            <div className="flex justify-between items-start mt-1">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Order #{lvl.sortOrder} • {lvl.code}
                </span>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1.5">{lvl.labelEn}</h4>
                <p className="text-sm text-slate-500 font-medium" dir="rtl">{lvl.labelHe}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateMutation.mutate({ id: lvl.id, data: { isActive: !lvl.isActive } })}
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    lvl.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                  }`}
                >
                  {lvl.isActive ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete level ${lvl.labelEn}?`)) {
                      deleteMutation.mutate(lvl.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {lvl.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 line-clamp-2">{lvl.description}</p>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-500">
              <span>{lvl._count?.students || 0} Students</span>
              <span>{lvl._count?.games || 0} Games</span>
              <span>{lvl._count?.levelExams || 0} Exams</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
