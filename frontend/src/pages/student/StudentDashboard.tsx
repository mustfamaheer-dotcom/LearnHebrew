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
import { StudentExamsAndWalletModal } from '../../components/student/StudentExamsAndWalletModal';
import { LiveLessonCountdownIsland } from '../../components/lessons/LiveLessonCountdownIsland';
import { haptics } from '../../utils/haptics';
import { triggerConfetti } from '../../utils/confetti';
import { getGoogleCalendarUrl, downloadIcsFile } from '../../utils/calendarSync';
import { StructuredNotesViewer } from '../../components/lessons/StructuredNotesViewer';
import { PageHeaderBanner } from '../../components/common/PageHeaderBanner';
import { CertificateModal, CertificateData } from '../../components/common/CertificateModal';
import { StudentBookingFlow } from '../../components/student/StudentBookingFlow';
import { isGoogleDriveUrl, getVideoEmbedUrl } from '../../lib/driveUtils';
import {
  formatSlotRange12Hour,
  formatIsraelDateTime,
  calculateSlotEndTime,
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
  Flame,
  Trophy,
  Medal,
  Repeat,
  CalendarRange,
  CalendarCheck,
  CalendarDays,
  Info,
  Printer,
} from 'lucide-react';
import { ReceiptModal } from '../../components/receipts/ReceiptModal';
import { ReceiptData } from '../../utils/receiptGenerator';

const LEVEL_AR_MAP: Record<string, string> = {
  BEGINNER: 'مبتدئ (المستوى الأول - أليف)',
  ELEMENTARY: 'أساسي (المستوى الثاني - بيت)',
  INTERMEDIATE: 'متوسط (المستوى الثالث - جيميل)',
  UPPER_INTERMEDIATE: 'فوق المتوسط (المستوى الرابع - داليت)',
  ADVANCED: 'متقدم (المستوى الخامس - هي)',
  FLUENT: 'طلاقة تامة (المستوى السادس - فاف)',
};

const DEFAULT_LEVEL_TABS = [
  { code: 'BEGINNER', labelEn: 'Beginner (Alef)', labelHe: 'מתחיל (רמה א׳)', labelAr: 'مبتدئ (المستوى الأول - أليف)' },
  { code: 'ELEMENTARY', labelEn: 'Elementary (Bet)', labelHe: 'יסודי (רמה ב׳)', labelAr: 'أساسي (المستوى الثاني - بيت)' },
  { code: 'INTERMEDIATE', labelEn: 'Intermediate (Gimel)', labelHe: 'בינוני (רמה ג׳)', labelAr: 'متوسط (المستوى الثالث - جيميل)' },
  { code: 'UPPER_INTERMEDIATE', labelEn: 'Upper Intermediate (Dalet)', labelHe: 'מעל בינוני (רמה ד׳)', labelAr: 'فوق المتوسط (المستوى الرابع - داليت)' },
  { code: 'ADVANCED', labelEn: 'Advanced (He)', labelHe: 'מתקדם (רמה ה׳)', labelAr: 'متقدم (المستوى الخامس - هي)' },
  { code: 'FLUENT', labelEn: 'Fluent (Vav)', labelHe: 'שליטה מלאה (רמה ו׳)', labelAr: 'طلاقة تامة (المستوى السادس - فاف)' },
];

const GAME_TYPE_LABELS: Record<string, { en: string; he: string; ar: string }> = {
  PRONUNCIATION: { en: 'Pronunciation', he: 'הגייה ודיבור', ar: 'نطق وتحدث' },
  WORD_SCRAMBLE: { en: 'Word Scramble', he: 'סידור אותיות', ar: 'ترتيب الحروف' },
  MATCHING: { en: 'Word Matching', he: 'התאמת מילים', ar: 'مطابقة الكلمات' },
  SENTENCE_BUILDER: { en: 'Sentence Builder', he: 'בניית משפטים', ar: 'بناء الجمل' },
  QUIZ: { en: 'Quick Quiz', he: 'חידון מהיר', ar: 'اختبار سريع' },
  SPEED_ROUND: { en: 'Speed Round', he: 'סיבוב מהיר', ar: 'جولة السرعة' },
  FLASHCARD: { en: 'Flashcards', he: 'כרטיסיות זיכרון', ar: 'بطاقات الذاكرة' },
};

const GAME_AR_MAP: Record<string, { title: string; desc: string }> = {
  'Hebrew Alphabet Mastery': {
    title: 'إتقان الأبجدية العبرية (الأوتسوت)',
    desc: 'تعلم ونطق حروف اللغة العبرية مع أمثلة صوتية وتمارين مطابقة تفاعلية.',
  },
  'Daily Hebrew Vocabulary': {
    title: 'مفردات عبرية يومية أساسية',
    desc: 'تدرب على الكلمات والمصطلحات الشائعة في الحياة اليومية، المطاعم، والمحادثات.',
  },
  'Basic Hebrew Verbs & Conjugation': {
    title: 'الأفعال الأساسية وتصريفها في العبرية',
    desc: 'تدرب على تصريف الأفعال الشائعة في زمن الماضي والحاضر بأسلوب تفاعلي.',
  },
  'Food & Shopping Hebrew': {
    title: 'عبرية التسوق والمطاعم والأسواق',
    desc: 'مفردات وجمل عملية للشراء في السوبرماركت والمطاعم والتحدث مع البائعين.',
  },
  'Hebrew Number Sprint': {
    title: 'تحدي الأرقام العبرية السريع',
    desc: 'اختبر سرعتك في قراءة وحساب الأرقام العبرية تحت ضغط الوقت.',
  },
  'Hebrew Sentence Constructor': {
    title: 'بناء وتركيب الجمل العبرية',
    desc: 'رتب الكلمات في الترتيب القواعدي الصحيح لتكوين جمل عبرية سليمة وفصيحة.',
  },
  'Hebrew Greetings & Introductions': {
    title: 'التحيات والتعارف في اللغة العبرية',
    desc: 'تعلم كيف تقدم نفسك وتسأل عن أحوال الآخرين بطلاقة وثقة.',
  },
  'Travel & Directions in Israel': {
    title: 'السفر والاتجاهات والمواصلات',
    desc: 'محادثات ومصطلحات مفيدة للتنقل وسؤال المارة عن الاتجاهات والأماكن.',
  },
};

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
  import('../../components/student/StudentProgressTab').then((m) => ({
    default: m.default || m.StudentProgressTab,
  }))
);

