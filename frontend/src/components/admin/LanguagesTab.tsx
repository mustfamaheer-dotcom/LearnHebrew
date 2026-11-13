import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { languagesApi } from '../../lib/enterpriseApi';
import { LanguageModel } from '../../types';
import { toast } from '../../store/toastStore';
import { Globe, Plus, Check } from 'lucide-react';

export const LanguagesTab: React.FC = () => {
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-500" />
            Platform Multi-Language Registry
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure native mother tongues and learning languages. Used during student onboarding to customize instructions and reviews.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Supported Language
        </button>
      </div>

      {isCreating && (
        <div className="p-6 bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-blue-900/50 rounded-2xl space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">Add New Language Option</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Code (ISO)</label>
              <input
                type="text"
                placeholder="e.g. es"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">English Name</label>
              <input
                type="text"
                placeholder="e.g. Spanish"
                value={form.labelEn}
                onChange={(e) => setForm({ ...form, labelEn: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Native Name</label>
              <input
                type="text"
                placeholder="e.g. Español"
                value={form.labelNative}
                onChange={(e) => setForm({ ...form, labelNative: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Flag Emoji</label>
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
              Cancel
            </button>
            <button
              onClick={() => createMutation.mutate(form)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold"
            >
              Save Language
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
