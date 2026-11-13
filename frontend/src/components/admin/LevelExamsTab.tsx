import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { levelExamsApi, levelsApi } from '../../lib/enterpriseApi';
import { LevelExamModel } from '../../types';
import { toast } from '../../store/toastStore';
import { Award, Plus, UserCheck, RefreshCw, CheckCircle, FileText } from 'lucide-react';

export const LevelExamsTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['level-exams'],
    queryFn: levelExamsApi.list,
  });

  const { data: levels = [] } = useQuery({
    queryKey: ['levels'],
    queryFn: levelsApi.list,
  });

  const [form, setForm] = useState({
    levelId: '',
    title: '',
    titleHe: '',
    description: '',
    passingScore: 70,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      levelExamsApi.create({
        ...data,
        questions: [
          {
            id: 'q1',
            type: 'MCQ',
            questionEn: 'Which Hebrew letter makes the "Sh" sound?',
            questionHe: 'איזו אות מבטאת את הצליל "שׁ"?',
            options: ['ס (Samekh)', 'ש (Shin)', 'צ (Tsadi)'],
            correctAnswer: 'ש (Shin)',
            points: 50,
          },
          {
            id: 'q2',
            type: 'TRUE_FALSE',
            questionEn: 'Hebrew is read from right to left.',
            questionHe: 'עברית נקראת מימין לשמאל.',
            options: ['True', 'False'],
            correctAnswer: 'True',
            points: 50,
          },
        ],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['level-exams'] });
      toast.success('Level Exam template created successfully');
      setIsCreating(false);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Level Progression Exams Management
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Teachers unlock these exams for students after finishing their level curricula. Students have exactly 1 attempt to pass. Admins can reset attempts.
          </p>
        </div>
        <button
          onClick={() => {
            if (levels.length > 0) setForm({ ...form, levelId: levels[0].id });
            setIsCreating(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Exam Template
        </button>
      </div>

      {isCreating && (
        <div className="p-6 bg-amber-50 dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 rounded-2xl space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">New Level Progression Exam</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Target Level</label>
              <select
                value={form.levelId}
                onChange={(e) => setForm({ ...form, levelId: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              >
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.labelEn} ({l.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Exam Title (EN)</label>
              <input
                type="text"
                placeholder="e.g. Beginner Alef Graduation Exam"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Exam Title (HE)</label>
              <input
                type="text"
                placeholder="לדוגמה: מבחן סיום רמה א׳"
                value={form.titleHe}
                onChange={(e) => setForm({ ...form, titleHe: e.target.value })}
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
              disabled={!form.levelId || !form.title}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              Save Exam Template
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exams.map((ex) => (
          <div
            key={ex.id}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200">
                  Level: {ex.level?.labelEn}
                </span>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1.5">{ex.title}</h4>
                <p className="text-sm text-slate-500 font-medium" dir="rtl">{ex.titleHe}</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600">
                Pass Mark: {ex.passingScore}%
              </span>
            </div>

            <p className="text-xs text-slate-500">{ex.description || 'Comprehensive exam for level graduation.'}</p>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
              <span>{ex.questions?.length || 0} Questions configured</span>
              <span className="font-semibold text-amber-600">{ex._count?.studentAttempts || 0} Attempts recorded</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
