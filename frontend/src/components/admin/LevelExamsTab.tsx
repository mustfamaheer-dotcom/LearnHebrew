import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../hooks/useTranslation';
import { levelExamsApi, levelsApi } from '../../lib/enterpriseApi';
import { LevelExamModel } from '../../types';
import { toast } from '../../store/toastStore';
import { Award, Plus, UserCheck, RefreshCw, CheckCircle, FileText } from 'lucide-react';
import { PageHeaderBanner } from '../common/PageHeaderBanner';

export const LevelExamsTab: React.FC = () => {
  const { language } = useTranslation();
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
      <PageHeaderBanner
        badgeIcon={Award}
        badgeText={language === 'he' ? 'מערכת מבחני מעבר רמה (הזדמנות אחת)' : '1-Attempt Exam Engine'}
        statusText={language === 'he' ? 'פעיל' : 'Active'}
        title={language === 'he' ? 'מבחני מעבר והתקדמות רמה' : 'Level Progression Exams'}
        description={
          language === 'he'
            ? 'מורים פותחים מבחנים אלו לתלמידים בסיום סילבוס הרמה. לתלמיד יש ניסיון יחיד לעבור. מנהלים יכולים לאפס ניסיונות.'
            : 'Teachers unlock these exams for students after finishing their level curricula. Students have exactly 1 attempt to pass. Admins can reset attempts.'
        }
        action={
          <button
            onClick={() => {
              if (levels.length > 0) setForm({ ...form, levelId: levels[0].id });
              setIsCreating(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>{language === 'he' ? 'צור תבנית מבחן' : 'Create Exam Template'}</span>
          </button>
        }
      />

      {isCreating && (
        <div className="p-6 bg-brand-teal-50/40 dark:bg-slate-850/60 border border-brand-teal-200/70 dark:border-brand-teal-800/70 rounded-3xl space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            {language === 'he' ? 'מבחן התקדמות רמה חדש' : 'New Level Progression Exam'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {language === 'he' ? 'רמת יעד' : 'Target Level'}
              </label>
              <select
                value={form.levelId}
                onChange={(e) => setForm({ ...form, levelId: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              >
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {language === 'he' && l.labelHe ? l.labelHe : l.labelEn} ({l.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {language === 'he' ? 'כותרת המבחן (אנגלית)' : 'Exam Title (EN)'}
              </label>
              <input
                type="text"
                placeholder={language === 'he' ? 'לדוגמה: Beginner Alef Graduation Exam' : 'e.g. Beginner Alef Graduation Exam'}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {language === 'he' ? 'כותרת המבחן (עברית)' : 'Exam Title (HE)'}
              </label>
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
              {language === 'he' ? 'ביטול' : 'Cancel'}
            </button>
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.levelId || !form.title}
              className="px-5 py-2 bg-brand-teal-800 hover:bg-brand-teal-900 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              {language === 'he' ? 'שמור תבנית מבחן' : 'Save Exam Template'}
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
