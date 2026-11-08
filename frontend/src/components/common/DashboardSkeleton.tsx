import React from 'react';
import { useSidebarStore } from '../../store/sidebarStore';

interface DashboardSkeletonProps {
  /** Optional custom title or section preview */
  title?: string;
  /** Whether to render standalone or within an existing shell */
  standalone?: boolean;
}

export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({
  title,
  standalone = true,
}) => {
  const { isCollapsed } = useSidebarStore();

  const mainPaddingClass = isCollapsed
    ? 'lg:ps-24'
    : 'lg:ps-80';

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950/60 flex relative overflow-hidden transition-all duration-300">
      {/* 1. Desktop Sidebar Skeleton (Matches GlassSidebar) */}
      <aside
        className={`hidden lg:flex flex-col fixed top-16 bottom-0 start-0 z-30 transition-all duration-300 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-e border-slate-200/80 dark:border-slate-800/80 ${
          isCollapsed ? 'w-20' : 'w-72 xl:w-80'
        }`}
      >
        {/* Sidebar Header Skeleton */}
        <div className={`p-4 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center shrink-0 ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl skeleton-shimmer shrink-0" />
              <div className="space-y-1.5">
                <div className="w-24 h-4 rounded-md skeleton-shimmer" />
                <div className="w-16 h-2.5 rounded-md skeleton-shimmer" />
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-2xl skeleton-shimmer shrink-0" />
          )}
          {!isCollapsed && <div className="w-7 h-7 rounded-xl skeleton-shimmer" />}
        </div>

        {/* Sidebar Menu Items Skeleton */}
        <div className="flex-1 py-4 px-3 space-y-2 overflow-hidden">
          {/* Active slot indicator skeleton */}
          <div className="w-full h-11 rounded-2xl skeleton-shimmer bg-emerald-500/10 dark:bg-emerald-500/20" />
          
          {/* Secondary menu lines */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-11 rounded-2xl flex items-center px-3 gap-3 ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <div className="w-5 h-5 rounded-lg skeleton-shimmer shrink-0" />
              {!isCollapsed && (
                <>
                  <div className="w-28 h-3.5 rounded-md skeleton-shimmer" />
                  <div className="ms-auto w-6 h-4 rounded-full skeleton-shimmer" />
                </>
              )}
            </div>
          ))}
        </div>

        {/* Sidebar Bottom User Profile Skeleton */}
        <div className="p-3 border-t border-slate-200/60 dark:border-slate-800/60 shrink-0">
          <div className={`flex items-center gap-3 p-2 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 ${
            isCollapsed ? 'justify-center' : ''
          }`}>
            <div className="w-9 h-9 rounded-full skeleton-shimmer shrink-0" />
            {!isCollapsed && (
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="w-20 h-3.5 rounded-md skeleton-shimmer" />
                <div className="w-28 h-2.5 rounded-md skeleton-shimmer" />
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 2. Main Content Workspace Skeleton */}
      <main
        className={`flex-1 min-w-0 transition-all duration-300 pb-28 lg:pb-12 ${
          standalone ? mainPaddingClass : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

          {/* Top Executive Banner / Hero Skeleton */}
          <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-brand-teal-950 via-slate-900 to-slate-950 border border-teal-800/30 shadow-xl overflow-hidden">
            {/* Shimmer background glow */}
            <div className="absolute top-0 end-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-xl">
                {/* Pill Chip */}
                <div className="w-32 h-6 rounded-full skeleton-shimmer opacity-40" />
                {/* Large Title Bar */}
                <div className="w-64 sm:w-80 h-8 sm:h-10 rounded-xl skeleton-shimmer opacity-60" />
                {/* Subtitle Bar */}
                <div className="w-full sm:w-96 h-4 rounded-lg skeleton-shimmer opacity-30" />
              </div>

              {/* Action Buttons Skeleton */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-32 h-11 rounded-2xl skeleton-shimmer opacity-50" />
                <div className="w-28 h-11 rounded-2xl skeleton-shimmer opacity-30" />
              </div>
            </div>
          </div>

          {/* 3. Quick Stats / KPI 4-Card Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl p-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-2xs space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl skeleton-shimmer shrink-0" />
                  <div className="w-14 h-5 rounded-full skeleton-shimmer" />
                </div>
                <div className="space-y-2">
                  <div className="w-24 h-7 rounded-lg skeleton-shimmer" />
                  <div className="w-36 h-3 rounded-md skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>

          {/* 4. Filter Tabs Skeleton Capsule Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <div className="w-24 h-10 rounded-full skeleton-shimmer shrink-0 bg-emerald-500/20" />
            <div className="w-28 h-10 rounded-full skeleton-shimmer shrink-0" />
            <div className="w-24 h-10 rounded-full skeleton-shimmer shrink-0" />
            <div className="w-32 h-10 rounded-full skeleton-shimmer shrink-0" />
          </div>

          {/* 5. Main Card & Schedule Content Section Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2-Column: Feed / Table / Lessons Skeleton */}
            <div className="lg:col-span-2 rounded-2xl p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="space-y-1.5">
                  <div className="w-36 h-5 rounded-md skeleton-shimmer" />
                  <div className="w-48 h-3 rounded-md skeleton-shimmer" />
                </div>
                <div className="w-24 h-8 rounded-xl skeleton-shimmer" />
              </div>

              {/* Feed Items Skeleton Rows */}
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl skeleton-shimmer shrink-0" />
                    <div className="space-y-2">
                      <div className="w-40 sm:w-56 h-4 rounded-md skeleton-shimmer" />
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-3 rounded-md skeleton-shimmer" />
                        <div className="w-16 h-3 rounded-md skeleton-shimmer" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                    <div className="w-20 h-8 rounded-xl skeleton-shimmer" />
                    <div className="w-24 h-8 rounded-xl skeleton-shimmer bg-emerald-500/20" />
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Mini Card / Circular Metric Widget Skeleton */}
            <div className="rounded-2xl p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-2xs space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-28 h-5 rounded-md skeleton-shimmer" />
                <div className="w-6 h-6 rounded-lg skeleton-shimmer" />
              </div>

              {/* Circular Progress Skeleton Ring */}
              <div className="flex flex-col items-center justify-center py-4 space-y-3">
                <div className="w-32 h-32 rounded-full skeleton-shimmer border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-900 flex flex-col items-center justify-center space-y-1">
                    <div className="w-8 h-6 rounded-md skeleton-shimmer" />
                    <div className="w-10 h-2 rounded-md skeleton-shimmer" />
                  </div>
                </div>
                <div className="w-36 h-3.5 rounded-md skeleton-shimmer" />
              </div>

              {/* Progress bars skeleton */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex justify-between">
                  <div className="w-20 h-3 rounded-md skeleton-shimmer" />
                  <div className="w-10 h-3 rounded-md skeleton-shimmer" />
                </div>
                <div className="w-full h-2 rounded-full skeleton-shimmer" />
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* 6. Mobile Floating Bottom Capsule Bar Skeleton (Matches Student Navigation Liquid Glass) */}
      <div
        className="lg:hidden fixed left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-md z-40 pointer-events-none"
        style={{ bottom: 'max(calc(env(safe-area-inset-bottom, 0px) + 12px), 16px)' }}
      >
        <div className="w-full h-14 rounded-full liquid-glass-shell flex items-center justify-around px-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-5 h-5 rounded-md skeleton-shimmer opacity-50" />
              <div className="w-7 h-1.5 rounded-full skeleton-shimmer opacity-30" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

