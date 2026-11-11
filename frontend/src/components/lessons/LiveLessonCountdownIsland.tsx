import React, { useState, useEffect } from 'react';
import { Video, Calendar, Clock, ExternalLink, Download, Sparkles } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { getGoogleCalendarUrl, downloadIcsFile } from '../../utils/calendarSync';
import { haptics } from '../../utils/haptics';

interface LessonData {
  id: string;
  scheduledAt: string | Date;
  durationMinutes: number;
  zoomLink?: string | null;
  teacher?: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  student?: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

interface Props {
  lessons: LessonData[];
  userRole: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

export const LiveLessonCountdownIsland: React.FC<Props> = ({ lessons, userRole }) => {
  const { language } = useTranslation();
  const [now, setNow] = useState(Date.now());

  // Keep countdown updated every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Find nearest upcoming lesson
  const upcomingLesson = [...lessons]
    .filter((l) => new Date(l.scheduledAt).getTime() + (l.durationMinutes || 25) * 60 * 1000 > now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

  if (!upcomingLesson) return null;

  const scheduledTime = new Date(upcomingLesson.scheduledAt).getTime();
  const diffMs = scheduledTime - now;
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const isLiveNow = diffMs <= 0 && diffMs > -(upcomingLesson.durationMinutes * 60 * 1000);
  const isImminent = diffMinutes >= 0 && diffMinutes <= 15;

  // Format time text
  const timeString = new Date(upcomingLesson.scheduledAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateString = new Date(upcomingLesson.scheduledAt).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  // Calculate friendly countdown label
  let countdownText = '';
  if (isLiveNow) {
    countdownText = language === 'he' ? 'השיעור מתקיים כעת!' : 'Lesson is Live Now!';
  } else if (diffMinutes < 60) {
    countdownText =
      language === 'he' ? `מתחיל בעוד ${diffMinutes} דקות` : `Starts in ${diffMinutes}m`;
  } else {
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    countdownText =
      language === 'he'
        ? `מתחיל בעוד ${hours} שע׳ ${mins} דק׳`
        : `Starts in ${hours}h ${mins}m`;
  }

  const partnerName =
    userRole === 'STUDENT'
      ? `${upcomingLesson.teacher?.user.firstName || 'Teacher'} ${upcomingLesson.teacher?.user.lastName || ''}`
      : `${upcomingLesson.student?.user.firstName || 'Student'} ${upcomingLesson.student?.user.lastName || ''}`;

  const partnerRoleLabel =
    userRole === 'STUDENT'
      ? language === 'he'
        ? 'מורה'
        : 'Teacher'
      : language === 'he'
      ? 'תלמיד'
      : 'Student';

  const zoomUrl = upcomingLesson.zoomLink || 'https://zoom.us';

  const handleJoinClick = () => {
    haptics.success();
    window.open(zoomUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadIcs = () => {
    haptics.tap();
    downloadIcsFile({
      id: upcomingLesson.id,
      title: `Engrew Hebrew Lesson with ${partnerName}`,
      description: `1-on-1 Hebrew lesson (${upcomingLesson.durationMinutes} min)`,
      scheduledAt: upcomingLesson.scheduledAt,
      durationMinutes: upcomingLesson.durationMinutes,
      zoomLink: zoomUrl,
      teacherName: upcomingLesson.teacher?.user.firstName,
      studentName: upcomingLesson.student?.user.firstName,
    });
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-4 sm:p-5 transition-all duration-300 shadow-md ${
        isLiveNow || isImminent
          ? 'bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 border-2 border-emerald-400/80 shadow-emerald-500/20'
          : 'bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 backdrop-blur-xl'
      }`}
    >
      {/* Specular Ambient Glow */}
      <div
        className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-2xl pointer-events-none ${
          isLiveNow || isImminent ? 'bg-emerald-400/20' : 'bg-brand-teal-500/10'
        }`}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        {/* Left Side: Status & Partner Details */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
              isLiveNow || isImminent
                ? 'bg-emerald-500 text-slate-950 animate-pulse'
                : 'bg-brand-teal-50 dark:bg-brand-teal-950/80 text-brand-teal-700 dark:text-brand-teal-300 border border-brand-teal-200/60 dark:border-brand-teal-800/60'
            }`}
          >
            <Video className="w-6 h-6 stroke-[2.2]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 ${
                  isLiveNow
                    ? 'bg-emerald-400 text-slate-950 font-black animate-bounce'
                    : isImminent
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                {countdownText}
              </span>

              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {dateString} • {timeString} ({upcomingLesson.durationMinutes}m)
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate mt-1">
              {language === 'he' ? 'שיעור עברית אישי' : 'Private Hebrew Lesson'}{' '}
              <span className="font-semibold text-slate-500 dark:text-slate-400 text-sm">
                ({partnerRoleLabel}: {partnerName})
              </span>
            </h3>
          </div>
        </div>

        {/* Right Side: Actions (Join Zoom & Add to Calendar) */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Join Zoom Meeting */}
          <button
            type="button"
            onClick={handleJoinClick}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md ${
              isLiveNow || isImminent
                ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 ring-2 ring-emerald-300/50'
                : 'bg-brand-teal-800 hover:bg-brand-teal-900 dark:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-slate-950'
            }`}
          >
            <Video className="w-4 h-4 stroke-[2.4]" />
            <span>{language === 'he' ? 'הצטרף לשיעור (Zoom)' : 'Join Class (Zoom)'}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </button>

          {/* 1-Click Google Calendar */}
          <a
            href={getGoogleCalendarUrl({
              id: upcomingLesson.id,
              title: `Engrew Lesson with ${partnerName}`,
              description: `1-on-1 Hebrew lesson (${upcomingLesson.durationMinutes} min)`,
              scheduledAt: upcomingLesson.scheduledAt,
              durationMinutes: upcomingLesson.durationMinutes,
              zoomLink: zoomUrl,
              teacherName: upcomingLesson.teacher?.user.firstName,
              studentName: upcomingLesson.student?.user.firstName,
            })}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => haptics.tap()}
            title={language === 'he' ? 'הוסף ליומן גוגל' : 'Add to Google Calendar'}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200/80 dark:border-slate-700"
          >
            <Calendar className="w-4 h-4" />
          </a>

          {/* Download .ics (Apple Calendar / Outlook) */}
          <button
            type="button"
            onClick={handleDownloadIcs}
            title={language === 'he' ? 'הורד קובץ iCal (.ics) לאפל ולאאוטלוק' : 'Download .ics for Apple / Outlook'}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200/80 dark:border-slate-700"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
