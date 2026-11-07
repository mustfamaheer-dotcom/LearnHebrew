import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
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
        <div className="h-28 rounded-3xl bg-white/[0.04] border border-white/10" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-white/[0.03] border border-white/5" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-3xl bg-white/[0.03] border border-white/5" />
          <div className="h-80 rounded-3xl bg-white/[0.03] border border-white/5" />
        </div>
      </div>
    );
  }

  if (isError || !analytics) {
    return (
      <div className="p-12 text-center rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center mb-4 border border-rose-500/30">
          <Target className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          {isHe ? 'שגיאה בטעינת נתוני ההתקדמות' : 'Failed to Load Progress Analytics'}
        </h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
          {isHe
            ? 'לא הצלחנו לאחזר את נתוני הלמידה שלך. אנא נסה שוב מאוחר יותר.'
            : 'Could not retrieve your learning progress data. Please try again in a moment.'}
        </p>
        <button
          onClick={() => refetch()}
          className="px-5 py-2.5 rounded-xl bg-brand-teal-500/20 text-teal-300 border border-teal-500/30 hover:bg-brand-teal-500/30 font-semibold text-sm transition-all inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {isHe ? 'נסה שוב' : 'Retry'}
        </button>
      </div>
    );
  }

  const { student, summary, weeklyAttendance, gameAccuracy, progression } = analytics;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-teal-900/30 via-slate-900/60 to-purple-900/30 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold uppercase tracking-wider mb-3">
              <TrendingUp className="w-3.5 h-3.5" />
              {isHe ? 'לוח התקדמות ומדדים' : 'Student Analytics'}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {isHe ? 'ההתקדמות הלימודית שלי' : 'My Learning Progress'}
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              {isHe
                ? 'מעקב שבועי אחר אחוזי נוכחות, צבירת נקודות XP, דיוק במשחקים ומסלול הדרגות בעברית.'
                : 'Visual tracking of your weekly attendance rate, points earned, practice accuracy, and Hebrew level milestones.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-medium transition-all flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
              {isHe ? 'רענן נתונים' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Rate */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl hover:border-teal-500/30 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">
              {isHe ? 'אחוז נוכחות כולל' : 'Attendance Rate'}
            </span>
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{summary.overallAttendanceRate}%</span>
            <span className="text-xs text-teal-400 font-medium">
              {summary.completedLessons} {isHe ? 'הושלמו' : 'completed'}
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-400 to-emerald-400 h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(0, summary.overallAttendanceRate))}%` }}
            />
          </div>
        </div>

        {/* Study Time */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl hover:border-cyan-500/30 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">
              {isHe ? 'זמן למידה כולל' : 'Total Study Time'}
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{summary.totalStudyHours}</span>
            <span className="text-xs text-cyan-400 font-medium">{isHe ? 'שעות' : 'hours'}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 truncate">
            {isHe
              ? `${summary.completedLessons} מתוך ${summary.totalLessons} שיעורים`
              : `${summary.completedLessons} of ${summary.totalLessons} lessons completed`}
          </p>
        </div>

        {/* Total Points & Streak */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl hover:border-amber-500/30 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">
              {isHe ? 'נקודות ורצף לימוד' : 'XP Points & Streak'}
            </span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{(student.totalPoints || 0).toLocaleString()}</span>
            <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
              🔥 {student.streakDays || 0} {isHe ? 'ימי רצף' : 'days'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 truncate">
            {isHe ? `${summary.completedHomework} שיעורי בית הוגשו` : `${summary.completedHomework} homework submitted`}
          </p>
        </div>

        {/* Current Level */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl hover:border-purple-500/30 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">
              {isHe ? 'דרגת עברית נוכחית' : 'Current Hebrew Level'}
            </span>
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-white truncate">
              {isHe ? progression.currentLevelLabelHe : progression.currentLevelLabel}
            </span>
          </div>
          <p className="text-[11px] text-purple-300 mt-3 truncate font-medium">
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
        <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-400" />
                {isHe ? 'אחוז נוכחות בשיעורים לאורך זמן' : 'Weekly Lesson Attendance Rate'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isHe
                  ? 'שיעור ההתייצבות והשלמת השיעורים ב-8 השבועות האחרונים'
                  : '8-week trend of attended vs scheduled lessons'}
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 font-semibold">
              {summary.overallAttendanceRate}% {isHe ? 'ממוצע' : 'avg'}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyAttendance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="weekLabel"
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={11}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value: any, name: any) => {
                    if (name === 'attendanceRate') return [`${value}%`, isHe ? 'נוכחות' : 'Attendance'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => `${isHe ? 'שבוע של' : 'Week of'} ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="attendanceRate"
                  stroke="#14b8a6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#attendanceGradient)"
                  dot={{ r: 4, fill: '#14b8a6', stroke: '#0f172a', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#2dd4bf', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/5 text-xs text-slate-400">
            <span>{isHe ? '8 שבועות אחרונים' : 'Past 8 weeks'}</span>
            <span className="flex items-center gap-1.5 text-teal-300">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block" />
              {isHe ? 'אחוז התייצבות (%)' : 'Attendance Rate (%)'}
            </span>
          </div>
        </div>

        {/* Chart 2: Points Earned per Week (Bar Chart) */}
        <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                {isHe ? 'נקודות שנצברו שבועית' : 'Points Earned per Week'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isHe
                  ? 'XP משיעורים, משחקים, רצפים ושיעורי בית'
                  : 'XP points gained from lessons, games, streaks & homework'}
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
              {(student.totalPoints || 0)} XP
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyAttendance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="pointsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#d97706" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="weekLabel"
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={11}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                    color: '#fff',
                    fontSize: '12px',
                  }}
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

          <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/5 text-xs text-slate-400">
            <span>{isHe ? 'פעילות שבועית' : 'Weekly activity'}</span>
            <span className="flex items-center gap-1.5 text-amber-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              {isHe ? 'נקודות XP' : 'XP Points'}
            </span>
          </div>
        </div>
      </div>

      {/* Row: Game Accuracy Breakdown & Hebrew Level Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game Accuracy Breakdown */}
        <div className="lg:col-span-1 p-6 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-indigo-400" />
                {isHe ? 'דיוק במשחקי עברית' : 'Game Accuracy by Type'}
              </h2>
              <span className="text-xs text-slate-400">
                {summary.totalGamesPlayed} {isHe ? 'משחקים' : 'sessions'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              {isHe
                ? 'שיעור ההצלחה שלך לפי סוג משחק אינטראקטיבי'
                : 'Performance and accuracy rate across interactive practice modes.'}
            </p>

            <div className="space-y-5">
              {gameAccuracy.map((game) => {
                const typeConfig: Record<string, { label: string; labelHe: string; color: string; barColor: string }> = {
                  FLASHCARD: {
                    label: 'Flashcards',
                    labelHe: 'כרטיסיות מילים',
                    color: 'text-cyan-400',
                    barColor: 'from-cyan-500 to-blue-500',
                  },
                  QUIZ: {
                    label: 'Grammar Quiz',
                    labelHe: 'בחנים ודקדוק',
                    color: 'text-purple-400',
                    barColor: 'from-purple-500 to-pink-500',
                  },
                  MATCHING: {
                    label: 'Word Matching',
                    labelHe: 'התאמת מילים',
                    color: 'text-emerald-400',
                    barColor: 'from-emerald-500 to-teal-500',
                  },
                };

                const config = typeConfig[game.type] || {
                  label: game.type,
                  labelHe: game.type,
                  color: 'text-teal-400',
                  barColor: 'from-teal-500 to-emerald-500',
                };

                return (
                  <div key={game.type} className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold text-white">
                          {isHe ? config.labelHe : config.label}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {game.gamesPlayed} {isHe ? 'משחקים שוחקו' : 'rounds played'}
                        </p>
                      </div>
                      <span className={`text-base font-extrabold ${config.color}`}>
                        {game.accuracyRate}%
                      </span>
                    </div>

                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div
                        className={`bg-gradient-to-r ${config.barColor} h-2 rounded-full transition-all duration-700`}
                        style={{ width: `${Math.min(100, Math.max(0, game.accuracyRate))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>{isHe ? 'חידוד תרגול מומלץ' : 'Recommended practice'}</span>
            <span className="text-indigo-300 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {isHe ? 'שפר דיוק בעזרת כרטיסיות' : 'Practice Flashcards'}
            </span>
          </div>
        </div>

        {/* Hebrew Level Progression Roadmap Timeline */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-400" />
                  {isHe ? 'מסלול התקדמות רמות בעברית' : 'Hebrew Level Progression Timeline'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {isHe
                    ? 'אבני דרך מדרגת מתחילים (אל״ף) ועד שליטה מלאה (ו״ו)'
                    : 'Milestone roadmap from beginner (Alef) to native fluency (Vav)'}
                </p>
              </div>

              {/* Progress to next level pill */}
              {progression.pointsToNextLevel > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
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
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 to-slate-900/40 border border-purple-500/20">
                <div className="flex items-center justify-between text-xs font-semibold mb-2">
                  <span className="text-purple-300">
                    {isHe ? 'התקדמות לשלב הבא:' : 'Progress to next milestone:'}
                  </span>
                  <span className="text-white font-bold">
                    {isHe
                      ? `עוד ${progression.pointsToNextLevel} נק׳ ליעד (${progression.nextLevelLabel})`
                      : `${progression.pointsToNextLevel} XP needed for ${progression.nextLevelLabel}`}
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 h-2.5 rounded-full transition-all duration-700"
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
                        ? 'bg-purple-500/20 border-purple-400/50 shadow-[0_0_20px_rgba(192,132,252,0.25)] ring-2 ring-purple-400/40'
                        : isCompleted
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                        : 'bg-white/[0.02] border-white/5 opacity-60'
                    }`}
                  >
                    <div>
                      {/* Step indicator badge */}
                      <div className="flex justify-center mb-2">
                        {isCompleted ? (
                          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : isCurrent ? (
                          <div className="w-7 h-7 rounded-full bg-purple-500 text-white font-black text-xs flex items-center justify-center animate-pulse shadow-md">
                            ★
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-white/5 text-slate-500 border border-white/10 text-xs font-bold flex items-center justify-center">
                            {index + 1}
                          </div>
                        )}
                      </div>

                      <h4 className="font-extrabold text-xs text-white truncate">
                        {isHe ? lvl.labelHe : lvl.label}
                      </h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          isCurrent
                            ? 'bg-purple-400/20 text-purple-300 border border-purple-400/30'
                            : isCompleted
                            ? 'bg-emerald-400/20 text-emerald-300'
                            : 'text-slate-500'
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

          <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <span>
              {isHe
                ? 'המורה מעדכן את הרמה בסיום כל שלב'
                : 'Teachers verify and graduate levels upon completion'}
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {isHe ? 'הושלם' : 'Completed'}
              </span>
              <span className="flex items-center gap-1.5 text-purple-300">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                {isHe ? 'נוכחי' : 'Current'}
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-slate-600" />
                {isHe ? 'נעול' : 'Locked'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
