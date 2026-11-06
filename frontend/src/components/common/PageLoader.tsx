import React from 'react';

export const PageLoader: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4 animate-in fade-in duration-300">
      <div className="relative w-14 h-14">
        {/* Outer glowing pulsing ring */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 opacity-20 blur-lg animate-pulse" />
        {/* Spinning indicator */}
        <div className="relative w-full h-full rounded-2xl border-2 border-emerald-500/20 border-t-emerald-500 dark:border-emerald-400/20 dark:border-t-emerald-400 animate-spin" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 tracking-wide">
          Loading Engrew Hebrew Academy...
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-hebrew">
          טוען נתונים מאובטחים...
        </p>
      </div>
    </div>
  );
};
