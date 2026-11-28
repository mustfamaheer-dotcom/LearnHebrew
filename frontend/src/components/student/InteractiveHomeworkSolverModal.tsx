import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Award,
  Check,
  X,
  FileText,
  ArrowRight,
  RotateCcw,
  Clock,
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { toast } from '../../store/toastStore';
import { homeworkTemplatesApi } from '../../lib/enterpriseApi';
import confetti from 'canvas-confetti';

interface InteractiveHomeworkSolverModalProps {
  homeworkId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const InteractiveHomeworkSolverModal: React.FC<InteractiveHomeworkSolverModalProps> = ({
  homeworkId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const isHe = language === 'he';
  const queryClient = useQueryClient();

  // Local State
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, any>>({});
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);

  // Query: Fetch solve data
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['interactiveHomeworkSolve', homeworkId],
    queryFn: () => (homeworkId ? homeworkTemplatesApi.getSolveData(homeworkId) : null),
    enabled: isOpen && !!homeworkId,
  });

  const homework = data?.homework;
  const interactive = data?.interactiveData;
  const questions: any[] = interactive?.questions || [];
  const isAlreadySubmitted = homework?.status === 'SUBMITTED' || homework?.status === 'REVIEWED';

  // Initialize or restore answers if already submitted
  useEffect(() => {
    if (homework?.submittedAnswers) {
      setSelectedAnswers(homework.submittedAnswers);
    } else {
      setSelectedAnswers({});
      setSubmissionResult(null);
    }
  }, [homework]);

  // Mutation: Submit Interactive Homework
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!homeworkId) return;
      return homeworkTemplatesApi.submitInteractive(homeworkId, selectedAnswers);
    },
    onSuccess: (res: any) => {
      setSubmissionResult(res);

      // Trigger XP Confetti celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      queryClient.invalidateQueries({ queryKey: ['studentHomework'] });
      queryClient.invalidateQueries({ queryKey: ['studentOverview'] });
      queryClient.invalidateQueries({ queryKey: ['interactiveHomeworkSolve', homeworkId] });

      toast.success(
        isAr
          ? `تم تسليم الواجب بنجاح! درجتك: ${res.score}/${res.maxScore} (${res.percentage}%). +20 نقطة تم إضافتها لمحفظتك!`
          : isHe
          ? `שיעורי הבית הוגשו בהצלחה! ציונך: ${res.score}/${res.maxScore} (${res.percentage}%). נוספו 20 נקודות!`
          : `Homework submitted! Score: ${res.score}/${res.maxScore} (${res.percentage}%). +20 XP awarded!`
      );

      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to submit homework');
    },
  });

  if (!isOpen || !homeworkId) return null;

  const answeredCount = Object.keys(selectedAnswers).filter(
    (k) => selectedAnswers[k] !== undefined && selectedAnswers[k] !== ''
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-teal-50/50 dark:bg-teal-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {interactive?.title || homework?.title || 'Interactive Homework'}
                </h2>
                {interactive?.levelCode && (
                  <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-[10px] font-black uppercase">
                    {interactive.levelCode}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {isAlreadySubmitted
                  ? (isAr ? 'تم تسليم هذا الواجب سابقاً • مراجعة الحلول والدرجات' : 'Homework already submitted • Reviewing results')
                  : (isAr ? 'اقرأ القطعة بتمعن وأجب عن جميع الأسئلة التفاعلية' : 'Read the passage carefully and complete all questions')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAlreadySubmitted && homework?.percentage !== null && (
              <span className={`text-xs font-black px-2.5 py-1 rounded-xl shadow-2xs ${
                (homework?.percentage ?? 0) >= 70
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-700'
              }`}>
                🎯 {homework.percentage}% ({homework.score}/{homework.maxScore} Pts)
              </span>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 font-bold animate-pulse">
            {isAr ? 'جاري تحميل تفاصيل الواجب والقطعة...' : 'Loading homework passage and questions...'}
          </div>
        ) : (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
            {/* Post-Submission Result Card */}
            {submissionResult && (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-300 dark:border-emerald-700 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <h3 className="font-black text-sm text-slate-900 dark:text-white">
                        {isAr ? 'نتيجة الاختبار التفاعלי' : 'Comprehension Result'}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {submissionResult.message}
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {submissionResult.percentage}%
                  </span>
                </div>
              </div>
            )}

            {/* Reading Comprehension Passage */}
            {interactive?.readingPassage && (
              <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2.5">
                <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-black text-xs uppercase tracking-wider">
                  <FileText className="w-4 h-4" />
                  <span>
                    {interactive.readingPassageTitle || (isAr ? 'القطعة القرائية' : 'Reading Comprehension Text')}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-serif whitespace-pre-wrap">
                  {interactive.readingPassage}
                </p>
              </div>
            )}

            {/* Questions Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  {isAr ? 'أسئلة الفهم والاستيعاب:' : 'Comprehension Questions:'} ({answeredCount}/{questions.length} {isAr ? 'مُجاب' : 'Answered'})
                </span>
                {!isAlreadySubmitted && (
                  <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400">
                    {answeredCount === questions.length ? (isAr ? '✓ جاهز للتسليم' : '✓ Ready to submit') : `${questions.length - answeredCount} ${isAr ? 'متبقي' : 'remaining'}`}
                  </span>
                )}
              </div>

              {questions.map((q, idx) => {
                const currentAnswer = selectedAnswers[q.id];
                const isSubmittedMode = isAlreadySubmitted || submissionResult !== null;
                const correctAnswer = q.correctAnswer;
                const isCorrect = isSubmittedMode && correctAnswer
                  ? String(currentAnswer).trim().toLowerCase() === String(correctAnswer).trim().toLowerCase()
                  : null;

                return (
                  <div
                    key={q.id || idx}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${
                      isSubmittedMode
                        ? isCorrect
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                        : currentAnswer !== undefined
                        ? 'bg-teal-50/30 dark:bg-teal-950/20 border-teal-300 dark:border-teal-700'
                        : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-750 shadow-xs'
                    }`}
                  >
                    {/* Prompt Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                          isSubmittedMode
                            ? isCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-600 text-white'
                            : currentAnswer !== undefined
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {idx + 1}
                        </span>
                        <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">
                          {q.prompt}
                        </p>
                      </div>

                      {/* Score / Correctness Badge */}
                      {isSubmittedMode && (
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase shrink-0 ${
                          isCorrect
                            ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300'
                        }`}>
                          {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                      )}
                    </div>

                    {/* True / False Options */}
                    {q.type === 'TRUE_FALSE' && (
                      <div className="flex items-center gap-3 pt-1">
                        {['True', 'False'].map((choice) => {
                          const isSelected = currentAnswer === choice;
                          return (
                            <button
                              type="button"
                              key={choice}
                              disabled={isSubmittedMode}
                              onClick={() => {
                                if (!isSubmittedMode) {
                                  setSelectedAnswers({ ...selectedAnswers, [q.id]: choice });
                                }
                              }}
                              className={`flex-1 sm:flex-none sm:min-w-28 py-2 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                                isSelected
                                  ? choice === 'True'
                                    ? 'bg-emerald-600 text-white shadow-xs scale-102'
                                    : 'bg-rose-600 text-white shadow-xs scale-102'
                                  : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                              } ${isSubmittedMode ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                              <span>{choice}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Multiple Choice Options */}
                    {q.type === 'MULTIPLE_CHOICE' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {(q.options || []).map((opt: string, optIdx: number) => {
                          const isSelected = currentAnswer === opt;
                          return (
                            <button
                              type="button"
                              key={optIdx}
                              disabled={isSubmittedMode}
                              onClick={() => {
                                if (!isSubmittedMode) {
                                  setSelectedAnswers({ ...selectedAnswers, [q.id]: opt });
                                }
                              }}
                              className={`p-3 rounded-xl text-xs font-semibold text-start transition-all flex items-center gap-2.5 ${
                                isSelected
                                  ? 'bg-teal-600 text-white shadow-xs font-bold'
                                  : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                              } ${isSubmittedMode ? 'cursor-default' : 'cursor-pointer active:scale-98'}`}
                            >
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                              }`}>
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="flex-1">{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Post-Submission Explanation & Correct Answer Hint */}
                    {isSubmittedMode && correctAnswer && (
                      <div className="pt-2 text-xs border-t border-slate-100 dark:border-slate-800/60 space-y-1">
                        {!isCorrect && (
                          <p className="text-slate-600 dark:text-slate-300">
                            {isAr ? 'الإجابة الصحيحة:' : 'Correct Answer:'}{' '}
                            <strong className="text-emerald-600 dark:text-emerald-400">{correctAnswer}</strong>
                          </p>
                        )}
                        {q.explanation && (
                          <p className="text-[11px] text-slate-500 italic">
                            💡 {q.explanation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sticky Actions Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>

          {!isAlreadySubmitted && (
            <button
              type="button"
              onClick={() => {
                if (answeredCount < questions.length) {
                  if (!confirm(isAr ? 'لم تجب عن جميع الأسئلة بعد. هل تريد المتابعة والتسليم الآن؟' : 'You have unanswered questions. Are you sure you want to submit?')) {
                    return;
                  }
                }
                submitMutation.mutate();
              }}
              disabled={submitMutation.isPending || answeredCount === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-lime-300" />
              <span>
                {submitMutation.isPending
                  ? (isAr ? 'جاري التصحيح والتسليم...' : 'Grading & Submitting...')
                  : (isAr ? 'تسليم الواجب والحصول على النقاط (+20 XP)' : 'Submit Homework & Earn +20 XP')}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractiveHomeworkSolverModal;
