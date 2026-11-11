import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useSidebarStore } from '../../store/sidebarStore';
import { toast } from '../../store/toastStore';
import { FlashcardGame } from '../../components/games/FlashcardGame';
import { QuizGame } from '../../components/games/QuizGame';
import { MatchingGame } from '../../components/games/MatchingGame';
import { GlassSidebar } from '../../components/common/GlassSidebar';
import { DashboardSkeleton } from '../../components/common/DashboardSkeleton';
import { DriveViewerModal } from '../../components/common/DriveViewerModal';
import { RescheduleModal } from '../../components/student/RescheduleModal';
import { LiveLessonCountdownIsland } from '../../components/lessons/LiveLessonCountdownIsland';
import { haptics } from '../../utils/haptics';
import { triggerConfetti } from '../../utils/confetti';
import { getGoogleCalendarUrl, downloadIcsFile } from '../../utils/calendarSync';
import { StructuredNotesViewer } from '../../components/lessons/StructuredNotesViewer';
import { CertificateModal, CertificateData } from '../../components/common/CertificateModal';
import { isGoogleDriveUrl, getVideoEmbedUrl } from '../../lib/driveUtils';
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
  Download,
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
  AlertTriangle,
  UserCheck,
  Plus,
  X,
  Sparkles,
  Layers,
  GraduationCap,
  Globe2,
  LayoutDashboard,
  LayoutGrid,
  Gift,
  Home,
  Menu,
  PlayCircle,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Wallet,
  Maximize2,
  Sliders,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Receipt,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

// Custom outline Home icon with inner circle door matching iOS pill island aesthetic
const HomeIslandIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2.5 3 9.5v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-10l-9-7Z" />
    <circle cx="12" cy="14" r="2.2" />
  </svg>
);

const StudentProgressTab = React.lazy(() =>
  import('../../components/student/StudentProgressTab').then((m) => ({ default: m.StudentProgressTab }))
);

export const StudentDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { isCollapsed } = useSidebarStore();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'booking' | 'lessons' | 'recordings' | 'homework' | 'games' | 'leaderboard' | 'balance' | 'progress'
  >(() => {
    if (location.pathname.includes('/games')) return 'games';
    if (location.pathname.includes('/leaderboard')) return 'leaderboard';
    if (location.pathname.includes('/recordings')) return 'recordings';
    if (location.pathname.includes('/balance') || location.pathname.includes('/transactions')) return 'balance';
    if (location.pathname.includes('/progress') || location.pathname.includes('/analytics')) return 'progress';
    return 'overview';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

  useEffect(() => {
    if (location.pathname.includes('/games')) {
      setActiveTab('games');
    } else if (location.pathname.includes('/leaderboard')) {
      setActiveTab('leaderboard');
    } else if (location.pathname.includes('/recordings')) {
      setActiveTab('recordings');
    } else if (location.pathname.includes('/balance') || location.pathname.includes('/transactions')) {
      setActiveTab('balance');
    } else if (location.pathname.includes('/progress') || location.pathname.includes('/analytics')) {
      setActiveTab('progress');
    }
  }, [location.pathname]);

  const [activeGame, setActiveGame] = useState<any | null>(null);
  const [studentGameLevelFilter, setStudentGameLevelFilter] = useState<string>('ALL');
  const [submittingHwId, setSubmittingHwId] = useState<string | null>(null);
  const [hwNote, setHwNote] = useState('');
  // Rate Lesson State
  const [ratingLessonTarget, setRatingLessonTarget] = useState<any | null>(null);
  const [lessonRatingVal, setLessonRatingVal] = useState<number>(0);
  const [hoverLessonStar, setHoverLessonStar] = useState<number>(0);
  const [lessonPace, setLessonPace] = useState<number>(3);
  const [lessonDifficulty, setLessonDifficulty] = useState<number>(3);
  const [lessonComment, setLessonComment] = useState<string>('');
  const [lessonRatingError, setLessonRatingError] = useState<string | null>(null);

  // Rate Teacher State
  const [ratingTeacherTarget, setRatingTeacherTarget] = useState<any | null>(null);
  const [teacherOverallRating, setTeacherOverallRating] = useState<number>(0);

  // Promotional Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const handleValidateCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!couponInput.trim()) return;

    setIsValidatingCoupon(true);
    try {
      const res = await api.post('/packages/validate-coupon', {
        code: couponInput.trim(),
        amount: 100,
      });
      setAppliedCoupon(res.data);
      haptics.success();
      triggerConfetti.celebrate();
      toast.success(
        language === 'he'
          ? `קוד קופון ${res.data.code} הופעל בהצלחה!`
          : `Promo code ${res.data.code} applied successfully!`
      );
    } catch (err: any) {
      haptics.error();
      const msg = err.response?.data?.message || err.response?.data?.error || (language === 'he' ? 'קוד קופון לא תקין או פג תוקף' : 'Invalid or expired coupon code');
      toast.error(msg);
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };
  const [hoverTeacherStar, setHoverTeacherStar] = useState<number>(0);
  const [teacherCommunication, setTeacherCommunication] = useState<number>(5);
  const [teacherKnowledge, setTeacherKnowledge] = useState<number>(5);
  const [teacherPunctuality, setTeacherPunctuality] = useState<number>(5);
  const [teacherComment, setTeacherComment] = useState<string>('');
  const [teacherRatingError, setTeacherRatingError] = useState<string | null>(null);
  const [reschedulingLesson, setReschedulingLesson] = useState<any | null>(null);
  const [selectedCert, setSelectedCert] = useState<CertificateData | null>(null);

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

  // Fetch Admin Configured Session Pricing by Duration
  const { data: sessionPricing } = useQuery({
    queryKey: ['sessionPricing'],
    queryFn: async () => {
      const res = await api.get('/settings/session-pricing');
      return res.data?.pricing;
    },
  });

  // Fetch Student Account Balance & Transactions History
  const {
    data: transactionsResponse,
    isLoading: isTransactionsLoading,
    isRefetching: isTransactionsRefetching,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ['studentTransactions', user?.id],
    queryFn: async () => {
      const res = await api.get(`/students/${user?.id}/transactions`);
      return res.data;
    },
    enabled: !!user?.id,
  });

  const studentTransactions: any[] = transactionsResponse?.transactions || [];
  const transactionsSummary = transactionsResponse?.summary || {
    totalDeposited: 0,
    totalSpent: 0,
    totalRefunded: 0,
    transactionCount: 0,
  };

  const [transactionTypeFilter, setTransactionTypeFilter] = useState<'ALL' | 'BOOKINGS' | 'DEPOSITS' | 'REFUNDS'>('ALL');
  const [transactionSearchQuery, setTransactionSearchQuery] = useState('');

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

  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'weekly' | 'monthly' | 'all_time'>('weekly');

  // 4. Fetch Leaderboard (Weekly, Monthly Seasons & All-Time)
  const { data: leaderboardData = [], isLoading: isLeaderboardLoading } = useQuery({
    queryKey: ['leaderboard', leaderboardPeriod],
    queryFn: async () => {
      const res = await api.get(`/games/leaderboard?period=${leaderboardPeriod}`);
      return res.data.leaderboard || [];
    },
  });

  // 5. Fetch Recorded Sessions (Google Drive Video Portal)
  const { data: recordedSessions = [] } = useQuery({
    queryKey: ['studentRecordedSessions', user?.id],
    queryFn: async () => {
      const res = await api.get('/recorded-sessions');
      return res.data.sessions || [];
    },
    enabled: !!user?.id,
  });

  // 6. Fetch Student Certificates of Completion
  const { data: certificatesData = [] } = useQuery<CertificateData[]>({
    queryKey: ['studentCertificates', dashboard?.student?.id],
    queryFn: async () => {
      const res = await api.get(`/students/${dashboard?.student?.id}/certificates`);
      return res.data?.certificates || [];
    },
    enabled: !!dashboard?.student?.id,
  });

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [recordingGroupMode, setRecordingGroupMode] = useState<'topic' | 'number'>('topic');
  const [recordingSearch, setRecordingSearch] = useState<string>('');

  // Selected session defaults to first available recording if not set
  const activeRecording =
    recordedSessions.find((s: any) => s.id === selectedSessionId) ||
    recordedSessions[0] ||
    null;

  // In-System Drive / PDF Viewer Modal State
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState<string>('');
  const [viewerSubtitle, setViewerSubtitle] = useState<string>('');

  // Book Session Mutation (supports 25, 40, or 55 min)
  const bookLessonMutation = useMutation({
    mutationFn: async (payload: {
      studentId: string;
      teacherId: string;
      scheduledAt: string;
      lessonType: string;
      durationMinutes?: number;
      timeSlotId?: string;
      zoomLink?: string;
    }) => {
      return api.post('/lessons', payload);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['studentTransactions'] });
      setIsBookingModalOpen(false);
      setSelectedTeacherId('');
      setBookingDate('');
      setSelectedSlotTime('');
      setBookingError(null);
      const dur = vars.durationMinutes || 25;
      const price = Number(sessionPricing?.[String(dur)] ?? (dur === 55 ? 55 : dur === 40 ? 40 : 25));
      toast.success(
        language === 'he'
          ? `שיעור (${dur} דקות) הוזמן בהצלחה! נוכו $${price.toFixed(2)} מיתרת חשבונך.`
          : `${dur}-Minute Lesson booked successfully! $${price.toFixed(2)} deducted from balance.`,
        language === 'he' ? 'ההזמנה אושרה' : 'Booking Confirmed'
      );
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (language === 'he'
          ? 'שגיאה בהזמנת השיעור. אנא ודא שיתרת החשבון מספקת.'
          : 'Failed to book lesson. Please verify your account balance.');
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

  const getStarRatingLabel = (stars: number, lang: string) => {
    const isHeb = lang === 'he';
    switch (stars) {
      case 5:
        return isHeb ? '⭐⭐⭐⭐⭐ 5 מתוך 5 - מצוין! חוויה מעולה' : '⭐⭐⭐⭐⭐ 5 of 5 - Excellent! Outstanding';
      case 4:
        return isHeb ? '⭐⭐⭐⭐ 4 מתוך 5 - טוב מאוד! מרוצה מאוד' : '⭐⭐⭐⭐ 4 of 5 - Very Good! Great session';
      case 3:
        return isHeb ? '⭐⭐⭐ 3 מתוך 5 - טוב, תאם את הציפיות' : '⭐⭐⭐ 3 of 5 - Good, met expectations';
      case 2:
        return isHeb ? '⭐⭐ 2 מתוך 5 - סביר, טעון שיפור' : '⭐⭐ 2 of 5 - Fair, needs improvement';
      case 1:
        return isHeb ? '⭐ 1 מתוך 5 - טעון שיפור משמעותי' : '⭐ 1 of 5 - Poor, needs significant work';
      default:
        return isHeb ? 'לחץ על הכוכבים כדי לבחור דירוג (1 עד 5 כוכבים)' : 'Click on the stars above to select a rating (1 to 5)';
    }
  };

  const openRateLesson = (lesson: any) => {
    setRatingLessonTarget(lesson);
    setRatingTeacherTarget(null);
    setLessonRatingVal(lesson.feedback?.qualityRating || 0);
    setLessonPace(lesson.feedback?.paceRating || 3);
    setLessonDifficulty(lesson.feedback?.difficulty || 3);
    setLessonComment(lesson.feedback?.comments || '');
    setLessonRatingError(null);
  };

  const openRateTeacher = (lesson: any) => {
    setRatingTeacherTarget(lesson);
    setRatingLessonTarget(null);
    const existingSurvey = lesson.teacher?.surveys?.[0];
    setTeacherOverallRating(existingSurvey?.overallRating || 0);
    setTeacherCommunication(existingSurvey?.communication || 5);
    setTeacherKnowledge(existingSurvey?.knowledge || 5);
    setTeacherPunctuality(existingSurvey?.punctuality || 5);
    setTeacherComment(existingSurvey?.comments || '');
    setTeacherRatingError(null);
  };

  // Lesson Feedback submit mutation
  const submitLessonFeedbackMutation = useMutation({
    mutationFn: async (payload: {
      lessonId: string;
      qualityRating: number;
      difficulty: number;
      paceRating: number;
      comments?: string;
    }) => {
      return api.post(`/feedback/lesson/${payload.lessonId}`, {
        qualityRating: payload.qualityRating,
        difficulty: payload.difficulty,
        paceRating: payload.paceRating,
        comments: payload.comments?.trim() || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
      setRatingLessonTarget(null);
      setLessonRatingError(null);
      toast.success(
        language === 'he'
          ? 'תודה על הדירוג! משוב השיעור נשמר בהצלחה.'
          : 'Thank you! Lesson rating submitted successfully.'
      );
    },
    onError: (err: any) => {
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        '';
      const guidance =
        language === 'he'
          ? 'שגיאה בשמירת דירוג השיעור. אנא בדוק את החיבור לרשת ונסה שוב.'
          : 'Failed to submit lesson rating. Please verify your connection and try again.';
      const full = serverMsg ? `${serverMsg} • ${guidance}` : guidance;
      setLessonRatingError(full);
      toast.error(full);
    },
  });

  // Teacher Survey submit mutation
  const submitTeacherSurveyMutation = useMutation({
    mutationFn: async (payload: {
      teacherId: string;
      overallRating: number;
      communication: number;
      knowledge: number;
      punctuality: number;
      comments?: string;
    }) => {
      return api.post(`/feedback/survey/${payload.teacherId}`, {
        overallRating: payload.overallRating,
        communication: payload.communication,
        knowledge: payload.knowledge,
        punctuality: payload.punctuality,
        comments: payload.comments?.trim() || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
      setRatingTeacherTarget(null);
      setTeacherRatingError(null);
      toast.success(
        language === 'he'
          ? 'תודה רבה! דירוג המורה נשמר וציון המורה עודכן.'
          : 'Thank you! Teacher rating submitted and instructor score updated.'
      );
    },
    onError: (err: any) => {
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        '';
      const guidance =
        language === 'he'
          ? 'שגיאה בשמירת דירוג המורה. אנא בדוק את החיבור לרשת ונסה שוב.'
          : 'Failed to submit teacher survey. Please verify your connection and try again.';
      const full = serverMsg ? `${serverMsg} • ${guidance}` : guidance;
      setTeacherRatingError(full);
      toast.error(full);
    },
  });

  if (isLoading) {
    return <DashboardSkeleton />;
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

  const currentBalance = Number(student?.balance || 0);
  const currentDurationPrice = Number(
    sessionPricing?.[String(selectedDuration)] ??
      (selectedDuration === 55 ? 55 : selectedDuration === 40 ? 40 : 25)
  );
  const hasEnoughBalance = currentBalance >= currentDurationPrice;

  const selectedTeacher = (teachersData || []).find(
    (t: any) => t.id === selectedTeacherId
  );

  const pendingHomeworkCount = recentHomework.filter(
    (h: any) => h.status === 'ASSIGNED'
  ).length;

  const navItems = [
    {
      id: 'overview',
      label: 'Overview & Status',
      labelHe: 'סקירה כללית',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'progress',
      label: 'My Progress',
      labelHe: 'ההתקדמות שלי',
      icon: TrendingUp,
      badge: null,
    },
    {
      id: 'booking',
      label: 'Book Session',
      labelHe: 'הזמנת שיעור',
      icon: Clock,
      badge: hasEnoughBalance ? (language === 'he' ? `$${currentBalance.toFixed(0)} זמין` : `$${currentBalance.toFixed(0)} ok`) : (language === 'he' ? 'יתרה נמוכה' : 'Low balance'),
    },
    {
      id: 'lessons',
      label: 'Live Lessons',
      labelHe: 'שיעורים חיים',
      icon: Video,
      badge: upcomingLessons.length > 0 ? `${upcomingLessons.length}` : null,
    },
    {
      id: 'recordings',
      label: 'Recorded Sessions',
      labelHe: 'שיעורים מוקלטים',
      icon: PlayCircle,
      badge: recordedSessions.length > 0 ? `${recordedSessions.length}` : null,
    },
    {
      id: 'homework',
      label: 'Homework & Feedback',
      labelHe: 'שיעורי בית ומשוב',
      icon: BookOpen,
      badge: pendingHomeworkCount > 0 ? `${pendingHomeworkCount}` : null,
    },
    {
      id: 'games',
      label: 'Hebrew Games',
      labelHe: 'משחקי עברית',
      icon: Gamepad2,
      badge: gamesData?.length ? `${gamesData.length}` : null,
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard',
      labelHe: 'לוח מובילים',
      icon: Award,
      badge: student?.totalPoints ? (language === 'he' ? `${student.totalPoints} נק׳` : `${student.totalPoints} pts`) : null,
    },
    {
      id: 'balance',
      label: 'Account Balance & History',
      labelHe: 'יתרה והיסטוריית עסקאות',
      icon: Wallet,
      badge: `$${currentBalance.toFixed(0)}`,
    },
  ];

  const isSecondaryActive =
    activeTab === 'recordings' ||
    activeTab === 'homework' ||
    activeTab === 'balance' ||
    activeTab === 'leaderboard' ||
    activeTab === 'progress';

  const mobileTabs = [
    {
      id: 'overview',
      label: language === 'he' ? 'ראשי' : 'Home',
      icon: HomeIslandIcon,
      badge: null,
    },
    {
      id: 'booking',
      label: language === 'he' ? 'הזמנה' : 'Book',
      icon: Calendar,
      badge: !hasEnoughBalance ? '!' : null,
    },
    {
      id: 'lessons',
      label: language === 'he' ? 'שיעורים' : 'Lessons',
      icon: Video,
      badge: upcomingLessons.length > 0 ? `${upcomingLessons.length}` : null,
    },
    {
      id: 'games',
      label: language === 'he' ? 'משחקים' : 'Games',
      icon: Gamepad2,
      badge: student?.streakDays ? `${student.streakDays}🔥` : null,
    },
    {
      id: 'more',
      label: language === 'he' ? 'עוד' : 'More',
      icon: Sliders,
      badge: pendingHomeworkCount > 0 ? `${pendingHomeworkCount}` : null,
    },
  ];

  const handleBookingSubmit = () => {
    if (!hasEnoughBalance) {
      const err =
        language === 'he'
          ? `יתרתך ($${currentBalance.toFixed(2)}) אינה מספיקה לשיעור זה ($${currentDurationPrice.toFixed(2)}). אנא פנה למנהל להטענת יתרה.`
          : `Your balance ($${currentBalance.toFixed(2)}) is insufficient for this lesson ($${currentDurationPrice.toFixed(2)}). Please contact Engrew admin to top up your balance.`;
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
    const chosenDay = new Date(bookingDate + 'T00:00:00').getDay();
    const matchingSlot = (selectedTeacher?.timeSlots || []).find((s: any) => {
      const dur = getSlotDurationMinutes(s.startTime, s.endTime);
      return dur === selectedDuration && s.dayOfWeek === chosenDay && s.startTime === selectedSlotTime;
    });

    const scheduledIso = new Date(
      `${bookingDate}T${selectedSlotTime}:00`
    ).toISOString();
    bookLessonMutation.mutate({
      studentId: student.id,
      teacherId: selectedTeacherId,
      timeSlotId: matchingSlot?.id,
      scheduledAt: scheduledIso,
      lessonType: 'REGULAR',
      durationMinutes: selectedDuration,
      zoomLink: matchingSlot?.zoomLink || undefined,
    });
  };

  return (
    <div className="min-h-screen w-full relative">
      <div className="w-full">
        {/* Apple-style Glassy Left Sidebar (Desktop View) */}
        <GlassSidebar
          navItems={navItems}
          activeTab={activeTab}
          onTabChange={(tabId) => {
            setActiveTab(tabId as any);
            setMobileMenuOpen(false);
          }}
          user={user}
          panelSubtitle={language === 'he' ? 'אקדמיה לעברית' : 'Engrew Hebrew Academy'}
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          customSlot={
            isCollapsed ? (
              <div className="flex flex-col items-center gap-2 w-full py-1">
                {/* Collapsed Wallet Balance Capsule */}
                <div className="relative group flex justify-center w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('balance');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-11 py-2 px-1 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all flex flex-col items-center justify-center cursor-pointer shadow-xs active:scale-95"
                    aria-label={language === 'he' ? `יתרת חשבון: $${currentBalance.toFixed(2)}` : `Account Balance: $${currentBalance.toFixed(2)}`}
                  >
                    <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 mt-1 leading-none truncate max-w-full">
                      ${currentBalance >= 1000 ? `${(currentBalance / 1000).toFixed(1)}k` : currentBalance.toFixed(0)}
                    </span>
                  </button>

                  {/* Floating Tooltip Pill on Hover */}
                  <div className="hidden lg:flex absolute start-[calc(100%+0.65rem)] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-slate-950 text-white text-xs font-bold whitespace-nowrap shadow-xl border border-white/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 items-center gap-2">
                    <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{language === 'he' ? 'יתרת חשבון:' : 'Balance:'}</span>
                    <span className="text-emerald-300 font-black">${currentBalance.toFixed(2)}</span>
                  </div>
                </div>

                {/* Collapsed Points Earned Capsule */}
                <div className="relative group flex justify-center w-full">
                  <div className="w-11 py-1.5 px-1 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 flex flex-col items-center justify-center shadow-xs">
                    <Award className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 mt-0.5 leading-none truncate max-w-full">
                      {student?.totalPoints || 0}
                    </span>
                  </div>

                  {/* Floating Tooltip Pill on Hover */}
                  <div className="hidden lg:flex absolute start-[calc(100%+0.65rem)] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-slate-950 text-white text-xs font-bold whitespace-nowrap shadow-xl border border-white/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>{language === 'he' ? 'נקודות למידה:' : 'Points Earned:'}</span>
                    <span className="text-amber-300 font-black">{student?.totalPoints || 0} XP</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 p-2.5 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('balance');
                    setMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors text-start cursor-pointer"
                  title={language === 'he' ? 'צפה בהיסטוריית עסקאות ויתרה' : 'View Balance & Transaction History'}
                >
                  <div className="flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {language === 'he' ? 'יתרת חשבון' : 'Balance'}
                    </span>
                  </div>
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                    ${currentBalance.toFixed(2)}
                  </span>
                </button>
                <div className="text-center p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="flex items-center justify-center gap-1.5 text-amber-500 font-extrabold text-xs">
                    <Award className="w-3.5 h-3.5" />
                    <span>{student?.totalPoints || 0}</span>
                  </div>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'he' ? 'נקודות למידה' : 'Points Earned'}
                  </p>
                </div>
              </div>
            )
          }
          actionButton={{
            label: language === 'he' ? 'הזמנת שיעור 25 דק׳' : 'Book 25-Min Lesson',
            onClick: () => setIsBookingModalOpen(true),
            icon: Plus,
          }}
        />

        {/* Main Content Area on the right */}
        <main className={`w-full transition-all duration-300 ${
          isCollapsed
            ? 'lg:ps-[calc(5rem+1.5rem)]'
            : 'lg:ps-[calc(18rem+1.75rem)] xl:ps-[calc(20rem+2.25rem)]'
        } p-4 sm:p-6 lg:pe-7 xl:pe-9 lg:pt-8 xl:pt-8 min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-5rem)] space-y-8 pb-36 sm:pb-40 lg:pb-12`}>
          {/* Live Imminent Lesson Countdown Island */}
          <LiveLessonCountdownIsland lessons={upcomingLessons} userRole="STUDENT" />

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

                  {/* Balance & Points Stats */}
                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('balance');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="bg-white/10 hover:bg-white/20 transition-all cursor-pointer backdrop-blur-md rounded-2xl p-3 sm:p-4 text-center min-w-[110px] border border-white/15 group"
                      title={language === 'he' ? 'צפה בהיסטוריית עסקאות ויתרה' : 'View Balance & Transaction History'}
                    >
                      <div className="flex items-center justify-center gap-1 text-emerald-300 font-extrabold text-lg sm:text-xl group-hover:scale-105 transition-transform">
                        <Wallet className="w-5 h-5 text-emerald-300 shrink-0" />
                        <span>${currentBalance.toFixed(2)}</span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] font-semibold text-brand-teal-100 uppercase mt-0.5">
                        {language === 'he' ? 'יתרת חשבון' : 'Balance'}
                      </p>
                    </button>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 text-center min-w-[105px] border border-white/15">
                      <div className="flex items-center justify-center gap-1 text-amber-400 font-extrabold text-lg sm:text-xl">
                        <Award className="w-5 h-5 shrink-0" />
                        <span>{student?.totalPoints || 0}</span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] font-semibold text-brand-teal-100 uppercase mt-0.5">
                        {t('dashboard.pointsEarned')}
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
                            {language === 'he' ? 'פנה למנהל להטענת יתרה' : 'Contact admin to top up account balance'}
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
                    {upcomingLessons.length > 0 ? (
                      <div className="flex items-center gap-2">
                        {upcomingLessons[0].zoomLink && (
                          <a
                            href={upcomingLessons[0].zoomLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2.5 bg-brand-olive-500 hover:bg-brand-olive-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                          >
                            <Video className="w-4 h-4" />
                            <span>{language === 'he' ? 'זום' : 'Join Zoom'}</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setReschedulingLesson(upcomingLessons[0])}
                          className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-slate-200/80 dark:border-slate-700"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-teal-500" />
                          <span>{language === 'he' ? 'שינוי מועד' : 'Reschedule'}</span>
                        </button>
                      </div>
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

              {/* Official Certificates of Completion & Milestones */}
              {certificatesData.length > 0 && (
                <div className="bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent dark:from-amber-950/30 dark:via-amber-900/10 dark:to-transparent rounded-3xl p-6 sm:p-7 border border-amber-300/60 dark:border-amber-700/50 shadow-xs relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
                        <Award className="w-5 h-5 text-slate-950" />
                      </div>
                      <div>
                        <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{language === 'he' ? 'תעודות סיום רשמיות' : 'Official Certificates of Completion'}</span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/30">
                            {certificatesData.length} {language === 'he' ? 'הוענקו' : 'Awarded'}
                          </span>
                        </h2>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {language === 'he'
                            ? 'תעודות חתומות עם קוד אימות רשמי הניתנות להדפסה ושמירה ב-PDF'
                            : 'Verified milestone credentials with serial verification numbers, ready to print & download'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {certificatesData.map((cert) => (
                      <div
                        key={cert.id}
                        className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-amber-200 dark:border-amber-800/60 flex flex-col justify-between shadow-xs hover:border-amber-400 transition-all group"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300/60">
                              {cert.certificateNumber}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {new Date(cert.completionDate).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US')}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {language === 'he' && cert.packageNameHe ? cert.packageNameHe : cert.packageName}
                          </h3>
                          <p className="text-xs font-semibold text-brand-teal-700 dark:text-brand-teal-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{language === 'he' && cert.levelAchievedHe ? cert.levelAchievedHe : cert.levelAchieved}</span>
                          </p>
                        </div>

                        <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            {language === 'he' ? 'אימות חתום' : 'Verified Serial'}
                          </span>
                          <button
                            onClick={() => setSelectedCert(cert)}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>{language === 'he' ? 'הצג תעודה רשמית' : 'View Certificate'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800">
                  <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    {language === 'he' ? 'יתרת חשבון:' : 'Your Balance:'} ${currentBalance.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Insufficient balance warning banner */}
              {!hasEnoughBalance && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs font-semibold flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                  <div>
                    <p className="font-bold">
                      {language === 'he' ? 'יתרת החשבון אינה מספקת' : 'Insufficient Account Balance'}
                    </p>
                    <p className="mt-0.5 opacity-90 leading-relaxed">
                      {language === 'he'
                        ? `עלות שיעור של ${selectedDuration} דקות הינה $${currentDurationPrice.toFixed(2)}, אך יתרתך הינה $${currentBalance.toFixed(2)}. יש לפנות למנהל המערכת לטעינת יתרה.`
                        : `A ${selectedDuration}-minute session costs $${currentDurationPrice.toFixed(2)}, but your current balance is $${currentBalance.toFixed(2)}. Please contact your administrator to add balance.`}
                    </p>
                  </div>
                </div>
              )}

              {/* Sufficient balance confirmation */}
              {hasEnoughBalance && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      {language === 'he'
                        ? `יתרה מספקת: ינוכו $${currentDurationPrice.toFixed(2)} עבור שיעור של ${selectedDuration} דקות`
                        : `Balance confirmed: $${currentDurationPrice.toFixed(2)} will be deducted for ${selectedDuration} min`}
                    </span>
                  </div>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                    {language === 'he' ? 'יתרה לאחר הזמנה:' : 'Balance after:'} ${(currentBalance - currentDurationPrice).toFixed(2)}
                  </span>
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
                  {language === 'he' ? '1. בחר משך שיעור ומחיר' : '1. Select Session Duration & Price'}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { dur: 25, labelEn: '25 Minutes', labelHe: '25 דקות', color: 'emerald' },
                    { dur: 40, labelEn: '40 Minutes', labelHe: '40 דקות', color: 'sky' },
                    { dur: 55, labelEn: '55 Minutes', labelHe: '55 דקות', color: 'purple' },
                  ].map((item) => {
                    const price = Number(sessionPricing?.[String(item.dur)] ?? (item.dur === 55 ? 55 : item.dur === 40 ? 40 : 25));
                    return (
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
                        <span className={`text-xs font-extrabold block mt-1 px-2.5 py-0.5 rounded-lg inline-block ${
                          selectedDuration === item.dur ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-700 text-brand-teal-800 dark:text-brand-teal-300'
                        }`}>
                          ${price.toFixed(2)}
                        </span>
                      </button>
                    );
                  })}
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
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-teal-500 to-indigo-700 text-white font-black text-xs flex items-center justify-center shadow-xs ring-1 ring-teal-400/30 shrink-0">
                          {`${t.user?.firstName?.charAt(0) || ''}${t.user?.lastName?.charAt(0) || ''}`.toUpperCase() || 'T'}
                        </div>
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
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingDate}
                    onChange={(e) => {
                      setBookingDate(e.target.value);
                      setSelectedSlotTime(''); // reset slot when date changes
                    }}
                    className="w-full max-w-xs px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-brand-teal-800 focus:outline-none shadow-2xs"
                  />
                  <span className="text-xs font-extrabold text-brand-teal-800 dark:text-brand-teal-300 bg-brand-teal-50 dark:bg-brand-teal-950/70 border border-brand-teal-200 dark:border-brand-teal-800 px-3 py-2 rounded-xl">
                    {new Date(bookingDate + 'T00:00:00').toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Step 4: Available Slots matching Selected Duration & Chosen Date */}
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
                    const chosenDay = new Date(bookingDate + 'T00:00:00').getDay();

                    // Filter slots specifically for this teacher, this duration, and this exact weekday
                    const matchingSlots = (selectedTeacher.timeSlots || []).filter((slot: any) => {
                      const dur = getSlotDurationMinutes(slot.startTime, slot.endTime);
                      return dur === selectedDuration && slot.dayOfWeek === chosenDay && slot.isAvailable !== false;
                    });

                    // Days when this teacher has slots for this duration
                    const teacherAvailableDays = Array.from(
                      new Set(
                        (selectedTeacher.timeSlots || [])
                          .filter((s: any) => getSlotDurationMinutes(s.startTime, s.endTime) === selectedDuration && s.isAvailable !== false)
                          .map((s: any) => s.dayOfWeek)
                      )
                    ).sort((a: any, b: any) => a - b) as number[];

                    return (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-1">
                          {matchingSlots.map((slot: any) => {
                            const isSelected = selectedSlotTime === slot.startTime;

                            // Check if already booked on this exact date
                            const isSlotBooked = (selectedTeacher.lessons || []).some((l: any) => {
                              const lDateStr = new Date(l.scheduledAt).toISOString().split('T')[0];
                              const lDate = new Date(l.scheduledAt);
                              const lTime = lDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                              return lDateStr === bookingDate && lTime === slot.startTime && l.status === 'SCHEDULED';
                            });

                            if (isSlotBooked) {
                              return (
                                <div
                                  key={slot.id}
                                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-850/60 text-slate-400 dark:text-slate-500 text-center opacity-60 cursor-not-allowed"
                                >
                                  <p className="font-mono text-xs font-bold leading-tight line-through">
                                    {formatSlotRange12Hour(slot.startTime, slot.endTime)}
                                  </p>
                                  <p className="text-[10px] text-rose-500 dark:text-rose-400 font-extrabold mt-1">
                                    {language === 'he' ? 'מוזמן (תפוס)' : 'Booked'}
                                  </p>
                                </div>
                              );
                            }

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
                                    : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-200/90 dark:border-slate-700 shadow-2xs'
                                }`}
                              >
                                <p className="font-mono text-xs font-bold leading-tight">
                                  {formatSlotRange12Hour(slot.startTime, slot.endTime)}
                                </p>
                                <p className="text-[10px] opacity-90 mt-1 font-semibold">
                                  {selectedDuration} {language === 'he' ? 'דק׳ (שעון ישראל)' : 'min (IST)'}
                                </p>
                              </button>
                            );
                          })}
                        </div>

                        {matchingSlots.length === 0 && (
                          <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-center space-y-3">
                            <p className="text-xs text-amber-900 dark:text-amber-200 font-bold">
                              {language === 'he'
                                ? `למורה ${selectedTeacher.user?.firstName} אין שעות זמינות של ${selectedDuration} דקות ביום ${DAYS_HE[chosenDay]} (${bookingDate}).`
                                : `${selectedTeacher.user?.firstName} has no ${selectedDuration}-minute slots available on ${DAYS[chosenDay]} (${bookingDate}).`}
                            </p>

                            {teacherAvailableDays.length > 0 && (
                              <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/40">
                                <span className="text-[11px] font-extrabold text-amber-800 dark:text-amber-300 block mb-2">
                                  {language === 'he'
                                    ? `ימים זמינים אחרים עבור ${selectedTeacher.user?.firstName} (לחץ לבחירת תאריך):`
                                    : `Available days for ${selectedTeacher.user?.firstName} (click to jump to date):`}
                                </span>
                                <div className="flex flex-wrap items-center justify-center gap-2">
                                  {teacherAvailableDays.map((dayIdx) => {
                                    // Calculate next upcoming date for that day
                                    const today = new Date();
                                    const diff = (dayIdx - today.getDay() + 7) % 7 || 7;
                                    const nextDate = new Date(today);
                                    nextDate.setDate(today.getDate() + diff);
                                    const nextDateStr = nextDate.toISOString().split('T')[0];

                                    return (
                                      <button
                                        key={dayIdx}
                                        type="button"
                                        onClick={() => {
                                          setBookingDate(nextDateStr);
                                          setSelectedSlotTime('');
                                        }}
                                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors shadow-2xs"
                                      >
                                        {language === 'he' ? DAYS_HE[dayIdx] : DAYS[dayIdx]} ({nextDate.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', { month: 'short', day: 'numeric' })})
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Submit Booking */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">{language === 'he' ? 'עלות שיעור:' : 'Session Fee:'}</span>{' '}
                  <span className="font-extrabold text-slate-900 dark:text-white">${currentDurationPrice.toFixed(2)}</span>
                  {' · '}
                  <span className="font-semibold">{language === 'he' ? 'יתרתך:' : 'Balance:'}</span>{' '}
                  <span className={`font-bold ${hasEnoughBalance ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    ${currentBalance.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={handleBookingSubmit}
                  disabled={bookLessonMutation.isPending || !hasEnoughBalance || !selectedSlotTime || !bookingDate || !selectedTeacherId}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-brand-teal-800 hover:bg-brand-teal-900 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-brand-olive-300" />
                  <span>
                    {bookLessonMutation.isPending
                      ? (language === 'he' ? 'מאשר ומנכה יתרה...' : 'Confirming & Deducting...')
                      : (language === 'he' ? `אישור הזמנה (${selectedDuration} דק׳ - $${currentDurationPrice.toFixed(2)})` : `Confirm ${selectedDuration}-Min Booking ($${currentDurationPrice.toFixed(2)})`)}
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

                          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                            <a
                              href={getGoogleCalendarUrl({
                                id: l.id,
                                title: `Engrew Hebrew Lesson with ${l.teacher?.user?.firstName || 'Teacher'}`,
                                description: `1-on-1 Hebrew lesson (${lessonDur} min)`,
                                scheduledAt: l.scheduledAt,
                                durationMinutes: lessonDur,
                                zoomLink: l.zoomLink || 'https://zoom.us',
                                teacherName: l.teacher?.user?.firstName,
                              })}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => haptics.tap()}
                              title={language === 'he' ? 'הוסף ל-Google Calendar' : 'Add to Google Calendar'}
                              className="px-2.5 py-2 bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                            >
                              <Calendar className="w-3.5 h-3.5 text-blue-500" />
                              <span className="hidden sm:inline">Google Cal</span>
                            </a>

                            <button
                              type="button"
                              onClick={() => {
                                haptics.tap();
                                downloadIcsFile({
                                  id: l.id,
                                  title: `Engrew Hebrew Lesson with ${l.teacher?.user?.firstName || 'Teacher'}`,
                                  description: `1-on-1 Hebrew lesson (${lessonDur} min)`,
                                  scheduledAt: l.scheduledAt,
                                  durationMinutes: lessonDur,
                                  zoomLink: l.zoomLink || 'https://zoom.us',
                                  teacherName: l.teacher?.user?.firstName,
                                });
                              }}
                              title={language === 'he' ? 'הורד קובץ iCal / Outlook' : 'Download Apple / Outlook (.ics)'}
                              className="px-2.5 py-2 bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="hidden sm:inline">.ics</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setReschedulingLesson(l)}
                              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                            >
                              <RefreshCw className="w-3.5 h-3.5 text-teal-500" />
                              <span>{language === 'he' ? 'שינוי מועד' : 'Reschedule'}</span>
                            </button>

                            {l.zoomLink && (
                              <a
                                href={l.zoomLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-brand-olive-500 hover:bg-brand-olive-600 text-slate-950 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-2"
                              >
                                <Video className="w-4 h-4" />
                                <span>{language === 'he' ? 'כניסה לשיעור בזום' : 'Join Zoom Lesson'}</span>
                              </a>
                            )}
                          </div>
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
                            <StructuredNotesViewer notesString={lesson.teacherNotes} />
                          )}

                          {/* Actions & Separated Rating Controls Row */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                            <div>
                              {lesson.recordingUrl ? (
                                <button
                                  onClick={() => {
                                    setViewerUrl(lesson.recordingUrl);
                                    setViewerTitle(`${lesson.teacher?.user?.firstName || 'Lesson'} Recording`);
                                    setViewerSubtitle(new Date(lesson.scheduledAt).toLocaleDateString());
                                  }}
                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-teal-800 dark:text-brand-teal-400 hover:underline"
                                >
                                  <PlayCircle className="w-3.5 h-3.5 text-brand-olive-600" />
                                  <span>
                                    {language === 'he'
                                      ? 'צפייה בהקלטה במערכת'
                                      : 'Watch Recording In-App'}
                                  </span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                                  {language === 'he' ? 'ההקלטה תועלה בקרוב' : 'Recording uploading soon'}
                                </span>
                              )}
                            </div>

                            {/* Separated Rate Lesson & Rate Teacher Controls */}
                            <div className="flex items-center gap-2">
                              {/* 1. Rate Lesson Button / Badge */}
                              {lesson.feedback ? (
                                <button
                                  type="button"
                                  onClick={() => openRateLesson(lesson)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-bold hover:bg-amber-500/20 transition-colors"
                                  title={language === 'he' ? 'לחץ לעריכת דירוג השיעור' : 'Click to edit lesson rating'}
                                >
                                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                  <span>
                                    {language === 'he'
                                      ? `שיעור: ${lesson.feedback.qualityRating}/5`
                                      : `Lesson: ${lesson.feedback.qualityRating}/5`}
                                  </span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openRateLesson(lesson)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all shadow-2xs"
                                >
                                  <Star className="w-3.5 h-3.5 text-amber-500" />
                                  <span>{language === 'he' ? 'דרג שיעור' : 'Rate Lesson'}</span>
                                </button>
                              )}

                              {/* 2. Rate Teacher Button / Badge */}
                              {lesson.teacher?.surveys?.[0] ? (
                                <button
                                  type="button"
                                  onClick={() => openRateTeacher(lesson)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-xs font-bold hover:bg-purple-500/20 transition-colors"
                                  title={language === 'he' ? 'לחץ לעריכת דירוג המורה' : 'Click to edit teacher rating'}
                                >
                                  <Award className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                  <span>
                                    {language === 'he'
                                      ? `מורה: ${lesson.teacher.surveys[0].overallRating}/5`
                                      : `Teacher: ${lesson.teacher.surveys[0].overallRating}/5`}
                                  </span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openRateTeacher(lesson)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all shadow-2xs"
                                >
                                  <Award className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                  <span>{language === 'he' ? 'דרג מורה' : 'Rate Teacher'}</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* SEPARATE FORM 1: RATE LESSON QUALITY */}
                          {ratingLessonTarget?.id === lesson.id && (
                            <div className="mt-3 p-4 bg-amber-50/70 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800/80 space-y-3.5 text-xs animate-fade-in text-start">
                              {/* Header */}
                              <div className="flex items-center justify-between pb-2 border-b border-amber-200/60 dark:border-amber-800/60">
                                <div className="flex items-center gap-2">
                                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                                    {language === 'he' ? 'דירוג איכות השיעור' : 'Rate Lesson Quality'}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setRatingLessonTarget(null)}
                                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Clear Actionable Error Message */}
                              {lessonRatingError && (
                                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2.5 text-rose-800 dark:text-rose-200 animate-fade-in">
                                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <span className="font-bold block">
                                      {language === 'he' ? 'שימת לב נדרשת:' : 'Action Required:'}
                                    </span>
                                    <p className="mt-0.5 leading-relaxed">{lessonRatingError}</p>
                                  </div>
                                </div>
                              )}

                              {/* Star Rating with Dynamic Live Guidance */}
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                                  {language === 'he' ? 'בחר דירוג לשיעור (1–5 כוכבים):' : 'Select Lesson Rating (1–5 Stars):'}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {[1, 2, 3, 4, 5].map((star) => {
                                    const isFilled = star <= (hoverLessonStar || lessonRatingVal);
                                    return (
                                      <button
                                        key={star}
                                        type="button"
                                        onMouseEnter={() => setHoverLessonStar(star)}
                                        onMouseLeave={() => setHoverLessonStar(0)}
                                        onClick={() => {
                                          setLessonRatingVal(star);
                                          if (lessonRatingError) setLessonRatingError(null);
                                        }}
                                        className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-transform active:scale-95"
                                        title={`${star} Stars`}
                                      >
                                        <Star
                                          className={`w-6 h-6 transition-colors ${
                                            isFilled
                                              ? 'text-amber-500 fill-amber-500'
                                              : 'text-slate-300 dark:text-slate-600'
                                          }`}
                                        />
                                      </button>
                                    );
                                  })}
                                </div>
                                <p className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                                  {getStarRatingLabel(hoverLessonStar || lessonRatingVal, language)}
                                </p>
                              </div>

                              {/* Pace & Difficulty Pill Selectors */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                {/* Pace */}
                                <div>
                                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    {language === 'he' ? 'קצב השיעור:' : 'Lesson Pace:'}
                                  </label>
                                  <div className="flex gap-1.5">
                                    {[
                                      { val: 1, labelHe: 'איטי', labelEn: 'Slow' },
                                      { val: 3, labelHe: 'מתאים בדיוק', labelEn: 'Just Right' },
                                      { val: 5, labelHe: 'מהיר', labelEn: 'Fast' },
                                    ].map((item) => (
                                      <button
                                        key={item.val}
                                        type="button"
                                        onClick={() => setLessonPace(item.val)}
                                        className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold border transition-colors ${
                                          lessonPace === item.val
                                            ? 'bg-amber-500 text-white border-amber-600'
                                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                                        }`}
                                      >
                                        {language === 'he' ? item.labelHe : item.labelEn}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Difficulty */}
                                <div>
                                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    {language === 'he' ? 'רמת קושי:' : 'Difficulty:'}
                                  </label>
                                  <div className="flex gap-1.5">
                                    {[
                                      { val: 1, labelHe: 'קל', labelEn: 'Easy' },
                                      { val: 3, labelHe: 'מאוזן', labelEn: 'Balanced' },
                                      { val: 5, labelHe: 'מאתגר', labelEn: 'Challenging' },
                                    ].map((item) => (
                                      <button
                                        key={item.val}
                                        type="button"
                                        onClick={() => setLessonDifficulty(item.val)}
                                        className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold border transition-colors ${
                                          lessonDifficulty === item.val
                                            ? 'bg-amber-500 text-white border-amber-600'
                                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                                        }`}
                                      >
                                        {language === 'he' ? item.labelHe : item.labelEn}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Optional Comment */}
                              <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  {language === 'he' ? 'משוב נוסף על השיעור (אופציונלי):' : 'Additional Lesson Feedback (optional):'}
                                </label>
                                <input
                                  type="text"
                                  value={lessonComment}
                                  onChange={(e) => setLessonComment(e.target.value)}
                                  placeholder={
                                    language === 'he'
                                      ? 'מה אהבת בשיעור? מה תרצה לתרגל יותר בפעם הבאה?...'
                                      : 'What did you learn? Any areas to focus on next time?...'
                                  }
                                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
                                />
                              </div>

                              {/* Form Actions */}
                              <div className="flex gap-2 justify-end pt-1">
                                <button
                                  type="button"
                                  onClick={() => setRatingLessonTarget(null)}
                                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-200/50 rounded-xl"
                                >
                                  {language === 'he' ? 'ביטול' : 'Cancel'}
                                </button>
                                <button
                                  type="button"
                                  disabled={submitLessonFeedbackMutation.isPending}
                                  onClick={() => {
                                    if (!lessonRatingVal || lessonRatingVal < 1) {
                                      setLessonRatingError(
                                        language === 'he'
                                          ? 'אנא בחר דירוג (1–5 כוכבים) על ידי לחיצה על הכוכבים למעלה לפני השליחה.'
                                          : 'Please select a star rating (1–5 stars) above before submitting.'
                                      );
                                      return;
                                    }
                                    submitLessonFeedbackMutation.mutate({
                                      lessonId: lesson.id,
                                      qualityRating: lessonRatingVal,
                                      difficulty: lessonDifficulty,
                                      paceRating: lessonPace,
                                      comments: lessonComment,
                                    });
                                  }}
                                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>
                                    {submitLessonFeedbackMutation.isPending
                                      ? language === 'he' ? 'שולח...' : 'Submitting...'
                                      : language === 'he' ? 'שלח דירוג שיעור' : 'Submit Lesson Rating'}
                                  </span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* SEPARATE FORM 2: RATE TEACHER */}
                          {ratingTeacherTarget?.id === lesson.id && (
                            <div className="mt-3 p-4 bg-purple-50/70 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800/80 space-y-3.5 text-xs animate-fade-in text-start">
                              {/* Header */}
                              <div className="flex items-center justify-between pb-2 border-b border-purple-200/60 dark:border-purple-800/60">
                                <div className="flex items-center gap-2">
                                  <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                                    {language === 'he'
                                      ? `דירוג והערכת מורה: ${lesson.teacher?.user?.firstName || 'המורה'}`
                                      : `Rate Teacher: ${lesson.teacher?.user?.firstName || 'Teacher'}`}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setRatingTeacherTarget(null)}
                                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Clear Actionable Error Message */}
                              {teacherRatingError && (
                                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2.5 text-rose-800 dark:text-rose-200 animate-fade-in">
                                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <span className="font-bold block">
                                      {language === 'he' ? 'שימת לב נדרשת:' : 'Action Required:'}
                                    </span>
                                    <p className="mt-0.5 leading-relaxed">{teacherRatingError}</p>
                                  </div>
                                </div>
                              )}

                              {/* Overall Teacher Star Rating */}
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                                  {language === 'he' ? 'ציון כללי למורה (1–5 כוכבים):' : 'Overall Teacher Rating (1–5 Stars):'}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {[1, 2, 3, 4, 5].map((star) => {
                                    const isFilled = star <= (hoverTeacherStar || teacherOverallRating);
                                    return (
                                      <button
                                        key={star}
                                        type="button"
                                        onMouseEnter={() => setHoverTeacherStar(star)}
                                        onMouseLeave={() => setHoverTeacherStar(0)}
                                        onClick={() => {
                                          setTeacherOverallRating(star);
                                          if (teacherRatingError) setTeacherRatingError(null);
                                        }}
                                        className="p-1.5 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-transform active:scale-95"
                                        title={`${star} Stars`}
                                      >
                                        <Star
                                          className={`w-6 h-6 transition-colors ${
                                            isFilled
                                              ? 'text-amber-500 fill-amber-500'
                                              : 'text-slate-300 dark:text-slate-600'
                                          }`}
                                        />
                                      </button>
                                    );
                                  })}
                                </div>
                                <p className="mt-1 text-xs font-semibold text-purple-700 dark:text-purple-400">
                                  {getStarRatingLabel(hoverTeacherStar || teacherOverallRating, language)}
                                </p>
                              </div>

                              {/* Detailed Teacher Criteria */}
                              <div className="space-y-2 pt-1 border-t border-purple-200/50 dark:border-purple-800/50">
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                                  {language === 'he' ? 'הערכת מאפייני הוראה:' : 'Teaching Evaluation Criteria:'}
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  {/* Communication */}
                                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-900/60">
                                    <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300 block mb-1">
                                      {language === 'he' ? 'תקשורת וסבלנות' : 'Communication'}
                                    </span>
                                    <div className="flex gap-1">
                                      {[1, 2, 3, 4, 5].map((s) => (
                                        <button
                                          key={s}
                                          type="button"
                                          onClick={() => setTeacherCommunication(s)}
                                          className="p-0.5"
                                        >
                                          <Star
                                            className={`w-4 h-4 ${
                                              s <= teacherCommunication
                                                ? 'text-amber-500 fill-amber-500'
                                                : 'text-slate-300 dark:text-slate-600'
                                            }`}
                                          />
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Knowledge */}
                                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-900/60">
                                    <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300 block mb-1">
                                      {language === 'he' ? 'בקיאות והסבר' : 'Knowledge & Style'}
                                    </span>
                                    <div className="flex gap-1">
                                      {[1, 2, 3, 4, 5].map((s) => (
                                        <button
                                          key={s}
                                          type="button"
                                          onClick={() => setTeacherKnowledge(s)}
                                          className="p-0.5"
                                        >
                                          <Star
                                            className={`w-4 h-4 ${
                                              s <= teacherKnowledge
                                                ? 'text-amber-500 fill-amber-500'
                                                : 'text-slate-300 dark:text-slate-600'
                                            }`}
                                          />
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Punctuality */}
                                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-900/60">
                                    <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300 block mb-1">
                                      {language === 'he' ? 'דיוק וזמנים' : 'Punctuality'}
                                    </span>
                                    <div className="flex gap-1">
                                      {[1, 2, 3, 4, 5].map((s) => (
                                        <button
                                          key={s}
                                          type="button"
                                          onClick={() => setTeacherPunctuality(s)}
                                          className="p-0.5"
                                        >
                                          <Star
                                            className={`w-4 h-4 ${
                                              s <= teacherPunctuality
                                                ? 'text-amber-500 fill-amber-500'
                                                : 'text-slate-300 dark:text-slate-600'
                                            }`}
                                          />
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Teacher Comment */}
                              <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  {language === 'he' ? 'מילה טובה או משוב למורה (אופציונלי):' : 'Feedback or Compliment for Teacher (optional):'}
                                </label>
                                <input
                                  type="text"
                                  value={teacherComment}
                                  onChange={(e) => setTeacherComment(e.target.value)}
                                  placeholder={
                                    language === 'he'
                                      ? 'שתף את המורה במה שהיה מצוין או הצעות לעתיד...'
                                      : 'Write a compliment or feedback for your tutor...'
                                  }
                                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500"
                                />
                              </div>

                              {/* Actions */}
                              <div className="flex gap-2 justify-end pt-1">
                                <button
                                  type="button"
                                  onClick={() => setRatingTeacherTarget(null)}
                                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-200/50 rounded-xl"
                                >
                                  {language === 'he' ? 'ביטול' : 'Cancel'}
                                </button>
                                <button
                                  type="button"
                                  disabled={submitTeacherSurveyMutation.isPending}
                                  onClick={() => {
                                    if (!teacherOverallRating || teacherOverallRating < 1) {
                                      setTeacherRatingError(
                                        language === 'he'
                                          ? 'אנא בחר ציון כללי למורה (1–5 כוכבים) על ידי לחיצה על הכוכבים למעלה לפני השליחה.'
                                          : 'Please select an overall teacher rating (1–5 stars) above before submitting.'
                                      );
                                      return;
                                    }
                                    submitTeacherSurveyMutation.mutate({
                                      teacherId: lesson.teacherId,
                                      overallRating: teacherOverallRating,
                                      communication: teacherCommunication,
                                      knowledge: teacherKnowledge,
                                      punctuality: teacherPunctuality,
                                      comments: teacherComment,
                                    });
                                  }}
                                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>
                                    {submitTeacherSurveyMutation.isPending
                                      ? language === 'he' ? 'שולח...' : 'Submitting...'
                                      : language === 'he' ? 'שלח דירוג מורה' : 'Submit Teacher Rating'}
                                  </span>
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

          {/* TAB: RECORDED SESSIONS (STUDENT PORTAL - SPLIT VIEW) */}
          {activeTab === 'recordings' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-teal-50 dark:bg-brand-teal-950/70 border border-brand-teal-200 dark:border-brand-teal-800 text-xs font-bold text-brand-teal-800 dark:text-brand-teal-300 mb-2">
                    <PlayCircle className="w-3.5 h-3.5 text-brand-olive-500" />
                    <span>{language === 'he' ? 'מאגר שיעורים מוקלטים' : 'Recorded Sessions Portal'}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {language === 'he' ? 'צפייה בשיעורי הווידאו שלך' : 'Watch Your Recorded Lessons'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                    {language === 'he'
                      ? 'כל שיעורי הווידאו שהועלו על ידי המורים שלך מ-Google Drive, מסודרים לפי נושא או לפי מספר שיעור.'
                      : 'Stream recorded lessons uploaded by your certified teachers directly inside Engrew.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0">
                  <button
                    onClick={() => setRecordingGroupMode('topic')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      recordingGroupMode === 'topic'
                        ? 'bg-white dark:bg-slate-900 text-brand-teal-800 dark:text-brand-teal-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {language === 'he' ? 'לפי נושא' : 'By Topic'}
                  </button>
                  <button
                    onClick={() => setRecordingGroupMode('number')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      recordingGroupMode === 'number'
                        ? 'bg-white dark:bg-slate-900 text-brand-teal-800 dark:text-brand-teal-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {language === 'he' ? 'לפי מספר שיעור' : 'By Session #'}
                  </button>
                </div>
              </div>

              {/* SPLIT LAYOUT: LEFT = VIDEO WINDOW, RIGHT = CATEGORIZED LESSONS SIDEBAR */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT SIDE (8 COLS): VIDEO PLAYER WINDOW */}
                <div className="lg:col-span-8 space-y-4">
                  {activeRecording ? (
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-3.5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                      {/* Video Player Window Container */}
                      <div className="relative aspect-[4/3] xs:aspect-[16/11] sm:aspect-video min-h-[250px] sm:min-h-0 w-full rounded-2xl overflow-hidden bg-slate-950 shadow-xl border border-slate-200/50 dark:border-slate-800 group">
                        {activeRecording.videoUrl ? (
                          <>
                            <iframe
                              src={getVideoEmbedUrl(activeRecording.videoUrl)}
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                              title={activeRecording.title}
                            />
                            {/* Floating Fullscreen / Theater Overlay Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setViewerUrl(activeRecording.videoUrl);
                                setViewerTitle(activeRecording.title);
                                setViewerSubtitle(
                                  activeRecording.category
                                    ? `${activeRecording.category} • ${activeRecording.durationMinutes || 25}m`
                                    : `${activeRecording.durationMinutes || 25}m`
                                );
                              }}
                              className="absolute bottom-2.5 end-2.5 px-2.5 py-1.5 rounded-xl bg-slate-950/85 hover:bg-slate-900 text-white text-[11px] font-bold backdrop-blur-md border border-white/20 shadow-md flex items-center gap-1.5 transition-all opacity-85 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                              title={language === 'he' ? 'פתח במסך מלא' : 'Open in Full Screen'}
                            >
                              <Maximize2 className="w-3.5 h-3.5 text-cyan-300" />
                              <span>{language === 'he' ? 'מסך מלא' : 'Full Screen'}</span>
                            </button>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                            <PlayCircle className="w-12 h-12 text-slate-600" />
                            <p className="text-xs font-semibold">
                              {language === 'he' ? 'סרטון השיעור אינו זמין' : 'Video not available'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Video Information Header */}
                      <div className="space-y-4 pt-2">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="px-3 py-1 rounded-xl bg-brand-teal-800 text-white font-black text-xs shadow-xs tracking-wide">
                              {language === 'he' ? `שיעור #${activeRecording.sessionNumber}` : `Session #${activeRecording.sessionNumber}`}
                            </span>
                            <span className="px-3 py-1 rounded-xl bg-brand-olive-100 dark:bg-brand-olive-950/90 text-brand-olive-950 dark:text-brand-olive-200 border border-brand-olive-300 dark:border-brand-olive-700 font-extrabold text-xs shadow-2xs">
                              {activeRecording.category || 'General'}
                            </span>
                            {activeRecording.durationMinutes && (
                              <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                <Clock className="w-3.5 h-3.5 text-brand-teal-700 dark:text-brand-teal-400" />
                                {activeRecording.durationMinutes} {language === 'he' ? 'דקות' : 'min'}
                              </span>
                            )}
                          </div>

                          {activeRecording.videoUrl && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setViewerUrl(activeRecording.videoUrl);
                                  setViewerTitle(activeRecording.title);
                                  setViewerSubtitle(
                                    activeRecording.category
                                      ? `${activeRecording.category} • ${activeRecording.durationMinutes || 25}m`
                                      : `${activeRecording.durationMinutes || 25}m`
                                  );
                                }}
                                className="inline-flex items-center gap-1.5 text-xs font-black text-brand-olive-950 dark:text-brand-olive-200 hover:text-brand-olive-950 dark:hover:text-white px-3 py-1.5 rounded-xl bg-brand-olive-100 dark:bg-brand-olive-950/70 border border-brand-olive-300 dark:border-brand-olive-700 transition-colors shadow-2xs"
                              >
                                <Maximize2 className="w-3.5 h-3.5 text-brand-olive-600 dark:text-brand-olive-300" />
                                <span>{language === 'he' ? 'מסך מלא' : 'Full Screen'}</span>
                              </button>
                              <a
                                href={activeRecording.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-black text-brand-teal-800 dark:text-brand-teal-300 hover:text-brand-teal-950 dark:hover:text-white px-3 py-1.5 rounded-xl bg-brand-teal-50 dark:bg-brand-teal-950/70 border border-brand-teal-200/80 dark:border-brand-teal-800 transition-colors shadow-2xs"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>{language === 'he' ? 'Google Drive' : 'Drive Link'}</span>
                              </a>
                            </div>
                          )}
                        </div>

                        <div>
                          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {activeRecording.title}
                          </h3>
                          {activeRecording.titleHe && (
                            <h4 className="text-base font-extrabold text-brand-teal-800 dark:text-brand-teal-300 mt-1" dir="rtl">
                              {activeRecording.titleHe}
                            </h4>
                          )}
                        </div>

                        {/* Teacher details & timestamp */}
                        <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 pt-3 border-t border-slate-200/80 dark:border-slate-800 font-medium">
                          <span>
                            {language === 'he' ? 'מורה מוסמך:' : 'Certified Teacher:'}{' '}
                            <strong className="text-slate-900 dark:text-white font-extrabold">
                              {activeRecording.teacher?.user?.firstName} {activeRecording.teacher?.user?.lastName}
                            </strong>
                          </span>
                          <span className="font-semibold text-slate-600 dark:text-slate-300">
                            {new Date(activeRecording.createdAt).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US')}
                          </span>
                        </div>

                        {/* Lesson Takeaways / Notes */}
                        {activeRecording.description && (
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
                            <span className="text-xs font-black text-slate-900 dark:text-white block uppercase tracking-wider">
                              {language === 'he' ? 'דגשים וסיכום השיעור:' : 'Session Highlights & Teacher Notes:'}
                            </span>
                            <p className="text-xs text-slate-800 dark:text-slate-200 font-normal leading-relaxed whitespace-pre-line">
                              {activeRecording.description}
                            </p>
                          </div>
                        )}

                        {/* Navigation controls (Previous / Next lesson) */}
                        {(() => {
                          const currentIndex = recordedSessions.findIndex((s: any) => s.id === activeRecording.id);
                          const prevSession = currentIndex > 0 ? recordedSessions[currentIndex - 1] : null;
                          const nextSession = currentIndex < recordedSessions.length - 1 ? recordedSessions[currentIndex + 1] : null;

                          return (
                            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                              <button
                                disabled={!prevSession}
                                onClick={() => prevSession && setSelectedSessionId(prevSession.id)}
                                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                              >
                                <ChevronLeft className="w-4 h-4" />
                                <span>{language === 'he' ? 'השיעור הקודם' : 'Previous Lesson'}</span>
                              </button>
                              <button
                                disabled={!nextSession}
                                onClick={() => nextSession && setSelectedSessionId(nextSession.id)}
                                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-teal-800 text-white hover:bg-brand-teal-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shadow-2xs"
                              >
                                <span>{language === 'he' ? 'השיעור הבא' : 'Next Lesson'}</span>
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-12 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-brand-teal-50 dark:bg-brand-teal-950/60 text-brand-teal-700 dark:text-brand-teal-300 mx-auto flex items-center justify-center">
                        <PlayCircle className="w-8 h-8" />
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                        {language === 'he' ? 'אין שיעורים מוקלטים כרגע' : 'No Recorded Sessions Available'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        {language === 'he'
                          ? 'המורה שלך יעלה לכאן שיעורים מוקלטים מ-Google Drive.'
                          : 'Your teacher will add Google Drive video recordings here for you to watch.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* RIGHT SIDE (4 COLS): CATEGORIZED LESSONS SIDEBAR */}
                <div className="lg:col-span-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-400" />
                      <span>{language === 'he' ? 'תוכן השיעורים' : 'Lesson Curriculum'}</span>
                    </h3>
                    <span className="text-[11px] font-bold text-brand-teal-800 dark:text-brand-teal-300 bg-brand-teal-50 dark:bg-brand-teal-950/60 px-2 py-0.5 rounded-full border border-brand-teal-200 dark:border-brand-teal-800">
                      {recordedSessions.length} {language === 'he' ? 'שיעורים' : 'Lessons'}
                    </span>
                  </div>

                  {/* Search Bar in Sidebar */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder={language === 'he' ? 'חיפוש שיעור או נושא...' : 'Search lessons...'}
                      value={recordingSearch}
                      onChange={(e) => setRecordingSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-teal-600"
                    />
                  </div>

                  {/* Filtered Sessions List */}
                  {(() => {
                    const filtered = recordedSessions.filter((s: any) => {
                      if (!recordingSearch) return true;
                      const q = recordingSearch.toLowerCase();
                      return (
                        s.title?.toLowerCase().includes(q) ||
                        s.titleHe?.toLowerCase().includes(q) ||
                        s.category?.toLowerCase().includes(q)
                      );
                    });

                    if (filtered.length === 0) {
                      return (
                        <p className="text-xs text-slate-400 py-8 text-center">
                          {language === 'he' ? 'לא נמצאו שיעורים תואמים.' : 'No matching recorded sessions found.'}
                        </p>
                      );
                    }

                    if (recordingGroupMode === 'topic') {
                      // Group by topic/category
                      const grouped: Record<string, any[]> = {};
                      filtered.forEach((s: any) => {
                        const cat = s.category || 'General';
                        if (!grouped[cat]) grouped[cat] = [];
                        grouped[cat].push(s);
                      });

                      return (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                          {Object.entries(grouped).map(([category, items]) => (
                            <div key={category} className="space-y-2">
                              <div className="flex items-center justify-between px-1.5">
                                <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                  {category}
                                </span>
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                  {items.length}
                                </span>
                              </div>

                              <div className="space-y-2">
                                {items
                                  .sort((a, b) => a.sessionNumber - b.sessionNumber)
                                  .map((session: any) => {
                                    const isSelected = activeRecording?.id === session.id;
                                    return (
                                      <button
                                        key={session.id}
                                        onClick={() => setSelectedSessionId(session.id)}
                                        className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                                          isSelected
                                            ? 'bg-brand-teal-800 text-white border-brand-teal-700 shadow-md shadow-brand-teal-900/20'
                                            : 'bg-white dark:bg-slate-850 border-slate-200/90 dark:border-slate-750 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-brand-teal-500/40'
                                        }`}
                                      >
                                        <span
                                          className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 mt-0.5 shadow-2xs ${
                                            isSelected
                                              ? 'bg-brand-teal-950 text-brand-olive-200 border border-brand-teal-700'
                                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700'
                                          }`}
                                        >
                                          #{session.sessionNumber}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                          <p className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                            {language === 'he' && session.titleHe ? session.titleHe : session.title}
                                          </p>
                                          <div className={`flex items-center gap-2 mt-1 text-[11px] font-semibold ${isSelected ? 'text-brand-teal-100' : 'text-slate-600 dark:text-slate-300'}`}>
                                            <span>{session.durationMinutes}m</span>
                                            <span>•</span>
                                            <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                                          </div>
                                        </div>
                                        <PlayCircle
                                          className={`w-4 h-4 shrink-0 mt-1 ${
                                            isSelected ? 'text-brand-olive-300' : 'text-slate-400 group-hover:text-brand-teal-700'
                                          }`}
                                        />
                                      </button>
                                    );
                                  })}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    // By session number
                    return (
                      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                        {filtered
                          .sort((a: any, b: any) => a.sessionNumber - b.sessionNumber)
                          .map((session: any) => {
                            const isSelected = activeRecording?.id === session.id;
                            return (
                              <button
                                key={session.id}
                                onClick={() => setSelectedSessionId(session.id)}
                                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                                  isSelected
                                    ? 'bg-brand-teal-800 text-white border-brand-teal-700 shadow-md shadow-brand-teal-900/20'
                                    : 'bg-white dark:bg-slate-850 border-slate-200/90 dark:border-slate-750 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-brand-teal-500/40'
                                }`}
                              >
                                <span
                                  className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 mt-0.5 shadow-2xs ${
                                    isSelected
                                      ? 'bg-brand-teal-950 text-brand-olive-200 border border-brand-teal-700'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700'
                                  }`}
                                >
                                  #{session.sessionNumber}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                    {language === 'he' && session.titleHe ? session.titleHe : session.title}
                                  </p>
                                  <div className={`flex items-center gap-2 mt-1 text-[11px] font-semibold ${isSelected ? 'text-brand-teal-100' : 'text-slate-600 dark:text-slate-300'}`}>
                                    <span>{session.category}</span>
                                    <span>•</span>
                                    <span>{session.durationMinutes}m</span>
                                  </div>
                                </div>
                                <PlayCircle
                                  className={`w-4 h-4 shrink-0 mt-1 ${
                                    isSelected ? 'text-brand-olive-300' : 'text-slate-400 group-hover:text-brand-teal-700'
                                  }`}
                                />
                              </button>
                            );
                          })}
                      </div>
                    );
                  })()}
                </div>
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

                      {/* Attached Google Drive / External PDF resource with In-System Viewer */}
                      {hw.attachmentUrl && (
                        <div className="p-3 rounded-2xl bg-brand-teal-50/70 dark:bg-brand-teal-950/40 border border-brand-teal-200/80 dark:border-brand-teal-800 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 truncate">
                            <FileText className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-400 shrink-0" />
                            <span className="text-xs font-bold text-brand-teal-950 dark:text-brand-teal-200 truncate">
                              {isGoogleDriveUrl(hw.attachmentUrl)
                                ? (language === 'he' ? 'קובץ חומר PDF מ-Google Drive' : 'Google Drive PDF Material')
                                : (language === 'he' ? 'חומר לימודי מצורף' : 'Attached Learning Material')}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setViewerUrl(hw.attachmentUrl);
                              setViewerTitle(hw.title);
                              setViewerSubtitle(language === 'he' ? 'חומרי עזר לשיעורי בית' : 'Homework Learning Resource');
                            }}
                            className="px-3 py-1.5 text-xs font-bold bg-brand-teal-800 hover:bg-brand-teal-900 text-white rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-brand-olive-300" />
                            <span>{language === 'he' ? 'פתח במערכת' : 'View In-App'}</span>
                          </button>
                        </div>
                      )}

                      {hw.dueDate && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-brand-teal-600" />
                          <span>
                            {language === 'he' ? 'מועד הגשה:' : 'Due date:'}{' '}
                            {new Date(hw.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}

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

          {/* TAB 6: LEADERBOARD & SEASONAL LEAGUES */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-6 animate-fade-in">
              {/* Header Banner & Period Switcher */}
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-800 dark:text-amber-300 mb-2">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>{language === 'he' ? 'ליגות עברית עונתיות ותגי הישג' : 'Seasonal Leagues & Achievement Badges'}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {language === 'he' ? 'לוח מובילים ודירוג עונתי' : 'Leaderboard & Seasonal Rankings'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                    {language === 'he'
                      ? 'התחרה עם תלמידים אחרים, צבור נקודות XP משיעורים ומשחקים, וזכה בתגי הישג עונתיים בלעדיים.'
                      : 'Compete with fellow learners, earn XP from live lessons & games, and unlock seasonal achievement badges.'}
                  </p>
                </div>

                {/* Season Toggle Pills */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700 shrink-0">
                  <button
                    type="button"
                    onClick={() => setLeaderboardPeriod('weekly')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      leaderboardPeriod === 'weekly'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {language === 'he' ? 'ליגה שבועית' : 'This Week'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setLeaderboardPeriod('monthly')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      leaderboardPeriod === 'monthly'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {language === 'he' ? 'ליגה חודשית' : 'This Month'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setLeaderboardPeriod('all_time')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      leaderboardPeriod === 'all_time'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {language === 'he' ? 'היכל התהילה' : 'All-Time'}
                  </button>
                </div>
              </div>

              {/* Top 3 Podium Cards */}
              {leaderboardData.length >= 3 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* #2 Silver */}
                  <div className="order-2 sm:order-1 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center text-center shadow-xs">
                    <span className="text-2xl mb-1">🥈</span>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-400 to-slate-600 text-white font-black text-base flex items-center justify-center shadow-md ring-4 ring-slate-300 dark:ring-slate-700 mb-2 shrink-0">
                      {leaderboardData[1].name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '2'}
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-full">
                      {leaderboardData[1].name}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 mt-1">
                      {t(`levels.${leaderboardData[1].level || 'BEGINNER'}`)}
                    </span>
                    <p className="mt-3 text-base font-extrabold text-slate-700 dark:text-slate-300">
                      {leaderboardData[1].totalPoints.toLocaleString()} <span className="text-xs font-normal">XP</span>
                    </p>
                  </div>

                  {/* #1 Gold - Elevated */}
                  <div className="order-1 sm:order-2 p-6 rounded-3xl bg-gradient-to-b from-amber-500/10 to-transparent dark:from-amber-950/30 dark:to-slate-900 border border-amber-300 dark:border-amber-700/60 flex flex-col items-center text-center shadow-md sm:-mt-2 relative">
                    <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-sm">
                      ★ {language === 'he' ? 'מוביל הליגה' : 'League Leader'} ★
                    </div>
                    <span className="text-3xl mb-1 mt-1">🥇</span>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black text-lg flex items-center justify-center shadow-lg ring-4 ring-amber-300 dark:ring-amber-500/60 mb-2 shrink-0">
                      {leaderboardData[0].name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '1'}
                    </div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white truncate max-w-full">
                      {leaderboardData[0].name}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300/60 mt-1">
                      {t(`levels.${leaderboardData[0].level || 'BEGINNER'}`)}
                    </span>
                    <p className="mt-3 text-xl font-black text-amber-600 dark:text-amber-400">
                      {leaderboardData[0].totalPoints.toLocaleString()} <span className="text-xs font-normal">XP</span>
                    </p>
                  </div>

                  {/* #3 Bronze */}
                  <div className="order-3 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center text-center shadow-xs">
                    <span className="text-2xl mb-1">🥉</span>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-700 to-amber-900 text-white font-black text-base flex items-center justify-center shadow-md ring-4 ring-amber-700/40 mb-2 shrink-0">
                      {leaderboardData[2].name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '3'}
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-full">
                      {leaderboardData[2].name}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 mt-1">
                      {t(`levels.${leaderboardData[2].level || 'BEGINNER'}`)}
                    </span>
                    <p className="mt-3 text-base font-extrabold text-amber-800 dark:text-amber-600">
                      {leaderboardData[2].totalPoints.toLocaleString()} <span className="text-xs font-normal">XP</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Full Standings Table */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {language === 'he' ? 'טבלת הדירוג המלאה' : 'Full League Standings'}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {leaderboardData.length} {language === 'he' ? 'תלמידים בדירוג' : 'students ranked'}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-start text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 font-bold uppercase">
                        <th className="pb-3 text-start w-16">{language === 'he' ? 'דירוג' : 'Rank'}</th>
                        <th className="pb-3 text-start">{language === 'he' ? 'תלמיד' : 'Student'}</th>
                        <th className="pb-3 text-start">{language === 'he' ? 'תגי הישג' : 'Badges'}</th>
                        <th className="pb-3 text-start">{language === 'he' ? 'רמה' : 'Level'}</th>
                        <th className="pb-3 text-start">{language === 'he' ? 'רצף' : 'Streak'}</th>
                        <th className="pb-3 text-end">{language === 'he' ? 'נקודות' : 'Points'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                      {leaderboardData.map((entry: any, idx: number) => {
                        const isTop1 = idx === 0;
                        const isTop2 = idx === 1;
                        const isTop3 = idx === 2;

                        return (
                          <tr
                            key={entry.studentId}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                              entry.studentId === student?.id
                                ? 'bg-teal-50/50 dark:bg-teal-950/20 font-bold'
                                : ''
                            }`}
                          >
                            <td className="py-3 font-extrabold text-sm text-slate-900 dark:text-white">
                              {isTop1 ? '🥇 #1' : isTop2 ? '🥈 #2' : isTop3 ? '🥉 #3' : `#${idx + 1}`}
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-teal-500 to-indigo-700 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                  {entry.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U'}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white">
                                    {entry.name}
                                    {entry.studentId === student?.id && (
                                      <span className="ms-1.5 text-[9px] px-1.5 py-0.5 rounded-md bg-teal-500/20 text-teal-700 dark:text-teal-300">
                                        {language === 'he' ? 'אתה' : 'You'}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-1">
                                {entry.badges && entry.badges.length > 0 ? (
                                  entry.badges.map((b: any) => (
                                    <span
                                      key={b.id}
                                      className="text-base"
                                      title={language === 'he' ? b.titleHe || b.title : b.title}
                                    >
                                      {b.icon || '🏆'}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-slate-400">—</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {t(`levels.${entry.level || 'BEGINNER'}`)}
                              </span>
                            </td>
                            <td className="py-3 text-slate-600 dark:text-slate-400 font-medium">
                              {entry.streakDays > 0 ? `🔥 ${entry.streakDays}d` : '—'}
                            </td>
                            <td className="py-3 text-end font-black text-amber-600 dark:text-amber-400 text-sm">
                              {entry.totalPoints.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">XP</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: ACCOUNT BALANCE & TRANSACTIONS HISTORY */}
          {activeTab === 'balance' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-2">
                    <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{language === 'he' ? 'מרכז יתרה ועסקאות אישי' : 'Student Wallet & Ledger'}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {language === 'he' ? 'יתרת חשבון והיסטוריית עסקאות' : 'Account Balance & Transactions History'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                    {language === 'he'
                      ? 'פירוט מלא של יתרת הארנק האישי שלך, חיובים עבור הזמנת שיעורים, טעינות כספיות, וזיכויים אוטומטיים במקרה של ביטול שיעור מראש.'
                      : 'Complete transparent ledger of your wallet balance, lesson booking debits, deposits, and automated refunds.'}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => refetchTransactions()}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs"
                    title={language === 'he' ? 'רענן נתוני עסקאות' : 'Refresh ledger'}
                  >
                    <RefreshCw className={`w-4 h-4 ${isTransactionsRefetching ? 'animate-spin text-brand-teal-500' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDuration(25);
                      setIsBookingModalOpen(true);
                    }}
                    className="px-4 py-2.5 bg-brand-teal-800 hover:bg-brand-teal-900 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4 text-brand-olive-300" />
                    <span>{language === 'he' ? 'הזמן שיעור 25 דק׳ ($25)' : 'Book 25-Min Lesson ($25)'}</span>
                  </button>
                </div>
              </div>

              {/* 4 Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {/* Available Balance Card */}
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/40 dark:via-emerald-900/20 dark:to-transparent border border-emerald-500/30 dark:border-emerald-500/40 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {language === 'he' ? 'יתרה זמינה בארנק' : 'Available Balance'}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Wallet className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl sm:text-4xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
                      ${currentBalance.toFixed(2)}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        hasEnoughBalance
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                      }`}>
                        {hasEnoughBalance
                          ? (language === 'he' ? `מספיק ל-${Math.floor(currentBalance / 25)} שיעורים` : `${Math.floor(currentBalance / 25)} lessons ready`)
                          : (language === 'he' ? 'יתרה נמוכה' : 'Low balance')}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {language === 'he' ? 'תעריף: $25' : 'Rate: $25/lesson'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total Top-ups & Added */}
                <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {language === 'he' ? 'סך הפקדות וטעינות' : 'Total Top-ups'}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                      <ArrowDownLeft className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      +${transactionsSummary.totalDeposited.toFixed(2)}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {language === 'he' ? 'סך הכל כספים שנטענו לחשבון' : 'Direct deposits & admin credits'}
                    </p>
                  </div>
                </div>

                {/* Total Spent on Bookings */}
                <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {language === 'he' ? 'שיעורים שהוזמנו' : 'Lessons Booked'}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                      -${transactionsSummary.totalSpent.toFixed(2)}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {language === 'he' ? 'חיובים שבוצעו עבור שיעורים' : 'Deductions for booked lessons'}
                    </p>
                  </div>
                </div>

                {/* Total Auto-Refunds */}
                <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {language === 'he' ? 'החזרים וזיכויים' : 'Auto-Refunds'}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/70 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl sm:text-3xl font-black text-cyan-600 dark:text-cyan-400 tracking-tight">
                      +${transactionsSummary.totalRefunded.toFixed(2)}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {language === 'he' ? 'זיכוי מלא על ביטול שיעורים מראש' : 'Instant 100% cancellation refunds'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Engrew Transparent Wallet Policy */}
              <div className="p-4 sm:p-5 rounded-3xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-brand-teal-100 dark:bg-brand-teal-950/80 text-brand-teal-800 dark:text-brand-teal-300 shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white">
                      {language === 'he' ? 'תמחור שיעורים שקוף' : 'Transparent Pricing'}
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {language === 'he' ? 'שיעור 25 דקות מחויב ב-$25 בדיוק ללא עמלות נסתרות.' : '$25 per 25-minute lesson flat with certified teachers.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 shrink-0">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white">
                      {language === 'he' ? 'זיכוי אוטומטי מיידי' : 'Automated Refunds'}
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {language === 'he' ? 'ביטול שיעור מראש מזכה את הארנק מידית ב-$25 מלאים.' : 'Early cancellations refund 100% of the rate instantly.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white">
                      {language === 'he' ? 'יתרה ללא תוקף' : 'Permanent Balance'}
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {language === 'he' ? 'כספי היתרה שמורים עבורך לצמיתות ואינם פגים לעולם.' : 'Funds remain valid indefinitely until you choose to book.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Promotional Coupon & Discount Code Redemption */}
              <div className="bg-gradient-to-r from-amber-500/10 via-brand-teal-500/5 to-emerald-500/10 dark:from-amber-950/30 dark:via-brand-teal-950/20 dark:to-emerald-950/30 rounded-3xl p-6 sm:p-7 border border-amber-300/50 dark:border-amber-700/40 shadow-xs relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 shrink-0">
                      <Gift className="w-5 h-5 text-slate-950" />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-[11px] font-extrabold text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 mb-1">
                        <Sparkles className="w-3 h-3" />
                        <span>{language === 'he' ? 'הטבה מיוחדת' : 'Special Offer'}</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        {language === 'he' ? 'מימוש קוד קופון או שובר הנחה' : 'Redeem Coupon Code or Voucher'}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 max-w-xl">
                        {language === 'he'
                          ? 'הזן קוד קופון רשמי כדי לקבל הנחה מיידית על חבילות שיעורים ורכישות (למשל: HEBREW20 או SHALOM50).'
                          : 'Enter a valid coupon code to unlock instant savings on lesson packages and bookings (e.g., HEBREW20 or SHALOM50).'}
                      </p>
                    </div>
                  </div>

                  {/* Coupon Input Form */}
                  <form onSubmit={handleValidateCoupon} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                    <div className="relative">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder={language === 'he' ? 'קוד קופון (למשל HEBREW20)' : 'Coupon code (e.g. HEBREW20)'}
                        className="w-full sm:w-56 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-xs uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-teal-500 shadow-2xs"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isValidatingCoupon || !couponInput.trim()}
                      className="px-5 py-2.5 bg-brand-teal-800 hover:bg-brand-teal-900 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                    >
                      {isValidatingCoupon ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-brand-olive-300" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-brand-olive-300" />
                      )}
                      <span>{language === 'he' ? 'הפעל קופון' : 'Apply Code'}</span>
                    </button>
                  </form>
                </div>

                {/* Applied Coupon Banner */}
                {appliedCoupon && (
                  <div className="mt-4 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-between gap-3 text-xs animate-in fade-in">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200">
                          <span className="font-mono bg-emerald-200 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md border border-emerald-400/50">
                            {appliedCoupon.code}
                          </span>
                          <span>
                            {appliedCoupon.discountType === 'PERCENT'
                              ? `${appliedCoupon.discountValue}% ${language === 'he' ? 'הנחה' : 'OFF'}`
                              : `$${appliedCoupon.discountValue} ${language === 'he' ? 'הנחה' : 'OFF'}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                          {language === 'he'
                            ? appliedCoupon.descriptionHe || appliedCoupon.description
                            : appliedCoupon.description || appliedCoupon.descriptionHe}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponInput('');
                        haptics.tap();
                      }}
                      className="text-xs font-bold text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors px-2 py-1"
                    >
                      {language === 'he' ? 'הסר' : 'Remove'}
                    </button>
                  </div>
                )}
              </div>

              {/* Transactions History Card */}
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
                {/* Filters and Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto max-w-full">
                    <button
                      type="button"
                      onClick={() => setTransactionTypeFilter('ALL')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        transactionTypeFilter === 'ALL'
                          ? 'bg-white dark:bg-slate-900 text-brand-teal-800 dark:text-brand-teal-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {language === 'he' ? `הכל (${studentTransactions.length})` : `All (${studentTransactions.length})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransactionTypeFilter('BOOKINGS')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        transactionTypeFilter === 'BOOKINGS'
                          ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {language === 'he' ? 'הזמנת שיעורים' : 'Bookings'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransactionTypeFilter('DEPOSITS')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        transactionTypeFilter === 'DEPOSITS'
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {language === 'he' ? 'הפקדות וטעינות' : 'Top-ups'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransactionTypeFilter('REFUNDS')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        transactionTypeFilter === 'REFUNDS'
                          ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {language === 'he' ? 'זיכויים' : 'Refunds'}
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative min-w-[200px] sm:min-w-[240px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-3" />
                    <input
                      type="text"
                      placeholder={language === 'he' ? 'חיפוש עסקאות, שיעור או סכום...' : 'Search transactions...'}
                      value={transactionSearchQuery}
                      onChange={(e) => setTransactionSearchQuery(e.target.value)}
                      className="w-full ps-9 pe-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-teal-600"
                    />
                  </div>
                </div>

                {/* Filtered Transactions List / Table */}
                {(() => {
                  const filtered = studentTransactions.filter((tx: any) => {
                    if (transactionTypeFilter === 'BOOKINGS' && tx.type !== 'SESSION_BOOKING') return false;
                    if (transactionTypeFilter === 'DEPOSITS' && (tx.type !== 'ADMIN_ADJUSTMENT' || Number(tx.amount) <= 0)) return false;
                    if (transactionTypeFilter === 'REFUNDS' && tx.type !== 'SESSION_REFUND') return false;

                    if (!transactionSearchQuery) return true;
                    const q = transactionSearchQuery.toLowerCase();
                    const desc = (tx.description || '').toLowerCase();
                    const type = (tx.type || '').toLowerCase();
                    const amt = String(tx.amount);
                    return desc.includes(q) || type.includes(q) || amt.includes(q);
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="py-12 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                          <Receipt className="w-6 h-6" />
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                          {language === 'he' ? 'אין עסקאות להצגה' : 'No transactions found'}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                          {language === 'he'
                            ? 'כל טעינה, חיוב על שיעור או החזר כספי יתועדו כאן בצורה מפורטת.'
                            : 'Every top-up, lesson booking deduction, and refund will be tracked here.'}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {/* Desktop Table View (Hidden on mobile) */}
                      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
                        <table className="w-full text-start text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                            <tr>
                              <th className="py-3.5 px-4 text-start">{language === 'he' ? 'סוג פעולה' : 'Type'}</th>
                              <th className="py-3.5 px-4 text-start">{language === 'he' ? 'סכום' : 'Amount'}</th>
                              <th className="py-3.5 px-4 text-start">{language === 'he' ? 'יתרה לאחר פעולה' : 'Balance After'}</th>
                              <th className="py-3.5 px-4 text-start">{language === 'he' ? 'תיאור ופרטים' : 'Description / Note'}</th>
                              <th className="py-3.5 px-4 text-start">{language === 'he' ? 'תאריך ושעה' : 'Date & Time'}</th>
                              <th className="py-3.5 px-4 text-center">{language === 'he' ? 'סטטוס' : 'Status'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900/60 font-medium">
                            {filtered.map((tx: any) => {
                              const amt = Number(tx.amount);
                              const isPositive = amt > 0;
                              const isBooking = tx.type === 'SESSION_BOOKING';
                              const isRefund = tx.type === 'SESSION_REFUND';

                              return (
                                <tr key={tx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                  {/* Type */}
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                        isBooking
                                          ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400'
                                          : isRefund
                                          ? 'bg-cyan-100 dark:bg-cyan-950/70 text-cyan-600 dark:text-cyan-400'
                                          : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400'
                                      }`}>
                                        {isBooking ? (
                                          <ArrowUpRight className="w-4 h-4" />
                                        ) : isRefund ? (
                                          <RefreshCw className="w-3.5 h-3.5" />
                                        ) : (
                                          <ArrowDownLeft className="w-4 h-4" />
                                        )}
                                      </div>
                                      <span className="font-extrabold text-slate-800 dark:text-slate-200">
                                        {isBooking
                                          ? (language === 'he' ? 'הזמנת שיעור' : 'Lesson Booking')
                                          : isRefund
                                          ? (language === 'he' ? 'זיכוי שיעור' : 'Auto-Refund')
                                          : (amt > 0 ? (language === 'he' ? 'טעינת יתרה' : 'Wallet Top-up') : (language === 'he' ? 'עדכון יתרה' : 'Adjustment'))}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Amount */}
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <span className={`font-black text-sm ${
                                      isPositive
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-rose-600 dark:text-rose-400'
                                    }`}>
                                      {isPositive ? `+$${amt.toFixed(2)}` : `-$${Math.abs(amt).toFixed(2)}`}
                                    </span>
                                  </td>

                                  {/* Balance After */}
                                  <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                                    ${Number(tx.balanceAfter || 0).toFixed(2)}
                                  </td>

                                  {/* Description */}
                                  <td className="py-3.5 px-4 max-w-xs text-slate-600 dark:text-slate-300">
                                    <div className="line-clamp-2 leading-relaxed">
                                      {tx.description || (language === 'he' ? 'פעולת יתרה במערכת' : 'Balance adjustment')}
                                    </div>
                                  </td>

                                  {/* Date & Time */}
                                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                                    {formatIsraelDateTime(tx.createdAt, {
                                      includeDate: true,
                                      locale: language === 'he' ? 'he-IL' : 'en-US',
                                    })}
                                  </td>

                                  {/* Status */}
                                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>{language === 'he' ? 'הושלם' : 'Completed'}</span>
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card Feed (Visible only on mobile screens) */}
                      <div className="md:hidden space-y-3">
                        {filtered.map((tx: any) => {
                          const amt = Number(tx.amount);
                          const isPositive = amt > 0;
                          const isBooking = tx.type === 'SESSION_BOOKING';
                          const isRefund = tx.type === 'SESSION_REFUND';

                          return (
                            <div
                              key={tx.id}
                              className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-850/90 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-2xs"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                    isBooking
                                      ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400'
                                      : isRefund
                                      ? 'bg-cyan-100 dark:bg-cyan-950/70 text-cyan-600 dark:text-cyan-400'
                                      : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400'
                                  }`}>
                                    {isBooking ? (
                                      <ArrowUpRight className="w-4 h-4" />
                                    ) : isRefund ? (
                                      <RefreshCw className="w-4 h-4" />
                                    ) : (
                                      <ArrowDownLeft className="w-4 h-4" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-black text-xs text-slate-900 dark:text-white">
                                      {isBooking
                                        ? (language === 'he' ? 'הזמנת שיעור' : 'Lesson Booking')
                                        : isRefund
                                        ? (language === 'he' ? 'זיכוי שיעור' : 'Auto-Refund')
                                        : (amt > 0 ? (language === 'he' ? 'טעינת יתרה' : 'Wallet Top-up') : (language === 'he' ? 'עדכון יתרה' : 'Adjustment'))}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                      {formatIsraelDateTime(tx.createdAt, {
                                        includeDate: true,
                                        locale: language === 'he' ? 'he-IL' : 'en-US',
                                      })}
                                    </div>
                                  </div>
                                </div>

                                <div className={`font-black text-base ${
                                  isPositive
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                }`}>
                                  {isPositive ? `+$${amt.toFixed(2)}` : `-$${Math.abs(amt).toFixed(2)}`}
                                </div>
                              </div>

                              {tx.description && (
                                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                                  {tx.description}
                                </p>
                              )}

                              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-800">
                                <span className="text-slate-500 dark:text-slate-400 font-medium">
                                  {language === 'he' ? 'יתרה לאחר פעולה:' : 'Balance after:'}
                                </span>
                                <span className="font-extrabold text-slate-900 dark:text-white">
                                  ${Number(tx.balanceAfter || 0).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB 9: STUDENT PROGRESS ANALYTICS DASHBOARD */}
          {activeTab === 'progress' && student?.id && (
            <React.Suspense fallback={<DashboardSkeleton />}>
              <StudentProgressTab studentId={student.id} />
            </React.Suspense>
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
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>${currentBalance.toFixed(2)}</span>
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

            {!hasEnoughBalance && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>
                  {language === 'he'
                    ? `יתרתך ($${currentBalance.toFixed(2)}) אינה מספקת לשיעור של ${selectedDuration} דק׳ ($${currentDurationPrice.toFixed(2)}).`
                    : `Balance ($${currentBalance.toFixed(2)}) is insufficient for a ${selectedDuration}-min session ($${currentDurationPrice.toFixed(2)}).`}
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
                  {language === 'he' ? '1. בחר משך שיעור ומחיר' : '1. Choose Duration & Price'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[25, 40, 55].map((d) => {
                    const price = Number(sessionPricing?.[String(d)] ?? (d === 55 ? 55 : d === 40 ? 40 : 25));
                    return (
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
                        <div>{d} {language === 'he' ? 'דק׳' : 'Min'}</div>
                        <div className="text-[10px] opacity-90 font-extrabold mt-0.5">${price.toFixed(2)}</div>
                      </button>
                    );
                  })}
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
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-teal-500 to-indigo-700 text-white font-black text-[11px] flex items-center justify-center shadow-xs ring-1 ring-teal-400/30 shrink-0">
                          {`${t.user?.firstName?.charAt(0) || ''}${t.user?.lastName?.charAt(0) || ''}`.toUpperCase() || 'T'}
                        </div>
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
                disabled={bookLessonMutation.isPending || !hasEnoughBalance || !selectedSlotTime || !bookingDate || !selectedTeacherId}
                className="flex-1 py-2.5 rounded-xl bg-brand-teal-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold hover:bg-brand-teal-900 shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4 text-brand-olive-300" />
                <span>
                  {bookLessonMutation.isPending
                    ? (language === 'he' ? 'מאשר...' : 'Confirming...')
                    : (language === 'he' ? `אישור ($${currentDurationPrice.toFixed(2)})` : `Confirm ($${currentDurationPrice.toFixed(2)})`)}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-System Drive Viewer Modal for PDFs & Videos */}
      <DriveViewerModal
        isOpen={!!viewerUrl}
        onClose={() => setViewerUrl(null)}
        url={viewerUrl || ''}
        title={viewerTitle}
        subtitle={viewerSubtitle}
      />

      {/* Lesson Rescheduling Modal (Same Teacher, Zero Extra Charge) */}
      <RescheduleModal
        isOpen={!!reschedulingLesson}
        lesson={reschedulingLesson}
        onClose={() => setReschedulingLesson(null)}
      />

      {/* Floating Capsule Island Bottom Navigation Bar (Matches Uploaded Pill Styling) */}
      <nav
        aria-label="Mobile Navigation"
        className={`lg:hidden fixed left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-md z-40 transition-all duration-300 ${
          isMobileMoreOpen || mobileMenuOpen ? 'opacity-0 pointer-events-none translate-y-8' : 'opacity-100 pointer-events-auto translate-y-0'
        }`}
        style={{ bottom: 'max(calc(env(safe-area-inset-bottom, 0px) - 30px), 4px)' }}
      >
        {/* Soft Ambient Brand Halo / Glow reflecting platform brand colors */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4/5 h-10 bg-gradient-to-r from-brand-teal-500/20 via-teal-400/25 to-brand-olive-500/20 blur-xl pointer-events-none -z-10" />

        <div className="relative rounded-full py-2 px-3 floating-capsule-shell grid grid-cols-5 items-center justify-around gap-1">
          {/* Top Edge Specular Curve Sheen */}
          <div className="absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/90 dark:via-white/20 to-transparent pointer-events-none rounded-full" />

          {mobileTabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === 'more' && isSecondaryActive);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  haptics.tap();
                  if (item.id === 'more') {
                    setIsMobileMoreOpen(true);
                  } else {
                    setActiveTab(item.id as any);
                    setIsMobileMoreOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className={`relative py-1.5 px-2 rounded-full flex flex-col items-center justify-center transition-all duration-300 group ${
                  isActive
                    ? 'floating-capsule-active active:scale-95'
                    : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/60 active:scale-95'
                }`}
              >
                {/* Notification Badge Dot with Ping Ripple */}
                {item.badge && (
                  <span className="absolute top-1 end-2 flex h-2 w-2 items-center justify-center pointer-events-none">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-teal-500 opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600 shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
                  </span>
                )}

                <Icon
                  className={`w-6 h-6 shrink-0 transition-transform duration-200 ${
                    isActive
                      ? 'text-[#0c4a60] dark:text-[#2dd4bf] stroke-[2.2] scale-105 drop-shadow-[0_1px_4px_rgba(12,74,96,0.25)]'
                      : 'text-slate-900 dark:text-slate-100 stroke-[1.8] group-hover:scale-105'
                  }`}
                />
                <span
                  className={`text-[11px] tracking-tight mt-0.5 leading-tight truncate max-w-full transition-colors ${
                    isActive
                      ? 'text-[#0c4a60] dark:text-[#2dd4bf] font-bold'
                      : 'text-slate-800 dark:text-slate-200 font-semibold group-hover:text-slate-950 dark:group-hover:text-white'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* iOS Liquid Glass Mobile "More" Sheet */}
      {isMobileMoreOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsMobileMoreOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-x border-slate-200/90 dark:border-slate-800/90 rounded-t-3xl p-5 pb-32 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />

            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
                  {language === 'he' ? 'פעולות ותכנים נוספים' : 'More Learning Tools'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'he' ? 'שיעורים מוקלטים, שיעורי בית, לוח דירוג ויתרה' : 'Recorded sessions, homework, rankings & balance'}
                </p>
              </div>
              <button
                onClick={() => setIsMobileMoreOpen(false)}
                className="p-1.5 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Card 1: Recorded Sessions */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('recordings');
                  setIsMobileMoreOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`p-3.5 rounded-2xl text-start transition-all flex flex-col justify-between space-y-2 active:scale-95 bg-slate-50/90 hover:bg-slate-100/90 dark:bg-slate-800/60 dark:hover:bg-slate-800/90 border shadow-xs ${
                  activeTab === 'recordings'
                    ? 'border-brand-teal-500 dark:border-cyan-400 ring-2 ring-brand-teal-500/20 dark:ring-cyan-400/20'
                    : 'border-slate-200/90 dark:border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-brand-teal-700 dark:text-teal-300 border border-brand-teal-200/60 dark:border-teal-800/40">
                    <PlayCircle className="w-5 h-5" />
                  </div>
                  {recordedSessions.length > 0 && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-teal-100 dark:bg-teal-900/80 text-brand-teal-900 dark:text-teal-200 border border-brand-teal-300/60 dark:border-teal-700/50">
                      {recordedSessions.length}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                    {language === 'he' ? 'שיעורים מוקלטים' : 'Recorded Sessions'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'he' ? 'צפייה חוזרת בשיעורים' : 'Google Drive replays'}
                  </p>
                </div>
              </button>

              {/* Card 2: Homework */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('homework');
                  setIsMobileMoreOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`p-3.5 rounded-2xl text-start transition-all flex flex-col justify-between space-y-2 active:scale-95 bg-slate-50/90 hover:bg-slate-100/90 dark:bg-slate-800/60 dark:hover:bg-slate-800/90 border shadow-xs ${
                  activeTab === 'homework'
                    ? 'border-brand-olive-500 dark:border-lime-400 ring-2 ring-brand-olive-500/20 dark:ring-lime-400/20'
                    : 'border-slate-200/90 dark:border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-brand-olive-50 dark:bg-brand-olive-950/60 text-brand-olive-700 dark:text-brand-olive-300 border border-brand-olive-200/60 dark:border-brand-olive-800/40">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  {pendingHomeworkCount > 0 && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300/70 dark:border-amber-700/50 animate-pulse">
                      {pendingHomeworkCount} {language === 'he' ? 'לבדיקה' : 'pending'}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                    {language === 'he' ? 'שיעורי בית' : 'Homework & Tasks'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'he' ? 'הגשות ומשוב מורים' : 'Submissions & feedback'}
                  </p>
                </div>
              </button>

              {/* Card 3: Leaderboard */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('leaderboard');
                  setIsMobileMoreOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`p-3.5 rounded-2xl text-start transition-all flex flex-col justify-between space-y-2 active:scale-95 bg-slate-50/90 hover:bg-slate-100/90 dark:bg-slate-800/60 dark:hover:bg-slate-800/90 border shadow-xs ${
                  activeTab === 'leaderboard'
                    ? 'border-purple-500 dark:border-purple-400 ring-2 ring-purple-500/20 dark:ring-purple-400/20'
                    : 'border-slate-200/90 dark:border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40">
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-900 dark:text-purple-200 border border-purple-300/70 dark:border-purple-700/50">
                    {student?.totalPoints || 0} pts
                  </span>
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                    {language === 'he' ? 'לוח דירוג' : 'Leaderboard'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'he' ? 'ליגות ונקודות XP' : 'XP Points & Ranking'}
                  </p>
                </div>
              </button>

              {/* Card 4: Balance & Transactions History */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('balance');
                  setIsMobileMoreOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`p-3.5 rounded-2xl text-start transition-all flex flex-col justify-between space-y-2 active:scale-95 bg-slate-50/90 hover:bg-slate-100/90 dark:bg-slate-800/60 dark:hover:bg-slate-800/90 border shadow-xs ${
                  activeTab === 'balance'
                    ? 'border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500/20 dark:ring-emerald-400/20'
                    : !hasEnoughBalance
                    ? 'border-rose-400 ring-2 ring-rose-400/20'
                    : 'border-slate-200/90 dark:border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-300/70 dark:border-emerald-700/50">
                    ${currentBalance.toFixed(2)}
                  </span>
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                    {language === 'he' ? 'יתרת חשבון והיסטוריה' : 'Account Balance & History'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'he' ? 'פירוט עסקאות, טעינות וזיכויים' : 'Transactions, top-ups & refunds'}
                  </p>
                </div>
              </button>

              {/* Card 5: My Progress Analytics */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('progress');
                  setIsMobileMoreOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`col-span-2 p-3.5 rounded-2xl text-start transition-all flex items-center justify-between gap-4 active:scale-95 bg-slate-50/90 hover:bg-slate-100/90 dark:bg-slate-800/60 dark:hover:bg-slate-800/90 border shadow-xs ${
                  activeTab === 'progress'
                    ? 'border-brand-teal-500 dark:border-teal-400 ring-2 ring-brand-teal-500/20 dark:ring-teal-400/20'
                    : 'border-slate-200/90 dark:border-slate-700/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-brand-teal-700 dark:text-teal-300 border border-brand-teal-200/60 dark:border-teal-800/40 shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                      {language === 'he' ? 'ההתקדמות הלימודית שלי' : 'My Learning Progress'}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {language === 'he' ? 'גרפי נוכחות שבועית, דיוק במשחקים ומפת רמות' : 'Weekly attendance, game accuracy & level roadmap'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-3 py-1.5 rounded-full bg-brand-teal-800 hover:bg-brand-teal-900 dark:bg-teal-500/20 text-white dark:text-teal-200 border border-brand-teal-800 dark:border-teal-400/40 shrink-0">
                  {language === 'he' ? 'צפה במדדים' : 'View'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Modal for Viewing & Printing Official PDF Certificates */}
      <CertificateModal
        isOpen={!!selectedCert}
        certificate={selectedCert}
        onClose={() => setSelectedCert(null)}
      />
    </div>
  );
};
