import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { levelExamsApi } from '../../lib/enterpriseApi';
import { api } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import { toast } from '../../store/toastStore';
import { Award, Layers, Clock, CheckCircle, AlertCircle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentExamsAndWalletModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const { language } = useTranslation();
  const [activeTab, setActiveTab] = useState<'packages' | 'exams'>('packages');
  const [activeAttempt, setActiveAttempt] = useState<any | null>(null);
  const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});

  const { data: dashboardData } = useQuery({
    queryKey: ['student-dashboard-wallet'],
    queryFn: async () => {
      const res = await api.get('/students/me/dashboard');
      return res.data;
    },
    enabled: isOpen,
  });

  const { data: studentExams = [] } = useQuery({
    queryKey: ['student-exams'],
    queryFn: levelExamsApi.getMyExams,
    enabled: isOpen,
  });

  const submitExamMutation = useMutation({
    mutationFn: (attemptId: string) =>
      levelExamsApi.submitExam(attemptId, examAnswers),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['student-exams'] });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard-wallet'] });
      if (data.passed) {
        toast.success(
          language === 'he'
            ? `🎉 כל הכבוד! קיבלת ציון של ${data.score}% ועלית לרמה הבאה!`
            : `🎉 Congratulations! You scored ${data.score}% and advanced to the next level!`
        );
      } else {
        toast.error(
          language === 'he'
            ? `המבחן הסתיים. ציון: ${data.score}%. (ציון מעבר נדרש: ${data.exam?.passingScore || 70}%)`
            : `Exam completed. Score: ${data.score}%. (Passing score required: ${data.exam?.passingScore || 70}%)`
        );
      }
      setActiveAttempt(null);
    },
    onError: (err: any) =>
      toast.error(
        err.response?.data?.message || (language === 'he' ? 'שגיאה בהגשת המבחן' : 'Submission failed')
      ),
  });

  if (!isOpen) return null;

  const sessionBalances = dashboardData?.sessionBalances || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveTab('packages'); setActiveAttempt(null); }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeTab === 'packages'
                  ? 'bg-brand-teal-800 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {language === 'he' ? 'חבילות שיעורים ומכסות' : 'Session Packages & Quotas'}
            </button>
            <button
              onClick={() => setActiveTab('exams')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeTab === 'exams'
                  ? 'bg-brand-teal-800 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {language === 'he'
                ? `מבחני מעבר רמה (${studentExams.length})`
                : `Level Progression Exams (${studentExams.length})`}
            </button>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab 1: Session Packages */}
        {activeTab === 'packages' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-teal-600 dark:text-brand-teal-400" />
                <span>{language === 'he' ? 'מכסות שיעורים פעילות' : 'Active Session Quotas'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {language === 'he'
                  ? 'השיעורים שנקבעו מנוכים ממכסת החבילה הפעילה שלך. החבילות תקפות עד 30 יום מיום הרכישה.'
                  : 'Your lessons are deducted from your active package sessions. Packages remain valid for up to 30 days.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sessionBalances.map((sb: any) => (
                <div
                  key={sb.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/60 space-y-2 shadow-2xs"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {language === 'he'
                        ? sb.sessionType?.labelHe || sb.sessionType?.labelEn || sb.sessionType?.name
                        : sb.sessionType?.labelEn || sb.sessionType?.name}
                    </span>
                    <span className="text-2xl font-black text-brand-teal-700 dark:text-brand-teal-300">
                      {sb.balance}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>
                      {language === 'he'
                        ? `משך שיעור: ${sb.sessionType?.durationMinutes} דק׳`
                        : `Duration: ${sb.sessionType?.durationMinutes} mins`}
                    </span>
                    {sb.expiresAt && (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        {language === 'he'
                          ? `תוקף עד: ${new Date(sb.expiresAt).toLocaleDateString('he-IL')}`
                          : `Expires: ${new Date(sb.expiresAt).toLocaleDateString()}`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {sessionBalances.length === 0 && (
                <div className="col-span-2 p-8 text-center text-slate-400 border border-dashed rounded-2xl">
                  {language === 'he'
                    ? 'אין כרגע חבילות שיעורים פעילות. פנה למנהל המכירות שלך כדי להצטרף לחבילה.'
                    : 'No active session packages. Contact your sales advisor to enroll in a package.'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Level Progression Exams */}
        {activeTab === 'exams' && !activeAttempt && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>{language === 'he' ? 'מבחני מעבר רמה פתוחים' : 'Unlocked Level Advancement Exams'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {language === 'he'
                  ? 'כאשר המורה שלך מסיים את נושאי הרמה, נפתח עבורך מבחן המעבר הרשמי. עומד לרשותך ניסיון 1 בלבד להשלימו!'
                  : 'When your teacher completes your level topics, they unlock the official progression exam. You have 1 attempt to complete it!'}
              </p>
            </div>

            <div className="space-y-3">
              {studentExams.map((att: any) => (
                <div
                  key={att.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shadow-sm"
                >
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      {language === 'he'
                        ? `רמת יעד: ${att.exam?.level?.labelHe || att.exam?.level?.labelEn}`
                        : `Target Level: ${att.exam?.level?.labelEn}`}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white">
                      {language === 'he' ? att.exam?.titleHe || att.exam?.title : att.exam?.title}
                    </h4>
                    <div className="text-xs text-slate-500 mt-1">
                      {language === 'he' ? 'סטטוס: ' : 'Status: '}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {att.status === 'PENDING'
                          ? (language === 'he' ? 'ממתין לביצוע' : 'PENDING')
                          : (language === 'he' ? 'הושלם' : 'COMPLETED')}
                      </span>
                      {att.score !== null && (
                        <span>
                          {' • '}
                          {language === 'he' ? `ציון: ${att.score}%` : `Score: ${att.score}%`}
                          {' ('}
                          {att.passed
                            ? (language === 'he' ? 'עבר בהצלחה ✅' : 'PASSED ✅')
                            : (language === 'he' ? 'לא עבר ⚠️' : 'NOT PASSED ⚠️')}
                          {')'}
                        </span>
                      )}
                    </div>
                  </div>

                  {att.status === 'PENDING' ? (
                    <button
                      onClick={() => setActiveAttempt(att)}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
                    >
                      {language === 'he' ? 'התחל מבחן (ניסיון 1)' : 'Start Exam (1 Attempt)'}
                    </button>
                  ) : (
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold rounded-full">
                      {language === 'he' ? 'הניסיון הושלם' : 'Attempt Completed'}
                    </span>
                  )}
                </div>
              ))}
              {studentExams.length === 0 && (
                <div className="p-8 text-center text-slate-400 border border-dashed rounded-2xl">
                  {language === 'he'
                    ? 'אין מבחנים פתוחים כרגע. המשך בלימודים הרגילים ובקש מהמורה שלך כשתרגיש מוכן!'
                    : "No exams unlocked currently. Continue your regular sessions and ask your teacher when you're ready!"}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Live Exam Mode */}
        {activeAttempt && (
          <div className="space-y-6">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800/40">
              <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                {language === 'he'
                  ? `מבחן בעיצומו: ${activeAttempt.exam?.titleHe || activeAttempt.exam?.title}`
                  : `Exam In Progress: ${activeAttempt.exam?.title}`}
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                {language === 'he'
                  ? `ענה על כל שאלה בקפידה. ציון המעבר הוא ${activeAttempt.exam?.passingScore}%.`
                  : `Answer each question carefully. Pass mark is ${activeAttempt.exam?.passingScore}%.`}
              </p>
            </div>

            <div className="space-y-6">
              {(activeAttempt.exam?.questions as any[] || []).map((q, idx) => (
                <div key={q.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {language === 'he'
                      ? `שאלה ${idx + 1}: ${q.questionHe || q.questionEn}`
                      : `Question ${idx + 1}: ${q.questionEn}`}
                  </div>

                  <div className="space-y-2 pt-1">
                    {(q.options || []).map((opt: string) => (
                      <label
                        key={opt}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition ${
                          examAnswers[q.id] === opt
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q_${q.id}`}
                          value={opt}
                          checked={examAnswers[q.id] === opt}
                          onChange={() => setExamAnswers({ ...examAnswers, [q.id]: opt })}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setActiveAttempt(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {language === 'he' ? 'יציאה ללא הגשה' : 'Exit Without Submitting'}
              </button>
              <button
                onClick={() => submitExamMutation.mutate(activeAttempt.id)}
                disabled={submitExamMutation.isPending}
                className="px-6 py-2.5 bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 rounded-xl text-sm font-bold shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                {submitExamMutation.isPending
                  ? (language === 'he' ? 'בודק מבחן...' : 'Grading Exam...')
                  : (language === 'he' ? 'הגש מבחן' : 'Submit Exam')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
