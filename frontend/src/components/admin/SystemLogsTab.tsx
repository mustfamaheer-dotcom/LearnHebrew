import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import { toast } from '../../store/toastStore';
import { formatIsraelDateTime } from '../../lib/timeUtils';
import {
  Terminal,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Download,
  Trash2,
  RefreshCw,
  Filter,
  Copy,
  ExternalLink,
  ShieldAlert,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Activity,
  Layers,
  Zap,
  Globe,
  Radio,
  Eye,
  FileCode,
  Shield,
  Server,
  User,
} from 'lucide-react';

interface SystemLog {
  id: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  category: 'AUTH' | 'API' | 'LESSON' | 'BALANCE' | 'NOTIFICATION' | 'JOB' | 'SYSTEM' | 'SECURITY';
  message: string;
  statusCode: number | null;
  method: string | null;
  path: string | null;
  durationMs: number | null;
  userId: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
    role: string;
  } | null;
  ipAddress: string | null;
  userAgent: string | null;
  errorClass: string | null;
  stack: string | null;
  metaJson: any | null;
  createdAt: string;
}

export const SystemLogsTab: React.FC = () => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();

  // Filters state
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusCodeFilter, setStatusCodeFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isLive, setIsLive] = useState(true);

  // Detail drawer & Purge Modal state
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [purgeDays, setPurgeDays] = useState(30);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 1. Stats Query
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['systemLogsStats'],
    queryFn: async () => {
      const res = await api.get('/system-logs/stats');
      return res.data;
    },
    refetchInterval: isLive ? 15000 : false,
  });

  // 2. Logs Stream Query
  const { data: logsData, isLoading: isLogsLoading, isFetching: isLogsFetching, refetch } = useQuery({
    queryKey: ['systemLogs', page, limit, levelFilter, categoryFilter, searchTerm, statusCodeFilter, fromDate, toDate],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit };
      if (levelFilter !== 'ALL') params.level = levelFilter;
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusCodeFilter.trim()) params.statusCode = statusCodeFilter.trim();
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const res = await api.get('/system-logs', { params });
      return res.data;
    },
    refetchInterval: isLive ? 15000 : false,
  });

  // 3. Purge Mutation
  const purgeMutation = useMutation({
    mutationFn: async (days: number) => {
      const res = await api.delete('/system-logs/purge', { data: { days } });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['systemLogs'] });
      queryClient.invalidateQueries({ queryKey: ['systemLogsStats'] });
      setIsPurgeModalOpen(false);
      toast.success(
        language === 'he'
          ? `נמחקו ${data.deletedCount} יומנים ישנים בהצלחה`
          : `Successfully purged ${data.deletedCount} historical logs`,
        language === 'he' ? 'נוקה בהצלחה' : 'Purged'
      );
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to purge logs');
    },
  });

  // Export CSV Handler
  const handleExportCSV = async () => {
    try {
      const params: Record<string, any> = {};
      if (levelFilter !== 'ALL') params.level = levelFilter;
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const response = await api.get('/system-logs/export', {
        params,
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `engrew-logs-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(
        language === 'he' ? 'דוח יומנים יוצא בהצלחה לקובץ CSV' : 'System logs exported to CSV successfully',
        'Export'
      );
    } catch {
      toast.error('Failed to export CSV report');
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Severity UI configurations
  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
            <AlertOctagon className="w-3.5 h-3.5" />
            CRITICAL
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            ERROR
          </span>
        );
      case 'WARN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            WARN
          </span>
        );
      case 'INFO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-brand-teal-500/15 text-brand-teal-700 dark:text-brand-teal-300 border border-brand-teal-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            INFO
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30">
            DEBUG
          </span>
        );
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'SECURITY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40">
            <ShieldAlert className="w-3 h-3 text-rose-500" />
            Security
          </span>
        );
      case 'AUTH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/40">
            <Shield className="w-3 h-3 text-purple-500" />
            Auth
          </span>
        );
      case 'JOB':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/40">
            <Zap className="w-3 h-3 text-indigo-500" />
            Job Worker
          </span>
        );
      case 'BALANCE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40">
            <Activity className="w-3 h-3 text-emerald-500" />
            Balance
          </span>
        );
      case 'LESSON':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
            <Clock className="w-3 h-3 text-blue-500" />
            Lesson
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Globe className="w-3 h-3 text-slate-400" />
            {category}
          </span>
        );
    }
  };

  const getStatusChip = (code: number | null) => {
    if (!code) return <span className="text-slate-400 text-xs">—</span>;
    let colorClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    if (code >= 500) colorClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
    else if (code >= 400) colorClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
    else if (code >= 300) colorClass = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';

    return (
      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-mono font-bold border ${colorClass}`}>
        {code}
      </span>
    );
  };

  const kpis = statsData?.kpis;

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-teal-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-white/10">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-brand-olive-300 text-xs font-bold mb-3 border border-white/15">
              <Terminal className="w-3.5 h-3.5 text-brand-olive-400" />
              <span>{language === 'he' ? 'בקרת שרת ואירועים חיים' : 'Live Platform Telemetry & Observability'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              {language === 'he' ? 'יומן מערכת ובקרת שגיאות' : 'System Log & Error Center'}
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold tracking-wide">
                SUPER_ADMIN
              </span>
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1.5">
              {language === 'he'
                ? 'מעקב בזמן אמת אחר כל קריאות ה-API, שגיאות שרת, אבטחת כניסות, עבודות רקע ומדדי ביצועים.'
                : 'Real-time telemetry, error tracking, API performance latency, brute-force security incidents, and automated worker health.'}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Live Streaming Toggle */}
            <button
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                isLive
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle 15s auto-polling stream"
            >
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              {isLive ? (language === 'he' ? 'שידור חי (15 שניות)' : 'Live Feed (15s)') : (language === 'he' ? 'שידור מושהה' : 'Feed Paused')}
            </button>

            {/* Manual Refetch */}
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold border border-white/15 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLogsFetching ? 'animate-spin text-brand-teal-400' : ''}`} />
              <span>{language === 'he' ? 'רענן' : 'Refresh'}</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-brand-olive-500 hover:bg-brand-olive-600 text-brand-olive-950 text-xs font-bold shadow-md shadow-brand-olive-500/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{language === 'he' ? 'ייצוא CSV' : 'Export CSV'}</span>
            </button>

            {/* Purge Logs */}
            <button
              onClick={() => setIsPurgeModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold border border-rose-500/30 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{language === 'he' ? 'ניקוי יומנים' : 'Purge Old'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPI Telemetry Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Today */}
        <div className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              {language === 'he' ? 'סך אירועים היום' : 'Events Today'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-brand-teal-50 dark:bg-brand-teal-950/50 flex items-center justify-center text-brand-teal-700 dark:text-brand-teal-300">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {isStatsLoading ? '...' : kpis?.totalToday?.toLocaleString() || 0}
          </div>
          <div className="text-[11px] text-slate-400">
            {language === 'he' ? 'קריאות API ואירועי מערכת' : 'Total requests recorded today'}
          </div>
        </div>

        {/* Critical Incidents */}
        <div className={`rounded-2xl p-4 border shadow-2xs space-y-2 transition-all ${
          (kpis?.criticalToday || 0) > 0
            ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/60'
            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              {language === 'he' ? 'אירועים קריטיים' : 'Critical Incidents'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-600">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {isStatsLoading ? '...' : kpis?.criticalToday || 0}
          </div>
          <div className="text-[11px] text-rose-500/80 dark:text-rose-400/80">
            {(kpis?.criticalToday || 0) > 0
              ? (language === 'he' ? 'נדרשת תשומת לב מיידית' : 'Requires immediate attention')
              : (language === 'he' ? 'אין אירועים קריטיים' : 'System running smoothly')}
          </div>
        </div>

        {/* Error Rate */}
        <div className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              {language === 'he' ? 'שיעור שגיאות' : 'Error Rate'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {isStatsLoading ? '...' : kpis?.errorRate || '0.00%'}
          </div>
          <div className="text-[11px] text-slate-400">
            {kpis?.errorToday || 0} {language === 'he' ? 'שגיאות' : 'errors'} / {kpis?.warnToday || 0} {language === 'he' ? 'אזהרות' : 'warnings'}
          </div>
        </div>

        {/* Latency */}
        <div className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              {language === 'he' ? 'זמן תגובה ממוצע' : 'Avg Latency'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
            {isStatsLoading ? '...' : kpis?.avgResponseMs || 0}
            <span className="text-xs font-bold text-slate-400">ms</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {(kpis?.avgResponseMs || 0) < 150
              ? (language === 'he' ? 'ביצועים מעולים' : 'Sub-150ms blazing fast')
              : (language === 'he' ? 'זמן תגובה תקין' : 'Normal API throughput')}
          </div>
        </div>

        {/* Worker Health */}
        <div className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              {language === 'he' ? 'מנוע תזכורות' : 'Job Engine'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-black flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
              {kpis?.jobStatus || 'HEALTHY'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            {kpis?.jobRunsToday || 0} {language === 'he' ? 'הפעלות מוצלחות היום' : 'runs executed today'}
          </div>
        </div>
      </div>

      {/* 3. Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder={
                language === 'he'
                  ? 'חפש לפי הודעה, נתיב URL, כתובת IP, מחלקת שגיאה או אימייל...'
                  : 'Search logs by message, endpoint path, IP, error class or user...'
              }
              className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Level Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {['ALL', 'CRITICAL', 'ERROR', 'WARN', 'INFO', 'DEBUG'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  setLevelFilter(lvl);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  levelFilter === lvl
                    ? 'bg-brand-teal-800 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20"
            >
              <option value="ALL">{language === 'he' ? 'כל הקטגוריות' : 'All Categories'}</option>
              <option value="API">API Requests</option>
              <option value="AUTH">Authentication</option>
              <option value="SECURITY">Security Incidents</option>
              <option value="JOB">Job Workers</option>
              <option value="LESSON">Lesson Sessions</option>
              <option value="BALANCE">Wallet & Balance</option>
              <option value="NOTIFICATION">Notifications</option>
              <option value="SYSTEM">System & Governance</option>
            </select>

            {/* Clear All Filters */}
            {(levelFilter !== 'ALL' || categoryFilter !== 'ALL' || searchTerm || statusCodeFilter || fromDate || toDate) && (
              <button
                onClick={() => {
                  setLevelFilter('ALL');
                  setCategoryFilter('ALL');
                  setSearchTerm('');
                  setStatusCodeFilter('');
                  setFromDate('');
                  setToDate('');
                  setPage(1);
                }}
                className="px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Reset filters"
              >
                {language === 'he' ? 'אפס סינונים' : 'Reset'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Logs Table Stream */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">{language === 'he' ? 'רמת חומרה' : 'Severity'}</th>
                <th className="py-3.5 px-4">{language === 'he' ? 'קטגוריה' : 'Category'}</th>
                <th className="py-3.5 px-4">{language === 'he' ? 'הודעה ונתיב' : 'Message & Endpoint'}</th>
                <th className="py-3.5 px-3 text-center">{language === 'he' ? 'סטטוס' : 'Status'}</th>
                <th className="py-3.5 px-3 text-center">{language === 'he' ? 'זמן' : 'Latency'}</th>
                <th className="py-3.5 px-4">{language === 'he' ? 'משתמש / IP' : 'User / Client IP'}</th>
                <th className="py-3.5 px-4">{language === 'he' ? 'תאריך ושעה' : 'Timestamp (Israel)'}</th>
                <th className="py-3.5 px-4 text-center">{language === 'he' ? 'פעולות' : 'Details'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {isLogsLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-brand-teal-600" />
                      <span>{language === 'he' ? 'טוען יומני מערכת...' : 'Loading system event logs...'}</span>
                    </div>
                  </td>
                </tr>
              ) : !logsData?.logs || logsData.logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Terminal className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-500" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">
                      {language === 'he' ? 'לא נמצאו רשומות יומן' : 'No system logs matching criteria'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {language === 'he' ? 'נסה להרחיב את טווח הסינון או את מילות החיפוש' : 'Try clearing filters or search queries'}
                    </p>
                  </td>
                </tr>
              ) : (
                logsData.logs.map((log: SystemLog) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Severity */}
                    <td className="py-3 px-4 shrink-0 whitespace-nowrap">
                      {getLevelBadge(log.level)}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 shrink-0 whitespace-nowrap">
                      {getCategoryBadge(log.category)}
                    </td>

                    {/* Message & Method/Path */}
                    <td className="py-3 px-4 max-w-md">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {log.message}
                      </div>
                      {log.path && (
                        <div className="text-[11px] font-mono text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                          {log.method && (
                            <span className="font-bold text-slate-500 dark:text-slate-300">
                              {log.method}
                            </span>
                          )}
                          <span>{log.path}</span>
                        </div>
                      )}
                    </td>

                    {/* Status Code */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {getStatusChip(log.statusCode)}
                    </td>

                    {/* Duration Ms */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {log.durationMs !== null ? (
                        <span className={`text-[11px] font-mono font-medium ${
                          log.durationMs > 800
                            ? 'text-rose-600 font-bold'
                            : log.durationMs > 300
                            ? 'text-amber-600'
                            : 'text-slate-500'
                        }`}>
                          {log.durationMs}ms
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    {/* User / IP */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {log.user ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-brand-teal-100 dark:bg-brand-teal-900/40 text-brand-teal-700 dark:text-brand-teal-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {log.user.firstName?.[0] || 'U'}
                          </div>
                          <div className="truncate max-w-[130px]">
                            <span className="text-slate-800 dark:text-slate-200 font-medium">
                              {log.user.firstName} {log.user.lastName}
                            </span>
                            <span className="block text-[10px] text-slate-400 font-mono truncate">
                              {log.user.email}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="font-mono text-[11px] text-slate-400">
                          {log.ipAddress || 'System Internal'}
                        </span>
                      )}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                      {formatIsraelDateTime(log.createdAt, { includeDate: true, includeTzLabel: false })}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-brand-teal-50 dark:group-hover:bg-brand-teal-950/60 text-slate-500 group-hover:text-brand-teal-700 dark:group-hover:text-brand-teal-300 transition-colors"
                        title="View log details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Strip */}
        {logsData?.pagination && (
          <div className="px-4 py-3 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>
              {language === 'he' ? 'מציג' : 'Showing'}{' '}
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {logsData.logs.length}
              </span>{' '}
              {language === 'he' ? 'מתוך' : 'of'}{' '}
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {logsData.pagination.total}
              </span>{' '}
              {language === 'he' ? 'רשומות' : 'total logs'}
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-700 dark:text-slate-300 px-2">
                {page} / {Math.max(1, logsData.pagination.totalPages)}
              </span>
              <button
                disabled={page >= logsData.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Slide-Over Log Detail Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-fade-in">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedLog(null)}
          />

          {/* Drawer Container */}
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl border-s border-slate-200 dark:border-slate-800 flex flex-col z-10 overflow-hidden">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                {getLevelBadge(selectedLog.level)}
                {getCategoryBadge(selectedLog.category)}
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body Scroll */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
              {/* Message Banner */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {language === 'he' ? 'הודעת אירוע' : 'Event Message'}
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white break-words">
                  {selectedLog.message}
                </p>
              </div>

              {/* Technical Telemetry Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    HTTP Status
                  </span>
                  <div className="mt-1">{getStatusChip(selectedLog.statusCode)}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Execution Time
                  </span>
                  <div className="mt-1 font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                    {selectedLog.durationMs !== null ? `${selectedLog.durationMs} ms` : '—'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    HTTP Method
                  </span>
                  <div className="mt-1 font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                    {selectedLog.method || 'INTERNAL'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 col-span-2 sm:col-span-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Endpoint Path
                  </span>
                  <div className="mt-1 font-mono text-xs text-brand-teal-700 dark:text-brand-teal-300 break-all">
                    {selectedLog.path || '—'}
                  </div>
                </div>
              </div>

              {/* Client & Device Metadata */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {language === 'he' ? 'פרטי לקוח ורשת' : 'Client & Device Telemetry'}
                </h3>
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-slate-400">Client IP</span>
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                      {selectedLog.ipAddress || 'Internal'}
                    </span>
                  </div>
                  <div className="p-3 flex flex-col gap-1">
                    <span className="text-slate-400">User Agent</span>
                    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 break-all">
                      {selectedLog.userAgent || 'None'}
                    </span>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-slate-400">Timestamp</span>
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                      {formatIsraelDateTime(selectedLog.createdAt, { includeDate: true, includeTzLabel: true })}
                    </span>
                  </div>
                  {selectedLog.user && (
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-slate-400">Authenticated User</span>
                      <div className="text-end">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {selectedLog.user.firstName} {selectedLog.user.lastName} ({selectedLog.user.role})
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {selectedLog.user.email}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Stack Trace (If Error/Critical) */}
              {selectedLog.stack && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5" />
                      {language === 'he' ? 'עקבות קריאה (Stack Trace)' : 'Exception Stack Trace'}
                    </h3>
                    <button
                      onClick={() => copyToClipboard(selectedLog.stack!, 'stack')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      {copiedKey === 'stack' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Trace</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/30 text-rose-400 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-64 scrollbar-thin">
                    <pre>{selectedLog.stack}</pre>
                  </div>
                </div>
              )}

              {/* Context Metadata (metaJson) */}
              {selectedLog.metaJson && Object.keys(selectedLog.metaJson).length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {language === 'he' ? 'נתוני הקשר (Metadata JSON)' : 'Context Metadata (JSON)'}
                    </h3>
                    <button
                      onClick={() =>
                        copyToClipboard(JSON.stringify(selectedLog.metaJson, null, 2), 'meta')
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      {copiedKey === 'meta' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy JSON</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-60 scrollbar-thin">
                    <pre>{JSON.stringify(selectedLog.metaJson, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between shrink-0">
              <span className="text-[11px] font-mono text-slate-400">
                Log ID: {selectedLog.id}
              </span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-bold transition-colors"
              >
                {language === 'he' ? 'סגור' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Purge Logs Confirmation Modal */}
      {isPurgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'he' ? 'ניקוי יומני מערכת ישנים' : 'Purge Historical System Logs'}
                </h3>
                <p className="text-xs text-slate-400">
                  {language === 'he' ? 'שמירה על ביצועי מסד הנתונים וחיסכון במקום' : 'Optimize database size and retain compliant audit trails'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {language === 'he' ? 'מחק יומנים ישנים יותר מ:' : 'Delete logs older than:'}
              </label>
              <select
                value={purgeDays}
                onChange={(e) => setPurgeDays(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20"
              >
                <option value={7}>{language === 'he' ? '7 ימים' : '7 days'}</option>
                <option value={14}>{language === 'he' ? '14 ימים' : '14 days'}</option>
                <option value={30}>{language === 'he' ? '30 ימים (מומלץ)' : '30 days (Recommended)'}</option>
                <option value={60}>{language === 'he' ? '60 ימים' : '60 days'}</option>
                <option value={90}>{language === 'he' ? '90 ימים' : '90 days'}</option>
              </select>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              ⚠️ {language === 'he'
                ? 'פעולה זו תמחק לצמיתות את כל הרשומות הישנות מתאריך היעד. לא ניתן לבטל פעולה זו.'
                : 'This action will permanently delete all telemetry logs older than the chosen period. This cannot be undone.'}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPurgeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={purgeMutation.isPending}
                onClick={() => purgeMutation.mutate(purgeDays)}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center gap-2"
              >
                {purgeMutation.isPending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{language === 'he' ? 'מנקה...' : 'Purging...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === 'he' ? 'אשר מחיקה' : 'Confirm Purge'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
