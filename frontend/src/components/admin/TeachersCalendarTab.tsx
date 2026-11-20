import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import { toast } from '../../store/toastStore';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarRange,
  Clock,
  User,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Video,
  X,
  ExternalLink,
  Layers,
  Sparkles,
  Info,
  Check,
  ChevronDown,
} from 'lucide-react';
import {
  formatTo12Hour,
  formatSlotRange12Hour,
  calculateSlotEndTime,
  ISRAEL_TZ_LABEL,
} from '../../lib/timeUtils';

export type CalendarViewMode = 'matrix' | 'detailed';
export type LessonFilterCategory = 'ALL' | 'REGULAR' | 'ONE_TIME';

interface TeachersCalendarTabProps {
  initialTeacherId?: string;
  isTeacherSelfView?: boolean;
}

const DAYS_HEADER = [
  { dayIndex: 1, labelEn: 'Mon', labelHe: 'שני', labelAr: 'الإثنين', fullEn: 'Monday', fullHe: 'יום שני', fullAr: 'يوم الإثنين' },
  { dayIndex: 2, labelEn: 'Tue', labelHe: 'שלישי', labelAr: 'الثلاثاء', fullEn: 'Tuesday', fullHe: 'יום שלישי', fullAr: 'يوم الثلاثاء' },
  { dayIndex: 3, labelEn: 'Wed', labelHe: 'רביעי', labelAr: 'الأربعاء', fullEn: 'Wednesday', fullHe: 'יום רביעי', fullAr: 'يوم الأربعاء' },
  { dayIndex: 4, labelEn: 'Thu', labelHe: 'חמישי', labelAr: 'الخميس', fullEn: 'Thursday', fullHe: 'יום חמישי', fullAr: 'يوم الخميس' },
  { dayIndex: 5, labelEn: 'Fri', labelHe: 'שישי', labelAr: 'الجمعة', fullEn: 'Friday', fullHe: 'יום שישי', fullAr: 'يوم الجمعة' },
  { dayIndex: 6, labelEn: 'Sat', labelHe: 'שבת', labelAr: 'السبت', fullEn: 'Saturday', fullHe: 'יום שבת', fullAr: 'يوم السبت' },
  { dayIndex: 0, labelEn: 'Sun', labelHe: 'ראשון', labelAr: 'الأحد', fullEn: 'Sunday', fullHe: 'יום ראשון', fullAr: 'يوم الأحد' },
];

