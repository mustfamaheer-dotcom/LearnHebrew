import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import { toast } from '../../store/toastStore';
import {
  Star,
  Award,
  MessageSquare,
  Filter,
  Search,
  Trash2,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart3,
  Users,
  BookOpen,
  X,
  Smile,
  Zap,
} from 'lucide-react';

export const ReviewsAndFeedbackTab: React.FC = () => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const isHe = language === 'he';

  // Sub-tabs: 'analytics' | 'lessons' | 'teachers' | 'leaderboard'
  const [currentView, setCurrentView] = useState<'analytics' | 'lessons' | 'teachers' | 'leaderboard'>('analytics');

  // Search & Filter state for Lesson Reviews
  const [lessonSearch, setLessonSearch] = useState('');
  const [selectedLessonTeacher, setSelectedLessonTeacher] = useState<string>('ALL');
  const [selectedLessonRating, setSelectedLessonRating] = useState<string>('ALL');
  const [selectedPace, setSelectedPace] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');

  // Search & Filter state for Teacher Surveys
  const [surveySearch, setSurveySearch] = useState('');
  const [selectedSurveyTeacher, setSelectedSurveyTeacher] = useState<string>('ALL');
  const [selectedSurveyRating, setSelectedSurveyRating] = useState<string>('ALL');

  // Deletion Confirmation Modal State
  const [deletingTarget, setDeletingTarget] = useState<{
    type: 'lesson' | 'survey';
    id: string;
    studentName: string;
    teacherName: string;
  } | null>(null);

  // 1. Fetch Feedback Analytics
  const {
    data: analyticsData,
    isLoading: isLoadingAnalytics,
    refetch: refetchAnalytics,
  } = useQuery({
    queryKey: ['adminFeedbackAnalytics'],
    queryFn: async () => {
      const res = await api.get('/feedback/analytics');
      return res.data.analytics;
    },
  });

  // 2. Fetch All Lesson Feedbacks
  const {
    data: lessonFeedbacks = [],
    isLoading: isLoadingLessons,
    refetch: refetchLessons,
  } = useQuery({
    queryKey: ['adminLessonFeedbacks'],
    queryFn: async () => {
      const res = await api.get('/feedback/lessons');
      return res.data.feedbacks || [];
    },
  });

  // 3. Fetch All Teacher Surveys
  const {
    data: teacherSurveys = [],
    isLoading: isLoadingSurveys,
    refetch: refetchSurveys,
  } = useQuery({
    queryKey: ['adminTeacherSurveys'],
    queryFn: async () => {
      const res = await api.get('/feedback/surveys');
      return res.data.surveys || [];
    },
  });

  // 4. Fetch Teachers List for Filter Dropdowns
  const { data: teachers = [] } = useQuery({
    queryKey: ['adminTeachersList'],
    queryFn: async () => {
      const res = await api.get('/teachers');
      return res.data.teachers || [];
    },
  });

  // Delete Lesson Feedback Mutation
  const deleteLessonFeedbackMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/feedback/lesson/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFeedbackAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['adminLessonFeedbacks'] });
      setDeletingTarget(null);
      toast.success(isHe ? 'משוב השיעור נמחק בהצלחה' : 'Lesson feedback deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || (isHe ? 'שגיאה במחיקת המשוב' : 'Failed to delete feedback'));
    },
  });

  // Delete Teacher Survey Mutation
  const deleteTeacherSurveyMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/feedback/survey/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFeedbackAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['adminTeacherSurveys'] });
      queryClient.invalidateQueries({ queryKey: ['adminTeachersList'] });
      setDeletingTarget(null);
      toast.success(
        isHe
          ? 'הערכת המורה נמחקה וציון המורה עודכן מחדש בהצלחה'
          : 'Teacher survey deleted and instructor score recalculated'
      );
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || (isHe ? 'שגיאה במחיקת הסקר' : 'Failed to delete survey'));
    },
  });

  const handleRefreshAll = () => {
    refetchAnalytics();
    refetchLessons();
    refetchSurveys();
    toast.success(isHe ? 'הנתונים רועננו בהצלחה' : 'Feedback data refreshed');
  };

  // Filtered Lesson Feedbacks
  const filteredLessonFeedbacks = useMemo(() => {
    return lessonFeedbacks.filter((item: any) => {
      if (selectedLessonTeacher !== 'ALL') {
        const itemTeacherId = item.lesson?.teacherId;
        if (itemTeacherId !== selectedLessonTeacher) return false;
      }
      if (selectedLessonRating !== 'ALL') {
        if (item.qualityRating !== parseInt(selectedLessonRating, 10)) return false;
      }
      if (selectedPace !== 'ALL') {
        if (selectedPace === 'slow' && item.paceRating > 2) return false;
        if (selectedPace === 'justRight' && item.paceRating !== 3) return false;
        if (selectedPace === 'fast' && item.paceRating < 4) return false;
      }
      if (selectedDifficulty !== 'ALL') {
        if (selectedDifficulty === 'easy' && item.difficulty > 2) return false;
        if (selectedDifficulty === 'balanced' && item.difficulty !== 3) return false;
        if (selectedDifficulty === 'challenging' && item.difficulty < 4) return false;
      }
      if (lessonSearch.trim()) {
        const q = lessonSearch.toLowerCase();
        const studentName = `${item.student?.user?.firstName || ''} ${item.student?.user?.lastName || ''}`.toLowerCase();
        const teacherName = `${item.lesson?.teacher?.user?.firstName || ''} ${item.lesson?.teacher?.user?.lastName || ''}`.toLowerCase();
        const comments = (item.comments || '').toLowerCase();
        return studentName.includes(q) || teacherName.includes(q) || comments.includes(q);
      }
      return true;
    });
  }, [lessonFeedbacks, selectedLessonTeacher, selectedLessonRating, selectedPace, selectedDifficulty, lessonSearch]);

  // Filtered Teacher Surveys
  const filteredTeacherSurveys = useMemo(() => {
    return teacherSurveys.filter((item: any) => {
      if (selectedSurveyTeacher !== 'ALL') {
        if (item.teacherId !== selectedSurveyTeacher) return false;
      }
      if (selectedSurveyRating !== 'ALL') {
        if (item.overallRating !== parseInt(selectedSurveyRating, 10)) return false;
      }
      if (surveySearch.trim()) {
        const q = surveySearch.toLowerCase();
        const studentName = `${item.student?.user?.firstName || ''} ${item.student?.user?.lastName || ''}`.toLowerCase();
        const teacherName = `${item.teacher?.user?.firstName || ''} ${item.teacher?.user?.lastName || ''}`.toLowerCase();
        const comments = (item.comments || '').toLowerCase();
        return studentName.includes(q) || teacherName.includes(q) || comments.includes(q);
      }
      return true;
    });
  }, [teacherSurveys, selectedSurveyTeacher, selectedSurveyRating, surveySearch]);

  const summary = analyticsData?.summary || {
    totalLessonReviews: lessonFeedbacks.length,
    avgLessonQuality: 0,
    totalTeacherSurveys: teacherSurveys.length,
    avgTeacherOverall: 0,
    avgCommunication: 0,
    avgKnowledge: 0,
    avgPunctuality: 0,
  };

  const qualityDist = analyticsData?.qualityDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const teacherDist = analyticsData?.teacherRatingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const paceDist = analyticsData?.paceDistribution || { slow: 0, justRight: 0, fast: 0 };
  const diffDist = analyticsData?.difficultyDistribution || { easy: 0, balanced: 0, challenging: 0 };
  const teacherPerformance = analyticsData?.teacherPerformance || [];

  const totalPace = (paceDist.slow || 0) + (paceDist.justRight || 0) + (paceDist.fast || 0) || 1;
  const justRightPacePercent = Math.round(((paceDist.justRight || 0) / totalPace) * 100);

  const totalDiff = (diffDist.easy || 0) + (diffDist.balanced || 0) + (diffDist.challenging || 0) || 1;
  const balancedDiffPercent = Math.round(((diffDist.balanced || 0) / totalDiff) * 100);

  return (
    <div className="space-y-6 text-start">
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-800 dark:text-amber-300 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{isHe ? 'מרכז ניהול משובים וסקרים' : 'Review & Survey Management Hub'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {isHe ? 'משובי שיעורים והערכות מורים' : 'Student Lesson Reviews & Teacher Feedback'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {isHe
              ? 'לוח בקרה מקיף לניהול כל המשובים על השיעורים והמורים, ניתוח איכות, כיול קצב ורמת קושי, ודוחות ביצועים.'
              : 'Monitor lesson quality ratings, teacher evaluations, pace and difficulty calibration, and manage student reviews across the platform.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefreshAll}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold shadow-2xs transition-all active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
          <span>{isHe ? 'רענן נתונים' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* 2. Top Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Lesson Quality */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isHe ? 'איכות שיעורים ממוצעת' : 'Avg Lesson Quality'}
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Star className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {summary.avgLessonQuality ? summary.avgLessonQuality.toFixed(2) : '5.00'}
            </span>
            <span className="text-xs font-bold text-slate-400">/ 5.0</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>
              {summary.totalLessonReviews} {isHe ? 'משובים על שיעורים' : 'lesson reviews'}
            </span>
          </div>
        </div>

        {/* KPI 2: Teacher Satisfaction */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isHe ? 'שביעות רצון ממורים' : 'Teacher Satisfaction'}
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {summary.avgTeacherOverall ? summary.avgTeacherOverall.toFixed(2) : '5.00'}
            </span>
            <span className="text-xs font-bold text-slate-400">/ 5.0</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
            <Users className="w-3.5 h-3.5" />
            <span>
              {summary.totalTeacherSurveys} {isHe ? 'הערכות מורים' : 'teacher evaluations'}
            </span>
          </div>
        </div>

        {/* KPI 3: Pace Calibration */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isHe ? 'כיול קצב השיעור' : 'Pace Calibration'}
            </span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {justRightPacePercent}%
            </span>
            <span className="text-xs font-bold text-emerald-500">
              {isHe ? 'בדיוק מתאים' : 'Just Right'}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${Math.round(((paceDist.slow || 0) / totalPace) * 100)}%` }}
              className="bg-sky-400"
              title="Slow"
            />
            <div
              style={{ width: `${justRightPacePercent}%` }}
              className="bg-emerald-500"
              title="Just Right"
            />
            <div
              style={{ width: `${Math.round(((paceDist.fast || 0) / totalPace) * 100)}%` }}
              className="bg-amber-400"
              title="Fast"
            />
          </div>
          <span className="text-[10px] text-slate-400 block truncate">
            {paceDist.justRight || 0} מתאים • {paceDist.slow || 0} איטי • {paceDist.fast || 0} מהיר
          </span>
        </div>

        {/* KPI 4: Difficulty Calibration */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isHe ? 'כיול רמת הקושי' : 'Difficulty Balance'}
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {balancedDiffPercent}%
            </span>
            <span className="text-xs font-bold text-indigo-500">
              {isHe ? 'מאוזן' : 'Balanced'}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${Math.round(((diffDist.easy || 0) / totalDiff) * 100)}%` }}
              className="bg-blue-400"
              title="Easy"
            />
            <div
              style={{ width: `${balancedDiffPercent}%` }}
              className="bg-indigo-500"
              title="Balanced"
            />
            <div
              style={{ width: `${Math.round(((diffDist.challenging || 0) / totalDiff) * 100)}%` }}
              className="bg-purple-500"
              title="Challenging"
            />
          </div>
          <span className="text-[10px] text-slate-400 block truncate">
            {diffDist.balanced || 0} מאוזן • {diffDist.easy || 0} קל • {diffDist.challenging || 0} מאתגר
          </span>
        </div>
      </div>

      {/* 3. Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setCurrentView('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            currentView === 'analytics'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{isHe ? 'ניתוח סטטיסטי ומדדים' : 'Analytics & Insights'}</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('lessons')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            currentView === 'lessons'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{isHe ? 'משובי שיעורים' : 'Lesson Reviews'}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 dark:bg-slate-800 font-extrabold">
            {lessonFeedbacks.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('teachers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            currentView === 'teachers'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{isHe ? 'הערכות מורים' : 'Teacher Surveys'}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 dark:bg-slate-800 font-extrabold">
            {teacherSurveys.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('leaderboard')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            currentView === 'leaderboard'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>{isHe ? 'טבלת ביצועי מורים' : 'Teacher Scorecards'}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 dark:bg-slate-800 font-extrabold">
            {teacherPerformance.length}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* VIEW 1: ANALYTICS & INSIGHTS                             */}
      {/* ======================================================== */}
      {currentView === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lesson Quality Distribution Chart */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>{isHe ? 'התפלגות דירוג איכות השיעור' : 'Lesson Quality Rating Breakdown'}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isHe ? 'התפלגות כוכבים לפי סך כל השיעורים שדורגו' : 'Distribution of 1-5 star ratings for lessons'}
                  </p>
                </div>
                <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {summary.totalLessonReviews} {isHe ? 'ביקורות' : 'reviews'}
                </span>
              </div>

              <div className="space-y-2.5 pt-2">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = qualityDist[stars] || 0;
                  const total = summary.totalLessonReviews || 1;
                  const percent = Math.round((count / total) * 100);
                  return (
                    <div key={stars} className="flex items-center gap-3 text-xs">
                      <div className="w-16 flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                        <span>{stars}</span>
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      </div>
                      <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            stars >= 4 ? 'bg-amber-500' : stars === 3 ? 'bg-amber-300' : 'bg-rose-400'
                          }`}
                        />
                      </div>
                      <div className="w-14 text-end font-semibold text-slate-500 dark:text-slate-400">
                        <span>{count}</span>
                        <span className="text-[10px] text-slate-400 ml-1">({percent}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Teacher Overall Rating Distribution Chart */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>{isHe ? 'התפלגות דירוג כללי למורים' : 'Teacher Overall Rating Breakdown'}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isHe ? 'סך הערכות המורים שבוצעו ע״י תלמידים' : 'Distribution of overall instructor surveys'}
                  </p>
                </div>
                <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {summary.totalTeacherSurveys} {isHe ? 'הערכות' : 'surveys'}
                </span>
              </div>

              <div className="space-y-2.5 pt-2">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = teacherDist[stars] || 0;
                  const total = summary.totalTeacherSurveys || 1;
                  const percent = Math.round((count / total) * 100);
                  return (
                    <div key={stars} className="flex items-center gap-3 text-xs">
                      <div className="w-16 flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                        <span>{stars}</span>
                        <Star className="w-3.5 h-3.5 fill-purple-400 text-purple-400" />
                      </div>
                      <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            stars >= 4 ? 'bg-purple-600' : stars === 3 ? 'bg-purple-300' : 'bg-rose-400'
                          }`}
                        />
                      </div>
                      <div className="w-14 text-end font-semibold text-slate-500 dark:text-slate-400">
                        <span>{count}</span>
                        <span className="text-[10px] text-slate-400 ml-1">({percent}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Teacher Criteria Evaluation Averages */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-teal-600 dark:text-brand-teal-400" />
              <span>{isHe ? 'ציון ממוצע לפי תחומי הערכת מורים' : 'Average Teacher Score by Competency Area'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* Communication */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 space-y-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                  {isHe ? 'תקשורת וסבלנות' : 'Communication & Patience'}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {summary.avgCommunication ? summary.avgCommunication.toFixed(2) : '5.00'}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, ((summary.avgCommunication || 5) / 5) * 100)}%` }}
                    className="h-full bg-teal-500 rounded-full"
                  />
                </div>
              </div>

              {/* Knowledge */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 space-y-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                  {isHe ? 'בקיאות וסגנון הוראה' : 'Knowledge & Explanations'}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {summary.avgKnowledge ? summary.avgKnowledge.toFixed(2) : '5.00'}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, ((summary.avgKnowledge || 5) / 5) * 100)}%` }}
                    className="h-full bg-purple-500 rounded-full"
                  />
                </div>
              </div>

              {/* Punctuality */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 space-y-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                  {isHe ? 'דיוק ומוכנות לשיעור' : 'Punctuality & Preparation'}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {summary.avgPunctuality ? summary.avgPunctuality.toFixed(2) : '5.00'}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, ((summary.avgPunctuality || 5) / 5) * 100)}%` }}
                    className="h-full bg-amber-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: LESSON REVIEWS MANAGEMENT                        */}
      {/* ======================================================== */}
      {currentView === 'lessons' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={lessonSearch}
                onChange={(e) => setLessonSearch(e.target.value)}
                placeholder={isHe ? 'חיפוש לפי תלמיד, מורה או תוכן המשוב...' : 'Search by student, teacher, or comment...'}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Filter by Teacher */}
            <select
              value={selectedLessonTeacher}
              onChange={(e) => setSelectedLessonTeacher(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold outline-none"
            >
              <option value="ALL">{isHe ? 'כל המורים' : 'All Teachers'}</option>
              {teachers.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.user?.firstName} {t.user?.lastName}
                </option>
              ))}
            </select>

            {/* Filter by Rating */}
            <select
              value={selectedLessonRating}
              onChange={(e) => setSelectedLessonRating(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold outline-none"
            >
              <option value="ALL">{isHe ? 'כל הדירוגים' : 'All Ratings'}</option>
              <option value="5">5 ⭐⭐⭐⭐⭐</option>
              <option value="4">4 ⭐⭐⭐⭐</option>
              <option value="3">3 ⭐⭐⭐</option>
              <option value="2">2 ⭐⭐</option>
              <option value="1">1 ⭐</option>
            </select>

            {/* Filter by Pace */}
            <select
              value={selectedPace}
              onChange={(e) => setSelectedPace(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold outline-none"
            >
              <option value="ALL">{isHe ? 'כל הקצבים' : 'All Paces'}</option>
              <option value="justRight">{isHe ? 'מתאים בדיוק' : 'Just Right'}</option>
              <option value="slow">{isHe ? 'איטי' : 'Slow'}</option>
              <option value="fast">{isHe ? 'מהיר' : 'Fast'}</option>
            </select>

            {/* Filter by Difficulty */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold outline-none"
            >
              <option value="ALL">{isHe ? 'כל הרמות' : 'All Difficulties'}</option>
              <option value="balanced">{isHe ? 'מאוזן' : 'Balanced'}</option>
              <option value="easy">{isHe ? 'קל' : 'Easy'}</option>
              <option value="challenging">{isHe ? 'מאתגר' : 'Challenging'}</option>
            </select>
          </div>

          {/* List of Reviews */}
          {filteredLessonFeedbacks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLessonFeedbacks.map((f: any) => {
                const studentName = `${f.student?.user?.firstName || 'Student'} ${f.student?.user?.lastName || ''}`;
                const teacherName = `${f.lesson?.teacher?.user?.firstName || 'Teacher'} ${f.lesson?.teacher?.user?.lastName || ''}`;
                const dateStr = f.submittedAt ? new Date(f.submittedAt).toLocaleDateString() : '';

                return (
                  <div
                    key={f.id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {studentName}
                            </span>
                            <span className="text-slate-400 text-xs">&rarr;</span>
                            <span className="font-bold text-xs text-brand-teal-700 dark:text-brand-teal-400">
                              {teacherName}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">{dateStr}</span>
                        </div>

                        {/* Star Rating Badge */}
                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-xl text-xs font-black border border-amber-200 dark:border-amber-800/60">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{f.qualityRating}/5</span>
                        </div>
                      </div>

                      {/* Calibration Badges: Pace & Difficulty */}
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            f.paceRating === 3
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                          }`}
                        >
                          {f.paceRating === 3
                            ? isHe ? 'קצב מתאים' : 'Pace: Just Right'
                            : f.paceRating < 3
                            ? isHe ? 'קצב איטי' : 'Pace: Slow'
                            : isHe ? 'קצב מהיר' : 'Pace: Fast'}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            f.difficulty === 3
                              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                              : 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                          }`}
                        >
                          {f.difficulty === 3
                            ? isHe ? 'קושי מאוזן' : 'Difficulty: Balanced'
                            : f.difficulty < 3
                            ? isHe ? 'קל מדי' : 'Difficulty: Easy'
                            : isHe ? 'מאתגר' : 'Difficulty: Challenging'}
                        </span>
                      </div>

                      {/* Comments */}
                      <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl italic border border-slate-200/50 dark:border-slate-700/60 mt-3 leading-relaxed">
                        "{f.comments || (isHe ? 'לא נוספו הערות מילוליות.' : 'No verbal remarks provided.')}"
                      </p>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-2 flex items-center justify-end border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() =>
                          setDeletingTarget({
                            type: 'lesson',
                            id: f.id,
                            studentName,
                            teacherName,
                          })
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isHe ? 'מחק משוב' : 'Delete Review'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {isHe ? 'לא נמצאו משובי שיעורים לפי הסינון הנוכחי' : 'No lesson reviews found matching the filters'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {isHe ? 'נסה לאפס את הסינונים או לחפש מילת מפתח אחרת.' : 'Try resetting your filter criteria.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 3: TEACHER EVALUATIONS MANAGEMENT                   */}
      {/* ======================================================== */}
      {currentView === 'teachers' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={surveySearch}
                onChange={(e) => setSurveySearch(e.target.value)}
                placeholder={isHe ? 'חיפוש לפי תלמיד, מורה או תוכן ההערכה...' : 'Search by student, teacher, or comment...'}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Filter by Teacher */}
            <select
              value={selectedSurveyTeacher}
              onChange={(e) => setSelectedSurveyTeacher(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold outline-none"
            >
              <option value="ALL">{isHe ? 'כל המורים' : 'All Teachers'}</option>
              {teachers.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.user?.firstName} {t.user?.lastName}
                </option>
              ))}
            </select>

            {/* Filter by Rating */}
            <select
              value={selectedSurveyRating}
              onChange={(e) => setSelectedSurveyRating(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold outline-none"
            >
              <option value="ALL">{isHe ? 'כל הדירוגים' : 'All Ratings'}</option>
              <option value="5">5 ⭐⭐⭐⭐⭐</option>
              <option value="4">4 ⭐⭐⭐⭐</option>
              <option value="3">3 ⭐⭐⭐</option>
              <option value="2">2 ⭐⭐</option>
              <option value="1">1 ⭐</option>
            </select>
          </div>

          {/* List of Surveys */}
          {filteredTeacherSurveys.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTeacherSurveys.map((s: any) => {
                const studentName = `${s.student?.user?.firstName || 'Student'} ${s.student?.user?.lastName || ''}`;
                const teacherName = `${s.teacher?.user?.firstName || 'Teacher'} ${s.teacher?.user?.lastName || ''}`;
                const dateStr = s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : '';

                return (
                  <div
                    key={s.id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {studentName}
                            </span>
                            <span className="text-slate-400 text-xs">&rarr;</span>
                            <span className="font-bold text-xs text-purple-700 dark:text-purple-400">
                              {teacherName}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">{dateStr}</span>
                        </div>

                        {/* Overall Rating Badge */}
                        <div className="flex items-center gap-1 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1 rounded-xl text-xs font-black border border-purple-200 dark:border-purple-800/60">
                          <Award className="w-3.5 h-3.5 text-purple-500" />
                          <span>{s.overallRating}/5</span>
                        </div>
                      </div>

                      {/* Competency Ratings Pills */}
                      <div className="grid grid-cols-3 gap-1.5 mt-2.5 text-[10px]">
                        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-center">
                          <span className="text-slate-400 block">{isHe ? 'תקשורת' : 'Comm'}</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">
                            {s.communication}/5 ★
                          </span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-center">
                          <span className="text-slate-400 block">{isHe ? 'בקיאות' : 'Knowledge'}</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">
                            {s.knowledge}/5 ★
                          </span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-center">
                          <span className="text-slate-400 block">{isHe ? 'דיוק' : 'Punctual'}</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">
                            {s.punctuality}/5 ★
                          </span>
                        </div>
                      </div>

                      {/* Comments */}
                      <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl italic border border-slate-200/50 dark:border-slate-700/60 mt-3 leading-relaxed">
                        "{s.comments || (isHe ? 'לא נוספו הערות מילוליות.' : 'No verbal remarks provided.')}"
                      </p>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-2 flex items-center justify-end border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() =>
                          setDeletingTarget({
                            type: 'survey',
                            id: s.id,
                            studentName,
                            teacherName,
                          })
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isHe ? 'מחק הערכה' : 'Delete Survey'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <Award className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {isHe ? 'לא נמצאו הערכות מורים לפי הסינון הנוכחי' : 'No teacher surveys found matching the filters'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {isHe ? 'נסה לאפס את הסינונים או לחפש מילת מפתח אחרת.' : 'Try resetting your filter criteria.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 4: TEACHER SCORECARDS & RANKING                     */}
      {/* ======================================================== */}
      {currentView === 'leaderboard' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>{isHe ? 'טבלת ביצועי מורים ודירוגי איכות' : 'Teacher Performance Scorecards & Ranking'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isHe
                ? 'סקירת כל המורים במערכת, מספר המשובים המצטבר והציונים לפי קטגוריות'
                : 'Aggregated instructor scores, total review volume, and competency breakdowns.'}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3 text-start font-bold">{isHe ? 'מורה' : 'Teacher'}</th>
                  <th className="py-3 px-3 text-center font-bold">{isHe ? 'משובים' : 'Reviews'}</th>
                  <th className="py-3 px-3 text-center font-bold">{isHe ? 'ציון כללי' : 'Overall Rating'}</th>
                  <th className="py-3 px-3 text-center font-bold">{isHe ? 'תקשורת' : 'Communication'}</th>
                  <th className="py-3 px-3 text-center font-bold">{isHe ? 'בקיאות' : 'Knowledge'}</th>
                  <th className="py-3 px-3 text-center font-bold">{isHe ? 'דיוק' : 'Punctuality'}</th>
                  <th className="py-3 px-3 text-end font-bold">{isHe ? 'סטטוס ביצועים' : 'Performance Tier'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {teacherPerformance.map((t: any) => {
                  const rating = t.avgOverall || 5.0;
                  const isTop = rating >= 4.8;
                  const isGood = rating >= 4.0;

                  return (
                    <tr key={t.teacherId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-brand-teal-100 dark:bg-brand-teal-950/80 text-brand-teal-800 dark:text-brand-teal-300 font-bold flex items-center justify-center text-xs">
                            {t.name.slice(0, 1)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{t.name}</span>
                            <span className="text-[10px] text-slate-400">{t.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center font-bold">{t.reviewCount}</td>

                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{rating.toFixed(2)}</span>
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {t.avgCommunication ? `${t.avgCommunication.toFixed(1)} ★` : '—'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {t.avgKnowledge ? `${t.avgKnowledge.toFixed(1)} ★` : '—'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {t.avgPunctuality ? `${t.avgPunctuality.toFixed(1)} ★` : '—'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-end">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isTop
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : isGood
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {isTop
                            ? isHe ? 'מצטיין ⭐' : 'Top Tier ⭐'
                            : isGood
                            ? isHe ? 'טוב מאוד' : 'Strong Performer'
                            : isHe ? 'דורש מעקב' : 'Needs Review'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CONFIRMATION DELETION MODAL                              */}
      {/* ======================================================== */}
      {deletingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-start">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {isHe ? 'אישור מחיקת משוב' : 'Confirm Deletion'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {deletingTarget.type === 'lesson'
                    ? isHe ? 'מחיקת משוב על איכות השיעור' : 'Delete lesson quality review'
                    : isHe ? 'מחיקת הערכת מורה (יעדכן את הציון הממוצע)' : 'Delete teacher survey & recalculate avg'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              {isHe
                ? `האם אתה בטוח שברצונך למחוק את המשוב מאת ${deletingTarget.studentName} עבור ${deletingTarget.teacherName}? פעולה זו הינה בלתי הפיכה.`
                : `Are you sure you want to delete the review by ${deletingTarget.studentName} for ${deletingTarget.teacherName}? This action cannot be undone.`}
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTarget(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {isHe ? 'ביטול' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={
                  deleteLessonFeedbackMutation.isPending || deleteTeacherSurveyMutation.isPending
                }
                onClick={() => {
                  if (deletingTarget.type === 'lesson') {
                    deleteLessonFeedbackMutation.mutate(deletingTarget.id);
                  } else {
                    deleteTeacherSurveyMutation.mutate(deletingTarget.id);
                  }
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors"
              >
                {deleteLessonFeedbackMutation.isPending || deleteTeacherSurveyMutation.isPending
                  ? isHe ? 'מוחק...' : 'Deleting...'
                  : isHe ? 'מחק לצמיתות' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

