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
  HelpCircle,
  ArrowRight,
  Volume2,
} from 'lucide-react';
import { GamePointsBadge } from './GamePointsBadge';

interface SentenceItem {
  words: string[];
  correct: string;
  translation?: string;
}

interface SentenceBuilderGameProps {
  gameId: string;
  title: string;
  titleHe: string;
  sentences: SentenceItem[];
  pointsReward: number;
  onFinish?: () => void;
}

export const SentenceBuilderGame: React.FC<SentenceBuilderGameProps> = ({
  gameId,
  title,
  titleHe,
  sentences = [],
  pointsReward,
  onFinish,
}) => {
  const { t, language } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [validationState, setValidationState] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [correctCount, setCorrectCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [awardedPoints, setAwardedPoints] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const safeSentences = Array.isArray(sentences) && sentences.length > 0 ? sentences : [];
  const currentSentence = safeSentences[currentIndex] || { words: [], correct: '' };

  useEffect(() => {
    initSentence(currentIndex);
  }, [currentIndex, sentences]);

  const initSentence = (index: number) => {
    const s = safeSentences[index];
    if (!s) return;

    // Words to scramble: if s.words is given, shuffle them; else split s.correct
    const rawWords = Array.isArray(s.words) && s.words.length > 0
      ? [...s.words]
      : (s.correct || '').split(' ').filter(Boolean);

    // Deterministic shuffle
    const shuffled = [...rawWords].sort(() => Math.random() - 0.5);
    setAvailableWords(shuffled);
    setSelectedWords([]);
    setValidationState('idle');
    setShowHint(false);
  };

  const handleSelectWord = (word: string, indexInAvailable: number) => {
    if (validationState === 'correct') return;
    haptics.tap();
    const updatedAvailable = [...availableWords];
    updatedAvailable.splice(indexInAvailable, 1);
    setAvailableWords(updatedAvailable);
    setSelectedWords([...selectedWords, word]);
    setValidationState('idle');
  };

  const handleRemoveWord = (word: string, indexInSelected: number) => {
    if (validationState === 'correct') return;
    haptics.tap();
    const updatedSelected = [...selectedWords];
    updatedSelected.splice(indexInSelected, 1);
    setSelectedWords(updatedSelected);
    setAvailableWords([...availableWords, word]);
    setValidationState('idle');
  };

  const handleCheckSentence = () => {
    const constructed = selectedWords.join(' ').trim();
    const target = (currentSentence.correct || '').trim();

    // Clean whitespace & punctuation for fair matching
    const cleanConst = constructed.replace(/[\.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
    const cleanTarget = target.replace(/[\.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');

    if (cleanConst === cleanTarget || constructed === target) {
      haptics.success();
      setValidationState('correct');
      setCorrectCount((prev) => prev + 1);

      // Play audio if speech synthesis available
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
    if (currentIndex + 1 < safeSentences.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishGame();
    }
  };

  const finishGame = async () => {
    setIsCompleted(true);
    const total = Math.max(1, safeSentences.length);
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
    initSentence(0);
  };

  if (isCompleted) {
    const finalScore = Math.round((correctCount / Math.max(1, safeSentences.length)) * 100);
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-md text-center max-w-lg mx-auto transition-colors">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
          {language === 'he' ? 'כל הכבוד! סיימת את המשחק' : 'Sentence Builder Complete!'}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {language === 'he'
            ? `הרכבת בהצלחה ${correctCount} מתוך ${safeSentences.length} משפטים!`
            : `You accurately assembled ${correctCount} of ${safeSentences.length} Hebrew sentences.`}
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

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
      {/* Header & Progress */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-brand-teal-700 dark:text-brand-teal-400 uppercase tracking-wider">
          Sentence {currentIndex + 1} of {safeSentences.length}
        </span>
        <button
          type="button"
          onClick={() => setShowHint(!showHint)}
          className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showHint ? 'Hide Clue' : 'Hint'}</span>
        </button>
      </div>

      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-teal-600 dark:bg-brand-teal-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / safeSentences.length) * 100}%` }}
        />
      </div>

      {/* Target Translation Clue */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 text-center space-y-1">
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
          Target Meaning (English):
        </span>
        <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
          &ldquo;{currentSentence.translation || 'Assemble the correct Hebrew sentence below.'}&rdquo;
        </p>
      </div>

      {/* Constructed Sentence Drop Area */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block text-start">
          Your Sentence (Tap word to remove):
        </span>
        <div
          dir="rtl"
          className={`min-h-[72px] p-4 rounded-2xl border-2 border-dashed transition-all flex flex-wrap items-center gap-2 justify-start ${
            validationState === 'correct'
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
              : validationState === 'incorrect'
              ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
              : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
          }`}
        >
          {selectedWords.length === 0 ? (
            <span className="text-xs text-slate-400 dark:text-slate-500 italic mx-auto">
              Tap words below to build your sentence...
            </span>
          ) : (
            selectedWords.map((word, idx) => (
              <button
                key={`${word}-${idx}`}
                type="button"
                onClick={() => handleRemoveWord(word, idx)}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-teal-300 dark:border-teal-700 shadow-xs text-slate-900 dark:text-white font-bold text-base hover:bg-rose-50 hover:border-rose-300 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                {word}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Validation Message */}
      {validationState === 'correct' && (
        <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Excellent! Correct sentence order!</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(currentSentence.correct);
                utterance.lang = 'he-IL';
                window.speechSynthesis.speak(utterance);
              }
            }}
            className="p-1 text-emerald-700 hover:text-emerald-900"
            title="Listen to pronunciation"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {validationState === 'incorrect' && (
        <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Not quite right. Try re-ordering or tapping words back to adjust.</span>
        </div>
      )}

      {/* Available Word Chips Pool */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block text-start">
          Available Words:
        </span>
        <div
          dir="rtl"
          className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center gap-2.5 justify-center min-h-[64px]"
        >
          {availableWords.map((word, idx) => (
            <button
              key={`${word}-${idx}`}
              type="button"
              onClick={() => handleSelectWord(word, idx)}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-750 text-slate-800 dark:text-slate-100 font-bold text-base border border-slate-200/90 dark:border-slate-700 hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-950/40 shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              {word}
            </button>
          ))}
          {availableWords.length === 0 && selectedWords.length > 0 && (
            <span className="text-xs text-slate-400 dark:text-slate-500 italic">
              All words placed! Click Check Sentence below.
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => initSentence(currentIndex)}
          className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          title="Reset Sentence"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {validationState !== 'correct' ? (
          <button
            type="button"
            onClick={handleCheckSentence}
            disabled={selectedWords.length === 0}
            className="flex-1 py-3 bg-brand-teal-800 hover:bg-brand-teal-900 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-sm rounded-xl shadow-xs transition-colors"
          >
            Check Sentence
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors animate-pulse"
          >
            <span>{currentIndex + 1 < safeSentences.length ? 'Next Sentence' : 'Complete Challenge'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
