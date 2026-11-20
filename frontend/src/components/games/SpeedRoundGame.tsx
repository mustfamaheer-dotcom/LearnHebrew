import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { haptics } from '../../utils/haptics';
import { triggerConfetti } from '../../utils/confetti';
import { api } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import {
  Trophy,
  Sparkles,
  Timer,
  Zap,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
} from 'lucide-react';

interface SpeedRoundItem {
  prompt: string;
  options: string[];
  answer: string;
  verb?: string;
  pronoun?: string;
}

interface SpeedRoundGameProps {
  gameId: string;
  title: string;
  titleHe: string;
  rounds: SpeedRoundItem[];
  pointsReward: number;
  onFinish?: () => void;
  durationSeconds?: number;
}

export const SpeedRoundGame: React.FC<SpeedRoundGameProps> = ({
  gameId,
  title,
  titleHe,
  rounds = [],
  pointsReward,
  onFinish,
  durationSeconds = 45,
}) => {
  const { t, language } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [awardedPoints, setAwardedPoints] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<'correct' | 'wrong' | null>(null);

  const safeRounds = Array.isArray(rounds) && rounds.length > 0 ? rounds : [];
  const currentRound = safeRounds[currentIndex % Math.max(1, safeRounds.length)] || {
    prompt: '',
    options: [],
    answer: '',
  };

  // Timer countdown
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && timeLeft > 0 && !isCompleted) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            finishGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, isCompleted]);

  const handleStart = () => {
    haptics.tap();
    setIsPlaying(true);
    setTimeLeft(durationSeconds);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setIsCompleted(false);
    setAwardedPoints(0);
    setLastFeedback(null);
  };

  const handleAnswer = (chosen: string) => {
    if (!isPlaying || isCompleted) return;

    const isCorrect = chosen.trim().toLowerCase() === (currentRound.answer || '').trim().toLowerCase();

    if (isCorrect) {
      haptics.success();
      const nextStreak = streak + 1;
      const multiplier = nextStreak >= 5 ? 3 : nextStreak >= 3 ? 2 : 1;
      setScore((prev) => prev + 10 * multiplier);
      setStreak(nextStreak);
      setMaxStreak((prev) => Math.max(prev, nextStreak));
      setLastFeedback('correct');
    } else {
      haptics.error();
      setStreak(0);
      setLastFeedback('wrong');
    }

    // Advance to next round or loop back through questions if time remains
    if (currentIndex + 1 >= safeRounds.length && timeLeft > 0) {
      // Loop with bonus
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const finishGame = async () => {
    setIsPlaying(false);
    setIsCompleted(true);

    const calculatedAccuracy = safeRounds.length > 0 ? Math.min(100, Math.round((score / (safeRounds.length * 10)) * 100)) : 100;

    try {
      const res = await api.post(`/games/${gameId}/play`, {
        score: calculatedAccuracy,
        completed: true,
      });
      setAwardedPoints(res.data?.pointsEarned || pointsReward);
      if (score >= 50) {
        triggerConfetti.fireworks();
      } else {
        triggerConfetti.celebrate();
      }
    } catch (err) {
      console.error('Failed to submit speed round session:', err);
    }
  };

  // Ready Screen before start
  if (!isPlaying && !isCompleted) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto ring-8 ring-amber-500/5">
          <Zap className="w-10 h-10 animate-pulse" />
        </div>

        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            {language === 'he' ? 'ספרינט מהיר נגד השעון!' : 'Rapid Speed Sprint!'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            You have <strong className="text-amber-600 dark:text-amber-400">{durationSeconds} seconds</strong> to answer as many rapid-fire Hebrew questions as possible. Build combos for 2x &amp; 3x score multipliers!
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 flex items-center justify-around text-xs font-bold text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <Timer className="w-4 h-4 text-brand-teal-600" />
            <span>{durationSeconds} Seconds</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Combo Multipliers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>+{pointsReward} XP</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleStart}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-base shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Play className="w-5 h-5 fill-slate-950" />
          <span>Start Sprint</span>
        </button>
      </div>
    );
  }

  // Result Screen after timer expires
  if (isCompleted) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-md text-center max-w-lg mx-auto transition-colors space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <Trophy className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            Time&apos;s Up! Great Sprint!
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            You completed {currentIndex} questions with a max streak of {maxStreak} in a row.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Points</span>
            <span className="text-3xl font-black text-slate-900 dark:text-white mt-1 block">{score}</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Max Streak</span>
            <span className="text-3xl font-black text-amber-500 mt-1 block">🔥 {maxStreak}</span>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full font-bold border border-emerald-200 dark:border-emerald-800">
          <Sparkles className="w-4 h-4" />
          <span>+{awardedPoints || pointsReward} XP Earned</span>
        </div>

        <div className="flex gap-3 justify-center pt-2">
          <button
            type="button"
            onClick={handleStart}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition-colors shadow-xs"
          >
            Sprint Again
          </button>
          {onFinish && (
            <button
              type="button"
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

  // Active Sprint Game View
  const progressPercent = (timeLeft / durationSeconds) * 100;
  const multiplier = streak >= 5 ? 3 : streak >= 3 ? 2 : 1;

  return (
    <div className="max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
      {/* Top Header: Timer Bar & Score */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <Timer className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
            <span className="font-mono text-sm">{timeLeft}s remaining</span>
          </div>
          <div className="flex items-center gap-2">
            {streak > 1 && (
              <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-black animate-bounce">
                {multiplier}x Combo (🔥{streak})
              </span>
            )}
            <span className="text-slate-900 dark:text-white font-extrabold text-sm">
              Score: {score}
            </span>
          </div>
        </div>

        {/* Animated Countdown Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              timeLeft <= 10 ? 'bg-rose-500 animate-pulse' : timeLeft <= 20 ? 'bg-amber-500' : 'bg-brand-teal-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Prompt */}
      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 text-center min-h-[110px] flex flex-col justify-center">
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">
          Question #{currentIndex + 1}
        </span>
        <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed font-hebrew" dir="rtl">
          {currentRound.prompt}
        </h4>
      </div>

      {/* Answer Options Grid */}
      <div className="grid grid-cols-2 gap-3">
        {(currentRound.options || []).map((option, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleAnswer(option)}
            className="p-4 rounded-2xl bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700 hover:border-amber-400 text-slate-900 dark:text-white font-bold text-base transition-all hover:scale-105 active:scale-95 text-center shadow-xs cursor-pointer font-hebrew"
            dir="rtl"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};
