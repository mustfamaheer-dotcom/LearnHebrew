import React from 'react';
import { LucideIcon, X } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export interface GlassNavItem {
  id: string;
  label: string;
  labelHe?: string;
  icon: LucideIcon;
  badge?: string | number | null;
  badgeColor?: string;
}

interface GlassSidebarProps {
  navItems: GlassNavItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  user: {
    firstName?: string;
    lastName?: string;
    email?: string;
    avatarUrl?: string | null;
    role?: string;
  } | null;
  panelSubtitle?: string;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  customSlot?: React.ReactNode;
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

export const GlassSidebar: React.FC<GlassSidebarProps> = ({
  navItems,
  activeTab,
  onTabChange,
  user,
  panelSubtitle = 'Dashboard',
  isOpenMobile = false,
  onCloseMobile,
  customSlot,
  actionButton,
  className,
}) => {
  const { language } = useTranslation();

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Fixed Left Sidebar */}
      <aside
        className={`fixed top-16 sm:top-20 start-0 bottom-0 z-40 w-72 xl:w-80 h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] border-e border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl flex flex-col justify-between transition-all duration-300 ${
          isOpenMobile
            ? 'flex z-50 !top-0 !h-screen shadow-2xl'
            : 'hidden lg:flex'
        } ${className || ''}`}
      >
        {/* Subtle Ambient Apple Aurora */}
        <div className="absolute top-0 start-0 w-48 h-48 bg-gradient-to-br from-brand-teal-400/10 to-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 end-0 w-48 h-48 bg-gradient-to-tl from-brand-olive-400/10 to-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Section */}
        <div className="px-5 py-4 border-b border-slate-200/60 dark:border-slate-800/80 shrink-0 relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-1 flex items-center justify-center shadow-xs shrink-0">
              <img
                src="/logo.png"
                alt="Engrew"
                className="w-full h-full object-contain drop-shadow-2xs"
              />
            </div>
            <div className="overflow-hidden min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base text-slate-900 dark:text-white tracking-tight">
                  Engrew
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {panelSubtitle}
              </p>
            </div>
          </div>

          {/* Mobile Close Button */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Middle Scrollable Navigation Section */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-2 relative z-10 scrollbar-thin">
          {/* Custom Slot (e.g. Balance or streak) */}
          {customSlot && <div className="mb-3">{customSlot}</div>}

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const label = language === 'he' && item.labelHe ? item.labelHe : item.label;

              if (isActive) {
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all group relative overflow-hidden bg-gradient-to-r from-brand-teal-950/90 via-slate-900/85 to-brand-teal-900/90 text-white shadow-[0_10px_25px_-5px_rgba(10,40,48,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] border border-white/20 dark:border-white/15 backdrop-blur-2xl"
                  >
                    {/* Top Glass Sheen */}
                    <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

                    {/* Ambient Glassy Green Aura */}
                    <div className="absolute start-2 top-1/2 -translate-y-1/2 w-7 h-9 bg-emerald-400/35 rounded-full blur-md pointer-events-none" />

                    {/* Luminous Frosted Glass Green Capsule */}
                    <div className="absolute start-2.5 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full bg-gradient-to-b from-lime-200 via-emerald-400 to-teal-400 shadow-[0_0_12px_rgba(52,211,153,0.85)] ring-1 ring-white/60 pointer-events-none overflow-hidden">
                      <div className="absolute top-0.5 inset-x-0 h-2 bg-white/70 rounded-full" />
                    </div>

                    <div className="flex items-center gap-3 min-w-0 truncate ps-3.5">
                      <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110 text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.65)]" />
                      <span className="truncate tracking-tight font-extrabold">{label}</span>
                    </div>

                    {item.badge !== null && item.badge !== undefined && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider shrink-0 bg-white/15 dark:bg-black/35 backdrop-blur-md text-emerald-300 border border-emerald-400/40 shadow-[0_0_10px_rgba(52,211,153,0.25)]">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:backdrop-blur-xl hover:border-slate-200/80 dark:hover:border-slate-700/80 border border-transparent transition-all group relative"
                >
                  <div className="flex items-center gap-3 min-w-0 truncate ps-2">
                    <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110 text-slate-500 dark:text-slate-400 group-hover:text-brand-teal-700 dark:group-hover:text-brand-teal-300" />
                    <span className="truncate">{label}</span>
                  </div>

                  {item.badge !== null && item.badge !== undefined && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider shrink-0 bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 group-hover:bg-slate-200/80 dark:group-hover:bg-slate-700 transition-colors">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Action Button + User Profile */}
        <div className="p-3.5 border-t border-slate-200/60 dark:border-slate-800/80 shrink-0 relative z-10 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
          {actionButton && (
            <button
              onClick={() => {
                actionButton.onClick();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full py-2.5 px-3 bg-brand-olive-500 hover:bg-brand-olive-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              {actionButton.icon && <actionButton.icon className="w-4 h-4" />}
              <span>{actionButton.label}</span>
            </button>
          )}

          {user && (
            <div className="bg-white/80 dark:bg-slate-850/80 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/70 backdrop-blur-md flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.firstName || 'User'}
                    className="w-9 h-9 rounded-xl object-cover ring-2 ring-brand-teal-100 dark:ring-brand-teal-900 shrink-0 shadow-xs"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-olive-100 to-brand-olive-200 dark:from-brand-olive-950 dark:to-brand-olive-900 text-brand-olive-900 dark:text-brand-olive-300 font-black flex items-center justify-center text-xs shrink-0 border border-brand-olive-300/60 dark:border-brand-olive-800 shadow-xs">
                    {user.firstName?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate" title={`${user.firstName || ''} ${user.lastName || ''}`}>
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate" title={user.email}>
                    {user.email}
                  </p>
                </div>
              </div>

              {user.role && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-brand-teal-50 dark:bg-brand-teal-950/80 text-brand-teal-900 dark:text-brand-teal-200 border border-brand-teal-200/80 dark:border-brand-teal-800 shrink-0 uppercase tracking-wider">
                  {user.role === 'SUPER_ADMIN' ? 'Platform Owner' : user.role}
                </span>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
