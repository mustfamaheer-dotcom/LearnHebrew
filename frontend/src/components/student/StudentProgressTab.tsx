import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import { useThemeStore } from '../../store/themeStore';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  Gamepad2,
  Flame,
  Sparkles,
  RefreshCw,
  Target,
  GraduationCap,
} from 'lucide-react';

interface StudentProgressTabProps {
  studentId: string;
}

interface ProgressAnalyticsResponse {
  student: {
    id: string;
    userId: string;
    level: string;
    totalPoints: number;
    streakDays: number;
    balance: number;
  };
  summary: {
    totalStudyHours: string;
    completedLessons: number;
    totalLessons: number;
    totalGamesPlayed: number;
    completedHomework: number;
    overallAttendanceRate: number;
  };
  weeklyAttendance: Array<{
    weekLabel: string;
    completedLessons: number;
    scheduledLessons: number;
    attendanceRate: number;
    points: number;
  }>;
  gameAccuracy: Array<{
    type: string;
    gamesPlayed: number;
    avgScore: number;
    accuracyRate: number;
  }>;
  progression: {
    currentLevel: string;
    currentLevelLabel: string;
    currentLevelLabelHe: string;
    nextLevelLabel: string;
    pointsToNextLevel: number;
    progressPercentage: number;
    milestones: Array<{
      level: string;
      label: string;
      labelHe: string;
      targetPoints: number;
      isCompleted: boolean;
      isCurrent: boolean;
    }>;
  };
}

