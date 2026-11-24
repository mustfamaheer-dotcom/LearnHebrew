import React from 'react';
import { Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

interface GamePointsBadgeProps {
  awardedPoints: number | null;
  score: number;
  language?: string;
  isPerfect?: boolean;
}

export const GamePointsBadge: React.FC<GamePointsBadgeProps> = ({
  awardedPoints,
  score,
  language = 'he',
  isPerfect,
}) => {
  const isPassing = score >= 50;

  if (awardedPoints !== null && awardedPoints > 0) {
    return (
      <div className="space-y-2 mb-6">
        {isPerfect && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-full border border-amber-200 dark:border-amber-800/80">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>
              {language === 'he'
                ? 'בונוס ציון מושלם 100% (+25 נקודות!)'
                : language === 'ar'
                ? 'مكافأة النتيجة الكاملة 100% (+25 نقطة!)'
                : 'Perfect Score Bonus (+25 pts)'}
            </span>
          </div>
        )}
        <div className="block">
          <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full font-bold border border-emerald-200 dark:border-emerald-800 text-sm shadow-sm">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {language === 'he'
              ? `נוספו +${awardedPoints} נקודות לחשבונך!`
              : language === 'ar'
              ? `تمت إضافة +${awardedPoints} نقطة إلى رصيدك!`
              : `+${awardedPoints} Points Earned!`}
          </span>
        </div>
      </div>
    );
  }

  if (!isPassing) {
    return (
      <div className="block mb-6">
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 rounded-full text-xs font-bold border border-amber-200 dark:border-amber-800/70">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          {language === 'he'
            ? 'ציון מתחת ל-50% - לא נצברו נקודות. נסו שוב כדי לעבור!'
            : language === 'ar'
            ? 'الدرجة أقل من 50% - لم يتم احتساب نقاط. حاول مرة أخرى للنجاح!'
            : 'Score below 50% - No points earned. Try again to pass!'}
        </span>
      </div>
    );
  }

  // Already maxed / Replay round
  return (
    <div className="block mb-6">
      <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-semibold border border-slate-200 dark:border-slate-700">
        <CheckCircle2 className="w-4 h-4 text-brand-teal-600" />
        {language === 'he'
          ? 'אימון חוזר: השיא הקודם כבר נשמר (0 נקודות חדשות בסבב חוזר)'
          : language === 'ar'
          ? 'جولة تدريب: أعلى نقاط تم احتسابها مسبقاً (0 نقاط جديدة عند الإعادة)'
          : 'Practice Round: High score already recorded (0 new points on replay)'}
      </span>
    </div>
  );
};
