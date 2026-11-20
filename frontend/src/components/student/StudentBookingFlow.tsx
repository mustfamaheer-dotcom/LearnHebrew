import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { toast } from '../../store/toastStore';
import { haptics } from '../../utils/haptics';
import {
  formatSlotRange12Hour,
  calculateSlotEndTime,
  ISRAEL_TZ_LABEL,
  formatTo12Hour,
} from '../../lib/timeUtils';
import {
  Clock,
  Calendar,
  CalendarDays,
  CalendarRange,
  Repeat,
  CheckCircle,
  AlertCircle,
  Info,
  Star,
  Search,
  User,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Layers,
  ArrowRight,
  CalendarCheck,
  RefreshCw,
  X,
} from 'lucide-react';

interface StudentBookingFlowProps {
  studentId: string;
  sessionBalances: any[];
  packageAllowance: any;
  teachersData: any[];
  language: string;
  isModal?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  initialMode?: 'onetime' | 'regular';
  initialDuration?: 25 | 40 | 55;
}

const DAYS_LIST_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_LIST_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export const StudentBookingFlow: React.FC<StudentBookingFlowProps> = ({
  studentId,
  sessionBalances,
  packageAllowance,
  teachersData = [],
  language,
  isModal = false,
  onClose,
  onSuccess,
  initialMode = 'onetime',
  initialDuration = 25,
}) => {
  const queryClient = useQueryClient();

  // Step 1: Session Type & Duration
  const [bookingMode, setBookingMode] = useState<'onetime' | 'regular'>(initialMode);
  const [selectedDuration, setSelectedDuration] = useState<25 | 40 | 55>(initialDuration);

  // Step 2: Date & Time
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [bookingDate, setBookingDate] = useState<string>(tomorrowStr);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>('');
  const [regularActiveDay, setRegularActiveDay] = useState<number>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.getDay();
  });
  const [selectedRegularSlots, setSelectedRegularSlots] = useState<Array<{ dayOfWeek: number; startTime: string }>>([]);

  // Step 3: Teacher Selection & Filter
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [teacherSearch, setTeacherSearch] = useState<string>('');
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Package calculation rules
  const pkgTotalLessons = packageAllowance?.totalLessons || packageAllowance?.lessonsCount || 0;
  const maxWeeklyRegularSlots = useMemo(() => {
    if (pkgTotalLessons >= 16) return 4;
    if (pkgTotalLessons >= 12) return 3;
    if (pkgTotalLessons >= 8) return 2;
    return 1;
  }, [pkgTotalLessons]);

  const selectedSessionBalance = useMemo(() => {
    return sessionBalances.find((sb: any) => sb.sessionType?.durationMinutes === selectedDuration);
  }, [sessionBalances, selectedDuration]);

  const hasEnoughBalance = (selectedSessionBalance?.balance || 0) > 0;
  const hasEnoughBalanceForRegular = (selectedSessionBalance?.balance || 0) >= Math.max(4, selectedRegularSlots.length * 4);

  // Helper: check if a teacher has a conflict on a specific date and time
  const isTeacherConflictOnDate = (teacher: any, dateStr: string, startTime: string, duration: number) => {
    if (!teacher || !teacher.lessons) return false;
    const [sH, sM] = startTime.split(':').map(Number);
    const startMs = (sH * 60 + sM) * 60 * 1000;
    const endMs = startMs + duration * 60 * 1000;

    return (teacher.lessons || []).some((l: any) => {
      if (l.status === 'CANCELLED') return false;
      const lDateStr = new Date(l.scheduledAt).toISOString().split('T')[0];
      if (lDateStr !== dateStr || l.status !== 'SCHEDULED') return false;
      const lDate = new Date(l.scheduledAt);
      const lH = lDate.getHours();
      const lM = lDate.getMinutes();
      const lStartMs = (lH * 60 + lM) * 60 * 1000;
      const lDur = l.durationMinutes || 25;
      const lEndMs = lStartMs + lDur * 60 * 1000;
      return startMs < lEndMs && endMs > lStartMs;
    });
  };

  // Helper: check regular 4-week conflict
  const checkTeacherRegularConflict = (teacher: any, dayOfWeek: number, startTime: string, duration: number) => {
    if (!teacher || !teacher.lessons) return { hasConflict: false };
    const now = new Date();
    const [h, m] = startTime.split(':').map(Number);
    let daysUntil = (dayOfWeek - now.getDay() + 7) % 7;
    if (daysUntil === 0) daysUntil = 7;
    const first = new Date(now);
    first.setDate(now.getDate() + daysUntil);
    first.setHours(h, m, 0, 0);

    for (let w = 0; w < 4; w++) {
      const targetDate = new Date(first);
      targetDate.setDate(first.getDate() + w * 7);
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
          conflictingWeek: w + 1,
          conflictingDate: targetDate.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
            month: 'short',
            day: 'numeric',
          }),
        };
      }
    }
    return { hasConflict: false };
  };

  // 1. Gather all unique available start times on the chosen date across ALL teachers
  const availableSlotsOnDate = useMemo(() => {
    if (!bookingDate) return [];
    const dayOfWeek = new Date(bookingDate + 'T00:00:00').getDay();
    const slotMap = new Map<string, string[]>(); // startTime -> teacherIds[]

    for (const t of teachersData) {
      const openSlots = (t.timeSlots || []).filter(
        (s: any) => s.dayOfWeek === dayOfWeek && s.isAvailable !== false
      );
      for (const slot of openSlots) {
        if (!isTeacherConflictOnDate(t, bookingDate, slot.startTime, selectedDuration)) {
          const list = slotMap.get(slot.startTime) || [];
          list.push(t.id);
          slotMap.set(slot.startTime, list);
        }
      }
    }

    const times = Array.from(slotMap.entries()).map(([time, teacherIds]) => ({
      time,
      teacherCount: teacherIds.length,
      teacherIds,
    }));

    return times.sort((a, b) => a.time.localeCompare(b.time));
  }, [bookingDate, teachersData, selectedDuration]);

  // 2. Gather all unique weekly recurring slots on regularActiveDay across ALL teachers
  const availableRegularSlotsOnDay = useMemo(() => {
    const slotMap = new Map<string, string[]>();

    for (const t of teachersData) {
      const openSlots = (t.timeSlots || []).filter(
        (s: any) => s.dayOfWeek === regularActiveDay && s.isAvailable !== false
      );
      for (const slot of openSlots) {
        const conflict = checkTeacherRegularConflict(t, regularActiveDay, slot.startTime, selectedDuration);
        if (!conflict.hasConflict) {
          const list = slotMap.get(slot.startTime) || [];
          list.push(t.id);
          slotMap.set(slot.startTime, list);
        }
      }
    }

    const times = Array.from(slotMap.entries()).map(([time, teacherIds]) => ({
      time,
      teacherCount: teacherIds.length,
      teacherIds,
    }));

    return times.sort((a, b) => a.time.localeCompare(b.time));
  }, [regularActiveDay, teachersData, selectedDuration]);

  // 3. For the currently selected slot time, which teachers are available?
  const teachersAvailabilityForSelectedTime = useMemo(() => {
    if (!selectedSlotTime) {
      return { availableTeachers: [], unavailableTeachers: [] };
    }

    const available: any[] = [];
    const unavailable: any[] = [];

    const dayOfWeek = bookingMode === 'onetime'
      ? new Date(bookingDate + 'T00:00:00').getDay()
      : regularActiveDay;

    for (const t of teachersData) {
      const hasSlot = (t.timeSlots || []).some(
        (s: any) => s.dayOfWeek === dayOfWeek && s.startTime === selectedSlotTime && s.isAvailable !== false
      );

      let isAvailable = false;
      let conflictReason = '';

      if (hasSlot) {
        if (bookingMode === 'onetime') {
          const conflict = isTeacherConflictOnDate(t, bookingDate, selectedSlotTime, selectedDuration);
          if (!conflict) isAvailable = true;
          else conflictReason = language === 'he' ? 'תפוס במועד זה' : 'Booked at this time';
        } else {
          const conflict = checkTeacherRegularConflict(t, regularActiveDay, selectedSlotTime, selectedDuration);
          if (!conflict.hasConflict) isAvailable = true;
          else conflictReason = language === 'he' ? `תפוס בשבוע ${conflict.conflictingWeek}` : `Conflict Wk ${conflict.conflictingWeek}`;
        }
      } else {
        conflictReason = language === 'he' ? 'אין משבצת בשעה זו' : 'No slot at this hour';
      }

      // Calculate this teacher's other open slots on this day
      const otherTimesOnDay = (t.timeSlots || [])
        .filter((s: any) => s.dayOfWeek === dayOfWeek && s.startTime !== selectedSlotTime && s.isAvailable !== false)
        .filter((s: any) => {
          if (bookingMode === 'onetime') {
            return !isTeacherConflictOnDate(t, bookingDate, s.startTime, selectedDuration);
          }
          return !checkTeacherRegularConflict(t, regularActiveDay, s.startTime, selectedDuration).hasConflict;
        })
        .map((s: any) => s.startTime)
        .sort();

      const item = { ...t, isAvailable, conflictReason, otherTimesOnDay };

      if (isAvailable) {
        available.push(item);
      } else {
        unavailable.push(item);
      }
    }

    return { availableTeachers: available, unavailableTeachers: unavailable };
  }, [selectedSlotTime, bookingMode, bookingDate, regularActiveDay, teachersData, selectedDuration, language]);

  // Selected teacher object
  const selectedTeacher = useMemo(() => {
    return teachersData.find((t: any) => t.id === selectedTeacherId);
  }, [teachersData, selectedTeacherId]);

  // Is selected teacher available at chosen slot?
  const isSelectedTeacherAvailableAtSlot = useMemo(() => {
    if (!selectedTeacher || !selectedSlotTime) return false;
    return teachersAvailabilityForSelectedTime.availableTeachers.some((t: any) => t.id === selectedTeacherId);
  }, [selectedTeacher, selectedSlotTime, teachersAvailabilityForSelectedTime]);

  // Alternative open times for the selected teacher on this day
  const selectedTeacherAlternativeTimes = useMemo(() => {
    if (!selectedTeacher) return [];
    const unavail = teachersAvailabilityForSelectedTime.unavailableTeachers.find((t: any) => t.id === selectedTeacherId);
    return unavail?.otherTimesOnDay || [];
  }, [selectedTeacher, teachersAvailabilityForSelectedTime]);

  // Auto-select first available teacher if currently none selected or selection invalidated
  const handleSelectTimeSlot = (time: string) => {
    haptics.tap();
    setSelectedSlotTime(time);
    setBookingError(null);

    // If currently selected teacher is available at this new time, keep them!
    const dayOfWeek = bookingMode === 'onetime'
      ? new Date(bookingDate + 'T00:00:00').getDay()
      : regularActiveDay;

    const currentTeacherIsAvailable = teachersData.some((t) => {
      if (t.id !== selectedTeacherId) return false;
      const has = (t.timeSlots || []).some((s: any) => s.dayOfWeek === dayOfWeek && s.startTime === time && s.isAvailable !== false);
      if (!has) return false;
      if (bookingMode === 'onetime') return !isTeacherConflictOnDate(t, bookingDate, time, selectedDuration);
      return !checkTeacherRegularConflict(t, regularActiveDay, time, selectedDuration).hasConflict;
    });

    if (!currentTeacherIsAvailable) {
      // Find the first available teacher for this slot and pre-select them for ease of use
      for (const t of teachersData) {
        const has = (t.timeSlots || []).some((s: any) => s.dayOfWeek === dayOfWeek && s.startTime === time && s.isAvailable !== false);
        if (has) {
          const ok = bookingMode === 'onetime'
            ? !isTeacherConflictOnDate(t, bookingDate, time, selectedDuration)
            : !checkTeacherRegularConflict(t, regularActiveDay, time, selectedDuration).hasConflict;
          if (ok) {
            setSelectedTeacherId(t.id);
            break;
          }
        }
      }
    }
  };

  // Toggle regular slot
  const toggleRegularSlotSelection = (dayOfWeek: number, startTime: string) => {
    haptics.tap();
    const exists = selectedRegularSlots.some((s) => s.dayOfWeek === dayOfWeek && s.startTime === startTime);
    if (exists) {
      setSelectedRegularSlots((prev) => prev.filter((s) => !(s.dayOfWeek === dayOfWeek && s.startTime === startTime)));
      setBookingError(null);
    } else {
      if (selectedRegularSlots.length >= maxWeeklyRegularSlots) {
        const msg = language === 'he'
          ? `הגעת למקסימום המותר בחבילה שלך: ${maxWeeklyRegularSlots} מועדים שבועיים קבועים.`
          : `You have reached the limit for your package: ${maxWeeklyRegularSlots} weekly regular slot(s).`;
        setBookingError(msg);
        toast.warning(msg);
        return;
      }
      setSelectedRegularSlots((prev) => [...prev, { dayOfWeek, startTime }]);
      setBookingError(null);
    }
  };

  // Mutations
  const bookLessonMutation = useMutation({
    mutationFn: async (payload: any) => api.post('/lessons', payload),
    onSuccess: () => {
      haptics.success();
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['studentTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['availableTeachers'] });
      toast.success(
        language === 'he'
          ? `שיעור (${selectedDuration} דקות) הוזמן בהצלחה! 1 שיעור נוכה מיתרתך.`
          : `${selectedDuration}-Minute Lesson booked successfully! 1 session deducted.`,
        language === 'he' ? 'ההזמנה אושרה' : 'Booking Confirmed'
      );
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.response?.data?.error || (
        language === 'he' ? 'שגיאה בהזמנת השיעור. אנא נסה שוב.' : 'Failed to book session. Please try again.'
      );
      setBookingError(msg);
      toast.error(msg);
    },
  });

  const bookRegularMutation = useMutation({
    mutationFn: async (payload: any) => api.post('/lessons/regular', payload),
    onSuccess: (res: any) => {
      haptics.success();
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['studentTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['availableTeachers'] });
      const totalBooked = res.data?.totalLessons || selectedRegularSlots.length * 4;
      toast.success(
        language === 'he'
          ? `נקבעו בהצלחה ${totalBooked} שיעורים שבועיים קבועים ל-4 השבועות הקרובים!`
          : `Successfully booked ${totalBooked} regular weekly lessons across the next 4 weeks!`,
        language === 'he' ? 'חוג שבועי קבוע אושר' : 'Regular Booking Confirmed'
      );
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.response?.data?.error || (
        language === 'he' ? 'שגיאה בהזמנת השיעורים הקבועים.' : 'Failed to book regular schedule.'
      );
      setBookingError(msg);
      toast.error(msg);
    },
  });

  // Submit Handler
  const handleConfirmBooking = () => {
    if (!hasEnoughBalance) {
      toast.error(language === 'he' ? 'אין יתרה מספקת בחבילה.' : 'Insufficient package quota.');
      return;
    }

    if (!selectedTeacherId) {
      const err = language === 'he' ? 'אנא בחר מורה מוסמך.' : 'Please select a certified teacher.';
      setBookingError(err);
      toast.warning(err);
      return;
    }

    if (bookingMode === 'onetime') {
      if (!bookingDate || !selectedSlotTime) {
        const err = language === 'he' ? 'אנא בחר תאריך ושעה לשיעור.' : 'Please select a date and time slot.';
        setBookingError(err);
        toast.warning(err);
        return;
      }
      if (!isSelectedTeacherAvailableAtSlot) {
        const err = language === 'he'
          ? `המורה ${selectedTeacher?.user?.firstName} אינו זמין בשעה זו. בחר מורה זמין או שנה שעה.`
          : `Teacher is not available at this hour. Please select an available teacher or pick another time.`;
        setBookingError(err);
        toast.warning(err);
        return;
      }

      const startDateTime = new Date(`${bookingDate}T${selectedSlotTime}:00`);
      bookLessonMutation.mutate({
        teacherId: selectedTeacherId,
        studentId,
        scheduledAt: startDateTime.toISOString(),
        durationMinutes: selectedDuration,
        sessionTypeId: selectedSessionBalance?.sessionTypeId,
        lessonType: 'ONE_TIME',
      });
    } else {
      // Regular schedule submit
      if (selectedRegularSlots.length === 0) {
        const err = language === 'he' ? 'אנא בחר לפחות מועד שבועי אחד.' : 'Please select at least one weekly slot.';
        setBookingError(err);
        toast.warning(err);
        return;
      }

      bookRegularMutation.mutate({
        teacherId: selectedTeacherId,
        studentId,
        recurringSlots: selectedRegularSlots,
        durationMinutes: selectedDuration,
        sessionTypeId: selectedSessionBalance?.sessionTypeId,
        weeksCount: 4,
      });
    }
  };

  // Next 14 days list for quick date strip
  const upcoming14Days = useMemo(() => {
    const list: Array<{ dateStr: string; dayName: string; dayNumber: number; monthName: string; dayOfWeek: number }> = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      list.push({
        dateStr,
        dayName: language === 'he' ? DAYS_LIST_HE[dayOfWeek] : DAYS_LIST_EN[dayOfWeek].slice(0, 3),
        dayNumber: d.getDate(),
        monthName: d.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', { month: 'short' }),
        dayOfWeek,
      });
    }
    return list;
  }, [language]);

  return (
    <div className="space-y-6">
      {/* HEADER / MODAL TOP BAR */}
      {isModal && (
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-teal-800 dark:text-brand-teal-400" />
            <h2 className="font-bold text-base text-slate-900 dark:text-white">
              {language === 'he' ? 'הזמנת שיעור עברית מהיר' : 'Book a Hebrew Session'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ERROR BANNER */}
      {bookingError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{bookingError}</span>
        </div>
      )}

      {/* STEP 1: CHOOSE SESSION TYPE & DURATION */}
      <div className="space-y-4 bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-teal-800 dark:bg-brand-teal-500 text-white font-black text-xs flex items-center justify-center">
              1
            </span>
            <label className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              {language === 'he' ? 'בחר סוג שיעור ומשך' : 'Choose Session Type & Duration'}
            </label>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
            <Layers className="w-4 h-4 text-emerald-500" />
            <span>
              {language === 'he' ? 'יתרת חבילה זמינה:' : 'Package Quota:'}{' '}
              <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                {selectedSessionBalance?.balance || 0}
              </strong>{' '}
              {language === 'he' ? `שיעורי ${selectedDuration} דק׳` : `${selectedDuration}m sessions`}
            </span>
          </div>
        </div>

        {/* 2 Tabs: One-Time vs Regular Booking */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              haptics.tap();
              setBookingMode('onetime');
              setSelectedSlotTime('');
              setBookingError(null);
            }}
            className={`py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all ${
              bookingMode === 'onetime'
                ? 'bg-brand-teal-800 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>{language === 'he' ? 'שיעור בודד (גמיש)' : 'One-Time Lesson (Flexible)'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              haptics.tap();
              setBookingMode('regular');
              setSelectedSlotTime('');
              setBookingError(null);
            }}
            className={`py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all ${
              bookingMode === 'regular'
                ? 'bg-brand-teal-800 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Repeat className="w-4 h-4" />
            <span>{language === 'he' ? 'חוג שבועי קבוע (4 שבועות)' : 'Regular Booking (4 Weeks)'}</span>
          </button>
        </div>

        {/* Duration Selector */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
          {[25, 40, 55].map((dur) => {
            const count = sessionBalances.find((sb: any) => sb.sessionType?.durationMinutes === dur)?.balance || 0;
            const isSelected = selectedDuration === dur;
            return (
              <button
                key={dur}
                type="button"
                onClick={() => {
                  haptics.tap();
                  setSelectedDuration(dur as 25 | 40 | 55);
                  setSelectedSlotTime('');
                  setSelectedRegularSlots([]);
                  setBookingError(null);
                }}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'border-brand-teal-800 bg-brand-teal-50 dark:bg-brand-teal-950/60 ring-2 ring-brand-teal-500 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className={`text-xs sm:text-sm font-extrabold ${isSelected ? 'text-brand-teal-900 dark:text-brand-teal-200' : 'text-slate-800 dark:text-slate-200'}`}>
                  {dur} {language === 'he' ? 'דקות' : 'Minutes'}
                </div>
                <div className={`text-[10px] font-extrabold mt-1 inline-block px-2 py-0.5 rounded-md ${
                  count > 0
                    ? isSelected ? 'bg-brand-teal-800 text-white' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}>
                  {count} {language === 'he' ? 'זמינים' : 'left'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 2: CALENDAR & CHOOSE NEEDED TIME */}
      <div className="space-y-4 bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-teal-800 dark:bg-brand-teal-500 text-white font-black text-xs flex items-center justify-center">
              2
            </span>
            <label className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              {bookingMode === 'onetime'
                ? (language === 'he' ? 'בחר תאריך ושעה רצויה מהלוח' : 'Select Date & Desired Time Slot')
                : (language === 'he' ? 'בחר יום ושעה שבועית קבועה' : 'Select Day & Recurring Weekly Slot')}
            </label>
          </div>

          <div className="text-[11px] font-bold text-brand-teal-800 dark:text-brand-teal-300 bg-brand-teal-50 dark:bg-brand-teal-950/60 px-2.5 py-1 rounded-lg border border-brand-teal-200/60 dark:border-brand-teal-800/60 self-start sm:self-auto">
            {language === 'he' ? 'שעון ישראל • 12 שעות AM/PM' : `${ISRAEL_TZ_LABEL} • 12h AM/PM`}
          </div>
        </div>

        {/* ONE-TIME CALENDAR VIEW: 14-DAY STRIP & DATE PICKER */}
        {bookingMode === 'onetime' && (
          <div className="space-y-3">
            {/* Horizontal 14-day quick strip */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
              {upcoming14Days.map((item) => {
                const isSelected = bookingDate === item.dateStr;
                return (
                  <button
                    key={item.dateStr}
                    type="button"
                    onClick={() => {
                      haptics.tap();
                      setBookingDate(item.dateStr);
                      setSelectedSlotTime('');
                      setBookingError(null);
                    }}
                    className={`shrink-0 w-16 sm:w-20 py-2 px-1 text-center rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-brand-teal-800 text-white border-brand-teal-800 shadow-md ring-2 ring-brand-teal-400'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="block text-[10px] font-bold uppercase tracking-wider opacity-80">
                      {item.dayName}
                    </span>
                    <span className="block text-base sm:text-lg font-black my-0.5">
                      {item.dayNumber}
                    </span>
                    <span className="block text-[10px] font-medium opacity-75">
                      {item.monthName}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Date Input Fallback */}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs text-slate-500 font-semibold">
                {language === 'he' ? 'או בחר תאריך אחר:' : 'Or pick custom date:'}
              </span>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={bookingDate}
                onChange={(e) => {
                  setBookingDate(e.target.value);
                  setSelectedSlotTime('');
                  setBookingError(null);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs focus:ring-2 focus:ring-brand-teal-800 focus:outline-none"
              />
            </div>

            {/* Display Available Times on Selected Date */}
            <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'he'
                    ? `שעות זמינות בתאריך ${bookingDate} (${availableSlotsOnDate.length} שעות פנויות):`
                    : `Available Times on ${bookingDate} (${availableSlotsOnDate.length} available slots):`}
                </span>
                {selectedSlotTime && (
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{language === 'he' ? 'נבחרה שעה:' : 'Selected:'} {formatTo12Hour(selectedSlotTime)}</span>
                  </span>
                )}
              </div>

              {availableSlotsOnDate.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center text-xs text-amber-800 dark:text-amber-200 font-semibold space-y-1">
                  <p>{language === 'he' ? 'אין שעות פנויות בתאריך זה אצל אף מורה.' : 'No available slots on this date across all teachers.'}</p>
                  <p className="text-[11px] opacity-80">{language === 'he' ? 'אנא בחר יום אחר מהלוח למעלה.' : 'Please select another date from the calendar above.'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 pt-1 max-h-56 overflow-y-auto p-1">
                  {availableSlotsOnDate.map((slot) => {
                    const isSelected = selectedSlotTime === slot.time;
                    const slotEnd = calculateSlotEndTime(slot.time, selectedDuration);
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => handleSelectTimeSlot(slot.time)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-brand-teal-800 text-white border-brand-teal-800 ring-2 ring-brand-teal-400 shadow-md'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-brand-teal-400 text-slate-800 dark:text-slate-200 shadow-2xs'
                        }`}
                      >
                        <div className="font-mono text-xs font-black">
                          {formatSlotRange12Hour(slot.time, slotEnd)}
                        </div>
                        <div className={`text-[10px] font-bold mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        }`}>
                          <User className="w-2.5 h-2.5" />
                          <span>
                            {slot.teacherCount} {language === 'he' ? (slot.teacherCount === 1 ? 'מורה זמין' : 'מורים זמינים') : (slot.teacherCount === 1 ? 'teacher' : 'teachers')}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* REGULAR BOOKING VIEW: DAY SELECTOR & RECURRING SLOTS */}
        {bookingMode === 'regular' && (
          <div className="space-y-3">
            {/* Weekday Selector */}
            <div className="grid grid-cols-7 gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              {DAYS_LIST_EN.map((dayName, idx) => {
                const isSelected = regularActiveDay === idx;
                const selectedInDay = selectedRegularSlots.filter((s) => s.dayOfWeek === idx).length;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      haptics.tap();
                      setRegularActiveDay(idx);
                      setSelectedSlotTime('');
                      setBookingError(null);
                    }}
                    className={`py-2 px-1 text-center rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-brand-teal-800 text-white font-extrabold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="block text-[11px] font-bold">
                      {language === 'he' ? DAYS_LIST_HE[idx] : dayName.slice(0, 3)}
                    </span>
                    {selectedInDay > 0 && (
                      <span className="text-[10px] block font-black text-amber-300">
                        ✓ {selectedInDay}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Available weekly slots on regularActiveDay */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'he'
                    ? `שעות שבועיות קבועות ביום ${DAYS_LIST_HE[regularActiveDay]} (4 שבועות ברצף):`
                    : `Fixed Weekly Slots on ${DAYS_LIST_EN[regularActiveDay]} (4 Weeks Recurring):`}
                </span>
                <span className="text-xs font-extrabold text-brand-teal-800 dark:text-brand-teal-300">
                  {language === 'he' ? 'נבחרו:' : 'Selected:'} {selectedRegularSlots.length} / {maxWeeklyRegularSlots}
                </span>
              </div>

              {availableRegularSlotsOnDay.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center text-xs text-amber-800 dark:text-amber-200 font-semibold">
                  {language === 'he'
                    ? `אין שעות שבועיות קבועות פנויות ביום ${DAYS_LIST_HE[regularActiveDay]}. אנא בחר יום אחר.`
                    : `No available regular recurring slots on ${DAYS_LIST_EN[regularActiveDay]}. Please choose another day.`}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1 max-h-56 overflow-y-auto p-1">
                  {availableRegularSlotsOnDay.map((slot) => {
                    const isSelected = selectedRegularSlots.some(
                      (s) => s.dayOfWeek === regularActiveDay && s.startTime === slot.time
                    );
                    const slotEnd = calculateSlotEndTime(slot.time, selectedDuration);
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => {
                          handleSelectTimeSlot(slot.time);
                          toggleRegularSlotSelection(regularActiveDay, slot.time);
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-brand-teal-800 text-white border-brand-teal-800 ring-2 ring-brand-teal-400 shadow-md'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-brand-teal-400 text-slate-800 dark:text-slate-200 shadow-2xs'
                        }`}
                      >
                        <div className="font-mono text-xs font-black">
                          {formatSlotRange12Hour(slot.time, slotEnd)}
                        </div>
                        <div className={`text-[10px] font-bold mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        }`}>
                          <span>{isSelected ? '✓ ' + (language === 'he' ? 'נבחר' : 'Selected') : `${slot.teacherCount} ${language === 'he' ? 'מורים' : 'teachers'}`}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* STEP 3: TEACHERS AVAILABILITY FOR THE SELECTED TIME & TEACHER SWITCHER */}
      <div className="space-y-4 bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-teal-800 dark:bg-brand-teal-500 text-white font-black text-xs flex items-center justify-center">
              3
            </span>
            <label className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              {language === 'he' ? 'בחר מורה מוסמך ובדוק זמינות לשעה הנבחרת' : 'Choose Teacher & Check Real-time Availability'}
            </label>
          </div>

          {/* Quick Teacher Search Input */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === 'he' ? 'חפש מורה לפי שם...' : 'Search teacher...'}
              value={teacherSearch}
              onChange={(e) => setTeacherSearch(e.target.value)}
              className="w-full ps-8 pe-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-teal-800"
            />
          </div>
        </div>

        {/* Selected Teacher Status Banner */}
        {selectedTeacher && selectedSlotTime && (
          <div className={`p-4 rounded-2xl border transition-all ${
            isSelectedTeacherAvailableAtSlot
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isSelectedTeacherAvailableAtSlot ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
              }`}>
                {isSelectedTeacherAvailableAtSlot ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-xs sm:text-sm">
                    {selectedTeacher.user?.firstName} {selectedTeacher.user?.lastName}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                    isSelectedTeacherAvailableAtSlot
                      ? 'bg-emerald-200 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200'
                      : 'bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200'
                  }`}>
                    {isSelectedTeacherAvailableAtSlot
                      ? (language === 'he' ? `✓ זמין בשעה ${formatTo12Hour(selectedSlotTime)}!` : `✓ Available at ${formatTo12Hour(selectedSlotTime)}!`)
                      : (language === 'he' ? `לא זמין בשעה ${formatTo12Hour(selectedSlotTime)}` : `Not Available at ${formatTo12Hour(selectedSlotTime)}`)}
                  </span>
                </div>

                {!isSelectedTeacherAvailableAtSlot && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                      {language === 'he'
                        ? `המורה ${selectedTeacher.user?.firstName} תפוס בשעה ${formatTo12Hour(selectedSlotTime)}. באפשרותך לבחור שעה אחרת שבה המורה פנוי ביום זה:`
                        : `Teacher ${selectedTeacher.user?.firstName} is not available at ${formatTo12Hour(selectedSlotTime)}. Available times for this teacher today:`}
                    </p>

                    {selectedTeacherAlternativeTimes.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {selectedTeacherAlternativeTimes.map((altTime: string) => (
                          <button
                            key={altTime}
                            type="button"
                            onClick={() => handleSelectTimeSlot(altTime)}
                            className="px-2.5 py-1 rounded-lg bg-amber-200/80 dark:bg-amber-900/80 hover:bg-amber-300 dark:hover:bg-amber-800 text-amber-950 dark:text-amber-100 font-mono text-[11px] font-extrabold transition-all cursor-pointer shadow-2xs"
                          >
                            {formatTo12Hour(altTime)}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 italic">
                        {language === 'he' ? 'אין למורה זה שעות נוספות ביום זה. בחר מורה אחר מתוך הרשימה למטה.' : 'This teacher has no other open slots on this day. Please pick another teacher below.'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TEACHERS LIST (GROUPED BY AVAILABILITY AT SELECTED TIME) */}
        <div className="space-y-3">
          {/* Section A: Teachers Available at this time */}
          {selectedSlotTime && teachersAvailabilityForSelectedTime.availableTeachers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  {language === 'he'
                    ? `מורים זמינים בשעה ${formatTo12Hour(selectedSlotTime)}:`
                    : `Teachers Available at ${formatTo12Hour(selectedSlotTime)}:`}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {teachersAvailabilityForSelectedTime.availableTeachers
                  .filter((t: any) => {
                    if (!teacherSearch) return true;
                    const full = `${t.user?.firstName} ${t.user?.lastName}`.toLowerCase();
                    return full.includes(teacherSearch.toLowerCase());
                  })
                  .map((t: any) => {
                    const isSelected = selectedTeacherId === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          haptics.tap();
                          setSelectedTeacherId(t.id);
                          setBookingError(null);
                        }}
                        className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/60 ring-2 ring-emerald-500 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {`${t.user?.firstName?.charAt(0) || ''}${t.user?.lastName?.charAt(0) || ''}`.toUpperCase() || 'T'}
                          </div>
                          <div className="overflow-hidden">
                            <div className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                              {t.user?.firstName} {t.user?.lastName}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
                              <Star className="w-3 h-3 fill-amber-500" />
                              <span>{t.ratingAvg || '4.95'}</span>
                              <span className="text-slate-400 font-normal">
                                • {language === 'he' ? 'מורה מוסמך' : 'Certified'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 text-end">
                          <span className={`text-[10px] font-black px-2 py-1 rounded-md inline-flex items-center gap-1 ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            <Check className="w-3 h-3" />
                            <span>{language === 'he' ? 'זמין' : 'Available'}</span>
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Section B: Other Teachers Directory & Switcher */}
          <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              {language === 'he' ? 'כל המורים המוסמכים (לצפייה בלוח זמנים והחלפה):' : 'All Certified Instructors (Browse & Switch):'}
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1">
              {teachersData
                .filter((t: any) => {
                  if (!teacherSearch) return true;
                  const full = `${t.user?.firstName} ${t.user?.lastName}`.toLowerCase();
                  return full.includes(teacherSearch.toLowerCase());
                })
                .map((t: any) => {
                  const isSelected = selectedTeacherId === t.id;
                  const isAvail = teachersAvailabilityForSelectedTime.availableTeachers.some((at) => at.id === t.id);

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        haptics.tap();
                        setSelectedTeacherId(t.id);
                        setBookingError(null);
                      }}
                      className={`p-3 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? isAvail
                            ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/60 ring-2 ring-emerald-500'
                            : 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/60 ring-2 ring-amber-500'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-teal-700 to-indigo-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {`${t.user?.firstName?.charAt(0) || ''}${t.user?.lastName?.charAt(0) || ''}`.toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {t.user?.firstName} {t.user?.lastName}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                            <Star className="w-2.5 h-2.5 fill-amber-500" />
                            <span>{t.ratingAvg || '4.95'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-end">
                        {selectedSlotTime ? (
                          isAvail ? (
                            <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
                              ✓ {language === 'he' ? 'זמין לשעה זו' : 'Free at slot'}
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded">
                              {language === 'he' ? 'שעות אחרות' : 'Other times'}
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">
                            {language === 'he' ? 'בחר מורה' : 'Select'}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* STEP 4: INSTANT BOOKING SUMMARY & CONFIRMATION */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-brand-teal-50/90 to-indigo-50/60 dark:from-slate-850 dark:to-brand-teal-950/40 border border-brand-teal-200/80 dark:border-brand-teal-800/60 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-black tracking-wider text-brand-teal-800 dark:text-brand-teal-300 block">
              {language === 'he' ? 'סיכום הזמנה סופי' : 'Booking Summary'}
            </span>
            <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
              {bookingMode === 'onetime'
                ? `${selectedDuration}m ${language === 'he' ? 'שיעור פרטי בודד' : 'Private Lesson'}`
                : `${maxWeeklyRegularSlots}x/wk ${language === 'he' ? 'חוג שבועי קבוע ל-4 שבועות' : 'Regular 4-Week Schedule'}`}
              {selectedTeacher ? ` • ${selectedTeacher.user?.firstName} ${selectedTeacher.user?.lastName}` : ''}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {bookingMode === 'onetime' ? (
                bookingDate && selectedSlotTime ? (
                  <span>
                    {new Date(bookingDate + 'T00:00:00').toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    • <strong className="font-mono text-slate-900 dark:text-white">{formatTo12Hour(selectedSlotTime)} ({ISRAEL_TZ_LABEL})</strong>
                  </span>
                ) : (
                  <span>{language === 'he' ? 'אנא בחר שעה ותאריך מהלוח' : 'Select date and time slot above'}</span>
                )
              ) : (
                <span>
                  {selectedRegularSlots.length} {language === 'he' ? 'מועדים קבועים (סה"כ' : 'slots chosen (total'}{' '}
                  <strong>{selectedRegularSlots.length * 4}</strong> {language === 'he' ? 'שיעורים בחודש)' : 'lessons/month)'}
                </span>
              )}
            </div>
          </div>

          <div className="text-xs text-end shrink-0">
            <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">
              {language === 'he' ? 'ניכוי מחבילה:' : 'Package Deduction:'}
            </span>
            <span className="font-black text-sm text-slate-900 dark:text-white">
              {bookingMode === 'onetime' ? '1' : selectedRegularSlots.length * 4} {language === 'he' ? 'שיעורים' : 'sessions'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2.5">
          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors"
            >
              {language === 'he' ? 'ביטול' : 'Cancel'}
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirmBooking}
            disabled={
              bookLessonMutation.isPending ||
              bookRegularMutation.isPending ||
              !hasEnoughBalance ||
              !selectedTeacherId ||
              (bookingMode === 'onetime' && (!bookingDate || !selectedSlotTime || !isSelectedTeacherAvailableAtSlot)) ||
              (bookingMode === 'regular' && (selectedRegularSlots.length === 0 || !hasEnoughBalanceForRegular))
            }
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-teal-800 to-indigo-800 hover:from-brand-teal-900 hover:to-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-black shadow-lg shadow-brand-teal-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4 text-brand-olive-300" />
            <span>
              {bookLessonMutation.isPending || bookRegularMutation.isPending
                ? (language === 'he' ? 'מבצע הזמנה ומנכה מהחבילה...' : 'Confirming Booking...')
                : bookingMode === 'onetime'
                ? (language === 'he' ? `אישור הזמנה (${selectedDuration} דק׳)` : `Confirm ${selectedDuration}-Min Lesson`)
                : (language === 'he'
                    ? `אישור חוג ל-4 שבועות (${selectedRegularSlots.length * 4} שיעורים)`
                    : `Confirm 4-Week Schedule (${selectedRegularSlots.length * 4} Sessions)`)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