export const StudentProgressTab: React.FC<StudentProgressTabProps> = ({ studentId }) => {
  const { language } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';

  const {
    data: analytics,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery<ProgressAnalyticsResponse>({
    queryKey: ['studentProgressAnalytics', studentId],
    queryFn: async () => {
      const res = await api.get(`/students/${studentId}/progress`);
      return res.data;
    },
    enabled: Boolean(studentId),
    staleTime: 60 * 1000,
  });

  const isHe = language === 'he';

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 rounded-3xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-80 rounded-3xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  if (isError || !analytics) {
    return (
      <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center mb-4 border border-rose-500/20">
          <Target className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {isHe ? 'שגיאה בטעינת נתוני ההתקדמות' : 'Failed to Load Progress Analytics'}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto mb-6">
          {isHe
            ? 'לא הצלחנו לאחזר את נתוני הלמידה שלך. אנא נסה שוב מאוחר יותר.'
            : 'Could not retrieve your learning progress data. Please try again in a moment.'}
        </p>
        <button
          onClick={() => refetch()}
          className="px-5 py-2.5 rounded-xl bg-brand-teal-700 hover:bg-brand-teal-800 text-white font-bold text-sm transition-all inline-flex items-center gap-2 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          {isHe ? 'נסה שוב' : 'Retry'}
        </button>
      </div>
    );
  }

  const { student, summary, weeklyAttendance, gameAccuracy, progression } = analytics;

  // Recharts theme-adaptive color tokens
  const gridStroke = isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';
  const axisStroke = isDark ? '#94a3b8' : '#64748b';
  const tooltipStyle = {
    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : '#ffffff',
    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.15)' : '#e2e8f0'}`,
    borderRadius: '16px',
    boxShadow: isDark
      ? '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
      : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
    color: isDark ? '#ffffff' : '#0f172a',
    fontSize: '12px',
    fontWeight: '600',
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Welcome / Header Banner with High-Contrast Brand Palette */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-teal-900 via-brand-teal-800 to-indigo-900 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-bold uppercase tracking-wider mb-3">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{isHe ? 'לוח התקדמות ומדדים' : 'Student Analytics'}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {isHe ? 'ההתקדמות הלימודית שלי' : 'My Learning Progress'}
            </h1>
            <p className="text-teal-100/90 text-sm mt-1 max-w-xl">
              {isHe
                ? 'מעקב שבועי אחר אחוזי נוכחות, צבירת נקודות XP, דיוק במשחקים ומסלול הדרגות בעברית.'
                : 'Visual tracking of your weekly attendance rate, points earned, practice accuracy, and Hebrew level milestones.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
              <span>{isHe ? 'רענן נתונים' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Summary Cards (Crystal-clear contrast in light & dark mode) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Rate */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-teal-400 dark:hover:border-teal-500/50 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {isHe ? 'אחוז נוכחות כולל' : 'Attendance Rate'}
            </span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {summary.overallAttendanceRate}%
            </span>
            <span className="text-xs text-teal-700 dark:text-teal-400 font-bold">
              {summary.completedLessons} {isHe ? 'הושלמו' : 'completed'}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(0, summary.overallAttendanceRate))}%` }}
            />
          </div>
        </div>

        {/* Study Time */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-cyan-400 dark:hover:border-cyan-500/50 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {isHe ? 'זמן למידה כולל' : 'Total Study Time'}
            </span>
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {summary.totalStudyHours}
            </span>
            <span className="text-xs text-cyan-700 dark:text-cyan-400 font-bold">
              {isHe ? 'שעות' : 'hours'}
            </span>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-3 truncate">
            {isHe
              ? `${summary.completedLessons} מתוך ${summary.totalLessons} שיעורים הושלמו`
              : `${summary.completedLessons} of ${summary.totalLessons} lessons completed`}
          </p>
        </div>

        {/* Total Points & Streak */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-amber-400 dark:hover:border-amber-500/50 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {isHe ? 'נקודות ורצף לימוד' : 'XP Points & Streak'}
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {(student.totalPoints || 0).toLocaleString()}
            </span>
            <span className="text-xs text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1">
              🔥 {student.streakDays || 0} {isHe ? 'ימי רצף' : 'days'}
            </span>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-3 truncate">
            {isHe
              ? `${summary.completedHomework} שיעורי בית הוגשו בהצלחה`
              : `${summary.completedHomework} homework submitted`}
          </p>
        </div>

        {/* Current Level */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-purple-400 dark:hover:border-purple-500/50 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {isHe ? 'דרגת עברית נוכחית' : 'Current Hebrew Level'}
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 dark:text-white truncate">
              {isHe ? progression.currentLevelLabelHe : progression.currentLevelLabel}
            </span>
          </div>
          <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-3 truncate font-bold">
            {progression.pointsToNextLevel > 0
              ? isHe
                ? `עוד ${progression.pointsToNextLevel} נק׳ לשלב הבא`
                : `${progression.pointsToNextLevel} pts to next level`
              : isHe
              ? 'רמה עליונה הושלמה!'
              : 'Max level achieved!'}
          </p>
        </div>
      </div>

      {/* Main Charts Row: Attendance Rate (Line/Area) & Points Earned (Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Attendance Rate Trend (Line / Area) */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>{isHe ? 'אחוז נוכחות בשיעורים לאורך זמן' : 'Weekly Lesson Attendance Rate'}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isHe
                  ? 'שיעור ההתייצבות והשלמת השיעורים ב-8 השבועות האחרונים'
                  : '8-week trend of attended vs scheduled lessons'}
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 font-bold shrink-0">
              {summary.overallAttendanceRate}% {isHe ? 'ממוצע' : 'avg'}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyAttendance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis
                  dataKey="weekLabel"
                  stroke={axisStroke}
                  fontSize={11}
                  fontWeight={500}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke={axisStroke}
                  fontSize={11}
                  fontWeight={500}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: any, name: any) => {
                    if (name === 'attendanceRate') return [`${value}%`, isHe ? 'נוכחות' : 'Attendance'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => `${isHe ? 'שבוע של' : 'Week of'} ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="attendanceRate"
                  stroke="#0d9488"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#attendanceGradient)"
                  dot={{ r: 4, fill: '#0d9488', stroke: isDark ? '#0f172a' : '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#14b8a6', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <span>{isHe ? '8 שבועות אחרונים' : 'Past 8 weeks'}</span>
            <span className="flex items-center gap-1.5 text-teal-700 dark:text-teal-300 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" />
              <span>{isHe ? 'אחוז התייצבות (%)' : 'Attendance Rate (%)'}</span>
            </span>
          </div>
        </div>

        {/* Chart 2: Points Earned per Week (Bar Chart) */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span>{isHe ? 'נקודות שנצברו שבועית' : 'Points Earned per Week'}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isHe
                  ? 'XP משיעורים, משחקים, רצפים ושיעורי בית'
                  : 'XP points gained from lessons, games, streaks & homework'}
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-bold shrink-0">
              {(student.totalPoints || 0)} XP
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyAttendance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="pointsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d97706" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis
                  dataKey="weekLabel"
                  stroke={axisStroke}
                  fontSize={11}
                  fontWeight={500}
                  tickLine={false}
                />
                <YAxis
                  stroke={axisStroke}
                  fontSize={11}
                  fontWeight={500}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: any) => [`${value} XP`, isHe ? 'נקודות' : 'XP Points']}
                  labelFormatter={(label) => `${isHe ? 'שבוע של' : 'Week of'} ${label}`}
                />
                <Bar
                  dataKey="points"
                  fill="url(#pointsGradient)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <span>{isHe ? 'פעילות שבועית' : 'Weekly activity'}</span>
            <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>{isHe ? 'נקודות XP' : 'XP Points'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Row: Game Accuracy Breakdown & Hebrew Level Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game Accuracy Breakdown */}
        <div className="lg:col-span-1 p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>{isHe ? 'דיוק במשחקי עברית' : 'Game Accuracy by Type'}</span>
              </h2>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {summary.totalGamesPlayed} {isHe ? 'משחקים' : 'sessions'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              {isHe
                ? 'שיעור ההצלחה שלך לפי סוג משחק אינטראקטיבי'
                : 'Performance and accuracy rate across interactive practice modes.'}
            </p>

            <div className="space-y-4">
              {gameAccuracy.map((game) => {
                const typeConfig: Record<string, { label: string; labelHe: string; color: string; barColor: string }> = {
                  FLASHCARD: {
                    label: 'Flashcards',
                    labelHe: 'כרטיסיות מילים',
                    color: 'text-cyan-700 dark:text-cyan-400',
                    barColor: 'from-cyan-500 to-blue-600',
                  },
                  QUIZ: {
                    label: 'Grammar Quiz',
                    labelHe: 'בחנים ודקדוק',
                    color: 'text-purple-700 dark:text-purple-400',
                    barColor: 'from-purple-500 to-pink-600',
                  },
                  MATCHING: {
                    label: 'Word Matching',
                    labelHe: 'התאמת מילים',
                    color: 'text-emerald-700 dark:text-emerald-400',
                    barColor: 'from-emerald-500 to-teal-600',
                  },
                };

                const config = typeConfig[game.type] || {
                  label: game.type,
                  labelHe: game.type,
                  color: 'text-teal-700 dark:text-teal-400',
                  barColor: 'from-teal-500 to-emerald-600',
                };

                return (
                  <div key={game.type} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {isHe ? config.labelHe : config.label}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {game.gamesPlayed} {isHe ? 'משחקים שוחקו' : 'rounds played'}
                        </p>
                      </div>
                      <span className={`text-base font-black ${config.color}`}>
                        {game.accuracyRate}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`bg-gradient-to-r ${config.barColor} h-2.5 rounded-full transition-all duration-700`}
                        style={{ width: `${Math.min(100, Math.max(0, game.accuracyRate))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{isHe ? 'חידוד תרגול מומלץ' : 'Recommended practice'}</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isHe ? 'שפר דיוק בעזרת כרטיסיות' : 'Practice Flashcards'}</span>
            </span>
          </div>
        </div>

        {/* Hebrew Level Progression Roadmap Timeline */}
        <div className="lg:col-span-2 p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span>{isHe ? 'מסלול התקדמות רמות בעברית' : 'Hebrew Level Progression Timeline'}</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isHe
                    ? 'אבני דרך מדרגת מתחילים (אל״ף) ועד שליטה מלאה (ו״ו)'
                    : 'Milestone roadmap from beginner (Alef) to native fluency (Vav)'}
                </p>
              </div>

              {/* Progress to next level pill */}
              {progression.pointsToNextLevel > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 text-xs font-bold text-purple-700 dark:text-purple-300">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  <span>
                    {isHe
                      ? `${progression.progressPercentage}% הושלמו ליעד הבא`
                      : `${progression.progressPercentage}% towards next level`}
                  </span>
                </div>
              )}
            </div>

            {/* Next level progress bar */}
            {progression.pointsToNextLevel > 0 && (
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-slate-50 to-amber-50 dark:from-purple-950/40 dark:to-slate-900/40 border border-purple-200 dark:border-purple-800/40">
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="text-purple-900 dark:text-purple-300">
                    {isHe ? 'התקדמות לשלב הבא:' : 'Progress to next milestone:'}
                  </span>
                  <span className="text-slate-900 dark:text-white font-extrabold">
                    {isHe
                      ? `עוד ${progression.pointsToNextLevel} נק׳ ליעד (${progression.nextLevelLabel})`
                      : `${progression.pointsToNextLevel} XP needed for ${progression.nextLevelLabel}`}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 h-2.5 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.max(0, progression.progressPercentage))}%` }}
                  />
                </div>
              </div>
            )}

            {/* Timeline Milestones */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {progression.milestones.map((lvl, index) => {
                const isCompleted = lvl.isCompleted && !lvl.isCurrent;
                const isCurrent = lvl.isCurrent;

                return (
                  <div
                    key={lvl.level}
                    className={`relative p-3.5 rounded-2xl border text-center transition-all flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-400 dark:border-purple-500 shadow-md ring-2 ring-purple-400/50'
                        : isCompleted
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/50'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Step indicator badge */}
                      <div className="flex justify-center mb-2">
                        {isCompleted ? (
                          <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-600 flex items-center justify-center font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : isCurrent ? (
                          <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center animate-pulse shadow-md">
                            ★
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold flex items-center justify-center">
                            {index + 1}
                          </div>
                        )}
                      </div>

                      <h4 className={`font-black text-xs truncate ${
                        isCurrent
                          ? 'text-purple-950 dark:text-white'
                          : isCompleted
                          ? 'text-emerald-950 dark:text-emerald-200'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {isHe ? lvl.labelHe : lvl.label}
                      </h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-block ${
                          isCurrent
                            ? 'bg-purple-200 dark:bg-purple-900/80 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-600'
                            : isCompleted
                            ? 'bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {isCompleted
                          ? isHe ? 'הושלם' : 'Passed'
                          : isCurrent
                          ? isHe ? 'נוכחי' : 'Current'
                          : `${lvl.targetPoints} XP`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>
              {isHe
                ? 'המורה מעדכן את הרמה בסיום כל שלב'
                : 'Teachers verify and graduate levels upon completion'}
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>{isHe ? 'הושלם' : 'Completed'}</span>
              </span>
              <span className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span>{isHe ? 'נוכחי' : 'Current'}</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span>{isHe ? 'נעול' : 'Locked'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
