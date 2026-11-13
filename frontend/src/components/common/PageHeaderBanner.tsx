import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';

interface PageHeaderBannerProps {
  badgeIcon?: LucideIcon;
  badgeText: string;
  statusText?: string;
  title: React.ReactNode;
  description: React.ReactNode;
  action?: React.ReactNode;
  gradient?: string;
  className?: string;
}

export const PageHeaderBanner: React.FC<PageHeaderBannerProps> = ({
  badgeIcon: BadgeIcon = Sparkles,
  badgeText,
  statusText,
  title,
  description,
  action,
  gradient = 'from-brand-teal-950 via-brand-teal-900 to-slate-900',
  className = '',
}) => {
  return (
    <div className="sticky top-16 sm:top-20 z-30 pt-1 pb-3 -mt-1 -mb-1 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md transition-all">
      <div
        className={`relative overflow-hidden bg-gradient-to-br ${gradient} text-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 shadow-xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${className}`}
      >
        {/* Ambient background glows */}
        <div className="absolute top-0 end-0 -mt-10 -me-10 w-72 h-72 bg-brand-olive-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 start-0 -mb-10 -ms-10 w-72 h-72 bg-brand-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Text and Badge */}
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-brand-olive-300 text-xs font-bold mb-2 border border-white/15 shadow-xs">
            <BadgeIcon className="w-3.5 h-3.5 text-brand-olive-400 shrink-0" />
            <span>{badgeText}</span>
            {statusText && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-[10px] text-white/75 font-semibold">{statusText}</span>
              </>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
            {title}
          </h1>

          <p className="text-brand-teal-100/90 text-xs sm:text-sm mt-1 font-medium leading-relaxed">
            {description}
          </p>
        </div>

        {/* Action Button(s) */}
        {action && (
          <div className="relative z-10 shrink-0 flex items-center gap-3">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};
