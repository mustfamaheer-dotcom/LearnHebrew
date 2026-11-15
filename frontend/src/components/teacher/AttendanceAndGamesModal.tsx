import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherActionsApi } from '../../lib/enterpriseApi';
import { api } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../store/toastStore';
import {
  CheckCircle2,
  XCircle,
  Gamepad2,
  X,
  Calendar as CalendarIcon,
  Clock,
  User,
  Search,
  Sparkles,
  ChevronDown,
  Filter,
  Check,
  Award,
} from 'lucide-react';
import { formatIsraelDateTime } from '../../lib/timeUtils';

interface Props {
  lessonId?: string;
  studentId?: string;
  studentName?: string;
  onClose: () => void;
}

export const AttendanceAndGamesModal: React.FC<Props> = ({
  lessonId: initialLessonId,
  studentId: initialStudentId,
  studentName: initialStudentName,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const { t, language } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    initialLessonId && initialLessonId !== 'latest' ? initialLessonId : ''
  );
  const [studentFilter, setStudentFilter] = useState<string>(
    initialStudentId && initialStudentId !== 'latest' ? initialStudentId : 'ALL'
  );
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ATTENDED' | 'ABSENT'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Fetch Teacher Calendar & Lessons
  const { data: calendarData, isLoading: isLoadingLessons } = useQuery({
    queryKey: ['teacherCalendar', user?.id],
    queryFn: async () => {
      const res = await api.get(`/teachers/${user?.id}/calendar`);
      return res.data;
    },
    enabled: !!user?.id,
  });

  const lessons: any[] = useMemo(() => calendarData?.lessons || [], [calendarData?.lessons]);

  // Unique students extracted from the teacher's lessons
  const uniqueStudents = useMemo(() => {
    const map = new Map<string, any>();
    lessons.forEach((l) => {
      if (l.student?.id && !map.has(l.student.id)) {
        map.set(l.student.id, l.student);
      }
    });
    return Array.from(map.values());
  }, [lessons]);

  // Auto-select initial lesson if none currently selected
  React.useEffect(() => {
    if (!selectedLessonId && lessons.length > 0) {
      // Prioritize an unrecorded/pending lesson, otherwise fallback to the latest lesson
      const pendingLesson = lessons.find((l) => !l.attendanceStatus);
      if (pendingLesson) {
        setSelectedLessonId(pendingLesson.id);
      } else {
        setSelectedLessonId(lessons[0].id);
      }
    }
  }, [lessons, selectedLessonId]);

  // Filtered lessons list based on student filter, status filter, and search text
  const filteredLessons = useMemo(() => {
    return lessons.filter((l) => {
      if (studentFilter !== 'ALL' && l.student?.id !== studentFilter) {
        return false;
      }
      if (statusFilter === 'PENDING' && l.attendanceStatus) {
        return false;
      }
      if (statusFilter === 'ATTENDED' && l.attendanceStatus !== 'ATTENDED') {
        return false;
      }
      if (statusFilter === 'ABSENT' && l.attendanceStatus !== 'ABSENT') {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const sName = `${l.student?.user?.firstName || ''} ${l.student?.user?.lastName || ''}`.toLowerCase();
        const email = (l.student?.user?.email || '').toLowerCase();
        const dateStr = new Date(l.scheduledAt).toLocaleDateString().toLowerCase();
        if (!sName.includes(q) && !email.includes(q) && !dateStr.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [lessons, studentFilter, statusFilter, searchQuery]);

  // Currently selected lesson object
  const currentLesson = useMemo(() => {
    return lessons.find((l) => l.id === selectedLessonId) || null;
  }, [lessons, selectedLessonId]);

  const effectiveStudent = currentLesson?.student;
  const effectiveStudentName = effectiveStudent?.user
    ? `${effectiveStudent.user.firstName} ${effectiveStudent.user.lastName}`
    : initialStudentName || (language === 'he' ? 'בחר שיעור' : 'Select a Session');
  const effectiveStudentId = effectiveStudent?.id || initialStudentId || '';

  // 2. Fetch Available Practice Games
  const { data: games = [] } = useQuery({
    queryKey: ['available-games'],
    queryFn: async () => {
      const res = await api.get('/games');
      if (Array.isArray(res.data?.games)) return res.data.games;
      if (Array.isArray(res.data)) return res.data;
      return [];
    },
  });

  const gameList = Array.isArray(games) ? games : [];

  // Attendance Mutation
  const markAttendanceMutation = useMutation({
    mutationFn: (status: 'ATTENDED' | 'ABSENT' | 'EXCUSED') => {
      if (!selectedLessonId) throw new Error('No lesson selected');
      return teacherActionsApi.markAttendance(selectedLessonId, status);
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['teacherCalendar'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['adminLessons'] });
      queryClient.invalidateQueries({ queryKey: ['adminSurveys'] });

      const statusLabel =
        status === 'ATTENDED'
          ? (language === 'he' ? 'נוכח' : 'Attended')
          : status === 'ABSENT'
          ? (language === 'he' ? 'נעדר' : 'Absent')
          : (language === 'he' ? 'בהסכמה' : 'Excused');

      toast.success(
        language === 'he'
          ? `נוכחות סומנה כ-${statusLabel} עבור ${effectiveStudentName}! נשלחה התראה לתלמיד.`
          : `Attendance marked as ${statusLabel} for ${effectiveStudentName}! Notification sent.`
      );
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message || (language === 'he' ? 'שגיאה בעדכון הנוכחות' : 'Failed to mark attendance')
      );
    },
  });

  // Game Unlock Mutation
  const unlockGameMutation = useMutation({
    mutationFn: () => {
      if (!selectedGameId || !effectiveStudentId || !selectedLessonId) {
        throw new Error('Missing game, student, or session selection');
      }
      return teacherActionsApi.unlockGame(selectedGameId, effectiveStudentId, selectedLessonId);
    },
    onSuccess: () => {
      toast.success(
        language === 'he'
          ? `משחק תרגול נפתח בהצלחה עבור ${effectiveStudentName}!`
          : `Practice game unlocked successfully for ${effectiveStudentName}!`
      );
      setSelectedGameId('');
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message || (language === 'he' ? 'שגיאה בפתיחת המשחק' : 'Failed to unlock game')
      );
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 my-auto max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-start pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-teal-800 text-brand-olive-300 flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                {language === 'he' ? 'רישום נוכחות ופתיחת משחקים' : 'Session Attendance & Game Access'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'he'
                  ? 'בחר שיעור ותלמיד כדי לסמן נוכחות (נוכח / נעדר) ולפתוח משחק תרגול לאחר השיעור'
                  : 'Select a session and student to record attendance and grant post-session practice games.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: Select Student & Session */}
        <div className="space-y-3.5 bg-slate-50 dark:bg-slate-850 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-brand-teal-600 dark:text-brand-teal-400" />
              <span>{language === 'he' ? 'שלב 1: בחירת תלמיד ושיעור' : 'Step 1: Choose Student & Session'}</span>
            </h4>
            <span className="text-[11px] font-semibold text-slate-400">
              {filteredLessons.length} {language === 'he' ? 'שיעורים נמצאו' : 'sessions found'}
            </span>
          </div>

          {/* Filters Row: Student Filter & Status Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Student Filter Dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {language === 'he' ? 'סינון לפי תלמיד:' : 'Filter by Student:'}
              </label>
              <select
                value={studentFilter}
                onChange={(e) => setStudentFilter(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-brand-teal-500/30 focus:outline-hidden"
              >
                <option value="ALL">
                  {language === 'he' ? 'כל התלמידים' : 'All Students'} ({uniqueStudents.length})
                </option>
                {uniqueStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.user?.firstName} {s.user?.lastName} ({t(`levels.${s.level || 'BEGINNER'}`)})
                  </option>
                ))}
              </select>
            </div>

            {/* Attendance Status Filter Pills */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {language === 'he' ? 'סטטוס רישום:' : 'Attendance Status:'}
              </label>
              <div className="flex p-0.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer text-[11px] ${
                    statusFilter === 'ALL'
                      ? 'bg-brand-teal-800 text-white font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {language === 'he' ? 'הכל' : 'All'}
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('PENDING')}
                  className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer text-[11px] ${
                    statusFilter === 'PENDING'
                      ? 'bg-amber-600 text-white font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {language === 'he' ? 'ממתין' : 'Pending'}
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ATTENDED')}
                  className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer text-[11px] ${
                    statusFilter === 'ATTENDED'
                      ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {language === 'he' ? 'נוכח' : 'Attended'}
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ABSENT')}
                  className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer text-[11px] ${
                    statusFilter === 'ABSENT'
                      ? 'bg-red-600 text-white font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {language === 'he' ? 'נעדר' : 'Absent'}
                </button>
              </div>
            </div>
          </div>

          {/* Session Selector Dropdown */}
          <div className="space-y-1 pt-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              {language === 'he' ? 'בחר שיעור מהרשימה:' : 'Select Target Scheduled Session:'}
            </label>
            {isLoadingLessons ? (
              <div className="p-3 text-center text-xs text-slate-400">
                {language === 'he' ? 'טוען שיעורים...' : 'Loading lessons...'}
              </div>
            ) : filteredLessons.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                {language === 'he'
                  ? 'לא נמצאו שיעורים התואמים לסינון הנבחר.'
                  : 'No scheduled lessons match the selected filters.'}
              </div>
            ) : (
              <select
                value={selectedLessonId}
                onChange={(e) => setSelectedLessonId(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-brand-teal-500/40 focus:outline-hidden"
              >
                {filteredLessons.map((l) => {
                  const studentLabel = l.student?.user
                    ? `${l.student.user.firstName} ${l.student.user.lastName}`
                    : 'Student';
                  const dateStr = formatIsraelDateTime(l.scheduledAt, {
                    includeDate: true,
                    includeWeekday: true,
                    includeTzLabel: false,
                  });
                  const statusLabel =
                    l.attendanceStatus === 'ATTENDED'
                      ? (language === 'he' ? '[נוכח]' : '[Attended]')
                      : l.attendanceStatus === 'ABSENT'
                      ? (language === 'he' ? '[נעדר]' : '[Absent]')
                      : (language === 'he' ? '[ממתין לרישום]' : '[Pending]');

                  return (
                    <option key={l.id} value={l.id}>
                      {dateStr} • {studentLabel} ({l.durationMinutes || 25}m) — {statusLabel}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Active Selected Session Card Preview */}
          {currentLesson && (
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-brand-teal-500/30 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-teal-700 to-indigo-800 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                  {effectiveStudent?.user?.firstName?.[0] || 'S'}
                  {effectiveStudent?.user?.lastName?.[0] || ''}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                      {effectiveStudentName}
                    </p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {t(`levels.${effectiveStudent?.level || 'BEGINNER'}`)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <Clock className="w-3.5 h-3.5 text-brand-teal-600 dark:text-brand-teal-400" />
                    <span>
                      {formatIsraelDateTime(currentLesson.scheduledAt, {
                        includeDate: true,
                        includeWeekday: true,
                        includeTzLabel: false,
                      })}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {currentLesson.durationMinutes || 25} {language === 'he' ? 'דק׳' : 'min'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                {currentLesson.attendanceStatus === 'ATTENDED' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-black border border-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{language === 'he' ? 'סומן: נוכח' : 'Marked: Attended'}</span>
                  </span>
                ) : currentLesson.attendanceStatus === 'ABSENT' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 text-xs font-black border border-red-300 dark:border-red-800">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{language === 'he' ? 'סומן: נעדר' : 'Marked: Absent'}</span>
                  </span>
                ) : currentLesson.attendanceStatus === 'EXCUSED' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-xs font-black border border-blue-300 dark:border-blue-800">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{language === 'he' ? 'סומן: בהסכמה' : 'Marked: Excused'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-300 dark:border-amber-800">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{language === 'he' ? 'ממתין לרישום' : 'Pending Marking'}</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* STEP 2: Mark Student Attendance */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'he' ? 'שלב 2: סימון נוכחות התלמיד' : 'Step 2: Record Attendance Status'}</span>
            </h4>
            <span className="text-[11px] text-slate-400">
              {language === 'he' ? 'שליחת התראה מיידית לתלמיד' : 'Instant notification sent to student'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              disabled={!selectedLessonId || markAttendanceMutation.isPending}
              onClick={() => markAttendanceMutation.mutate('ATTENDED')}
              className={`flex items-center justify-center gap-2.5 p-4 rounded-2xl border font-bold text-sm transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-xs ${
                currentLesson?.attendanceStatus === 'ATTENDED'
                  ? 'border-emerald-600 bg-emerald-600 text-white ring-4 ring-emerald-500/20 shadow-md'
                  : 'border-emerald-500/50 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div className="text-start">
                <div className="font-extrabold">{language === 'he' ? 'נוכח בשיעור' : 'Attended'}</div>
                <div className="text-[10px] opacity-80 font-normal">
                  {language === 'he' ? 'אישור קיום השיעור והשתתפות' : 'Lesson completed successfully'}
                </div>
              </div>
            </button>

            <button
              type="button"
              disabled={!selectedLessonId || markAttendanceMutation.isPending}
              onClick={() => markAttendanceMutation.mutate('ABSENT')}
              className={`flex items-center justify-center gap-2.5 p-4 rounded-2xl border font-bold text-sm transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-xs ${
                currentLesson?.attendanceStatus === 'ABSENT'
                  ? 'border-red-600 bg-red-600 text-white ring-4 ring-red-500/20 shadow-md'
                  : 'border-red-500/50 bg-red-50/70 dark:bg-red-950/40 text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/60'
              }`}
            >
              <XCircle className="w-5 h-5 shrink-0" />
              <div className="text-start">
                <div className="font-extrabold">{language === 'he' ? 'נעדר מהשיעור' : 'Absent'}</div>
                <div className="text-[10px] opacity-80 font-normal">
                  {language === 'he' ? 'התלמיד לא התייצב למפגש' : 'Student missed scheduled class'}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* STEP 3: Unlock Practice Game for Student */}
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4 text-brand-teal-600 dark:text-teal-400" />
              <span>
                {language === 'he'
                  ? `שלב 3: פתיחת משחק תרגול עבור ${effectiveStudentName}`
                  : `Step 3: Unlock Post-Lesson Practice Game for ${effectiveStudentName}`}
              </span>
            </h4>
            <span className="text-[11px] font-bold text-brand-olive-600 dark:text-brand-olive-400">
              +XP Rewards
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'he'
              ? 'התלמיד יוכל לשחק במשחק זה פעם 1 לחיזוק החומר שנלמד. המשחק יינעל אוטומטית לאחר סיום עד השיעור הבא.'
              : 'The student can play this unlocked game 1 time to reinforce today’sPaal vocabulary. It locks automatically upon completion until your next class.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <select
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value)}
              className="flex-1 p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-brand-teal-500/40 focus:outline-hidden"
            >
              <option value="">
                {language === 'he' ? 'בחר משחק לפתיחה לתלמיד...' : 'Select a game to unlock for student...'}
              </option>
              {gameList.map((g: any) => (
                <option key={g.id} value={g.id}>
                  {g.title} ({g.gameType}) — +{g.pointsReward} {language === 'he' ? 'נקודות XP' : 'XP pts'}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => unlockGameMutation.mutate()}
              disabled={!selectedGameId || !selectedLessonId || !effectiveStudentId || unlockGameMutation.isPending}
              className="px-6 py-3 bg-brand-olive-500 hover:bg-brand-olive-400 text-slate-950 rounded-xl text-xs font-black shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
            >
              {unlockGameMutation.isPending
                ? (language === 'he' ? 'פותח...' : 'Unlocking...')
                : (language === 'he' ? 'פתח משחק לתלמיד' : 'Unlock Game')}
            </button>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {language === 'he' ? 'השינויים נשמרים ישירות ביומן המערכת' : 'Updates sync instantly with the master calendar'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl transition cursor-pointer shadow-xs active:scale-95"
          >
            {language === 'he' ? 'סיום' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