export const StudentDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const { t, language } = useTranslation();
  const isHe = language === 'he';
  const isAr = language === 'ar';
  const isRtl = isHe || isAr;
  const loc = (ar: string, he: string, en: string) => (isAr ? ar : isHe ? he : en);
  const queryClient = useQueryClient();
  const location = useLocation();
  const { isCollapsed } = useSidebarStore();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'booking' | 'lessons' | 'recordings' | 'homework' | 'games' | 'leaderboard' | 'balance' | 'progress'
  >(() => {
    const searchTab = new URLSearchParams(window.location.search).get('tab');
    if (searchTab && ['overview', 'booking', 'lessons', 'recordings', 'homework', 'games', 'leaderboard', 'balance', 'progress'].includes(searchTab)) {
      return searchTab as any;
    }
    if (location.pathname.includes('/games')) return 'games';
    if (location.pathname.includes('/leaderboard')) return 'leaderboard';
    if (location.pathname.includes('/recordings')) return 'recordings';
    if (location.pathname.includes('/balance') || location.pathname.includes('/transactions')) return 'balance';
    if (location.pathname.includes('/progress') || location.pathname.includes('/analytics')) return 'progress';
    return 'overview';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isExamsAndPackagesModalOpen, setIsExamsAndPackagesModalOpen] = useState(false);

  useEffect(() => {
    const handleNavEvent = (e: any) => {
      if (e.detail?.tab && ['overview', 'booking', 'lessons', 'recordings', 'homework', 'games', 'leaderboard', 'balance', 'progress'].includes(e.detail.tab)) {
        setActiveTab(e.detail.tab);
      }
    };
    window.addEventListener('engrew:navigate-tab', handleNavEvent);
    return () => window.removeEventListener('engrew:navigate-tab', handleNavEvent);
  }, []);

  useEffect(() => {
    const searchTab = new URLSearchParams(location.search).get('tab');
    if (searchTab && ['overview', 'booking', 'lessons', 'recordings', 'homework', 'games', 'leaderboard', 'balance', 'progress'].includes(searchTab)) {
      setActiveTab(searchTab as any);
    }
  }, [location.search]);

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
        isAr
          ? `تم تفعيل كود الخصم ${res.data.code} بنجاح!`
          : isHe
          ? `קוד קופון ${res.data.code} הופעל בהצלחה!`
          : `Promo code ${res.data.code} applied successfully!`
      );
    } catch (err: any) {
      haptics.error();
      const msg = err.response?.data?.message || err.response?.data?.error || (isAr ? 'كود القسيمة غير صالح أو منتهي الصلاحية' : isHe ? 'קוד קופון לא תקין או פג תוקף' : 'Invalid or expired coupon code');
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

  // Two Booking Tabs: 'regular' (Weekly Recurring) vs 'onetime' (Single Flexible Lesson)
  const [bookingMode, setBookingMode] = useState<'regular' | 'onetime'>('regular');
  // Regular Weekly Recurring Selected Slots: array of { dayOfWeek: number, startTime: string }
  const [selectedRegularSlots, setSelectedRegularSlots] = useState<Array<{ dayOfWeek: number; startTime: string }>>([]);
  const [regularActiveDay, setRegularActiveDay] = useState<number>(() => (new Date().getDay() + 1) % 7);

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

  // Official Receipt & PDF Modal State
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReceiptData, setSelectedReceiptData] = useState<ReceiptData | null>(null);

  const handleOpenReceipt = (tx: any) => {
    const data: ReceiptData = {
      id: tx.id,
      receiptNumber: tx.receiptNumber || `ENG-${new Date(tx.createdAt).getFullYear()}${String(new Date(tx.createdAt).getMonth() + 1).padStart(2, '0')}-${tx.id.slice(0, 6).toUpperCase()}`,
      type: tx.type,
      amount: Number(tx.amount),
      balanceAfter: Number(tx.balanceAfter || 0),
      description: tx.description,
      createdAt: tx.createdAt,
      sessionType: tx.sessionType,
      packageDetails: tx.packageDetails || (activePackage ? {
        id: activePackage.id,
        name: activePackage.package?.name,
        nameHe: activePackage.package?.nameHe,
        price: activePackage.package?.price,
        currency: activePackage.package?.currency || 'USD',
        lessonsTotal: activePackage.lessonsTotal,
        lessonsUsed: activePackage.lessonsUsed,
        validityDays: activePackage.package?.validityDays || 30,
        startDate: activePackage.startDate,
        endDate: activePackage.endDate,
        paymentStatus: 'APPROVED',
        paymentMethod: 'Verified Payment / Bank Wire',
      } : null),
      lessonDetails: tx.lessonDetails,
      studentDetails: tx.studentDetails || {
        id: user?.id,
        name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Student',
        email: user?.email || '',
        level: dashboard?.student?.level || 'Beginner',
      },
    };
    setSelectedReceiptData(data);
    setIsReceiptModalOpen(true);
  };

  const handleOpenPackageReceipt = () => {
    if (!activePackage) return;
    const data: ReceiptData = {
      id: activePackage.id,
      receiptNumber: `ENG-PKG-${new Date(activePackage.createdAt).getFullYear()}${String(new Date(activePackage.createdAt).getMonth() + 1).padStart(2, '0')}-${activePackage.id.slice(0, 6).toUpperCase()}`,
      type: 'PACKAGE_ACTIVATION',
      amount: activePackage.lessonsTotal,
      balanceAfter: activePackage.lessonsTotal - activePackage.lessonsUsed,
      description: `Package Purchase: ${activePackage.package?.name || 'Session Package'}`,
      createdAt: activePackage.createdAt,
      packageDetails: {
        id: activePackage.id,
        name: activePackage.package?.name,
        nameHe: activePackage.package?.nameHe,
        price: activePackage.package?.price,
        currency: activePackage.package?.currency || 'USD',
        lessonsTotal: activePackage.lessonsTotal,
        lessonsUsed: activePackage.lessonsUsed,
        validityDays: activePackage.package?.validityDays || 30,
        startDate: activePackage.startDate,
        endDate: activePackage.endDate,
        paymentStatus: 'APPROVED',
        paymentMethod: 'Verified Payment / Bank Wire',
      },
      studentDetails: {
        id: user?.id,
        name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Student',
        email: user?.email || '',
        level: dashboard?.student?.level || 'Beginner',
      },
    };
    setSelectedReceiptData(data);
    setIsReceiptModalOpen(true);
  };

  const handleOpenLessonReceipt = (lesson: any) => {
    const data: ReceiptData = {
      id: lesson.id,
      receiptNumber: `ENG-BKG-${new Date(lesson.scheduledAt).getFullYear()}${String(new Date(lesson.scheduledAt).getMonth() + 1).padStart(2, '0')}-${lesson.id.slice(0, 6).toUpperCase()}`,
      type: 'SESSION_BOOKING',
      amount: -1,
      balanceAfter: totalAvailableSessions,
      description: `Private Lesson with ${lesson.teacher?.user?.firstName || 'Teacher'}`,
      createdAt: lesson.createdAt || lesson.scheduledAt,
      sessionType: {
        name: `${lesson.durationMinutes || 25}min`,
        durationMinutes: lesson.durationMinutes || 25,
        labelEn: `${lesson.durationMinutes || 25}-Min Live Session`,
        labelHe: `שיעור חי ${lesson.durationMinutes || 25} דקות`,
      },
      lessonDetails: {
        id: lesson.id,
        scheduledAt: lesson.scheduledAt,
        durationMinutes: lesson.durationMinutes,
        lessonType: lesson.lessonType,
        status: lesson.status,
        teacherName: `${lesson.teacher?.user?.firstName || ''} ${lesson.teacher?.user?.lastName || ''}`.trim(),
        meetingUrl: lesson.zoomLink,
      },
      studentDetails: {
        id: user?.id,
        name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Student',
        email: user?.email || '',
        level: dashboard?.student?.level || 'Beginner',
      },
    };
    setSelectedReceiptData(data);
    setIsReceiptModalOpen(true);
  };

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
  const [selectedLeaderboardLevel, setSelectedLeaderboardLevel] = useState<string>('');

  const studentLevelFromDashboard = dashboard?.student?.levelModel?.code || dashboard?.student?.level || 'BEGINNER';
  const activeLeaderboardLevel = selectedLeaderboardLevel || studentLevelFromDashboard;

  // 4. Fetch Leaderboard by Level (Weekly, Monthly Seasons & All-Time)
  const { data: leaderboardData = [], isLoading: isLeaderboardLoading } = useQuery({
    queryKey: ['leaderboard', leaderboardPeriod, activeLeaderboardLevel],
    queryFn: async () => {
      const res = await api.get(`/games/leaderboard?period=${leaderboardPeriod}&level=${activeLeaderboardLevel}`);
      return res.data.leaderboard || [];
    },
    enabled: !!activeLeaderboardLevel,
  });

  // Fetch configured levels from platform
  const { data: levelsFromApi = [] } = useQuery({
    queryKey: ['platformLevels'],
    queryFn: async () => {
      const res = await api.get('/levels');
      return Array.isArray(res.data) ? res.data : [];
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
      toast.success(
        isAr
          ? `تم حجز الحصة (${dur} دقيقة) بنجاح! تم خصم حصة واحدة من باقتك.`
          : isHe
          ? `שיעור (${dur} דקות) הוזמן בהצלחה! נוכה שיעור 1 מחבילת השיעורים שלך.`
          : `${dur}-Minute Lesson booked successfully! 1 session deducted from your package quota.`,
        isAr ? 'تم تأكيد الحجز' : isHe ? 'ההזמנה אושרה' : 'Booking Confirmed'
      );
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (isAr ? 'تعذر حجز الحصة. يرجى التأكد من توفر رصيد حصص كافٍ في باقتك.' : isHe ? 'שגיאה בהזמנת השיעור. אנא ודא שיש לך מכסת שיעורים פעילה בחבילה.' : 'Failed to book lesson. Please verify your session package quota.');
      setBookingError(msg);
      toast.error(msg, isAr ? 'خطأ في الحجز' : isHe ? 'שגיאה בהזמנה' : 'Booking Error');
    },
  });

  // Regular Booking Mutation (4-Week Weekly Recurring)
  const bookRegularLessonMutation = useMutation({
    mutationFn: async (payload: {
      studentId: string;
      teacherId: string;
      recurringSlots: Array<{ dayOfWeek: number; startTime: string }>;
      durationMinutes?: number;
      sessionTypeId?: string;
      zoomLink?: string;
      weeksCount?: number;
    }) => {
      return api.post('/lessons/regular', payload);
    },
    onSuccess: (res: any, vars) => {
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['studentTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['availableTeachers'] });
      setIsBookingModalOpen(false);
      setSelectedRegularSlots([]);
      setBookingError(null);
      const totalBooked = res.data?.totalLessons || vars.recurringSlots.length * 4;
      toast.success(
        isAr
          ? `تم حجز ${totalBooked} حصص أسبوعية منتظمة بنجاح للأسابيع الـ 4 القادمة!`
          : isHe
          ? `נקבעו בהצלחה ${totalBooked} שיעורים שבועיים קבועים ל-4 השבועות הקרובים!`
          : `Successfully booked ${totalBooked} regular weekly lessons across the next 4 weeks!`,
        isAr ? 'تم تأكيد الحجز الأسبوعي المنتظم' : isHe ? 'חוג שבועי קבוע אושר' : 'Regular Booking Confirmed'
      );
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (isAr ? 'تعذر حجز الجدول الأسبوعي المنتظم. يرجى التأكد من كفاية رصيد باقتك الشهرية.' : isHe ? 'שגיאה בהזמנת השיעורים הקבועים. אנא ודא שיתרת החבילה שלך מספיקה.' : 'Failed to book regular schedule. Please verify your monthly package balance.');
      setBookingError(msg);
      toast.error(msg, isAr ? 'خطأ في الحجز' : isHe ? 'שגיאה בהזמנה' : 'Booking Error');
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
        isAr ? 'تم تسليم الواجب بنجاح!' : isHe ? 'שיעורי הבית הוגשו בהצלחה!' : 'Homework turned in successfully!'
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
        isAr ? 'شكراً لك! تم إرسال تقييم الحصة بنجاح.' : isHe ? 'תודה על הדירוג! משוב השיעור נשמר בהצלחה.' : 'Thank you! Lesson rating submitted successfully.'
      );
    },
    onError: (err: any) => {
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        '';
      const guidance =
        isAr ? 'فشل إرسال تقييم الدرس. يرجى التحقق من الاتصال وإعادة المحاولة.' : isHe ? 'שגיאה בשמירת דירוג השיעור. אנא בדוק את החיבור לרשת ונסה שוב.' : 'Failed to submit lesson rating. Please verify your connection and try again.';
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
        isAr ? 'شكراً جزيلاً! تم إرسال تقييم المعلم وتحديث معدله.' : isHe ? 'תודה רבה! דירוג המורה נשמר וציון המורה עודכן.' : 'Thank you! Teacher rating submitted and instructor score updated.'
      );
    },
    onError: (err: any) => {
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        '';
      const guidance =
        isAr ? 'فشل إرسال تقييم المعلم. يرجى التحقق من الاتصال وإعادة المحاولة.' : isHe ? 'שגיאה בשמירת דירוג המורה. אנא בדוק את החיבור לרשת ונסה שוב.' : 'Failed to submit teacher survey. Please verify your connection and try again.';
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

  const sessionBalances = dashboard?.sessionBalances || [];
  const totalAvailableSessions = sessionBalances.reduce(
    (sum: number, sb: any) => sum + Number(sb.balance || 0),
    0
  );
  const selectedSessionBalance = sessionBalances.find(
    (sb: any) => sb.sessionType?.durationMinutes === selectedDuration
  );
  const hasEnoughBalance = (selectedSessionBalance?.balance || 0) > 0;

  const pkgTotalLessons =
    activePackage?.package?.totalLessons || activePackage?.lessonsTotal || 0;

  // Monthly Regular Booking limit tied to package size:
  // 4 sessions/month -> Max 1 weekly regular slot (4 total across month)
  // 8 sessions/month -> Max 2 weekly regular slots (8 total across month)
  // 12 sessions/month -> Max 3 weekly regular slots (12 total across month)
  // 16 sessions/month -> Max 4 weekly regular slots (16 total across month)
  let maxWeeklyRegularSlots = 1;
  if (pkgTotalLessons >= 16) {
    maxWeeklyRegularSlots = 4;
  } else if (pkgTotalLessons >= 12) {
    maxWeeklyRegularSlots = 3;
  } else if (pkgTotalLessons >= 8) {
    maxWeeklyRegularSlots = 2;
  } else if (pkgTotalLessons >= 4) {
    maxWeeklyRegularSlots = 1;
  } else {
    maxWeeklyRegularSlots = Math.min(
      4,
      Math.max(1, Math.floor((selectedSessionBalance?.balance || totalAvailableSessions) / 4))
    );
  }

  const requiredSessionsForRegular = selectedRegularSlots.length * 4;
  const hasEnoughBalanceForRegular =
    (selectedSessionBalance?.balance || 0) >= requiredSessionsForRegular &&
    requiredSessionsForRegular > 0;

  const DAYS_LIST = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const DAYS_LIST_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  const getUpcomingDatesForSlot = (dayOfWeek: number, startTime: string, weeks: number = 4) => {
    const dates: Date[] = [];
    const now = new Date();
    const [h, m] = startTime.split(':').map(Number);
    let daysUntil = (dayOfWeek - now.getDay() + 7) % 7;
    if (daysUntil === 0) {
      const todaySlot = new Date(now);
      todaySlot.setHours(h, m, 0, 0);
      if (todaySlot.getTime() - now.getTime() < 2 * 60 * 60 * 1000) {
        daysUntil = 7;
      }
    }
    const first = new Date(now);
    first.setDate(now.getDate() + daysUntil);
    first.setHours(h, m, 0, 0);

    for (let w = 0; w < weeks; w++) {
      const d = new Date(first);
      d.setDate(first.getDate() + w * 7);
      dates.push(d);
    }
    return dates;
  };

  const checkRegularSlotConflict = (teacher: any, dayOfWeek: number, startTime: string, duration: number) => {
    if (!teacher || !teacher.lessons) return { hasConflict: false };
    const targetDates = getUpcomingDatesForSlot(dayOfWeek, startTime, 4);

    for (let i = 0; i < targetDates.length; i++) {
      const targetDate = targetDates[i];
      const targetStartMs = targetDate.getTime();
      const targetEndMs = targetStartMs + duration * 60 * 1000;

      const conflict = (teacher.lessons || []).find((l: any) => {
        if (l.status === 'CANCELLED') return false;
        const lStart = new Date(l.scheduledAt).getTime();
        const lEnd = lStart + (l.durationMinutes || 25) * 60 * 1000;
        return targetStartMs < lEnd && targetEndMs > lStart;
      });

      if (conflict) {
        return {
          hasConflict: true,
          conflictingWeek: i + 1,
          conflictingDate: targetDate.toLocaleDateString(isAr ? 'ar-EG' : isHe ? 'he-IL' : 'en-US', {
            month: 'short',
            day: 'numeric',
          }),
        };
      }
    }

    return { hasConflict: false };
  };

  const toggleRegularSlot = (dayOfWeek: number, startTime: string) => {
    const isSelected = selectedRegularSlots.some(
      (s) => s.dayOfWeek === dayOfWeek && s.startTime === startTime
    );

    if (isSelected) {
      setSelectedRegularSlots((prev) =>
        prev.filter((s) => !(s.dayOfWeek === dayOfWeek && s.startTime === startTime))
      );
      setBookingError(null);
    } else {
      if (selectedRegularSlots.length >= maxWeeklyRegularSlots) {
        const msg =
          isAr
            ? `لقد وصلت إلى الحد الأقصى المسموح به في باقتك: ${maxWeeklyRegularSlots} مواعيد أسبوعية منتظمة (${maxWeeklyRegularSlots * 4} حصص في الشهر).`
            : isHe
            ? `הגעת למקסימום המותר בחבילה שלך: ${maxWeeklyRegularSlots} מועדים שבועיים קבועים (${maxWeeklyRegularSlots * 4} שיעורים בחודש).`
            : `You have reached the maximum allowed for your package: ${maxWeeklyRegularSlots} regular weekly slot(s) (${maxWeeklyRegularSlots * 4} sessions/month).`;
        setBookingError(msg);
        toast.warning(msg);
        return;
      }
      setSelectedRegularSlots((prev) => [...prev, { dayOfWeek, startTime }]);
      setBookingError(null);
    }
  };

  const handleRegularBookingSubmit = () => {
    if (!selectedTeacherId) {
      const err = isAr ? 'يرجى اختيار معلم معتمد.' : isHe ? 'אנא בחר מורה מוסמך.' : 'Please select a certified teacher.';
      setBookingError(err);
      toast.warning(err);
      return;
    }
    if (selectedRegularSlots.length === 0) {
      const err =
        isAr
          ? 'يرجى تحديد موعد أسبوعي منتظم واحد على الأقل.'
          : isHe
          ? 'אנא בחר לפחות מועד שבועי קבוע אחד לקביעת החוג.'
          : 'Please select at least one weekly regular slot.';
      setBookingError(err);
      toast.warning(err);
      return;
    }
    if (selectedRegularSlots.length > maxWeeklyRegularSlots) {
      const err =
        isAr
          ? `تتيح باقتك الشهرية ${maxWeeklyRegularSlots} مواعيد أسبوعية منتظمة كحد أقصى.`
          : isHe
          ? `החבילה החודשית שלך מאפשרת לכל היותר ${maxWeeklyRegularSlots} מועדים שבועיים קבועים.`
          : `Your monthly package allows at most ${maxWeeklyRegularSlots} regular weekly slot(s).`;
      setBookingError(err);
      toast.warning(err);
      return;
    }
    if (!hasEnoughBalanceForRegular) {
      const err =
        isAr
          ? `رصيد حصصك غير كافٍ لحجز جدول أسبوعي منتظم لـ 4 أسابيع (${requiredSessionsForRegular} حصص مطلوبة، رصيدك: ${selectedSessionBalance?.balance || 0}). يمكنك حجز حصص فردية من تبويب 'حصة فردية'.`
          : isHe
          ? `יתרת השיעורים שלך אינה מספיקה לקביעת חוג שבועי קבוע ל-4 שבועות (${requiredSessionsForRegular} שיעורים נדרשים, יתרתך: ${selectedSessionBalance?.balance || 0}). ניתן להזמין שיעורים בודדים בלשונית 'שיעור בודד'.`
          : `Insufficient balance for a 4-week regular schedule (${requiredSessionsForRegular} sessions required, your balance: ${selectedSessionBalance?.balance || 0}). You can book single sessions in the 'One-Time Lesson' tab or renew your package.`;
      setBookingError(err);
      toast.warning(err);
      return;
    }
    if (!student?.id) {
      const err = isAr ? 'لم يتم العثور على ملف تعريف الطالب.' : isHe ? 'פרופיל התלמיד לא זוהה.' : 'Student profile not detected.';
      setBookingError(err);
      toast.error(err);
      return;
    }

    for (const slot of selectedRegularSlots) {
      const conflict = checkRegularSlotConflict(selectedTeacher, slot.dayOfWeek, slot.startTime, selectedDuration);
      if (conflict.hasConflict) {
        const err =
          isAr
            ? `يوجد تعارض في الموعد المحدد: المعلم محجوز مسبقاً في الأسبوع ${conflict.conflictingWeek} (${conflict.conflictingDate}) الساعة ${slot.startTime}.`
            : isHe
            ? `נמצאה התנגשות במועד הנבחר: המורה תפוס בשבוע ${conflict.conflictingWeek} (${conflict.conflictingDate}) בשעה ${slot.startTime}.`
            : `Schedule conflict: Teacher is already booked on Week ${conflict.conflictingWeek} (${conflict.conflictingDate}) at ${slot.startTime}.`;
        setBookingError(err);
        toast.error(err);
        return;
      }
    }

    bookRegularLessonMutation.mutate({
      studentId: student.id,
      teacherId: selectedTeacherId,
      recurringSlots: selectedRegularSlots,
      durationMinutes: selectedDuration,
      sessionTypeId: selectedSessionBalance?.sessionTypeId,
      zoomLink: selectedTeacher?.defaultZoomLink,
      weeksCount: 4,
    });
  };

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
      labelAr: 'نظرة عامة والحالة',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'progress',
      label: 'My Progress',
      labelHe: 'ההתקדמות שלי',
      labelAr: 'تقدمي التعليمي',
      icon: TrendingUp,
      badge: null,
    },
    {
      id: 'booking',
      label: 'Book Session',
      labelHe: 'הזמנת שיעור',
      labelAr: 'حجز حصة',
      icon: Clock,
      badge: totalAvailableSessions > 0
        ? (language === 'he' ? `${totalAvailableSessions} שיעורים` : language === 'ar' ? `${totalAvailableSessions} حصص` : `${totalAvailableSessions} left`)
        : (language === 'he' ? '0 שיעורים' : language === 'ar' ? '0 حصص' : '0 left'),
    },
    {
      id: 'lessons',
      label: 'Live Lessons',
      labelHe: 'שיעורים חיים',
      labelAr: 'الدروس المباشرة',
      icon: Video,
      badge: upcomingLessons.length > 0 ? `${upcomingLessons.length}` : null,
    },
    {
      id: 'recordings',
      label: 'Recorded Sessions',
      labelHe: 'שיעורים מוקלטים',
      labelAr: 'الدروس المسجلة',
      icon: PlayCircle,
      badge: recordedSessions.length > 0 ? `${recordedSessions.length}` : null,
    },
    {
      id: 'homework',
      label: 'Homework & Feedback',
      labelHe: 'שיעורי בית ומשוב',
      labelAr: 'الواجبات والملاحظات',
      icon: BookOpen,
      badge: pendingHomeworkCount > 0 ? `${pendingHomeworkCount}` : null,
    },
    {
      id: 'games',
      label: 'Hebrew Games',
      labelHe: 'משחקי עברית',
      labelAr: 'الألعاب التعليمية',
      icon: Gamepad2,
      badge: gamesData?.length ? `${gamesData.length}` : null,
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard',
      labelHe: 'לוח מובילים',
      labelAr: 'لوحة الصدارة',
      icon: Award,
      badge: student?.totalPoints ? (language === 'he' ? `${student.totalPoints} נק׳` : language === 'ar' ? `${student.totalPoints} نقطة` : `${student.totalPoints} pts`) : null,
    },
    {
      id: 'balance',
      label: 'Session Packages & Balances',
      labelHe: 'חבילות ומכסת שיעורים',
      labelAr: 'باقات وحصص الدروس',
      icon: Layers,
      badge: `${totalAvailableSessions} ${language === 'he' ? 'שיעורים' : language === 'ar' ? 'حصص' : 'units'}`,
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
      label: language === 'he' ? 'ראשי' : language === 'ar' ? 'الرئيسية' : 'Home',
      icon: HomeIslandIcon,
      badge: null,
    },
    {
      id: 'booking',
      label: language === 'he' ? 'הזמנה' : language === 'ar' ? 'حجز' : 'Book',
      icon: Calendar,
      badge: !hasEnoughBalance ? '!' : null,
    },
    {
      id: 'lessons',
      label: language === 'he' ? 'שיעורים' : language === 'ar' ? 'الدروس' : 'Lessons',
      icon: Video,
      badge: upcomingLessons.length > 0 ? `${upcomingLessons.length}` : null,
    },
    {
      id: 'games',
      label: language === 'he' ? 'משחקים' : language === 'ar' ? 'ألعاب' : 'Games',
      icon: Gamepad2,
      badge: student?.streakDays ? `${student.streakDays}🔥` : null,
    },
    {
      id: 'more',
      label: language === 'he' ? 'עוד' : language === 'ar' ? 'المزيد' : 'More',
      icon: Sliders,
      badge: pendingHomeworkCount > 0 ? `${pendingHomeworkCount}` : null,
    },
  ];

  const handleBookingSubmit = () => {
    if (!hasEnoughBalance) {
      const err =
        isAr
          ? `لا تتوفر لديك حصص في الباقة لحصة مدتها ${selectedDuration} دقيقة. يرجى التواصل مع فريق Engrew لشحن باقة جديدة.`
          : isHe
          ? `אין לך שיעורים זמינים בחבילה עבור שיעור של ${selectedDuration} דקות. אנא פנה לצוות Engrew להוספת חבילת שיעורים.`
          : `You have 0 available sessions for ${selectedDuration}-minute lessons in your active package. Please contact Engrew support to assign a lesson package.`;
      setBookingError(err);
      toast.warning(err);
      return;
    }
    if (!selectedTeacherId || !bookingDate || !selectedSlotTime) {
      const err =
        isAr
          ? 'يرجى اختيار المعلم والتاريخ وموعد الحصة المتاح.'
          : isHe
          ? 'אנא בחר מורה, תאריך ושעת שיעור פנויה.'
          : 'Please select teacher, date, and available slot.';
      setBookingError(err);
      toast.warning(err);
      return;
    }
    if (!student?.id) {
      const err = isAr ? 'لم يتم العثور على ملف تعريف الطالب.' : isHe ? 'פרופיל התלמיד לא זוהה.' : 'Student profile not detected.';
      setBookingError(err);
      toast.error(err);
      return;
    }
    const chosenDay = new Date(bookingDate + 'T00:00:00').getDay();
    const matchingSlot = (selectedTeacher?.timeSlots || []).find((s: any) => {
      return s.dayOfWeek === chosenDay && s.startTime === selectedSlotTime;
    });

    const scheduledIso = new Date(
      `${bookingDate}T${selectedSlotTime}:00`
    ).toISOString();
    bookLessonMutation.mutate({
      studentId: student.id,
      teacherId: selectedTeacherId,
      timeSlotId: matchingSlot?.id,
      scheduledAt: scheduledIso,
      lessonType: 'ONE_TIME',
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
          panelSubtitle={isAr ? 'أكاديمية إنجرو للغة العبرية والإنجليزية' : isHe ? 'אקדמיה לעברית ואנגלית' : 'Engrew Hebrew & English Academy'}
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          customSlot={
            isCollapsed ? (
              <div className="flex flex-col items-center gap-2 w-full py-1">
                {/* Collapsed Session Quota Capsule */}
                <div className="relative group flex justify-center w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('balance');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-11 py-2 px-1 rounded-2xl bg-brand-teal-50 dark:bg-brand-teal-950/60 border border-brand-teal-300 dark:border-brand-teal-800 hover:bg-brand-teal-100 dark:hover:bg-brand-teal-900/60 transition-all flex flex-col items-center justify-center cursor-pointer shadow-xs active:scale-95"
                    aria-label={isAr ? `رصيد الحصص: ${totalAvailableSessions}` : isHe ? `מכסת שיעורים: ${totalAvailableSessions}` : `Session Units: ${totalAvailableSessions}`}
                  >
                    <Layers className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-300 shrink-0" />
                    <span className="text-[10px] font-black text-brand-teal-900 dark:text-brand-teal-200 mt-1 leading-none truncate max-w-full">
                      {totalAvailableSessions}x
                    </span>
                  </button>

                  {/* Floating Tooltip Pill on Hover */}
                  <div className="hidden lg:flex absolute start-[calc(100%+0.65rem)] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-slate-950 text-white text-xs font-bold whitespace-nowrap shadow-xl border border-white/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-brand-olive-400" />
                    <span>{isAr ? 'الحصص المتبقية:' : isHe ? 'שיעורים זמינים:' : 'Sessions Left:'}</span>
                    <span className="text-emerald-300 font-black">{totalAvailableSessions}</span>
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
                    <span>{isAr ? 'النقاط المكتسبة:' : isHe ? 'נקודות למידה:' : 'Points Earned:'}</span>
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
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-brand-teal-50 dark:bg-brand-teal-950/60 border border-brand-teal-200/80 dark:border-brand-teal-800/80 hover:bg-brand-teal-100 dark:hover:bg-brand-teal-900/60 transition-colors text-start cursor-pointer"
                  title={isAr ? 'عرض باقات الحصص والأرصدة' : isHe ? 'צפה במכסת השיעורים והחבילות' : 'View Session Packages & Balances'}
                >
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-300 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {isAr ? 'الحصص المتبقية' : isHe ? 'שיעורים זמינים' : 'Sessions Left'}
                    </span>
                  </div>
                  <span className="text-xs font-black text-brand-teal-900 dark:text-brand-teal-200">
                    {totalAvailableSessions} {isAr ? 'حصص' : isHe ? 'שיעורים' : 'units'}
                  </span>
                </button>
                <div className="text-center p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="flex items-center justify-center gap-1.5 text-amber-500 font-extrabold text-xs">
                    <Award className="w-3.5 h-3.5" />
                    <span>{student?.totalPoints || 0}</span>
                  </div>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr ? 'النقاط المكتسبة' : isHe ? 'נקודות למידה' : 'Points Earned'}
                  </p>
                </div>
              </div>
            )
          }
          actionButton={{
            label: isAr ? 'حجز حصة 25 دقيقة' : isHe ? 'הזמנת שיעור 25 דק׳' : 'Book 25-Min Lesson',
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
                      {isAr
                        ? 'واصل تقدمك نحو إتقان اللغة العبرية مع حصص فردية تفاعلية مدتها 25 دقيقة، وألعاب تعليمية ممتعة، وملاحظات مباشرة من معلمك المعتمد.'
                        : isHe
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
                      title={isAr ? 'عرض باقات الحصص والأرصدة' : isHe ? 'צפה בחבילות ומכסת שיעורים' : 'View Session Packages & Balances'}
                    >
                      <div className="flex items-center justify-center gap-1 text-emerald-300 font-extrabold text-lg sm:text-xl group-hover:scale-105 transition-transform">
                        <Layers className="w-5 h-5 text-emerald-300 shrink-0" />
                        <span>{totalAvailableSessions}</span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] font-semibold text-brand-teal-100 uppercase mt-0.5">
                        {isAr ? 'الحصص المتبقية' : isHe ? 'מפגשים זמינים' : 'Sessions Left'}
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

                    {/* Session Packages & Exams Action Button */}
                    <button
                      type="button"
                      onClick={() => setIsExamsAndPackagesModalOpen(true)}
                      className="flex items-center gap-2.5 px-4 py-3 sm:py-3.5 bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-white rounded-2xl font-bold text-xs sm:text-sm border border-white/20 shadow-md backdrop-blur-md cursor-pointer group"
                      title={isAr ? 'باقات الحصص والاختبارات' : isHe ? 'חבילות שיעורים ומבחנים' : 'Session Packages & Exams'}
                    >
                      <div className="p-1 rounded-lg bg-emerald-400/20 text-emerald-300 group-hover:scale-110 transition-transform">
                        <Layers className="w-4 h-4 text-emerald-300 shrink-0" />
                      </div>
                      <span className="whitespace-nowrap font-extrabold">
                        {isAr ? 'باقات الحصص والاختبارات' : isHe ? 'חבילות שיעורים ומבחנים' : 'Session Packages & Exams'}
                      </span>
                    </button>
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
                          ? (isAr ? 'نشط' : isHe ? 'פעיל' : 'Active')
                          : (isAr ? 'منتهي الصلاحية' : isHe ? 'פג תוקף' : 'Expired')}
                      </span>
                    </div>

                    {activePackage ? (
                      <div className="space-y-3">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                          {isAr && activePackage.package?.nameAr
                            ? activePackage.package?.nameAr
                            : isHe
                            ? activePackage.package?.nameHe
                            : activePackage.package?.nameEn}
                        </h2>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-brand-teal-800 dark:text-brand-teal-400">
                            {remainingLessons}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            / {activePackage.lessonsTotal}{' '}
                            {isAr ? 'حصص 25 دقيقة متبقية' : isHe ? 'שיעורים בני 25 דק׳ נותרו' : '25-min lessons remaining'}
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
                            {isAr ? 'حصص مكتملة' : isHe ? 'שיעורים הושלמו' : 'lessons completed'}
                          </span>
                          <span>
                            {percentUsed}% {isAr ? 'مستخدمة' : isHe ? 'נוצל' : 'used'}
                          </span>
                        </div>

                        <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60">
                          <span>{isAr ? 'صالح حتى:' : isHe ? 'בתוקף עד:' : 'Valid until:'} <strong className="text-slate-700 dark:text-slate-300 font-bold">{activePackage ? new Date(activePackage.endDate).toLocaleDateString() : '—'}</strong></span>
                          <button
                            type="button"
                            onClick={handleOpenPackageReceipt}
                            className="px-2.5 py-1 rounded-lg bg-brand-teal-50 hover:bg-brand-teal-100 dark:bg-brand-teal-950/70 dark:hover:bg-brand-teal-900 text-brand-teal-800 dark:text-brand-teal-300 text-[10px] font-black flex items-center gap-1 border border-brand-teal-200 dark:border-brand-teal-800 transition-colors cursor-pointer shadow-2xs"
                            title={isAr ? 'طباعة فاتورة وإيصال الباقة' : isHe ? 'הדפס קבלה וחשבונית לחבילה' : 'Print Package Invoice & Receipt'}
                          >
                            <Printer className="w-3 h-3 text-brand-teal-700 dark:text-brand-teal-300" />
                            <span>{isAr ? 'إيصال الباقة' : isHe ? 'קבלה / חשבונית' : 'Package Receipt'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-7 flex flex-col items-center justify-center text-center space-y-2">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400">
                          <Layers className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {isAr ? 'لا توجد باقة نشطة' : isHe ? 'אין חבילה פעילה' : 'No active package'}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            {isAr ? 'تواصل مع الإدارة للحصول على باقة حصص' : isHe ? 'פנה למנהל לרכישת חבילת שיעורים' : 'Contact sales to acquire a session package'}
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
                      <span>{isAr ? 'حجز موعد 25 دقيقة' : isHe ? 'הזמן שיעור 25 דק׳' : 'Book 25-Min Slot'}</span>
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
                        {isAr ? 'نظام 25 دقيقة' : isHe ? 'מתכונת 25 דקות' : '25 Min Format'}
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
                              {isAr ? 'معلم عبرية معتمد' : isHe ? 'מורה מוסמך לעברית' : 'Certified Hebrew Instructor'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                          <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                            <Clock className="w-3.5 h-3.5 text-brand-teal-700 dark:text-brand-teal-400 shrink-0" />
                            <span className="truncate">
                              {formatIsraelDateTime(upcomingLessons[0].scheduledAt, {
                                includeWeekday: true,
                                locale: isAr ? 'ar-EG' : isHe ? 'he-IL' : 'en-US',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            <Globe2 className="w-3.5 h-3.5 text-brand-olive-600 dark:text-brand-olive-400 shrink-0" />
                            <span>
                              {isAr
                                ? 'حصة 25 دقيقة • بتوقيت القدس'
                                : isHe
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
                            {isAr ? 'لا توجد دروس قادمة مجدولة' : isHe ? 'אין שיעורים קרובים' : 'No upcoming lessons scheduled'}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            {isAr ? 'حجز حصة فردية مدتها 25 دقيقة' : isHe ? 'קבע שיעור 25 דקות עם מורה פרטי' : 'Book a 25-minute 1-on-1 session'}
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
                            <span>{isAr ? 'دخول Zoom' : isHe ? 'זום' : 'Join Zoom'}</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setReschedulingLesson(upcomingLessons[0])}
                          className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-slate-200/80 dark:border-slate-700"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-teal-500" />
                          <span>{isAr ? 'تعديل الموعد' : isHe ? 'שינוי מועד' : 'Reschedule'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenLessonReceipt(upcomingLessons[0])}
                          className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors border border-slate-200/80 dark:border-slate-700 shadow-2xs"
                          title={isAr ? 'طباعة إشعار حجز الحصة والقسيمة' : isHe ? 'הדפס אישור הזמנת שיעור ושובר' : 'Print Booking Slip & Voucher'}
                        >
                          <Printer className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-400" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveTab('booking')}
                        className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 text-center"
                      >
                        <CalendarIcon className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-400" />
                        <span>{isAr ? 'حدد موعد الدرس القادم' : isHe ? 'קבע את השיעור הבא' : 'Schedule Next Lesson'}</span>
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
                          ? `${recentHomework.filter((h: any) => h.status === 'ASSIGNED').length} ${isAr ? 'قيد المراجعة' : isHe ? 'ממתינים' : 'pending'}`
                          : isAr ? 'مكتمل حتى الآن' : isHe ? 'הכל נבדק' : 'Up to date'}
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
                                  {isAr ? 'يستحق التسليم قريباً' : isHe ? 'להגשה בקרוב' : 'Due soon'}
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
                                  {isAr ? 'تسليم الحل ←' : isHe ? 'הגש שיעורים ←' : 'Submit Work →'}
                                </button>
                              </div>

                              {submittingHwId === hw.id && (
                                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                                  <textarea
                                    rows={2}
                                    value={hwNote}
                                    onChange={(e) => setHwNote(e.target.value)}
                                    placeholder={
                                      isAr ? 'أضف ملاحظاتك أو رابط تسليم الواجب هنا...' : isHe ? 'הוסף הערות או קישור לפתרון שיעורי הבית...' : 'Add your homework submission notes or link...'
                                    }
                                    className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-teal-800"
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={() => setSubmittingHwId(null)}
                                      className="px-2 py-1 text-xs text-slate-500 dark:text-slate-400 font-semibold"
                                    >
                                      {isAr ? 'إلغاء' : isHe ? 'ביטול' : 'Cancel'}
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
                                      {isAr ? 'تسليم' : isHe ? 'הגש' : 'Turn In'}
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
                            {isAr ? 'تم إنجاز كافة المهام بنجاح!' : isHe ? 'כל המשימות הושלמו!' : 'All caught up!'}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            {isAr ? 'لا توجد واجبات بانتظار المراجعة' : isHe ? 'אין שיעורי בית ממתינים לבדיקה' : 'No homework pending review'}
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
                      <span>{isAr ? 'عرض كل الواجبات' : isHe ? 'צפה בכל שיעורי הבית' : 'View All Homework'}</span>
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
                      {isAr
                        ? 'الدروس الأخيرة وتسجيلات Google Drive'
                        : isHe
                        ? 'שיעורים אחרונים והקלטות Google Drive'
                        : 'Recent Lessons & Google Drive Recordings'}
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('lessons')}
                    className="text-xs font-bold text-brand-teal-800 dark:text-brand-teal-400 hover:underline"
                  >
                    {isAr ? 'عرض الكل ←' : isHe ? 'צפה בהכל ←' : 'View All →'}
                  </button>
                </div>
                {recentLessons.slice(0, 2).map((lesson: any) => (
                  <div
                    key={lesson.id}
                    className="p-3.5 mb-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {isAr ? 'حصة 25 دقيقة مع' : isHe ? 'שיעור 25 דק׳ עם' : '25m Lesson with'}{' '}
                        {lesson.teacher?.user?.firstName} {lesson.teacher?.user?.lastName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {new Date(lesson.scheduledAt).toLocaleDateString()} •{' '}
                        {isAr ? '25 دقيقة (توقيت القدس)' : isHe ? '25 דק׳ (שעון ישראל)' : '25 min (IST)'}
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
                        <span>{isAr ? 'مشاهدة التسجيل' : isHe ? 'צפייה בהקלטה' : 'Watch Recording'}</span>
                      </a>
                    )}
                  </div>
                ))}
                {recentLessons.length === 0 && (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    {isAr
                      ? 'لم تكتمل أي حصص بعد. احجز أول حصة لك مدتها 25 دقيقة لتبدأ!'
                      : isHe
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
                          <span>{isAr ? 'شهادات التخرج والإنجاز الرسمية' : isHe ? 'תעודות סיום רשמיות' : 'Official Certificates of Completion'}</span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/30">
                            {certificatesData.length} {isAr ? 'تم منحها' : isHe ? 'הוענקו' : 'Awarded'}
                          </span>
                        </h2>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {isAr ? 'شهادات إنجاز معتمدة برموز تحقق رسمية جاهزة للطباعة والتحميل' : isHe ? 'תעודות חתומות עם קוד אימות רשמי הניתנות להדפסה ושמירה ב-PDF' : 'Verified milestone credentials with serial verification numbers, ready to print & download'}
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
                              {new Date(cert.completionDate).toLocaleDateString(isAr ? 'ar-EG' : isHe ? 'he-IL' : 'en-US')}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {isAr && cert.packageNameAr ? cert.packageNameAr : isHe && cert.packageNameHe ? cert.packageNameHe : cert.packageName}
                          </h3>
                          <p className="text-xs font-semibold text-brand-teal-700 dark:text-brand-teal-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{isAr && cert.levelAchievedAr ? cert.levelAchievedAr : isHe && cert.levelAchievedHe ? cert.levelAchievedHe : cert.levelAchieved}</span>
                          </p>
                        </div>

                        <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            {isAr ? 'رمز تحقق معتمد' : isHe ? 'אימות חתום' : 'Verified Serial'}
                          </span>
                          <button
                            onClick={() => setSelectedCert(cert)}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>{isAr ? 'عرض الشهادة الرسمية' : isHe ? 'הצג תעודה רשמית' : 'View Certificate'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BOOK SESSION (SMART CALENDAR & AVAILABILITY ENGINE) */}
          {activeTab === 'booking' && (
            <div className="space-y-6">
              <PageHeaderBanner
                badgeIcon={Repeat}
                badgeText={isAr ? 'محرك الحجز الذكي • اختر الوقت والمعلم' : isHe ? 'מערכת הזמנת שיעורים חכמה • בחירת מועד ומורה' : 'Smart Booking Engine • Select Time & Teacher'}
                statusText="Live"
                title={isAr ? 'حجز الدروس والحصص المنتظمة' : isHe ? 'קביעת שיעורים וחוגים (One-Time & Regular Booking)' : 'Session & Regular Booking Hub'}
                description={
                  isAr ? 'اختر نوع الجلسة، وحدد الوقت المطلوب من التقويم، واطلع فوراً على المعلمين المتاحين أو بدّل المعلم بكل سهولة.' : isHe ? 'בחר סוג שיעור (בודד או שבועי קבוע), בחר את השעה הרצויה מהלוח, ובדוק בזמן אמת אילו מורים פנויים לשעה זו או החלף מורה בקלות.' : 'Choose your session type, pick your desired time from the calendar, and instantly see which certified teachers are available or easily switch instructors.'
                }
              />

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <StudentBookingFlow
                  studentId={dashboard?.student?.id || user?.id}
                  sessionBalances={sessionBalances}
                  packageAllowance={dashboard?.student?.packageAllowance}
                  teachersData={teachersData || []}
                  language={language}
                  isModal={false}
                />
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
                      {isAr ? 'الدروس المباشرة القادمة' : isHe ? 'שיעורים חיים קרובים' : 'Upcoming Live Sessions'}
                    </h2>
                  </div>
                  <span className="text-xs font-bold text-brand-olive-700 dark:text-brand-olive-300 bg-brand-olive-50 dark:bg-brand-olive-950/60 px-2.5 py-0.5 rounded-full border border-brand-olive-200 dark:border-brand-olive-800">
                    {upcomingLessons.length}{' '}
                    {isAr ? 'مجدولة' : isHe ? 'מתוזמנים' : 'Scheduled'}
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
                                  {lessonDur} {isAr ? 'دقيقة' : isHe ? 'דקות' : 'Min'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {formatIsraelDateTime(l.scheduledAt, {
                                  includeWeekday: true,
                                  locale: isAr ? 'ar-EG' : isHe ? 'he-IL' : 'en-US',
                                })}{' '}
                                • {lessonDur} {isAr ? 'دقيقة (توقيت القدس)' : isHe ? 'דק׳ (שעון ישראל)' : `min (${ISRAEL_TZ_LABEL})`}
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
                              title={isAr ? 'إضافة إلى تقويم Google' : isHe ? 'הוסף ל-Google Calendar' : 'Add to Google Calendar'}
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
                              title={isAr ? 'تحميل ملف التقويم (.ics)' : isHe ? 'הורד קובץ iCal / Outlook' : 'Download Apple / Outlook (.ics)'}
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
                              <span>{isAr ? 'تعديل الموعد' : isHe ? 'שינוי מועד' : 'Reschedule'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenLessonReceipt(l)}
                              title={isAr ? 'طباعة إشعار وتأكيد الحجز' : isHe ? 'הדפס אישור הזמנה ושובר כניסה לשיעור' : 'Print Booking Slip & Voucher'}
                              className="px-3 py-2 bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
                            >
                              <Printer className="w-3.5 h-3.5 text-brand-teal-700 dark:text-brand-teal-400" />
                              <span className="hidden sm:inline">{isAr ? 'إيصال' : isHe ? 'אישור' : 'Receipt'}</span>
                            </button>

                            {l.zoomLink && (
                              <a
                                href={l.zoomLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-brand-olive-500 hover:bg-brand-olive-600 text-slate-950 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-2"
                              >
                                <Video className="w-4 h-4" />
                                <span>{isAr ? 'الدخول إلى قاعة Zoom' : isHe ? 'כניסה לשיעור בזום' : 'Join Zoom Lesson'}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    {isAr
                      ? 'لا توجد دروس قادمة. انتقل إلى تبويب حجز حصة لاختيار موعد مناسب.'
                      : isHe
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
                      {isAr ? 'الدروس المكتملة والتسجيلات' : isHe ? 'שיעורים שהושלמו והקלטות' : 'Completed Lessons & Recordings'}
                    </h2>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {isAr ? 'مسجل لمراجعته في أي وقت' : isHe ? 'הוקלט עבור החזרה שלך' : 'Recorded for your review'}
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
                                {isAr ? `حصة (${lessonDur} دقيقة) مع` : isHe ? `שיעור (${lessonDur} דק׳) עם` : `${lessonDur}m Lesson with`}{' '}
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
                                {isAr ? `${lessonDur} دقيقة` : isHe ? `${lessonDur} דק׳` : `${lessonDur}m`}
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
                                    {isAr ? 'مشاهدة التسجيل في المنصة' : isHe ? 'צפייה בהקלטה במערכת' : 'Watch Recording In-App'}
                                  </span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                                  {isAr ? 'سيتم رفع التسجيل قريباً' : isHe ? 'ההקלטה תועלה בקרוב' : 'Recording uploading soon'}
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
                                  title={isAr ? 'اضغط لتعديل تقييم الدرس' : isHe ? 'לחץ לעריכת דירוג השיעור' : 'Click to edit lesson rating'}
                                >
                                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                  <span>
                                    {isAr
                                      ? `الدرس: ${lesson.feedback.qualityRating}/5`
                                      : isHe
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
                                  <span>{isAr ? 'تقييم الحصة' : isHe ? 'דרג שיעור' : 'Rate Lesson'}</span>
                                </button>
                              )}

                              {/* 2. Rate Teacher Button / Badge */}
                              {lesson.teacher?.surveys?.[0] ? (
                                <button
                                  type="button"
                                  onClick={() => openRateTeacher(lesson)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-xs font-bold hover:bg-purple-500/20 transition-colors"
                                  title={isAr ? 'اضغط لتعديل تقييم المعلم' : isHe ? 'לחץ לעריכת דירוג המורה' : 'Click to edit teacher rating'}
                                >
                                  <Award className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                  <span>
                                    {isAr
                                      ? `المعلم: ${lesson.teacher.surveys[0].overallRating}/5`
                                      : isHe
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
                                  <span>{isAr ? 'تقييم المعلم' : isHe ? 'דרג מורה' : 'Rate Teacher'}</span>
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
                                    {isAr ? 'تقييم جودة الحصة' : isHe ? 'דירוג איכות השיעור' : 'Rate Lesson Quality'}
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
                                      {isAr ? 'إجراء مطلوب:' : isHe ? 'שימת לב נדרשת:' : 'Action Required:'}
                                    </span>
                                    <p className="mt-0.5 leading-relaxed">{lessonRatingError}</p>
                                  </div>
                                </div>
                              )}

                              {/* Star Rating with Dynamic Live Guidance */}
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                                  {isAr ? 'اختر تقييم الحصة (1-5 نجوم):' : isHe ? 'בחר דירוג לשיעור (1–5 כוכבים):' : 'Select Lesson Rating (1–5 Stars):'}
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
                                    {isAr ? 'سرعة وإيقاع الحصة:' : isHe ? 'קצב השיעור:' : 'Lesson Pace:'}
                                  </label>
                                  <div className="flex gap-1.5">
                                    {[
                                      { val: 1, labelAr: 'بطيء', labelHe: 'איטי', labelEn: 'Slow' },
                                      { val: 3, labelAr: 'مناسب جداً', labelHe: 'מתאים בדיוק', labelEn: 'Just Right' },
                                      { val: 5, labelAr: 'سريع', labelHe: 'מהיר', labelEn: 'Fast' },
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
                                        {isAr ? item.labelAr : isHe ? item.labelHe : item.labelEn}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Difficulty */}
                                <div>
                                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    {isAr ? 'مستوى الصعوبة:' : isHe ? 'רמת קושי:' : 'Difficulty:'}
                                  </label>
                                  <div className="flex gap-1.5">
                                    {[
                                      { val: 1, labelAr: 'سهل', labelHe: 'קל', labelEn: 'Easy' },
                                      { val: 3, labelAr: 'متوازن', labelHe: 'מאוזן', labelEn: 'Balanced' },
                                      { val: 5, labelAr: 'تحدي', labelHe: 'מאתגר', labelEn: 'Challenging' },
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
                                        {isAr ? item.labelAr : isHe ? item.labelHe : item.labelEn}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Optional Comment */}
                              <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  {isAr ? 'ملاحظات إضافية حول الدرس (اختياري):' : isHe ? 'משוב נוסף על השיעור (אופציונלי):' : 'Additional Lesson Feedback (optional):'}
                                </label>
                                <input
                                  type="text"
                                  value={lessonComment}
                                  onChange={(e) => setLessonComment(e.target.value)}
                                  placeholder={
                                    isAr ? 'ماذا تعلمت في هذه الحصة؟ هل هناك نقاط تود التركيز عليها لاحقاً؟...' : isHe ? 'מה אהבת בשיעור? מה תרצה לתרגל יותר בפעם הבאה?...' : 'What did you learn? Any areas to focus on next time?...'
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
                                  {isAr ? 'إلغاء' : isHe ? 'ביטול' : 'Cancel'}
                                </button>
                                <button
                                  type="button"
                                  disabled={submitLessonFeedbackMutation.isPending}
                                  onClick={() => {
                                    if (!lessonRatingVal || lessonRatingVal < 1) {
                                      setLessonRatingError(
                                        isAr
                                          ? 'يرجى اختيار التقييم (1-5 نجوم) بالضغط على النجوم أعلاه قبل الإرسال.'
                                          : isHe
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
                                      ? isAr ? 'جاري الإرسال...' : isHe ? 'שולח...' : 'Submitting...'
                                      : isAr ? 'إرسال تقييم الحصة' : isHe ? 'שלח דירוג שיעור' : 'Submit Lesson Rating'}
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
                                    {isAr
                                      ? `تقييم وملاحظات المعلم: ${lesson.teacher?.user?.firstName || 'المعلم'}`
                                      : isHe
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
                                      {isAr ? 'إجراء مطلوب:' : isHe ? 'שימת לב נדרשת:' : 'Action Required:'}
                                    </span>
                                    <p className="mt-0.5 leading-relaxed">{teacherRatingError}</p>
                                  </div>
                                </div>
                              )}

                              {/* Overall Teacher Star Rating */}
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                                  {isAr ? 'التقييم العام للمعلم (1-5 نجوم):' : isHe ? 'ציון כללי למורה (1–5 כוכבים):' : 'Overall Teacher Rating (1–5 Stars):'}
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
                                  {isAr ? 'معايير تقييم التدريس:' : isHe ? 'הערכת מאפייני הוראה:' : 'Teaching Evaluation Criteria:'}
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  {/* Communication */}
                                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-900/60">
                                    <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300 block mb-1">
                                      {isAr ? 'التواصل والوضوح' : isHe ? 'תקשורת וסבלנות' : 'Communication'}
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
                                      {isAr ? 'التمكن وأسلوب الشرح' : isHe ? 'בקיאות והסבר' : 'Knowledge & Style'}
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
                                      {isAr ? 'الدقة والالتزام بالوقت' : isHe ? 'דיוק וזמנים' : 'Punctuality'}
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
                                  {isAr ? 'كلمة طيبة أو ملاحظات للمعلم (اختياري):' : isHe ? 'מילה טובה או משוב למורה (אופציונלי):' : 'Feedback or Compliment for Teacher (optional):'}
                                </label>
                                <input
                                  type="text"
                                  value={teacherComment}
                                  onChange={(e) => setTeacherComment(e.target.value)}
                                  placeholder={
                                    isAr ? 'اكتب كلمة شكر أو ملاحظات لمعلمك...' : isHe ? 'שתף את המורה במה שהיה מצוין או הצעות לעתיד...' : 'Write a compliment or feedback for your tutor...'
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
                                  {isAr ? 'إلغاء' : isHe ? 'ביטול' : 'Cancel'}
                                </button>
                                <button
                                  type="button"
                                  disabled={submitTeacherSurveyMutation.isPending}
                                  onClick={() => {
                                    if (!teacherOverallRating || teacherOverallRating < 1) {
                                      setTeacherRatingError(
                                        isAr
                                          ? 'يرجى اختيار التقييم الإجمالي للمعلم (1-5 نجوم) بالضغط على النجوم أعلاه قبل الإرسال.'
                                          : isHe
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
                                      ? isAr ? 'جاري الإرسال...' : isHe ? 'שולח...' : 'Submitting...'
                                      : isAr ? 'إرسال تقييم المعلم' : isHe ? 'שלח דירוג מורה' : 'Submit Teacher Rating'}
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
                    {isAr
                      ? 'لم تكتمل أي حصص بعد. احجز أول حصة لك لتبدأ الآن!'
                      : isHe
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
                    <span>{isAr ? 'بوابة الدروس المسجلة' : isHe ? 'מאגר שיעורים מוקלטים' : 'Recorded Sessions Portal'}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {isAr ? 'مشاهدة دروسك المسجلة' : isHe ? 'צפייה בשיעורי הווידאו שלך' : 'Watch Your Recorded Lessons'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                    {isAr ? 'شاهد تسجيلات الدروس التي يرفعها المعلمون المعتمدون مباشرة داخل المنصة.' : isHe ? 'כל שיעורי הווידאו שהועלו על ידי המורים שלך מ-Google Drive, מסודרים לפי נושא או לפי מספר שיעור.' : 'Stream recorded lessons uploaded by your certified teachers directly inside Engrew.'}
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
                    {isAr ? 'حسب الموضوع' : isHe ? 'לפי נושא' : 'By Topic'}
                  </button>
                  <button
                    onClick={() => setRecordingGroupMode('number')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      recordingGroupMode === 'number'
                        ? 'bg-white dark:bg-slate-900 text-brand-teal-800 dark:text-brand-teal-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {isAr ? 'حسب رقم الحصة' : isHe ? 'לפי מספר שיעור' : 'By Session #'}
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
                              title={isAr ? 'فتح في شاشة كاملة' : isHe ? 'פתח במסך מלא' : 'Open in Full Screen'}
                            >
                              <Maximize2 className="w-3.5 h-3.5 text-cyan-300" />
                              <span>{isAr ? 'شاشة كاملة' : isHe ? 'מסך מלא' : 'Full Screen'}</span>
                            </button>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                            <PlayCircle className="w-12 h-12 text-slate-600" />
                            <p className="text-xs font-semibold">
                              {isAr ? 'الفيديو غير متوفر' : isHe ? 'סרטון השיעור אינו זמין' : 'Video not available'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Video Information Header */}
                      <div className="space-y-4 pt-2">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="px-3 py-1 rounded-xl bg-brand-teal-800 text-white font-black text-xs shadow-xs tracking-wide">
                              {isAr ? `حصة #${activeRecording.sessionNumber}` : isHe ? `שיעור #${activeRecording.sessionNumber}` : `Session #${activeRecording.sessionNumber}`}
                            </span>
                            <span className="px-3 py-1 rounded-xl bg-brand-olive-100 dark:bg-brand-olive-950/90 text-brand-olive-950 dark:text-brand-olive-200 border border-brand-olive-300 dark:border-brand-olive-700 font-extrabold text-xs shadow-2xs">
                              {activeRecording.category || 'General'}
                            </span>
                            {activeRecording.durationMinutes && (
                              <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                <Clock className="w-3.5 h-3.5 text-brand-teal-700 dark:text-brand-teal-400" />
                                {activeRecording.durationMinutes} {isAr ? 'دقيقة' : isHe ? 'דקות' : 'min'}
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
                                <span>{isAr ? 'شاشة كاملة' : isHe ? 'מסך מלא' : 'Full Screen'}</span>
                              </button>
                              <a
                                href={activeRecording.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-black text-brand-teal-800 dark:text-brand-teal-300 hover:text-brand-teal-950 dark:hover:text-white px-3 py-1.5 rounded-xl bg-brand-teal-50 dark:bg-brand-teal-950/70 border border-brand-teal-200/80 dark:border-brand-teal-800 transition-colors shadow-2xs"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>{isAr ? 'رابط Google Drive' : isHe ? 'Google Drive' : 'Drive Link'}</span>
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
                            {isAr ? 'المعلم المعتمد:' : isHe ? 'מורה מוסמך:' : 'Certified Teacher:'}{' '}
                            <strong className="text-slate-900 dark:text-white font-extrabold">
                              {activeRecording.teacher?.user?.firstName} {activeRecording.teacher?.user?.lastName}
                            </strong>
                          </span>
                          <span className="font-semibold text-slate-600 dark:text-slate-300">
                            {new Date(activeRecording.createdAt).toLocaleDateString(isAr ? 'ar-EG' : isHe ? 'he-IL' : 'en-US')}
                          </span>
                        </div>

                        {/* Lesson Takeaways / Notes */}
                        {activeRecording.description && (
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
                            <span className="text-xs font-black text-slate-900 dark:text-white block uppercase tracking-wider">
                              {isAr ? 'أبرز محاور الحصة وملاحظات المعلم:' : isHe ? 'דגשים וסיכום השיעור:' : 'Session Highlights & Teacher Notes:'}
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
                                <span>{isAr ? 'الدرس السابق' : isHe ? 'השיעור הקודם' : 'Previous Lesson'}</span>
                              </button>
                              <button
                                disabled={!nextSession}
                                onClick={() => nextSession && setSelectedSessionId(nextSession.id)}
                                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-teal-800 text-white hover:bg-brand-teal-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shadow-2xs"
                              >
                                <span>{isAr ? 'الدرس القادم' : isHe ? 'השיעור הבא' : 'Next Lesson'}</span>
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
                        {isAr ? 'لا توجد دروس مسجلة متاحة حالياً' : isHe ? 'אין שיעורים מוקלטים כרגע' : 'No Recorded Sessions Available'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        {isAr ? 'سيقوم معلمك برفع تسجيلات الفيديو عبر Google Drive لتتمكن من مشاهدتها هنا.' : isHe ? 'המורה שלך יעלה לכאן שיעורים מוקלטים מ-Google Drive.' : 'Your teacher will add Google Drive video recordings here for you to watch.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* RIGHT SIDE (4 COLS): CATEGORIZED LESSONS SIDEBAR */}
                <div className="lg:col-span-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-400" />
                      <span>{isAr ? 'منهاج ومحتوى الدروس' : isHe ? 'תוכן השיעורים' : 'Lesson Curriculum'}</span>
                    </h3>
                    <span className="text-[11px] font-bold text-brand-teal-800 dark:text-brand-teal-300 bg-brand-teal-50 dark:bg-brand-teal-950/60 px-2 py-0.5 rounded-full border border-brand-teal-200 dark:border-brand-teal-800">
                      {recordedSessions.length} {isAr ? 'الحصص' : isHe ? 'שיעורים' : 'Lessons'}
                    </span>
                  </div>

                  {/* Search Bar in Sidebar */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder={isAr ? 'البحث عن درس أو موضوع...' : isHe ? 'חיפוש שיעור או נושא...' : 'Search lessons...'}
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
                          {isAr ? 'لم يتم العثور على دروس مسجلة مطابقة.' : isHe ? 'לא נמצאו שיעורים תואמים.' : 'No matching recorded sessions found.'}
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
                                            {isAr && session.titleAr ? session.titleAr : isHe && session.titleHe ? session.titleHe : session.title}
                                          </p>
                                          <div className={`flex items-center gap-2 mt-1 text-[11px] font-semibold ${isSelected ? 'text-brand-teal-100' : 'text-slate-600 dark:text-slate-300'}`}>
                                            <span>{isAr ? `${session.durationMinutes} دقيقة` : isHe ? `${session.durationMinutes} דק׳` : `${session.durationMinutes}m`}</span>
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
                                    {isAr && session.titleAr ? session.titleAr : isHe && session.titleHe ? session.titleHe : session.title}
                                  </p>
                                  <div className={`flex items-center gap-2 mt-1 text-[11px] font-semibold ${isSelected ? 'text-brand-teal-100' : 'text-slate-600 dark:text-slate-300'}`}>
                                    <span>{session.category}</span>
                                    <span>•</span>
                                    <span>{isAr ? `${session.durationMinutes} دقيقة` : isHe ? `${session.durationMinutes} דק׳` : `${session.durationMinutes}m`}</span>
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
                    {isAr ? 'الواجبات المسندة وملاحظات المعلم' : isHe ? 'שיעורי בית שהוקצו ומשוב המורה' : 'Assigned Homework & Teacher Feedback'}
                  </h2>
                </div>
                <span className="text-xs font-bold text-brand-teal-800 dark:text-brand-teal-300 bg-brand-teal-50 dark:bg-brand-teal-950/70 px-2.5 py-1 rounded-full border border-brand-teal-200 dark:border-brand-teal-800">
                  {recentHomework.length}{' '}
                  {isAr ? 'إجمالي الواجبات' : isHe ? 'משימות בסך הכל' : 'Total Assignments'}
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
                          {isAr
                            ? hw.status === 'GRADED'
                              ? 'تم التصحيح'
                              : hw.status === 'SUBMITTED'
                              ? 'تم التسليم'
                              : 'مُعين'
                            : isHe
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
                                ? (isAr ? 'ملف PDF من Google Drive' : isHe ? 'קובץ חומר PDF מ-Google Drive' : 'Google Drive PDF Material')
                                : (isAr ? 'المادة التعليمية المرفقة' : isHe ? 'חומר לימודי מצורף' : 'Attached Learning Material')}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setViewerUrl(hw.attachmentUrl);
                              setViewerTitle(hw.title);
                              setViewerSubtitle(isAr ? 'المواد المساعدة لحل الواجب' : isHe ? 'חומרי עזר לשיעורי בית' : 'Homework Learning Resource');
                            }}
                            className="px-3 py-1.5 text-xs font-bold bg-brand-teal-800 hover:bg-brand-teal-900 text-white rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-brand-olive-300" />
                            <span>{isAr ? 'مشاهدة في المنصة' : isHe ? 'פתח במערכת' : 'View In-App'}</span>
                          </button>
                        </div>
                      )}

                      {hw.dueDate && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-brand-teal-600" />
                          <span>
                            {isAr ? 'تاريخ التسليم:' : isHe ? 'מועד הגשה:' : 'Due date:'}{' '}
                            {new Date(hw.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {hw.studentNote && (
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700 text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {isAr ? 'إجابتك المسلمة:' : isHe ? 'התשובה שהגשת:' : 'Your Submission:'}
                          </span>{' '}
                          <span className="text-slate-600 dark:text-slate-400">
                            {hw.studentNote}
                          </span>
                        </div>
                      )}

                      {hw.teacherFeedback && (
                        <div className="p-3 bg-brand-teal-50/60 dark:bg-brand-teal-950/60 rounded-xl border border-brand-teal-200/80 dark:border-brand-teal-800 text-xs text-brand-teal-950 dark:text-brand-teal-200">
                          <strong>{isAr ? 'ملاحظات المعلم:' : isHe ? 'משוב המורה:' : 'Teacher Feedback:'}</strong>{' '}
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
                                  isAr
                                    ? 'اكتب إجابتك أو تلخيصك أو الصق رابط الحل هنا...'
                                    : isHe
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
                                  {isAr ? 'إلغاء' : isHe ? 'ביטול' : 'Cancel'}
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
                                  {isAr ? 'تسليم الواجب المنزلي' : isHe ? 'הגש שיעורי בית' : 'Turn In Homework'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSubmittingHwId(hw.id)}
                              className="px-4 py-2 bg-brand-teal-800 dark:bg-brand-teal-700 hover:bg-brand-teal-900 text-white font-bold text-xs rounded-xl shadow-2xs"
                            >
                              {isAr ? 'تسليم الواجب ←' : isHe ? 'הגש שיעורי בית ←' : 'Submit Homework →'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-8 text-center">
                  {isAr ? 'لا توجد واجبات معلقة حالياً.' : isHe ? 'אין שיעורי בית ממתינים כעת.' : 'No homework assignments currently.'}
                </p>
              )}
            </div>
          )}

          {/* TAB 5: HEBREW GAMES */}
          {activeTab === 'games' && (
            <div className="space-y-6">
              <PageHeaderBanner
                badgeIcon={Gamepad2}
                badgeText={isAr ? 'ألعاب تعليمية واختبارات تفاعلية' : isHe ? 'משחקי לימוד וחידונים' : 'Interactive Hebrew Learning Games'}
                statusText={isAr ? 'نشط' : isHe ? 'פעיל' : 'Active'}
                title={t('games.title')}
                description={t('games.subtitle')}
                action={
                  <span className="text-xs font-bold px-3.5 py-1.5 bg-white/15 backdrop-blur-md text-white rounded-full border border-white/20">
                    {isAr ? 'مخصص لمستواك التعليمي:' : isHe ? 'מותאם לרמתך:' : 'Filtered for your level:'}{' '}
                    {isAr ? (LEVEL_AR_MAP[student?.level || 'BEGINNER'] || t(`levels.${student?.level || 'BEGINNER'}`)) : t(`levels.${student?.level || 'BEGINNER'}`)}
                  </span>
                }
              />

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">

              {/* Active Game Modal / Container */}
              {activeGame ? (
                <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-brand-teal-100 dark:border-slate-700 mb-8">
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => setActiveGame(null)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      <span>{isAr ? 'إغلاق اللعبة' : isHe ? 'סגור משחק' : 'Close Game'}</span>
                    </button>
                  </div>

                  {activeGame.gameType === 'FLASHCARD' && (
                    <FlashcardGame
                      gameId={activeGame.id}
                      title={isAr && activeGame.titleAr ? activeGame.titleAr : isHe ? activeGame.titleHe : activeGame.title}
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
                      title={isAr && activeGame.titleAr ? activeGame.titleAr : isHe ? activeGame.titleHe : activeGame.title}
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
                      title={isAr && activeGame.titleAr ? activeGame.titleAr : isHe ? activeGame.titleHe : activeGame.title}
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
                      {isAr ? 'تصفية المستوى:' : isHe ? 'סינון רמה:' : 'Level Filter:'}
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
                          ? isAr ? 'جميع المستويات' : isHe ? 'כל הרמות' : 'All Levels'
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

                      const gameTitle = isAr && GAME_AR_MAP[game.title]?.title ? GAME_AR_MAP[game.title].title : isAr && game.titleAr ? game.titleAr : isHe && game.titleHe ? game.titleHe : game.title;
                      const gameDesc = isAr && GAME_AR_MAP[game.title]?.desc ? GAME_AR_MAP[game.title].desc : isAr && game.descriptionAr ? game.descriptionAr : isHe && game.descriptionHe ? game.descriptionHe : game.description;
                      const gameTypeLabel = isAr ? GAME_TYPE_LABELS[game.gameType]?.ar || game.gameType : isHe ? GAME_TYPE_LABELS[game.gameType]?.he || game.gameType : GAME_TYPE_LABELS[game.gameType]?.en || game.gameType;

                      return (
                        <div
                          key={game.id}
                          className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 hover:border-brand-teal-300 dark:hover:border-brand-teal-500 hover:shadow-xs transition-all flex flex-col justify-between h-full"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 bg-brand-teal-50 dark:bg-brand-teal-950/70 text-brand-teal-800 dark:text-brand-teal-300 rounded-md border border-brand-teal-100 dark:border-brand-teal-800">
                                  {gameTypeLabel}
                                </span>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${levelColor}`}>
                                  {isAr ? (LEVEL_AR_MAP[game.level || 'BEGINNER'] || t(`levels.${game.level || 'BEGINNER'}`)) : t(`levels.${game.level || 'BEGINNER'}`)}
                                </span>
                              </div>
                              <span className="text-xs font-bold text-brand-olive-700 dark:text-brand-olive-300 bg-brand-olive-50 dark:bg-brand-olive-950/60 px-2 py-0.5 rounded-md border border-brand-olive-200 dark:border-brand-olive-800">
                                +{game.pointsReward} {isAr ? 'نقطة' : isHe ? 'נק׳' : 'pts'}
                              </span>
                            </div>

                            {/* Lesson Link or Teacher Customization Badge */}
                            {game.lesson ? (
                              <div className="px-3 py-1.5 rounded-xl bg-brand-teal-50 dark:bg-brand-teal-950/50 border border-brand-teal-200/60 dark:border-brand-teal-800 text-[11px] text-brand-teal-900 dark:text-brand-teal-300 font-semibold flex items-center gap-1.5">
                                <Video className="w-3.5 h-3.5 text-brand-teal-600 dark:text-brand-teal-400 shrink-0" />
                                <span>
                                  {isAr
                                    ? `تدريب مباشر مرتبط بدرسك (${game.lesson.durationMinutes || 25} دقيقة)`
                                    : isHe
                                    ? `תרגול ישיר לשיעור שלך (${game.lesson.durationMinutes || 25} דק׳)`
                                    : `Practice linked to your lesson (${game.lesson.durationMinutes || 25} min)`}
                                </span>
                              </div>
                            ) : game.createdBy ? (
                              <div className="px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
                                {isAr
                                  ? `مخصص بواسطة المعلم: ${game.createdBy.firstName}`
                                  : isHe
                                  ? `הותאם ע״י מורה: ${game.createdBy.firstName}`
                                  : `Customized by: Teacher ${game.createdBy.firstName}`}
                              </div>
                            ) : null}

                            <div>
                              <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
                                {gameTitle}
                              </h3>
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                {gameDesc}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => setActiveGame(game)}
                            className="mt-6 w-full py-3 bg-brand-teal-800 hover:bg-brand-teal-900 dark:bg-brand-teal-700 dark:hover:bg-brand-teal-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                          >
                              <Gamepad2 className="w-4 h-4 text-brand-olive-300" />
                              <span>{isAr ? 'ابدأ اللعب' : isHe ? 'התחל לשחק' : 'Start Playing'}</span>
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
            </div>
          )}

          {/* TAB 6: LEADERBOARD & SEASONAL LEAGUES */}
          {activeTab === 'leaderboard' && (() => {
            const availableLevels = levelsFromApi.length > 0 ? levelsFromApi : DEFAULT_LEVEL_TABS;
            const isViewingMyLevel = activeLeaderboardLevel === studentLevelFromDashboard;
            const currentLevelObj = availableLevels.find((l: any) => l.code === activeLeaderboardLevel);
            const myRankIndex = leaderboardData.findIndex((entry: any) => entry.studentId === student?.id);
            const myRankNumber = myRankIndex >= 0 ? myRankIndex + 1 : null;
            const myRankEntry = myRankIndex >= 0 ? leaderboardData[myRankIndex] : null;

            return (
              <div className="space-y-6 animate-fade-in">
                {/* Header Banner & Period Switcher */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-800 dark:text-amber-300 mb-2">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isAr ? 'دوريات اللغة العبرية الموسمية حسب المستويات' : isHe ? 'ליגות עברית עונתיות לפי רמות לימוד' : 'Level-Based Leagues & Seasonal Rankings'}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      {isAr ? 'لوحة الصدارة والترتيب حسب المستوى' : isHe ? 'לוח מובילים ודירוג לפי רמה' : 'Level-Based Leaderboard & Rankings'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                      {isAr ? 'يتنافس كل مستوى تعليمي في دوري مستقل خاص به. نافس زملاءك في نفس المستوى واكسب نقاط XP لتتصدر الترتيب!' : isHe ? 'כל רמה מתחרה בדירוג נפרד ועצמאי. התחרה עם עמיתיך לרמה, צבור נקודות משיעורים וממשחקים, וטפס לראש הליגה!' : 'Each proficiency level competes in its own dedicated league. Compete with peers in your level and earn XP to climb the ranks!'}
                    </p>
                  </div>

                  {/* Season Toggle Pills */}
                  <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700 shrink-0">
                    <button
                      type="button"
                      onClick={() => setLeaderboardPeriod('weekly')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        leaderboardPeriod === 'weekly'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {isAr ? 'دوري هذا الأسبوع' : isHe ? 'ליגה שבועית' : 'This Week'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setLeaderboardPeriod('monthly')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        leaderboardPeriod === 'monthly'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {isAr ? 'دوري هذا الشهر' : isHe ? 'ליגה חודשית' : 'This Month'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setLeaderboardPeriod('all_time')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        leaderboardPeriod === 'all_time'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {isAr ? 'كل الأوقات' : isHe ? 'היכל התהילה' : 'All-Time'}
                    </button>
                  </div>
                </div>

                {/* Level Tabs Selection */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {isAr ? 'اختر المستوى لعرض لوحة الصدارة:' : isHe ? 'בחר רמת לימוד לתצוגת דירוג:' : 'Select Proficiency Level League:'}
                    </span>
                    <span className="text-xs font-bold text-brand-teal-600 dark:text-brand-teal-400">
                      {isAr
                        ? `مستواك الحالي: ${t(`levels.${studentLevelFromDashboard}`)}`
                        : isHe
                        ? `רמתך: ${t(`levels.${studentLevelFromDashboard}`)}`
                        : `Your Enrolled Level: ${t(`levels.${studentLevelFromDashboard}`)}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {availableLevels.map((lvl: any) => {
                      const isSelected = activeLeaderboardLevel === lvl.code;
                      const isMyLevel = studentLevelFromDashboard === lvl.code;
                      const label = isAr ? (LEVEL_AR_MAP[lvl.code] || lvl.labelAr || t(`levels.${lvl.code}`)) : isHe && lvl.labelHe ? lvl.labelHe : (lvl.labelEn || t(`levels.${lvl.code}`));

                      return (
                        <button
                          key={lvl.code}
                          type="button"
                          onClick={() => setSelectedLeaderboardLevel(lvl.code)}
                          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border cursor-pointer ${
                            isSelected
                              ? 'bg-brand-teal-800 text-white border-brand-teal-700 shadow-sm ring-2 ring-brand-teal-500/20'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <span>{label}</span>
                          {isMyLevel && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black tracking-wide ${
                              isSelected
                                ? 'bg-brand-olive-400 text-slate-950'
                                : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            }`}>
                              {isAr ? 'مستواك الحالي' : isHe ? 'הרמה שלך' : 'My Level'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Level Context & Current Standing Summary Banner */}
                  <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isViewingMyLevel
                      ? 'bg-teal-50/70 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/80 text-teal-950 dark:text-teal-100 shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-2xs'
                  }`}>
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                        isViewingMyLevel
                          ? 'bg-brand-teal-800 text-brand-olive-300'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-extrabold truncate">
                          {isViewingMyLevel ? (
                            isAr ? (
                              <>
                                أنت تنافس في دوري <span className="underline decoration-brand-teal-500 underline-offset-4">{LEVEL_AR_MAP[activeLeaderboardLevel] || currentLevelObj?.labelAr || t(`levels.${activeLeaderboardLevel}`)}</span>
                                {myRankNumber
                                  ? ` • ترتيبك: المركز #${myRankNumber} من بين ${leaderboardData.length} طلاب (${myRankEntry?.totalPoints || 0} نقطة XP)`
                                  : ` • لا توجد نقاط مسجلة لهذه الفترة بعد (${student?.totalPoints || 0} إجمالي نقاط XP)`}
                              </>
                            ) : isHe ? (
                              <>
                                אתה מתחרה בליגת <span className="underline decoration-brand-teal-500 underline-offset-4">{currentLevelObj?.labelHe || t(`levels.${activeLeaderboardLevel}`)}</span>
                                {myRankNumber
                                  ? ` • דירוגך: מקום #${myRankNumber} מתוך ${leaderboardData.length} תלמידים (${myRankEntry?.totalPoints || 0} XP)`
                                  : ` • אין עדיין נקודות בתקופה זו (${student?.totalPoints || 0} XP בסה״כ)`}
                              </>
                            ) : (
                              <>
                                You are competing in <span className="underline decoration-brand-teal-500 underline-offset-4">{currentLevelObj?.labelEn || t(`levels.${activeLeaderboardLevel}`)}</span>
                                {myRankNumber
                                  ? ` • Your Rank: #${myRankNumber} of ${leaderboardData.length} students (${myRankEntry?.totalPoints || 0} XP)`
                                  : ` • No points recorded in this period yet (${student?.totalPoints || 0} lifetime XP)`}
                              </>
                            )
                          ) : (
                            isAr ? (
                              <>
                                عرض ترتيب <span className="font-black text-slate-900 dark:text-white">{LEVEL_AR_MAP[activeLeaderboardLevel] || currentLevelObj?.labelAr || t(`levels.${activeLeaderboardLevel}`)}</span> ({leaderboardData.length} طلاب مصنفون)
                              </>
                            ) : isHe ? (
                              <>
                                מוצג לוח המובילים של <span className="font-black text-slate-900 dark:text-white">{currentLevelObj?.labelHe || t(`levels.${activeLeaderboardLevel}`)}</span> ({leaderboardData.length} תלמידים בדירוג)
                              </>
                            ) : (
                              <>
                                Viewing standings for <span className="font-black text-slate-900 dark:text-white">{currentLevelObj?.labelEn || t(`levels.${activeLeaderboardLevel}`)}</span> ({leaderboardData.length} students ranked)
                              </>
                            )
                          )}
                        </p>
                        <p className="text-[11px] opacity-80 mt-0.5">
                          {isAr ? 'يتم ترتيب الطلاب فقط مقابل أقرانهم في نفس المستوى التعليمي.' : isHe ? 'הדירוג מחושב אך ורק מול תלמידים מאותה הרמה ולא מול כלל התלמידים באקדמיה.' : 'Students are ranked exclusively against peers within the same level, not against the entire academy.'}
                        </p>
                      </div>
                    </div>

                    {!isViewingMyLevel && (
                      <button
                        type="button"
                        onClick={() => setSelectedLeaderboardLevel(studentLevelFromDashboard)}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-teal-800 hover:bg-brand-teal-700 text-white text-xs font-bold transition shrink-0 cursor-pointer shadow-xs active:scale-95"
                      >
                        <Award className="w-3.5 h-3.5 text-brand-olive-300" />
                        <span>{isAr ? 'العودة لمستواي' : isHe ? 'חזור לרמה שלי' : 'View My Level'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Top 3 Podium Cards */}
                {leaderboardData.length > 0 ? (
                  <div className={`grid grid-cols-1 ${
                    leaderboardData.length === 1
                      ? 'sm:grid-cols-1 max-w-sm mx-auto'
                      : leaderboardData.length === 2
                      ? 'sm:grid-cols-2 max-w-2xl mx-auto'
                      : 'sm:grid-cols-3'
                  } gap-4`}>
                    {/* #2 Silver (if 2+ students) */}
                    {leaderboardData[1] && (
                      <div className="order-2 sm:order-1 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center text-center shadow-xs">
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[11px] mb-2">
                          <Medal className="w-3.5 h-3.5 text-slate-400" />
                          <span>{isAr ? '#2 المركز الفضي' : isHe ? '#2 כסף' : '#2 Silver'}</span>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-400 to-slate-600 text-white font-black text-base flex items-center justify-center shadow-md ring-4 ring-slate-300 dark:ring-slate-700 mb-2 shrink-0">
                          {leaderboardData[1].name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '2'}
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-full">
                          {leaderboardData[1].name}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 mt-1">
                          {isAr ? (LEVEL_AR_MAP[leaderboardData[1].level] || leaderboardData[1].levelLabelAr || t(`levels.${leaderboardData[1].level || 'BEGINNER'}`)) : isHe && leaderboardData[1].levelLabelHe
                            ? leaderboardData[1].levelLabelHe
                            : (leaderboardData[1].levelLabelEn || t(`levels.${leaderboardData[1].level || 'BEGINNER'}`))}
                        </span>
                        <p className="mt-3 text-base font-extrabold text-slate-700 dark:text-slate-300">
                          {leaderboardData[1].totalPoints.toLocaleString()} <span className="text-xs font-normal">XP</span>
                        </p>
                      </div>
                    )}

                    {/* #1 Gold - Elevated */}
                    {leaderboardData[0] && (
                      <div className="order-1 sm:order-2 p-6 rounded-3xl bg-gradient-to-b from-amber-500/10 to-transparent dark:from-amber-950/30 dark:to-slate-900 border border-amber-300 dark:border-amber-700/60 flex flex-col items-center text-center shadow-md sm:-mt-2 relative">
                        <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          <span>{isAr ? 'متصدر المستوى' : isHe ? 'מוביל הרמה' : 'Level Leader'}</span>
                        </div>
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-extrabold text-[11px] mb-2 mt-1">
                          <Trophy className="w-3.5 h-3.5 text-amber-500" />
                          <span>{isAr ? '#1 المركز الذهبي' : isHe ? '#1 זהב' : '#1 Gold'}</span>
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black text-lg flex items-center justify-center shadow-lg ring-4 ring-amber-300 dark:ring-amber-500/60 mb-2 shrink-0">
                          {leaderboardData[0].name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '1'}
                        </div>
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white truncate max-w-full">
                          {leaderboardData[0].name}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300/60 mt-1">
                          {isAr ? (LEVEL_AR_MAP[leaderboardData[0].level] || leaderboardData[0].levelLabelAr || t(`levels.${leaderboardData[0].level || 'BEGINNER'}`)) : isHe && leaderboardData[0].levelLabelHe
                            ? leaderboardData[0].levelLabelHe
                            : (leaderboardData[0].levelLabelEn || t(`levels.${leaderboardData[0].level || 'BEGINNER'}`))}
                        </span>
                        <p className="mt-3 text-xl font-black text-amber-600 dark:text-amber-400">
                          {leaderboardData[0].totalPoints.toLocaleString()} <span className="text-xs font-normal">XP</span>
                        </p>
                      </div>
                    )}

                    {/* #3 Bronze (if 3+ students) */}
                    {leaderboardData[2] && (
                      <div className="order-3 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center text-center shadow-xs">
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-900/10 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-extrabold text-[11px] mb-2">
                          <Award className="w-3.5 h-3.5 text-amber-700" />
                          <span>{isAr ? '#3 المركز البرونزي' : isHe ? '#3 ארד' : '#3 Bronze'}</span>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-700 to-amber-900 text-white font-black text-base flex items-center justify-center shadow-md ring-4 ring-amber-700/40 mb-2 shrink-0">
                          {leaderboardData[2].name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '3'}
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-full">
                          {leaderboardData[2].name}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 mt-1">
                          {isAr ? (LEVEL_AR_MAP[leaderboardData[2].level] || leaderboardData[2].levelLabelAr || t(`levels.${leaderboardData[2].level || 'BEGINNER'}`)) : isHe && leaderboardData[2].levelLabelHe
                            ? leaderboardData[2].levelLabelHe
                            : (leaderboardData[2].levelLabelEn || t(`levels.${leaderboardData[2].level || 'BEGINNER'}`))}
                        </span>
                        <p className="mt-3 text-base font-extrabold text-amber-800 dark:text-amber-600">
                          {leaderboardData[2].totalPoints.toLocaleString()} <span className="text-xs font-normal">XP</span>
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto mb-3">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {isAr ? 'لا يوجد طلاب مصنفون في هذا المستوى لهذه الفترة بعد' : isHe ? 'אין עדיין תלמידים בדירוג לרמה זו בתקופה הנבחרת' : 'No students ranked in this level for this period yet'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      {isAr
                        ? 'العب ألعاب التدريب، وحل الاختبارات القصيرة، واحضر الحصص لكسب نقاط XP وتصدر الدوري!'
                        : isHe
                        ? 'שחק במשחקי התרגול, פתור חידונים ובצע שיעורים כדי לצבור XP ולהיות הראשון בדירוג!'
                        : 'Play practice games, complete quizzes, and attend live sessions to earn XP and take the top spot!'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setLeaderboardPeriod('all_time')}
                      className="mt-4 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
                    >
                      {isAr ? 'عرض الترتيب العام' : isHe ? 'צפה בכל הזמנים' : 'View All-Time Standings'}
                    </button>
                  </div>
                )}

                {/* Full Standings Table */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-brand-teal-600 dark:text-brand-teal-400" />
                      <span>
                        {isAr
                          ? `جدول تصنيف: ${currentLevelObj?.labelAr || currentLevelObj?.labelHe || t(`levels.${activeLeaderboardLevel}`)}`
                          : isHe
                          ? `טבלת דירוג: ${currentLevelObj?.labelHe || t(`levels.${activeLeaderboardLevel}`)}`
                          : `${currentLevelObj?.labelEn || t(`levels.${activeLeaderboardLevel}`)} League Standings`}
                      </span>
                    </h3>
                    <span className="text-xs text-slate-400">
                      {leaderboardData.length} {isAr ? 'طلاب في التصنيف' : isHe ? 'תלמידים בדירוג' : 'students ranked'}
                    </span>
                  </div>

                  {leaderboardData.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">
                      {isAr ? 'لا توجد بيانات تصنيف للعرض حالياً.' : isHe ? 'אין נתוני דירוג להצגה.' : 'No leaderboard records found.'}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-start text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 font-bold uppercase">
                            <th className="pb-3 text-start w-20">{isAr ? 'الترتيب' : isHe ? 'דירוג' : 'Rank'}</th>
                            <th className="pb-3 text-start">{isAr ? 'طالب' : isHe ? 'תלמיד' : 'Student'}</th>
                            <th className="pb-3 text-start">{isAr ? 'شارات الإنجاز' : isHe ? 'תגי הישג' : 'Badges'}</th>
                            <th className="pb-3 text-start">{isAr ? 'المستوى' : isHe ? 'רמה' : 'Level'}</th>
                            <th className="pb-3 text-start">{isAr ? 'سلسلة الالتزام' : isHe ? 'רצף' : 'Streak'}</th>
                            <th className="pb-3 text-end">{isAr ? 'النقاط' : isHe ? 'נקודות' : 'Points'}</th>
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
                                  {isTop1 ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-xs font-black">
                                      <Trophy className="w-3 h-3 text-amber-500" /> #1
                                    </span>
                                  ) : isTop2 ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-black">
                                      <Medal className="w-3 h-3 text-slate-400" /> #2
                                    </span>
                                  ) : isTop3 ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-900/10 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-800/40 text-xs font-black">
                                      <Award className="w-3 h-3 text-amber-700" /> #3
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 dark:text-slate-400 font-bold">#{idx + 1}</span>
                                  )}
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
                                            {isAr ? 'أنت' : isHe ? 'אתה' : 'You'}
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
                                          className="text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold"
                                          title={isAr && b.titleAr ? b.titleAr : isHe ? b.titleHe || b.title : b.title}
                                        >
                                          {isAr && b.titleAr ? b.titleAr : isHe ? b.titleHe || b.title : b.title}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-[10px] text-slate-400">—</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    {isAr ? (LEVEL_AR_MAP[entry.level] || entry.levelLabelAr || t(`levels.${entry.level || 'BEGINNER'}`)) : isHe && entry.levelLabelHe
                                      ? entry.levelLabelHe
                                      : (entry.levelLabelEn || t(`levels.${entry.level || 'BEGINNER'}`))}
                                  </span>
                                </td>
                                <td className="py-3 text-slate-600 dark:text-slate-400 font-medium">
                                  {entry.streakDays > 0 ? (
                                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                                      <span>{isAr ? `${entry.streakDays} يوم` : isHe ? `${entry.streakDays} ימים` : `${entry.streakDays}d`}</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 dark:text-slate-600">—</span>
                                  )}
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
                  )}
                </div>
              </div>
            );
          })()}

          {/* TAB 8: SESSION PACKAGES & BALANCES */}
          {activeTab === 'balance' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <PageHeaderBanner
                badgeIcon={Layers}
                badgeText={isAr ? 'باقات الحصص والتوافر' : isHe ? 'חבילות ומכסת שיעורים' : 'Session Packages & Availability'}
                statusText="Active Packages"
                title={isAr ? 'باقات الحصص والأرصدة المتاحة' : isHe ? 'חבילות שיעורים ומכסת מפגשים' : 'My Session Packages & Availability'}
                description={
                  isAr ? 'توفر باقات الدروس حصصاً لمدد 25 و40 و55 دقيقة صالحة حتى 30 يوماً. الإلغاء في الوقت المحدد يعيد الحصة تلقائياً لرصيدك.' : isHe ? 'כל חבילת לימוד כוללת מספר מוגדר של שיעורים (25, 40 או 55 דקות) בתוקף של עד 30 יום. בהזמנת שיעור מנוכה שיעור 1, ובביטול בזמן הוא מוחזר מידית לחבילה.' : 'Your lesson packages provide session quotas for 25m, 40m, and 55m sessions valid for up to 30 days. Timely cancellations instantly credit the session back.'
                }
                action={
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDuration(25);
                      setIsBookingModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    <span>{isAr ? 'حجز حصة من الباقة' : isHe ? 'הזמן שיעור מהחבילה' : 'Book a Session'}</span>
                  </button>
                }
              />

              {/* 4 Session Quota Cards: Total, 25m, 40m, 55m */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {/* Total Available Card */}
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-brand-teal-950/20 via-brand-teal-900/10 to-transparent border border-brand-teal-500/30 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {isAr ? 'إجمالي الحصص المتاحة' : isHe ? 'סך שיעורים זמינים' : 'Total Sessions Available'}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-brand-teal-500/20 text-brand-teal-700 dark:text-brand-teal-300 flex items-center justify-center">
                      <Layers className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl sm:text-4xl font-black text-brand-teal-900 dark:text-brand-teal-200 tracking-tight">
                      {totalAvailableSessions}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        {isAr ? 'صلاحية 30 يوماً' : isHe ? 'תוקף 30 יום' : '30-Day Quotas'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 25-Min Quota */}
                <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {isAr ? 'حصص 25 دقيقة' : isHe ? 'מפגשי 25 דקות' : '25-Min Sessions'}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      {sessionBalances.find((s: any) => s.sessionType?.durationMinutes === 25)?.balance || 0}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {isAr ? 'حصص مركزة ومكثفة' : isHe ? 'שיעורים קצרים וממוקדים' : 'High-retention sessions'}
                    </p>
                  </div>
                </div>

                {/* 40-Min Quota */}
                <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {isAr ? 'حصص 40 دقيقة' : isHe ? 'מפגשי 40 דקות' : '40-Min Sessions'}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      {sessionBalances.find((s: any) => s.sessionType?.durationMinutes === 40)?.balance || 0}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {isAr ? 'حصص تعمق وتدريب متقدم' : isHe ? 'שיעורי העמקה ותרגול' : 'In-depth practice sessions'}
                    </p>
                  </div>
                </div>

                {/* 55-Min Quota */}
                <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {isAr ? 'حصص 55 دقيقة' : isHe ? 'מפגשי 55 דקות' : '55-Min Sessions'}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      {sessionBalances.find((s: any) => s.sessionType?.durationMinutes === 55)?.balance || 0}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {isAr ? 'شامل وتفاعلي' : isHe ? 'שיעור מלא ומקיף' : 'Comprehensive immersive'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Engrew Package Policy */}
              <div className="p-4 sm:p-5 rounded-3xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-brand-teal-100 dark:bg-brand-teal-950/80 text-brand-teal-800 dark:text-brand-teal-300 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white">
                      {isAr ? 'حصص الباقة المحددة' : isHe ? 'חבילות שיעורים מוגדרות' : 'Package Quotas'}
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {isAr ? 'تتحول عمليات الشراء مباشرة إلى رصيد حصص محدد حسب مدة الدرس.' : isHe ? 'התשלום מומר מידית למכסת שיעורים מדויקת לפי משך המפגש.' : 'Purchases directly activate a quota of lesson sessions.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 shrink-0">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white">
                      {isAr ? 'استرجاع الحصة تلقائياً 100%' : isHe ? 'החזר שיעור אוטומטי' : '100% Session Return'}
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {isAr ? 'الإلغاء المبكر يعيد الحصة إلى رصيد باقتك فوراً.' : isHe ? 'ביטול שיעור מראש מחזיר את המפגש למכסת החבילה מידית.' : 'Early cancellations restore your session unit to your package immediately.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white">
                      {isAr ? 'صلاحية 30 يوماً مضمونة' : isHe ? 'תוקף 30 יום מובטח' : '30-Day Validity'}
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {isAr ? 'باقات الحصص صالحة لمدة 30 يوماً من تاريخ التفعيل.' : isHe ? 'חבילות השיעורים תקפות ל-30 יום ומאפשרות תכנון למידה רציף.' : 'Packages are valid for 30 days from activation date.'}
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
                        <span>{isAr ? 'عرض خاص' : isHe ? 'הטבה מיוחדת' : 'Special Offer'}</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        {isAr ? 'تطبيق كود خصم أو قسيمة' : isHe ? 'מימוש קוד קופון או שובר הנחה' : 'Redeem Coupon Code or Voucher'}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 max-w-xl">
                        {isAr ? 'أدخل كود خصم سارٍ للحصول على توفير فوري على باقات الحصص والحجوزات.' : isHe ? 'הזן קוד קופון רשמי כדי לקבל הנחה מיידית על חבילות שיעורים ורכישות (למשל: HEBREW20 או SHALOM50).' : 'Enter a valid coupon code to unlock instant savings on lesson packages and bookings (e.g., HEBREW20 or SHALOM50).'}
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
                        placeholder={isAr ? 'كود الخصم (مثال: HEBREW20)' : isHe ? 'קוד קופון (למשל HEBREW20)' : 'Coupon code (e.g. HEBREW20)'}
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
                      <span>{isAr ? 'تطبيق الكوبون' : isHe ? 'הפעל קופון' : 'Apply Code'}</span>
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
                              ? `${appliedCoupon.discountValue}% ${isAr ? 'خصم' : isHe ? 'הנחה' : 'OFF'}`
                              : `$${appliedCoupon.discountValue} ${isAr ? 'خصم' : isHe ? 'הנחה' : 'OFF'}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                          {isAr && appliedCoupon.descriptionAr
                            ? appliedCoupon.descriptionAr
                            : isHe
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
                      {isAr ? 'إزالة' : isHe ? 'הסר' : 'Remove'}
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
                      {isAr ? `الكل (${studentTransactions.length})` : isHe ? `הכל (${studentTransactions.length})` : `All (${studentTransactions.length})`}
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
                      {isAr ? 'حجوزات الدروس' : isHe ? 'הזמנת שיעורים' : 'Bookings'}
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
                      {isAr ? 'عمليات الشحن' : isHe ? 'הפקדות וטעינות' : 'Top-ups'}
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
                      {isAr ? 'الاستردادات' : isHe ? 'זיכויים' : 'Refunds'}
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative min-w-[200px] sm:min-w-[240px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-3" />
                    <input
                      type="text"
                      placeholder={isAr ? 'البحث في المعاملات أو الحصص أو المبالغ...' : isHe ? 'חיפוש עסקאות, שיעור או סכום...' : 'Search transactions...'}
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
                    if (transactionTypeFilter === 'DEPOSITS' && tx.type !== 'PACKAGE_ACTIVATION' && (tx.type !== 'ADMIN_ADJUSTMENT' || Number(tx.amount) <= 0)) return false;
                    if (transactionTypeFilter === 'REFUNDS' && tx.type !== 'SESSION_REFUND') return false;

                    if (!transactionSearchQuery) return true;
                    const q = transactionSearchQuery.toLowerCase();
                    const desc = (tx.description || '').toLowerCase();
                    const type = (tx.type || '').toLowerCase();
                    const rcp = (tx.receiptNumber || '').toLowerCase();
                    const amt = String(tx.amount);
                    return desc.includes(q) || type.includes(q) || amt.includes(q) || rcp.includes(q);
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="py-12 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                          <Receipt className="w-6 h-6" />
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                          {isAr ? 'لا توجد معاملات للعرض' : isHe ? 'אין עסקאות להצגה' : 'No transactions found'}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                          {isAr ? 'يتم تتبع وتوثيق كل عملية شحن أو خصم لحصة أو استرداد بالتفصيل هنا.' : isHe ? 'כל טעינה, חיוב על שיעור או החזר כספי יתועדו כאן בצורה מפורטת.' : 'Every top-up, lesson booking deduction, and refund will be tracked here.'}
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
                              <th className="py-3.5 px-4 text-start">{isAr ? 'النوع' : isHe ? 'סוג פעולה' : 'Type'}</th>
                              <th className="py-3.5 px-4 text-start">{isAr ? 'تغيير الرصيد' : isHe ? 'שינוי מכסה' : 'Quota Change'}</th>
                              <th className="py-3.5 px-4 text-start">{isAr ? 'الرصيد بعد الحركة' : isHe ? 'יתרה לאחר פעולה' : 'Quota After'}</th>
                              <th className="py-3.5 px-4 text-start">{isAr ? 'الوصف والملاحظات' : isHe ? 'תיאור ופרטים' : 'Description / Note'}</th>
                              <th className="py-3.5 px-4 text-start">{isAr ? 'التاريخ والوقت' : isHe ? 'תאריך ושעה' : 'Date & Time'}</th>
                              <th className="py-3.5 px-4 text-center">{isAr ? 'الحالة' : isHe ? 'סטטוס' : 'Status'}</th>
                              <th className="py-3.5 px-4 text-center">{isAr ? 'إيصال / PDF' : isHe ? 'קבלה / הדפסה' : 'Receipt / PDF'}</th>
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
                                          ? (isAr ? 'حجز حصة' : isHe ? 'הזמנת שיעור' : 'Lesson Booking')
                                          : isRefund
                                          ? (isAr ? 'تم استرجاع الحصة' : isHe ? 'החזר שיעור לחבילה' : 'Session Restored')
                                          : (amt > 0 ? (isAr ? 'تفعيل باقة' : isHe ? 'הפעלת חבילה' : 'Package Activation') : (isAr ? 'تحديث الرصيد' : isHe ? 'עדכון מכסה' : 'Quota Update'))}
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
                                      {isPositive ? `+${Math.abs(amt)}` : `-${Math.abs(amt)}`} {isAr ? 'حصص' : isHe ? 'שיעורים' : 'units'}
                                    </span>
                                  </td>

                                  {/* Balance After */}
                                  <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                                    {Number(tx.balanceAfter || 0)} {isAr ? 'حصص' : isHe ? 'שיעורים' : 'units'}
                                  </td>

                                  {/* Description */}
                                  <td className="py-3.5 px-4 max-w-xs text-slate-600 dark:text-slate-300">
                                    <div className="line-clamp-2 leading-relaxed">
                                      {tx.description || (isAr ? 'تحديث رصيد الباقة' : isHe ? 'עדכון מכסת שיעורים' : 'Package session update')}
                                    </div>
                                  </td>

                                  {/* Date & Time */}
                                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                                    {formatIsraelDateTime(tx.createdAt, {
                                      includeDate: true,
                                      locale: isAr ? 'ar-EG' : isHe ? 'he-IL' : 'en-US',
                                    })}
                                  </td>

                                  {/* Status */}
                                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>{isAr ? 'مكتمل' : isHe ? 'הושלם' : 'Completed'}</span>
                                    </span>
                                  </td>

                                  {/* Receipt / Print Action */}
                                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenReceipt(tx)}
                                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-brand-teal-50 dark:bg-slate-800 dark:hover:bg-brand-teal-950/70 border border-slate-200 dark:border-slate-700 hover:border-brand-teal-300 dark:hover:border-brand-teal-700 text-slate-700 hover:text-brand-teal-800 dark:text-slate-300 dark:hover:text-brand-teal-300 font-extrabold text-xs transition-all inline-flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
                                      title={isAr ? 'طباعة الإيصال الرسمي وسند المعاملة' : isHe ? 'הדפס קבלה ואישור עסקה' : 'Print Official Receipt & Voucher'}
                                    >
                                      <Printer className="w-3.5 h-3.5 text-brand-teal-700 dark:text-brand-teal-400" />
                                      <span>{isAr ? 'إيصال' : isHe ? 'קבלה' : 'Receipt'}</span>
                                    </button>
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
                                        ? (isAr ? 'حجز حصة' : isHe ? 'הזמנת שיעור' : 'Lesson Booking')
                                        : isRefund
                                        ? (isAr ? 'تم استرجاع الحصة' : isHe ? 'החזר שיעור לחבילה' : 'Session Restored')
                                        : (amt > 0 ? (isAr ? 'تفعيل باقة' : isHe ? 'הפעלת חבילה' : 'Package Activation') : (isAr ? 'تحديث الرصيد' : isHe ? 'עדכון מכסה' : 'Quota Update'))}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                      {formatIsraelDateTime(tx.createdAt, {
                                        includeDate: true,
                                        locale: isAr ? 'ar-EG' : isHe ? 'he-IL' : 'en-US',
                                      })}
                                    </div>
                                  </div>
                                </div>

                                <div className={`font-black text-sm ${
                                  isPositive
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                }`}>
                                  {isPositive ? `+${Math.abs(amt)}` : `-${Math.abs(amt)}`} {isAr ? 'حصص' : isHe ? 'שיעורים' : 'units'}
                                </div>
                              </div>

                              {tx.description && (
                                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                                  {tx.description}
                                </p>
                              )}

                              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60 dark:border-slate-800">
                                <div>
                                  <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium block">
                                    {isAr ? 'الرصيد بعد الحركة:' : isHe ? 'מכסה לאחר פעולה:' : 'Quota after:'}
                                  </span>
                                  <span className="font-extrabold text-slate-900 dark:text-white">
                                    {Number(tx.balanceAfter || 0)} {isAr ? 'حصص' : isHe ? 'שיעורים' : 'units'}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenReceipt(tx)}
                                  className="px-3 py-1.5 rounded-xl bg-brand-teal-50 hover:bg-brand-teal-100 dark:bg-brand-teal-950/70 dark:hover:bg-brand-teal-900 text-brand-teal-800 dark:text-brand-teal-300 font-extrabold text-xs flex items-center gap-1.5 border border-brand-teal-200 dark:border-brand-teal-800 shadow-2xs active:scale-95 cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5 text-brand-teal-700 dark:text-brand-teal-300" />
                                  <span>{isAr ? 'طباعة الإيصال' : isHe ? 'הדפס קבלה' : 'Print Receipt'}</span>
                                </button>
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

      {/* MULTI-DURATION LESSON BOOKING MODAL (SMART STEPPED BOOKING ENGINE) */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <StudentBookingFlow
              studentId={dashboard?.student?.id || user?.id}
              sessionBalances={sessionBalances}
              packageAllowance={dashboard?.student?.packageAllowance}
              teachersData={teachersData || []}
              language={language}
              isModal={true}
              onClose={() => setIsBookingModalOpen(false)}
            />
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

      {/* Session Packages & Level Progression Exams Modal */}
      <StudentExamsAndWalletModal
        isOpen={isExamsAndPackagesModalOpen}
        onClose={() => setIsExamsAndPackagesModalOpen(false)}
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
                  {isAr ? 'أدوات ومصادر تعليمية إضافية' : isHe ? 'פעולות ותכנים נוספים' : 'More Learning Tools'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isAr ? 'الدروس المسجلة، الواجبات، لوحة الصدارة والباقات' : isHe ? 'שיעורים מוקלטים, שיעורי בית, לוח דירוג וחבילות' : 'Recorded sessions, homework, rankings & packages'}
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
                    {isAr ? 'الدروس المسجلة' : isHe ? 'שיעורים מוקלטים' : 'Recorded Sessions'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr ? 'إعادة مشاهدة الدروس عبر Drive' : isHe ? 'צפייה חוזרת בשיעורים' : 'Google Drive replays'}
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
                      {pendingHomeworkCount} {isAr ? 'قيد المراجعة' : isHe ? 'לבדיקה' : 'pending'}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                    {isAr ? 'الواجبات والمهام' : isHe ? 'שיעורי בית' : 'Homework & Tasks'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr ? 'التسليمات والملاحظات' : isHe ? 'הגשות ומשוב מורים' : 'Submissions & feedback'}
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
                    {isAr ? 'لوحة المتصدرين' : isHe ? 'לוח דירוג' : 'Leaderboard'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr ? 'نقاط XP والترتيب' : isHe ? 'ליגות ונקודות XP' : 'XP Points & Ranking'}
                  </p>
                </div>
              </button>

              {/* Card 4: Session Packages & Quotas */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('balance');
                  setIsMobileMoreOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`p-3.5 rounded-2xl text-start transition-all flex flex-col justify-between space-y-2 active:scale-95 bg-slate-50/90 hover:bg-slate-100/90 dark:bg-slate-800/60 dark:hover:bg-slate-800/90 border shadow-xs ${
                  activeTab === 'balance'
                    ? 'border-brand-teal-500 dark:border-brand-teal-400 ring-2 ring-brand-teal-500/20 dark:ring-brand-teal-400/20'
                    : totalAvailableSessions <= 0
                    ? 'border-amber-400 ring-2 ring-amber-400/20'
                    : 'border-slate-200/90 dark:border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-brand-teal-50 dark:bg-brand-teal-950/60 text-brand-teal-700 dark:text-brand-teal-300 border border-brand-teal-200/60 dark:border-brand-teal-800/40">
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-teal-100 dark:bg-brand-teal-950/70 text-brand-teal-900 dark:text-brand-teal-200 border border-brand-teal-300/70 dark:border-brand-teal-700/50">
                    {totalAvailableSessions} {isAr ? 'حصص' : isHe ? 'שיעורים' : 'units'}
                  </span>
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                    {isAr ? 'باقات الحصص والرصيد' : isHe ? 'חבילות ומכסת שיעורים' : 'Session Packages & Quotas'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr ? 'رصيد الحصص، الباقات والصلاحية' : isHe ? 'מכסות מפגשים, חבילות ותוקף' : 'Session units, packages & validity'}
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
                      {isAr ? 'مسار تقدمي التعليمي' : isHe ? 'ההתקדמות הלימודית שלי' : 'My Learning Progress'}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {isAr ? 'سجل الحضور الأسبوعي، دقة الألعاب ومسار المستويات' : isHe ? 'גרפי נוכחות שבועית, דיוק במשחקים ומפת רמות' : 'Weekly attendance, game accuracy & level roadmap'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-3 py-1.5 rounded-full bg-brand-teal-800 hover:bg-brand-teal-900 dark:bg-teal-500/20 text-white dark:text-teal-200 border border-brand-teal-800 dark:border-teal-400/40 shrink-0">
                  {isAr ? 'عرض' : isHe ? 'צפה במדדים' : 'View'}
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

      {/* Official Receipt & Voucher PDF Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        data={selectedReceiptData}
        language={language}
      />
    </div>
  );
};

export default StudentDashboard;
