import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import { toast } from '../../store/toastStore';
import {
  Calendar as CalendarIcon,
  Clock,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Video,
  ShieldCheck,
  User,
} from 'lucide-react';
import {
  formatSlotRange12Hour,
  formatIsraelDateTime,
  calculateSlotEndTime,
  ISRAEL_TZ_LABEL,
} from '../../lib/timeUtils';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: {
    id: string;
    teacherId: string;
    scheduledAt: string;
    durationMinutes?: number;
    teacher?: {
      user?: {
        firstName: string;
        lastName: string;
      };
    };
  } | null;
  onSuccess?: () => void;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  lesson,
  onSuccess,
}) => {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const isHe = language === 'he';

  const [rescheduleDate, setRescheduleDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch teacher's slots
  const { data: slotsData, isLoading: isSlotsLoading } = useQuery({
    queryKey: ['teacherSlots', lesson?.teacherId],
    queryFn: async () => {
      if (!lesson?.teacherId) return { slots: [] };
      const res = await api.get(`/teachers/${lesson.teacherId}/slots`);
      return res.data;
    },
    enabled: Boolean(isOpen && lesson?.teacherId),
  });

  const slots = slotsData?.slots || [];
  const duration = lesson?.durationMinutes || 25;

  const rescheduleMutation = useMutation({
    mutationFn: async ({
      lessonId,
      newTimeSlotId,
      newScheduledAt,
    }: {
      lessonId: string;
      newTimeSlotId: string;
      newScheduledAt: string;
    }) => {
      const res = await api.post(`/lessons/${lessonId}/reschedule`, {
        newTimeSlotId,
        newScheduledAt,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success(
        isHe
          ? 'השיעור נקבע מחדש בהצלחה ללא חיוב נוסף!'
          : 'Lesson successfully rescheduled with no extra charge!'
      );
      queryClient.invalidateQueries({ queryKey: ['studentLessons'] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['studentProgressAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['teacherSlots'] });
      onSuccess?.();
      onClose();
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (isHe ? 'שגיאה בקביעת מועד מחדש' : 'Failed to reschedule lesson');
      setErrorMsg(msg);
      toast.error(msg);
    },
  });

  if (!isOpen || !lesson) return null;

  const handleConfirm = () => {
    if (!selectedSlot || !rescheduleDate) {
      setErrorMsg(isHe ? 'אנא בחר תאריך ושעה' : 'Please select a date and time slot');
      return;
    }

    // Build the newScheduledAt ISO string
    const newScheduledAt = `${rescheduleDate}T${selectedSlot.startTime}:00`;

    setErrorMsg(null);
    rescheduleMutation.mutate({
      lessonId: lesson.id,
      newTimeSlotId: selectedSlot.id,
      newScheduledAt,
    });
  };

  const chosenDay = rescheduleDate ? new Date(rescheduleDate + 'T00:00:00').getDay() : -1;
  const matchingSlots = slots.filter((s: any) => {
    return s.dayOfWeek === chosenDay && s.isAvailable !== false;
  });

  const teacherName = lesson.teacher?.user
    ? `${lesson.teacher.user.firstName} ${lesson.teacher.user.lastName}`
    : isHe
    ? 'המורה שלך'
    : 'Your Teacher';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 text-start">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isHe ? 'שינוי מועד שיעור' : 'Reschedule Lesson'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isHe ? `עם ${teacherName} • שיעור ${duration} דק׳` : `With ${teacherName} • ${duration}m Session`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Zero-Charge Guarantee Pill */}
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-500" />
          <div>
            <p className="font-bold">
              {isHe ? 'ללא עלות נוספת וללא ניצול קרדיט' : 'Zero Additional Cost Guarantee'}
            </p>
            <p className="text-[11px] opacity-90">
              {isHe
                ? 'שינוי המועד מעביר את השיעור למועד חדש עם אותו מורה מבלי לחייב את הארנק.'
                : 'Rescheduling transfers your reserved session to a new slot with the same teacher without debiting your balance.'}
            </p>
          </div>
        </div>

        {/* Current Lesson Info */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs">
          <span className="text-slate-500 dark:text-slate-400 block mb-1 font-semibold">
            {isHe ? 'מועד נוכחי שיתפנה:' : 'Current scheduled time to be freed:'}
          </span>
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
            <Clock className="w-4 h-4 text-teal-500" />
            <span>
              {formatIsraelDateTime(lesson.scheduledAt, {
                includeWeekday: true,
                locale: isHe ? 'he-IL' : 'en-US',
              })}{' '}
              ({ISRAEL_TZ_LABEL})
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step 1: Pick Date */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            {isHe ? '1. בחר תאריך חדש לשיעור:' : '1. Choose New Lesson Date:'}
          </label>
          <input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={rescheduleDate}
            onChange={(e) => {
              setRescheduleDate(e.target.value);
              setSelectedSlot(null);
              setErrorMsg(null);
            }}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </div>

        {/* Step 2: Pick Time Slot */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isHe ? '2. בחר שעה זמינה:' : '2. Choose Available Time Slot:'}
            </label>
            {chosenDay >= 0 && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {isHe ? DAYS_HE[chosenDay] : DAYS[chosenDay]}
              </span>
            )}
          </div>

          {isSlotsLoading ? (
            <div className="py-6 text-center text-xs text-slate-400">
              <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-teal-500" />
              <span>{isHe ? 'טוען שעות זמינות...' : 'Loading available slots...'}</span>
            </div>
          ) : matchingSlots.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {matchingSlots.map((slot: any) => {
                const isSelected = selectedSlot?.id === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => {
                      setSelectedSlot(slot);
                      setErrorMsg(null);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-teal-600 text-white border-teal-600 ring-2 ring-teal-400 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatSlotRange12Hour(slot.startTime, calculateSlotEndTime(slot.startTime, duration))}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-center text-xs text-amber-800 dark:text-amber-200">
              <p className="font-semibold">
                {isHe
                  ? 'אין שעות פנויות ביום זה.'
                  : 'No available slots on this date.'}
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">
                {isHe ? 'אנא בחר תאריך אחר לבדיקת שעות המורה.' : 'Please select another date to view available times.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isHe ? 'ביטול' : 'Cancel'}
          </button>
          <button
            type="button"
            disabled={!selectedSlot || rescheduleMutation.isPending}
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {rescheduleMutation.isPending
                ? isHe ? 'מעדכן שיעור...' : 'Rescheduling...'
                : isHe ? 'אשר שינוי מועד' : 'Confirm Reschedule'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

