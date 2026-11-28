import React, { useState, useEffect, useRef, useMemo, useCallback, useTransition } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { levelExamsApi, homeworkTemplatesApi } from '../../lib/enterpriseApi';
import { LevelExamModel } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useSidebarStore } from '../../store/sidebarStore';
import { toast } from '../../store/toastStore';
import {
  formatSlotRange12Hour,
  formatIsraelDateTime,
  getSlotDurationMinutes,
  ISRAEL_TZ_LABEL,
} from '../../lib/timeUtils';
import { FlashcardGame } from '../../components/games/FlashcardGame';
import { QuizGame } from '../../components/games/QuizGame';
import { MatchingGame } from '../../components/games/MatchingGame';
import { DriveViewerModal } from '../../components/common/DriveViewerModal';
import { StructuredNotesEditorModal } from '../../components/lessons/StructuredNotesEditorModal';
import { GlassSidebar } from '../../components/common/GlassSidebar';
import { AvatarWithFrame } from '../../components/common/AvatarWithFrame';
import { StyledNickname } from '../../components/common/StyledNickname';
import { DashboardSkeleton } from '../../components/common/DashboardSkeleton';
import { TeacherShareModal } from '../../components/teacher/TeacherShareModal';
import { TeachersCalendarTab } from '../../components/admin/TeachersCalendarTab';
import { PageHeaderBanner } from '../../components/common/PageHeaderBanner';
import { usePermissions } from '../../hooks/usePermissions';
import { haptics } from '../../utils/haptics';
import { getGoogleCalendarUrl, downloadIcsFile } from '../../utils/calendarSync';
import { isGoogleDriveUrl, detectAttachmentType } from '../../lib/driveUtils';
import {
  Calendar,
  Calendar as CalendarIcon,
  CalendarRange,
  CalendarDays,
  Download,
  Clock,
  CheckCircle,
  Video,
  Plus,
  Trash2,
  Users,
  BookOpen,
  Star,
  ExternalLink,
  Globe2,
  X,
  Menu,
  GraduationCap,
  Gamepad2,
  Edit3,
  Layers,
  Sparkles,
  Filter,
  Check,
  AlertCircle,
  Eye,
  FileText,
  PlayCircle,
  FolderOpen,
  ArrowRight,
  Award,
  Search,
  LayoutGrid,
  Gift,
  Sliders,
  Share2,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Copy,
  ShieldAlert,
} from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export type SessionDuration = 25 | 40 | 55;

// Standard 25-minute availability slots covering 08:00 to 22:00
const AVAILABILITY_SLOTS_25 = [
  { start: '08:00', end: '08:25' },
  { start: '08:30', end: '08:55' },
  { start: '09:00', end: '09:25' },
  { start: '09:30', end: '09:55' },
  { start: '10:00', end: '10:25' },
  { start: '10:30', end: '10:55' },
  { start: '11:00', end: '11:25' },
  { start: '11:30', end: '11:55' },
  { start: '12:00', end: '12:25' },
  { start: '12:30', end: '12:55' },
  { start: '13:00', end: '13:25' },
  { start: '13:30', end: '13:55' },
  { start: '14:00', end: '14:25' },
  { start: '14:30', end: '14:55' },
  { start: '15:00', end: '15:25' },
  { start: '15:30', end: '15:55' },
  { start: '16:00', end: '16:25' },
  { start: '16:30', end: '16:55' },
  { start: '17:00', end: '17:25' },
  { start: '17:30', end: '17:55' },
  { start: '18:00', end: '18:25' },
  { start: '18:30', end: '18:55' },
  { start: '19:00', end: '19:25' },
  { start: '19:30', end: '19:55' },
  { start: '20:00', end: '20:25' },
  { start: '20:30', end: '20:55' },
  { start: '21:00', end: '21:25' },
  { start: '21:30', end: '21:55' },
];

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

