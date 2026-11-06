import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../hooks/useTranslation';
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
import { GlassSidebar } from '../../components/common/GlassSidebar';
import { isGoogleDriveUrl, detectAttachmentType } from '../../lib/driveUtils';
import {
  Calendar as CalendarIcon,
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
  Flame,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export type SessionDuration = 25 | 40 | 55;

// Standard intervals for each of the 3 session duration types
const TIME_BLOCKS_25 = [
  { start: '09:00', end: '09:25' },
  { start: '09:30', end: '09:55' },
  { start: '10:00', end: '10:25' },
  { start: '10:30', end: '10:55' },
  { start: '11:00', end: '11:25' },
  { start: '11:30', end: '11:55' },
  { start: '13:00', end: '13:25' },
  { start: '13:30', end: '13:55' },
  { start: '14:00', end: '14:25' },
  { start: '14:30', end: '14:55' },
  { start: '15:00', end: '15:25' },
  { start: '15:30', end: '15:55' },
  { start: '16:00', end: '16:25' },
  { start: '16:30', end: '16:55' },
];

const TIME_BLOCKS_40 = [
  { start: '09:00', end: '09:40' },
  { start: '09:45', end: '10:25' },
  { start: '10:30', end: '11:10' },
  { start: '11:15', end: '11:55' },
  { start: '13:00', end: '13:40' },
  { start: '13:45', end: '14:25' },
  { start: '14:30', end: '15:10' },
  { start: '15:15', end: '15:55' },
  { start: '16:00', end: '16:40' },
];

const TIME_BLOCKS_55 = [
  { start: '09:00', end: '09:55' },
  { start: '10:00', end: '10:55' },
  { start: '11:00', end: '11:55' },
  { start: '13:00', end: '13:55' },
  { start: '14:00', end: '14:55' },
  { start: '15:00', end: '15:55' },
  { start: '16:00', end: '16:55' },
];

export const TeacherDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'calendar' | 'lessons' | 'students' | 'homework' | 'recordings' | 'games'>('calendar');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedDay, setSelectedDay] = useState<number>(() => new Date().getDay());
  const [selectedDuration, setSelectedDuration] = useState<SessionDuration>(25);

  // Mandatory Slot Zoom Link Configuration Modal
  const [isConfiguringSlot, setIsConfiguringSlot] = useState(false);
  const [selectedSlotBlock, setSelectedSlotBlock] = useState<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    slotLabel: string;
    formattedDate: string;
  } | null>(null);
  const [slotZoomLink, setSlotZoomLink] = useState('');
  const [saveZoomAsDefault, setSaveZoomAsDefault] = useState(true);

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

  // Drive viewer modal state
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState<string>('');
  const [viewerSubtitle, setViewerSubtitle] = useState<string>('');

  // Student progress details modal state
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any | null>(null);

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
  });

  // 2. Fetch Teacher Students
  const { data: studentsData } = useQuery({
    queryKey: ['teacherStudents', user?.id],
    queryFn: async () => {
      const res = await api.get(`/teachers/${user?.id}/students`);
      return res.data.students;
    },
    enabled: !!user?.id,
  });

  // 3. Fetch Homework for this Teacher
  const { data: homeworkData } = useQuery({
    queryKey: ['teacherHomework', user?.id],
    queryFn: async () => {
      const res = await api.get('/homework');
      return res.data.homework;
    },
  });

  // 4. Fetch Recorded Sessions for this Teacher
  const { data: recordedSessionsData } = useQuery({
    queryKey: ['teacherRecordedSessions', user?.id],
    queryFn: async () => {
      const res = await api.get('/recorded-sessions');
      return res.data.sessions;
    },
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

  // Complete lesson mutation
  const completeLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      return api.post(`/lessons/${lessonId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherCalendar'] });
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

  // Add slot mutation (supports 25, 40, and 55 minute sessions with Zoom meeting link)
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
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['teacherCalendar'] });
      setIsConfiguringSlot(false);
      setSelectedSlotBlock(null);
      const dur = vars.durationMinutes || 25;
      toast.success(
        language === 'he'
          ? `שעת הזמינות (${dur} דקות) עם קישור הזום נפתחה בהצלחה לתלמידים ולבעל הפלטפורמה!`
          : `${dur}-minute availability slot with Zoom link opened for students & owner!`
      );
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.error ||
          (language === 'he' ? 'שגיאה בפתיחת שעת הזמינות' : 'Failed to open availability slot')
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
      calendarData?.defaultZoomLink ||
      localStorage.getItem('engrew_teacher_zoom_link') ||
      '';
    setSlotZoomLink(defaultZoom);
    setSelectedSlotBlock({
      dayOfWeek: selectedDay,
      startTime: block.start,
      endTime: block.end,
      durationMinutes: selectedDuration,
      slotLabel,
      formattedDate: new Date(selectedDate + 'T00:00:00').toLocaleDateString(
        language === 'he' ? 'he-IL' : 'en-US',
        { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }
      ),
    });
    setIsConfiguringSlot(true);
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
      durationMinutes: selectedSlotBlock.durationMinutes,
      zoomLink: trimmedZoom,
      saveAsDefault: saveZoomAsDefault,
    });
  };

  // Delete slot mutation
  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId: string) => {
      return api.delete(`/teachers/${user?.id}/slots/${slotId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherCalendar'] });
      toast.info(language === 'he' ? 'שעת הזמינות הוסרה.' : 'Availability slot removed.');
    },
  });

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
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-sm font-semibold text-slate-500 animate-pulse">
          {t('common.loading')}
        </div>
      </div>
    );
  }

  const lessons = calendarData?.lessons || [];
  const slots = calendarData?.slots || [];

  const navItems = [
    {
      id: 'calendar',
      label: 'Session Availability',
      labelHe: 'לוח זמינות ושיעורים',
      icon: CalendarIcon,
      badge: slots.length,
    },
    {
      id: 'lessons',
      label: 'Scheduled Lessons',
      labelHe: 'שיעורים מתוכננים',
      icon: Video,
      badge: lessons.length,
    },
    {
      id: 'students',
      label: 'Student Profiles',
      labelHe: 'פרופיל והתקדמות תלמידים',
      icon: Users,
      badge: studentsData?.length || 0,
    },
    {
      id: 'homework',
      label: 'Assign Homework & PDFs',
      labelHe: 'שיעורי בית וקובצי PDF',
      icon: BookOpen,
      badge: homeworkData?.length || 0,
    },
    {
      id: 'recordings',
      label: 'Recorded Sessions',
      labelHe: 'שיעורים מוקלטים (Drive)',
      icon: PlayCircle,
      badge: recordedSessionsData?.length || 0,
    },
    {
      id: 'games',
      label: 'Custom Games',
      labelHe: 'משחקים מותאמים',
      icon: Gamepad2,
      badge: gamesData?.length || 0,
    },
  ];

  return (
    <div className="min-h-screen w-full relative">
      {/* Mobile Top Navigation bar with toggle & active section pill */}
      <div className="lg:hidden flex items-center justify-between p-3 sm:p-4 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 px-4 py-3 sticky top-16 z-20 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center p-1 shadow-2xs shrink-0">
            <img src="/logo.png" alt="Engrew" className="w-full h-full object-contain drop-shadow-2xs" />
          </div>
          <div className="min-w-0">
            <span className="font-extrabold text-xs text-slate-900 dark:text-white block truncate">
              {language === 'he' ? 'פורטל מורים מוסמכים' : 'Teacher Portal'}
            </span>
            <span className="text-[11px] font-bold text-brand-teal-700 dark:text-brand-teal-400 block truncate">
              {navItems.find((item) => item.id === activeTab)?.label || activeTab}
            </span>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-teal-800 hover:bg-brand-teal-900 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>{mobileMenuOpen ? (language === 'he' ? 'סגור' : 'Close') : (language === 'he' ? 'תפריט' : 'Menu')}</span>
        </button>
      </div>

      <div className="w-full">
        {/* Apple-Style Glassy Left Sidebar */}
        <GlassSidebar
          navItems={navItems}
          activeTab={activeTab}
          onTabChange={(tabId) => {
            setActiveTab(tabId as any);
            setMobileMenuOpen(false);
          }}
          user={user}
          panelSubtitle="Certified Teacher Portal"
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main className="lg:ps-72 xl:ps-80 w-full min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-5rem)] p-4 sm:p-6 lg:p-8 xl:p-10 space-y-6 sm:space-y-8 min-w-0">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-brand-teal-900 to-brand-teal-950 rounded-3xl p-5 sm:p-8 text-white shadow-md relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6 relative z-10">
              <div className="space-y-1.5 min-w-0">
                <span className="inline-block px-3 py-1 bg-white/10 text-brand-olive-300 text-xs font-bold rounded-full mb-1 backdrop-blur-xs max-w-full truncate">
                  {language === 'he' ? 'לוח מורה • מערך שיעורים רב-מתכונתי (25 / 40 / 55 דקות)' : 'Instructor Dashboard • Multi-Duration Session System (25 / 40 / 55 Min)'}
                </span>
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                  {language === 'he' ? `שלום, ${user?.firstName}!` : `Welcome, ${user?.firstName}!`}
                </h1>
                <p className="text-brand-teal-100/90 text-xs sm:text-sm max-w-xl leading-relaxed">
                  {language === 'he'
                    ? 'נהל את לוח הזמינות השבועי לפי 3 סוגי שיעורים (25, 40 ו-55 דקות), בדוק שיעורי בית, התחל שיעורי זום והעלה סיכומי שיעור.'
                    : 'Customize your weekly availability for 3 session durations (25, 40, and 55 minutes), review student homework, launch live Zoom classes, and link lesson recordings.'}
                </p>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                <button
                  onClick={() => openNewGameModal('FLASHCARD')}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-brand-teal-800 hover:bg-brand-teal-700 text-white font-bold text-xs shadow-xs transition-colors border border-brand-teal-700 text-center"
                >
                  <Gamepad2 className="w-4 h-4 text-brand-olive-300" />
                  <span>{language === 'he' ? 'יצירת משחק מותאם' : 'Create Custom Game'}</span>
                </button>
                <button
                  onClick={() => setIsAssigningHw(true)}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-brand-olive-500 hover:bg-brand-olive-600 text-slate-950 font-bold text-xs shadow-xs transition-colors text-center"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'he' ? 'הקצאת שיעורי בית' : 'Assign Homework'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* TAB 1: INTERACTIVE MULTI-DURATION AVAILABILITY CALENDAR */}
          {activeTab === 'calendar' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-brand-teal-700 dark:text-brand-teal-400" />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {language === 'he'
                        ? 'לוח זמינות שבועי לפי משך שיעור'
                        : 'Weekly Availability Calendar by Session Duration'}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {language === 'he'
                      ? 'בחר מתכונת שיעור (25, 40 או 55 דקות) ויום בשבוע, ולחץ על שעה כדי לפתוח אותה להזמנה.'
                      : 'Choose session format (25, 40, or 55 minutes) and a weekday, then toggle slots open for student booking.'}
                  </p>
                </div>

                {/* Duration Switcher & Israel Time Pill */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* 3 Duration Types Switcher */}
                  <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setSelectedDuration(25)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        selectedDuration === 25
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {language === 'he' ? '25 דקות' : '25 Min'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDuration(40)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        selectedDuration === 40
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {language === 'he' ? '40 דקות' : '40 Min'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDuration(55)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        selectedDuration === 55
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {language === 'he' ? '55 דקות' : '55 Min'}
                    </button>
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
                  {language === 'he' ? 'פתוח 25 דק׳' : '25m Available'}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-sky-500"></span>
                  {language === 'he' ? 'פתוח 40 דק׳' : '40m Available'}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-purple-500"></span>
                  {language === 'he' ? 'פתוח 55 דק׳' : '55m Available'}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-brand-teal-800"></span>
                  {language === 'he' ? 'שיעור מוזמן' : 'Booked'}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 ms-auto font-normal">
                  {language === 'he' ? 'אזור זמן: ירושלים (שעון ישראל)' : 'Timezone: Asia/Jerusalem (UTC+2 / UTC+3)'}
                </span>
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
                      const daySlotsCount = slots.filter((s: any) => s.dayOfWeek === dayIndex).length;
                      const isSelected = selectedDay === dayIndex;
                      const weekDate = weekDates[dayIndex];
                      const dateObj = new Date(weekDate + 'T00:00:00');
                      const dateFormatted = dateObj.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                      });

                      const bookedCount = lessons.filter((l: any) => {
                        const lDateStr = new Date(l.scheduledAt).toISOString().split('T')[0];
                        return lDateStr === weekDate && l.status === 'SCHEDULED';
                      }).length;

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

              {/* Time Slot Matrix for Selected Day and Duration */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                      {language === 'he'
                        ? `שעות זמינות ליום ${DAYS_HE[selectedDay]} (${new Date(selectedDate + 'T00:00:00').toLocaleDateString('he-IL', { month: 'short', day: 'numeric', year: 'numeric' })}) • שיעורי ${selectedDuration} דקות`
                        : `Slots for ${DAYS[selectedDay]}, ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (${selectedDuration}-Min Slots in 12h IST)`}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {language === 'he'
                        ? 'שעות שייפתחו כאן יהיו זמינות לבחירה ישירה עבור התלמידים בהזמנת שיעור.'
                        : 'Slots opened here are linked directly to student booking for this date and weekday.'}
                    </p>
                  </div>
                  <span className="text-xs text-brand-teal-800 dark:text-brand-teal-300 font-bold bg-brand-teal-50 dark:bg-brand-teal-950/70 border border-brand-teal-200 dark:border-brand-teal-800 px-3 py-1 rounded-xl shrink-0">
                    {language === 'he' ? 'מוגדרים ליום זה: ' : 'Configured: '}
                    {slots.filter((s: any) => s.dayOfWeek === selectedDay).length}{' '}
                    {language === 'he' ? 'שעות' : 'slots'}
                  </span>
                </div>

                {(() => {
                  const currentBlocks =
                    selectedDuration === 25
                      ? TIME_BLOCKS_25
                      : selectedDuration === 40
                      ? TIME_BLOCKS_40
                      : TIME_BLOCKS_55;

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {currentBlocks.map((block) => {
                        const existingSlot = slots.find(
                          (s: any) =>
                            s.dayOfWeek === selectedDay &&
                            s.startTime === block.start &&
                            s.endTime === block.end
                        );

                        const slotLabel12h = formatSlotRange12Hour(block.start, block.end);

                        const bookedLesson = lessons.find((l: any) => {
                          const lDateStr = new Date(l.scheduledAt).toISOString().split('T')[0];
                          const lDate = new Date(l.scheduledAt);
                          const lTime = lDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                          return lDateStr === selectedDate && lTime === block.start && l.status === 'SCHEDULED';
                        });

                        if (bookedLesson) {
                          const bookedDur = bookedLesson.durationMinutes || selectedDuration;
                          return (
                            <div
                              key={block.start}
                              className="p-3.5 rounded-2xl bg-brand-teal-900 text-white border border-brand-teal-950 shadow-xs flex flex-col justify-between min-h-[7rem]"
                            >
                              <div>
                                <div className="flex items-center justify-between text-[11px] font-extrabold uppercase text-brand-olive-300 mb-1">
                                  <span>{slotLabel12h}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-teal-800">
                                    {language === 'he' ? 'מוזמן' : 'Booked'}
                                  </span>
                                </div>
                                <p className="text-xs font-bold leading-tight truncate mt-1">
                                  {bookedLesson.student?.user?.firstName} {bookedLesson.student?.user?.lastName}
                                </p>
                                <span className="text-[10px] text-brand-olive-300 font-semibold block mt-0.5">
                                  {bookedDur} {language === 'he' ? 'דקות' : 'Min'}
                                </span>
                              </div>
                              <a
                                href={bookedLesson.zoomLink || 'https://zoom.us'}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-teal-200 hover:text-white pt-2"
                              >
                                <Video className="w-3.5 h-3.5" />
                                {language === 'he' ? 'כניסה לזום' : 'Launch Zoom'}
                              </a>
                            </div>
                          );
                        }

                        if (existingSlot) {
                          const slotDur = getSlotDurationMinutes(existingSlot.startTime, existingSlot.endTime);
                          const colorClasses =
                            slotDur === 55
                              ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-950 dark:text-purple-200'
                              : slotDur === 40
                              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-950 dark:text-sky-200'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-200';

                          return (
                            <div
                              key={block.start}
                              className={`p-3.5 rounded-2xl border-2 shadow-2xs flex flex-col justify-between min-h-[7rem] ${colorClasses}`}
                            >
                              <div>
                                <div className="flex items-center justify-between text-[11px] font-extrabold uppercase mb-1">
                                  <span>{slotLabel12h}</span>
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-black block">
                                  {language === 'he' ? 'שעה פתוחה' : 'Available Slot'}
                                </span>
                                <span className="text-[10px] font-semibold opacity-90 block">
                                  {slotDur} {language === 'he' ? 'דק׳ (שעון ישראל)' : 'min (Israel Time)'}
                                </span>

                                {existingSlot.zoomLink ? (
                                  <a
                                    href={existingSlot.zoomLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-[10px] font-black text-brand-teal-900 dark:text-brand-teal-200 mt-2 transition-colors max-w-full"
                                    title={existingSlot.zoomLink}
                                  >
                                    <Video className="w-3.5 h-3.5 shrink-0 text-brand-teal-700 dark:text-brand-teal-400" />
                                    <span className="truncate">Zoom Linked</span>
                                  </a>
                                ) : (
                                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold block mt-1">
                                    No Zoom Link
                                  </span>
                                )}
                              </div>

                              <button
                                onClick={() => deleteSlotMutation.mutate(existingSlot.id)}
                                className="text-[11px] text-rose-600 dark:text-rose-400 font-bold hover:underline self-end flex items-center gap-1 pt-2"
                                title={language === 'he' ? 'הסר שעה פתוחה' : 'Remove available slot'}
                              >
                                <Trash2 className="w-3 h-3" />
                                {language === 'he' ? 'הסר שעה' : 'Remove Slot'}
                              </button>
                            </div>
                          );
                        }

                        // Unconfigured / empty slot
                        const slotIsPast = isSlotInPast(selectedDate, block.start);

                        if (slotIsPast) {
                          return (
                            <div
                              key={block.start}
                              className="p-3.5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 flex flex-col justify-between min-h-[7rem] text-start select-none cursor-not-allowed opacity-60"
                              title={language === 'he' ? 'תאריך או שעה שכבר עברו - לא ניתן להוסיף שעת זמינות' : 'Past date or time - cannot open slot'}
                            >
                              <span className="text-[11px] font-mono font-medium text-slate-400 dark:text-slate-500 line-through">
                                {slotLabel12h}
                              </span>
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 pt-2">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{language === 'he' ? 'זמן שעבר' : 'Past Slot'}</span>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <button
                            key={block.start}
                            onClick={() => handleOpenSlotModal(block, slotLabel12h)}
                            className="p-3.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-teal-600 dark:hover:border-brand-teal-400 hover:bg-brand-teal-50/50 dark:hover:bg-brand-teal-950/30 text-slate-500 dark:text-slate-400 hover:text-brand-teal-900 dark:hover:text-brand-teal-200 transition-all flex flex-col justify-between min-h-[7rem] text-start group shadow-2xs"
                          >
                            <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 group-hover:text-brand-teal-700 dark:group-hover:text-brand-teal-300">
                              {slotLabel12h}
                            </span>
                            <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-brand-teal-900 dark:group-hover:text-brand-teal-100 pt-2">
                              <Plus className="w-3.5 h-3.5 text-brand-teal-600 dark:text-brand-teal-400" />
                              <span>
                                {language === 'he'
                                  ? `פתח שעה (${selectedDuration} דק׳)`
                                  : `Open ${selectedDuration}m Slot`}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
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
                          onClick={() => {
                            setRecordingLessonId(lesson.id);
                            setRecordingUrl(lesson.recordingUrl || '');
                            setSessionNotes(lesson.teacherNotes || '');
                          }}
                          className="font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                          {lesson.recordingUrl
                            ? (language === 'he' ? 'עריכת הקלטה והערות' : 'Edit Recording & Notes')
                            : (language === 'he' ? '+ הוסף הקלטה והערות' : '+ Add Recording & Notes')}
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
                {studentsData?.map((student: any) => {
                  const completedLessons = student.stats?.completedLessons || 0;
                  const remainingLessons = student.stats?.packageRemainingLessons || 0;
                  const totalLessons = student.stats?.packageTotalLessons || (completedLessons + remainingLessons);
                  const progressPct = totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;
                  const pendingHw = student.stats?.pendingHomework || 0;

                  return (
                    <div
                      key={student.id}
                      className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-lg hover:border-brand-teal-500/30 transition-all flex flex-col justify-between space-y-4 overflow-hidden relative group"
                    >
                      {/* Top Header */}
                      <div className="space-y-3.5">
                        {/* Student Identity Row: Avatar + Full Name + Email */}
                        <div className="flex items-center gap-3.5 min-w-0 min-h-[52px]">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-teal-700 to-brand-teal-900 text-white font-black text-base flex items-center justify-center shadow-xs shrink-0 ring-2 ring-brand-teal-100 dark:ring-brand-teal-950">
                            {student.user.firstName?.[0] || 'S'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4
                              className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base leading-snug break-words"
                              title={`${student.user.firstName} ${student.user.lastName}`}
                            >
                              {student.user.firstName} {student.user.lastName}
                            </h4>
                            <span
                              className="text-xs text-slate-500 dark:text-slate-400 block truncate mt-0.5"
                              title={student.user.email}
                            >
                              {student.user.email}
                            </span>
                          </div>
                        </div>

                        {/* Badges Bar: Level & Points & Streak */}
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
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                              <Flame className="w-3.5 h-3.5 shrink-0" />
                              <span>{student.stats?.streakDays || 1}{language === 'he' ? ' ימים' : 'd streak'}</span>
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
                          {student.stats?.lastLessonDate && (
                            <div className="flex items-center justify-between">
                              <span>{language === 'he' ? 'שיעור אחרון:' : 'Last lesson:'}</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {new Date(student.stats.lastLessonDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {student.stats?.nextLessonDate && (
                            <div className="flex items-center justify-between">
                              <span className="text-brand-teal-700 dark:text-brand-teal-400 font-semibold">
                                {language === 'he' ? 'שיעור הבא:' : 'Next session:'}
                              </span>
                              <span className="font-bold text-brand-teal-800 dark:text-brand-teal-300">
                                {new Date(student.stats.nextLessonDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {pendingHw > 0 && !student.stats?.nextLessonDate && (
                            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-bold">
                              <span>{language === 'he' ? 'ש״ב ממתינים לבדיקה:' : 'Pending HW review:'}</span>
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800">{pendingHw}</span>
                            </div>
                          )}
                          {!student.stats?.lastLessonDate && !student.stats?.nextLessonDate && pendingHw === 0 && (
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
                          onClick={() => setSelectedStudentDetail(student)}
                          className="py-2 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors text-center flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 shrink-0" />
                          <span>{language === 'he' ? 'פרופיל' : 'View'}</span>
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

          {/* TAB 4: HOMEWORK REVIEWS */}
          {activeTab === 'homework' && (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-brand-teal-700 dark:text-brand-teal-400" />
                    <span>{language === 'he' ? 'הגשות שיעורי בית ומטלות' : 'Student Homework & Material Submissions'}</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {language === 'he'
                      ? 'בדוק שיעורי בית שהוגשו, ספק משוב, וצפה בחומרי PDF המקושרים ישירות במערכת.'
                      : 'Review submitted assignments, grade them, and view attached Google Drive PDFs directly.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsAssigningHw(true)}
                  className="px-4 py-2.5 bg-brand-teal-800 hover:bg-brand-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-brand-olive-300" />
                  <span>{language === 'he' ? 'הקצאת שיעורי בית' : 'Assign New Homework'}</span>
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {homeworkData?.map((hw: any) => (
                  <div
                    key={hw.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-750 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{hw.title}</h4>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {language === 'he' ? 'תלמיד:' : 'Student:'} {hw.student?.user?.firstName} {hw.student?.user?.lastName}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg ${
                            hw.status === 'GRADED'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : hw.status === 'SUBMITTED'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {language === 'he'
                            ? hw.status === 'GRADED'
                              ? 'נבדק'
                              : hw.status === 'SUBMITTED'
                              ? 'הוגש לבדיקה'
                              : 'הוקצה'
                            : hw.status}
                        </span>
                      </div>

                      {hw.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {hw.description}
                        </p>
                      )}

                      {/* Attached PDF / External resource if present */}
                      {hw.attachmentUrl && (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-400 shrink-0" />
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {isGoogleDriveUrl(hw.attachmentUrl)
                                ? language === 'he'
                                  ? 'מסמך PDF מ-Google Drive'
                                  : 'Google Drive PDF Material'
                                : language === 'he'
                                ? 'קישור לחומר חיצוני'
                                : 'External Resource'}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setViewerUrl(hw.attachmentUrl);
                              setViewerTitle(hw.title);
                              setViewerSubtitle(
                                language === 'he'
                                  ? `חומר שיעורי בית: ${hw.student?.user?.firstName || ''}`
                                  : `Homework Resource for ${hw.student?.user?.firstName || 'Student'}`
                              );
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold bg-brand-teal-800 hover:bg-brand-teal-900 text-white rounded-lg transition-colors shrink-0 flex items-center gap-1 shadow-2xs"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{language === 'he' ? 'פתח במערכת' : 'Open In-App'}</span>
                          </button>
                        </div>
                      )}

                      {hw.dueDate && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {language === 'he' ? 'מועד הגשה:' : 'Due date:'}{' '}
                            {new Date(hw.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {hw.studentNote && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                          <span className="font-bold block mb-0.5 text-brand-teal-900 dark:text-brand-teal-300">
                            {language === 'he' ? 'התשובה שהוגשה על ידי התלמיד:' : 'Student Submission Notes:'}
                          </span>
                          {hw.studentNote}
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

                    {hw.status === 'SUBMITTED' && (
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
                              setReviewFeedback('');
                            }}
                            className="text-xs font-bold text-brand-teal-700 dark:text-brand-teal-400 hover:text-brand-teal-900 dark:hover:text-brand-teal-300 flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{language === 'he' ? 'בדוק והזן משוב' : 'Review & Provide Feedback'}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {(!homeworkData || homeworkData.length === 0) && (
                  <p className="text-xs text-slate-400 py-12 text-center col-span-2">
                    {language === 'he' ? 'כל שיעורי הבית נבדקו.' : 'All homework caught up.'}
                  </p>
                )}
              </div>
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
              {/* Header Banner */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors">
                {/* Frosted ambient glow */}
                <div className="absolute -top-12 -end-12 w-44 h-44 bg-brand-teal-500/10 dark:bg-brand-teal-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 -start-12 w-44 h-44 bg-brand-olive-400/10 dark:bg-brand-olive-400/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-olive-100/80 dark:bg-brand-olive-950/70 border border-brand-olive-300/70 dark:border-brand-olive-800 text-xs font-bold text-brand-olive-900 dark:text-brand-olive-300 shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 text-brand-olive-600 dark:text-brand-olive-400" />
                      <span>{language === 'he' ? 'משחקים מותאמים אישית' : 'Interactive Hebrew Learning Games'}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {language === 'he' ? 'ניהול משחקים ותרגילים אינטראקטיביים' : 'Custom Games & Exercises Manager'}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                      {language === 'he'
                        ? 'צור והתאם כרטיסיות מילים, משחקי התאמה וחידונים לפי רמת התלמיד או קשר אותם ישירות לשיעור ספציפי.'
                        : 'Design and customize flashcards, word matching, and timed quizzes tailored by Hebrew proficiency level and linked directly to specific student lessons.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={() => openNewGameModal('FLASHCARD')}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs rounded-xl shadow-2xs border border-slate-200/80 dark:border-slate-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-400" />
                      <span>{language === 'he' ? 'כרטיסיות מילים' : 'Flashcards'}</span>
                    </button>
                    <button
                      onClick={() => openNewGameModal('MATCHING')}
                      className="px-4 py-2.5 bg-brand-olive-500 hover:bg-brand-olive-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4 text-slate-950" />
                      <span>{language === 'he' ? 'התאמת מילים' : 'Word Match'}</span>
                    </button>
                    <button
                      onClick={() => openNewGameModal('QUIZ')}
                      className="px-4 py-2.5 bg-brand-teal-800 hover:bg-brand-teal-900 dark:bg-brand-teal-700 dark:hover:bg-brand-teal-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4 text-brand-olive-300" />
                      <span>{language === 'he' ? 'חידון אמריקאי' : 'Timed Quiz'}</span>
                    </button>
                  </div>
                </div>
              </div>

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
                    {language === 'he' ? 'סינון לפי רמה:' : 'Level Filter:'}
                  </span>
                  {(['ALL', 'BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'ADVANCED'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setGameFilterLevel(lvl)}
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
                        : t(`levels.${lvl}`)}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {language === 'he' ? 'סוג משחק:' : 'Game Type:'}
                  </span>
                  {(['ALL', 'FLASHCARD', 'MATCHING', 'QUIZ'] as const).map((type) => (
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
                          : 'Flashcard'
                        : type === 'MATCHING'
                        ? language === 'he'
                          ? 'התאמת מילים'
                          : 'Matching'
                        : language === 'he'
                        ? 'חידון'
                        : 'Quiz'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Games Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {(gamesData || [])
                  .filter((g: any) => {
                    if (gameFilterLevel !== 'ALL' && g.level !== gameFilterLevel) return false;
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
                        : game.configJson?.questions?.length || 0;

                    const levelBadgeColor =
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
                                {t(`levels.${game.level || 'BEGINNER'}`)}
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
                                  {game.lesson.student?.user?.firstName}{' '}
                                  {game.lesson.student?.user?.lastName}
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
                {studentsData?.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.user.firstName} {s.user.lastName} ({t(`levels.${s.level || 'BEGINNER'}`)})
                  </option>
                ))}
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
                  {studentsData?.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.user.firstName} {s.user.lastName}
                    </option>
                  ))}
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
                <div className="w-12 h-12 rounded-2xl bg-brand-teal-800 text-white font-black text-lg flex items-center justify-center shadow-xs">
                  {selectedStudentDetail.user?.firstName?.[0] || 'S'}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    {selectedStudentDetail.user?.firstName} {selectedStudentDetail.user?.lastName}
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
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
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

      {/* Reusable In-System Google Drive & External Viewer Modal */}
      <DriveViewerModal
        isOpen={!!viewerUrl}
        onClose={() => setViewerUrl(null)}
        url={viewerUrl || ''}
        title={viewerTitle}
        subtitle={viewerSubtitle}
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
                        • {language === 'he' ? 'שיעור עם' : 'Lesson with'} {previewGame.lesson.student?.user?.firstName}
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
                  {selectedSlotBlock.slotLabel} ({selectedSlotBlock.durationMinutes} min)
                </span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
                📅 {selectedSlotBlock.formattedDate}
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                <Clock className="w-3 h-3" />
                <span>{selectedSlotBlock.durationMinutes}-Minute Slot Format</span>
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
    </div>
  );
};
