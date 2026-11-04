import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import { Trophy, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';

interface Pair {
  hebrew: string;
  english: string;
}

interface MatchingGameProps {
  gameId: string;
  title: string;
  titleHe: string;
  pairs: Pair[];
  pointsReward: number;
  onFinish?: () => void;
}

export const MatchingGame: React.FC<MatchingGameProps> = ({
  gameId,
  title,
  titleHe,
  pairs,
  pointsReward,
  onFinish,
}) => {
  const { t, language } = useTranslation();

  const [hebrewList, setHebrewList] = useState<{ id: string; text: string }[]>([]);
  const [englishList, setEnglishList] = useState<{ id: string; text: string }[]>([]);
  const [selectedHebrew, setSelectedHebrew] = useState<string | null>(null);
  const [selectedEnglish, setSelectedEnglish] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [wrongPair, setWrongPair] = useState<{ hebrew: string; english: string } | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [awardedPoints, setAwardedPoints] = useState(0);

  // Initialize and shuffle
  useEffect(() => {
    initGame();
  }, [pairs]);

  const initGame = () => {
    const h = pairs.map((p, idx) => ({ id: `pair-${idx}`, text: p.hebrew }));
    const e = pairs.map((p, idx) => ({ id: `pair-${idx}`, text: p.english }));

    // Shuffle arrays
    setHebrewList([...h].sort(() => Math.random() - 0.5));
    setEnglishList([...e].sort(() => Math.random() - 0.5));
    setSelectedHebrew(null);
    setSelectedEnglish(null);
    setMatchedIds([]);
    setWrongPair(null);
    setIsCompleted(false);
    setAwardedPoints(0);
  };

  const handleHebrewClick = (id: string) => {
    if (matchedIds.includes(id)) return;
    setSelectedHebrew(id);

    if (selectedEnglish) {
      checkMatch(id, selectedEnglish);
    }
  };

  const handleEnglishClick = (id: string) => {
    if (matchedIds.includes(id)) return;
    setSelectedEnglish(id);

    if (selectedHebrew) {
      checkMatch(selectedHebrew, id);
    }
  };

  const checkMatch = (hId: string, eId: string) => {
    if (hId === eId) {
      // Match found!
      const nextMatched = [...matchedIds, hId];
      setMatchedIds(nextMatched);
      setSelectedHebrew(null);
      setSelectedEnglish(null);
      setWrongPair(null);

      // Check if all matched
      if (nextMatched.length === pairs.length) {
        finishGame();
      }
    } else {
      // Wrong pair
      setWrongPair({ hebrew: hId, english: eId });
      setTimeout(() => {
        setSelectedHebrew(null);
        setSelectedEnglish(null);
        setWrongPair(null);
      }, 700);
    }
  };

  const finishGame = async () => {
    setIsCompleted(true);
    try {
      const res = await api.post(`/games/${gameId}/play`, {
        score: 100,
        completed: true,
      });
      setAwardedPoints(res.data.pointsEarned);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error('Failed to submit matching game session:', err);
    }
  };

  if (isCompleted) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-md text-center max-w-lg mx-auto transition-colors">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{t('games.congrats')}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          You correctly matched all {pairs.length} Hebrew vocabulary pairs!
        </p>

        <div className="block mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full font-bold border border-emerald-200 dark:border-emerald-800">
            <Sparkles className="w-4 h-4" />
            {t('games.earnedPoints', { points: awardedPoints || pointsReward })}
          </span>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={initGame}
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
    <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-lg">
            {language === 'he' ? titleHe : title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click a Hebrew word on the left, then click its English match on the right.
          </p>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 bg-brand-olive-50 dark:bg-brand-olive-950/60 text-brand-olive-700 dark:text-brand-olive-300 rounded-full border border-brand-olive-200 dark:border-brand-olive-800">
          Matched: {matchedIds.length} / {pairs.length}
        </span>
      </div>

      {/* Progress */}
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-brand-olive-500 transition-all duration-300"
          style={{ width: `${(matchedIds.length / pairs.length) * 100}%` }}
        />
      </div>

      {/* Grid: Hebrew column vs English column */}
      <div className="grid grid-cols-2 gap-4">
        {/* Hebrew Words */}
        <div className="space-y-3">
          <span className="text-[11px] font-bold text-brand-teal-700 dark:text-brand-teal-400 uppercase tracking-wider block text-center">
            Hebrew
          </span>
          {hebrewList.map((item) => {
            const isMatched = matchedIds.includes(item.id);
            const isSelected = selectedHebrew === item.id;
            const isWrong = wrongPair?.hebrew === item.id;

            let cardStyle =
              'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-brand-teal-400 dark:hover:border-brand-teal-500 hover:bg-brand-teal-50/30 dark:hover:bg-brand-teal-950/30 text-slate-800 dark:text-slate-100';

            if (isMatched) {
              cardStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 opacity-60 cursor-default';
            } else if (isWrong) {
              cardStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 animate-pulse';
            } else if (isSelected) {
              cardStyle = 'border-brand-teal-700 dark:border-brand-teal-400 bg-brand-teal-100/50 dark:bg-brand-teal-950/80 text-brand-teal-950 dark:text-brand-teal-100 ring-2 ring-brand-teal-500 font-bold';
            }

            return (
              <button
                key={item.id}
                onClick={() => handleHebrewClick(item.id)}
                disabled={isMatched}
                className={`w-full py-3 px-4 rounded-xl border text-center transition-all font-hebrew text-base font-bold shadow-2xs ${cardStyle}`}
              >
                {item.text}
              </button>
            );
          })}
        </div>

        {/* English Translations */}
        <div className="space-y-3">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block text-center">
            English
          </span>
          {englishList.map((item) => {
            const isMatched = matchedIds.includes(item.id);
            const isSelected = selectedEnglish === item.id;
            const isWrong = wrongPair?.english === item.id;

            let cardStyle =
              'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-brand-teal-400 dark:hover:border-brand-teal-500 hover:bg-brand-teal-50/30 dark:hover:bg-brand-teal-950/30 text-slate-800 dark:text-slate-100';

            if (isMatched) {
              cardStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 opacity-60 cursor-default';
            } else if (isWrong) {
              cardStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 animate-pulse';
            } else if (isSelected) {
              cardStyle = 'border-brand-teal-700 dark:border-brand-teal-400 bg-brand-teal-100/50 dark:bg-brand-teal-950/80 text-brand-teal-950 dark:text-brand-teal-100 ring-2 ring-brand-teal-500 font-bold';
            }

            return (
              <button
                key={item.id}
                onClick={() => handleEnglishClick(item.id)}
                disabled={isMatched}
                className={`w-full py-3 px-4 rounded-xl border text-center transition-all text-sm font-semibold shadow-2xs ${cardStyle}`}
              >
                {item.text}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

