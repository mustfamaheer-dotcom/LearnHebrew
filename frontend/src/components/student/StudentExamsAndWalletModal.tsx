import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { levelExamsApi } from '../../lib/enterpriseApi';
import { api } from '../../lib/api';
import { toast } from '../../store/toastStore';
import { Award, Wallet, Clock, CheckCircle, AlertCircle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentExamsAndWalletModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'wallet' | 'exams'>('wallet');
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
        toast.success(`🎉 Congratulations! You scored ${data.score}% and advanced to the next level!`);
      } else {
        toast.error(`Exam completed. Score: ${data.score}%. (Passing score required: ${data.exam?.passingScore || 70}%)`);
      }
      setActiveAttempt(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Submission failed'),
  });

  if (!isOpen) return null;

  const sessionBalances = dashboardData?.sessionBalances || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveTab('wallet'); setActiveAttempt(null); }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                activeTab === 'wallet' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Session Wallet & Balances
            </button>
            <button
              onClick={() => setActiveTab('exams')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                activeTab === 'exams' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Level Progression Exams ({studentExams.length})
            </button>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab 1: Session Wallet */}
        {activeTab === 'wallet' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-500" /> Active Session Quotas
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your lessons are deducted from your balance of sessions. Packages remain valid for up to 30 days.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sessionBalances.map((sb: any) => (
                <div
                  key={sb.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {sb.sessionType?.labelEn || sb.sessionType?.name}
                    </span>
                    <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                      {sb.balance}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center justify-between">
                    <span>Duration: {sb.sessionType?.durationMinutes} mins</span>
                    {sb.expiresAt && (
                      <span className="text-amber-600 font-semibold">
                        Expires: {new Date(sb.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {sessionBalances.length === 0 && (
                <div className="col-span-2 p-8 text-center text-slate-400 border border-dashed rounded-2xl">
                  No active session packages. Contact your sales advisor to enroll in a package.
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
                <Award className="w-5 h-5 text-amber-500" /> Unlocked Level Advancement Exams
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                When your teacher completes your level topics, they unlock the official progression exam. You have 1 attempt to complete it!
              </p>
            </div>

            <div className="space-y-3">
              {studentExams.map((att: any) => (
                <div
                  key={att.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shadow-sm"
                >
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                      Target Level: {att.exam?.level?.labelEn}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white">{att.exam?.title}</h4>
                    <p className="text-xs text-slate-400 font-medium" dir="rtl">{att.exam?.titleHe}</p>
                    <div className="text-xs text-slate-500 mt-1">
                      Status: <span className="font-semibold text-slate-700 dark:text-slate-300">{att.status}</span>
                      {att.score !== null && ` • Score: ${att.score}% (${att.passed ? 'PASSED ✅' : 'NOT PASSED ⚠️'})`}
                    </div>
                  </div>

                  {att.status === 'PENDING' ? (
                    <button
                      onClick={() => setActiveAttempt(att)}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      Start Exam (1 Attempt)
                    </button>
                  ) : (
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold rounded-full">
                      Attempt Completed
                    </span>
                  )}
                </div>
              ))}
              {studentExams.length === 0 && (
                <div className="p-8 text-center text-slate-400 border border-dashed rounded-2xl">
                  No exams unlocked currently. Continue your regular sessions and ask your teacher when you're ready!
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
                Exam In Progress: {activeAttempt.exam?.title}
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                Answer each question carefully. Pass mark is {activeAttempt.exam?.passingScore}%.
              </p>
            </div>

            <div className="space-y-6">
              {(activeAttempt.exam?.questions as any[] || []).map((q, idx) => (
                <div key={q.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    Question {idx + 1}: {q.questionEn}
                  </div>
                  <div className="text-xs text-slate-400 font-medium" dir="rtl">{q.questionHe}</div>

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
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
              >
                Exit Without Submitting
              </button>
              <button
                onClick={() => submitExamMutation.mutate(activeAttempt.id)}
                disabled={submitExamMutation.isPending}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm"
              >
                {submitExamMutation.isPending ? 'Grading Exam...' : 'Submit Exam'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
