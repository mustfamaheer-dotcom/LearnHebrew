import React, { useState, useEffect } from 'react';
import {
  LucideIcon,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Settings,
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useSidebarStore } from '../../store/sidebarStore';
import { useAuthStore } from '../../store/authStore';
import { getAvatarUrl } from '../../utils/avatar';

export interface GlassNavItem {
  id: string;
  label: string;
  labelHe?: string;
  icon: LucideIcon;
  badge?: string | number | null;
  badgeColor?: string;
  children?: GlassNavItem[];
  defaultExpanded?: boolean;
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
  const { isCollapsed, toggleCollapsed } = useSidebarStore();

  // Track expanded state for mother items with children
  const [openParents, setOpenParents] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navItems.forEach((item) => {
      if (item.children && item.children.length > 0) {
        const hasActiveChild = item.children.some((c) => c.id === activeTab);
        initial[item.id] = item.defaultExpanded ?? (hasActiveChild || false);
      }
    });
    return initial;
  });

  // Automatically expand parent if activeTab changes to one of its children
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.children && item.children.length > 0) {
        if (item.children.some((c) => c.id === activeTab)) {
          setOpenParents((prev) => ({ ...prev, [item.id]: true }));
        }
      }
    });
  }, [activeTab, navItems]);

  const toggleParent = (parentId: string) => {
    setOpenParents((prev) => ({ ...prev, [parentId]: !prev[parentId] }));
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[70] lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Fixed Left Sidebar */}
      <aside
        className={`fixed top-16 sm:top-20 start-0 bottom-0 z-40 h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] border-e border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl flex flex-col justify-between transition-all duration-300 ease-in-out ${
          isOpenMobile
            ? 'flex z-[70] !top-0 !h-screen w-80 max-w-[85vw] shadow-2xl rounded-e-3xl sm:rounded-e-none'
            : isCollapsed
            ? 'hidden lg:flex w-20'
            : 'hidden lg:flex w-72 xl:w-80'
        } ${className || ''}`}
      >
        {/* Subtle Ambient Apple Aurora */}
        <div className="absolute top-0 start-0 w-48 h-48 bg-gradient-to-br from-brand-teal-400/10 to-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 end-0 w-48 h-48 bg-gradient-to-tl from-brand-olive-400/10 to-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Mobile Close Button (only when opened as mobile overlay) */}
        {isOpenMobile && onCloseMobile && (
          <div className="lg:hidden px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/80 shrink-0 relative z-10 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {panelSubtitle}
            </span>
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Desktop Inner Arrow Toggle Bar (Fully inside the sidebar) */}
        <div className={`hidden lg:flex items-center shrink-0 pt-3 pb-1 relative z-10 transition-all ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}>
          {!isCollapsed && (
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 select-none">
              {panelSubtitle || (language === 'he' ? 'ניווט' : 'Navigation')}
            </span>
          )}

          <button
            type="button"
            onClick={toggleCollapsed}
            className="w-7 h-7 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 hover:bg-brand-teal-50 dark:hover:bg-brand-teal-950/70 text-slate-600 dark:text-slate-300 hover:text-brand-teal-700 dark:hover:text-brand-teal-300 border border-slate-200/70 dark:border-slate-700/70 hover:border-brand-teal-300 dark:hover:border-brand-teal-800 flex items-center justify-center transition-all shadow-2xs cursor-pointer group"
            title={
              isCollapsed
                ? language === 'he'
                  ? 'הרחב סרגל צד'
                  : 'Expand sidebar'
                : language === 'he'
                ? 'צמצם לסמלים בלבד'
                : 'Collapse sidebar'
            }
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {language === 'he' ? (
              isCollapsed ? (
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              ) : (
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              )
            ) : isCollapsed ? (
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            ) : (
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            )}
          </button>
        </div>

        {/* Middle Scrollable Navigation Section */}
        <div className={`flex-1 overflow-y-auto py-3 space-y-2 relative z-10 scrollbar-thin ${
          isCollapsed ? 'px-2 overflow-x-hidden' : 'px-4'
        }`}>
          {/* Custom Slot (e.g. Student Balance) */}
          {customSlot && (
            <div className={`mb-3 ${isCollapsed ? 'flex justify-center' : ''}`}>
              {customSlot}
            </div>
          )}

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const hasChildren = Boolean(item.children && item.children.length > 0);
              const isChildActive = Boolean(hasChildren && item.children!.some((c) => c.id === activeTab));
              const isActive = activeTab === item.id || isChildActive;
              const isParentOpen = Boolean(openParents[item.id]);
              const label = language === 'he' && item.labelHe ? item.labelHe : item.label;

              // Collapsed (Icons Only) Mode
              if (isCollapsed) {
                return (
                  <div key={item.id} className="relative group flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (hasChildren) {
                          toggleParent(item.id);
                        } else {
                          onTabChange(item.id);
                          if (onCloseMobile) onCloseMobile();
                        }
                      }}
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all relative ${
                        isActive
                          ? 'bg-gradient-to-r from-brand-teal-950/90 via-slate-900/85 to-brand-teal-900/90 text-white shadow-[0_8px_20px_-3px_rgba(10,40,48,0.5),inset_0_1px_1px_rgba(255,255,255,0.25)] border border-white/20'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                      }`}
                      title={label}
                    >
                      {/* Active Indicator Bar on Side */}
                      {isActive && (
                        <div className="absolute start-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)]" />
                      )}

                      <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive
                          ? 'text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.7)]'
                          : 'group-hover:text-brand-teal-700 dark:group-hover:text-brand-teal-300'
                      }`} />

                      {/* Mini Badge Dot if badge present */}
                      {(item.badge !== null && item.badge !== undefined || hasChildren) && (
                        <span className={`absolute top-1.5 end-1.5 w-2 h-2 rounded-full ${
                          hasChildren ? 'bg-brand-olive-400' : 'bg-emerald-400'
                        } shadow-[0_0_6px_rgba(52,211,153,0.9)]`} />
                      )}
                    </button>

                    {/* Floating Flyout Menu on Hover (for Mother with Children or Tooltip) */}
                    {hasChildren ? (
                      <div className="hidden lg:group-hover:flex flex-col absolute start-[calc(100%+0.65rem)] top-0 p-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 min-w-[200px] space-y-1 animate-in fade-in slide-in-from-left-2 duration-150">
                        <div className="px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
                          {label}
                        </div>
                        {item.children!.map((child) => {
                          const ChildIcon = child.icon;
                          const isChildCur = activeTab === child.id;
                          const childLabel = language === 'he' && child.labelHe ? child.labelHe : child.label;
                          return (
                            <button
                              key={child.id}
                              type="button"
                              onClick={() => {
                                onTabChange(child.id);
                                if (onCloseMobile) onCloseMobile();
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-start ${
                                isChildCur
                                  ? 'bg-brand-teal-800 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <ChildIcon className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{childLabel}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="hidden lg:flex absolute start-[calc(100%+0.65rem)] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-slate-950 text-white text-xs font-bold whitespace-nowrap shadow-xl border border-white/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 items-center gap-2">
                        <span>{label}</span>
                        {item.badge !== null && item.badge !== undefined && (
                          <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px]">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              // Expanded Full Sidebar Mode: MOTHER ITEM WITH CHILDREN
              if (hasChildren) {
                return (
                  <div key={item.id} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => toggleParent(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all group ${
                        isChildActive
                          ? 'bg-brand-teal-50/80 dark:bg-brand-teal-950/60 text-brand-teal-900 dark:text-brand-teal-200 border border-brand-teal-200/80 dark:border-brand-teal-800/80 shadow-2xs'
                          : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 truncate ps-1">
                        <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                          isChildActive
                            ? 'text-brand-teal-700 dark:text-brand-teal-300'
                            : 'text-slate-500 dark:text-slate-400 group-hover:text-brand-teal-700 dark:group-hover:text-brand-teal-300'
                        }`} />
                        <span className="truncate tracking-tight font-extrabold">{label}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.badge !== null && item.badge !== undefined && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider bg-brand-teal-100 dark:bg-brand-teal-900/60 text-brand-teal-800 dark:text-brand-teal-200 border border-brand-teal-200 dark:border-brand-teal-800">
                            {item.badge}
                          </span>
                        )}
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isParentOpen ? 'rotate-180 text-brand-teal-700 dark:text-brand-teal-300' : 'text-slate-400'
                          }`}
                        />
                      </div>
                    </button>

                    {/* Children List */}
                    {isParentOpen && (
                      <div className="ms-4 ps-3 border-s-2 border-brand-teal-200/80 dark:border-brand-teal-800/60 space-y-1 my-1 animate-in fade-in slide-in-from-top-1 duration-150">
                        {item.children!.map((child) => {
                          const ChildIcon = child.icon;
                          const isChildCurrent = activeTab === child.id;
                          const childLabel = language === 'he' && child.labelHe ? child.labelHe : child.label;

                          if (isChildCurrent) {
                            return (
                              <button
                                key={child.id}
                                type="button"
                                onClick={() => {
                                  onTabChange(child.id);
                                  if (onCloseMobile) onCloseMobile();
                                }}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-extrabold transition-all group relative overflow-hidden bg-gradient-to-r from-brand-teal-950 via-slate-900 to-brand-teal-900 text-white shadow-xs border border-white/15"
                              >
                                <div className="flex items-center gap-2.5 min-w-0 truncate ps-1">
                                  <div className="w-1.5 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                  <ChildIcon className="w-3.5 h-3.5 shrink-0 text-emerald-300" />
                                  <span className="truncate">{childLabel}</span>
                                </div>
                                {child.badge && (
                                  <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-emerald-300 text-[9px] font-black">
                                    {child.badge}
                                  </span>
                                )}
                              </button>
                            );
                          }

                          return (
                            <button
                              key={child.id}
                              type="button"
                              onClick={() => {
                                onTabChange(child.id);
                                if (onCloseMobile) onCloseMobile();
                              }}
                              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all text-start"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 truncate ps-1">
                                <ChildIcon className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-brand-teal-700 dark:group-hover:text-brand-teal-300" />
                                <span className="truncate">{childLabel}</span>
                              </div>
                              {child.badge && (
                                <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px]">
                                  {child.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Expanded Full Sidebar Mode: REGULAR FLAT ITEM (Active)
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

              // Expanded Full Sidebar Mode: REGULAR FLAT ITEM (Inactive)
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
        <div
          className={`border-t border-slate-200/60 dark:border-slate-800/80 shrink-0 relative z-10 bg-slate-50/50 dark:bg-slate-950/60 transition-all ${
            isCollapsed ? 'p-2 space-y-2' : 'p-3.5 space-y-3'
          }`}
          style={{ paddingBottom: 'max(calc(env(safe-area-inset-bottom, 0px) + 8px), 14px)' }}
        >
          {/* Action Button */}
          {actionButton && (
            isCollapsed ? (
              <div className="relative group flex justify-center">
                <button
                  onClick={() => {
                    actionButton.onClick();
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className="w-10 h-10 bg-brand-olive-500 hover:bg-brand-olive-600 text-slate-950 rounded-xl shadow-xs transition-colors flex items-center justify-center"
                  title={actionButton.label}
                >
                  {actionButton.icon ? (
                    <actionButton.icon className="w-4 h-4" />
                  ) : (
                    <span className="font-black text-xs">+</span>
                  )}
                </button>
                <div className="hidden lg:block absolute start-[calc(100%+0.65rem)] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-slate-950 text-white text-xs font-bold whitespace-nowrap shadow-xl border border-white/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  {actionButton.label}
                </div>
              </div>
            ) : (
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
            )
          )}

          {/* User Profile Card */}
          {user && (() => {
            const openProfileModal = useAuthStore.getState().openProfileModal;
            const initials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();

            return isCollapsed ? (
              <div className="relative group flex justify-center">
                <button
                  type="button"
                  onClick={openProfileModal}
                  title={language === 'he' ? 'הגדרות פרופיל' : 'Profile Settings'}
                  className="w-10 h-10 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-teal-500 to-indigo-700 text-white font-black flex items-center justify-center text-xs shadow-xs hover:ring-2 hover:ring-teal-400 transition-all cursor-pointer"
                >
                  {user.avatarUrl ? (
                    <img src={getAvatarUrl(user.avatarUrl)} alt={user.firstName} className="w-full h-full object-cover" />
                  ) : (
                    initials || 'U'
                  )}
                </button>
                {/* User Tooltip */}
                <div className="hidden lg:block absolute start-[calc(100%+0.65rem)] bottom-0 p-2.5 rounded-xl bg-slate-950 text-white text-xs font-bold whitespace-nowrap shadow-xl border border-white/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 space-y-0.5">
                  <p className="font-bold text-white">{user.firstName} {user.lastName}</p>
                  <p className="text-[10px] text-slate-400 font-normal">{user.email}</p>
                  {user.role && (
                    <span className="inline-block text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-brand-teal-900/80 text-brand-teal-300 border border-brand-teal-700/60 mt-1 uppercase">
                      {user.role === 'SUPER_ADMIN' ? 'Platform Owner' : user.role}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white/90 dark:bg-slate-900/90 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md flex items-center justify-between gap-2.5 transition-colors">
                <button
                  type="button"
                  onClick={openProfileModal}
                  className="flex items-center gap-2.5 min-w-0 flex-1 text-start group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-brand-teal-500 to-indigo-700 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-xs ring-1 ring-teal-400/30 group-hover:ring-teal-400 transition-all">
                    {user.avatarUrl ? (
                      <img src={getAvatarUrl(user.avatarUrl)} alt={user.firstName} className="w-full h-full object-cover" />
                    ) : (
                      initials || 'U'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" title={`${user.firstName || ''} ${user.lastName || ''}`}>
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate" title={user.email}>
                      {user.email}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={openProfileModal}
                  title={language === 'he' ? 'הגדרות פרופיל וסיסמה' : 'Profile & Password Settings'}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            );
          })()}
        </div>
      </aside>
    </>
  );
};
