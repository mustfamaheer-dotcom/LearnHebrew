import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import { toast } from '../../store/toastStore';
import {
  Bell,
  BellRing,
  Clock,
  Zap,
  Save,
  CheckCircle2,
  RefreshCw,
  Send,
  Sliders,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Volume2,
  Video,
  Radio,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface ReminderNotificationHubTabProps {
  currentUserRole?: string;
}

export const ReminderNotificationHubTab: React.FC<ReminderNotificationHubTabProps> = () => {
  const { language } = useTranslation();
  const isHe = language === 'he';
  const queryClient = useQueryClient();

  // Active sub-tab inside the hub
  const [hubTab, setHubTab] = useState<'rules' | 'broadcast' | 'history'>('rules');

  // Stats query
  const { data: statsData, isLoading: isStatsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['adminNotificationStats'],
    queryFn: async () => {
      const res = await api.get('/notifications/admin/stats');
      return res.data?.stats;
    },
    refetchInterval: 30 * 1000,
  });

  // Config query
  const { data: configData, refetch: refetchConfig } = useQuery({
    queryKey: ['adminNotificationConfig'],
    queryFn: async () => {
      const res = await api.get('/settings/notification-config');
      return res.data?.config;
    },
  });

  // Local form state for Reminder Rules
  const [leadMinutes, setLeadMinutes] = useState<number>(30);
  const [enableSoundChime, setEnableSoundChime] = useState<boolean>(true);
  const [includeZoomAction, setIncludeZoomAction] = useState<boolean>(true);
  const [enableUrgentCountdown, setEnableUrgentCountdown] = useState<boolean>(true);
  const [studentTitleEn, setStudentTitleEn] = useState('Lesson Reminder ({{minutes}}m)');
  const [studentTitleHe, setStudentTitleHe] = useState('תזכורת שיעור (בעוד {{minutes}} דקות)');

  // Sync state once config loads
  React.useEffect(() => {
    if (configData) {
      if (configData.lessonReminderMinutes) setLeadMinutes(Number(configData.lessonReminderMinutes));
      if (typeof configData.enableSoundChime === 'boolean') setEnableSoundChime(configData.enableSoundChime);
      if (typeof configData.includeZoomAction === 'boolean') setIncludeZoomAction(configData.includeZoomAction);
      if (typeof configData.enableUrgentCountdown === 'boolean') setEnableUrgentCountdown(configData.enableUrgentCountdown);
      if (configData.studentTitleEn) setStudentTitleEn(configData.studentTitleEn);
      if (configData.studentTitleHe) setStudentTitleHe(configData.studentTitleHe);
    }
  }, [configData]);

  // Update Config Mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.put('/settings/notification-config', { config: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotificationConfig'] });
      queryClient.invalidateQueries({ queryKey: ['adminNotificationStats'] });
      toast.success(
        isHe ? 'כללי התזכורת נשמרו בהצלחה במנוע ההתראות!' : 'Reminder engine rules saved successfully!',
        isHe ? 'נשמר בהצלחה' : 'Settings Saved'
      );
    },
    onError: () => {
      toast.error(
        isHe ? 'שגיאה בשמירת הגדרות התזכורת' : 'Failed to save reminder settings'
      );
    },
  });

  // Trigger Manual Sweep Mutation
  const triggerSweepMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/notifications/reminders/trigger-check');
      return res.data;
    },
    onSuccess: (data) => {
      refetchStats();
      queryClient.invalidateQueries({ queryKey: ['adminNotificationsAll'] });
      toast.success(
        isHe
          ? `סריקה הושלמה: נבדקו שיעורים בטווח ${data.leadMinutes} דק׳ (${data.dispatchedCount} תזכורות נשלחו)`
          : `Sweep complete: Scanned ${data.leadMinutes}m window (${data.dispatchedCount} reminders dispatched)`,
        isHe ? 'סריקת מנוע הושלמה' : 'Sweep Executed'
      );
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to trigger sweep');
    },
  });

  // Broadcast Studio State
  const [broadcastTarget, setBroadcastTarget] = useState<'ALL' | 'STUDENT' | 'TEACHER'>('ALL');
  const [broadcastPriority, setBroadcastPriority] = useState<'NORMAL' | 'HIGH'>('NORMAL');
  const [broadcastTitleEn, setBroadcastTitleEn] = useState('');
  const [broadcastTitleHe, setBroadcastTitleHe] = useState('');
  const [broadcastBodyEn, setBroadcastBodyEn] = useState('');
  const [broadcastBodyHe, setBroadcastBodyHe] = useState('');
  const [broadcastActionUrl, setBroadcastActionUrl] = useState('');

  // Send Broadcast Mutation
  const broadcastMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/notifications/broadcast', payload);
    },
    onSuccess: (res: any) => {
      toast.success(
        isHe
          ? `הודעת שידור נשלחה בהצלחה אל ${res.data?.recipientCount || 'כל'} משתמשים!`
          : `Broadcast dispatched successfully to ${res.data?.recipientCount || 'all'} recipients!`,
        isHe ? 'השידור הושלם' : 'Broadcast Sent'
      );
      setBroadcastTitleEn('');
      setBroadcastTitleHe('');
      setBroadcastBodyEn('');
      setBroadcastBodyHe('');
      setBroadcastActionUrl('');
      refetchStats();
      queryClient.invalidateQueries({ queryKey: ['adminNotificationsAll'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to send broadcast');
    },
  });

  // Audit Log State
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [historyCategory, setHistoryCategory] = useState<string>('ALL');
  const [historySearch, setHistorySearch] = useState<string>('');

  const { data: auditData, isLoading: isAuditLoading, refetch: refetchAudit } = useQuery({
    queryKey: ['adminNotificationsAll', historyPage, historyCategory, historySearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(historyPage),
        limit: '20',
      });
      if (historyCategory !== 'ALL') params.set('category', historyCategory);
      if (historySearch.trim()) params.set('search', historySearch.trim());
      const res = await api.get(`/notifications/admin/all?${params.toString()}`);
      return res.data;
    },
  });

  const handleSaveRules = () => {
    updateConfigMutation.mutate({
      lessonReminderMinutes: leadMinutes,
      enableSoundChime,
      includeZoomAction,
      enableUrgentCountdown,
      studentTitleEn,
      studentTitleHe,
    });
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitleEn || !broadcastTitleHe || !broadcastBodyEn || !broadcastBodyHe) {
      toast.error(isHe ? 'נא למלא את כל שדות הכותרת והתוכן (עברית ואנגלית)' : 'Please fill in both English and Hebrew fields');
      return;
    }

    broadcastMutation.mutate({
      titleEn: broadcastTitleEn,
      titleHe: broadcastTitleHe,
      bodyEn: broadcastBodyEn,
      bodyHe: broadcastBodyHe,
      targetRole: broadcastTarget,
      priority: broadcastPriority,
      actionUrl: broadcastActionUrl || undefined,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Header Banner with Live Engine Controls */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-teal-900 via-brand-teal-800 to-indigo-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-bold uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-300" />
              <span>{isHe ? 'מנוע אוטומטי פעיל' : 'Live Notification Engine'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <BellRing className="w-7 h-7 text-teal-300" />
              <span>{isHe ? 'מנוע תזכורות ומרכז התראות' : 'Pre-Lesson Reminder Engine & Notification Hub'}</span>
            </h1>
            <p className="text-teal-100/90 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {isHe
                ? 'ניהול מקיף של תזכורות שיעור אוטומטיות (כל 60 שניות), ערוצי שידור מיידיים (SSE), והתאמה אישית של הודעות שידור בזמן אמת.'
                : 'Automated 60-second countdown alert worker, multi-stage notification rules, real-time SSE broadcasts, and live dispatch audit logs.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => triggerSweepMutation.mutate()}
              disabled={triggerSweepMutation.isPending}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${triggerSweepMutation.isPending ? 'animate-spin' : ''}`} />
              <span>{triggerSweepMutation.isPending ? (isHe ? 'סורק עכשיו...' : 'Scanning...') : (isHe ? 'הפעל סריקה מיידית' : 'Trigger Sweep Now')}</span>
            </button>
            <button
              onClick={() => {
                refetchStats();
                refetchConfig();
                refetchAudit();
              }}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
              title={isHe ? 'רענן נתונים' : 'Refresh Hub'}
            >
              <RefreshCw className={`w-4 h-4 ${isStatsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Worker Status */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isHe ? 'סטטוס מנוע רקע' : 'Background Worker'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-lg font-black text-slate-900 dark:text-white">
                {isHe ? 'פעיל (60 שנ׳)' : 'Active (60s)'}
              </span>
            </div>
            <p className="text-[11px] font-bold text-teal-700 dark:text-teal-400 mt-1">
              {statsData?.currentLeadMinutes || 30} {isHe ? 'דקות לפני שיעור' : 'min lead window'}
            </p>
          </div>
        </div>

        {/* Reminders Dispatched */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isHe ? 'תזכורות שנשלחו' : 'Reminders Sent'}
            </span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/60">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {statsData?.totalRemindersDispatched || 0}
            </span>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
              {isHe ? 'תזכורות מתוזמנות' : 'Automated pre-class alerts'}
            </p>
          </div>
        </div>

        {/* Upcoming Radar */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isHe ? 'שיעורים ב-24 שעות' : 'Upcoming in 24h'}
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {statsData?.upcomingLessonsNext24h || 0}
            </span>
            <p className="text-[11px] font-semibold text-purple-700 dark:text-purple-400 mt-1">
              {isHe ? 'יעד לסריקת המנוע' : 'In reminder radar window'}
            </p>
          </div>
        </div>

        {/* Broadcasts & Active Clients */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isHe ? 'שידורים וחיבורי SSE' : 'Broadcasts & SSE'}
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {statsData?.totalBroadcastsSent || 0}
            </span>
            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 mt-1">
              {statsData?.activeSubscribers || 0} {isHe ? 'משתמשים מחוברים כעת' : 'active SSE streams'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setHubTab('rules')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            hubTab === 'rules'
              ? 'bg-brand-teal-800 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{isHe ? 'כללי תזכורת אוטומטיים' : '1. Reminder Engine Rules'}</span>
        </button>

        <button
          onClick={() => setHubTab('broadcast')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            hubTab === 'broadcast'
              ? 'bg-brand-teal-800 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>{isHe ? 'אולפן שידור הודעות חי' : '2. Live Broadcast Studio'}</span>
        </button>

        <button
          onClick={() => setHubTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            hubTab === 'history'
              ? 'bg-brand-teal-800 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-teal-400" />
          <span>{isHe ? 'יומן התראות שנשלחו' : '3. Dispatch History & Audit'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {statsData?.totalNotificationsAllTime || 0}
          </span>
        </button>
      </div>

      {/* 4. Tab 1: Reminder Engine Rules */}
      {hubTab === 'rules' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span>{isHe ? 'זמן תזכורת מקדימה (Lead Time)' : 'Automated Reminder Lead Timing'}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isHe
                    ? 'קביעת מספר הדקות לפני תחילת השיעור בו מנוע הרקע מייצר התראה אינטראקטיבית.'
                    : 'Configure how many minutes before session start the automated background worker alerts participants.'}
                </p>
              </div>

              {/* Presets */}
              <div className="grid grid-cols-5 gap-2">
                {[15, 30, 45, 60, 120].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setLeadMinutes(mins)}
                    className={`py-2.5 px-1 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                      leadMinutes === mins
                        ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                    }`}
                  >
                    {mins} {isHe ? 'דק׳' : 'Min'}
                  </button>
                ))}
              </div>

              {/* Slider & Exact Input */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">
                    {isHe ? 'כוונון מדויק (בדקות):' : 'Fine-Tune Minutes:'}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-black">
                    {leadMinutes} {isHe ? 'דקות לפני המפגש' : 'Minutes Before'}
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={180}
                  step={5}
                  value={leadMinutes}
                  onChange={(e) => setLeadMinutes(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {isHe ? 'צליל התראה אינטראקטיבי (Sound Chime)' : 'Interactive Audio Chime'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isHe ? 'משמיע צליל פעמון עדין במכשיר התלמיד והמורה' : 'Play a soft bell chime on student/teacher screen'}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableSoundChime}
                    onChange={(e) => setEnableSoundChime(e.target.checked)}
                    className="w-4 h-4 accent-teal-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {isHe ? 'כפתור כניסה ישירה לזום בהתראה' : 'Direct Zoom Button Link'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isHe ? 'מציג כפתור "הצטרף לשיעור עכשיו" בהתראה' : 'One-click launch Zoom session from the toast'}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeZoomAction}
                    onChange={(e) => setIncludeZoomAction(e.target.checked)}
                    className="w-4 h-4 accent-teal-600 rounded"
                  />
                </label>
              </div>

              {/* Bilingual Notification Templates */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                  {isHe ? 'תבניות כותרת התראה (EN & HE)' : 'Notification Title Templates'}
                </h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Title Template (English)
                    </label>
                    <input
                      type="text"
                      value={studentTitleEn}
                      onChange={(e) => setStudentTitleEn(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Title Template (Hebrew)
                    </label>
                    <input
                      type="text"
                      dir="rtl"
                      value={studentTitleHe}
                      onChange={(e) => setStudentTitleHe(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveRules}
                  disabled={updateConfigMutation.isPending}
                  className="w-full py-3 rounded-xl bg-brand-teal-800 hover:bg-brand-teal-900 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-brand-olive-300" />
                  <span>{updateConfigMutation.isPending ? (isHe ? 'שומר...' : 'Saving...') : (isHe ? 'שמור את כל כללי מנוע התזכורות' : 'Save Reminder Engine Rules')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Notification Card Preview */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{isHe ? 'תצוגה מקדימה חיה' : 'Live Participant Toast Preview'}</span>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-900 to-slate-900 text-white border border-teal-500/40 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-500/30 text-teal-300 flex items-center justify-center font-bold">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-black">
                      {isHe ? studentTitleHe.replace('{{minutes}}', String(leadMinutes)) : studentTitleEn.replace('{{minutes}}', String(leadMinutes))}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    {leadMinutes}m
                  </span>
                </div>

                <p className="text-xs text-teal-100/90 leading-relaxed">
                  {isHe
                    ? `השיעור הפרטי שלך עם שרה כהן מתחיל בעוד ${leadMinutes} דקות! נא לוודא חיבור יציב ומיקרופון פועל.`
                    : `Your 25-minute 1-on-1 Hebrew lesson with Sarah Cohen starts in ${leadMinutes} minutes!`}
                </p>

                {includeZoomAction && (
                  <div className="pt-2">
                    <button
                      type="button"
                      className="w-full py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>{isHe ? 'כניסה ישירה לשיעור בזום' : 'Join Zoom Session'}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <Info className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>{isHe ? 'מנגנון מניעת כפילויות' : 'Idempotency Protection'}</span>
                </div>
                <p>
                  {isHe
                    ? 'כל שיעור מסומן ב-DB עם שדה reminderSentAt כדי להבטיח שלעולם לא תישלח יותר מתזכורת אחת לאותו מפגש.'
                    : 'Each lesson is locked via reminderSentAt in PostgreSQL to guarantee exactly-once reminder dispatch under high concurrency.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Live Broadcast Studio */}
      {hubTab === 'broadcast' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <form onSubmit={handleSendBroadcast} className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <span>{isHe ? 'שידור התראה גלובלית בזמן אמת (SSE Live Push)' : 'Global Real-Time Broadcast Dispatcher'}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isHe
                    ? 'שליחת הודעת שידור מיידית המופיעה בראש המסך ובמגירת ההתראות של כל המשתמשים המחוברים.'
                    : 'Broadcast an immediate system notification pushed through Server-Sent Events to all connected users.'}
                </p>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  {isHe ? 'קהל יעד' : 'Target Audience:'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'ALL', labelEn: 'All Users', labelHe: 'כל המשתמשים' },
                    { id: 'STUDENT', labelEn: 'Students Only', labelHe: 'תלמידים בלבד' },
                    { id: 'TEACHER', labelEn: 'Teachers Only', labelHe: 'מורים בלבד' },
                  ].map((target) => (
                    <button
                      key={target.id}
                      type="button"
                      onClick={() => setBroadcastTarget(target.id as any)}
                      className={`py-2 px-2 text-center rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        broadcastTarget === target.id
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {isHe ? target.labelHe : target.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  {isHe ? 'רמת דחיפות' : 'Priority Level:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBroadcastPriority('NORMAL')}
                    className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      broadcastPriority === 'NORMAL'
                        ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isHe ? 'רגיל (התראה שקטה)' : 'Normal (Standard Notification)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastPriority('HIGH')}
                    className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      broadcastPriority === 'HIGH'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isHe ? 'דחוף (צליל פעמון מיידי)' : 'Urgent (Instant Audio Ping)'}
                  </button>
                </div>
              </div>

              {/* Bilingual Titles */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Notification Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. System Maintenance Notice"
                    value={broadcastTitleEn}
                    onChange={(e) => setBroadcastTitleEn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    כותרת ההתראה (עברית) *
                  </label>
                  <input
                    type="text"
                    required
                    dir="rtl"
                    placeholder="למשל: עדכון שרתים מתוזמן"
                    value={broadcastTitleHe}
                    onChange={(e) => setBroadcastTitleHe(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Bilingual Body Content */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Message Body (English) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Type broadcast message in English..."
                    value={broadcastBodyEn}
                    onChange={(e) => setBroadcastBodyEn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    תוכן ההודעה (עברית) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    dir="rtl"
                    placeholder="הקלד את הודעת השידור בעברית..."
                    value={broadcastBodyHe}
                    onChange={(e) => setBroadcastBodyHe(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Action URL */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {isHe ? 'קישור לפעולה (אופציונלי)' : 'Action Link URL (Optional):'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. /student/games or /teacher/schedule"
                  value={broadcastActionUrl}
                  onChange={(e) => setBroadcastActionUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={broadcastMutation.isPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{broadcastMutation.isPending ? (isHe ? 'משדר לכל המשתמשים...' : 'Broadcasting...') : (isHe ? 'שדר התראה מיידית לכל המשתמשים' : 'Dispatch Live Broadcast to Audience')}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Broadcast Preview */}
          <div>
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{isHe ? 'תצוגה מקדימה לשידור' : 'Real-time Live Preview'}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 text-white border border-amber-500/30 shadow-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-black text-white truncate max-w-[180px]">
                      {isHe ? broadcastTitleHe || 'כותרת ההתראה...' : broadcastTitleEn || 'Broadcast title...'}
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    {broadcastPriority}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {isHe
                    ? broadcastBodyHe || 'תוכן ההודעה כפי שיופיע במגירת ההתראות...'
                    : broadcastBodyEn || 'Message body as rendered in notification drawer...'}
                </p>

                {broadcastActionUrl && (
                  <div className="pt-1">
                    <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      {broadcastActionUrl}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <p>
                  {isHe
                    ? 'השידור נשמר אוטומטית בהיסטוריית ההתראות של כל משתמש בקהל היעד ומשודר באופן מיידי לכל הדפדפנים המחוברים.'
                    : 'Broadcasts are saved to each recipient notification record and instantly delivered via live SSE connections.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Tab 3: Dispatch History & Audit Stream */}
      {hubTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>{isHe ? 'יומן התראות ותזכורות שנשלחו' : 'Dispatched Notifications Audit Stream'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isHe
                  ? 'פירוט מלא של כל ההתראות שנשלחו במערכת, זמני שיגור, נמענים וסטטוס קריאה.'
                  : 'Complete history of all reminders, broadcasts, and automated alerts with recipient read statuses.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={isHe ? 'חיפוש לפי שם, אימייל או תוכן...' : 'Search recipient or text...'}
                  value={historySearch}
                  onChange={(e) => {
                    setHistorySearch(e.target.value);
                    setHistoryPage(1);
                  }}
                  className="ps-9 pe-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              <select
                value={historyCategory}
                onChange={(e) => {
                  setHistoryCategory(e.target.value);
                  setHistoryPage(1);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="ALL">{isHe ? 'כל הקטגוריות' : 'All Categories'}</option>
                <option value="REMINDER">{isHe ? 'תזכורות שיעור' : 'Reminders'}</option>
                <option value="LESSON">{isHe ? 'שיעורים והזמנות' : 'Lessons'}</option>
                <option value="HOMEWORK">{isHe ? 'שיעורי בית' : 'Homework'}</option>
                <option value="RECORDING">{isHe ? 'הקלטות' : 'Recordings'}</option>
                <option value="SYSTEM">{isHe ? 'שידורי מערכת' : 'System Broadcasts'}</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 text-start">{isHe ? 'נמען' : 'Recipient'}</th>
                  <th className="py-3 px-4 text-start">{isHe ? 'קטגוריה וסוג' : 'Category / Type'}</th>
                  <th className="py-3 px-4 text-start">{isHe ? 'תוכן ההתראה' : 'Notification Content'}</th>
                  <th className="py-3 px-4 text-start">{isHe ? 'מועד שליחה' : 'Dispatched At'}</th>
                  <th className="py-3 px-4 text-start">{isHe ? 'סטטוס קריאה' : 'Read Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isAuditLoading && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                      <span>{isHe ? 'טוען יומן התראות...' : 'Loading notification stream...'}</span>
                    </td>
                  </tr>
                )}

                {!isAuditLoading && (auditData?.notifications || []).map((notif: any) => (
                  <tr key={notif.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Recipient */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-teal-600 to-indigo-600 text-white font-black text-[10px] flex items-center justify-center">
                          {notif.user?.firstName?.[0] || 'U'}
                          {notif.user?.lastName?.[0] || ''}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white">
                            {notif.user?.firstName} {notif.user?.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400">{notif.user?.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          notif.category === 'REMINDER'
                            ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                            : notif.type === 'BROADCAST_ANNOUNCEMENT'
                            ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300'
                            : 'bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300'
                        }`}>
                          {notif.category || 'SYSTEM'}
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono">{notif.type}</p>
                      </div>
                    </td>

                    {/* Content */}
                    <td className="py-3 px-4 max-w-xs sm:max-w-md">
                      <p className="font-extrabold text-slate-900 dark:text-white truncate">
                        {isHe && notif.titleHe ? notif.titleHe : notif.titleEn}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {isHe && notif.bodyHe ? notif.bodyHe : notif.bodyEn}
                      </p>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px]">
                      {new Date(notif.createdAt).toLocaleString(isHe ? 'he-IL' : 'en-US', {
                        timeZone: 'Asia/Jerusalem',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Read Status */}
                    <td className="py-3 px-4">
                      {notif.isRead ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isHe ? 'נקרא' : 'Read'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{isHe ? 'טרם נקרא' : 'Unread'}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {!isAuditLoading && (auditData?.notifications || []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      {isHe ? 'לא נמצאו התראות תואמות לחיפוש' : 'No notifications found matching criteria'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {(auditData?.totalPages || 1) > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {isHe
                  ? `עמוד ${historyPage} מתוך ${auditData?.totalPages || 1} (${auditData?.totalCount || 0} רשומות)`
                  : `Page ${historyPage} of ${auditData?.totalPages || 1} (${auditData?.totalCount || 0} total records)`}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                  disabled={historyPage <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setHistoryPage((p) => Math.min(auditData?.totalPages || 1, p + 1))}
                  disabled={historyPage >= (auditData?.totalPages || 1)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

