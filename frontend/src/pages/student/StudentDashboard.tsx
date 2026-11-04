import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../hooks/useTranslation';
import { toast } from '../../store/toastStore';
import { FlashcardGame } from '../../components/games/FlashcardGame';
import { QuizGame } from '../../components/games/QuizGame';
import { MatchingGame } from '../../components/games/MatchingGame';
import {
  formatSlotRange12Hour,
  formatIsraelDateTime,
  getSlotDurationMinutes,
  ISRAEL_TZ_LABEL,
} from '../../lib/timeUtils';
import {
  Calendar,
  Calendar as CalendarIcon,
  Video,
  Award,
  Flame,
  CheckCircle,
  CheckCircle2,
  Clock,
  BookOpen,
  FileText,
  Gamepad2,
  ExternalLink,
  Star,
  Send,
  AlertCircle,
  Plus,
  X,
  Sparkles,
  Layers,
  GraduationCap,
  Globe2,
  LayoutDashboard,
  Menu,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'booking' | 'lessons' | 'homework' | 'games' | 'leaderboard'
  >(() => {
    if (location.pathname.includes('/games')) return 'games';
    if (location.pathname.includes('/leaderboard')) return 'leaderboard';
    return 'overview';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (location.pathname.includes('/games')) {
      setActiveTab('games');
    } else if (location.pathname.includes('/leaderboard')) {
      setActiveTab('leaderboard');
    }
  }, [location.pathname]);

  const [activeGame, setActiveGame] = useState<any | null>(null);
  const [studentGameLevelFilter, setStudentGameLevelFilter] = useState<string>('ALL');
  const [submittingHwId, setSubmittingHwId] = useState<string | null>(null);
  const [hwNote, setHwNote] = useState('');
  const [ratingLessonId, setRatingLessonId] = useState<string | null>(null);
  const [ratingVal, setRatingVal] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  // Session Booking Modal & In-Page State (25, 40, or 55 min)
  const [selectedDuration, setSelectedDuration] = useState<25 | 40 | 55>(25);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [bookingDate, setBookingDate] = useState<string>('');
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>('');
  const [bookingError, setBookingError] = useState<string | null>(null);

  // 1. Fetch Student Dashboard Data
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['studentDashboard', user?.id],
    queryFn: async () => {
      const res = await api.get(`/students/${user?.id}/dashboard`);
      return res.data;
    },
    enabled: !!user?.id,
  });

  // 2. Fetch Available Teachers for Booking
  const { data: teachersData } = useQuery({
    queryKey: ['availableTeachers'],
    queryFn: async () => {
      const res = await api.get('/teachers');
      return res.data.teachers;
    },
    enabled: isBookingModalOpen || activeTab === 'booking',
  });

  // 3. Fetch Games
  const { data: gamesData } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const res = await api.get('/games');
      return res.data.games;
    },
  });

  // 4. Fetch Leaderboard
  const { data: leaderboardData } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const res = await api.get('/games/leaderboard');
      return res.data.leaderboard;
    },
  });

  // Book Session Mutation (supports 25, 40, or 55 min)
  const bookLessonMutation = useMutation({
    mutationFn: async (payload: {
      studentId: string;
      teacherId: string;
      scheduledAt: string;
      lessonType: string;
      durationMinutes?: number;
      zoomLink?: string;
    }) => {
      return api.post('/lessons', payload);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
      setIsBookingModalOpen(false);
      setSelectedTeacherId('');
      setBookingDate('');
      setSelectedSlotTime('');
      setBookingError(null);
      const dur = vars.durationMinutes || 25;
      toast.success(
        language === 'he'
          ? `שיעור (${dur} דקות) הוזמן בהצלחה! נקודת שיעור אחת הופחתה מיתרתך.`
          : `${dur}-Minute Lesson booked successfully! 1 session credit deducted.`,
        language === 'he' ? 'ההזמנה אושרה' : 'Booking Confirmed'
      );
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.error ||
        (language === 'he'
          ? 'שגיאה בהזמנת השיעור. אנא ודא שנותרו לך נקודות שיעור בחשבון.'
          : 'Failed to book lesson. Please verify remaining session credits.');
      setBookingError(msg);
      toast.error(msg, language === 'he' ? 'שגיאה בהזמנה' : 'Booking Error');
    },
  });

  // Homework submit mutation
  const submitHomeworkMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      return api.patch(`/homework/${id}/submit`, { studentNote: note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
      setSubmittingHwId(null);
      setHwNote('');
      toast.success(
        language === 'he' ? 'שיעורי הבית הוגשו בהצלחה!' : 'Homework turned in successfully!'
      );
    },
  });

  // Feedback submit mutation
  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post(`/feedback/lesson/${data.lessonId}`, {
        qualityRating: data.rating,
        difficulty: 3,
        paceRating: 3,
        comments: data.comment,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
      setRatingLessonId(null);
      setRatingComment('');
      toast.success(
        language === 'he' ? 'תודה על הדירוג והמשוב!' : 'Thank you for your rating & feedback!'
      );
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-sm font-semibold text-slate-500 animate-pulse">
          {t('common.loading')}
        </div>
      </div>
    );
  }

  const student = dashboard?.student;
  const activePackage = dashboard?.activePackage;
  const upcomingLessons = dashboard?.upcomingLessons || [];
  const recentHomework = dashboard?.recentHomework || [];
  const recentLessons = dashboard?.recentLessons || [];

  const remainingLessons = activePackage
    ? activePackage.lessonsTotal - activePackage.lessonsUsed
    : 0;
  const percentUsed = activePackage
    ? Math.round((activePackage.lessonsUsed / activePackage.lessonsTotal) * 100)
    : 0;

  const selectedTeacher = (teachersData || []).find(
    (t: any) => t.id === selectedTeacherId
  );

  const pendingHomeworkCount = recentHomework.filter(
    (h: any) => h.status === 'ASSIGNED'
  ).length;

  const navItems = [
    {
      id: 'overview' as const,
      labelEn: 'Overview & Status',
      labelHe: 'סקירה כללית',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'booking' as const,
      labelEn: 'Book Session',
      labelHe: 'הזמנת שיעור',
      icon: Clock,
      badge: remainingLessons > 0 ? (language === 'he' ? `${remainingLessons} נק׳` : `${remainingLessons} left`) : '0',
    },
    {
      id: 'lessons' as const,
      labelEn: 'Lessons & Recordings',
      labelHe: 'שיעורים והקלטות',
      icon: Video,
      badge: upcomingLessons.length > 0 ? `${upcomingLessons.length}` : null,
    },
    {
      id: 'homework' as const,
      labelEn: 'Homework & Feedback',
      labelHe: 'שיעורי בית ומשוב',
      icon: BookOpen,
      badge: pendingHomeworkCount > 0 ? `${pendingHomeworkCount}` : null,
    },
    {
      id: 'games' as const,
      labelEn: 'Hebrew Games',
      labelHe: 'משחקי עברית',
      icon: Gamepad2,
      badge: gamesData?.length ? `${gamesData.length}` : null,
    },
    {
      id: 'leaderboard' as const,
      labelEn: 'Leaderboard',
      labelHe: 'לוח מובילים',
      icon: Award,
      badge: student?.totalPoints ? (language === 'he' ? `${student.totalPoints} נק׳` : `${student.totalPoints} pts`) : null,
    },
  ];

  const handleBookingSubmit = () => {
    if (remainingLessons <= 0) {
      const err =
        language === 'he'
          ? 'אין לך נקודות שיעור זמינות. פנה למנהל Engrew לקבלת נקודות או הקצאת חבילה.'
          : 'You do not have enough session credits. Please contact Engrew admin to grant credits.';
      setBookingError(err);
      toast.warning(err);
      return;
    }
    if (!selectedTeacherId || !bookingDate || !selectedSlotTime) {
      const err =
        language === 'he'
          ? 'אנא בחר מורה, תאריך ושעת שיעור פנויה.'
          : 'Please select teacher, date, and available slot.';
      setBookingError(err);
      toast.warning(err);
      return;
    }
    if (!student?.id) {
      const err = language === 'he' ? 'פרופיל התלמיד לא זוהה.' : 'Student profile not detected.';
      setBookingError(err);
      toast.error(err);
      return;
    }
    const scheduledIso = new Date(
      `${bookingDate}T${selectedSlotTime}:00`
    ).toISOString();
    bookLessonMutation.mutate({
      studentId: student.id,
      teacherId: selectedTeacherId,
      scheduledAt: scheduledIso,
      lessonType: 'REGULAR',
      durationMinutes: selectedDuration,
      zoomLink: 'https://zoom.us/j/engrew-live',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Mobile Sidebar Toggle Header (visible only on lg:hidden) */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-teal-800 to-brand-olive-600 flex items-center justify-center text-white font-bold shadow-xs">
            <GraduationCap className="w-5 h-5 text-brand-olive-300" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {language === 'he' ? 'פורטל תלמידים' : 'Student Portal'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
              {language === 'he'
                ? navItems.find((n) => n.id === activeTab)?.labelHe
                : navItems.find((n) => n.id === activeTab)?.labelEn}
            </div>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Apple-style Glassy Left Sidebar */}
        <aside
          className={`lg:w-72 w-full lg:sticky lg:top-24 z-20 transition-all ${
            mobileMenuOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="rounded-3xl p-4 sm:p-5 border border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] ring-1 ring-slate-900/5 dark:ring-white/5 space-y-4">
            {/* Sidebar Brand Header */}
            <div className="flex items-center justify-between px-2 pt-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-teal-800 dark:bg-brand-teal-700 flex items-center justify-center text-white shadow-xs">
                  <GraduationCap className="w-5 h-5 text-brand-olive-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
                    {language === 'he' ? 'פורטל תלמידים' : 'Student Portal'}
                  </h3>
                  <p className="text-[10px] font-semibold text-brand-teal-800 dark:text-brand-teal-400">
                    {language === 'he' ? 'Engrew אקדמיה לעברית' : 'Engrew Hebrew Academy'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-olive-100 dark:bg-brand-olive-950/80 text-brand-olive-900 dark:text-brand-olive-300 border border-brand-olive-200/80 dark:border-brand-olive-800/80 uppercase">
                {t(`levels.${student?.level || 'BEGINNER'}`)}
              </span>
            </div>

            {/* Gamification Stats Pill in Sidebar */}
            <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <div className="text-center p-1.5">
                <div className="flex items-center justify-center gap-1 text-amber-500 font-extrabold text-sm">
                  <Award className="w-4 h-4" />
                  <span>{student?.totalPoints || 0}</span>
                </div>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'he' ? 'נקודות' : 'Points'}
                </p>
              </div>
              <div className="text-center p-1.5 border-s border-slate-200 dark:border-slate-700/80">
                <div className="flex items-center justify-center gap-1 text-orange-500 font-extrabold text-sm">
                  <Flame className="w-4 h-4" />
                  <span>{student?.streakDays || 0}</span>
                </div>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'he' ? 'ימי רצף' : 'Day Streak'}
                </p>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1.5" aria-label="Student Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-brand-teal-800 text-white shadow-md shadow-brand-teal-900/20 dark:bg-brand-teal-700'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive
                            ? 'text-brand-olive-300'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      />
                      <span>{language === 'he' ? item.labelHe : item.labelEn}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-brand-teal-50 dark:bg-brand-teal-950/70 text-brand-teal-800 dark:text-brand-teal-300 border border-brand-teal-200/80 dark:border-brand-teal-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Quick Action Button: Book 25-Min Slot */}
            <div className="pt-1">
              <button
                onClick={() => {
                  setIsBookingModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-3 bg-brand-olive-500 hover:bg-brand-olive-600 text-slate-950 font-extrabold text-xs rounded-2xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'he' ? 'הזמנת שיעור 25 דק׳' : 'Book 25-Min Lesson'}</span>
              </button>
            </div>

            {/* Bottom Student Profile Pill */}
            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center gap-3 px-1">
              <div className="w-10 h-10 rounded-full bg-brand-teal-100 dark:bg-brand-teal-950 flex items-center justify-center text-brand-teal-800 dark:text-brand-teal-300 font-bold text-xs ring-2 ring-brand-teal-800/20">
                {user?.firstName?.[0] || 'S'}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase">
                {language === 'he' ? 'תלמיד' : 'Student'}
              </span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 w-full space-y-8">
          {/* TAB 1: OVERVIEW & STATUS */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Top Welcome Banner with Brand Teal & Olive */}
              <div className="bg-gradient-to-r from-brand-teal-900 via-brand-teal-800 to-brand-olive-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <span className="inline-block px-3 py-1 bg-white/10 text-brand-olive-300 text-xs font-semibold rounded-full mb-3 backdrop-blur-md border border-white/15">
                      {t(`levels.${student?.level || 'BEGINNER'}`)}
                    </span>
                    <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                      {t('dashboard.welcome', { name: user?.firstName || 'Student' })}
                    </h1>
                    <p className="text-brand-teal-100 text-sm mt-1 max-w-xl leading-relaxed">
                      {language === 'he'
                        ? 'המשך להתקדם לעבר שטף בדיבור בעברית עם שיעורים ממוקדים של 25 דקות, משחקים חווייתיים ומשוב אישי מהמורה.'
                        : 'Keep progressing towards Hebrew fluency with high-retention 25-minute live lessons, interactive games, and teacher feedback.'}
                    </p>
                  </div>

                  {/* Gamification Stats */}
                  <div className="flex items-center gap-4">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center min-w-[100px] border border-white/15">
                      <div className="flex items-center justify-center gap-1 text-amber-400 font-extrabold text-xl">
                        <Award className="w-5 h-5" />
                        <span>{student?.totalPoints || 0}</span>
                      </div>
                      <p className="text-[11px] font-semibold text-brand-teal-100 uppercase mt-0.5">
                        {t('dashboard.pointsEarned')}
                      </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center min-w-[100px] border border-white/15">
                      <div className="flex items-center justify-center gap-1 text-orange-400 font-extrabold text-xl">
                        <Flame className="w-5 h-5" />
                        <span>{student?.streakDays || 0}</span>
                      </div>
                      <p className="text-[11px] font-semibold text-brand-teal-100 uppercase mt-0.5">
                        {language === 'he' ? 'ימי רצף' : 'Day Streak'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Package Status & Booking Action */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {/* Active Package Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between h-full transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-xl bg-brand-teal-50 dark:bg-brand-teal-950/70 text-brand-teal-800 dark:text-brand-teal-300">
                          <Layers className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {t('dashboard.packageStatus')}
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          remainingLessons > 0
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {remainingLessons > 0
                          ? (language === 'he' ? 'פעיל' : 'Active')
                          : (language === 'he' ? 'פג תוקף' : 'Expired')}
                      </span>
                    </div>

                    {activePackage ? (
                      <div className="space-y-3">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                          {language === 'he'
                            ? activePackage.package?.nameHe
                            : activePackage.package?.nameEn}
                        </h2>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-brand-teal-800 dark:text-brand-teal-400">
                            {remainingLessons}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            / {activePackage.lessonsTotal}{' '}
                            {language === 'he'
                              ? 'שיעורים בני 25 דק׳ נותרו'
                              : '25-min lessons remaining'}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-brand-olive-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentUsed}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                          <span>
                            {activePackage.lessonsUsed}{' '}
                            {language === 'he' ? 'שיעורים הושלמו' : 'lessons completed'}
                          </span>
                          <span>
                            {percentUsed}% {language === 'he' ? 'נוצל' : 'used'}
                          </span>
                        </div>

                        <div className="pt-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60">
                          <span>{language === 'he' ? 'בתוקף עד:' : 'Valid until:'}</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {activePackage ? new Date(activePackage.endDate).toLocaleDateString() : '—'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-7 flex flex-col items-center justify-center text-center space-y-2">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400">
                          <Layers className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {language === 'he' ? 'אין חבילה פעילה' : 'No active package'}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            {language === 'he' ? 'פנה למנהל להקצאת נקודות' : 'Contact admin to grant credits'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-5 border-t border-slate-100 dark:border-slate-800/80 mt-5">
                    <button
                      onClick={() => setActiveTab('booking')}
                      className="w-full py-2.5 bg-brand-teal-800 hover:bg-brand-teal-900 dark:bg-brand-teal-700 dark:hover:bg-brand-teal-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4 text-brand-olive-300" />
                      <span>{language === 'he' ? 'הזמן שיעור 25 דק׳' : 'Book 25-Min Slot'}</span>
                    </button>
                  </div>
                </div>

                {/* Next Scheduled 25-Min Lesson Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between h-full transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-xl bg-brand-teal-50 dark:bg-brand-teal-950/70 text-brand-teal-800 dark:text-brand-teal-300">
                          <Clock className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {t('dashboard.upcomingLessons')}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-brand-teal-50 dark:bg-brand-teal-950/70 text-brand-teal-800 dark:text-brand-teal-300 text-xs font-bold border border-brand-teal-200 dark:border-brand-teal-800">
                        {language === 'he' ? 'מתכונת 25 דקות' : '25 Min Format'}
                      </span>
                    </div>

                    {upcomingLessons.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-brand-teal-50 dark:bg-brand-teal-950/70 text-brand-teal-800 dark:text-brand-teal-300 flex items-center justify-center font-bold border border-brand-teal-100 dark:border-brand-teal-800 shrink-0">
                            <Video className="w-5 h-5" />
                          </div>
                          <div className="overflow-hidden">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                              {upcomingLessons[0].teacher?.user?.firstName}{' '}
                              {upcomingLessons[0].teacher?.user?.lastName}
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {language === 'he' ? 'מורה מוסמך לעברית' : 'Certified Hebrew Instructor'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                          <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                            <Clock className="w-3.5 h-3.5 text-brand-teal-700 dark:text-brand-teal-400 shrink-0" />
                            <span className="truncate">
                              {formatIsraelDateTime(upcomingLessons[0].scheduledAt, {
                                includeWeekday: true,
                                locale: language === 'he' ? 'he-IL' : 'en-US',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            <Globe2 className="w-3.5 h-3.5 text-brand-olive-600 dark:text-brand-olive-400 shrink-0" />
                            <span>
                              {language === 'he'
                                ? 'שיעור 25 דקות • שעון ישראל'
                                : `25-Minute Session • ${ISRAEL_TZ_LABEL}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-7 flex flex-col items-center justify-center text-center space-y-2">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400">
                          <CalendarIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {language === 'he' ? 'אין שיעורים קרובים' : 'No upcoming lessons scheduled'}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            {language === 'he' ? 'קבע שיעור 25 דקות עם מורה פרטי' : 'Book a 25-minute 1-on-1 session'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-5 border-t border-slate-100 dark:border-slate-800/80 mt-5">
                    {upcomingLessons.length > 0 && upcomingLessons[0].zoomLink ? (
                      <a
                        href={upcomingLessons[0].zoomLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 bg-brand-olive-500 hover:bg-brand-olive-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                      >
                        <Video className="w-4 h-4" />
                        <span>{language === 'he' ? 'כניסה לשיעור בזום' : 'Join Zoom Lesson'}</span>
                      </a>
                    ) : (
                      <button
                        onClick={() => setActiveTab('booking')}
                        className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 text-center"
                      >
                        <CalendarIcon className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-400" />
                        <span>{language === 'he' ? 'קבע את השיעור הבא' : 'Schedule Next Lesson'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Pending Homework Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between h-full transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-xl bg-brand-teal-50 dark:bg-brand-teal-950/70 text-brand-teal-800 dark:text-brand-teal-300">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {t('dashboard.pendingHomework')}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200/80 dark:border-slate-700">
                        {recentHomework.filter((h: any) => h.status === 'ASSIGNED').length > 0
                          ? `${recentHomework.filter((h: any) => h.status === 'ASSIGNED').length} ${language === 'he' ? 'ממתינים' : 'pending'}`
                          : language === 'he' ? 'הכל נבדק' : 'Up to date'}
                      </span>
                    </div>

                    {recentHomework.filter((h: any) => h.status === 'ASSIGNED').length > 0 ? (
                      <div className="space-y-2.5">
                        {recentHomework
                          .filter((h: any) => h.status === 'ASSIGNED')
                          .slice(0, 2)
                          .map((hw: any) => (
                            <div
                              key={hw.id}
                              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                  {hw.title}
                                </span>
                                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                                  {language === 'he' ? 'להגשה בקרוב' : 'Due soon'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                                {hw.description}
                              </p>

                              <div className="pt-1 flex justify-end">
                                <button
                                  onClick={() => setSubmittingHwId(hw.id)}
                                  className="text-xs font-bold text-brand-teal-800 dark:text-brand-teal-400 hover:underline flex items-center gap-1"
                                >
                                  {language === 'he' ? 'הגש שיעורים ←' : 'Submit Work →'}
                                </button>
                              </div>

                              {submittingHwId === hw.id && (
                                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                                  <textarea
                                    rows={2}
                                    value={hwNote}
                                    onChange={(e) => setHwNote(e.target.value)}
                                    placeholder={
                                      language === 'he'
                                        ? 'הוסף הערות או קישור לפתרון שיעורי הבית...'
                                        : 'Add your homework submission notes or link...'
                                    }
                                    className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-teal-800"
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={() => setSubmittingHwId(null)}
                                      className="px-2 py-1 text-xs text-slate-500 dark:text-slate-400 font-semibold"
                                    >
                                      {language === 'he' ? 'ביטול' : 'Cancel'}
                                    </button>
                                    <button
                                      onClick={() =>
                                        submitHomeworkMutation.mutate({
                                          id: hw.id,
                                          note: hwNote,
                                        })
                                      }
                                      className="px-3 py-1 text-xs bg-brand-teal-800 dark:bg-brand-teal-700 text-white font-bold rounded-lg shadow-2xs"
                                    >
                                      {language === 'he' ? 'הגש' : 'Turn In'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="py-7 flex flex-col items-center justify-center text-center space-y-2">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {language === 'he' ? 'כל המשימות הושלמו!' : 'All caught up!'}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            {language === 'he' ? 'אין שיעורי בית ממתינים לבדיקה' : 'No homework pending review'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-5 border-t border-slate-100 dark:border-slate-800/80 mt-5">
                    <button
                      onClick={() => setActiveTab('homework')}
                      className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 text-center"
                    >
                      <BookOpen className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-400" />
                      <span>{language === 'he' ? 'צפה בכל שיעורי הבית' : 'View All Homework'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Completed Lessons & Recordings Preview */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-brand-teal-800 dark:text-brand-teal-400" />
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {language === 'he'
                        ? 'שיעורים אחרונים והקלטות Google Drive'
                        : 'Recent Lessons & Google Drive Recordings'}
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('lessons')}
                    className="text-xs font-bold text-brand-teal-800 dark:text-brand-teal-400 hover:underline"
                  >
                    {language === 'he' ? 'צפה בהכל ←' : 'View All →'}
                  </button>
                </div>
                {recentLessons.slice(0, 2).map((lesson: any) => (
                  <div
                    key={lesson.id}
                    className="p-3.5 mb-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {language === 'he' ? 'שיעור 25 דק׳ עם' : '25m Lesson with'}{' '}
                        {lesson.teacher?.user?.firstName} {lesson.teacher?.user?.lastName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {new Date(lesson.scheduledAt).toLocaleDateString()} •{' '}
                        {language === 'he' ? '25 דק׳ (שעון ישראל)' : '25 min (IST)'}
                      </p>
                    </div>
                    {lesson.recordingUrl && (
                      <a
                        href={lesson.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-teal-800 dark:text-brand-teal-400 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{language === 'he' ? 'צפייה בהקלטה' : 'Watch Recording'}</span>
                      </a>
                    )}
                  </div>
                ))}
                {recentLessons.length === 0 && (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    {language === 'he'
                      ? 'טרם הושלמו שיעורים. הזמן שיעור ראשון בן 25 דקות!'
                      : 'No completed lessons yet. Book your first 25-minute lesson to start!'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BOOK SESSION (25 / 40 / 55 MIN) */}
          {activeTab === 'booking' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-6 h-6 text-brand-teal-800 dark:text-brand-teal-400" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {language === 'he' ? 'הזמנת שיעור חי (25 / 40 / 55 דקות)' : 'Book a Live Session (25 / 40 / 55 Min)'}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {language === 'he'
                      ? 'בחר משך שיעור, מורה מוסמך, תאריך ושעה זמינה בפורמט 12 שעות לפי שעון ישראל.'
                      : 'Select session duration, certified teacher, date, and available slot in Israel Standard Time (12-hour AM/PM).'}
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-brand-teal-50 dark:bg-brand-teal-950/70 border border-brand-teal-200 dark:border-brand-teal-800">
                  <span className="text-xs font-bold text-brand-teal-800 dark:text-brand-teal-300">
                    {remainingLessons}{' '}
                    {language === 'he' ? 'נקודות שיעור זמינות' : 'Session Credits Available'}
                  </span>
                </div>
              </div>

              {/* Zero credits warning banner */}
              {remainingLessons <= 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <p className="font-bold">
                      {language === 'he' ? 'אין ברשותך נקודות שיעור זמינות' : 'No Session Credits Available'}
                    </p>
                    <p className="mt-0.5 opacity-90 leading-relaxed">
                      {language === 'he'
                        ? 'כדי להזמין שיעור, יש לקבל נקודות שיעור ממנהל Engrew או לרכוש חבילת שיעורים.'
                        : 'To book a session, please contact your Engrew administrator to grant session credits or assign a package.'}
                    </p>
                  </div>
                </div>
              )}

              {bookingError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}

              {/* Step 1: Select Session Duration */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {language === 'he' ? '1. בחר משך שיעור' : '1. Select Session Duration'}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { dur: 25, labelEn: '25 Minutes', labelHe: '25 דקות', color: 'emerald' },
                    { dur: 40, labelEn: '40 Minutes', labelHe: '40 דקות', color: 'sky' },
                    { dur: 55, labelEn: '55 Minutes', labelHe: '55 דקות', color: 'purple' },
                  ].map((item) => (
                    <button
                      key={item.dur}
                      type="button"
                      onClick={() => {
                        setSelectedDuration(item.dur as 25 | 40 | 55);
                        setSelectedSlotTime('');
                      }}
                      className={`p-3.5 rounded-2xl border text-center transition-all ${
                        selectedDuration === item.dur
                          ? item.dur === 55
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs ring-2 ring-purple-400'
                            : item.dur === 40
                            ? 'bg-sky-600 text-white border-sky-600 shadow-xs ring-2 ring-sky-400'
                            : 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-400'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className="block text-sm font-extrabold">
                        {language === 'he' ? item.labelHe : item.labelEn}
                      </span>
                      <span className="text-[10px] opacity-80 block mt-0.5">
                        {language === 'he' ? '1 נקודת שיעור' : '1 Session Credit'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Select Teacher */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {language === 'he' ? '2. בחר מורה מוסמך לעברית' : '2. Select Certified Hebrew Teacher'}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(teachersData || []).map((t: any) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTeacherId(t.id);
                        setSelectedSlotTime('');
                      }}
                      className={`p-4 rounded-2xl border text-start transition-all ${
                        selectedTeacherId === t.id
                          ? 'border-brand-teal-800 bg-brand-teal-50/60 dark:bg-brand-teal-950/60 ring-2 ring-brand-teal-800'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <img
                          src={
                            t.user?.avatarUrl ||
                            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
                          }
                          alt={t.user?.firstName}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-teal-700/20"
                        />
                        <div className="overflow-hidden flex-1">
                          <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {t.user?.firstName} {t.user?.lastName}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-500" />
                            <span>{t.ratingAvg || '4.95'}</span>
                            <span className="text-slate-400 font-normal">
                              • {language === 'he' ? 'מורה מוסמך' : 'Certified Instructor'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {t.bio || (language === 'he' ? 'מורה מקצועי בעל ניסיון רב.' : 'Experienced native Hebrew educator.')}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Choose Date */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {language === 'he' ? '3. בחר תאריך לשיעור' : '3. Choose Lesson Date'}
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full max-w-sm px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
                />
              </div>

              {/* Step 4: Available Slots matching Selected Duration */}
              {selectedTeacher && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {language === 'he'
                        ? `4. בחר שעת שיעור (${selectedDuration} דק׳) - ${selectedTeacher.user?.firstName}`
                        : `4. Select Slot (${selectedDuration} Min) - ${selectedTeacher.user?.firstName}`}
                    </label>
                    <span className="text-[11px] text-brand-teal-800 dark:text-brand-teal-300 font-bold bg-brand-teal-50 dark:bg-brand-teal-950/60 px-2.5 py-0.5 rounded-md border border-brand-teal-200 dark:border-brand-teal-800">
                      {language === 'he' ? 'שעון 12 שעות • שעון ישראל' : `12h System • ${ISRAEL_TZ_LABEL}`}
                    </span>
                  </div>
                  {(() => {
                    const matchingSlots = (selectedTeacher.timeSlots || []).filter((slot: any) => {
                      const dur = getSlotDurationMinutes(slot.startTime, slot.endTime);
                      return dur === selectedDuration;
                    });

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-1">
                        {matchingSlots.map((slot: any) => {
                          const isSelected = selectedSlotTime === slot.startTime;
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => setSelectedSlotTime(slot.startTime)}
                              className={`p-3 rounded-2xl border text-center transition-all ${
                                isSelected
                                  ? selectedDuration === 55
                                    ? 'bg-purple-600 text-white border-purple-600 font-bold shadow-xs ring-2 ring-purple-400'
                                    : selectedDuration === 40
                                    ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-xs ring-2 ring-sky-400'
                                    : 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs ring-2 ring-emerald-400'
                                  : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <p className="font-mono text-xs font-bold leading-tight">
                                {formatSlotRange12Hour(slot.startTime, slot.endTime)}
                              </p>
                              <p className="text-[10px] opacity-80 mt-1">
                                {selectedDuration} {language === 'he' ? 'דק׳ (שעון ישראל)' : 'min (IST)'}
                              </p>
                            </button>
                          );
                        })}
                        {matchingSlots.length === 0 && (
                          <div className="col-span-2 sm:col-span-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
                            {language === 'he'
                              ? `לא נמצאו שעות פנויות של ${selectedDuration} דקות עבור מורה זה. נסה לבחור משך שיעור אחר או מורה אחר.`
                              : `No ${selectedDuration}-minute slots available for this teacher. Please try another duration or teacher.`}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Submit Booking */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={handleBookingSubmit}
                  disabled={bookLessonMutation.isPending || remainingLessons <= 0}
                  className="px-6 py-3 rounded-2xl bg-brand-teal-800 hover:bg-brand-teal-900 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-brand-olive-300" />
                  <span>
                    {bookLessonMutation.isPending
                      ? (language === 'he' ? 'מאשר הזמנה...' : 'Confirming Booking...')
                      : (language === 'he' ? `אישור הזמנת שיעור (${selectedDuration} דק׳)` : `Confirm ${selectedDuration}-Min Booking`)}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: LESSONS & RECORDINGS */}
          {activeTab === 'lessons' && (
            <div className="space-y-8">
              {/* Upcoming Lessons */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-brand-teal-800 dark:text-brand-teal-400" />
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {language === 'he'
                        ? 'שיעורים חיים קרובים'
                        : 'Upcoming Live Sessions'}
                    </h2>
                  </div>
                  <span className="text-xs font-bold text-brand-olive-700 dark:text-brand-olive-300 bg-brand-olive-50 dark:bg-brand-olive-950/60 px-2.5 py-0.5 rounded-full border border-brand-olive-200 dark:border-brand-olive-800">
                    {upcomingLessons.length}{' '}
                    {language === 'he' ? 'מתוזמנים' : 'Scheduled'}
                  </span>
                </div>

                {upcomingLessons.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingLessons.map((l: any) => {
                      const lessonDur = l.durationMinutes || 25;
                      return (
                        <div
                          key={l.id}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-teal-100 dark:bg-brand-teal-950/80 text-brand-teal-800 dark:text-brand-teal-300 flex items-center justify-center font-bold">
                              <Clock className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-slate-900 dark:text-white">
                                  {l.teacher?.user?.firstName} {l.teacher?.user?.lastName}
                                </p>
                                <span
                                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                                    lessonDur === 55
                                      ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                      : lessonDur === 40
                                      ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  }`}
                                >
                                  {lessonDur} {language === 'he' ? 'דקות' : 'Min'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {formatIsraelDateTime(l.scheduledAt, {
                                  includeWeekday: true,
                                  locale: language === 'he' ? 'he-IL' : 'en-US',
                                })}{' '}
                                • {lessonDur} {language === 'he' ? 'דק׳ (שעון ישראל)' : `min (${ISRAEL_TZ_LABEL})`}
                              </p>
                            </div>
                          </div>

                          {l.zoomLink && (
                            <a
                              href={l.zoomLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-brand-olive-500 hover:bg-brand-olive-600 text-slate-950 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-2 self-start sm:self-auto"
                            >
                              <Video className="w-4 h-4" />
                              <span>{language === 'he' ? 'כניסה לשיעור בזום' : 'Join Zoom Lesson'}</span>
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    {language === 'he'
                      ? 'אין שיעורים קרובים. היכנס ללשונית הזמנת שיעור לקביעת מועד נוח.'
                      : 'No upcoming lessons. Head over to Book Session to reserve your next lesson.'}
                  </p>
                )}
              </div>

              {/* Completed Lessons & Recordings History */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-brand-teal-800 dark:text-brand-teal-400" />
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {language === 'he'
                        ? 'שיעורים שהושלמו והקלטות'
                        : 'Completed Lessons & Recordings'}
                    </h2>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {language === 'he' ? 'הוקלט עבור החזרה שלך' : 'Recorded for your review'}
                  </span>
                </div>

                {recentLessons.length > 0 ? (
                  <div className="space-y-4">
                    {recentLessons.map((lesson: any) => {
                      const lessonDur = lesson.durationMinutes || 25;
                      return (
                        <div
                          key={lesson.id}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                {language === 'he' ? `שיעור (${lessonDur} דק׳) עם` : `${lessonDur}m Lesson with`}{' '}
                                {lesson.teacher?.user?.firstName} {lesson.teacher?.user?.lastName}
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  lessonDur === 55
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                                    : lessonDur === 40
                                    ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                }`}
                              >
                                {lessonDur}m
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {new Date(lesson.scheduledAt).toLocaleDateString()}
                            </span>
                          </div>

                          {lesson.teacherNotes && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
                              <strong className="text-slate-800 dark:text-slate-200">
                                {language === 'he' ? 'סיכום המורה:' : 'Session Notes:'}
                              </strong>{' '}
                              {lesson.teacherNotes}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-1">
                            {lesson.recordingUrl ? (
                              <a
                                href={lesson.recordingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-teal-800 dark:text-brand-teal-400 hover:underline"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>
                                  {language === 'he'
                                    ? 'צפייה בהקלטה (Google Drive)'
                                    : 'Watch Recording (Google Drive)'}
                                </span>
                              </a>
                            ) : (
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                                {language === 'he' ? 'ההקלטה תועלה בקרוב' : 'Recording uploading soon'}
                              </span>
                            )}

                            {!lesson.feedback && (
                              <button
                                onClick={() => setRatingLessonId(lesson.id)}
                                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 flex items-center gap-1"
                              >
                                <Star className="w-3.5 h-3.5" />
                                <span>{language === 'he' ? 'דרג שיעור' : 'Rate Lesson'}</span>
                              </button>
                            )}
                          </div>

                          {/* Rating Modal / Inline Form */}
                          {ratingLessonId === lesson.id && (
                            <div className="mt-3 p-3 bg-amber-50/60 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/80 space-y-2 text-xs">
                              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                {language === 'he'
                                  ? 'דרג את איכות השיעור (1–5 כוכבים):'
                                  : 'Rate Lesson Quality (1–5 Stars):'}
                              </span>
                              <div className="flex gap-1.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRatingVal(star)}
                                    className="p-1"
                                  >
                                    <Star
                                      className={`w-4 h-4 ${
                                        star <= ratingVal
                                          ? 'text-amber-500 fill-amber-500'
                                          : 'text-slate-300 dark:text-slate-600'
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                              <input
                                type="text"
                                value={ratingComment}
                                onChange={(e) => setRatingComment(e.target.value)}
                                placeholder={
                                  language === 'he'
                                    ? 'הוסף משוב או הערה למורה (אופציונלי)...'
                                    : 'Leave a comment for your teacher (optional)...'
                                }
                                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs"
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setRatingLessonId(null)}
                                  className="px-2.5 py-1 text-slate-600 dark:text-slate-400 font-semibold"
                                >
                                  {language === 'he' ? 'ביטול' : 'Cancel'}
                                </button>
                                <button
                                  onClick={() =>
                                    submitFeedbackMutation.mutate({
                                      lessonId: lesson.id,
                                      rating: ratingVal,
                                      comment: ratingComment,
                                    })
                                  }
                                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-2xs"
                                >
                                  {language === 'he' ? 'שלח דירוג' : 'Submit Rating'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    {language === 'he'
                      ? 'טרם הושלמו שיעורים. הזמן שיעור ראשון כדי להתחיל!'
                      : 'No completed lessons yet. Book your first lesson to begin!'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: HOMEWORK & FEEDBACK */}
          {activeTab === 'homework' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-brand-teal-800 dark:text-brand-teal-400" />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {language === 'he'
                      ? 'שיעורי בית שהוקצו ומשוב המורה'
                      : 'Assigned Homework & Teacher Feedback'}
                  </h2>
                </div>
                <span className="text-xs font-bold text-brand-teal-800 dark:text-brand-teal-300 bg-brand-teal-50 dark:bg-brand-teal-950/70 px-2.5 py-1 rounded-full border border-brand-teal-200 dark:border-brand-teal-800">
                  {recentHomework.length}{' '}
                  {language === 'he' ? 'משימות בסך הכל' : 'Total Assignments'}
                </span>
              </div>

              {recentHomework.length > 0 ? (
                <div className="space-y-4">
                  {recentHomework.map((hw: any) => (
                    <div
                      key={hw.id}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                          {hw.title}
                        </h3>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            hw.status === 'GRADED'
                              ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : hw.status === 'SUBMITTED'
                              ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              : 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {language === 'he'
                            ? hw.status === 'GRADED'
                              ? 'נבדק'
                              : hw.status === 'SUBMITTED'
                              ? 'הוגש'
                              : 'הוקצה'
                            : hw.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {hw.description}
                      </p>

                      {hw.studentNote && (
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700 text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {language === 'he' ? 'התשובה שהגשת:' : 'Your Submission:'}
                          </span>{' '}
                          <span className="text-slate-600 dark:text-slate-400">
                            {hw.studentNote}
                          </span>
                        </div>
                      )}

                      {hw.teacherFeedback && (
                        <div className="p-3 bg-brand-teal-50/60 dark:bg-brand-teal-950/60 rounded-xl border border-brand-teal-200/80 dark:border-brand-teal-800 text-xs text-brand-teal-950 dark:text-brand-teal-200">
                          <strong>{language === 'he' ? 'משוב המורה:' : 'Teacher Feedback:'}</strong>{' '}
                          {hw.teacherFeedback}
                        </div>
                      )}

                      {hw.status === 'ASSIGNED' && (
                        <div className="pt-2">
                          {submittingHwId === hw.id ? (
                            <div className="space-y-2">
                              <textarea
                                rows={3}
                                value={hwNote}
                                onChange={(e) => setHwNote(e.target.value)}
                                placeholder={
                                  language === 'he'
                                    ? 'הדבק את תשובתך, סיכומך או קישור למסמך...'
                                    : 'Paste your answers, summary, or link...'
                                }
                                className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-teal-800"
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setSubmittingHwId(null)}
                                  className="px-3 py-1.5 text-xs text-slate-500 font-semibold"
                                >
                                  {language === 'he' ? 'ביטול' : 'Cancel'}
                                </button>
                                <button
                                  onClick={() =>
                                    submitHomeworkMutation.mutate({
                                      id: hw.id,
                                      note: hwNote,
                                    })
                                  }
                                  className="px-4 py-1.5 text-xs bg-brand-teal-800 dark:bg-brand-teal-700 text-white font-bold rounded-xl shadow-xs"
                                >
                                  {language === 'he' ? 'הגש שיעורי בית' : 'Turn In Homework'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSubmittingHwId(hw.id)}
                              className="px-4 py-2 bg-brand-teal-800 dark:bg-brand-teal-700 hover:bg-brand-teal-900 text-white font-bold text-xs rounded-xl shadow-2xs"
                            >
                              {language === 'he' ? 'הגש שיעורי בית ←' : 'Submit Homework →'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-8 text-center">
                  {language === 'he' ? 'אין שיעורי בית ממתינים כעת.' : 'No homework assignments currently.'}
                </p>
              )}
            </div>
          )}

          {/* TAB 5: HEBREW GAMES */}
          {activeTab === 'games' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-6 h-6 text-brand-teal-800 dark:text-brand-teal-400" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {t('games.title')}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {t('games.subtitle')}
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 bg-brand-teal-50 dark:bg-brand-teal-950/70 text-brand-teal-800 dark:text-brand-teal-300 rounded-full self-start sm:self-auto border border-brand-teal-200 dark:border-brand-teal-800">
                  {language === 'he' ? 'מותאם לרמתך:' : 'Filtered for your level:'}{' '}
                  {t(`levels.${student?.level || 'BEGINNER'}`)}
                </span>
              </div>

              {/* Active Game Modal / Container */}
              {activeGame ? (
                <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-brand-teal-100 dark:border-slate-700 mb-8">
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => setActiveGame(null)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      <span>{language === 'he' ? 'סגור משחק' : 'Close Game'}</span>
                    </button>
                  </div>

                  {activeGame.gameType === 'FLASHCARD' && (
                    <FlashcardGame
                      gameId={activeGame.id}
                      title={language === 'he' ? activeGame.titleHe : activeGame.title}
                      titleHe={activeGame.titleHe}
                      cards={activeGame.configJson?.cards || []}
                      pointsReward={activeGame.pointsReward}
                      onFinish={() => {
                        queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
                        setActiveGame(null);
                      }}
                    />
                  )}

                  {activeGame.gameType === 'QUIZ' && (
                    <QuizGame
                      gameId={activeGame.id}
                      title={language === 'he' ? activeGame.titleHe : activeGame.title}
                      titleHe={activeGame.titleHe}
                      questions={activeGame.configJson?.questions || []}
                      pointsReward={activeGame.pointsReward}
                      onFinish={() => {
                        queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
                        setActiveGame(null);
                      }}
                    />
                  )}

                  {activeGame.gameType === 'MATCHING' && (
                    <MatchingGame
                      gameId={activeGame.id}
                      title={language === 'he' ? activeGame.titleHe : activeGame.title}
                      titleHe={activeGame.titleHe}
                      pairs={activeGame.configJson?.pairs || []}
                      pointsReward={activeGame.pointsReward}
                      onFinish={() => {
                        queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
                        setActiveGame(null);
                      }}
                    />
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Level Filter Bar */}
                  <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {language === 'he' ? 'סינון רמה:' : 'Level Filter:'}
                    </span>
                    {(['ALL', 'BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'ADVANCED'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setStudentGameLevelFilter(lvl)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                          studentGameLevelFilter === lvl
                            ? 'bg-brand-teal-800 text-white'
                            : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {lvl === 'ALL'
                          ? language === 'he'
                            ? 'כל הרמות'
                            : 'All Levels'
                          : t(`levels.${lvl}`)}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                    {(gamesData || [])
                      .filter((game: any) => {
                        if (studentGameLevelFilter !== 'ALL' && game.level !== studentGameLevelFilter) return false;
                        return true;
                      })
                      .map((game: any) => {
                        const levelColor =
                          game.level === 'ADVANCED'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : game.level === 'INTERMEDIATE'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                            : game.level === 'ELEMENTARY'
                            ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';

                        return (
                          <div
                            key={game.id}
                            className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 hover:border-brand-teal-300 dark:hover:border-brand-teal-500 hover:shadow-xs transition-all flex flex-col justify-between h-full"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 bg-brand-teal-50 dark:bg-brand-teal-950/70 text-brand-teal-800 dark:text-brand-teal-300 rounded-md border border-brand-teal-100 dark:border-brand-teal-800">
                                    {game.gameType}
                                  </span>
                                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${levelColor}`}>
                                    {t(`levels.${game.level || 'BEGINNER'}`)}
                                  </span>
                                </div>
                                <span className="text-xs font-bold text-brand-olive-700 dark:text-brand-olive-300 bg-brand-olive-50 dark:bg-brand-olive-950/60 px-2 py-0.5 rounded-md border border-brand-olive-200 dark:border-brand-olive-800">
                                  +{game.pointsReward} {language === 'he' ? 'נק׳' : 'pts'}
                                </span>
                              </div>

                              {/* Lesson Link or Teacher Customization Badge */}
                              {game.lesson ? (
                                <div className="px-3 py-1.5 rounded-xl bg-brand-teal-50 dark:bg-brand-teal-950/50 border border-brand-teal-200/60 dark:border-brand-teal-800 text-[11px] text-brand-teal-900 dark:text-brand-teal-300 font-semibold flex items-center gap-1.5">
                                  <Video className="w-3.5 h-3.5 text-brand-teal-600 dark:text-brand-teal-400 shrink-0" />
                                  <span>
                                    {language === 'he'
                                      ? `תרגול ישיר לשיעור שלך (${game.lesson.durationMinutes || 25} דק׳)`
                                      : `Practice linked to your lesson (${game.lesson.durationMinutes || 25} min)`}
                                  </span>
                                </div>
                              ) : game.createdBy ? (
                                <div className="px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
                                  {language === 'he'
                                    ? `הותאם ע״י מורה: ${game.createdBy.firstName}`
                                    : `Customized by: Teacher ${game.createdBy.firstName}`}
                                </div>
                              ) : null}

                              <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
                                  {language === 'he' ? game.titleHe : game.title}
                                </h3>
                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                  {game.description}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => setActiveGame(game)}
                              className="mt-6 w-full py-3 bg-brand-teal-800 hover:bg-brand-teal-900 dark:bg-brand-teal-700 dark:hover:bg-brand-teal-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                            >
                              <Gamepad2 className="w-4 h-4 text-brand-olive-300" />
                              <span>{language === 'he' ? 'התחל לשחק' : 'Start Playing'}</span>
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-amber-500" />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t('nav.leaderboard')}
                  </h2>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {language === 'he' ? 'מובילי הלמידה בעברית' : 'Top Hebrew Students'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-start text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">
                      <th className="pb-3 text-start">{language === 'he' ? 'דירוג' : 'Rank'}</th>
                      <th className="pb-3 text-start">{language === 'he' ? 'תלמיד' : 'Student'}</th>
                      <th className="pb-3 text-start">{language === 'he' ? 'רמה' : 'Level'}</th>
                      <th className="pb-3 text-end">{language === 'he' ? 'נקודות' : 'Points'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {leaderboardData?.map((entry: any, idx: number) => (
                      <tr
                        key={entry.studentId}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                      >
                        <td className="py-3 font-bold text-slate-700 dark:text-slate-300">
                          #{idx + 1}
                        </td>
                        <td className="py-3 font-semibold text-slate-900 dark:text-white">
                          {entry.student?.user?.firstName} {entry.student?.user?.lastName}
                        </td>
                        <td className="py-3 text-xs text-slate-500 dark:text-slate-400">
                          {t(`levels.${entry.student?.level || 'BEGINNER'}`)}
                        </td>
                        <td className="py-3 text-end font-extrabold text-amber-600 dark:text-amber-400">
                          {entry.totalPoints} {language === 'he' ? 'נק׳' : 'pts'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MULTI-DURATION LESSON BOOKING MODAL (Available on quick-click from sidebar or anywhere) */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-transparent dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-teal-800 dark:text-brand-teal-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {language === 'he' ? 'הזמנת שיעור חי' : 'Book a Live Session'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-teal-50 dark:bg-brand-teal-950/70 border border-brand-teal-200 dark:border-brand-teal-800 text-brand-teal-800 dark:text-brand-teal-300">
                  {remainingLessons} {language === 'he' ? 'נק׳ זמינות' : 'credits'}
                </span>
                <button
                  onClick={() => {
                    setIsBookingModalOpen(false);
                    setBookingError(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {remainingLessons <= 0 && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  {language === 'he'
                    ? 'אין לך נקודות שיעור זמינות. פנה למנהל להוספת נקודות.'
                    : 'No session credits available. Contact admin to grant credits.'}
                </span>
              </div>
            )}

            {bookingError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              {/* Step 1: Duration Selection */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'he' ? '1. בחר משך שיעור' : '1. Choose Duration'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[25, 40, 55].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setSelectedDuration(d as 25 | 40 | 55);
                        setSelectedSlotTime('');
                      }}
                      className={`py-2 px-3 rounded-xl font-bold text-center border transition-all ${
                        selectedDuration === d
                          ? d === 55
                            ? 'bg-purple-600 text-white border-purple-600 ring-2 ring-purple-400 shadow-xs'
                            : d === 40
                            ? 'bg-sky-600 text-white border-sky-600 ring-2 ring-sky-400 shadow-xs'
                            : 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-400 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {d} {language === 'he' ? 'דקות' : 'Min'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Teacher Selection */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'he' ? '2. בחר מורה מוסמך לעברית' : '2. Select Certified Hebrew Teacher'}
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1 max-h-36 overflow-y-auto p-0.5">
                  {(teachersData || []).map((t: any) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTeacherId(t.id);
                        setSelectedSlotTime('');
                      }}
                      className={`p-3 rounded-2xl border text-start transition-all ${
                        selectedTeacherId === t.id
                          ? 'border-brand-teal-800 bg-brand-teal-50/60 dark:bg-brand-teal-950/60 ring-2 ring-brand-teal-800'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <img
                          src={
                            t.user?.avatarUrl ||
                            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
                          }
                          alt={t.user?.firstName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="overflow-hidden">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {t.user?.firstName} {t.user?.lastName}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                            <Star className="w-3 h-3 fill-amber-500" />
                            <span>{t.ratingAvg || '4.95'}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {t.bio}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Date Selection */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'he' ? '3. בחר תאריך לשיעור' : '3. Choose Lesson Date'}
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
                />
              </div>

              {/* Step 4: Teacher's Available Slots for chosen duration */}
              {selectedTeacher && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                      {language === 'he'
                        ? `4. בחר שעת שיעור (${selectedDuration} דקות) - ${selectedTeacher.user?.firstName}`
                        : `4. Select Slot (${selectedDuration} Min) - ${selectedTeacher.user?.firstName}`}
                    </label>
                    <span className="text-[10px] text-brand-teal-800 dark:text-brand-teal-300 font-bold bg-brand-teal-50 dark:bg-brand-teal-950/60 px-2 py-0.5 rounded-md border border-brand-teal-200 dark:border-brand-teal-800">
                      {language === 'he' ? 'שעון 12 שעות • שעון ישראל' : `12h • ${ISRAEL_TZ_LABEL}`}
                    </span>
                  </div>
                  {(() => {
                    const matchingSlots = (selectedTeacher.timeSlots || []).filter((slot: any) => {
                      const dur = getSlotDurationMinutes(slot.startTime, slot.endTime);
                      return dur === selectedDuration;
                    });

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1 max-h-44 overflow-y-auto p-1">
                        {matchingSlots.map((slot: any) => (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setSelectedSlotTime(slot.startTime)}
                            className={`p-2.5 rounded-xl border text-center transition-all ${
                              selectedSlotTime === slot.startTime
                                ? selectedDuration === 55
                                  ? 'bg-purple-600 text-white border-purple-600 font-bold shadow-xs ring-2 ring-purple-400'
                                  : selectedDuration === 40
                                  ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-xs ring-2 ring-sky-400'
                                  : 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs ring-2 ring-emerald-400'
                                : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <p className="font-mono text-xs font-bold leading-tight">
                              {formatSlotRange12Hour(slot.startTime, slot.endTime)}
                            </p>
                            <p className="text-[10px] opacity-80 mt-0.5">
                              {selectedDuration} {language === 'he' ? 'דק׳ (שעון ישראל)' : 'min (IST)'}
                            </p>
                          </button>
                        ))}
                        {matchingSlots.length === 0 && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 italic col-span-3 py-3 text-center">
                            {language === 'he'
                              ? `לא הוגדרו שעות זמינות של ${selectedDuration} דקות עבור מורה זה.`
                              : `No ${selectedDuration}-minute slots set for this teacher.`}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </button>
              <button
                onClick={handleBookingSubmit}
                disabled={bookLessonMutation.isPending || remainingLessons <= 0}
                className="flex-1 py-2.5 rounded-xl bg-brand-teal-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold hover:bg-brand-teal-900 shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4 text-brand-olive-300" />
                <span>
                  {bookLessonMutation.isPending
                    ? (language === 'he' ? 'מאשר...' : 'Confirming...')
                    : (language === 'he' ? `אישור הזמנה (${selectedDuration} דק׳)` : `Confirm ${selectedDuration}-Min Booking`)}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
