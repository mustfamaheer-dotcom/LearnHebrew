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
  Search,
  RefreshCw,
  ShieldCheck,
  Radio,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { formatIsraelDateTime } from '../../lib/timeUtils';

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
  unreadCount?: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClearRead?: () => void;
  onRefresh?: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearRead,
  onRefresh,
  soundEnabled,
  onToggleSound,
}) => {
  const { language } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<
    'ALL' | 'UNREAD' | 'LESSON' | 'HOMEWORK' | 'RECORDING' | 'SYSTEM'
  >('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  const handleRefreshClick = () => {
    if (onRefresh) {
      setIsRefreshing(true);
      onRefresh();
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const filtered = notifications.filter((item) => {
    // Filter by Tab
    if (activeFilter === 'UNREAD' && item.isRead) return false;
    if (activeFilter === 'LESSON' && item.category !== 'LESSON' && item.category !== 'REMINDER') return false;
    if (activeFilter === 'HOMEWORK' && item.category !== 'HOMEWORK') return false;
    if (activeFilter === 'RECORDING' && item.category !== 'RECORDING') return false;
    if (activeFilter === 'SYSTEM' && item.category !== 'SYSTEM' && item.category !== 'GAMIFICATION') return false;

    // Search Query
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const title = (item.titleHe || item.titleEn || item.title || '').toLowerCase();
    const body = (item.bodyHe || item.bodyEn || item.body || '').toLowerCase();
    return title.includes(q) || body.includes(q);
  });

  const getCategoryIcon = (category: string, priority: string) => {
    if (category === 'REMINDER' || priority === 'URGENT') {
      return <Clock className="w-5 h-5 text-amber-500 animate-pulse" />;
    }
    if (category === 'LESSON') {
      return <Video className="w-5 h-5 text-brand-teal-600 dark:text-brand-teal-400" />;
    }
    if (category === 'HOMEWORK') {
      return <BookOpen className="w-5 h-5 text-brand-olive-600 dark:text-brand-olive-400" />;
    }
    if (category === 'RECORDING') {
      return <PlayCircle className="w-5 h-5 text-sky-500" />;
    }
    if (category === 'GAMIFICATION') {
      return <Sparkles className="w-5 h-5 text-purple-500" />;
    }
    return <ShieldCheck className="w-5 h-5 text-brand-teal-600 dark:text-brand-teal-400" />;
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

  const unreadLessonsCount = notifications.filter((n) => !n.isRead && (n.category === 'LESSON' || n.category === 'REMINDER')).length;
  const unreadHomeworkCount = notifications.filter((n) => !n.isRead && n.category === 'HOMEWORK').length;
  const unreadRecordingsCount = notifications.filter((n) => !n.isRead && n.category === 'RECORDING').length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      {/* Click Backdrop to close */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* Pop-up Page Modal Card */}
      <div className="relative w-full max-w-3xl max-h-[92vh] sm:max-h-[88vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Top Header Bar */}
        <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-brand-teal-50 dark:bg-brand-teal-950/80 border border-brand-teal-200/80 dark:border-brand-teal-800 text-brand-teal-800 dark:text-brand-teal-300 flex items-center justify-center font-bold shadow-2xs shrink-0 relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -end-1 w-3 h-3 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900 animate-pulse" />
              )}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                  {language === 'he' ? 'מרכז התראות ועדכונים' : 'Notifications Hub'}
                </h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    {unreadCount} {language === 'he' ? 'חדשות' : 'new'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {language === 'he'
                  ? 'שיעורי 25 דק׳, מפגשי זום, משימות ועדכוני מערכת בזמן אמת'
                  : 'Live 25-min lessons, Zoom sessions, homework & system alerts'}
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Refresh */}
            {onRefresh && (
              <button
                type="button"
                onClick={handleRefreshClick}
                className="p-2 sm:px-2.5 sm:py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/60 dark:border-slate-700/60 shadow-2xs"
                title={language === 'he' ? 'רענן התראות' : 'Refresh'}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-brand-teal-600' : ''}`} />
              </button>
            )}

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={onToggleSound}
              className={`p-2 sm:px-2.5 sm:py-2 rounded-xl text-xs font-bold transition-colors border border-slate-200/60 dark:border-slate-700/60 shadow-2xs ${
                soundEnabled
                  ? 'text-brand-teal-700 dark:text-brand-teal-300 bg-brand-teal-50 dark:bg-brand-teal-950/70 border-brand-teal-200/80 dark:border-brand-teal-800'
                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={soundEnabled ? (language === 'he' ? 'השתק צליל התראה' : 'Mute notification sound') : (language === 'he' ? 'הפעל צליל התראה' : 'Enable notification sound')}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Mark All Read */}
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors border border-slate-200/60 dark:border-slate-700/60 shadow-2xs hidden xs:flex items-center gap-1.5"
              title={language === 'he' ? 'סמן הכל כנקרא' : 'Mark all read'}
            >
              <CheckCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">{language === 'he' ? 'סמן הכל' : 'Mark All'}</span>
            </button>

            {/* Clear Read Notifications */}
            {onClearRead && (
              <button
                type="button"
                onClick={onClearRead}
                className="p-2 sm:px-2.5 sm:py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors border border-slate-200/60 dark:border-slate-700/60 shadow-2xs"
                title={language === 'he' ? 'נקה התראות שנקראו' : 'Clear read notifications'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Close Pop-up */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 sm:px-2.5 sm:py-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/60 dark:border-slate-700/60 shadow-2xs"
              title={language === 'he' ? 'סגור חלון' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Filter Pills & Search */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            {[
              { id: 'ALL', labelEn: 'All', labelHe: 'הכל', count: notifications.length },
              { id: 'UNREAD', labelEn: 'Unread', labelHe: 'לא נקראו', count: unreadCount },
              { id: 'LESSON', labelEn: 'Lessons', labelHe: 'שיעורים וזום', count: unreadLessonsCount },
              { id: 'HOMEWORK', labelEn: 'Homework', labelHe: 'שיעורי בית', count: unreadHomeworkCount },
              { id: 'RECORDING', labelEn: 'Recordings', labelHe: 'הקלטות', count: unreadRecordingsCount },
              { id: 'SYSTEM', labelEn: 'System', labelHe: 'מערכת', count: null },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeFilter === tab.id
                    ? 'bg-brand-teal-800 dark:bg-brand-teal-700 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <span>{language === 'he' ? tab.labelHe : tab.labelEn}</span>
                {tab.count !== null && tab.count > 0 && (
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                    activeFilter === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[200px] sm:min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-3" />
            <input
              type="text"
              placeholder={language === 'he' ? 'חיפוש התראה או מורה...' : 'Search alerts...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ps-9 pe-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-teal-600"
            />
          </div>
        </div>

        {/* Pop-up Notification Body (Scrollable List) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {filtered.length === 0 ? (
            <div className="py-16 sm:py-24 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shadow-2xs">
                <Bell className="w-7 h-7 opacity-50" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                  {language === 'he' ? 'אין התראות להצגה' : 'No notifications found'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  {language === 'he'
                    ? 'הכל מעודכן במערכת! התראות על שיעורים, קישורי זום ומטלות יופיעו כאן בזמן אמת.'
                    : 'You are all caught up! Live lesson alerts, Zoom links, and homework updates will appear here.'}
                </p>
              </div>
            </div>
          ) : (
            filtered.map((item) => {
              const title = language === 'he' ? (item.titleHe || item.title || item.titleEn) : (item.titleEn || item.title);
              const body = language === 'he' ? (item.bodyHe || item.body || item.bodyEn) : (item.bodyEn || item.body);
              const isUrgent = item.priority === 'URGENT' || item.category === 'REMINDER';

              return (
                <div
                  key={item.id}
                  className={`p-4 sm:p-4.5 rounded-2xl transition-all border flex flex-col sm:flex-row sm:items-start justify-between gap-3 shadow-2xs ${
                    item.isRead
                      ? 'bg-slate-50/60 dark:bg-slate-850/50 border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      : 'bg-brand-teal-50/60 dark:bg-brand-teal-950/30 border-brand-teal-300/80 dark:border-brand-teal-800/80 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Category Icon Badge */}
                    <div className={`w-10 h-10 rounded-2xl shadow-2xs border flex items-center justify-center shrink-0 mt-0.5 ${
                      isUrgent
                        ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700'
                        : item.category === 'LESSON'
                        ? 'bg-brand-teal-50 dark:bg-brand-teal-950/80 border-brand-teal-300 dark:border-brand-teal-800'
                        : item.category === 'HOMEWORK'
                        ? 'bg-brand-olive-50 dark:bg-brand-olive-950/80 border-brand-olive-300 dark:border-brand-olive-700'
                        : item.category === 'RECORDING'
                        ? 'bg-sky-50 dark:bg-sky-950/80 border-sky-300 dark:border-sky-700'
                        : 'bg-purple-50 dark:bg-purple-950/80 border-purple-300 dark:border-purple-700'
                    }`}>
                      {getCategoryIcon(item.category, item.priority)}
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className={`text-sm ${item.isRead ? 'font-bold text-slate-800 dark:text-slate-200' : 'font-black text-slate-900 dark:text-white'}`}>
                          {title}
                        </h4>

                        {isUrgent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                            {language === 'he' ? 'דחוף • שיעור קרוב' : 'URGENT'}
                          </span>
                        )}

                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-brand-teal-500" />
                        )}
                      </div>

                      {body && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                          {body}
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400 font-medium">
                        <span>{formatRelativeTime(item.createdAt)}</span>
                        <span>•</span>
                        <span className="font-mono text-[10px]">
                          {formatIsraelDateTime(item.createdAt, {
                            includeDate: true,
                            locale: language === 'he' ? 'he-IL' : 'en-US',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Right Side */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/50 dark:border-slate-800">
                    {/* Action Link (e.g. Join Zoom or Open URL) */}
                    {item.actionUrl ? (
                      <a
                        href={item.actionUrl}
                        target={item.actionUrl.startsWith('http') ? '_blank' : '_self'}
                        rel="noreferrer"
                        onClick={() => {
                          onMarkAsRead(item.id);
                          if (!item.actionUrl?.startsWith('http')) onClose();
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-colors ${
                          item.actionUrl.includes('zoom.us')
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-brand-teal-800 hover:bg-brand-teal-900 text-white'
                        }`}
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>
                          {item.actionUrl.includes('zoom.us')
                            ? (language === 'he' ? 'כניסה לזום' : 'Join Zoom')
                            : (language === 'he' ? 'פתח קישור' : 'Open Link')}
                        </span>
                        <ExternalLink className="w-3 h-3 ms-0.5" />
                      </a>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-1">
                      {/* Mark as read toggle */}
                      {!item.isRead ? (
                        <button
                          type="button"
                          onClick={() => onMarkAsRead(item.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                          title={language === 'he' ? 'סמן כנקרא' : 'Mark as read'}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="p-1.5 text-slate-300 dark:text-slate-600">
                          <Check className="w-4 h-4" />
                        </span>
                      )}

                      {/* Delete notification */}
                      <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title={language === 'he' ? 'מחק התראה' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pop-up Footer Bar */}
        <div className="p-4 sm:p-4.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold">
              {language === 'he' ? 'מחובר לשידור התראות בזמן אמת (SSE)' : 'Connected to Real-time Stream (SSE)'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {notifications.length} {language === 'he' ? 'התראות במערכת' : 'total alerts'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold transition-colors shadow-2xs"
            >
              {language === 'he' ? 'סגור' : 'Close'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
