import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import { Sparkles, RotateCw, CheckCircle2, Trophy, Volume2 } from 'lucide-react';

interface FlashcardGameProps {
  gameId: string;
  title: string;
  titleHe: string;
  cards: Array<{ front: string; back: string; example?: string }>;
  pointsReward: number;
  onFinish?: () => void;
}

export const FlashcardGame: React.FC<FlashcardGameProps> = ({
  gameId,
  title,
  titleHe,
  cards,
  pointsReward,
  onFinish,
}) => {
  const { t, language } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [awardedPoints, setAwardedPoints] = useState(0);

  const currentCard = cards[currentIndex];

  const playHebrewAudio = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'he-IL';
      utterance.rate = 0.85; // slightly slower for language learners
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleNext = (known: boolean) => {
    const nextKnown = known ? knownCount + 1 : knownCount;
    setKnownCount(nextKnown);
    setIsFlipped(false);

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishGame(nextKnown);
    }
  };

  const finishGame = async (finalKnown: number) => {
    setIsCompleted(true);
    const score = Math.round((finalKnown / cards.length) * 100);

    try {
      const res = await api.post(`/games/${gameId}/play`, {
        score,
        completed: true,
      });
      setAwardedPoints(res.data.pointsEarned);
      confetti({
        particleCount: 110,
        spread: 75,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error('Failed to record game session:', err);
    }
  };

  const restartGame = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCount(0);
    setIsCompleted(false);
    setAwardedPoints(0);
  };

  if (isCompleted) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-md text-center max-w-lg mx-auto transition-colors">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('games.congrats')}</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          {t('games.yourScore', { score: Math.round((knownCount / cards.length) * 100) })}
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full font-bold mb-6 border border-emerald-200 dark:border-emerald-800">
          <Sparkles className="w-4 h-4" />
          {t('games.earnedPoints', { points: awardedPoints || pointsReward })}
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={restartGame}
            className="px-5 py-2.5 bg-brand-teal-800 hover:bg-brand-teal-900 dark:bg-brand-teal-700 dark:hover:bg-brand-teal-600 text-white font-bold rounded-xl transition-colors shadow-xs"
          >
            {t('games.playAgain')}
          </button>
          {onFinish && (
            <button
              onClick={onFinish}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors"
            >
              Back to Games
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Header & Progress */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-lg">
            {language === 'he' ? titleHe : title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Card {currentIndex + 1} of {cards.length}
          </p>
        </div>
        <div className="text-xs font-bold px-2.5 py-1 bg-brand-olive-50 dark:bg-brand-olive-950/60 text-brand-olive-700 dark:text-brand-olive-300 rounded-full border border-brand-olive-200 dark:border-brand-olive-800">
          +{pointsReward} pts
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-brand-teal-600 dark:bg-brand-teal-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      {/* 3D Flashcard container */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full h-80 cursor-pointer perspective-1000 mb-6 group"
      >
        <div
          className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Front (Hebrew with audio button) */}
          <div className="absolute inset-0 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 group-hover:border-brand-teal-400 dark:group-hover:border-brand-teal-400 rounded-3xl shadow-sm p-6 flex flex-col justify-between items-center backface-hidden transition-colors">
            <div className="w-full flex items-center justify-between">
              <span className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">
                Hebrew (עברית)
              </span>
              <button
                onClick={(e) => playHebrewAudio(e, currentCard.front)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-teal-100 dark:hover:bg-brand-teal-950/70 text-brand-teal-800 dark:text-brand-teal-300 transition-colors"
                title="Listen to pronunciation"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center my-auto">
              <span className="text-6xl sm:text-7xl font-black text-brand-teal-950 dark:text-brand-teal-100 font-hebrew block mb-3 drop-shadow-2xs">
                {currentCard.front}
              </span>
              {currentCard.example && (
                <p className="text-sm text-slate-600 dark:text-slate-300 font-hebrew bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-3 py-1.5 rounded-xl inline-block">
                  {currentCard.example}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-semibold">
              <RotateCw className="w-3.5 h-3.5" />
              <span>{t('games.flipCard')}</span>
            </div>
          </div>

          {/* Back (English meaning) */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-teal-900 to-brand-teal-950 text-white rounded-3xl shadow-md p-6 flex flex-col justify-between items-center backface-hidden rotate-y-180">
            <span className="text-[11px] text-brand-teal-200 uppercase tracking-widest font-bold">
              English Translation
            </span>

            <div className="text-center my-auto">
              <h4 className="text-3xl font-extrabold mb-3 text-white">{currentCard.back}</h4>
              {currentCard.example && (
                <p className="text-sm text-brand-olive-300 font-medium italic">
                  {currentCard.example}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-brand-teal-300 font-medium">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Click to flip back</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleNext(false)}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors shadow-2xs"
        >
          {t('games.reviewAgain')}
        </button>
        <button
          onClick={() => handleNext(true)}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-olive-600 hover:bg-brand-olive-700 text-white font-bold text-xs transition-colors shadow-xs"
        >
          <CheckCircle2 className="w-4 h-4" />
          {t('games.knowIt')}
        </button>
      </div>
    </div>
  );
};
