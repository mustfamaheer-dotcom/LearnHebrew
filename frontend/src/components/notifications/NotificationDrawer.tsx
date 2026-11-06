import React, { useState } from 'react';
import {
  X,
  CheckCheck,
  Trash2,
  Video,
  Clock,
  BookOpen,
  PlayCircle,
  Sparkles,
  ExternalLink,
  Check,
  Bell,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export interface NotificationItem {
  id: string;
  category: 'LESSON' | 'REMINDER' | 'HOMEWORK' | 'RECORDING' | 'GAMIFICATION' | 'SYSTEM';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  type: string;
  title?: string;
  body?: string;
  titleEn?: string;
  titleHe?: string;
  bodyEn?: string;
  bodyHe?: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  soundEnabled,
  onToggleSound,
}) => {
  const { language } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'LESSON' | 'HOMEWORK' | 'RECORDING' | 'UNREAD'>('ALL');

  if (!isOpen) return null;

  const filtered = notifications.filter((item) => {
    if (activeFilter === 'UNREAD') return !item.isRead;
    if (activeFilter === 'LESSON') return item.category === 'LESSON' || item.category === 'REMINDER';
    if (activeFilter === 'HOMEWORK') return item.category === 'HOMEWORK';
    if (activeFilter === 'RECORDING') return item.category === 'RECORDING';
    return true;
  });

  const getCategoryIcon = (category: string, priority: string) => {
    if (category === 'REMINDER' || priority === 'URGENT') {
      return <Clock className="w-4 h-4 text-amber-500 animate-pulse" />;
    }
    if (category === 'LESSON') {
      return <Video className="w-4 h-4 text-brand-teal-600 dark:text-brand-teal-400" />;
    }
    if (category === 'HOMEWORK') {
      return <BookOpen className="w-4 h-4 text-brand-olive-600 dark:text-brand-olive-400" />;
    }
    if (category === 'RECORDING') {
      return <PlayCircle className="w-4 h-4 text-sky-500" />;
    }
    return <Sparkles className="w-4 h-4 text-purple-500" />;
  };

  const formatRelativeTime = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return language === 'he' ? 'עכשיו' : 'Just now';
    if (diff < 3600) {
      const mins = Math.floor(diff / 60);
      return language === 'he' ? `לפני ${mins} דק׳` : `${mins}m ago`;
    }
    if (diff < 86400) {
      const hrs = Math.floor(diff / 3600);
      return language === 'he' ? `לפני ${hrs} שע׳` : `${hrs}h ago`;
    }
    const days = Math.floor(diff / 86400);
    return language === 'he' ? `לפני ${days} ימים` : `${days}d ago`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-s border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-end duration-300">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-brand-teal-50 dark:bg-brand-teal-950/80 border border-brand-teal-200 dark:border-brand-teal-800 text-brand-teal-800 dark:text-brand-teal-300 flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {language === 'he' ? 'התראות ועדכונים' : 'Notifications Hub'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'he' ? 'שיעורים, משימות והודעות בזמן אמת' : 'Live lesson alerts, homework & videos'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              className={`p-2 rounded-xl text-xs font-bold transition-colors ${
                soundEnabled
                  ? 'text-brand-teal-700 dark:text-brand-teal-300 hover:bg-brand-teal-50 dark:hover:bg-brand-teal-950/60'
                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={soundEnabled ? (language === 'he' ? 'השתק צליל' : 'Mute Chime') : (language === 'he' ? 'הפעל צליל' : 'Enable Chime')}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Mark All Read */}
            <button
              onClick={onMarkAllAsRead}
              className="p-2 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={language === 'he' ? 'סמן הכל כנקרא' : 'Mark all as read'}
            >
              <CheckCheck className="w-4 h-4" />
            </button>

            {/* Close Drawer */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Pills Toolbar */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          {[
            { id: 'ALL', labelEn: 'All', labelHe: 'הכל' },
            { id: 'UNREAD', labelEn: 'Unread', labelHe: 'לא נקראו' },
            { id: 'LESSON', labelEn: 'Lessons', labelHe: 'שיעורים' },
            { id: 'HOMEWORK', labelEn: 'Homework', labelHe: 'שיעורי בית' },
            { id: 'RECORDING', labelEn: 'Videos', labelHe: 'הקלטות' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeFilter === tab.id
                  ? 'bg-brand-teal-800 dark:bg-brand-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {language === 'he' ? tab.labelHe : tab.labelEn}
            </button>
          ))}
        </div>

        {/* Notification Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100/60 dark:divide-slate-800/40">
          {filtered.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Bell className="w-6 h-6 opacity-60" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                  {language === 'he' ? 'אין התראות חדשות' : 'No notifications'}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {language === 'he' ? 'הכל מעודכן! עדכונים יופיעו כאן בזמן אמת.' : 'You are all caught up.'}
                </p>
              </div>
            </div>
          ) : (
            filtered.map((item) => {
              const title = language === 'he' ? (item.titleHe || item.title || item.titleEn) : (item.titleEn || item.title);
              const body = language === 'he' ? (item.bodyHe || item.body || item.bodyEn) : (item.bodyEn || item.body);

              return (
                <div
                  key={item.id}
                  className={`pt-3 first:pt-0 p-3.5 rounded-2xl transition-all border ${
                    item.isRead
                      ? 'bg-transparent border-transparent hover:bg-slate-50/70 dark:hover:bg-slate-850/50'
                      : 'bg-brand-teal-50/50 dark:bg-brand-teal-950/20 border-brand-teal-200/60 dark:border-brand-teal-800/50 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Category Icon Badge */}
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/60 dark:border-slate-700/80 flex items-center justify-center shrink-0 mt-0.5">
                      {getCategoryIcon(item.category, item.priority)}
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h4 className={`text-xs font-bold truncate ${item.isRead ? 'text-slate-800 dark:text-slate-200' : 'text-slate-900 dark:text-white font-black'}`}>
                          {title}
                        </h4>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>

                      {body && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                          {body}
                        </p>
                      )}

                      {/* Action Links & Buttons */}
                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        {item.actionUrl ? (
                          <a
                            href={item.actionUrl}
                            target={item.actionUrl.startsWith('http') ? '_blank' : '_self'}
                            rel="noreferrer"
                            onClick={() => {
                              onMarkAsRead(item.id);
                              if (!item.actionUrl?.startsWith('http')) onClose();
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-brand-teal-800 hover:bg-brand-teal-900 text-white font-bold text-[11px] shadow-xs transition-colors"
                          >
                            <span>
                              {item.actionUrl.includes('zoom.us')
                                ? (language === 'he' ? 'כניסה לזום' : 'Join Zoom')
                                : (language === 'he' ? 'פתח קישור' : 'Open')}
                            </span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : <div />}

                        <div className="flex items-center gap-1">
                          {!item.isRead && (
                            <button
                              onClick={() => onMarkAsRead(item.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title={language === 'he' ? 'סמן כנקרא' : 'Mark as read'}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onDelete(item.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title={language === 'he' ? 'מחק התראה' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