export const TeachersCalendarTab: React.FC<TeachersCalendarTabProps> = ({
  initialTeacherId,
  isTeacherSelfView = false,
}) => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const isHe = language === 'he';
  const isAr = language === 'ar';
  const isRtl = isHe || isAr;

  // 1. View & Filter States
  const [viewMode, setViewMode] = useState<CalendarViewMode>('matrix');
  const [categoryFilter, setCategoryFilter] = useState<LessonFilterCategory>('ALL');
  const [hideInactiveRows, setHideInactiveRows] = useState(true);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);

  // Detailed View: Week Navigation state (defaults to Monday of current week)
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // Popover state for 4-week matrix cell
  const [activePopover, setActivePopover] = useState<{
    time: string;
    dayIndex: number;
    dayLabel: string;
    targetDates: Array<{
      dateStr: string;
      formattedDate: string;
      isBooked: boolean;
      lesson?: any;
    }>;
  } | null>(null);

  // Modal state for viewing booked lesson details
  const [selectedLessonModal, setSelectedLessonModal] = useState<any | null>(null);

  // 2. Fetch All Teachers
  const { data: teachers = [], isLoading: isLoadingTeachers } = useQuery({
    queryKey: ['teachersListForCalendar'],
    queryFn: async () => {
      const res = await api.get('/teachers');
      return res.data.teachers || [];
    },
  });

  // Selected Teacher state
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(() => {
    return initialTeacherId || '';
  });

  // Automatically select first teacher once loaded if none selected
  React.useEffect(() => {
    if (!selectedTeacherId && teachers.length > 0) {
      setSelectedTeacherId(initialTeacherId || teachers[0].id);
    }
  }, [teachers, selectedTeacherId, initialTeacherId]);

  const activeTeacher = useMemo(() => {
    return teachers.find((t: any) => t.id === selectedTeacherId || t.userId === selectedTeacherId) || teachers[0];
  }, [teachers, selectedTeacherId]);

  // 3. Fetch Selected Teacher's Calendar (slots & lessons)
  const { data: calendarData, isLoading: isLoadingCalendar } = useQuery({
    queryKey: ['teacherCalendarData', activeTeacher?.id],
    queryFn: async () => {
      if (!activeTeacher?.id) return { slots: [], lessons: [] };
      const res = await api.get(`/teachers/${activeTeacher.id}/calendar`);
      return res.data;
    },
    enabled: !!activeTeacher?.id,
  });

  const slots: any[] = calendarData?.slots || [];
  const lessons: any[] = calendarData?.lessons || [];

  // Filter lessons based on category filter
  const activeLessons = useMemo(() => {
    return lessons.filter((l: any) => {
      if (l.status === 'CANCELLED_BY_STUDENT' || l.status === 'CANCELLED_BY_TEACHER') return false;
      if (categoryFilter === 'REGULAR' && l.lessonType !== 'REGULAR') return false;
      if (categoryFilter === 'ONE_TIME' && l.lessonType !== 'ONE_TIME') return false;
      return true;
    });
  }, [lessons, categoryFilter]);

  // Calculate 4 upcoming dates for each dayOfWeek (Next 30 Days Window)
  const day4WeekDates = useMemo(() => {
    const map: Record<number, string[]> = {};
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    DAYS_HEADER.forEach(({ dayIndex }) => {
      const dates: string[] = [];
      const currentDay = now.getDay();
      let diff = dayIndex - currentDay;
      if (diff < 0) diff += 7; // Next occurrence

      const base = new Date(now);
      base.setDate(now.getDate() + diff);

      for (let w = 0; w < 4; w++) {
        const d = new Date(base);
        d.setDate(base.getDate() + w * 7);
        dates.push(d.toISOString().split('T')[0]);
      }
      map[dayIndex] = dates;
    });
    return map;
  }, []);

  // Compute all unique start times present in teacher's slots
  const uniqueTimes = useMemo(() => {
    const timeSet = new Set<string>();
    slots.forEach((s: any) => {
      if (s.startTime) timeSet.add(s.startTime);
    });

    if (!hideInactiveRows || timeSet.size === 0) {
      // Return full 30-min schedule from 08:00 to 21:30
      const fullTimes: string[] = [];
      for (let h = 8; h <= 21; h++) {
        fullTimes.push(`${String(h).padStart(2, '0')}:00`);
        fullTimes.push(`${String(h).padStart(2, '0')}:30`);
      }
      return fullTimes;
    }

    return Array.from(timeSet).sort();
  }, [slots, hideInactiveRows]);

  // Helper to check 4-week availability for a slot (Time & Day)
  const getSlot4WeekBreakdown = (dayIndex: number, timeStr: string) => {
    const targetDates = day4WeekDates[dayIndex] || [];
    
    // Check if teacher has an active slot at this day/time
    const hasSlotConfigured = slots.some((s: any) => {
      const matchTime = s.startTime === timeStr;
      if (!matchTime) return false;
      if (s.dayOfWeek === dayIndex) return true;
      if (s.date) {
        const dStr = new Date(s.date).toISOString().split('T')[0];
        return targetDates.includes(dStr);
      }
      return false;
    });

    if (!hasSlotConfigured) {
      return null;
    }

    // Breakdown for each of the 4 dates
    const weekDetails = targetDates.map((dStr) => {
      // Find matching lesson on this date & time
      const bookedLesson = activeLessons.find((l: any) => {
        const lDateStr = new Date(l.scheduledAt).toISOString().split('T')[0];
        const [lh, lm] = [new Date(l.scheduledAt).getUTCHours(), new Date(l.scheduledAt).getUTCMinutes()];
        // Note: scheduledAt can be matched or checked against slot time
        const lTimeStr = `${String(lh).padStart(2, '0')}:${String(lm).padStart(2, '0')}`;
        return lDateStr === dStr && (lTimeStr === timeStr || l.timeSlot?.startTime === timeStr);
      });

      // Also check if timeSlot on this exact date is marked isBooked
      const slotForDate = slots.find((s: any) => {
        if (s.startTime !== timeStr) return false;
        if (!s.date) return false;
        return new Date(s.date).toISOString().split('T')[0] === dStr;
      });

      const isBooked = !!bookedLesson || slotForDate?.isBooked === true || slotForDate?.isAvailable === false;

      const dateObj = new Date(dStr);
      const formattedDate = dateObj.toLocaleDateString(isHe ? 'he-IL' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      return {
        dateStr: dStr,
        formattedDate,
        isBooked,
        lesson: bookedLesson,
      };
    });

    const unavailableCount = weekDetails.filter((w) => w.isBooked).length;

    return {
      hasSlotConfigured: true,
      weekDetails,
      unavailableCount,
      allAvailable: unavailableCount === 0,
      allUnavailable: unavailableCount === 4,
    };
  };

  // Detailed Weekly Calendar Dates calculation (7 days of selected week)
  const detailedWeekDates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate Monday of current week offset
    const currentDay = today.getDay(); // 0 = Sun
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset + currentWeekOffset * 7);

    const weekDays: Array<{
      date: Date;
      dateStr: string;
      dayIndex: number;
      dayLabel: string;
      dayNumber: number;
      monthName: string;
      isToday: boolean;
    }> = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      const isToday = d.toDateString() === new Date().toDateString();

      weekDays.push({
        date: d,
        dateStr: dStr,
        dayIndex: d.getDay(),
        dayLabel: d.toLocaleDateString(isHe ? 'he-IL' : 'en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
        monthName: d.toLocaleDateString(isHe ? 'he-IL' : 'en-US', { month: 'short' }),
        isToday,
      });
    }

    return weekDays;
  }, [currentWeekOffset, isHe]);

  // Current month/year label for Detailed View header
  const weekMonthYearLabel = useMemo(() => {
    if (detailedWeekDates.length === 0) return '';
    const firstDay = detailedWeekDates[0].date;
    const lastDay = detailedWeekDates[6].date;
    const month1 = firstDay.toLocaleDateString(isHe ? 'he-IL' : 'en-US', { month: 'long', year: 'numeric' });
    const month2 = lastDay.toLocaleDateString(isHe ? 'he-IL' : 'en-US', { month: 'long', year: 'numeric' });
    return month1 === month2 ? month1 : `${month1} – ${month2}`;
  }, [detailedWeekDates, isHe]);

  // Filtered teachers list for searchable dropdown
  const filteredTeachers = useMemo(() => {
    if (!teacherSearchQuery.trim()) return teachers;
    const q = teacherSearchQuery.toLowerCase();
    return teachers.filter((t: any) => {
      const name = `${t.user?.firstName || ''} ${t.user?.lastName || ''}`.toLowerCase();
      const bio = (t.bio || '').toLowerCase();
      return name.includes(q) || bio.includes(q);
    });
  }, [teachers, teacherSearchQuery]);

  // Total configured slots count in active view
  const totalConfiguredSlotsCount = useMemo(() => {
    return slots.filter((s: any) => s.isAvailable !== false).length;
  }, [slots]);

  return (
    <div className="space-y-6">
      {/* TOP HEADER CONTROLS CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        
        {/* Row 1: Title, View Switcher & Teacher Dropdown */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left: Title & Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-teal-700 to-indigo-700 text-white flex items-center justify-center font-bold shadow-xs ring-2 ring-brand-teal-400/30">
                <CalendarRange className="w-5 h-5 text-brand-olive-300" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                  {viewMode === 'matrix'
                    ? (isHe ? 'לוח זמינות ומועדים (4 שבועות)' : 'Teacher 4-Week Availability Matrix')
                    : (isHe ? 'לוח שבועי מפורט (Weekly Calendar)' : 'Weekly Calendar')}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {isHe
                    ? 'מעקב מדויק אחר זמינות המורים, שיעורים קבועים (Regular) ושיעורים בודדים (One-Time)'
                    : 'Monitor teacher time slots, recurring regular classes, and one-time lessons'}
                </p>
              </div>
            </div>

            {/* View Switcher Pills */}
            <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center gap-1 border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'matrix'
                    ? 'bg-white dark:bg-slate-900 text-brand-teal-800 dark:text-brand-teal-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isHe ? 'תצוגת 4 שבועות (Matrix)' : '4-Week Matrix'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('detailed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'detailed'
                    ? 'bg-white dark:bg-slate-900 text-brand-teal-800 dark:text-brand-teal-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>{isHe ? 'לוח שבועי מפורט' : 'Weekly Calendar'}</span>
              </button>
            </div>
          </div>

          {/* Right: Teacher Selector Dropdown (with search) */}
          {!isTeacherSelfView && (
            <div className="relative min-w-[260px] sm:min-w-[300px]">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                {isHe ? 'בחר מורה לצפייה בלוח:' : 'Select Teacher to Monitor:'}
              </label>

              <button
                type="button"
                onClick={() => setIsTeacherDropdownOpen(!isTeacherDropdownOpen)}
                className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 flex items-center justify-between gap-3 text-start transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-teal-700 to-indigo-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                    {activeTeacher?.user?.firstName?.charAt(0) || 'T'}
                  </div>
                  <div className="truncate">
                    <p className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                      {activeTeacher ? `${activeTeacher.user?.firstName} ${activeTeacher.user?.lastName}` : 'Select Teacher'}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {activeTeacher?.specialties?.join(', ') || 'Certified Hebrew Instructor'}
                    </p>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isTeacherDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isTeacherDropdownOpen && (
                <div className="absolute top-full mt-2 start-0 w-full z-40 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder={isHe ? 'חיפוש מורה...' : 'Search teacher...'}
                      value={teacherSearchQuery}
                      onChange={(e) => setTeacherSearchQuery(e.target.value)}
                      className="w-full ps-8 pe-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-brand-teal-600"
                    />
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1 p-0.5">
                    {filteredTeachers.map((t: any) => {
                      const isSelected = t.id === activeTeacher?.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSelectedTeacherId(t.id);
                            setIsTeacherDropdownOpen(false);
                            setActivePopover(null);
                          }}
                          className={`w-full p-2 rounded-xl text-start flex items-center justify-between gap-2 transition-all ${
                            isSelected
                              ? 'bg-brand-teal-50 dark:bg-brand-teal-950/70 text-brand-teal-800 dark:text-brand-teal-300 font-bold'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-7 h-7 rounded-lg bg-brand-teal-700 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                              {t.user?.firstName?.charAt(0) || 'T'}
                            </div>
                            <span className="text-xs truncate">{t.user?.firstName} {t.user?.lastName}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-brand-teal-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Row 2: Filtering by Category (All / Regular / One-Time) & Row Toggles */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          
          {/* Categorize Pills (All vs Regular vs One-Time) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                categoryFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-brand-teal-800 dark:text-brand-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isHe ? 'כל השיעורים והמשבצות' : 'All Slots & Bookings'}
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('REGULAR')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                categoryFilter === 'REGULAR'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isHe ? 'חוגים שבועיים קבועים (Regular)' : 'Regular Class Only'}
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('ONE_TIME')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                categoryFilter === 'ONE_TIME'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isHe ? 'שיעורים בודדים (One-Time)' : 'One-Time Lessons'}
            </button>
          </div>

          {/* Right: Hide inactive rows toggle / Navigation for detailed view */}
          <div className="flex items-center gap-3">
            {viewMode === 'matrix' ? (
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={hideInactiveRows}
                  onChange={(e) => setHideInactiveRows(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-teal-700 focus:ring-brand-teal-600 border-slate-300 dark:border-slate-700"
                />
                <span>{isHe ? 'הסתר שעות ללא זמינות (קומפקטי)' : 'Hide empty time rows'}</span>
              </label>
            ) : (
              /* Week Navigation Controls for Detailed View */
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                  {weekMonthYearLabel}
                </span>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
                    className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                    title={isHe ? 'שבוע קודם' : 'Previous Week'}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentWeekOffset(0)}
                    className="px-2 py-0.5 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                  >
                    {isHe ? 'השבוע' : 'Today'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
                    className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                    title={isHe ? 'שבוע הבא' : 'Next Week'}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VIEW 1: 4-WEEK AVAILABILITY MATRIX (IMAGE 1 & IMAGE 3) */}
      {viewMode === 'matrix' && (
        <div className="space-y-4">
          
          {/* Active Filter Banner (Matching Image 1 exact style) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center gap-3 text-xs text-emerald-900 dark:text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="font-semibold leading-relaxed">
              <strong>{isHe ? 'סינון מורה פעיל:' : 'Teacher Filter Active:'}</strong>{' '}
              {isHe
                ? `מציג את לוח הזמנים של ${activeTeacher ? `${activeTeacher.user?.firstName} ${activeTeacher.user?.lastName}` : 'המורה הנבחר'}. כל משבצת מייצגת מחזור חודשי של 4 שבועות. לחץ על משבצת לצפייה בפירוט התאריכים המלא.`
                : `Showing time slots for ${activeTeacher ? `${activeTeacher.user?.firstName} ${activeTeacher.user?.lastName}` : 'the selected teacher'}. Each cell displays a 4-week monthly cycle. Click any slot to view date-by-date breakdown.`}
            </p>
          </div>

          {/* Slots Summary Pill Banner (Matching Image 1) */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-400" />
              <span>
                {isHe
                  ? `מציג ${uniqueTimes.length} שורות זמן פעילות (${uniqueTimes[0] || '08:00'} – ${uniqueTimes[uniqueTimes.length - 1] || '21:30'})`
                  : `Showing ${uniqueTimes.length} available time rows (${uniqueTimes[0] || '08:00'} – ${uniqueTimes[uniqueTimes.length - 1] || '21:30'})`}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded-xs bg-emerald-500 inline-block" />
                <span>{isHe ? 'פנוי (4 שבועות)' : 'Available'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded-xs bg-rose-500 inline-block" />
                <span>{isHe ? 'תפוס / מוזמן' : 'Booked'}</span>
              </span>
            </div>
          </div>

          {/* The 4-Week Matrix Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 font-extrabold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="py-4 px-4 text-center w-28 border-e border-slate-200/60 dark:border-slate-800 text-xs sm:text-sm font-black">
                      {isHe ? 'שעה' : isAr ? 'الوقت' : 'Time'}
                    </th>
                    {DAYS_HEADER.map((d) => (
                      <th key={d.dayIndex} className="py-4 px-4 text-center border-e border-slate-200/60 dark:border-slate-800 last:border-e-0 min-w-[130px] sm:min-w-[145px]">
                        <div className="flex flex-col items-center">
                          <span className="font-black text-xs sm:text-sm text-slate-850 dark:text-slate-100">
                            {isAr ? d.labelAr : isHe ? d.labelHe : d.labelEn}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold mt-0.5 capitalize">
                            {isAr ? d.fullAr : isHe ? d.fullHe : d.fullEn}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {uniqueTimes.map((timeStr) => {
                    return (
                      <tr key={timeStr} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        {/* Time Column - Prominent & Large */}
                        <td className="py-3.5 px-4 font-mono font-black text-xs sm:text-sm text-slate-800 dark:text-slate-100 border-e border-slate-200/60 dark:border-slate-800 whitespace-nowrap bg-slate-50/50 dark:bg-slate-850/50 text-center">
                          {timeStr}
                        </td>

                        {/* 7 Days Columns */}
                        {DAYS_HEADER.map((d) => {
                          const breakdown = getSlot4WeekBreakdown(d.dayIndex, timeStr);

                          if (!breakdown) {
                            return (
                              <td key={d.dayIndex} className="py-3 px-3 text-center text-slate-300 dark:text-slate-600 border-e border-slate-200/60 dark:border-slate-800 last:border-e-0">
                                –
                              </td>
                            );
                          }

                          const isSelectedSlot =
                            activePopover?.time === timeStr && activePopover?.dayIndex === d.dayIndex;

                          return (
                            <td
                              key={d.dayIndex}
                              className="py-3 px-3 border-e border-slate-200/60 dark:border-slate-800 last:border-e-0"
                            >
                              {/* 4 Segmented Bars Pill - Large, Prominent & High Clarity */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActivePopover({
                                    time: timeStr,
                                    dayIndex: d.dayIndex,
                                    dayLabel: isAr ? d.fullAr : isHe ? d.fullHe : d.fullEn,
                                    targetDates: breakdown.weekDetails,
                                  });
                                }}
                                className={`w-full h-10 sm:h-11 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 flex gap-1.5 items-center justify-between border transition-all cursor-pointer shadow-2xs group ${
                                  isSelectedSlot
                                    ? 'ring-2 ring-brand-teal-500 border-brand-teal-500 bg-brand-teal-50/50 dark:bg-brand-teal-950/50 shadow-md'
                                    : 'border-slate-200 dark:border-slate-700/80 hover:border-brand-teal-500 hover:ring-2 hover:ring-brand-teal-500/30'
                                }`}
                                title={`${isAr ? d.fullAr : isHe ? d.fullHe : d.fullEn} ${timeStr} • ${4 - breakdown.unavailableCount}/4 ${isAr ? 'متاح' : isHe ? 'זמינים' : 'available'} • ${isAr ? 'انقر لعرض التفاصيل' : isHe ? 'לחץ לצפייה בפרטים' : 'Click to inspect 4-week availability breakdown'}`}
                              >
                                {breakdown.weekDetails.map((w, idx) => (
                                  <div
                                    key={idx}
                                    className={`flex-1 h-full rounded-md transition-all ${
                                      w.isBooked
                                        ? 'bg-rose-500 group-hover:bg-rose-600 shadow-2xs'
                                        : 'bg-emerald-500 group-hover:bg-emerald-600 shadow-2xs'
                                    }`}
                                  />
                                ))}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: DETAILED WEEKLY CALENDAR (MATCHING IMAGE 2 EXACTLY) */}
      {viewMode === 'detailed' && (
        <div className="space-y-4">
          
          {/* Header Bar */}
          <div className="p-4 rounded-3xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <CalendarDays className="w-5 h-5 text-brand-teal-700 dark:text-brand-teal-400" />
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {isHe ? 'לוח שבועי מפורט לפי תאריכים' : 'Weekly Calendar • Day-by-Day Timeline'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isHe
                    ? `מוצג שבוע: ${weekMonthYearLabel} • שעון ישראל`
                    : `Active Week: ${weekMonthYearLabel} • ${ISRAEL_TZ_LABEL}`}
                </p>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[10px]">
                  {isHe ? 'פתוח (Open)' : 'Open'}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-[10px]">
                  {isHe ? 'סגור (Closed)' : 'Closed'}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[10px]">
                  {isHe ? 'שם תלמיד (מוזמן)' : 'Student Name (Booked)'}
                </span>
              </span>
            </div>
          </div>

          {/* Detailed Weekly Calendar Grid (Matching Image 2) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 font-extrabold border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    {/* Time Column Header */}
                    <th className="py-3.5 px-4 text-start w-28 border-e border-slate-200/60 dark:border-slate-800">
                      {isHe ? 'שעה' : 'Time'}
                    </th>

                    {/* 7 Days of the Week with Date Numbers (Image 2 style) */}
                    {detailedWeekDates.map((d) => (
                      <th
                        key={d.dateStr}
                        className={`py-3 px-3 text-center border-e border-slate-200/60 dark:border-slate-800 last:border-e-0 min-w-[125px] ${
                          d.isToday ? 'bg-brand-teal-50/50 dark:bg-brand-teal-950/30' : ''
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {d.dayLabel}
                        </div>
                        <div className={`text-sm font-black mt-0.5 ${d.isToday ? 'text-brand-teal-800 dark:text-brand-teal-300' : 'text-slate-900 dark:text-white'}`}>
                          {d.dayNumber}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {uniqueTimes.map((timeStr) => {
                    return (
                      <tr key={timeStr} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                        {/* Time Column */}
                        <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 border-e border-slate-200/60 dark:border-slate-800 whitespace-nowrap bg-slate-50/30 dark:bg-slate-850/30">
                          {timeStr}
                        </td>

                        {/* 7 Day Slot Cells (Pill Buttons as in Image 2) */}
                        {detailedWeekDates.map((d) => {
                          // Check if there is an active lesson on this specific date & time
                          const matchingLesson = activeLessons.find((l: any) => {
                            const lDateStr = new Date(l.scheduledAt).toISOString().split('T')[0];
                            const [lh, lm] = [new Date(l.scheduledAt).getUTCHours(), new Date(l.scheduledAt).getUTCMinutes()];
                            const lTimeStr = `${String(lh).padStart(2, '0')}:${String(lm).padStart(2, '0')}`;
                            return lDateStr === d.dateStr && (lTimeStr === timeStr || l.timeSlot?.startTime === timeStr);
                          });

                          // Check if teacher has an open slot configured on this day & time
                          const hasSlot = slots.some((s: any) => {
                            if (s.startTime !== timeStr) return false;
                            if (s.dayOfWeek === d.dayIndex) return true;
                            if (s.date) {
                              return new Date(s.date).toISOString().split('T')[0] === d.dateStr;
                            }
                            return false;
                          });

                          return (
                            <td
                              key={d.dateStr}
                              className={`py-2 px-2.5 border-e border-slate-200/60 dark:border-slate-800 last:border-e-0 text-center ${
                                d.isToday ? 'bg-brand-teal-50/20 dark:bg-brand-teal-950/10' : ''
                              }`}
                            >
                              {matchingLesson ? (
                                /* Booked Slot with Student Name Pill (Image 2) */
                                <button
                                  type="button"
                                  onClick={() => setSelectedLessonModal(matchingLesson)}
                                  className="w-full py-1.5 px-2 rounded-xl text-xs font-bold text-slate-900 dark:text-white bg-indigo-50/90 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all shadow-2xs truncate flex items-center justify-center gap-1.5 cursor-pointer"
                                  title={`${matchingLesson.student?.user?.firstName} ${matchingLesson.student?.user?.lastName} (${matchingLesson.lessonType})`}
                                >
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${matchingLesson.lessonType === 'REGULAR' ? 'bg-indigo-600' : 'bg-amber-500'}`} />
                                  <span className="truncate">
                                    {matchingLesson.student?.user
                                      ? `${matchingLesson.student.user.firstName} ${matchingLesson.student.user.lastName}`
                                      : 'Booked Student'}
                                  </span>
                                </button>
                              ) : hasSlot ? (
                                /* Open Slot Pill (Image 2) */
                                <div className="w-full py-1.5 px-2 rounded-xl text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/80 shadow-2xs select-none">
                                  {isHe ? 'פתוח (Open)' : 'Open'}
                                </div>
                              ) : (
                                /* Closed Slot Pill (Image 2) */
                                <div className="w-full py-1.5 px-2 rounded-xl text-[11px] font-medium text-rose-500/80 dark:text-rose-400/80 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 select-none">
                                  {isHe ? 'סגור' : 'Closed'}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* LESSON DETAILS INSPECTION MODAL */}
      {selectedLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-brand-teal-800 dark:text-brand-teal-400" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {isHe ? 'פרטי שיעור שהוזמן' : 'Booked Lesson Details'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLessonModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">{isHe ? 'שם התלמיד:' : 'Student:'}</span>
                  <span className="font-black text-slate-900 dark:text-white">
                    {selectedLessonModal.student?.user
                      ? `${selectedLessonModal.student.user.firstName} ${selectedLessonModal.student.user.lastName}`
                      : 'Student'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">{isHe ? 'דוא״ל:' : 'Email:'}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {selectedLessonModal.student?.user?.email || '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">{isHe ? 'סוג הזמנה:' : 'Booking Type:'}</span>
                  <span className={`font-black px-2 py-0.5 rounded-full text-[10px] ${
                    selectedLessonModal.lessonType === 'REGULAR'
                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {selectedLessonModal.lessonType === 'REGULAR'
                      ? (isHe ? 'חוג שבועי קבוע (Regular)' : 'Fixed Weekly Regular')
                      : (isHe ? 'שיעור בודד (One-Time)' : 'One-Time Lesson')}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">{isHe ? 'תאריך שיעור:' : 'Scheduled Date:'}</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {new Date(selectedLessonModal.scheduledAt).toLocaleDateString(isHe ? 'he-IL' : 'en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">{isHe ? 'משך השיעור:' : 'Duration:'}</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedLessonModal.durationMinutes || 25} {isHe ? 'דקות' : 'Minutes'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">{isHe ? 'סטטוס:' : 'Status:'}</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    {selectedLessonModal.status}
                  </span>
                </div>
              </div>

              {selectedLessonModal.zoomLink && (
                <div className="pt-1">
                  <a
                    href={selectedLessonModal.zoomLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl bg-brand-olive-500 hover:bg-brand-olive-600 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <Video className="w-4 h-4" />
                    <span>{isHe ? 'הצטרף לשיעור ב-Zoom' : 'Launch Zoom Classroom'}</span>
                  </a>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLessonModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
              >
                {isHe ? 'סגור' : isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LARGE & CLEAR 4-WEEK SLOT DETAILS MODAL */}
      {activePopover && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActivePopover(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl sm:max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-teal-700 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-sm ring-4 ring-brand-teal-500/20">
                  <CalendarRange className="w-6 h-6 text-brand-olive-300" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                      {activePopover.dayLabel} • {activePopover.time}
                    </h3>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold border border-slate-200 dark:border-slate-700">
                      {activePopover.time} – {calculateSlotEndTime(activePopover.time, 25)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {activeTeacher ? `${activeTeacher.user?.firstName} ${activeTeacher.user?.lastName}` : 'Teacher'}
                    </span>
                    <span>•</span>
                    <span>{isHe ? 'מחזור חודשי של 4 שבועות' : isAr ? 'دورة شهرية من 4 أسابيع' : '4-Week Monthly Cycle Breakdown'}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivePopover(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={isHe ? 'סגור' : isAr ? 'إغلاق' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overall 4-Week Status Summary Banner */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${
                    activePopover.targetDates.filter(w => !w.isBooked).length === 4
                      ? 'bg-emerald-500'
                      : activePopover.targetDates.filter(w => !w.isBooked).length > 0
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`} />
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    {activePopover.targetDates.filter(w => !w.isBooked).length}/4 {isHe ? 'שבועות פנויים להזמנה' : isAr ? 'أسابيع متاحة للحجز' : 'Weeks Available for Booking'}
                  </p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {activePopover.targetDates.some(w => w.isBooked)
                    ? (isHe ? 'חלק מהתאריכים כבר הוזמנו על ידי תלמידים (שיעורים קבועים או בודדים)' : isAr ? 'بعض المواعيد محجوزة مسبقاً من قبل الطلاب' : 'Some upcoming dates are booked by students (Regular or One-time)')
                    : (isHe ? 'המשבצת פנויה לחלוטין לחוג שבועי קבוע (Regular) או שיעורים בודדים' : isAr ? 'الفترة شاغرة بالكامل ومتاحة للحجز الأسبوعي المنتظم أو الدروس الفردية' : 'Fully open for recurring weekly regular bookings or individual lessons')}
                </p>
              </div>

              {/* Mini visual indicator */}
              <div className="flex items-center gap-1.5 w-36 h-5 bg-slate-200 dark:bg-slate-750 p-1 rounded-xl shrink-0">
                {activePopover.targetDates.map((w, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 h-full rounded-sm transition-colors ${
                      w.isBooked ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    title={`Week ${idx + 1}: ${w.isBooked ? 'Booked' : 'Available'}`}
                  />
                ))}
              </div>
            </div>

            {/* 4 Spacious Date Cards */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                {isHe ? 'פירוט לפי שבועות ותאריכים' : isAr ? 'تفاصيل المواعيد لكل أسبوع' : 'Detailed Week-by-Week Breakdown'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {activePopover.targetDates.map((w, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      w.isBooked
                        ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200/90 dark:border-rose-900/60 shadow-xs'
                        : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/90 dark:border-emerald-900/60 shadow-xs'
                    }`}
                  >
                    {/* Week Index & Status Chip */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/60 dark:border-slate-800/60">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {isHe ? `שבוע ${idx + 1}` : isAr ? `الأسبوع ${idx + 1}` : `Week ${idx + 1}`}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          w.isBooked
                            ? 'bg-rose-600 text-white shadow-2xs'
                            : 'bg-emerald-600 text-white shadow-2xs'
                        }`}
                      >
                        {w.isBooked ? (isHe ? 'תפוס / מוזמן' : isAr ? 'محجوز' : 'Booked') : (isHe ? 'פנוי' : isAr ? 'متاح' : 'Available')}
                      </span>
                    </div>

                    {/* Date and Time */}
                    <div className="mt-3">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white">
                        <CalendarDays className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-400 shrink-0" />
                        <span>{w.formattedDate}</span>
                      </div>
                      <p className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400 mt-1 ps-6">
                        {activePopover.time} – {calculateSlotEndTime(activePopover.time, w.lesson?.durationMinutes || 25)}
                      </p>
                    </div>

                    {/* Booked Student Details or Availability Explanation */}
                    {w.lesson ? (
                      <div className="mt-3 pt-2.5 border-t border-rose-200/60 dark:border-rose-800/50 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white truncate">
                            <User className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span className="truncate">
                              {w.lesson.student?.user
                                ? `${w.lesson.student.user.firstName} ${w.lesson.student.user.lastName}`
                                : 'Student'}
                            </span>
                          </div>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                            w.lesson.lessonType === 'REGULAR'
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {w.lesson.lessonType === 'REGULAR'
                              ? (isHe ? 'חוג קבוע' : isAr ? 'حجز منتظم' : 'Regular')
                              : (isHe ? 'שיעור בודד' : isAr ? 'درس فردي' : 'One-time')}
                          </span>
                        </div>
                        {w.lesson.student?.user?.email && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {w.lesson.student.user.email}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedLessonModal(w.lesson)}
                          className="w-full mt-1 py-1.5 px-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <Video className="w-3.5 h-3.5 text-brand-teal-700" />
                          <span>{isHe ? 'צפה בפרטי שיعור וקישור Zoom' : isAr ? 'عرض تفاصيل الدرس ورابط Zoom' : 'View Lesson Details & Zoom'}</span>
                        </button>
                      </div>
                    ) : w.isBooked ? (
                      <div className="mt-3 pt-2 text-[11px] text-rose-700 dark:text-rose-300 italic font-medium">
                        {isHe ? 'מועד סגור או תפוס' : isAr ? 'الموعد محجوز أو مغلق' : 'Closed or reserved slot'}
                      </div>
                    ) : (
                      <div className="mt-3 pt-2.5 border-t border-emerald-200/60 dark:border-emerald-800/50 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{isHe ? 'פנוי לחוג קבוע או שיעור בודד' : isAr ? 'متاح للحجز المنتظم أو الفردي' : 'Open for recurring or single booking'}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setActivePopover(null);
                  setViewMode('detailed');
                }}
                className="w-full sm:w-auto py-2.5 px-5 rounded-2xl bg-brand-teal-800 hover:bg-brand-teal-900 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <CalendarDays className="w-4 h-4 text-brand-olive-300" />
                <span>{isHe ? 'צפה בלוח השבועי המפורט' : isAr ? 'عرض في التقويم الأسبوعي المفصل' : 'View in Detailed Calendar'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePopover(null)}
                className="w-full sm:w-auto py-2.5 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs transition-colors"
              >
                {isHe ? 'סגור' : isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
