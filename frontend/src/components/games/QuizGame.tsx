import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { haptics } from '../../utils/haptics';
import { triggerConfetti } from '../../utils/confetti';
import { api } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import { Check, X, Trophy, Sparkles, AlertCircle } from 'lucide-react';

interface Question {
  question: string;
  questionHe: string;
  options: string[];
  correctIndex: number;
}

interface QuizGameProps {
  gameId: string;
  title: string;
  titleHe: string;
  questions: Question[];
  pointsReward: number;
  onFinish?: () => void;
}

export const QuizGame: React.FC<QuizGameProps> = ({
  gameId,
  title,
  titleHe,
  questions,
  pointsReward,
  onFinish,
}) => {
  const { t, language } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [awardedPoints, setAwardedPoints] = useState(0);

  const currentQ = questions[currentIndex];

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === currentQ.correctIndex;
    if (isCorrect) {
      haptics.success();
      setCorrectAnswers((prev) => prev + 1);
    } else {
      haptics.error();
    }
  };

  const handleNextQuestion = () => {
    haptics.tap();
    setSelectedOption(null);
    setIsAnswered(false);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setIsCompleted(true);
    const score = Math.round((correctAnswers / questions.length) * 100);

    try {
      const res = await api.post(`/games/${gameId}/play`, {
        score,
        completed: true,
      });
      setAwardedPoints(res.data.pointsEarned);
      if (score === 100) {
        triggerConfetti.fireworks();
      } else {
        triggerConfetti.celebrate();
      }
    } catch (err) {
      console.error('Failed to submit quiz session:', err);
    }
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setCorrectAnswers(0);
    setIsCompleted(false);
    setAwardedPoints(0);
  };

  if (isCompleted) {
    const finalScore = Math.round((correctAnswers / questions.length) * 100);
    const isPerfect = finalScore === 100;

    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-md text-center max-w-lg mx-auto transition-colors">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{t('games.congrats')}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          You got {correctAnswers} out of {questions.length} questions right.
        </p>

        <div className="text-4xl font-extrabold text-brand-teal-700 dark:text-brand-teal-400 mb-4">{finalScore}%</div>

        {isPerfect && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-full mb-4 border border-amber-200 dark:border-amber-800/80">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Perfect Score Bonus (+25 pts)</span>
          </div>
        )}

        <div className="block mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full font-bold border border-emerald-200 dark:border-emerald-800">
            <Sparkles className="w-4 h-4" />
            {t('games.earnedPoints', { points: awardedPoints || pointsReward })}
          </span>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={restartQuiz}
            className="px-5 py-2.5 bg-brand-teal-800 hover:bg-brand-teal-900 dark:bg-brand-teal-700 dark:hover:bg-brand-teal-600 text-white font-medium rounded-xl transition-colors shadow-xs"
          >
            {t('games.playAgain')}
          </button>
          {onFinish && (
            <button
              onClick={onFinish}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl transition-colors"
            >
              Back to Games
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 transition-colors">
      {/* Quiz Progress Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-brand-teal-700 dark:text-brand-teal-400 uppercase tracking-wider">
          {t('games.question', { current: currentIndex + 1, total: questions.length })}
        </span>
        <span className="text-xs font-semibold px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">
          Score: {correctAnswers}/{currentIndex + (isAnswered ? 1 : 0)}
        </span>
      </div>

      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-brand-teal-600 dark:bg-brand-teal-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
        {language === 'he' ? currentQ.questionHe : currentQ.question}
      </h3>

      {/* Options List */}
      <div className="space-y-3 mb-6">
        {currentQ.options.map((option, idx) => {
          let stateStyle = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-brand-teal-400 dark:hover:border-brand-teal-500 hover:bg-brand-teal-50/30 dark:hover:bg-brand-teal-950/30 text-slate-900 dark:text-white';

          if (isAnswered) {
            if (idx === currentQ.correctIndex) {
              stateStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-semibold';
            } else if (idx === selectedOption) {
              stateStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100 line-through';
            } else {
              stateStyle = 'border-slate-200 dark:border-slate-800 opacity-50 text-slate-400 dark:text-slate-600';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelectOption(idx)}
              disabled={isAnswered}
              className={`w-full flex items-center justify-between p-4 rounded-xl border text-start transition-all text-sm font-medium ${stateStyle}`}
            >
              <span className="font-hebrew text-base">{option}</span>
              {isAnswered && idx === currentQ.correctIndex && (
                <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
              {isAnswered && idx === selectedOption && idx !== currentQ.correctIndex && (
                <X className="w-5 h-5 text-rose-600 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Next Button */}
      {isAnswered && (
        <button
          onClick={handleNextQuestion}
          className="w-full py-3 bg-brand-teal-800 hover:bg-brand-teal-900 dark:bg-brand-teal-700 dark:hover:bg-brand-teal-600 text-white font-semibold rounded-xl transition-colors shadow-xs"
        >
          {currentIndex + 1 < questions.length ? 'Next Question' : 'Finish Quiz'}
        </button>
      )}
    </div>
  );
};