export const TeacherDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const { t, language } = useTranslation();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { isCollapsed } = useSidebarStore();
  const { can } = usePermissions();
  const [, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<'calendar' | 'calendar_monitor' | 'lessons' | 'students' | 'homework' | 'recordings' | 'games'>(() => {
    const searchTab = new URLSearchParams(window.location.search).get('tab');
    if (searchTab && ['calendar', 'calendar_monitor', 'lessons', 'students', 'homework', 'recordings', 'games'].includes(searchTab)) {
      return searchTab as any;
    }
    return 'calendar';
  });

  const handleTabChange = useCallback((tabId: any) => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      window.history.replaceState({}, '', url.toString());
    }
    startTransition(() => {
      setActiveTab(tabId);
    });
    setMobileMenuOpen(false);
    setIsMobileMoreOpen(false);
  }, []);

  const handleTabHover = useCallback((tabId: string) => {
    if (tabId === 'students') {
      queryClient.prefetchQuery({
        queryKey: ['teacherStudents', user?.id],
        queryFn: async () => {
          const res = await api.get(`/teachers/${user?.id}/students`);
          return res.data.students;
        },
        staleTime: 3 * 60 * 1000,
      });
    } else if (tabId === 'homework') {
      queryClient.prefetchQuery({
        queryKey: ['teacherHomework', user?.id],
        queryFn: async () => {
          const res = await api.get('/homework');
          return res.data.homework;
        },
        staleTime: 2 * 60 * 1000,
      });
    } else if (tabId === 'recordings') {
      queryClient.prefetchQuery({
        queryKey: ['teacherRecordedSessions', user?.id],
        queryFn: async () => {
          const res = await api.get('/recorded-sessions');
          return res.data.sessions;
        },
        staleTime: 5 * 60 * 1000,
      });
    } else if (tabId === 'games') {
      queryClient.prefetchQuery({
        queryKey: ['teacherGames'],
        queryFn: async () => {
          const res = await api.get('/games');
          return res.data.games;
        },
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [queryClient, user?.id]);

  useEffect(() => {
    const handleNavEvent = (e: any) => {
      if (e.detail?.tab && ['calendar', 'calendar_monitor', 'lessons', 'students', 'homework', 'recordings', 'games'].includes(e.detail.tab)) {
        handleTabChange(e.detail.tab);
      }
    };
    window.addEventListener('engrew:navigate-tab', handleNavEvent);
    return () => window.removeEventListener('engrew:navigate-tab', handleNavEvent);
  }, [handleTabChange]);

  useEffect(() => {
    const searchTab = new URLSearchParams(location.search).get('tab');
    if (searchTab && ['calendar', 'calendar_monitor', 'lessons', 'students', 'homework', 'recordings', 'games'].includes(searchTab)) {
      startTransition(() => {
        setActiveTab(searchTab as any);
      });
    }
  }, [location.search]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [calendarSubMode, setCalendarSubMode] = useState<'manage' | 'monitor'>('manage');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedDay, setSelectedDay] = useState<number>(() => new Date().getDay());

  // Mandatory Slot Zoom Link Configuration Modal
  const [isConfiguringSlot, setIsConfiguringSlot] = useState(false);
  const [selectedSlotBlock, setSelectedSlotBlock] = useState<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotLabel: string;
    formattedDate: string;
  } | null>(null);
  const [slotZoomLink, setSlotZoomLink] = useState('');
  const [saveZoomAsDefault, setSaveZoomAsDefault] = useState(true);
  const [permanentZoomLink, setPermanentZoomLink] = useState('');
  const zoomInputRef = useRef<HTMLInputElement>(null);
  const [structuredNotesLesson, setStructuredNotesLesson] = useState<any | null>(null);

  // Modern Calendar Slot Filtering & Batch Actions
  const [timePeriodFilter, setTimePeriodFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');
  const [isCopyScheduleModalOpen, setIsCopyScheduleModalOpen] = useState(false);
  const [targetCopyDays, setTargetCopyDays] = useState<number[]>([]);

  // Time period classification helpers
  const isMorningSlot = (startTime: string) => startTime >= '08:00' && startTime < '12:00';
  const isAfternoonSlot = (startTime: string) => startTime >= '12:00' && startTime < '17:00';
  const isEveningSlot = (startTime: string) => startTime >= '17:00' && startTime <= '22:00';

  // Helper to compute dates of current week (Sunday to Saturday) based on selectedDate
  const getWeekDates = (baseDateStr: string) => {
    const base = new Date(baseDateStr + 'T00:00:00');
    const day = base.getDay();
    const sunday = new Date(base);
    sunday.setDate(base.getDate() - day);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  };

  const handleDateChange = (newDateStr: string) => {
    setSelectedDate(newDateStr);
    const day = new Date(newDateStr + 'T00:00:00').getDay();
    setSelectedDay(day);
  };

  const handleDaySelect = (dayIndex: number) => {
    setSelectedDay(dayIndex);
    const currentWeek = getWeekDates(selectedDate);
    setSelectedDate(currentWeek[dayIndex]);
  };

  const shiftWeek = (weeks: number) => {
    const base = new Date(selectedDate + 'T00:00:00');
    base.setDate(base.getDate() + weeks * 7);
    handleDateChange(base.toISOString().split('T')[0]);
  };

  // Check if a specific slot time on a given date is in the past
  const isSlotInPast = (dateStr: string, startTime: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateStr < todayStr) return true;
    if (dateStr === todayStr) {
      const now = new Date();
      const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      return startTime <= nowTime;
    }
    return false;
  };

  const isDateInPast = (dateStr: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    return dateStr < todayStr;
  };
  const [recordingLessonId, setRecordingLessonId] = useState<string | null>(null);
  const [recordingUrl, setRecordingUrl] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');

  // Homework creation state
  const [isAssigningHw, setIsAssigningHw] = useState(false);
  const [hwStudentId, setHwStudentId] = useState('');
  const [hwTitle, setHwTitle] = useState('');
  const [hwDesc, setHwDesc] = useState('');
  const [hwAttachmentUrl, setHwAttachmentUrl] = useState('');
  const [hwDueDate, setHwDueDate] = useState('');

  // Homework review state
  const [reviewHwId, setReviewHwId] = useState<string | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState('');

  // Interactive Homework Catalog & Assigning State
  const [hwViewMode, setHwViewMode] = useState<'catalog' | 'submissions'>('catalog');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogLevel, setCatalogLevel] = useState('ALL');
  const [catalogTrack, setCatalogTrack] = useState('ALL');
  const [assignModalTemplate, setAssignModalTemplate] = useState<any | null>(null);
  const [assignStudentSearch, setAssignStudentSearch] = useState('');
  const [assignSelectedStudentId, setAssignSelectedStudentId] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [assignCustomNotes, setAssignCustomNotes] = useState('');
  const [inspectHwSubmission, setInspectHwSubmission] = useState<any | null>(null);
  const [previewTemplateTeacher, setPreviewTemplateTeacher] = useState<any | null>(null);

  // Drive viewer modal state
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState<string>('');
  const [viewerSubtitle, setViewerSubtitle] = useState<string>('');

  // Student progress details modal state
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any | null>(null);

  // Open Level Exam modal state
  const [examModalStudent, setExamModalStudent] = useState<any | null>(null);
  const [openingExamId, setOpeningExamId] = useState<string | null>(null);

  const { data: levelExams = [], isLoading: isLevelExamsLoading } = useQuery<LevelExamModel[]>({
    queryKey: ['level-exams'],
    queryFn: levelExamsApi.list,
    enabled: Boolean(examModalStudent),
  });

  const openLevelExamMutation = useMutation({
    mutationFn: ({ examId, studentId }: { examId: string; studentId: string }) =>
      levelExamsApi.openForStudent(examId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['level-exams'] });
      haptics.success();
      toast.success(
        language === 'ar'
          ? 'تم فتح امتحان المستوى للطالب بنجاح!'
          : language === 'he'
          ? 'מבחן המעבר נפתח לתלמיד בהצלחה!'
          : 'Level exam unlocked for student!'
      );
      setOpeningExamId(null);
      setExamModalStudent(null);
    },
    onError: (err: any) => {
      setOpeningExamId(null);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        (language === 'ar'
          ? 'تعذر فتح الامتحان للطالب.'
          : language === 'he'
          ? 'פתיחת המבחן נכשלה.'
          : 'Failed to open level exam for student.');
      toast.error(msg);
    },
  });

  // Recorded Sessions state
  const [isCreatingRecording, setIsCreatingRecording] = useState(false);
  const [recStudentId, setRecStudentId] = useState('');
  const [recTitle, setRecTitle] = useState('');
  const [recTitleHe, setRecTitleHe] = useState('');
  const [recCategory, setRecCategory] = useState('Grammar / דקדוק');
  const [recSessionNumber, setRecSessionNumber] = useState(1);
  const [recVideoUrl, setRecVideoUrl] = useState('');
  const [recDesc, setRecDesc] = useState('');
  const [recDuration, setRecDuration] = useState(25);

  // Custom Games Manager state
  const [gameFilterLevel, setGameFilterLevel] = useState<string>('ALL');
  const [gameFilterType, setGameFilterType] = useState<string>('ALL');
  const [isCustomizingGame, setIsCustomizingGame] = useState(false);
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [deletingGameId, setDeletingGameId] = useState<string | null>(null);
  const [previewGame, setPreviewGame] = useState<any | null>(null);

  const [gameType, setGameType] = useState<'FLASHCARD' | 'MATCHING' | 'QUIZ'>('FLASHCARD');
  const [gameLevel, setGameLevel] = useState<'BEGINNER' | 'ELEMENTARY' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
  const [gameLessonId, setGameLessonId] = useState<string>('');
  const [gameTitle, setGameTitle] = useState('');
  const [gameTitleHe, setGameTitleHe] = useState('');
  const [gameDesc, setGameDesc] = useState('');
  const [gamePoints, setGamePoints] = useState(20);

  // Content builders state
  const [flashcards, setFlashcards] = useState<Array<{ front: string; back: string; example?: string }>>([
    { front: 'שָׁלוֹם', back: 'Hello / Peace', example: 'שלום, מה נשמע?' },
    { front: 'תּוֹדָה', back: 'Thank you', example: 'תודה רבה על העזרה' },
    { front: 'בּוֹקֶר טוֹב', back: 'Good morning', example: 'בוקר טוב לכולם' },
  ]);

  const [matchingPairs, setMatchingPairs] = useState<Array<{ hebrew: string; english: string }>>([
    { hebrew: 'אֶחָד (Echad)', english: 'One' },
    { hebrew: 'שְׁנַיִם (Shnayim)', english: 'Two' },
    { hebrew: 'שָׁלוֹשׁ (Shalosh)', english: 'Three' },
    { hebrew: 'כָּחוֹל (Kachol)', english: 'Blue' },
  ]);

  const [quizQuestions, setQuizQuestions] = useState<Array<{
    question: string;
    questionHe: string;
    options: string[];
    correctIndex: number;
  }>>([
    {
      question: 'What is the correct greeting for "Good evening" in Hebrew?',
      questionHe: 'איך אומרים "ערב טוב" בעברית?',
      options: ['בוקר טוב (Boker Tov)', 'ערב טוב (Erev Tov)', 'לילה טוב (Layla Tov)', 'שלום (Shalom)'],
      correctIndex: 1,
    },
    {
      question: 'Which word means "Water" in Hebrew?',
      questionHe: 'איזו מילה פירושה "מים"?',
      options: ['לחם (Lechem)', 'מים (Mayim)', 'תפוח (Tapuach)', 'בית (Bayit)'],
      correctIndex: 1,
    },
  ]);

  // 1. Fetch Teacher Calendar & Lessons
  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['teacherCalendar', user?.id],
    queryFn: async () => {
      const res = await api.get(`/teachers/${user?.id}/calendar`);
      return res.data;
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (calendarData?.defaultZoomLink) {
      setPermanentZoomLink(calendarData.defaultZoomLink);
      localStorage.setItem('engrew_teacher_zoom_link', calendarData.defaultZoomLink);
    } else {
      const saved = localStorage.getItem('engrew_teacher_zoom_link');
      if (saved) setPermanentZoomLink(saved);
    }
  }, [calendarData?.defaultZoomLink]);

  // 2. Fetch Teacher Students
  const { data: studentsData } = useQuery({
    queryKey: ['teacherStudents', user?.id],
    queryFn: async () => {
      const res = await api.get(`/teachers/${user?.id}/students`);
      return res.data.students;
    },
    enabled: !!user?.id,
    staleTime: 3 * 60 * 1000,
  });

  // 3. Fetch Homework for this Teacher
  const { data: homeworkData } = useQuery({
    queryKey: ['teacherHomework', user?.id],
    queryFn: async () => {
      const res = await api.get('/homework');
      return res.data.homework;
    },
    staleTime: 2 * 60 * 1000,
  });

  // 4. Fetch Recorded Sessions for this Teacher
  const { data: recordedSessionsData } = useQuery({
    queryKey: ['teacherRecordedSessions', user?.id],
    queryFn: async () => {
      const res = await api.get('/recorded-sessions');
      return res.data.sessions;
    },
    staleTime: 5 * 60 * 1000,
  });

  const createRecordedSessionMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/recorded-sessions', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherRecordedSessions'] });
      setIsCreatingRecording(false);
      setRecTitle('');
      setRecTitleHe('');
      setRecVideoUrl('');
      setRecDesc('');
      toast.success(
        language === 'he' ? 'השיעור המוקלט נוסף בהצלחה לתלמידים!' : 'Recorded session added successfully!'
      );
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.error ||
          (language === 'he' ? 'שגיאה בהוספת שיעור מוקלט' : 'Failed to add recorded session')
      );
    },
  });

  const deleteRecordedSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/recorded-sessions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherRecordedSessions'] });
      toast.info(language === 'he' ? 'השיעור המוקלט הוסר.' : 'Recorded session removed.');
    },
  });

  // Complete lesson mutation with Optimistic Update
  const completeLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      return api.post(`/lessons/${lessonId}/complete`);
    },
    onMutate: async (lessonId: string) => {
      await queryClient.cancelQueries({ queryKey: ['teacherCalendar', user?.id] });
      const previousCalendar = queryClient.getQueryData(['teacherCalendar', user?.id]);
      queryClient.setQueryData(['teacherCalendar', user?.id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          lessons: (old.lessons || []).map((l: any) =>
            l.id === lessonId ? { ...l, status: 'COMPLETED' } : l
          ),
        };
      });
      return { previousCalendar };
    },
    onError: (_err: any, _vars: any, context: any) => {
      if (context?.previousCalendar) {
        queryClient.setQueryData(['teacherCalendar', user?.id], context.previousCalendar);
      }
      toast.error(
        language === 'he' ? 'שגיאה בסימון שיעור כהושלם' : 'Failed to mark lesson completed'
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherCalendar'] });
    },
    onSuccess: () => {
      toast.success(
        language === 'he' ? 'השיעור סומן כהושלם בהצלחה (+50 נקודות לתלמיד)!' : 'Lesson marked as completed (+50 pts)!'
      );
    },
  });

  // Save recording URL and notes
  const saveRecordingMutation = useMutation({
    mutationFn: async ({ id, url, notes }: { id: string; url: string; notes?: string }) => {
      await api.patch(`/lessons/${id}`, {
        recordingUrl: url,
        teacherNotes: notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherCalendar'] });
      setRecordingLessonId(null);
      setRecordingUrl('');
      setSessionNotes('');
      toast.success(
        language === 'he' ? 'קישור ההקלטה וסיכום השיעור נשמרו בהצלחה!' : 'Recording link and lesson notes saved!'
      );
    },
  });

  // Add slot mutation with Optimistic Update (<16ms feedback)
  const addSlotMutation = useMutation({
    mutationFn: async (data: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      durationMinutes?: number;
      zoomLink: string;
      saveAsDefault?: boolean;
    }) => {
      return api.post(`/teachers/${user?.id}/slots`, data);
    },
    onMutate: async (newSlotData) => {
      await queryClient.cancelQueries({ queryKey: ['teacherCalendar', user?.id] });
      const previousCalendar = queryClient.getQueryData(['teacherCalendar', user?.id]);
      const optimisticSlot = {
        id: `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        teacherId: user?.id,
        dayOfWeek: newSlotData.dayOfWeek,
        startTime: newSlotData.startTime,
        endTime: newSlotData.endTime,
        zoomLink: newSlotData.zoomLink,
        isBooked: false,
      };
      queryClient.setQueryData(['teacherCalendar', user?.id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          slots: [...(old.slots || []), optimisticSlot],
        };
      });
      return { previousCalendar };
    },
    onError: (err: any, _vars: any, context: any) => {
      if (context?.previousCalendar) {
        queryClient.setQueryData(['teacherCalendar', user?.id], context.previousCalendar);
      }
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          (language === 'he' ? 'שגיאה בפתיחת שעת הזמינות' : 'Failed to open availability slot')
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherCalendar'] });
    },
    onSuccess: (_, vars) => {
      setIsConfiguringSlot(false);
      setSelectedSlotBlock(null);
      const slotRange = formatSlotRange12Hour(vars.startTime, vars.endTime);
      toast.success(
        language === 'he'
          ? `שעת הזמינות (${slotRange}) נפתחה בהצלחה עם קישור הזום הקבוע שלך!`
          : `Availability slot (${slotRange}) opened with your permanent Zoom link!`
      );
    },
  });

  // Save permanent default Zoom meeting link mutation
  const saveDefaultZoomMutation = useMutation({
    mutationFn: async (link: string) => {
      return api.patch(`/teachers/${user?.id}/zoom-link`, { zoomLink: link });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherCalendar'] });
      localStorage.setItem('engrew_teacher_zoom_link', permanentZoomLink.trim());
      toast.success(
        language === 'he'
          ? 'קישור הזום הקבוע נשמר בהצלחה! כל השעות שיפתחו ישתמשו בקישור זה אוטומטית.'
          : 'Permanent Zoom link saved! All open availability slots will now use this link automatically.'
      );
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          (language === 'he' ? 'שגיאה בשמירת קישור הזום' : 'Failed to save Zoom link')
      );
    },
  });

  const handleOpenSlotModal = (block: { start: string; end: string }, slotLabel: string) => {
    if (isSlotInPast(selectedDate, block.start)) {
      toast.error(
        language === 'he'
          ? 'לא ניתן להוסיף שעת זמינות לתאריך או שעה שכבר עברו.'
          : 'Cannot open a slot for a past date or time.'
      );
      return;
    }

    const defaultZoom =
      permanentZoomLink.trim() ||
      calendarData?.defaultZoomLink ||
      localStorage.getItem('engrew_teacher_zoom_link') ||
      '';

    // 1-CLICK INSTANT OPEN: If teacher already has their Zoom link set once!
    if (defaultZoom && (defaultZoom.startsWith('http://') || defaultZoom.startsWith('https://'))) {
      addSlotMutation.mutate({
        dayOfWeek: selectedDay,
        startTime: block.start,
        endTime: block.end,
        zoomLink: defaultZoom,
        saveAsDefault: true,
      });
      return;
    }

    // Otherwise, guide the teacher to enter their Zoom link once in the field at the top
    toast.warning(
      language === 'he'
        ? 'נא להזין את קישור הזום הקבוע שלך למעלה פעם אחת בלבד.'
        : 'Please enter your permanent Zoom link above once before opening slots.'
    );
    if (zoomInputRef.current) {
      zoomInputRef.current.focus();
      zoomInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleConfirmSlot = () => {
    if (!selectedSlotBlock) return;
    const trimmedZoom = slotZoomLink.trim();
    if (!trimmedZoom) {
      toast.warning(
        language === 'he'
          ? 'חובה להזין קישור לפגישת זום לפני פתיחת השעה'
          : 'A Zoom meeting link is required before opening this slot'
      );
      return;
    }
    if (!trimmedZoom.startsWith('http://') && !trimmedZoom.startsWith('https://')) {
      toast.warning(
        language === 'he'
          ? 'קישור הזום חייב להתחיל ב-https:// או http://'
          : 'Zoom link must start with https:// or http://'
      );
      return;
    }

    if (saveZoomAsDefault) {
      localStorage.setItem('engrew_teacher_zoom_link', trimmedZoom);
    }

    addSlotMutation.mutate({
      dayOfWeek: selectedSlotBlock.dayOfWeek,
      startTime: selectedSlotBlock.startTime,
      endTime: selectedSlotBlock.endTime,
      zoomLink: trimmedZoom,
      saveAsDefault: saveZoomAsDefault,
    });
  };

  // Delete slot mutation with Optimistic Update (<16ms feedback)
  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId: string) => {
      return api.delete(`/teachers/${user?.id}/slots/${slotId}`);
    },
    onMutate: async (slotId: string) => {
      await queryClient.cancelQueries({ queryKey: ['teacherCalendar', user?.id] });
      const previousCalendar = queryClient.getQueryData(['teacherCalendar', user?.id]);
      queryClient.setQueryData(['teacherCalendar', user?.id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          slots: (old.slots || []).filter((s: any) => s.id !== slotId),
        };
      });
      return { previousCalendar };
    },
    onError: (_err: any, _vars: any, context: any) => {
      if (context?.previousCalendar) {
        queryClient.setQueryData(['teacherCalendar', user?.id], context.previousCalendar);
      }
      toast.error(language === 'he' ? 'שגיאה בהסרת שעת הזמינות' : 'Failed to remove slot');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherCalendar'] });
    },
    onSuccess: () => {
      toast.info(language === 'he' ? 'שעת הזמינות הוסרה.' : 'Availability slot removed.');
    },
  });

  // Batch Add Slots Mutation
  const addBatchSlotsMutation = useMutation({
    mutationFn: async (slotsList: Array<{ startTime: string; endTime?: string }>) => {
      const activeZoom = permanentZoomLink.trim() || calendarData?.defaultZoomLink || '';
      return api.post(`/teachers/${user?.id}/slots/batch`, {
        dayOfWeek: selectedDay,
        slots: slotsList,
        zoomLink: activeZoom,
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['teacherCalendar'] });
      toast.success(
        language === 'he'
          ? `נוספו ${res.data?.addedCount ?? ''} שעות זמינות בהצלחה!`
          : `Added ${res.data?.addedCount ?? ''} availability slots!`
      );
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message ||
          (language === 'he' ? 'שגיאה בהוספת שעות זמינות' : 'Failed to add batch slots')
      );
    },
  });

  // Clear Day Slots Mutation with Optimistic Update (<16ms feedback)
  const clearDaySlotsMutation = useMutation({
    mutationFn: async () => {
      return api.delete(`/teachers/${user?.id}/slots/day/${selectedDay}`);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['teacherCalendar', user?.id] });
      const previousCalendar = queryClient.getQueryData(['teacherCalendar', user?.id]);
      queryClient.setQueryData(['teacherCalendar', user?.id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          slots: (old.slots || []).filter((s: any) => s.dayOfWeek !== selectedDay || s.isBooked),
        };
      });
      return { previousCalendar };
    },
    onError: (_err: any, _vars: any, context: any) => {
      if (context?.previousCalendar) {
        queryClient.setQueryData(['teacherCalendar', user?.id], context.previousCalendar);
      }
      toast.error(language === 'he' ? 'שגיאה בניקוי שעות היום' : 'Failed to clear day slots');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherCalendar'] });
    },
    onSuccess: (res) => {
      toast.info(
        language === 'he'
          ? `הוסרו ${res.data?.deletedCount || 0} שעות זמינות לא מוזמנות מיום ${DAYS_HE[selectedDay]}.`
          : `Removed ${res.data?.deletedCount || 0} open slots for ${DAYS[selectedDay]}.`
      );
    },
  });

  // Copy Day Slots Mutation
  const copyDaySlotsMutation = useMutation({
    mutationFn: async (targetDays: number[]) => {
      return api.post(`/teachers/${user?.id}/slots/copy-day`, {
        sourceDayOfWeek: selectedDay,
        targetDaysOfWeek: targetDays,
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['teacherCalendar'] });
      setIsCopyScheduleModalOpen(false);
      setTargetCopyDays([]);
      toast.success(
        language === 'he'
          ? `לוח הזמנים הועתק בהצלחה (${res.data?.addedCount || 0} שעות נפתחו בימים הנבחרים)!`
          : `Schedule copied successfully (${res.data?.addedCount || 0} slots opened across target days)!`
      );
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message ||
          (language === 'he' ? 'שגיאה בהעתקת לוח הזמנים' : 'Failed to copy schedule')
      );
    },
  });

  const handleOpenPreset = (period: 'morning' | 'afternoon' | 'evening' | 'all') => {
    const activeZoom = permanentZoomLink.trim() || calendarData?.defaultZoomLink;
    if (!activeZoom) {
      toast.warning(
        language === 'he'
          ? 'נא להזין את קישור הזום הקבוע שלך למעלה פעם אחת בלבד.'
          : 'Please enter your permanent Zoom link above once before opening slots.'
      );
      zoomInputRef.current?.focus();
      zoomInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    let targetBlocks = AVAILABILITY_SLOTS_25;
    if (period === 'morning') targetBlocks = AVAILABILITY_SLOTS_25.filter((b) => isMorningSlot(b.start));
    else if (period === 'afternoon') targetBlocks = AVAILABILITY_SLOTS_25.filter((b) => isAfternoonSlot(b.start));
    else if (period === 'evening') targetBlocks = AVAILABILITY_SLOTS_25.filter((b) => isEveningSlot(b.start));

    const validBlocks = targetBlocks.filter((b) => !isSlotInPast(selectedDate, b.start));

    if (validBlocks.length === 0) {
      toast.warning(language === 'he' ? 'כל השעות במקטע זה כבר עברו.' : 'All slots in this period are in the past.');
      return;
    }

    addBatchSlotsMutation.mutate(
      validBlocks.map((b) => ({ startTime: b.start, endTime: b.end }))
    );
  };

  // Assign homework mutation
  const assignHomeworkMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/homework', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherHomework'] });
      setIsAssigningHw(false);
      setHwTitle('');
      setHwDesc('');
      setHwAttachmentUrl('');
      setHwDueDate('');
      toast.success(
        language === 'he' ? 'שיעורי הבית הוקצו בהצלחה לתלמיד!' : 'Homework assigned successfully!'
      );
    },
  });

  // Query: Teacher Homework Catalog from Admin Bank
  const { data: teacherCatalog = [], isLoading: isTeacherCatalogLoading } = useQuery({
    queryKey: ['teacherHomeworkCatalog', catalogLevel, catalogTrack, catalogSearch],
    queryFn: () =>
      homeworkTemplatesApi.catalog({
        level: catalogLevel !== 'ALL' ? catalogLevel : undefined,
        track: catalogTrack !== 'ALL' ? catalogTrack : undefined,
        search: catalogSearch || undefined,
      }),
  });

  // Assign template mutation
  const assignTemplateMutation = useMutation({
    mutationFn: (data: { templateId: string; studentId: string; dueDate?: string; customNotes?: string }) =>
      homeworkTemplatesApi.assign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherHomework'] });
      queryClient.invalidateQueries({ queryKey: ['teacherHomeworkCatalog'] });
      setAssignModalTemplate(null);
      setAssignSelectedStudentId('');
      setAssignStudentSearch('');
      setAssignCustomNotes('');
      setAssignDueDate('');
      setHwViewMode('submissions');
      toast.success(
        language === 'he' ? 'שיעורי הבית הוקצו לתלמיד בהצלחה!' : 'Homework assigned to student successfully!'
      );
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to assign homework');
    },
  });

  // Review homework mutation
  const reviewHomeworkMutation = useMutation({
    mutationFn: async ({ id, feedback }: { id: string; feedback: string }) => {
      return api.patch(`/homework/${id}/review`, { teacherFeedback: feedback });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherHomework'] });
      setReviewHwId(null);
      setReviewFeedback('');
      toast.success(
        language === 'he' ? 'המשוב והציון נשלחו לתלמיד בהצלחה!' : 'Homework feedback sent to student!'
      );
    },
  });

  // 4. Fetch Games for this Teacher / Platform
  const { data: gamesData } = useQuery({
    queryKey: ['teacherGames'],
    queryFn: async () => {
      const res = await api.get('/games');
      return res.data.games;
    },
    staleTime: 5 * 60 * 1000,
  });

  const saveGameMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingGameId) {
        return api.put(`/games/${editingGameId}`, payload);
      } else {
        return api.post('/games', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherGames'] });
      queryClient.invalidateQueries({ queryKey: ['games'] });
      setIsCustomizingGame(false);
      setEditingGameId(null);
      toast.success(
        language === 'he' ? 'המשחק המותאם נשמר בהצלחה!' : 'Custom game saved successfully!'
      );
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.error || (language === 'he' ? 'שגיאה בשמירת המשחק' : 'Failed to save game')
      );
    },
  });

  const deleteGameMutation = useMutation({
    mutationFn: async (gameId: string) => {
      return api.delete(`/games/${gameId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherGames'] });
      queryClient.invalidateQueries({ queryKey: ['games'] });
      toast.success(
        language === 'he' ? 'המשחק הוסר בהצלחה!' : 'Game deleted successfully!'
      );
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.error || (language === 'he' ? 'שגיאה במחיקת המשחק' : 'Failed to delete game')
      );
    },
  });

  const openNewGameModal = (type: 'FLASHCARD' | 'MATCHING' | 'QUIZ' = 'FLASHCARD', lessonId?: string) => {
    setEditingGameId(null);
    setGameType(type);
    setGameLevel('BEGINNER');
    setGameLessonId(lessonId || '');
    setGameTitle('');
    setGameTitleHe('');
    setGameDesc('');
    setGamePoints(20);
    loadPresetForLevel('BEGINNER', type);
    setIsCustomizingGame(true);
  };

  const openEditGameModal = (g: any) => {
    setEditingGameId(g.id);
    setGameType(g.gameType);
    setGameLevel(g.level);
    setGameLessonId(g.lessonId || '');
    setGameTitle(g.title);
    setGameTitleHe(g.titleHe);
    setGameDesc(g.description || '');
    setGamePoints(g.pointsReward || 20);

    if (g.gameType === 'FLASHCARD' && g.configJson?.cards) {
      setFlashcards(g.configJson.cards);
    } else if (g.gameType === 'MATCHING' && g.configJson?.pairs) {
      setMatchingPairs(g.configJson.pairs);
    } else if (g.gameType === 'QUIZ' && g.configJson?.questions) {
      setQuizQuestions(g.configJson.questions);
    }
    setIsCustomizingGame(true);
  };

  const loadPresetForLevel = (lvl: string, type: 'FLASHCARD' | 'MATCHING' | 'QUIZ') => {
    if (type === 'FLASHCARD') {
      if (lvl === 'ADVANCED') {
        setFlashcards([
          { front: 'הִתְפַּתְּחוּת', back: 'Development / Evolution', example: 'התפתחות הטכנולוגיה בישראל' },
          { front: 'הַשְׁפָּעָה', back: 'Influence / Impact', example: 'יש לכך השפעה רבה על החברה' },
          { front: 'מַשְׁמָעוּת', back: 'Meaning / Significance', example: 'מהי המשמעות המדויקת של המשפט?' },
          { front: 'הִתְמוֹדְדוּת', back: 'Coping / Dealing with', example: 'התמודדות עם אתגרים יומיומיים' },
        ]);
        setGameTitle('Advanced Vocabulary & Idioms');
        setGameTitleHe('אוצר מילים מתקדם וביטויים');
      } else if (lvl === 'INTERMEDIATE') {
        setFlashcards([
          { front: 'לְהַרְגִּישׁ', back: 'To feel', example: 'אני מרגיש מצוין היום' },
          { front: 'לִפְגּוֹשׁ', back: 'To meet', example: 'אני פוגש חברים בערב' },
          { front: 'מִשְׁפָּחָה', back: 'Family', example: 'המשפחה שלי גרה בירושלים' },
          { front: 'עֲבוֹדָה', back: 'Work / Job', example: 'הוא מתחיל עבודה חדשה' },
        ]);
        setGameTitle('Intermediate Verbs & Daily Life');
        setGameTitleHe('פעלים שימושיים וחיי יום-יום');
      } else {
        setFlashcards([
          { front: 'שָׁלוֹם', back: 'Hello / Peace', example: 'שלום, נעים להכיר!' },
          { front: 'תּוֹדָה', back: 'Thank you', example: 'תודה רבה על העזרה' },
          { front: 'בְּבַקָּשָׁה', back: 'Please / You are welcome', example: 'בבקשה, שב כאן' },
          { front: 'סְלִיחָה', back: 'Excuse me / Sorry', example: 'סליחה, מה השעה?' },
        ]);
        setGameTitle('Everyday Greetings & Politeness');
        setGameTitleHe('ברכות יומיומיות ונימוסים');
      }
    } else if (type === 'MATCHING') {
      if (lvl === 'ADVANCED' || lvl === 'INTERMEDIATE') {
        setMatchingPairs([
          { hebrew: 'לְהַצְלִיחַ (Lehatzliach)', english: 'To succeed' },
          { hebrew: 'לְהַחְלִיט (Lehachlit)', english: 'To decide' },
          { hebrew: 'לְהַסְבִּיר (Lehasbir)', english: 'To explain' },
          { hebrew: 'לְהַאֲמִין (Lehaamin)', english: 'To believe' },
          { hebrew: 'לְהַזְמִין (Lehazmin)', english: 'To invite / order' },
        ]);
        setGameTitle('Hifil Verbs Match');
        setGameTitleHe('התאמת פעלים בבניין הפעיל');
      } else {
        setMatchingPairs([
          { hebrew: 'אֶחָד (Echad)', english: 'One' },
          { hebrew: 'שְׁנַיִם (Shnayim)', english: 'Two' },
          { hebrew: 'שָׁלוֹשׁ (Shalosh)', english: 'Three' },
          { hebrew: 'כָּחוֹל (Kachol)', english: 'Blue' },
          { hebrew: 'אָדוֹם (Adom)', english: 'Red' },
        ]);
        setGameTitle('Colors and Numbers Match');
        setGameTitleHe('התאמת צבעים ומספרים');
      }
    } else if (type === 'QUIZ') {
      setQuizQuestions([
        {
          question: 'What is the correct translation for "Where is the train station?"',
          questionHe: 'איך אומרים "איפה תחנת הרכבת"?',
          options: [
            'איפה תחנת הרכבת? (Eifo tachanat harakevet?)',
            'איפה שדה התעופה? (Eifo sde hateufa?)',
            'כמה זה עולה? (Kama ze oleh?)',
            'לאן אתה נוסע? (Lean ata nosea?)',
          ],
          correctIndex: 0,
        },
        {
          question: 'Which word means "Tomorrow" in Hebrew?',
          questionHe: 'איזו מילה פירושה "מחר"?',
          options: ['אתמול (Etmol)', 'היום (Hayom)', 'מחר (Machar)', 'עכשיו (Achshav)'],
          correctIndex: 2,
        },
      ]);
      setGameTitle('Hebrew Travel & Time Quiz');
      setGameTitleHe('חידון מושגי זמן ותחבורה');
    }
  };

  const handleSaveCustomGame = () => {
    if (!gameTitle.trim()) {
      toast.error(language === 'he' ? 'אנא הזן כותרת באנגלית' : 'Please provide an English title');
      return;
    }
    if (!gameTitleHe.trim()) {
      toast.error(language === 'he' ? 'אנא הזן כותרת בעברית' : 'Please provide a Hebrew title');
      return;
    }

    let configJson: any = {};
    if (gameType === 'FLASHCARD') {
      if (flashcards.length === 0) {
        toast.error(language === 'he' ? 'אנא הוסף לפחות כרטיסייה אחת' : 'Please add at least one flashcard');
        return;
      }
      configJson = { cards: flashcards };
    } else if (gameType === 'MATCHING') {
      if (matchingPairs.length < 2) {
        toast.error(language === 'he' ? 'אנא הוסף לפחות 2 זוגות מילים להתאמה' : 'Please add at least 2 matching pairs');
        return;
      }
      configJson = { pairs: matchingPairs };
    } else if (gameType === 'QUIZ') {
      if (quizQuestions.length === 0) {
        toast.error(language === 'he' ? 'אנא הוסף לפחות שאלת חידון אחת' : 'Please add at least one quiz question');
        return;
      }
      configJson = { questions: quizQuestions };
    }

    saveGameMutation.mutate({
      title: gameTitle.trim(),
      titleHe: gameTitleHe.trim(),
      description: gameDesc.trim() || undefined,
      gameType,
      level: gameLevel,
      lessonId: gameLessonId ? gameLessonId : null,
      configJson,
      pointsReward: Number(gamePoints) || 20,
      isActive: true,
    });
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const lessons = calendarData?.lessons || [];
  const slots = calendarData?.slots || [];

  // Memoized slot counts by day of week (O(1) lookup per day tab)
  const slotCountsByDay = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    for (const s of slots) {
      if (typeof s.dayOfWeek === 'number' && s.dayOfWeek >= 0 && s.dayOfWeek < 7) {
        counts[s.dayOfWeek]++;
      }
    }
    return counts;
  }, [slots]);

  // Memoized scheduled lessons count by date string YYYY-MM-DD
  const scheduledLessonsByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of lessons) {
      if (l.status === 'SCHEDULED' && l.scheduledAt) {
        const d = new Date(l.scheduledAt).toISOString().split('T')[0];
        map.set(d, (map.get(d) || 0) + 1);
      }
    }
    return map;
  }, [lessons]);

  // Memoized configured slot start times for selectedDay
  const configuredSlotStarts = useMemo(() => {
    const set = new Set<string>();
    for (const s of slots) {
      if (s.dayOfWeek === selectedDay && s.startTime) {
        set.add(s.startTime);
      }
    }
    return set;
  }, [slots, selectedDay]);

  const navItems = [
    {
      id: 'calendar',
      label: 'Open Slots Engine',
      labelHe: 'הגדרת שעות זמינות',
      labelAr: 'تحديد أوقات التوفر',
      icon: CalendarIcon,
      badge: slots.length,
      permission: 'teachers:manage_slots',
    },
    {
      id: 'calendar_monitor',
      label: 'Calendar & Bookings',
      labelHe: 'מעקב יומן ו-4 שבועות',
      labelAr: 'متابعة التقويم والحجوزات',
      icon: CalendarRange,
      badge: lessons.length > 0 ? `${lessons.length}` : 'Matrix',
      permission: 'lessons:view_all',
    },
    {
      id: 'lessons',
      label: 'Scheduled Lessons',
      labelHe: 'שיעורים מתוכננים',
      labelAr: 'الدروس المجدولة',
      icon: Video,
      badge: lessons.length,
      permission: 'lessons:view_all',
    },
    {
      id: 'students',
      label: 'Student Profiles',
      labelHe: 'פרופיל והתקדמות תלמידים',
      labelAr: 'ملفات وتقدم الطلاب',
      icon: Users,
      badge: studentsData?.length || 0,
      permission: 'students:view_progress',
    },
    {
      id: 'homework',
      label: 'Assign Homework & PDFs',
      labelHe: 'שיעורי בית וקובצי PDF',
      labelAr: 'الواجبات وملفات PDF',
      icon: BookOpen,
      badge: homeworkData?.length || 0,
      permission: 'students:view_progress',
    },
    {
      id: 'recordings',
      label: 'Recorded Sessions',
      labelHe: 'שיעורים מוקלטים (Drive)',
      labelAr: 'الدروس المسجلة (Drive)',
      icon: PlayCircle,
      badge: recordedSessionsData?.length || 0,
      permission: 'lessons:view_recordings',
    },
    {
      id: 'games',
      label: 'Custom Games',
      labelHe: 'משחקים מותאמים',
      labelAr: 'الألعاب المخصصة',
      icon: Gamepad2,
      badge: gamesData?.length || 0,
      permission: 'games:view',
    },
  ];

  const authorizedNavItems = useMemo(() => {
    return navItems.filter((item: any) => !item.permission || can(item.permission));
  }, [navItems, can]);

  const isCurrentTabAuthorized = useMemo(() => {
    const item = navItems.find((n: any) => n.id === activeTab);
    return !item?.permission || can(item.permission);
  }, [activeTab, navItems, can]);

  return (
    <div className="min-h-screen w-full relative">
      <div className="w-full">
        {/* Apple-Style Glassy Left Sidebar */}
        <GlassSidebar
          navItems={authorizedNavItems}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onTabHover={handleTabHover}
          user={user}
          panelSubtitle="Certified Teacher Portal"
          isOpenMobile={false}
          onCloseMobile={() => {
            setMobileMenuOpen(false);
            setIsMobileMoreOpen(false);
          }}
        />

        {/* Main Content Area */}
        <main className={`w-full transition-all duration-300 ${
          isCollapsed
            ? 'lg:ps-[calc(5rem+1.5rem)]'
            : 'lg:ps-[calc(18rem+1.75rem)] xl:ps-[calc(20rem+2.25rem)]'
        } p-4 sm:p-6 lg:pe-7 xl:pe-9 lg:pt-8 xl:pt-8 min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-5rem)] space-y-6 sm:space-y-8 min-w-0`}>
          {!isCurrentTabAuthorized ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-center space-y-4 shadow-sm my-8">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto ring-4 ring-amber-400/20">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {language === 'he' ? 'אין הרשאת גישה ללשונית זו' : 'Access Restricted by Role Policy'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {language === 'he'
                    ? 'תפקיד המשתמש שלך אינו מורשה לצפות בתוכן לשונית זו על פי הגדרות ה-RBAC של המנהל.'
                    : 'Your account role does not possess the granular permissions required to access this section per administrative RBAC configurations.'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('calendar')}
                className="px-5 py-2.5 rounded-xl bg-brand-teal-800 text-white font-bold text-xs hover:bg-brand-teal-900 transition-all cursor-pointer shadow-xs"
              >
                {language === 'he' ? 'חזרה ללוח הזמנים' : 'Return to Schedule'}
              </button>
            </div>
          ) : (
            <>
              {/* Dynamic Page Header Banner - Updates according to activeTab (as in Admin) */}
          {activeTab === 'calendar' && (
            <PageHeaderBanner
              badgeIcon={CalendarIcon}
              badgeText={language === 'he' ? 'לוח זמינות שבועי • משבצות 25 דק׳' : 'Weekly Availability • 25-Min Interval Engine'}
              statusText={language === 'he' ? 'פעיל' : 'Active'}
              title={language === 'he' ? `לוח זמינות וקביעת שיעורים • ${user?.firstName || 'מורה'}` : `Weekly Availability Calendar • ${user?.firstName || 'Teacher'}`}
              description={
                language === 'he'
                  ? 'סמן את משבצות הזמן שבהן הינך פנוי ללמד. תלמידים יוכלו להזמין שיעורים בכל 3 משכי הזמן (25, 40 או 55 דקות) בשעות שפתחת.'
                  : 'Customize your weekly availability slots. Students can book lessons of any session duration (25, 40, or 55 minutes) during your open hours.'
              }
              action={
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs shadow-xs transition-colors border border-white/20 text-center cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-brand-olive-300" />
                    <span>{language === 'he' ? 'שתף פרופיל מורה' : 'Share Profile'}</span>
                  </button>
                  <button
                    onClick={() => setIsCopyScheduleModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-brand-teal-800 hover:bg-brand-teal-700 text-white font-bold text-xs shadow-xs transition-colors border border-brand-teal-700 text-center cursor-pointer"
                  >
                    <Copy className="w-4 h-4 text-brand-olive-300" />
                    <span>{language === 'he' ? 'העתק שבוע' : 'Copy Week'}</span>
                  </button>
                </div>
              }
            />
          )}

          {activeTab === 'calendar_monitor' && (
            <PageHeaderBanner
              badgeIcon={CalendarRange}
              badgeText={language === 'he' ? 'מעקב יומן מפורט • תצוגת 4 שבועות ולוח שבועי' : 'Teacher Schedule Monitor • 4-Week Matrix & Timeline'}
              statusText={language === 'he' ? 'פעיל' : 'Active'}
              title={language === 'he' ? `מעקב יומן ושיעורים • ${user?.firstName || 'מורה'}` : `Calendar Monitor & Bookings • ${user?.firstName || 'Teacher'}`}
              description={
                language === 'he'
                  ? 'עקוב אחר המועדים שלך במחזור חודשי של 4 שבועות (Matrix) וצפה בלוח השבועי המפורט עם שמות תלמידים, שיעורים קבועים (Regular) ושיעורים בודדים (One-Time).'
                  : 'Monitor your upcoming time slots, 4-week availability matrix, and day-by-day weekly schedule with student bookings.'
              }
            />
          )}

          {activeTab === 'lessons' && (
            <PageHeaderBanner
              badgeIcon={Video}
              badgeText={language === 'he' ? 'שיעורים מתוזמנים וחדרי זום' : 'Live Lessons & Zoom Classrooms'}
              statusText={language === 'he' ? 'בזמן אמת' : 'Live'}
              title={language === 'he' ? 'כל השיעורים המתוזמנים (25 / 40 / 55 דק׳)' : 'Scheduled Lessons (25 / 40 / 55 Min)'}
              description={
                language === 'he'
                  ? 'מעקב אחר כל השיעורים המתוזמנים, הצטרפות ישירה לחדר ה-Zoom, סימון נוכחות והעלאת סיכומי שיעור מובנים.'
                  : 'Monitor upcoming student lessons, launch live Zoom classes, verify attendance, and write structured lesson summaries.'
              }
              action={
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-2 rounded-xl bg-white/10 text-brand-olive-300 font-bold text-xs border border-white/15">
                    {lessons?.length || 0} {language === 'he' ? 'שיעורים רשומים' : 'Scheduled Lessons'}
                  </span>
                </div>
              }
            />
          )}

          {activeTab === 'students' && (
            <PageHeaderBanner
              badgeIcon={Users}
              badgeText={language === 'he' ? 'תיקי תלמידים פעילים' : 'Active Student Directory'}
              statusText={language === 'he' ? 'מעקב שוטף' : 'Active'}
              title={language === 'he' ? 'פרופילי תלמידים ומעקב פדגוגי' : 'Student Profiles & Pedagogical Records'}
              description={
                language === 'he'
                  ? 'צפה ברמות העברית של התלמידים (אלף עד ויו), היסטוריית שיעורים, הגשות שיעורי בית והתקדמות למידה אישית.'
                  : 'Track student Hebrew levels (Alef to Vav), completed lessons, homework assignments, and tailored learning materials.'
              }
              action={
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-2 rounded-xl bg-white/10 text-brand-olive-300 font-bold text-xs border border-white/15">
                    {studentsData?.length || 0} {language === 'he' ? 'תלמידים משובצים' : 'Assigned Students'}
                  </span>
                </div>
              }
            />
          )}

          {activeTab === 'homework' && (
            <PageHeaderBanner
              badgeIcon={BookOpen}
              badgeText={language === 'he' ? 'שיעורי בית ומטלות PDF' : 'Homework & PDF Assignments'}
              statusText={language === 'he' ? 'בדיקה פעילה' : 'Active'}
              title={language === 'he' ? 'הגשות שיעורי בית ובדיקת מטלות' : 'Student Homework & PDF Materials'}
              description={
                language === 'he'
                  ? 'הקצה מטלות חדשות עם קבצי PDF וקישורי Google Drive, בדוק הגשות של תלמידים וספק משוב וציונים.'
                  : 'Assign custom homework and PDF materials, review student submissions, provide grading feedback, and award XP.'
              }
              action={
                <button
                  onClick={() => setIsAssigningHw(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'he' ? 'הקצאת שיעורי בית' : 'Assign Homework'}</span>
                </button>
              }
            />
          )}

          {activeTab === 'recordings' && (
            <PageHeaderBanner
              badgeIcon={PlayCircle}
              badgeText={language === 'he' ? 'פורטל הקלטות שיעורים' : 'Session Video Archive'}
              statusText={language === 'he' ? 'Google Drive' : 'Drive Linked'}
              title={language === 'he' ? 'הקלטות שיעורים ומאגר וידאו' : 'Recorded Sessions & Video Library'}
              description={
                language === 'he'
                  ? 'קשר שיעורי וידאו מ-Google Drive לפי נושא או מספר שיעור שיוצגו לתלמידים בחלון הנגן המובנה.'
                  : 'Add Google Drive session recordings organized by topic or session number for students to watch in-app.'
              }
              action={
                <button
                  onClick={() => setIsCreatingRecording(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'he' ? 'הוסף שיעור מוקלט' : 'Add Recorded Session'}</span>
                </button>
              }
            />
          )}

          {activeTab === 'games' && (
            <PageHeaderBanner
              badgeIcon={Gamepad2}
              badgeText={language === 'he' ? 'משחקים מותאמים אישית' : 'Interactive Hebrew Learning Games'}
              statusText={language === 'he' ? 'XP פעיל' : 'Gamified'}
              title={language === 'he' ? 'ניהול משחקים ותרגילים אינטראקטיביים' : 'Custom Games & Exercises Manager'}
              description={
                language === 'he'
                  ? 'צור והתאם כרטיסיות מילים, משחקי התאמה וחידונים לפי רמת התלמיד או קשר אותם ישירות לשיעור ספציפי.'
                  : 'Design and customize flashcards, word matching, and timed quizzes tailored by Hebrew proficiency level and linked directly to specific student lessons.'
              }
              action={
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => openNewGameModal('FLASHCARD')}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs shadow-xs border border-white/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-brand-olive-300" />
                    <span>{language === 'he' ? 'כרטיסיות' : 'Flashcards'}</span>
                  </button>
                  <button
                    onClick={() => openNewGameModal('MATCHING')}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'he' ? 'התאמת מילים' : 'Word Match'}</span>
                  </button>
                  <button
                    onClick={() => openNewGameModal('QUIZ')}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-teal-800 hover:bg-brand-teal-700 text-white font-bold text-xs shadow-xs border border-brand-teal-600 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-brand-olive-300" />
                    <span>{language === 'he' ? 'חידון' : 'Quiz'}</span>
                  </button>
                </div>
              }
            />
          )}

          {/* TAB 1: INTERACTIVE MULTI-DURATION AVAILABILITY CALENDAR & MONITOR SWITCHER */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              {/* Mode Switcher pill */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                  <button
                    onClick={() => setCalendarSubMode('manage')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                      calendarSubMode === 'manage'
                        ? 'bg-white dark:bg-slate-900 text-brand-teal-800 dark:text-brand-teal-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>{language === 'he' ? 'הגדרת שעות זמינות (25 דק׳)' : 'Open Slots Engine (25m)'}</span>
                  </button>
                  <button
                    onClick={() => setCalendarSubMode('monitor')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                      calendarSubMode === 'monitor'
                        ? 'bg-white dark:bg-slate-900 text-brand-teal-800 dark:text-brand-teal-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <CalendarRange className="w-3.5 h-3.5" />
                    <span>{language === 'he' ? 'מעקב יומן ו-4 שבועות' : '4-Week Matrix & Bookings'}</span>
                  </button>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 pe-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>{language === 'he' ? 'סנכרון מלא עם שיעורי תלמידים' : 'Live Sync with Student Lessons'}</span>
                </div>
              </div>

              {calendarSubMode === 'monitor' ? (
                <TeachersCalendarTab initialTeacherId={user?.id} isTeacherSelfView={true} />
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-brand-teal-700 dark:text-brand-teal-400" />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                          {language === 'he'
                            ? 'לוח זמינות שבועי'
                            : 'Weekly Availability Calendar'}
                        </h2>
                      </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {language === 'he'
                      ? 'סמן את השעות שבהן אתה זמין ללמד. תלמידים יוכלו לקבוע שיעור בכל משך (25, 40 או 55 דקות) בשעות שפתחת.'
                      : 'Mark the time slots when you are available. Students can book lessons of any duration (25, 40, or 55 minutes) during your open hours.'}
                  </p>
                </div>

                {/* Israel Time Pill & Slot Interval Badge */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold shadow-2xs">
                    <Clock className="w-3.5 h-3.5 text-brand-teal-600 dark:text-brand-teal-400" />
                    <span>{language === 'he' ? 'משבצות של 25 דק׳' : '25-Min Slot Intervals'}</span>
                  </div>

                  {/* Israel Timing Badge */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-brand-teal-50 dark:bg-brand-teal-950/60 border border-brand-teal-200 dark:border-brand-teal-800 text-brand-teal-900 dark:text-brand-teal-300 text-xs font-bold shadow-2xs">
                    <Globe2 className="w-3.5 h-3.5 text-brand-olive-600 dark:text-brand-olive-400" />
                    <span>
                      {language === 'he' ? 'שעון ישראל • 12 שעות AM/PM' : `${ISRAEL_TZ_LABEL} • 12h AM/PM`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-emerald-500"></span>
                  {language === 'he' ? 'שעת זמינות פתוחה' : 'Available Slot'}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-brand-teal-800"></span>
                  {language === 'he' ? 'שיעור מוזמן' : 'Booked Lesson'}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850"></span>
                  {language === 'he' ? 'לא מוגדר / סגור' : 'Closed / Available to Open'}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 ms-auto font-normal">
                  {language === 'he' ? 'אזור זמן: ירושלים (שעון ישראל)' : 'Timezone: Asia/Jerusalem (UTC+2 / UTC+3)'}
                </span>
              </div>

              {/* Teacher Permanent Classroom Zoom Meeting Link Card (Enter once -> 1-click open all slots) */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-teal-50/90 via-slate-50 to-emerald-50/40 dark:from-slate-900 dark:via-brand-teal-950 dark:to-slate-900 text-slate-900 dark:text-white shadow-xs border border-teal-200/80 dark:border-brand-teal-800/60 relative overflow-hidden transition-all">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-brand-teal-100 dark:bg-white/10 flex items-center justify-center text-brand-teal-800 dark:text-brand-olive-300 shrink-0 border border-brand-teal-200 dark:border-white/15 shadow-2xs">
                      <Video className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                          {language === 'he' ? 'קישור זום קבוע לשיעורים' : 'Permanent Classroom Zoom Link'}
                        </h3>
                        {permanentZoomLink ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                            <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>{language === 'he' ? 'מוגדר ופעיל' : 'Active & Ready'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold border border-amber-300 dark:border-amber-800">
                            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span>{language === 'he' ? 'לא הוגדר' : 'Not Set Yet'}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl leading-relaxed">
                        {language === 'he'
                          ? 'הזן את קישור הזום שלך פעם אחת בלבד. כל שעת זמינות שתוסיף תשתמש בקישור זה אוטומטית בלחיצה אחת — בלי צורך להזין אותו שוב ושוב!'
                          : 'Enter your Zoom meeting link once. All availability slots you open will automatically use this link for seamless 1-click opening — no popups or repetitive typing!'}
                      </p>
                    </div>
                  </div>

                  {/* Input and Save Button - Full width & ergonomic on mobile phones */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-80">
                      <input
                        ref={zoomInputRef}
                        type="url"
                        value={permanentZoomLink}
                        onChange={(e) => setPermanentZoomLink(e.target.value)}
                        placeholder="https://zoom.us/j/1234567890"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs font-mono border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-brand-teal-500 focus:border-brand-teal-500 shadow-2xs transition-all"
                      />
                      {permanentZoomLink && (
                        <a
                          href={permanentZoomLink}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1 text-brand-teal-600 dark:text-brand-olive-300 hover:text-brand-teal-800 dark:hover:text-white transition-colors"
                          title={language === 'he' ? 'בדוק קישור' : 'Test Zoom Link'}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = permanentZoomLink.trim();
                        if (!trimmed) {
                          toast.warning(language === 'he' ? 'נא להזין קישור זום תקין' : 'Please enter a valid Zoom link');
                          return;
                        }
                        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
                          toast.warning(language === 'he' ? 'קישור הזום חייב להתחיל ב-https://' : 'Zoom link must start with https://');
                          return;
                        }
                        saveDefaultZoomMutation.mutate(trimmed);
                      }}
                      disabled={saveDefaultZoomMutation.isPending}
                      className="w-full sm:w-auto px-5 py-2.5 bg-brand-teal-800 hover:bg-brand-teal-700 dark:bg-brand-olive-400 dark:hover:bg-brand-olive-300 active:scale-95 text-white dark:text-slate-950 rounded-xl text-xs font-black shadow-xs transition-all whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 text-center"
                    >
                      {saveDefaultZoomMutation.isPending
                        ? (language === 'he' ? 'שומר...' : 'Saving...')
                        : (language === 'he' ? 'שמור קישור' : 'Save Link')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Target Date Picker & Week Navigation Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-teal-100 dark:bg-brand-teal-950/80 text-brand-teal-800 dark:text-brand-teal-300 flex items-center justify-center shrink-0 border border-brand-teal-200 dark:border-brand-teal-800">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      {language === 'he' ? 'תאריך יעד לניהול זמינות ושיעורים' : 'Target Schedule Date'}
                    </span>
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      {new Date(selectedDate + 'T00:00:00').toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isDateInPast(selectedDate) && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold shadow-2xs">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>{language === 'he' ? 'תאריך שעבר • מצב צפייה בלבד' : 'Past Date • Read-Only View'}</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => shiftWeek(-1)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 text-xs font-bold transition-colors flex items-center gap-1"
                    title={language === 'he' ? 'שבוע קודם' : 'Previous Week'}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden md:inline">{language === 'he' ? 'שבוע קודם' : 'Prev Week'}</span>
                  </button>

                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold shadow-2xs focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => handleDateChange(new Date().toISOString().split('T')[0])}
                    className="px-3 py-1.5 rounded-xl bg-brand-teal-50 dark:bg-brand-teal-950/70 border border-brand-teal-200 dark:border-brand-teal-800 text-brand-teal-900 dark:text-brand-teal-200 text-xs font-bold hover:bg-brand-teal-100 transition-colors"
                  >
                    {language === 'he' ? 'היום' : 'Today'}
                  </button>

                  <button
                    type="button"
                    onClick={() => shiftWeek(1)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 text-xs font-bold transition-colors flex items-center gap-1"
                    title={language === 'he' ? 'שבוע הבא' : 'Next Week'}
                  >
                    <span className="hidden md:inline">{language === 'he' ? 'שבוע הבא' : 'Next Week'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day Selector Pills with Linked Dates */}
              {(() => {
                const weekDates = getWeekDates(selectedDate);
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                    {DAYS.map((dayName, dayIndex) => {
                      const daySlotsCount = slotCountsByDay[dayIndex];
                      const isSelected = selectedDay === dayIndex;
                      const weekDate = weekDates[dayIndex];
                      const dateObj = new Date(weekDate + 'T00:00:00');
                      const dateFormatted = dateObj.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                      });

                      const bookedCount = scheduledLessonsByDate.get(weekDate) || 0;

                      const isPastDay = isDateInPast(weekDate);

                      return (
                        <button
                          key={dayIndex}
                          onClick={() => handleDaySelect(dayIndex)}
                          className={`p-3 rounded-2xl border text-center transition-all ${
                            isSelected
                              ? 'bg-brand-teal-800 text-white border-brand-teal-800 shadow-xs ring-2 ring-brand-teal-500'
                              : isPastDay
                              ? 'bg-slate-100/60 dark:bg-slate-850/40 text-slate-500 dark:text-slate-400 border-slate-200/50 dark:border-slate-800 opacity-70 hover:opacity-100'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/70 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="text-[11px] font-bold block uppercase tracking-wider">
                              {language === 'he' ? DAYS_HE[dayIndex] : dayName.slice(0, 3)}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                              isSelected
                                ? 'bg-brand-teal-900 text-brand-olive-300'
                                : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}>
                              {dateFormatted}
                            </span>
                          </div>

                          <div className="flex items-center justify-center gap-1 mt-1">
                            <span className={`text-[10px] font-semibold block ${isSelected ? 'text-brand-olive-200' : 'text-slate-500 dark:text-slate-400'}`}>
                              {isPastDay ? (language === 'he' ? 'עבר' : 'Past') : `${daySlotsCount} ${language === 'he' ? 'פתוחים' : 'slots'}`}
                            </span>
                            {bookedCount > 0 && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400 text-slate-950">
                                {bookedCount} {language === 'he' ? 'מוזמנים' : 'booked'}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Time Slot Matrix for Selected Day */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                      {language === 'he'
                        ? `שעות זמינות ליום ${DAYS_HE[selectedDay]} (${new Date(selectedDate + 'T00:00:00').toLocaleDateString('he-IL', { month: 'short', day: 'numeric', year: 'numeric' })}) • משבצות של 25 דק׳`
                        : `Slots for ${DAYS[selectedDay]}, ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (25-Min Interval Slots • 12h IST)`}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {language === 'he'
                        ? 'שעות שייפתחו כאן יהיו זמינות לבחירה ישירה עבור התלמידים בהזמנת שיעור (25, 40 או 55 דק׳).'
                        : 'Slots opened here are open for student bookings of any session length (25, 40, or 55 minutes).'}
                    </p>
                  </div>
                  <span className="text-xs text-brand-teal-800 dark:text-brand-teal-300 font-bold bg-brand-teal-50 dark:bg-brand-teal-950/70 border border-brand-teal-200 dark:border-brand-teal-800 px-3 py-1 rounded-xl shrink-0">
                    {language === 'he' ? 'מוגדרים ליום זה: ' : 'Configured: '}
                    {configuredSlotStarts.size}{' '}
                    {language === 'he' ? 'שעות' : 'slots'}
                  </span>
                </div>

                {(() => {
                  const currentBlocks = AVAILABILITY_SLOTS_25;
                  const morningBlocks = currentBlocks.filter((b) => isMorningSlot(b.start));
                  const afternoonBlocks = currentBlocks.filter((b) => isAfternoonSlot(b.start));
                  const eveningBlocks = currentBlocks.filter((b) => isEveningSlot(b.start));

                  const morningConfiguredCount = morningBlocks.filter((b) =>
                    configuredSlotStarts.has(b.start)
                  ).length;
                  const afternoonConfiguredCount = afternoonBlocks.filter((b) =>
                    configuredSlotStarts.has(b.start)
                  ).length;
                  const eveningConfiguredCount = eveningBlocks.filter((b) =>
                    configuredSlotStarts.has(b.start)
                  ).length;

                  let displayedBlocks = currentBlocks;
                  if (timePeriodFilter === 'morning') displayedBlocks = morningBlocks;
                  else if (timePeriodFilter === 'afternoon') displayedBlocks = afternoonBlocks;
                  else if (timePeriodFilter === 'evening') displayedBlocks = eveningBlocks;

                  return (
                    <div className="space-y-4">
                      {/* Modern Toolbar: Period Filter Tabs + Batch Quick Actions */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800">
                        {/* Period Filter Tabs */}
                        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                          <button
                            type="button"
                            onClick={() => setTimePeriodFilter('all')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                              timePeriodFilter === 'all'
                                ? 'bg-brand-teal-800 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>{language === 'he' ? 'כל השעות' : 'All Slots'}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                              timePeriodFilter === 'all' ? 'bg-brand-teal-900 text-brand-olive-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}>
                              {currentBlocks.length}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setTimePeriodFilter('morning')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                              timePeriodFilter === 'morning'
                                ? 'bg-brand-teal-800 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                            }`}
                          >
                            <Sun className="w-3.5 h-3.5 text-amber-500" />
                            <span>{language === 'he' ? 'בוקר (8:00–12:00)' : 'Morning (8-12)'}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                              timePeriodFilter === 'morning' ? 'bg-brand-teal-900 text-brand-olive-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}>
                              {morningConfiguredCount}/{morningBlocks.length}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setTimePeriodFilter('afternoon')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                              timePeriodFilter === 'afternoon'
                                ? 'bg-brand-teal-800 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                            }`}
                          >
                            <Sun className="w-3.5 h-3.5 text-orange-500" />
                            <span>{language === 'he' ? 'צהריים (12:00–17:00)' : 'Afternoon (12-5)'}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                              timePeriodFilter === 'afternoon' ? 'bg-brand-teal-900 text-brand-olive-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}>
                              {afternoonConfiguredCount}/{afternoonBlocks.length}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setTimePeriodFilter('evening')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                              timePeriodFilter === 'evening'
                                ? 'bg-brand-teal-800 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                            }`}
                          >
                            <Moon className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{language === 'he' ? 'ערב (17:00–22:00)' : 'Evening (5-10)'}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                              timePeriodFilter === 'evening' ? 'bg-brand-teal-900 text-brand-olive-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}>
                              {eveningConfiguredCount}/{eveningBlocks.length}
                            </span>
                          </button>
                        </div>

                        {/* Batch Actions Group */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleOpenPreset(timePeriodFilter)}
                            disabled={addBatchSlotsMutation.isPending || isDateInPast(selectedDate)}
                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-brand-teal-50 dark:hover:bg-slate-750 text-brand-teal-900 dark:text-brand-teal-200 text-xs font-bold border border-slate-200/90 dark:border-slate-700 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                            title={language === 'he' ? 'פתח את כל השעות במקטע זה בבת אחת' : 'Open all slots in current period at once'}
                          >
                            <Sparkles className="w-3.5 h-3.5 text-brand-teal-600 dark:text-brand-teal-400" />
                            <span>
                              {timePeriodFilter === 'morning'
                                ? (language === 'he' ? 'פתח את כל הבוקר' : 'Open Morning')
                                : timePeriodFilter === 'afternoon'
                                ? (language === 'he' ? 'פתח את כל הצהריים' : 'Open Afternoon')
                                : timePeriodFilter === 'evening'
                                ? (language === 'he' ? 'פתח את כל הערב' : 'Open Evening')
                                : (language === 'he' ? 'פתח את כל היום' : 'Open Full Day')}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setTargetCopyDays([]);
                              setIsCopyScheduleModalOpen(true);
                            }}
                            disabled={slots.filter((s: any) => s.dayOfWeek === selectedDay).length === 0}
                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/90 dark:border-slate-700 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                            title={language === 'he' ? 'העתק את שעות יום זה לימים אחרים' : 'Copy this day schedule to other days'}
                          >
                            <Copy className="w-3.5 h-3.5 text-brand-olive-600 dark:text-brand-olive-400" />
                            <span>{language === 'he' ? 'העתק לימים...' : 'Copy to Days...'}</span>
                          </button>

                          {slots.filter((s: any) => s.dayOfWeek === selectedDay).length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(language === 'he' ? 'האם להסיר את כל השעות הפתוחות (הלא מוזמנות) מיום זה?' : 'Clear all unbooked open slots for this day?')) {
                                  clearDaySlotsMutation.mutate();
                                }
                              }}
                              disabled={clearDaySlotsMutation.isPending}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title={language === 'he' ? 'נקה שעות מיום זה' : 'Clear day slots'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Modern Slot Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {displayedBlocks.map((block) => {
                          const existingSlot = slots.find(
                            (s: any) =>
                              s.dayOfWeek === selectedDay &&
                              s.startTime === block.start
                          );

                          const slotLabel12h = formatSlotRange12Hour(block.start, block.end);

                          const bookedLesson = lessons.find((l: any) => {
                            if (l.status === 'CANCELLED') return false;
                            const lDateStr = new Date(l.scheduledAt).toISOString().split('T')[0];
                            if (lDateStr !== selectedDate || l.status !== 'SCHEDULED') return false;

                            const lDate = new Date(l.scheduledAt);
                            const lH = lDate.getHours();
                            const lM = lDate.getMinutes();
                            const lStartMs = (lH * 60 + lM) * 60 * 1000;
                            const lDur = l.durationMinutes || 25;
                            const lEndMs = lStartMs + lDur * 60 * 1000;

                            const [bH, bM] = block.start.split(':').map(Number);
                            const bStartMs = (bH * 60 + bM) * 60 * 1000;
                            return bStartMs >= lStartMs && bStartMs < lEndMs;
                          });

                          // 1. Booked Lesson Card
                          if (bookedLesson) {
                            const bookedDur = bookedLesson.durationMinutes || 25;
                            return (
                              <div
                                key={block.start}
                                className="p-3.5 rounded-2xl bg-gradient-to-br from-brand-teal-900 to-slate-900 text-white border border-brand-teal-950 shadow-md flex flex-col justify-between min-h-[6.5rem] relative overflow-hidden"
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className="font-mono text-xs font-black text-brand-olive-300">
                                      {slotLabel12h}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black shadow-xs">
                                      {language === 'he' ? 'שיעור מוזמן' : 'Booked'}
                                    </span>
                                  </div>
                                  <p className="text-xs font-bold leading-tight truncate mt-1 text-white">
                                    {bookedLesson.student?.user?.firstName} {bookedLesson.student?.user?.lastName}
                                  </p>
                                  <span className="text-[10px] text-brand-teal-200 font-semibold block mt-0.5">
                                    {bookedDur} {language === 'he' ? 'דקות' : 'Min'}
                                  </span>
                                </div>

                                <div className="pt-2 border-t border-white/10 mt-2 flex items-center justify-between">
                                  <a
                                    href={bookedLesson.zoomLink || 'https://zoom.us'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-brand-teal-200 hover:text-white transition-colors"
                                  >
                                    <Video className="w-3.5 h-3.5" />
                                    <span>{language === 'he' ? 'כניסה לזום' : 'Launch Zoom'}</span>
                                  </a>
                                </div>
                              </div>
                            );
                          }

                          // 2. Open Available Slot Card
                          if (existingSlot) {
                            return (
                              <div
                                key={block.start}
                                className="group relative p-3.5 rounded-2xl border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 via-teal-50/40 to-emerald-50/20 dark:from-emerald-950/50 dark:via-slate-900 dark:to-teal-950/30 text-emerald-950 dark:text-emerald-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-h-[6.5rem]"
                              >
                                <div>
                                  {/* Card Header: Time + Status Badge */}
                                  <div className="flex items-center justify-between gap-1 mb-1.5">
                                    <span className="font-mono text-xs font-black tracking-tight text-emerald-900 dark:text-emerald-200">
                                      {slotLabel12h}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                      <span>{language === 'he' ? 'זמין' : 'Available'}</span>
                                    </span>
                                  </div>

                                  <p className="text-[11px] font-medium text-emerald-800/80 dark:text-emerald-300/80 leading-tight">
                                    {language === 'he' ? 'פתוח לשיעורי 25, 40, 55 דק׳' : 'Open for 25, 40, 55 min sessions'}
                                  </p>
                                </div>

                                {/* Card Footer: Zoom Status & Remove Button */}
                                <div className="flex items-center justify-between pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60 mt-2">
                                  {existingSlot.zoomLink ? (
                                    <a
                                      href={existingSlot.zoomLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-[10px] font-black text-brand-teal-800 dark:text-brand-teal-300 hover:text-brand-teal-950 dark:hover:text-white transition-colors"
                                      title={existingSlot.zoomLink}
                                    >
                                      <Video className="w-3.5 h-3.5 text-brand-teal-600 dark:text-brand-teal-400 shrink-0" />
                                      <span className="truncate max-w-[85px]">{language === 'he' ? 'זום מחובר' : 'Zoom Linked'}</span>
                                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                    </a>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const activeZoom = permanentZoomLink.trim() || calendarData?.defaultZoomLink;
                                        if (activeZoom) {
                                          saveDefaultZoomMutation.mutate(activeZoom);
                                        } else {
                                          zoomInputRef.current?.focus();
                                          toast.warning(language === 'he' ? 'נא להזין קישור זום למעלה' : 'Please enter Zoom link above');
                                        }
                                      }}
                                      className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 font-bold hover:underline"
                                      title={language === 'he' ? 'לחץ לחיבור קישור הזום הקבוע' : 'Attach permanent Zoom link'}
                                    >
                                      <Video className="w-3 h-3 shrink-0" />
                                      <span>{language === 'he' ? 'חבר זום' : 'Attach Zoom'}</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => deleteSlotMutation.mutate(existingSlot.id)}
                                    disabled={deleteSlotMutation.isPending && deleteSlotMutation.variables === existingSlot.id}
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                    title={language === 'he' ? 'הסר שעת זמינות' : 'Remove slot'}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          // 3. Past Slot Card
                          const slotIsPast = isSlotInPast(selectedDate, block.start);
                          if (slotIsPast) {
                            return (
                              <div
                                key={block.start}
                                className="p-3.5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-600 flex flex-col justify-between min-h-[6.5rem] text-start select-none cursor-not-allowed opacity-50"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-xs font-medium text-slate-400 line-through">
                                    {slotLabel12h}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-400">
                                    {language === 'he' ? 'עבר' : 'Past'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-slate-400 pt-2">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{language === 'he' ? 'זמן שעבר' : 'Past'}</span>
                                </div>
                              </div>
                            );
                          }

                          // 4. Closed / Available to Open Slot Card
                          return (
                            <button
                              key={block.start}
                              onClick={() => handleOpenSlotModal(block, slotLabel12h)}
                              disabled={addSlotMutation.isPending && (addSlotMutation.variables as any)?.startTime === block.start}
                              className="group relative p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-teal-500/70 dark:hover:border-brand-teal-400 hover:shadow-md transition-all flex flex-col justify-between min-h-[6.5rem] text-start shadow-2xs cursor-pointer active:scale-98"
                            >
                              <div className="flex items-center justify-between gap-1 w-full mb-1">
                                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-brand-teal-700 dark:group-hover:text-brand-teal-300 transition-colors">
                                  {slotLabel12h}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 group-hover:bg-brand-teal-50 dark:group-hover:bg-brand-teal-950/60 group-hover:text-brand-teal-700 dark:group-hover:text-brand-teal-300 transition-colors">
                                  {language === 'he' ? 'סגור' : 'Closed'}
                                </span>
                              </div>

                              <div className="flex items-center justify-between w-full pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-2">
                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-brand-teal-900 dark:group-hover:text-brand-teal-200 transition-colors flex items-center gap-1.5">
                                  <div className="w-5 h-5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-brand-teal-800 group-hover:text-white flex items-center justify-center transition-colors">
                                    <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                                  </div>
                                  <span>{language === 'he' ? 'פתח שעה' : 'Open Slot'}</span>
                                </span>
                                <span className="text-[10px] font-bold text-brand-teal-600 dark:text-brand-teal-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                  1-Click
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            )}
            </div>
          )}

          {/* TAB 1.5: DEDICATED CALENDAR & BOOKINGS MONITOR */}
          {activeTab === 'calendar_monitor' && (
            <div className="space-y-6">
              <TeachersCalendarTab initialTeacherId={user?.id} isTeacherSelfView={true} />
            </div>
          )}

          {/* TAB 2: SCHEDULED LESSONS LIST */}
          {activeTab === 'lessons' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {language === 'he' ? 'שיעורים קרובים ומפגשים שהושלמו' : 'Upcoming & Completed Sessions'}
              </h2>
              <div className="space-y-4">
                {lessons.map((lesson: any) => {
                  const isCompleted = lesson.status === 'COMPLETED';
                  const lessonDur = lesson.durationMinutes || 25;

                  return (
                    <div
                      key={lesson.id}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                              {lesson.student?.user?.firstName} {lesson.student?.user?.lastName} (
                              {language === 'he' ? 'תלמיד' : 'Student'})
                            </h4>
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
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-brand-teal-700 dark:text-brand-teal-400" />
                            <span>
                              {formatIsraelDateTime(lesson.scheduledAt, {
                                includeWeekday: true,
                                locale: language === 'he' ? 'he-IL' : 'en-US',
                              })}{' '}
                              • {lessonDur} {language === 'he' ? 'דקות' : 'Minutes'}
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md ${
                              isCompleted
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                            }`}
                          >
                            {language === 'he'
                              ? isCompleted
                                ? 'הושלם'
                                : 'מתוכנן'
                              : lesson.status}
                          </span>

                          {!isCompleted && (
                            <button
                              onClick={() => completeLessonMutation.mutate(lesson.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>{language === 'he' ? 'סמן כהושלם (+50 נק׳)' : 'Mark Completed (+50 pts)'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <a
                          href={lesson.zoomLink || 'https://zoom.us'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-bold text-brand-teal-700 dark:text-brand-teal-400 hover:text-brand-teal-900 dark:hover:text-brand-teal-300"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>{language === 'he' ? 'כניסה לשיעור בזום' : 'Launch Zoom Class'}</span>
                        </a>

                        <a
                          href={getGoogleCalendarUrl({
                            id: lesson.id,
                            title: `Engrew Hebrew Lesson with ${lesson.student?.user?.firstName || 'Student'}`,
                            description: `1-on-1 Hebrew lesson (${lessonDur} min)`,
                            scheduledAt: lesson.scheduledAt,
                            durationMinutes: lessonDur,
                            zoomLink: lesson.zoomLink || 'https://zoom.us',
                            studentName: lesson.student?.user?.firstName,
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => haptics.tap()}
                          title={language === 'he' ? 'הוסף ל-Google Calendar' : 'Add to Google Calendar'}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                        >
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          <span>Google Cal</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            haptics.tap();
                            downloadIcsFile({
                              id: lesson.id,
                              title: `Engrew Hebrew Lesson with ${lesson.student?.user?.firstName || 'Student'}`,
                              description: `1-on-1 Hebrew lesson (${lessonDur} min)`,
                              scheduledAt: lesson.scheduledAt,
                              durationMinutes: lessonDur,
                              zoomLink: lesson.zoomLink || 'https://zoom.us',
                              studentName: lesson.student?.user?.firstName,
                            });
                          }}
                          title={language === 'he' ? 'הורד קובץ iCal / Outlook' : 'Download Apple / Outlook (.ics)'}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-500" />
                          <span>.ics</span>
                        </button>

                        {lesson.recordingUrl && (
                          <a
                            href={lesson.recordingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>{language === 'he' ? 'הקלטת Google Drive' : 'Google Drive Recording'}</span>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => setStructuredNotesLesson(lesson)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-bold text-xs hover:bg-teal-100 dark:hover:bg-teal-900 transition-all shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-teal-600" />
                          <span>
                            {lesson.teacherNotes || lesson.recordingUrl
                              ? (language === 'he' ? 'עריכת סיכום מובנה והקלטה' : 'Edit Structured Notes & Recording')
                              : (language === 'he' ? '+ הוסף סיכום מובנה והקלטה' : '+ Add Structured Notes & Recording')}
                          </span>
                        </button>
                      </div>

                      {recordingLessonId === lesson.id && (
                        <div className="mt-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                          <div>
                            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                              {language === 'he' ? 'קישור להקלטת Google Drive:' : 'Google Drive Recording URL:'}
                            </label>
                            <input
                              type="url"
                              value={recordingUrl}
                              onChange={(e) => setRecordingUrl(e.target.value)}
                              placeholder="https://drive.google.com/file/d/..."
                              className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs"
                            />
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                              {language === 'he' ? 'סיכום והערות לשיעור:' : 'Session Notes:'}
                            </label>
                            <textarea
                              value={sessionNotes}
                              onChange={(e) => setSessionNotes(e.target.value)}
                              placeholder={
                                language === 'he'
                                  ? 'אוצר מילים שנלמד, דגשי הגייה, תזכורת למשימות בית...'
                                  : 'Vocabulary covered, pronunciation remarks, homework reminder...'
                              }
                              rows={2}
                              className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs"
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setRecordingLessonId(null)}
                              className="px-3 py-1 text-slate-600 dark:text-slate-400 font-semibold"
                            >
                              {language === 'he' ? 'ביטול' : 'Cancel'}
                            </button>
                            <button
                              onClick={() =>
                                saveRecordingMutation.mutate({
                                  id: lesson.id,
                                  url: recordingUrl,
                                  notes: sessionNotes,
                                })
                              }
                              className="px-4 py-1 bg-brand-teal-800 text-white font-bold rounded-lg shadow-2xs"
                            >
                              {language === 'he' ? 'שמור הקלטה' : 'Save Recording'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {lessons.length === 0 && (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    {language === 'he'
                      ? 'אין שיעורים מתוזמנים לשבוע זה.'
                      : 'No scheduled lessons found for this week.'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MY STUDENTS */}
          {activeTab === 'students' && (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-brand-teal-700 dark:text-brand-teal-400" />
                    <span>{language === 'he' ? 'פרופילי תלמידים ומעקב התקדמות' : 'Student Profiles & Progress Tracking'}</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {language === 'he'
                      ? 'עקוב אחר התקדמות כל תלמיד, יתרת שיעורים, שיעורי בית ומפגשים מוקלטים.'
                      : 'Track each student\'s learning progress, lesson packages, homework submissions, and assignments.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-brand-teal-50 dark:bg-brand-teal-950/60 border border-brand-teal-200 dark:border-brand-teal-800 text-xs font-bold text-brand-teal-800 dark:text-brand-teal-300">
                    {studentsData?.length || 0} {language === 'he' ? 'תלמידים משובצים' : 'Enrolled Students'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                {studentsData?.map((studentItem: any) => {
                  const student = studentItem.student || studentItem;
                  const studentUser = student.user || studentItem.user;
                  const stats = studentItem.stats || student.stats || {};
                  const completedLessons = stats.completedLessons || 0;
                  const remainingLessons = stats.packageRemainingLessons || 0;
                  const totalLessons = stats.packageTotalLessons || (completedLessons + remainingLessons);
                  const progressPct = totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;
                  const pendingHw = stats.pendingHomework || 0;
                  const studentName = `${studentUser?.firstName || 'Student'} ${studentUser?.lastName || ''}`.trim();
                  const studentEmail = studentUser?.email || '';

                  return (
                    <div
                      key={student.id}
                      className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-lg hover:border-brand-teal-500/30 transition-all flex flex-col justify-between space-y-4 overflow-hidden relative group"
                    >
                      {/* Top Header */}
                      <div className="space-y-3.5">
                        {/* Student Identity Row: Avatar + Full Name + Email */}
                        <div className="flex items-center gap-3.5 min-w-0 min-h-[52px]">
                          <AvatarWithFrame
                            avatarUrl={studentUser?.avatarUrl}
                            studentName={studentName}
                            frameItem={student?.equippedAvatarFrame}
                            size="lg"
                          />
                          <div className="min-w-0 flex-1">
                            <h4
                              className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base leading-snug break-words"
                              title={studentName}
                            >
                              <StyledNickname
                                name={studentName}
                                nicknameItem={student?.equippedNickname}
                                truncate
                              />
                            </h4>
                            <span
                              className="text-xs text-slate-500 dark:text-slate-400 block truncate mt-0.5"
                              title={studentEmail}
                            >
                              {studentEmail}
                            </span>
                          </div>
                        </div>

                        {/* Badges Bar: Level & Points */}
                        <div className="h-10 flex items-center justify-between gap-2 text-xs px-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/80">
                          <span className="inline-flex items-center gap-1.5 font-bold text-brand-olive-800 dark:text-brand-olive-300 text-xs shrink-0">
                            <span className="w-2 h-2 rounded-full bg-brand-olive-500 shrink-0" />
                            {t(`levels.${student.level || 'BEGINNER'}`)}
                          </span>
                          <div className="flex items-center gap-2.5 font-bold shrink-0">
                            <span className="flex items-center gap-1 text-brand-teal-800 dark:text-brand-teal-300">
                              <Award className="w-3.5 h-3.5 text-brand-olive-500 shrink-0" />
                              <span>{student.totalPoints || 0} {language === 'he' ? 'נקודות' : 'pts'}</span>
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar for Package */}
                        <div className="h-12 flex flex-col justify-center space-y-1.5">
                          <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                            <span className="font-medium">{language === 'he' ? 'התקדמות חבילה' : 'Package Progress'}</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {completedLessons} / {totalLessons} {language === 'he' ? 'שיעורים' : 'lessons'} ({progressPct}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-brand-teal-600 dark:bg-brand-teal-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Last & Next Lesson */}
                        <div className="h-14 text-xs space-y-1 text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex flex-col justify-center">
                          {stats.lastLessonDate && (
                            <div className="flex items-center justify-between">
                              <span>{language === 'he' ? 'שיעור אחרון:' : 'Last lesson:'}</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {new Date(stats.lastLessonDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {stats.nextLessonDate && (
                            <div className="flex items-center justify-between">
                              <span className="text-brand-teal-700 dark:text-brand-teal-400 font-semibold">
                                {language === 'he' ? 'שיעור הבא:' : 'Next session:'}
                              </span>
                              <span className="font-bold text-brand-teal-800 dark:text-brand-teal-300">
                                {new Date(stats.nextLessonDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {pendingHw > 0 && !stats.nextLessonDate && (
                            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-bold">
                              <span>{language === 'he' ? 'ש״ב ממתינים לבדיקה:' : 'Pending HW review:'}</span>
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800">{pendingHw}</span>
                            </div>
                          )}
                          {!stats.lastLessonDate && !stats.nextLessonDate && pendingHw === 0 && (
                            <div className="flex items-center justify-between text-slate-400 dark:text-slate-500">
                              <span>{language === 'he' ? 'סטטוס מפגשים:' : 'Session status:'}</span>
                              <span className="italic font-medium">{language === 'he' ? 'אין שיעורים קרובים' : 'No upcoming sessions'}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2">
                        <button
                          onClick={() => {
                            setHwStudentId(student.id);
                            setIsAssigningHw(true);
                          }}
                          className="py-2 px-2 bg-brand-teal-50 dark:bg-brand-teal-950/60 hover:bg-brand-teal-100 dark:hover:bg-brand-teal-900/60 text-brand-teal-800 dark:text-brand-teal-300 font-bold text-xs rounded-xl transition-colors text-center shadow-2xs"
                          title={language === 'he' ? 'הקצאת שיעורי בית' : 'Assign HW'}
                        >
                          + {language === 'he' ? 'ש״ב' : 'HW'}
                        </button>
                        <button
                          onClick={() => {
                            setRecStudentId(student.id);
                            setIsCreatingRecording(true);
                          }}
                          className="py-2 px-2 bg-brand-olive-50 dark:bg-brand-olive-950/60 hover:bg-brand-olive-100 dark:hover:bg-brand-olive-900/60 text-brand-olive-800 dark:text-brand-olive-300 font-bold text-xs rounded-xl transition-colors text-center shadow-2xs"
                          title={language === 'he' ? 'הוספת שיעור מוקלט' : 'Add Recording'}
                        >
                          + {language === 'he' ? 'הקלטה' : 'Video'}
                        </button>
                        <button
                          onClick={() => setSelectedStudentDetail({ ...student, user: studentUser, stats })}
                          className="py-2 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors text-center flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 shrink-0" />
                          <span>{language === 'he' ? 'פרופיל' : 'View'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setExamModalStudent({ ...student, user: studentUser })}
                          className="col-span-3 py-2 px-3 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {language === 'ar'
                              ? 'فتح امتحان انتقال المستوى'
                              : language === 'he'
                              ? 'פתח מבחן מעבר רמה'
                              : 'Open Level Exam'}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {(!studentsData || studentsData.length === 0) && (
                  <p className="text-xs text-slate-400 py-12 text-center col-span-3">
                    {language === 'he' ? 'אין תלמידים משובצים כרגע.' : 'No students assigned yet.'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: INTERACTIVE HOMEWORK BANK & REVIEWS */}
          {activeTab === 'homework' && (
            <div className="space-y-6">
              {/* Header with Navigation Pills */}
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-brand-teal-700 dark:text-brand-teal-400" />
                      <span>{language === 'he' ? 'מאגר שיعורי בית והגשות תלמידים' : 'Homework Catalog & Student Submissions'}</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {language === 'he'
                        ? 'בחר שיעור בית מוכן ממאגר המערכת והקצה לתלמיד, או עקוב אחר ההגשות והציונים שנבדקו אוטומטית.'
                        : 'Search ready-made interactive reading comprehension drills from the bank and assign them to students in one click.'}
                    </p>
                  </div>

                  {/* Sub-tab Navigation */}
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setHwViewMode('catalog')}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                        hwViewMode === 'catalog'
                          ? 'bg-white dark:bg-slate-700 text-brand-teal-800 dark:text-brand-teal-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{language === 'he' ? 'מאגר שיעורי הבית' : 'Homework Catalog'}</span>
                      <span className="px-1.5 py-0.2 rounded-md bg-brand-teal-100 dark:bg-brand-teal-950 text-brand-teal-800 dark:text-brand-teal-300 text-[10px]">
                        {teacherCatalog.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHwViewMode('submissions')}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                        hwViewMode === 'submissions'
                          ? 'bg-white dark:bg-slate-700 text-brand-teal-800 dark:text-brand-teal-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{language === 'he' ? 'הגשות ומעקב' : 'Assigned & Submissions'}</span>
                      <span className="px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 text-[10px]">
                        {homeworkData?.length || 0}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Sub-view 1: Catalog Search & Filter */}
                {hwViewMode === 'catalog' && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative flex-1 w-full">
                      <Search className="w-4 h-4 text-slate-400 absolute top-3 left-3 pointer-events-none" />
                      <input
                        type="text"
                        value={catalogSearch}
                        onChange={(e) => setCatalogSearch(e.target.value)}
                        placeholder={
                          language === 'he'
                            ? 'חפש לפי נושא, קטע קריאה או מילות מפתח...'
                            : 'Search homework drills by topic, reading passage, or keyword...'
                        }
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-teal-500"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                      {['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setCatalogLevel(lvl)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                            catalogLevel === lvl
                              ? 'bg-brand-teal-700 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* VIEW 1: HOMEWORK CATALOG (BANK) */}
              {hwViewMode === 'catalog' && (
                <div>
                  {isTeacherCatalogLoading ? (
                    <div className="p-12 text-center text-slate-400 font-bold animate-pulse">
                      {language === 'he' ? 'טוען מאגר שיעורי בית...' : 'Loading homework catalog...'}
                    </div>
                  ) : teacherCatalog.length === 0 ? (
                    <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
                      <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                      <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                        {language === 'he' ? 'לא נמצאו שיעורי בית מתאימים לסינון זה' : 'No homework templates found for this filter'}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {language === 'he' ? 'נסה לשנות את רמת הסינון או מילת החיפוש.' : 'Try adjusting the search query or level filters.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {teacherCatalog.map((tpl: any) => (
                        <div
                          key={tpl.id}
                          className="p-5 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-750 shadow-xs hover:shadow-md hover:border-brand-teal-500/40 transition-all flex flex-col justify-between space-y-4 group"
                        >
                          <div className="space-y-3">
                            {/* Badges */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {(tpl.levelCodes?.length ? tpl.levelCodes : [tpl.levelCode || 'A1']).map((code: string) => (
                                  <span
                                    key={code}
                                    className="px-2.5 py-0.5 rounded-lg bg-brand-teal-100 dark:bg-brand-teal-950/70 text-brand-teal-800 dark:text-brand-teal-300 text-[10px] font-black uppercase tracking-wider"
                                  >
                                    {code}
                                  </span>
                                ))}
                                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                                  {tpl.targetTrack === 'ALL' ? (language === 'he' ? 'כל המסלולים' : 'All Tracks') : tpl.targetTrack}
                                </span>
                              </div>

                              <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-lg border border-amber-200/60">
                                {tpl.totalPoints || 10} {language === 'he' ? 'נקודות' : 'Pts'}
                              </span>
                            </div>

                            {/* Title & Passage Excerpt */}
                            <div>
                              <h3 className="font-black text-sm text-slate-900 dark:text-white group-hover:text-brand-teal-700 dark:group-hover:text-brand-teal-400 transition-colors line-clamp-1">
                                {tpl.title}
                              </h3>
                              {tpl.readingPassageTitle && (
                                <p className="text-[11px] font-bold text-brand-teal-700 dark:text-brand-teal-400 mt-0.5 line-clamp-1">
                                  📖 {tpl.readingPassageTitle}
                                </p>
                              )}
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                                {tpl.readingPassage}
                              </p>
                            </div>

                            {/* Questions count pill */}
                            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                              <span>❓ {tpl.questions?.length || 0} {language === 'he' ? 'שאלות אינטראקטיביות' : 'Interactive Questions'}</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">⚡ {language === 'he' ? 'בדיקה אוטומטית' : 'Auto-graded'}</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewTemplateTeacher(tpl)}
                              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-brand-teal-600" />
                              <span>{language === 'he' ? 'מעאיינה' : 'Preview'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setAssignModalTemplate(tpl);
                                setAssignSelectedStudentId('');
                                setAssignStudentSearch('');
                                setAssignCustomNotes('');
                                setAssignDueDate('');
                              }}
                              className="px-4 py-2 rounded-xl bg-brand-teal-700 hover:bg-brand-teal-800 text-white font-black text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
                            >
                              <Plus className="w-4 h-4 text-lime-300" />
                              <span>{language === 'he' ? 'הקצה לתלמיד' : 'Assign to Student'}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 2: SUBMISSIONS & ASSIGNED HOMEWORK */}
              {hwViewMode === 'submissions' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-500">
                      {language === 'he' ? 'הגשות תלמידים שנענו ונבדקו במערכת:' : 'All homework assignments and interactive quiz submissions:'}
                    </p>
                    <button
                      onClick={() => setIsAssigningHw(true)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{language === 'he' ? 'הקצאת מטלה ידנית (PDF)' : 'Custom / PDF Homework'}</span>
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {homeworkData?.map((hw: any) => {
                      const isInteractive = Boolean(hw.templateId || hw.template);
                      const hasSubmitted = hw.status === 'SUBMITTED' || hw.status === 'REVIEWED';

                      return (
                        <div
                          key={hw.id}
                          className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-750 shadow-xs space-y-3 flex flex-col justify-between"
                        >
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{hw.title}</h4>
                                  {isInteractive && (
                                    <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-[9px] font-black uppercase">
                                      Interactive
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                                  {language === 'he' ? 'תלמיד:' : 'Student:'} {hw.student?.user?.firstName} {hw.student?.user?.lastName}
                                </span>
                              </div>

                              {/* Status or Score badge */}
                              <div className="flex flex-col items-end gap-1">
                                <span
                                  className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg ${
                                    hw.status === 'REVIEWED'
                                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                      : hw.status === 'SUBMITTED'
                                      ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300'
                                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                  }`}
                                >
                                  {hw.status === 'REVIEWED'
                                    ? (language === 'he' ? 'נבדק' : 'Reviewed')
                                    : hw.status === 'SUBMITTED'
                                    ? (language === 'he' ? 'הוגש' : 'Submitted')
                                    : (language === 'he' ? 'ממתין לפתרון' : 'Pending')}
                                </span>

                                {hw.percentage !== null && hw.percentage !== undefined && (
                                  <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                                    hw.percentage >= 70
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                  }`}>
                                    🎯 {hw.percentage}% ({hw.score}/{hw.maxScore} Pts)
                                  </span>
                                )}
                              </div>
                            </div>

                            {hw.description && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                {hw.description}
                              </p>
                            )}

                            {/* Due Date */}
                            {hw.dueDate && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                <Clock className="w-3.5 h-3.5 text-brand-teal-600" />
                                <span>
                                  {language === 'he' ? 'מועד הגשה:' : 'Due date:'}{' '}
                                  {new Date(hw.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                            )}

                            {/* Interactive Submission Quick View */}
                            {isInteractive && hasSubmitted && (
                              <button
                                type="button"
                                onClick={() => setInspectHwSubmission(hw)}
                                className="w-full p-2 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-teal-200/60"
                              >
                                <Eye className="w-4 h-4" />
                                <span>{language === 'he' ? 'צפה בתשובות התלמיד בפירוט' : 'Inspect Student Answers & Breakdown'}</span>
                              </button>
                            )}

                            {/* Legacy attachment */}
                            {hw.attachmentUrl && (
                              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 truncate">
                                  <FileText className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-400 shrink-0" />
                                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                    {isGoogleDriveUrl(hw.attachmentUrl) ? 'Google Drive PDF' : 'Attached Material'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => {
                                    setViewerUrl(hw.attachmentUrl);
                                    setViewerTitle(hw.title);
                                  }}
                                  className="px-2.5 py-1 text-[11px] font-bold bg-brand-teal-800 text-white rounded-lg"
                                >
                                  {language === 'he' ? 'פתח' : 'View'}
                                </button>
                              </div>
                            )}

                            {hw.teacherFeedback && (
                              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                                <span className="font-bold block mb-0.5">
                                  {language === 'he' ? 'המשוב שלך:' : 'Your Feedback:'}
                                </span>
                                {hw.teacherFeedback}
                              </div>
                            )}
                          </div>

                          {/* Add/Edit Feedback Section */}
                          {hasSubmitted && (
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                              {reviewHwId === hw.id ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={reviewFeedback}
                                    onChange={(e) => setReviewFeedback(e.target.value)}
                                    placeholder={
                                      language === 'he'
                                        ? 'כתוב משוב, הערות לשיפור או שבחים לתלמיד...'
                                        : 'Write feedback, corrections, or praise for the student...'
                                    }
                                    rows={2}
                                    className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-brand-teal-600"
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => setReviewHwId(null)}
                                      className="px-3 py-1 text-xs text-slate-500 dark:text-slate-400 font-semibold"
                                    >
                                      {language === 'he' ? 'ביטול' : 'Cancel'}
                                    </button>
                                    <button
                                      onClick={() =>
                                        reviewHomeworkMutation.mutate({
                                          id: hw.id,
                                          feedback: reviewFeedback,
                                        })
                                      }
                                      className="px-4 py-1.5 text-xs bg-brand-teal-800 hover:bg-brand-teal-900 text-white font-bold rounded-xl shadow-2xs"
                                    >
                                      {language === 'he' ? 'שלח משוב' : 'Send Feedback'}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setReviewHwId(hw.id);
                                    setReviewFeedback(hw.teacherFeedback || '');
                                  }}
                                  className="text-xs font-bold text-brand-teal-700 dark:text-brand-teal-400 hover:text-brand-teal-900 dark:hover:text-brand-teal-300 flex items-center gap-1.5"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{hw.teacherFeedback ? (language === 'he' ? 'ערוך משוב' : 'Edit Feedback') : (language === 'he' ? 'הוסף משוב לתלמיד' : 'Add Teacher Feedback')}</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {(!homeworkData || homeworkData.length === 0) && (
                      <p className="text-xs text-slate-400 py-12 text-center col-span-2">
                        {language === 'he' ? 'אין עדיין שיעורי בית שהוקצו.' : 'No homework assignments yet. Browse the catalog to assign your first drill!'}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: RECORDED SESSIONS (TEACHER VIEW) */}
          {activeTab === 'recordings' && (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <PlayCircle className="w-5 h-5 text-brand-teal-700 dark:text-brand-teal-400" />
                    <span>{language === 'he' ? 'שיעורים מוקלטים ומאגר וידאו' : 'Recorded Sessions & Video Library'}</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {language === 'he'
                      ? 'הוסף שיעורי וידאו מ-Google Drive לפי נושא או מספר שיעור שיוצגו לתלמידים בחלון הנגן המובנה.'
                      : 'Add Google Drive session recordings organized by topic or session number for students to watch in-app.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsCreatingRecording(true)}
                  className="px-4 py-2.5 bg-brand-teal-800 hover:bg-brand-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-brand-olive-300" />
                  <span>{language === 'he' ? 'הוסף שיעור מוקלט חדש' : 'Add Recorded Session'}</span>
                </button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {recordedSessionsData?.map((session: any) => (
                  <div
                    key={session.id}
                    className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-lg hover:border-brand-teal-500/30 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-3 py-1 rounded-xl bg-brand-teal-100/80 dark:bg-brand-teal-950/80 border border-brand-teal-300/80 dark:border-brand-teal-800 text-xs font-black text-brand-teal-950 dark:text-brand-teal-200 shadow-2xs">
                          {language === 'he' ? `שיעור #${session.sessionNumber}` : `Session #${session.sessionNumber}`}
                        </span>
                        <span className="px-3 py-1 rounded-xl bg-brand-olive-100 dark:bg-brand-olive-950/80 text-xs font-extrabold text-brand-olive-950 dark:text-brand-olive-200 border border-brand-olive-300 dark:border-brand-olive-700 shadow-2xs">
                          {session.category || 'General'}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-black text-slate-900 dark:text-white text-base line-clamp-1 tracking-tight">
                          {language === 'he' && session.titleHe ? session.titleHe : session.title}
                        </h4>
                        {session.description && (
                          <p className="text-xs text-slate-700 dark:text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">
                            {session.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800/80 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-brand-teal-700 dark:text-brand-teal-400" />
                          {session.durationMinutes} {language === 'he' ? 'דק׳' : 'min'}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                          {session.student
                            ? `${session.student.user?.firstName || 'Student'}`
                            : language === 'he'
                            ? 'כל התלמידים'
                            : 'All Students'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setViewerUrl(session.videoUrl);
                          setViewerTitle(session.title);
                          setViewerSubtitle(
                            session.category
                              ? `${session.category} • ${session.durationMinutes}m`
                              : `${session.durationMinutes}m`
                          );
                        }}
                        className="flex-1 py-2.5 px-3 bg-brand-teal-800 hover:bg-brand-teal-900 text-white font-extrabold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-2xs"
                      >
                        <PlayCircle className="w-4 h-4 text-brand-olive-300" />
                        <span>{language === 'he' ? 'צפה בווידאו' : 'Watch Video'}</span>
                      </button>
                      <button
                        onClick={() => deleteRecordedSessionMutation.mutate(session.id)}
                        className="p-2.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                        title={language === 'he' ? 'מחק שיעור' : 'Delete Session'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {(!recordedSessionsData || recordedSessionsData.length === 0) && (
                  <div className="col-span-3 text-center py-12 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-teal-50 dark:bg-brand-teal-950/60 text-brand-teal-700 dark:text-brand-teal-300 mx-auto flex items-center justify-center">
                      <PlayCircle className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {language === 'he'
                        ? 'לא נוספו עדיין שיעורים מוקלטים. לחץ על הוסף כדי להעלות קישור לסרטון מ-Google Drive.'
                        : 'No recorded sessions added yet. Click "+ Add Recorded Session" to attach a Google Drive video.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: CUSTOM GAMES MANAGER */}
          {activeTab === 'games' && (
            <div className="space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {language === 'he' ? 'סה״כ משחקים' : 'Total Games'}
                    </span>
                    <Gamepad2 className="w-4 h-4 text-brand-teal-600 dark:text-brand-teal-400" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {gamesData?.length || 0}
                  </div>
                </div>
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {language === 'he' ? 'כרטיסיות מילים' : 'Flashcards'}
                    </span>
                    <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {(gamesData || []).filter((g: any) => g.gameType === 'FLASHCARD').length}
                  </div>
                </div>
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {language === 'he' ? 'התאמת מילים' : 'Word Match'}
                    </span>
                    <Layers className="w-4 h-4 text-brand-olive-600 dark:text-brand-olive-400" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {(gamesData || []).filter((g: any) => g.gameType === 'MATCHING').length}
                  </div>
                </div>
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {language === 'he' ? 'חידונים' : 'Quizzes'}
                    </span>
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {(gamesData || []).filter((g: any) => g.gameType === 'QUIZ').length}
                  </div>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5" />
                    {language === 'he' ? 'סינון לפי רמה (CEFR):' : 'Level Filter (CEFR):'}
                  </span>
                  {(['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'NATIVE'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setGameFilterLevel(lvl as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        gameFilterLevel === lvl
                          ? 'bg-brand-teal-800 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {lvl === 'ALL'
                        ? language === 'he'
                          ? 'כל הרמות'
                          : 'All Levels'
                        : lvl}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {language === 'he' ? 'סוג משחק:' : 'Game Type:'}
                  </span>
                  {(['ALL', 'FLASHCARD', 'MATCHING', 'QUIZ', 'SENTENCE_BUILDER', 'WORD_SCRAMBLE', 'SPEED_ROUND'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setGameFilterType(type)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        gameFilterType === type
                          ? 'bg-brand-teal-800 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {type === 'ALL'
                        ? language === 'he'
                          ? 'הכל'
                          : 'All'
                        : type === 'FLASHCARD'
                        ? language === 'he'
                          ? 'כרטיסיות'
                          : 'Flashcards'
                        : type === 'MATCHING'
                        ? language === 'he'
                          ? 'התאמה'
                          : 'Matching'
                        : type === 'QUIZ'
                        ? language === 'he'
                          ? 'חידון'
                          : 'Quiz'
                        : type === 'SENTENCE_BUILDER'
                        ? language === 'he'
                          ? 'בניית משפטים'
                          : 'Sentences'
                        : type === 'WORD_SCRAMBLE'
                        ? language === 'he'
                          ? 'סידור אותיות'
                          : 'Scramble'
                        : language === 'he'
                        ? 'ספרינט מהיר'
                        : 'Speed Sprint'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Games Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {(gamesData || [])
                  .filter((g: any) => {
                    if (gameFilterLevel !== 'ALL') {
                      const gCode = g.levelModel?.code || g.level;
                      if (gCode !== gameFilterLevel && g.level !== gameFilterLevel) return false;
                    }
                    if (gameFilterType !== 'ALL' && g.gameType !== gameFilterType) return false;
                    return true;
                  })
                  .map((game: any) => {
                    const isMyGame = game.createdById === user?.id;
                    const itemsCount =
                      game.gameType === 'FLASHCARD'
                        ? game.configJson?.cards?.length || 0
                        : game.gameType === 'MATCHING'
                        ? game.configJson?.pairs?.length || 0
                        : game.gameType === 'SENTENCE_BUILDER'
                        ? game.configJson?.sentences?.length || 0
                        : game.gameType === 'WORD_SCRAMBLE'
                        ? game.configJson?.words?.length || 0
                        : game.gameType === 'SPEED_ROUND'
                        ? game.configJson?.rounds?.length || 0
                        : game.configJson?.questions?.length || 0;

                    const cefrCode = game.levelModel?.code || (
                      game.level === 'BEGINNER' ? 'A1' :
                      game.level === 'ELEMENTARY' ? 'A2' :
                      game.level === 'INTERMEDIATE' ? 'B1' :
                      game.level === 'UPPER_INTERMEDIATE' ? 'B2' :
                      game.level === 'ADVANCED' ? 'C1' :
                      game.level === 'FLUENT' ? 'C2' : game.level || 'A1'
                    );

                    const levelBadgeColor =
                      cefrCode === 'C2' || cefrCode === 'NATIVE'
                        ? 'bg-pink-100 text-pink-800 dark:bg-pink-950/70 dark:text-pink-300 border-pink-200 dark:border-pink-800'
                        : cefrCode === 'C1'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                        : cefrCode === 'B2'
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                        : cefrCode === 'B1'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        : cefrCode === 'A2'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border-teal-200 dark:border-teal-800';

                    return (
                      <div
                        key={game.id}
                        className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-brand-teal-300 dark:hover:border-brand-teal-700 transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          {/* Top Badges */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 bg-brand-teal-50 dark:bg-brand-teal-950/70 text-brand-teal-800 dark:text-brand-teal-300 rounded-md border border-brand-teal-100 dark:border-brand-teal-800">
                                {game.gameType}
                              </span>
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${levelBadgeColor}`}
                              >
                                {game.levelModel?.labelEn || cefrCode}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-brand-olive-700 dark:text-brand-olive-300 bg-brand-olive-50 dark:bg-brand-olive-950/60 px-2 py-0.5 rounded-md border border-brand-olive-200 dark:border-brand-olive-800">
                              +{game.pointsReward} {language === 'he' ? 'נק׳' : 'pts'}
                            </span>
                          </div>

                          {/* Lesson Association Badge */}
                          {game.lesson ? (
                            <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                              <Video className="w-3.5 h-3.5 text-brand-teal-600 dark:text-brand-teal-400 shrink-0" />
                              <span className="truncate">
                                {language === 'he' ? 'משויך לשיעור:' : 'Linked Lesson:'}{' '}
                                <strong>
                                  {game.lesson.student?.user?.firstName || 'Student'}{' '}
                                  {game.lesson.student?.user?.lastName || ''}
                                </strong>{' '}
                                ({game.lesson.durationMinutes || 25} {language === 'he' ? 'דק׳' : 'min'})
                              </span>
                            </div>
                          ) : (
                            <div className="px-3 py-1 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                              {language === 'he' ? 'משחק כללי בפלטפורמה' : 'General Curriculum Game'}
                            </div>
                          )}

                          {/* Title & Description */}
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-base">
                              {language === 'he' ? game.titleHe : game.title}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                              {game.description || (language === 'he' ? 'ללא תיאור' : 'No description provided')}
                            </p>
                          </div>

                          {/* Meta items count and author */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span>
                              {itemsCount}{' '}
                              {game.gameType === 'FLASHCARD'
                                ? language === 'he'
                                  ? 'כרטיסיות'
                                  : 'Cards'
                                : game.gameType === 'MATCHING'
                                ? language === 'he'
                                  ? 'זוגות מילים'
                                  : 'Word Pairs'
                                : language === 'he'
                                ? 'שאלות חידון'
                                : 'Questions'}
                            </span>
                            {isMyGame ? (
                              <span className="font-bold text-brand-teal-700 dark:text-brand-teal-400">
                                {language === 'he' ? 'נוצר על ידך' : 'Created by You'}
                              </span>
                            ) : (
                              <span>{language === 'he' ? 'תכנית לימודים' : 'Curriculum'}</span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                          <button
                            onClick={() => setPreviewGame(game)}
                            className="flex-1 py-2 px-3 bg-brand-teal-800 hover:bg-brand-teal-900 dark:bg-brand-teal-700 dark:hover:bg-brand-teal-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-brand-olive-300" />
                            <span>{language === 'he' ? 'תצוגה מקדימה' : 'Play / Preview'}</span>
                          </button>
                          <button
                            onClick={() => openEditGameModal(game)}
                            className="p-2 text-slate-600 dark:text-slate-300 hover:text-brand-teal-800 dark:hover:text-brand-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            title={language === 'he' ? 'ערוך משחק' : 'Edit Game'}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingGameId(game.id)}
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors"
                            title={language === 'he' ? 'מחק משחק' : 'Delete Game'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                {(!gamesData || gamesData.length === 0) && (
                  <div className="col-span-3 py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 space-y-3">
                    <Gamepad2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {language === 'he' ? 'אין משחקים מותאמים עדיין' : 'No Custom Games Yet'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      {language === 'he'
                        ? 'התחל ליצור כרטיסיות מילים ותרגילים אינטראקטיביים עבור התלמידים שלך.'
                        : 'Start creating flashcards and interactive exercises tailored to your Hebrew students.'}
                    </p>
                    <button
                      onClick={() => openNewGameModal('FLASHCARD')}
                      className="px-5 py-2.5 bg-brand-teal-800 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-brand-teal-900 transition-colors inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{language === 'he' ? 'צור משחק ראשון' : 'Create First Game'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
            </>
          )}
        </main>
      </div>

      {/* Assign Homework Modal */}
      {isAssigningHw && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {language === 'he' ? 'הקצאת שיעורי בית חדשים' : 'Assign New Homework'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'he'
                    ? 'הקצה מטלה, הוסף קישור לקובץ PDF מ-Google Drive ותאריך יעד.'
                    : 'Assign a task, attach Google Drive PDF materials, and set an optional due date.'}
                </p>
              </div>
              <button
                onClick={() => setIsAssigningHw(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                title={language === 'he' ? 'סגור' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'he' ? 'בחר תלמיד' : 'Select Student'}
              </label>
              <select
                value={hwStudentId}
                onChange={(e) => setHwStudentId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs"
              >
                <option value="">{language === 'he' ? 'בחר תלמיד מהרשימה...' : 'Choose a student...'}</option>
                {studentsData?.map((s: any) => {
                  const student = s.student || s;
                  const u = student.user || s.user;
                  return (
                    <option key={student.id} value={student.id}>
                      {u?.firstName || 'Student'} {u?.lastName || ''} ({t(`levels.${student.level || 'BEGINNER'}`)})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'he' ? 'כותרת המשימה' : 'Assignment Title'}
              </label>
              <input
                type="text"
                value={hwTitle}
                onChange={(e) => setHwTitle(e.target.value)}
                placeholder={language === 'he' ? 'לדוגמה: תרגול הטיות פעלים בהווה' : 'e.g. Present Tense Conjugation'}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'he' ? 'הוראות ותיאור המשימה' : 'Instructions / Description'}
              </label>
              <textarea
                value={hwDesc}
                onChange={(e) => setHwDesc(e.target.value)}
                placeholder={
                  language === 'he'
                    ? 'הוסף תרגילים, משפטים לניתוח או רשימת מילים לתרגול...'
                    : 'Provide exercises, sentences, or vocabulary lists to practice...'
                }
                rows={3}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs"
              />
            </div>

            {/* Google Drive / External PDF Link */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'he' ? 'קישור לחומר / PDF (מ-Google Drive או חיצוני)' : 'Attachment Link / PDF (Google Drive or External)'}
              </label>
              <input
                type="url"
                value={hwAttachmentUrl}
                onChange={(e) => setHwAttachmentUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/.../view or https://..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs"
              />
              {hwAttachmentUrl && (
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-brand-teal-700 dark:text-brand-teal-400">
                  <Check className="w-3 h-3" />
                  <span>
                    {isGoogleDriveUrl(hwAttachmentUrl)
                      ? (language === 'he' ? 'זוהה קובץ Google Drive - ייפתח בנגן המובנה של המערכת!' : 'Google Drive file detected - will open directly inside in-app viewer!')
                      : (language === 'he' ? 'קישור לחומר חיצוני' : 'External link')}
                  </span>
                </div>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'he' ? 'מועד הגשה רצוי (אופציונלי)' : 'Due Date (Optional)'}
              </label>
              <input
                type="date"
                value={hwDueDate}
                onChange={(e) => setHwDueDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAssigningHw(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </button>
              <button
                onClick={() =>
                  assignHomeworkMutation.mutate({
                    studentId: hwStudentId,
                    teacherId: user?.id,
                    title: hwTitle,
                    description: hwDesc,
                    attachmentUrl: hwAttachmentUrl || undefined,
                    attachmentType: hwAttachmentUrl ? detectAttachmentType(hwAttachmentUrl) : undefined,
                    dueDate: hwDueDate ? new Date(hwDueDate).toISOString() : undefined,
                  })
                }
                disabled={!hwStudentId || !hwTitle || assignHomeworkMutation.isPending}
                className="px-5 py-2 text-xs font-bold bg-brand-teal-800 hover:bg-brand-teal-900 text-white rounded-xl shadow-xs disabled:opacity-50 transition-colors"
              >
                {assignHomeworkMutation.isPending
                  ? (language === 'he' ? 'מקצה...' : 'Assigning...')
                  : (language === 'he' ? 'הקצה משימה לתלמיד' : 'Assign Assignment')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: ASSIGN CATALOG HOMEWORK TO STUDENT           */}
      {/* ==================================================== */}
      {assignModalTemplate && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full space-y-4 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-brand-teal-100 dark:bg-brand-teal-950 text-brand-teal-800 dark:text-brand-teal-300 text-[10px] font-black uppercase">
                    {assignModalTemplate.levelCode || 'A1'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {assignModalTemplate.questions?.length || 0} Questions • {assignModalTemplate.totalPoints || 10} Pts
                  </span>
                </div>
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  {assignModalTemplate.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'he' ? 'בחר תלמיד להקצאת שיעור בית אינטראקטיבי זה:' : 'Search and select a student to assign this interactive drill:'}
                </p>
              </div>
              <button
                onClick={() => setAssignModalTemplate(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="overflow-y-auto space-y-4 flex-1 pr-1">
              {/* Student Search */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'he' ? 'חפש תלמיד לפי שם או אימייל:' : 'Search student by name or email:'}
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute top-3 left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={assignStudentSearch}
                    onChange={(e) => setAssignStudentSearch(e.target.value)}
                    placeholder={language === 'he' ? 'הקלד שם תלמיד...' : 'Type student name...'}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-teal-500"
                  />
                </div>

                {/* Filtered Students List */}
                <div className="mt-2 max-h-48 overflow-y-auto space-y-1.5 p-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                  {studentsData
                    ?.filter((s: any) => {
                      const student = s.student || s;
                      const u = student.user || s.user;
                      const name = `${u?.firstName || ''} ${u?.lastName || ''}`.toLowerCase();
                      const email = (u?.email || '').toLowerCase();
                      const q = assignStudentSearch.toLowerCase().trim();
                      return !q || name.includes(q) || email.includes(q);
                    })
                    .map((s: any) => {
                      const student = s.student || s;
                      const u = student.user || s.user;
                      const isSelected = assignSelectedStudentId === student.id;

                      return (
                        <div
                          key={student.id}
                          onClick={() => setAssignSelectedStudentId(student.id)}
                          className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-brand-teal-700 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-150 dark:border-slate-750'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-brand-teal-100 text-brand-teal-800'
                            }`}>
                              {u?.firstName?.charAt(0) || 'S'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs truncate">
                                {u?.firstName || 'Student'} {u?.lastName || ''}
                              </p>
                              <p className={`text-[10px] truncate ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>
                                {u?.email}
                              </p>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                        </div>
                      );
                    })}

                  {(!studentsData || studentsData.length === 0) && (
                    <p className="text-xs text-slate-400 p-4 text-center">
                      {language === 'he' ? 'אין תלמידים רשומים כרגע.' : 'No enrolled students found.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'he' ? 'תאריך יעד להגשה (אופציונלי)' : 'Due Date / Deadline (Optional)'}
                </label>
                <input
                  type="date"
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs"
                />
              </div>

              {/* Custom Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'he' ? 'הערה אישית לתלמיד (אופציונלי)' : 'Teacher Note / Hint for Student (Optional)'}
                </label>
                <input
                  type="text"
                  value={assignCustomNotes}
                  onChange={(e) => setAssignCustomNotes(e.target.value)}
                  placeholder={language === 'he' ? 'לדוגמה: שים לב לפעלים בזמן עבר...' : 'e.g. Focus on past tense verbs...'}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAssignModalTemplate(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!assignSelectedStudentId) {
                    toast.warning(language === 'he' ? 'אנא בחר תלמיד מהרשימה' : 'Please select a student');
                    return;
                  }
                  assignTemplateMutation.mutate({
                    templateId: assignModalTemplate.id,
                    studentId: assignSelectedStudentId,
                    dueDate: assignDueDate ? new Date(assignDueDate).toISOString() : undefined,
                    customNotes: assignCustomNotes.trim() || undefined,
                  });
                }}
                disabled={!assignSelectedStudentId || assignTemplateMutation.isPending}
                className="px-6 py-2.5 text-xs font-black bg-brand-teal-700 hover:bg-brand-teal-800 text-white rounded-xl shadow-md disabled:opacity-50 transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-lime-300" />
                <span>
                  {assignTemplateMutation.isPending
                    ? (language === 'he' ? 'מקצה...' : 'Assigning...')
                    : (language === 'he' ? 'הקצה שיעור בית לתלמיד' : 'Confirm & Assign Homework')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: TEACHER TEMPLATE PREVIEW                      */}
      {/* ==================================================== */}
      {previewTemplateTeacher && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  {previewTemplateTeacher.title}
                </h3>
                <span className="text-xs text-brand-teal-700 dark:text-brand-teal-400 font-bold">
                  {previewTemplateTeacher.levelCode} • {previewTemplateTeacher.questions?.length || 0} Questions
                </span>
              </div>
              <button
                onClick={() => setPreviewTemplateTeacher(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 py-4 flex-1">
              <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-900/60 space-y-1.5">
                <span className="text-xs font-black text-brand-teal-800 dark:text-brand-teal-300 block">
                  📖 {previewTemplateTeacher.readingPassageTitle || 'Reading Comprehension Passage'}
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-serif">
                  {previewTemplateTeacher.readingPassage}
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  {language === 'he' ? 'שאלות המבחן:' : 'Comprehension Questions:'}
                </span>
                {previewTemplateTeacher.questions?.map((q: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white">{i + 1}. {q.prompt}</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      ✓ {language === 'he' ? 'תשובה נכונה:' : 'Correct:'} {q.correctAnswer}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setPreviewTemplateTeacher(null)}
                className="px-5 py-2 rounded-xl bg-brand-teal-700 text-white font-bold text-xs"
              >
                {language === 'he' ? 'סגור' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: TEACHER INSPECT STUDENT ANSWERS               */}
      {/* ==================================================== */}
      {inspectHwSubmission && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    {inspectHwSubmission.title}
                  </h3>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                    (inspectHwSubmission.percentage ?? 0) >= 70
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}>
                    🎯 {inspectHwSubmission.percentage}% ({inspectHwSubmission.score}/{inspectHwSubmission.maxScore} Pts)
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'he' ? 'תלמיד:' : 'Student:'} {inspectHwSubmission.student?.user?.firstName} {inspectHwSubmission.student?.user?.lastName} • {new Date(inspectHwSubmission.submittedAt || inspectHwSubmission.updatedAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setInspectHwSubmission(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 py-4 flex-1">
              {/* Reading Passage snippet */}
              {inspectHwSubmission.template?.readingPassage && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-xs font-black text-brand-teal-700 dark:text-brand-teal-400 block">
                    📖 {inspectHwSubmission.template?.readingPassageTitle || 'Reading Comprehension Passage'}
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-serif line-clamp-4">
                    {inspectHwSubmission.template?.readingPassage}
                  </p>
                </div>
              )}

              {/* Student Answers Breakdown */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  {language === 'he' ? 'פירוט תשובות התלמיד:' : 'Student Answers Breakdown:'}
                </span>

                {(inspectHwSubmission.template?.questions || []).map((q: any, i: number) => {
                  const studentAns = inspectHwSubmission.submittedAnswers?.[q.id];
                  const isCorrect = String(studentAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();

                  return (
                    <div
                      key={q.id || i}
                      className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                        isCorrect
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {i + 1}. {q.prompt}
                        </p>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black shrink-0 ${
                          isCorrect ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                        }`}>
                          {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-500">
                          {language === 'he' ? 'תשובת התלמיד:' : 'Student answered:'}{' '}
                          <strong className={isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}>
                            {studentAns !== undefined ? String(studentAns) : '(None)'}
                          </strong>
                        </span>

                        {!isCorrect && (
                          <span className="text-slate-500">
                            • {language === 'he' ? 'התשובה הנכונה:' : 'Correct:'}{' '}
                            <strong className="text-emerald-700 dark:text-emerald-400">{q.correctAnswer}</strong>
                          </span>
                        )}
                      </div>

                      {q.explanation && (
                        <p className="text-[11px] text-slate-500 italic">
                          💡 {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectHwSubmission(null)}
                className="px-5 py-2 rounded-xl bg-brand-teal-700 text-white font-bold text-xs"
              >
                {language === 'he' ? 'סגור' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Recorded Session Modal */}
      {isCreatingRecording && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {language === 'he' ? 'הוספת שיעור מוקלט מ-Google Drive' : 'Add Recorded Session (Google Drive)'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'he'
                    ? 'העלה קישור לסרטון שיוצג בנגן התלמיד לפי קטגוריה או מספר שיעור.'
                    : 'Provide a Google Drive video link to appear in the student video player portal.'}
                </p>
              </div>
              <button
                onClick={() => setIsCreatingRecording(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'he' ? 'תלמיד יעד (או כללי)' : 'Target Student'}
                </label>
                <select
                  value={recStudentId}
                  onChange={(e) => setRecStudentId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs"
                >
                  <option value="">{language === 'he' ? 'כל התלמידים (שיעור פתוח)' : 'All Students (Open Library)'}</option>
                  {studentsData?.map((s: any) => {
                    const student = s.student || s;
                    const u = student.user || s.user;
                    return (
                      <option key={student.id} value={student.id}>
                        {u?.firstName || 'Student'} {u?.lastName || ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'he' ? 'קטגוריית נושא' : 'Topic Category'}
                </label>
                <select
                  value={recCategory}
                  onChange={(e) => setRecCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs"
                >
                  <option value="Grammar / דקדוק">Grammar / דקדוק</option>
                  <option value="Vocabulary / אוצר מילים">Vocabulary / אוצר מילים</option>
                  <option value="Speaking / שיחה וביטוי">Speaking / שיחה וביטוי</option>
                  <option value="Reading & Pronunciation / קריאה">Reading & Pronunciation / קריאה</option>
                  <option value="Slang & Daily Life / סלנג ויומיום">Slang & Daily Life / סלנג ויומיום</option>
                  <option value="General Lesson / שיעור כללי">General Lesson / שיעור כללי</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'he' ? 'מספר שיעור' : 'Session #'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={recSessionNumber}
                  onChange={(e) => setRecSessionNumber(parseInt(e.target.value) || 1)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'he' ? 'משך זמן (דקות)' : 'Duration (minutes)'}
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={recDuration}
                  onChange={(e) => setRecDuration(parseInt(e.target.value) || 25)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'he' ? 'כותרת השיעור (אנגלית)' : 'Session Title (English)'}
              </label>
              <input
                type="text"
                value={recTitle}
                onChange={(e) => setRecTitle(e.target.value)}
                placeholder="e.g. Master the Pa'al Verb Conjugation in Present"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'he' ? 'כותרת בעברית (אופציונלי)' : 'Hebrew Title (Optional)'}
              </label>
              <input
                type="text"
                dir="rtl"
                value={recTitleHe}
                onChange={(e) => setRecTitleHe(e.target.value)}
                placeholder="לדוגמה: שליטה בבניין פעל בהווה"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'he' ? 'קישור לסרטון מ-Google Drive / YouTube' : 'Google Drive / YouTube Video Link'}
              </label>
              <input
                type="url"
                value={recVideoUrl}
                onChange={(e) => setRecVideoUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/.../view or YouTube"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs"
              />
              {recVideoUrl && (
                <div className="mt-1 flex items-center gap-1 text-[11px] text-brand-teal-700 dark:text-brand-teal-400">
                  <Check className="w-3 h-3" />
                  <span>
                    {isGoogleDriveUrl(recVideoUrl)
                      ? (language === 'he' ? 'זוהה קישור Google Drive - יוצג בנגן המובנה' : 'Google Drive video detected - ready for in-app stream')
                      : (language === 'he' ? 'קישור וידאו נתמך' : 'Video link supported')}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'he' ? 'תיאור והערות לשיעור (אופציונלי)' : 'Session Notes / Key Takeaways (Optional)'}
              </label>
              <textarea
                value={recDesc}
                onChange={(e) => setRecDesc(e.target.value)}
                placeholder={
                  language === 'he'
                    ? 'סיכום נקודות עיקריות, מילים חדשות שלמדנו, או דגשים להאזנה חוזרת...'
                    : 'Summarize key grammar rules, vocabulary learned, or homework hints...'
                }
                rows={2}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCreatingRecording(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </button>
              <button
                onClick={() =>
                  createRecordedSessionMutation.mutate({
                    studentId: recStudentId || undefined,
                    title: recTitle,
                    titleHe: recTitleHe || undefined,
                    description: recDesc || undefined,
                    category: recCategory,
                    sessionNumber: Number(recSessionNumber),
                    videoUrl: recVideoUrl,
                    durationMinutes: Number(recDuration),
                  })
                }
                disabled={!recTitle || !recVideoUrl || createRecordedSessionMutation.isPending}
                className="px-5 py-2 text-xs font-bold bg-brand-teal-800 hover:bg-brand-teal-900 text-white rounded-xl shadow-xs disabled:opacity-50 transition-colors"
              >
                {createRecordedSessionMutation.isPending
                  ? (language === 'he' ? 'שומר...' : 'Saving...')
                  : (language === 'he' ? 'פרסם שיעור מוקלט' : 'Publish Recording')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Progress Detail Drawer Modal */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <AvatarWithFrame
                  avatarUrl={selectedStudentDetail.user?.avatarUrl}
                  studentName={`${selectedStudentDetail.user?.firstName || ''} ${selectedStudentDetail.user?.lastName || ''}`.trim() || 'Student'}
                  frameItem={selectedStudentDetail.equippedAvatarFrame}
                  size="lg"
                />
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    <StyledNickname
                      name={`${selectedStudentDetail.user?.firstName || ''} ${selectedStudentDetail.user?.lastName || ''}`.trim()}
                      nicknameItem={selectedStudentDetail.equippedNickname}
                    />
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedStudentDetail.user?.email} • {t(`levels.${selectedStudentDetail.level || 'BEGINNER'}`)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                  {language === 'he' ? 'שיעורים שהושלמו' : 'Completed'}
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedStudentDetail.stats?.completedLessons || 0}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                  {language === 'he' ? 'שיעורים שנותרו' : 'Remaining'}
                </span>
                <span className="text-lg font-black text-brand-teal-700 dark:text-brand-teal-400">
                  {selectedStudentDetail.stats?.packageRemainingLessons || 0}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                  {language === 'he' ? 'סה״כ נקודות' : 'Total Points'}
                </span>
                <span className="text-lg font-black text-brand-olive-600 dark:text-brand-olive-400">
                  {selectedStudentDetail.totalPoints || 0}
                </span>
              </div>
            </div>

            {/* Homework overview for this student */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {language === 'he' ? 'סטטיסטיקת שיעורי בית' : 'Homework Track Record'}
              </h4>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs">
                <span>{language === 'he' ? 'סה״כ משימות שהוקצו:' : 'Total Assigned Homework:'}</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedStudentDetail.stats?.homeworkTotal || 0}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs">
                <span>{language === 'he' ? 'ממתינים לבדיקה:' : 'Pending Reviews:'}</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {selectedStudentDetail.stats?.pendingHomework || 0}
                </span>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const target = selectedStudentDetail;
                  setSelectedStudentDetail(null);
                  setExamModalStudent(target);
                }}
                className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-indigo-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>
                  {language === 'ar'
                    ? 'فتح امتحان المستوى'
                    : language === 'he'
                    ? 'פתח מבחן רמה'
                    : 'Open Level Exam'}
                </span>
              </button>
              <button
                onClick={() => {
                  setHwStudentId(selectedStudentDetail.id);
                  setSelectedStudentDetail(null);
                  setIsAssigningHw(true);
                }}
                className="px-4 py-2 bg-brand-teal-800 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-brand-teal-900 transition-colors"
              >
                + {language === 'he' ? 'הקצאת שיעורי בית' : 'Assign Homework'}
              </button>
              <button
                onClick={() => {
                  setRecStudentId(selectedStudentDetail.id);
                  setSelectedStudentDetail(null);
                  setIsCreatingRecording(true);
                }}
                className="px-4 py-2 bg-brand-olive-500 text-slate-950 font-bold text-xs rounded-xl shadow-xs hover:bg-brand-olive-600 transition-colors"
              >
                + {language === 'he' ? 'הוספת הקלטה' : 'Add Recording'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open Level Exam Modal */}
      {examModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 my-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {language === 'ar'
                      ? 'فتح امتحان انتقال المستوى'
                      : language === 'he'
                      ? 'פתיחת מבחן מעבר רמה'
                      : 'Open Level Transition Exam'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {`${examModalStudent.user?.firstName || ''} ${examModalStudent.user?.lastName || ''}`.trim()}{' '}
                    • {t(`levels.${examModalStudent.level || 'BEGINNER'}`)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExamModalStudent(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isLevelExamsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div key={n} className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3 max-h-[55vh] overflow-y-auto pe-1">
                {[...levelExams]
                  .filter((ex) => ex.isActive)
                  .sort((a, b) => {
                    const aMatch = a.level?.code === examModalStudent.level ? 0 : 1;
                    const bMatch = b.level?.code === examModalStudent.level ? 0 : 1;
                    return aMatch - bMatch;
                  })
                  .map((exam) => {
                    const isCurrentLevel = exam.level?.code === examModalStudent.level;
                    const isOpening = openingExamId === exam.id && openLevelExamMutation.isPending;
                    const examTitle =
                      language === 'he' ? exam.titleHe || exam.title : exam.title;
                    const questionCount = Array.isArray(exam.questions) ? exam.questions.length : 0;

                    return (
                      <div
                        key={exam.id}
                        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                          isCurrentLevel
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700'
                            : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {examTitle}
                            </span>
                            {isCurrentLevel && (
                              <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black">
                                {language === 'ar'
                                  ? 'المستوى الحالي'
                                  : language === 'he'
                                  ? 'הרמה הנוכחית'
                                  : 'Current Level'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                            <span>
                              {language === 'ar'
                                ? `${questionCount} أسئلة`
                                : language === 'he'
                                ? `${questionCount} שאלות`
                                : `${questionCount} questions`}
                            </span>
                            <span>•</span>
                            <span>
                              {language === 'ar'
                                ? `درجة النجاح: ${exam.passingScore}%`
                                : language === 'he'
                                ? `ציון עובר: ${exam.passingScore}%`
                                : `Passing: ${exam.passingScore}%`}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={openLevelExamMutation.isPending}
                          onClick={() => {
                            setOpeningExamId(exam.id);
                            openLevelExamMutation.mutate({
                              examId: exam.id,
                              studentId: examModalStudent.id,
                            });
                          }}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-xs transition shrink-0 cursor-pointer disabled:opacity-60"
                        >
                          {isOpening
                            ? language === 'ar'
                              ? 'جاري الفتح...'
                              : language === 'he'
                              ? 'פותח...'
                              : 'Opening...'
                            : language === 'ar'
                            ? 'فتح الامتحان'
                            : language === 'he'
                            ? 'פתח מבחן'
                            : 'Unlock Exam'}
                        </button>
                      </div>
                    );
                  })}

                {levelExams.filter((ex) => ex.isActive).length === 0 && (
                  <p className="text-xs text-slate-400 py-8 text-center">
                    {language === 'ar'
                      ? 'لا توجد امتحانات مستوى نشطة حالياً.'
                      : language === 'he'
                      ? 'אין מבחני רמה פעילים כרגע.'
                      : 'No active level exams available.'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reusable In-System Google Drive & External Viewer Modal */}
      <DriveViewerModal
        isOpen={!!viewerUrl}
        onClose={() => setViewerUrl(null)}
        url={viewerUrl || ''}
        title={viewerTitle}
        subtitle={viewerSubtitle}
      />

      {/* Structured Lesson Notes & Study Guide Editor Modal */}
      <StructuredNotesEditorModal
        isOpen={!!structuredNotesLesson}
        lessonId={structuredNotesLesson?.id || ''}
        initialNotes={structuredNotesLesson?.teacherNotes}
        initialRecordingUrl={structuredNotesLesson?.recordingUrl}
        onClose={() => setStructuredNotesLesson(null)}
      />

      {/* Delete Game Confirmation Modal (No browser alerts/confirms!) */}
      {deletingGameId && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  {language === 'he' ? 'מחיקת משחק' : 'Delete Game'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'he'
                    ? 'האם אתה בטוח שברצונך להסיר משחק זה לצמיתות?'
                    : 'Are you sure you want to permanently delete this game?'}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingGameId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  deleteGameMutation.mutate(deletingGameId);
                  setDeletingGameId(null);
                }}
                disabled={deleteGameMutation.isPending}
                className="px-4 py-2 text-xs font-bold bg-rose-600 text-white rounded-xl shadow-xs hover:bg-rose-700 disabled:opacity-50 transition-colors"
              >
                {deleteGameMutation.isPending
                  ? language === 'he'
                    ? 'מוחק...'
                    : 'Deleting...'
                  : language === 'he'
                  ? 'מחק משחק'
                  : 'Delete Game'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Game Play-Test / Preview Modal */}
      {previewGame && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full my-8 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Top Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-brand-teal-50 dark:bg-brand-teal-950/80 text-brand-teal-800 dark:text-brand-teal-300">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-brand-teal-100 dark:bg-brand-teal-900 text-brand-teal-800 dark:text-brand-teal-300">
                      {previewGame.gameType}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {t(`levels.${previewGame.level || 'BEGINNER'}`)}
                    </span>
                    {previewGame.lesson && (
                      <span className="text-[11px] text-brand-olive-700 dark:text-brand-olive-300 font-medium">
                        • {language === 'he' ? 'שיעור עם' : 'Lesson with'} {previewGame.lesson.student?.user?.firstName || 'Student'}
                      </span>
                    )}
                  </div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    {language === 'he' ? previewGame.titleHe : previewGame.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setPreviewGame(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title={language === 'he' ? 'סגור תצוגה מקדימה' : 'Close Preview'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Game Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {previewGame.gameType === 'FLASHCARD' && (
                <FlashcardGame
                  gameId={previewGame.id || 'preview'}
                  title={language === 'he' ? previewGame.titleHe : previewGame.title}
                  titleHe={previewGame.titleHe}
                  cards={previewGame.configJson?.cards || []}
                  pointsReward={previewGame.pointsReward || 20}
                  onFinish={() => {
                    toast.success(
                      language === 'he'
                        ? 'סיימת בהצלחה את בדיקת הכרטיסיות!'
                        : 'Flashcard preview completed successfully!'
                    );
                    setPreviewGame(null);
                  }}
                />
              )}
              {previewGame.gameType === 'MATCHING' && (
                <MatchingGame
                  gameId={previewGame.id || 'preview'}
                  title={language === 'he' ? previewGame.titleHe : previewGame.title}
                  titleHe={previewGame.titleHe}
                  pairs={previewGame.configJson?.pairs || []}
                  pointsReward={previewGame.pointsReward || 20}
                  onFinish={() => {
                    toast.success(
                      language === 'he'
                        ? 'סיימת בהצלחה את בדיקת התאמת המילים!'
                        : 'Matching game preview completed successfully!'
                    );
                    setPreviewGame(null);
                  }}
                />
              )}
              {previewGame.gameType === 'QUIZ' && (
                <QuizGame
                  gameId={previewGame.id || 'preview'}
                  title={language === 'he' ? previewGame.titleHe : previewGame.title}
                  titleHe={previewGame.titleHe}
                  questions={previewGame.configJson?.questions || []}
                  pointsReward={previewGame.pointsReward || 20}
                  onFinish={() => {
                    toast.success(
                      language === 'he'
                        ? 'סיימת בהצלחה את בדיקת החידון!'
                        : 'Quiz preview completed successfully!'
                    );
                    setPreviewGame(null);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Game Creator / Editor Modal */}
      {isCustomizingGame && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full my-6 flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-brand-teal-50 dark:bg-brand-teal-950/80 text-brand-teal-800 dark:text-brand-teal-300">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-lg">
                    {editingGameId
                      ? language === 'he'
                        ? 'עריכת משחק מותאם אישית'
                        : 'Edit Custom Hebrew Game'
                      : language === 'he'
                      ? 'יצירת משחק מותאם אישית'
                      : 'Create Custom Hebrew Game'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === 'he'
                      ? 'התאם את הפורמט, רמת השליטה והשיעור עבור התלמיד שלך'
                      : 'Configure the game format, Hebrew level, and linked lesson'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomizingGame(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title={language === 'he' ? 'סגור' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700 dark:text-slate-300">
              {/* SECTION 1: FORMAT SELECTION */}
              <div className="space-y-2">
                <label className="font-bold text-slate-900 dark:text-white text-xs block">
                  {language === 'he' ? '1. בחר פורמט משחק אינטראקטיבי:' : '1. Select Interactive Game Format:'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setGameType('FLASHCARD');
                      loadPresetForLevel(gameLevel, 'FLASHCARD');
                    }}
                    className={`p-3.5 rounded-2xl border text-start transition-all flex flex-col justify-between ${
                      gameType === 'FLASHCARD'
                        ? 'border-brand-teal-800 bg-brand-teal-50/70 dark:bg-brand-teal-950/60 dark:border-brand-teal-500 ring-2 ring-brand-teal-600/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <BookOpen className="w-5 h-5 text-brand-teal-700 dark:text-brand-teal-400" />
                      {gameType === 'FLASHCARD' && <Check className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-400" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                        {language === 'he' ? 'כרטיסיות מילים' : 'Flashcards'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {language === 'he' ? 'תרגול אוצר מילים, ניקוד והשמעת אודיו' : 'Vocabulary, nikud & speech pronunciation'}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGameType('MATCHING');
                      loadPresetForLevel(gameLevel, 'MATCHING');
                    }}
                    className={`p-3.5 rounded-2xl border text-start transition-all flex flex-col justify-between ${
                      gameType === 'MATCHING'
                        ? 'border-brand-teal-800 bg-brand-teal-50/70 dark:bg-brand-teal-950/60 dark:border-brand-teal-500 ring-2 ring-brand-teal-600/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Layers className="w-5 h-5 text-brand-olive-700 dark:text-brand-olive-400" />
                      {gameType === 'MATCHING' && <Check className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-400" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                        {language === 'he' ? 'התאמת מילים' : 'Word Matching'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {language === 'he' ? 'חיבור זוגות מילים בין עברית לאנגלית' : 'Fast-paced Hebrew-English word pairing'}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGameType('QUIZ');
                      loadPresetForLevel(gameLevel, 'QUIZ');
                    }}
                    className={`p-3.5 rounded-2xl border text-start transition-all flex flex-col justify-between ${
                      gameType === 'QUIZ'
                        ? 'border-brand-teal-800 bg-brand-teal-50/70 dark:bg-brand-teal-950/60 dark:border-brand-teal-500 ring-2 ring-brand-teal-600/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      {gameType === 'QUIZ' && <Check className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-400" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                        {language === 'he' ? 'חידון אמריקאי' : 'Timed Quiz'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {language === 'he' ? 'שאלות 4 אפשרויות עם זיהוי תשובה נכונה' : '4-option timed questions with score tracking'}
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* SECTION 2: HEBREW LEVEL & LINKED LESSON */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-900 dark:text-white">
                      {language === 'he' ? '2. רמת שליטה בעברית:' : '2. Hebrew Proficiency Level:'}
                    </label>
                    <button
                      type="button"
                      onClick={() => loadPresetForLevel(gameLevel, gameType)}
                      className="text-[11px] font-bold text-brand-teal-700 dark:text-brand-teal-400 hover:underline inline-flex items-center gap-1"
                      title={language === 'he' ? 'טען תבנית תוכן לרמה זו' : 'Load template content for this level'}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{language === 'he' ? 'טען תבנית רמה' : 'Load Level Preset'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(['BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'ADVANCED'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          setGameLevel(lvl);
                          loadPresetForLevel(lvl, gameType);
                        }}
                        className={`py-2 px-3 rounded-xl font-bold text-xs transition-colors ${
                          gameLevel === lvl
                            ? 'bg-brand-teal-800 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                        }`}
                      >
                        {t(`levels.${lvl}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-slate-900 dark:text-white">
                    {language === 'he' ? '3. שיוך לשיעור ספציפי (אופציונלי):' : '3. Link to Specific Lesson (Optional):'}
                  </label>
                  <select
                    value={gameLessonId}
                    onChange={(e) => setGameLessonId(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs"
                  >
                    <option value="">
                      {language === 'he'
                        ? 'כללי - זמין לכל התלמידים (תכנית לימודים כללית)'
                        : 'General Curriculum (Available to all students)'}
                    </option>
                    {calendarData?.lessons?.map((l: any) => (
                      <option key={l.id} value={l.id}>
                        {l.student?.user?.firstName} {l.student?.user?.lastName} - {formatIsraelDateTime(l.scheduledAt)} ({l.durationMinutes || 25} {language === 'he' ? 'דק׳' : 'min'})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    {language === 'he'
                      ? 'כשמשחק משויך לשיעור, התלמיד יראה אותו מודגש כתרגול ישיר לחומר שנלמד בשיעור זה.'
                      : 'When linked to a lesson, the student sees it highlighted as practice directly tied to that session.'}
                  </p>
                </div>
              </div>

              {/* SECTION 3: TITLES & DETAILS */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-900 dark:text-white">
                      {language === 'he' ? 'כותרת באנגלית:' : 'Title in English:'}
                    </label>
                    <input
                      type="text"
                      value={gameTitle}
                      onChange={(e) => setGameTitle(e.target.value)}
                      placeholder="e.g. Daily Routines & Verbs"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-900 dark:text-white">
                      {language === 'he' ? 'כותרת בעברית:' : 'Title in Hebrew:'}
                    </label>
                    <input
                      type="text"
                      dir="rtl"
                      value={gameTitleHe}
                      onChange={(e) => setGameTitleHe(e.target.value)}
                      placeholder="לדוגמה: שגרת יום ופעלים"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="font-bold text-slate-900 dark:text-white">
                      {language === 'he' ? 'תיאור והוראות:' : 'Description & Instructions:'}
                    </label>
                    <input
                      type="text"
                      value={gameDesc}
                      onChange={(e) => setGameDesc(e.target.value)}
                      placeholder={
                        language === 'he'
                          ? 'תרגול אוצר מילים שנלמד בשיעור האחרון'
                          : 'Vocabulary practice from our recent session'
                      }
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-900 dark:text-white">
                      {language === 'he' ? 'נקודות תגמול:' : 'Reward Points:'}
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={gamePoints}
                      onChange={(e) => setGamePoints(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: DYNAMIC CONTENT BUILDER */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 dark:text-white text-xs">
                    {gameType === 'FLASHCARD'
                      ? language === 'he'
                        ? 'תוכן כרטיסיות המילים:'
                        : 'Flashcards Content:'
                      : gameType === 'MATCHING'
                      ? language === 'he'
                        ? 'זוגות מילים להתאמה:'
                        : 'Matching Word Pairs:'
                      : language === 'he'
                      ? 'שאלות החידון:'
                      : 'Quiz Questions:'}
                  </label>
                  {gameType === 'FLASHCARD' && (
                    <button
                      type="button"
                      onClick={() => setFlashcards([...flashcards, { front: '', back: '', example: '' }])}
                      className="px-3 py-1.5 bg-brand-teal-800 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-brand-teal-900 transition-colors inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{language === 'he' ? '+ הוסף כרטיסייה' : '+ Add Flashcard'}</span>
                    </button>
                  )}
                  {gameType === 'MATCHING' && (
                    <button
                      type="button"
                      onClick={() => setMatchingPairs([...matchingPairs, { hebrew: '', english: '' }])}
                      className="px-3 py-1.5 bg-brand-teal-800 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-brand-teal-900 transition-colors inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{language === 'he' ? '+ הוסף זוג מילים' : '+ Add Pair'}</span>
                    </button>
                  )}
                  {gameType === 'QUIZ' && (
                    <button
                      type="button"
                      onClick={() =>
                        setQuizQuestions([
                          ...quizQuestions,
                          {
                            question: '',
                            questionHe: '',
                            options: ['', '', '', ''],
                            correctIndex: 0,
                          },
                        ])
                      }
                      className="px-3 py-1.5 bg-brand-teal-800 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-brand-teal-900 transition-colors inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{language === 'he' ? '+ הוסף שאלת חידון' : '+ Add Question'}</span>
                    </button>
                  )}
                </div>

                {/* FLASHCARDS BUILDER */}
                {gameType === 'FLASHCARD' && (
                  <div className="space-y-3">
                    {flashcards.map((card, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row gap-3 items-start sm:items-center"
                      >
                        <span className="font-extrabold text-slate-400 w-6 shrink-0">#{idx + 1}</span>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                          <input
                            type="text"
                            dir="rtl"
                            placeholder={language === 'he' ? 'עברית (עם ניקוד)' : 'Hebrew front (with nikud)'}
                            value={card.front}
                            onChange={(e) => {
                              const updated = [...flashcards];
                              updated[idx].front = e.target.value;
                              setFlashcards(updated);
                            }}
                            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                          />
                          <input
                            type="text"
                            placeholder={language === 'he' ? 'תרגום לאנגלית' : 'English meaning'}
                            value={card.back}
                            onChange={(e) => {
                              const updated = [...flashcards];
                              updated[idx].back = e.target.value;
                              setFlashcards(updated);
                            }}
                            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                          />
                          <input
                            type="text"
                            dir="rtl"
                            placeholder={language === 'he' ? 'משפט לדוגמה (אופציונלי)' : 'Example sentence (optional)'}
                            value={card.example || ''}
                            onChange={(e) => {
                              const updated = [...flashcards];
                              updated[idx].example = e.target.value;
                              setFlashcards(updated);
                            }}
                            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setFlashcards(flashcards.filter((_, i) => i !== idx))}
                          disabled={flashcards.length <= 1}
                          className="p-2 text-rose-500 hover:text-rose-700 disabled:opacity-30 rounded-xl transition-colors"
                          title={language === 'he' ? 'הסר כרטיסייה' : 'Remove card'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* MATCHING BUILDER */}
                {gameType === 'MATCHING' && (
                  <div className="space-y-3">
                    {matchingPairs.map((pair, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row gap-3 items-start sm:items-center"
                      >
                        <span className="font-extrabold text-slate-400 w-6 shrink-0">#{idx + 1}</span>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                          <input
                            type="text"
                            dir="rtl"
                            placeholder={language === 'he' ? 'מילה בעברית' : 'Hebrew term'}
                            value={pair.hebrew}
                            onChange={(e) => {
                              const updated = [...matchingPairs];
                              updated[idx].hebrew = e.target.value;
                              setMatchingPairs(updated);
                            }}
                            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                          />
                          <input
                            type="text"
                            placeholder={language === 'he' ? 'תרגום מקביל באנגלית' : 'English translation match'}
                            value={pair.english}
                            onChange={(e) => {
                              const updated = [...matchingPairs];
                              updated[idx].english = e.target.value;
                              setMatchingPairs(updated);
                            }}
                            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setMatchingPairs(matchingPairs.filter((_, i) => i !== idx))}
                          disabled={matchingPairs.length <= 2}
                          className="p-2 text-rose-500 hover:text-rose-700 disabled:opacity-30 rounded-xl transition-colors"
                          title={language === 'he' ? 'הסר זוג' : 'Remove pair'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* QUIZ BUILDER */}
                {gameType === 'QUIZ' && (
                  <div className="space-y-4">
                    {quizQuestions.map((q, qIdx) => (
                      <div
                        key={qIdx}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                            {language === 'he' ? `שאלה #${qIdx + 1}` : `Question #${qIdx + 1}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuizQuestions(quizQuestions.filter((_, i) => i !== qIdx))}
                            disabled={quizQuestions.length <= 1}
                            className="p-1.5 text-rose-500 hover:text-rose-700 disabled:opacity-30 rounded-lg transition-colors"
                            title={language === 'he' ? 'הסר שאלה' : 'Remove question'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder={language === 'he' ? 'שאלה באנגלית' : 'Question prompt (English)'}
                            value={q.question}
                            onChange={(e) => {
                              const updated = [...quizQuestions];
                              updated[qIdx].question = e.target.value;
                              setQuizQuestions(updated);
                            }}
                            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                          />
                          <input
                            type="text"
                            dir="rtl"
                            placeholder={language === 'he' ? 'שאלה בעברית' : 'Question prompt (Hebrew)'}
                            value={q.questionHe}
                            onChange={(e) => {
                              const updated = [...quizQuestions];
                              updated[qIdx].questionHe = e.target.value;
                              setQuizQuestions(updated);
                            }}
                            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                            {language === 'he' ? '4 אפשרויות בחירה (סמן את התשובה הנכונה):' : '4 Options (select the correct answer radio):'}
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt, optIdx) => (
                              <div
                                key={optIdx}
                                className={`flex items-center gap-2 p-2 rounded-xl border ${
                                  q.correctIndex === optIdx
                                    ? 'border-brand-teal-800 bg-brand-teal-50 dark:bg-brand-teal-950/40 dark:border-brand-teal-600'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`correct-${qIdx}`}
                                  checked={q.correctIndex === optIdx}
                                  onChange={() => {
                                    const updated = [...quizQuestions];
                                    updated[qIdx].correctIndex = optIdx;
                                    setQuizQuestions(updated);
                                  }}
                                  className="accent-brand-teal-800 shrink-0"
                                />
                                <input
                                  type="text"
                                  placeholder={language === 'he' ? `אפשרות ${optIdx + 1}` : `Option ${optIdx + 1}`}
                                  value={opt}
                                  onChange={(e) => {
                                    const updated = [...quizQuestions];
                                    updated[qIdx].options[optIdx] = e.target.value;
                                    setQuizQuestions(updated);
                                  }}
                                  className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-hidden"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/80 dark:bg-slate-850">
              <button
                type="button"
                onClick={() => setIsCustomizingGame(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveCustomGame}
                disabled={saveGameMutation.isPending}
                className="px-6 py-2.5 text-xs font-bold bg-brand-teal-800 hover:bg-brand-teal-900 dark:bg-brand-teal-700 dark:hover:bg-brand-teal-600 text-white rounded-xl shadow-xs disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-brand-olive-300" />
                <span>
                  {saveGameMutation.isPending
                    ? language === 'he'
                      ? 'שומר...'
                      : 'Saving...'
                    : language === 'he'
                    ? 'שמור ופרסם משחק'
                    : 'Save & Publish Game'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* CONFIGURE SLOT & ADD ZOOM LINK MODAL */}
      {isConfiguringSlot && selectedSlotBlock && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-5 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-teal-50 dark:bg-brand-teal-950/80 text-brand-teal-800 dark:text-brand-teal-300 flex items-center justify-center font-bold">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    {language === 'he' ? 'פתיחת שעת זמינות והגדרת זום' : 'Open Availability Slot & Add Zoom'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === 'he'
                      ? 'חובה להזין קישור זום לחיבור ישיר בין התלמיד, המורה ובעל הפלטפורמה'
                      : 'Zoom meeting link is required for seamless student, teacher & owner access'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsConfiguringSlot(false);
                  setSelectedSlotBlock(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Slot Details Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {language === 'he' ? 'תאריך ושעה:' : 'Date & Israel Time:'}
                </span>
                <span className="font-black text-slate-900 dark:text-white">
                  {selectedSlotBlock.slotLabel}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
                📅 {selectedSlotBlock.formattedDate}
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                <Clock className="w-3 h-3" />
                <span>{language === 'he' ? 'משבצת זמינות • פתוחה לשיעורי 25, 40 או 55 דק׳' : 'Open Slot • Accepts 25, 40, or 55 min sessions'}</span>
              </div>
            </div>

            {/* Zoom Link Input */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-400" />
                    <span>{language === 'he' ? 'קישור לפגישת זום (חובה)' : 'Zoom Meeting Link (Required)'}</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  {calendarData?.defaultZoomLink && (
                    <button
                      type="button"
                      onClick={() => setSlotZoomLink(calendarData.defaultZoomLink)}
                      className="text-[10px] font-bold text-brand-teal-800 dark:text-brand-teal-400 hover:underline"
                    >
                      {language === 'he' ? 'השתמש בקישור הקבוע שלי' : 'Use default link'}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="url"
                    value={slotZoomLink}
                    onChange={(e) => setSlotZoomLink(e.target.value)}
                    placeholder="https://zoom.us/j/1234567890"
                    dir="ltr"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {language === 'he'
                    ? 'קישור זה ישויך ישירות לשיעור בעת ההזמנה, ויוצג לתלמיד, למורה ובמרכז הבקרה של בעל הפלטפורמה.'
                    : 'This Zoom link will be automatically attached to booked lessons and accessible to the student, instructor, and Platform Owner.'}
                </p>
              </div>

              {/* Save as default checkbox */}
              <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={saveZoomAsDefault}
                  onChange={(e) => setSaveZoomAsDefault(e.target.checked)}
                  className="rounded border-slate-300 text-brand-teal-800 focus:ring-brand-teal-800 w-4 h-4"
                />
                <span className="font-semibold">
                  {language === 'he'
                    ? 'שמור קישור זה כברירת המחדל שלי לשיעורים הבאים'
                    : 'Save as my default Zoom room for future slots'}
                </span>
              </label>
            </div>

            {/* Modal Buttons */}
            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsConfiguringSlot(false);
                  setSelectedSlotBlock(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmSlot}
                disabled={addSlotMutation.isPending || !slotZoomLink.trim()}
                className="flex-1 py-2.5 rounded-xl bg-brand-teal-800 hover:bg-brand-teal-900 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>
                  {addSlotMutation.isPending
                    ? (language === 'he' ? 'פותח שעה...' : 'Opening Slot...')
                    : (language === 'he' ? 'אישור ופתיחת שעה' : 'Confirm & Open Slot')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COPY SCHEDULE TO OTHER DAYS MODAL */}
      {isCopyScheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-olive-50 dark:bg-brand-olive-950/80 text-brand-olive-700 dark:text-brand-olive-300 flex items-center justify-center font-bold">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    {language === 'he' ? 'העתקת שעות זמינות לימים נוספים' : 'Copy Availability to Other Days'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === 'he'
                      ? `העתק את ${slots.filter((s: any) => s.dayOfWeek === selectedDay).length} השעות מיום ${DAYS_HE[selectedDay]}`
                      : `Copy ${slots.filter((s: any) => s.dayOfWeek === selectedDay).length} slots from ${DAYS[selectedDay]}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCopyScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Day Pickers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'he' ? 'בחר ימי יעד להעתקה:' : 'Select Target Days to Apply:'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const weekdays = [0, 1, 2, 3, 4, 5, 6].filter((d) => d !== selectedDay && d !== 6);
                    setTargetCopyDays(weekdays);
                  }}
                  className="text-[11px] font-bold text-brand-teal-700 dark:text-brand-teal-300 hover:underline cursor-pointer"
                >
                  {language === 'he' ? 'בחר ימי חול (א׳–ה׳)' : 'Select Weekdays'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {DAYS.map((dName, dIdx) => {
                  if (dIdx === selectedDay) return null;
                  const isChecked = targetCopyDays.includes(dIdx);
                  return (
                    <button
                      key={dIdx}
                      type="button"
                      onClick={() => {
                        setTargetCopyDays((prev) =>
                          prev.includes(dIdx) ? prev.filter((d) => d !== dIdx) : [...prev, dIdx]
                        );
                      }}
                      className={`p-3 rounded-2xl border text-xs font-bold text-start flex items-center justify-between transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-brand-teal-800 text-white border-brand-teal-800 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{language === 'he' ? DAYS_HE[dIdx] : dName}</span>
                      {isChecked ? (
                        <Check className="w-4 h-4 text-brand-olive-300" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCopyScheduleModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (targetCopyDays.length === 0) {
                    toast.warning(language === 'he' ? 'נא לבחור לפחות יום יעד אחד' : 'Please select at least one target day');
                    return;
                  }
                  copyDaySlotsMutation.mutate(targetCopyDays);
                }}
                disabled={copyDaySlotsMutation.isPending || targetCopyDays.length === 0}
                className="px-5 py-2.5 rounded-xl bg-brand-teal-800 hover:bg-brand-teal-900 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {copyDaySlotsMutation.isPending ? (
                  <span>{language === 'he' ? 'מעתיק...' : 'Copying...'}</span>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>
                      {language === 'he'
                        ? `העתק ל-${targetCopyDays.length} ימים`
                        : `Apply to ${targetCopyDays.length} Days`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Capsule Island Bottom Navigation Bar (Mobile View) */}
      <nav
        aria-label="Mobile Navigation"
        className={`lg:hidden fixed left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-md z-40 transition-all duration-300 ${
          isMobileMoreOpen ? 'opacity-0 pointer-events-none translate-y-8' : 'opacity-100 pointer-events-auto translate-y-0'
        }`}
        style={{ bottom: 'max(calc(env(safe-area-inset-bottom, 0px) - 30px), 4px)' }}
      >
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4/5 h-10 bg-gradient-to-r from-brand-teal-500/20 via-teal-400/25 to-brand-olive-500/20 blur-xl pointer-events-none -z-10" />

        <div className="relative rounded-full py-2 px-3 floating-capsule-shell grid grid-cols-5 items-center justify-around gap-1">
          <div className="absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/90 dark:via-white/20 to-transparent pointer-events-none rounded-full" />

          {[
            { id: 'calendar', label: language === 'he' ? 'יומן' : 'Calendar', icon: CalendarIcon },
            { id: 'lessons', label: language === 'he' ? 'שיעורים' : 'Lessons', icon: Video },
            { id: 'students', label: language === 'he' ? 'תלמידים' : 'Students', icon: Users },
            { id: 'homework', label: language === 'he' ? 'שיעורי בית' : 'Homework', icon: BookOpen },
            { id: 'more', label: language === 'he' ? 'עוד' : 'More', icon: Sliders },
          ].map((item) => {
            const Icon = item.icon;
            const isSecondaryActive = activeTab === 'recordings' || activeTab === 'games';
            const isActive =
              (item.id === 'more' && (isMobileMoreOpen || isSecondaryActive)) ||
              (item.id !== 'more' && activeTab === item.id);

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
                  {language === 'he' ? 'כלים ותכנים נוספים' : 'Additional Teaching Tools'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'he'
                    ? 'שיעורים מוקלטים (Drive) ומשחקים לימודיים מותאמים'
                    : 'Google Drive video replays & interactive study games'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMoreOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Teaching Tools Cards Grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Recorded Sessions */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('recordings');
                  setIsMobileMoreOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`bg-slate-50/90 dark:bg-slate-800/70 border p-4 rounded-2xl flex flex-col justify-between gap-3 text-start group active:scale-[0.98] transition-all ${
                  activeTab === 'recordings'
                    ? 'border-brand-teal-500 ring-2 ring-brand-teal-500/20'
                    : 'border-slate-200/90 dark:border-slate-700/60 hover:border-brand-teal-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-brand-teal-700 dark:text-teal-300 border border-brand-teal-200/60 dark:border-teal-800/40">
                    <PlayCircle className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-teal-100 dark:bg-teal-900/80 text-brand-teal-900 dark:text-teal-200 border border-brand-teal-300/60 dark:border-teal-700/50">
                    {recordedSessionsData?.length || 0}
                  </span>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-brand-teal-700 dark:group-hover:text-teal-300 transition-colors">
                    {language === 'he' ? 'שיעורים מוקלטים' : 'Recorded Sessions'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {language === 'he' ? 'סרטוני Google Drive' : 'Google Drive replays'}
                  </p>
                </div>
              </button>

              {/* Custom Games */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('games');
                  setIsMobileMoreOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`bg-slate-50/90 dark:bg-slate-800/70 border p-4 rounded-2xl flex flex-col justify-between gap-3 text-start group active:scale-[0.98] transition-all ${
                  activeTab === 'games'
                    ? 'border-brand-teal-500 ring-2 ring-brand-teal-500/20'
                    : 'border-slate-200/90 dark:border-slate-700/60 hover:border-brand-teal-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40">
                    <Gamepad2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/80 text-purple-900 dark:text-purple-200 border border-purple-300/60 dark:border-purple-700/50">
                    {gamesData?.length || 0}
                  </span>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                    {language === 'he' ? 'משחקים לימודיים' : 'Interactive Games'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {language === 'he' ? 'כרטיסיות והתאמות מילים' : 'Vocabulary flashcards & matching'}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Teacher Profile Modal */}
      {user && (
        <TeacherShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          teacher={user as any}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;
