import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { haptics } from '../../utils/haptics';
import { triggerConfetti } from '../../utils/confetti';
import { api } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import {
  Trophy,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Volume2,
  Delete,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { GamePointsBadge } from './GamePointsBadge';

interface WordScrambleItem {
  word: string;
  scrambled?: string;
  clue?: string;
  phonetic?: string;
}

interface WordScrambleGameProps {
  gameId: string;
  title: string;
  titleHe: string;
  words: WordScrambleItem[];
  pointsReward: number;
  onFinish?: () => void;
}

export const WordScrambleGame: React.FC<WordScrambleGameProps> = ({
  gameId,
  title,
  titleHe,
  words = [],
  pointsReward,
  onFinish,
}) => {
  const { t, language } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [letterPool, setLetterPool] = useState<string[]>([]);
  const [placedLetters, setPlacedLetters] = useState<string[]>([]);
  const [validationState, setValidationState] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [correctCount, setCorrectCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [awardedPoints, setAwardedPoints] = useState(0);
  const [showClue, setShowClue] = useState(false);

  const safeWords = Array.isArray(words) && words.length > 0 ? words : [];
  const currentItem = safeWords[currentIndex] || { word: '' };

  useEffect(() => {
    initWord(currentIndex);
  }, [currentIndex, words]);

  const initWord = (index: number) => {
    const item = safeWords[index];
    if (!item) return;

    let chars: string[] = [];
    if (item.scrambled && item.scrambled.length === item.word.length) {
      chars = item.scrambled.split('');
    } else {
      // Split Hebrew word into characters and shuffle
      chars = item.word.split('').sort(() => Math.random() - 0.5);
    }

    setLetterPool(chars);
    setPlacedLetters([]);
    setValidationState('idle');
    setShowClue(false);
  };

  const handleSelectLetter = (letter: string, indexInPool: number) => {
    if (validationState === 'correct') return;
    haptics.tap();
    const updatedPool = [...letterPool];
    updatedPool.splice(indexInPool, 1);
    setLetterPool(updatedPool);
    setPlacedLetters([...placedLetters, letter]);
    setValidationState('idle');
  };

  const handleRemoveLetter = (letter: string, indexInPlaced: number) => {
    if (validationState === 'correct') return;
    haptics.tap();
    const updatedPlaced = [...placedLetters];
    updatedPlaced.splice(indexInPlaced, 1);
    setPlacedLetters(updatedPlaced);
    setLetterPool([...letterPool, letter]);
    setValidationState('idle');
  };

  const handleCheckWord = () => {
    const constructed = placedLetters.join('').trim();
    const target = (currentItem.word || '').trim();

    if (constructed === target) {
      haptics.success();
      setValidationState('correct');
      setCorrectCount((prev) => prev + 1);

      if ('speechSynthesis' in window) {
        try {
          const utterance = new SpeechSynthesisUtterance(target);
          utterance.lang = 'he-IL';
          window.speechSynthesis.speak(utterance);
        } catch (_) {}
      }
    } else {
      haptics.error();
      setValidationState('incorrect');
    }
  };

  const handleNext = () => {
    haptics.tap();
    if (currentIndex + 1 < safeWords.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishGame();
    }
  };

  const finishGame = async () => {
    setIsCompleted(true);
    const total = Math.max(1, safeWords.length);
    const score = Math.round((correctCount / total) * 100);

    try {
      const res = await api.post(`/games/${gameId}/play`, {
        score,
        completed: true,
      });
      const earned = typeof res.data?.pointsEarned === 'number' ? res.data.pointsEarned : 0;
      setAwardedPoints(earned);
      if (earned > 0 || score >= 80) {
        if (score === 100) {
          triggerConfetti.fireworks();
        } else {
          triggerConfetti.celebrate();
        }
      }
    } catch (err) {
      console.error('Failed to submit game session:', err);
      setAwardedPoints(0);
    }
  };

  const restartGame = () => {
    setCurrentIndex(0);
    setCorrectCount(0);
    setIsCompleted(false);
    setAwardedPoints(0);
    initWord(0);
  };

  if (isCompleted) {
    const finalScore = Math.round((correctCount / Math.max(1, safeWords.length)) * 100);
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-md text-center max-w-lg mx-auto transition-colors">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
          {language === 'he' ? 'כל הכבוד! סיימת את האותיות' : 'Word Scramble Complete!'}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {language === 'he'
            ? `אייתת נכון ${correctCount} מתוך ${safeWords.length} מילים בעברית!`
            : `You correctly spelled ${correctCount} of ${safeWords.length} Hebrew words.`}
        </p>

        <div className="text-4xl font-extrabold text-brand-teal-700 dark:text-brand-teal-400 mb-4">
          {finalScore}%
        </div>

        <GamePointsBadge
          awardedPoints={awardedPoints}
          score={finalScore}
          language={language}
          isPerfect={finalScore === 100}
        />

        <div className="flex gap-3 justify-center">
          <button
            onClick={restartGame}
            className="px-5 py-2.5 bg-brand-teal-800 hover:bg-brand-teal-900 dark:bg-brand-teal-700 dark:hover:bg-brand-teal-600 text-white font-medium rounded-xl transition-colors shadow-xs"
          >
            {language === 'he' ? 'שחק שוב' : 'Play Again'}
          </button>
          {onFinish && (
            <button
              onClick={onFinish}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl transition-colors"
            >
              {language === 'he' ? 'חזור למשחקים' : 'Back to Games'}
            </button>
          )}
        </div>
      </div>
    );
  }

  const targetLength = (currentItem.word || '').length;

  return (
    <div className="max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
      {/* Header & Progress */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-brand-teal-700 dark:text-brand-teal-400 uppercase tracking-wider">
          Word {currentIndex + 1} of {safeWords.length}
        </span>
        <button
          type="button"
          onClick={() => setShowClue(!showClue)}
          className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showClue ? 'Hide Clue' : 'Clue'}</span>
        </button>
      </div>

      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-teal-600 dark:bg-brand-teal-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / safeWords.length) * 100}%` }}
        />
      </div>

      {/* Meaning / Clue Banner */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 text-center space-y-1">
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
          Meaning / Clue:
        </span>
        <p className="text-base font-bold text-slate-800 dark:text-slate-100">
          {currentItem.clue || 'Unscramble the Hebrew letters to spell the word.'}
        </p>
        {currentItem.phonetic && showClue && (
          <span className="text-xs text-brand-teal-600 dark:text-brand-teal-400 font-mono block">
            Phonetics: /{currentItem.phonetic}/
          </span>
        )}
      </div>

      {/* Target Word Slots Area */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block text-start">
          Spell the Hebrew Word:
        </span>
        <div
          dir="rtl"
          className={`min-h-[80px] p-4 rounded-2xl border-2 border-dashed transition-all flex items-center justify-center gap-2.5 ${
            validationState === 'correct'
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
              : validationState === 'incorrect'
              ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
              : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
          }`}
        >
          {Array.from({ length: targetLength }).map((_, idx) => {
            const letter = placedLetters[idx];
            return (
              <button
                key={idx}
                type="button"
                onClick={() => letter && handleRemoveLetter(letter, idx)}
                disabled={!letter || validationState === 'correct'}
                className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-black transition-all ${
                  letter
                    ? 'bg-white dark:bg-slate-800 border-teal-500 dark:border-teal-400 text-slate-900 dark:text-white shadow-xs hover:border-rose-400 cursor-pointer'
                    : 'border-slate-300 dark:border-slate-700 bg-white/40 dark:bg-slate-850/40 text-slate-300 dark:text-slate-600'
                }`}
              >
                {letter || ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* Validation Message */}
      {validationState === 'correct' && (
        <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Correct spelling! שָׁלוֹם וּבְרָכָה!</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(currentItem.word);
                utterance.lang = 'he-IL';
                window.speechSynthesis.speak(utterance);
              }
            }}
            className="p-1 text-emerald-700 hover:text-emerald-900"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {validationState === 'incorrect' && (
        <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Incorrect arrangement. Tap letters to remove and try again.</span>
        </div>
      )}

      {/* Scrambled Letters Pool */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block text-start">
          Available Letters:
        </span>
        <div
          dir="rtl"
          className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center gap-2.5 min-h-[64px]"
        >
          {letterPool.map((letter, idx) => (
            <button
              key={`${letter}-${idx}`}
              type="button"
              onClick={() => handleSelectLetter(letter, idx)}
              className="w-11 h-12 rounded-xl bg-white dark:bg-slate-750 text-slate-800 dark:text-white font-extrabold text-xl border border-slate-200 dark:border-slate-700 hover:border-teal-500 hover:bg-teal-50/50 shadow-xs hover:scale-110 active:scale-95 transition-all cursor-pointer"
            >
              {letter}
            </button>
          ))}
          {letterPool.length === 0 && placedLetters.length > 0 && (
            <span className="text-xs text-slate-400 dark:text-slate-500 italic">
              All letters placed! Click Check Word.
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => initWord(currentIndex)}
          className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          title="Reset Letters"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {validationState !== 'correct' ? (
          <button
            type="button"
            onClick={handleCheckWord}
            disabled={placedLetters.length !== targetLength}
            className="flex-1 py-3 bg-brand-teal-800 hover:bg-brand-teal-900 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-sm rounded-xl shadow-xs transition-colors"
          >
            Check Word
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors animate-pulse"
          >
            <span>{currentIndex + 1 < safeWords.length ? 'Next Word' : 'Complete Challenge'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
