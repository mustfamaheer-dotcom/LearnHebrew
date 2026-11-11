/**
 * Generates direct Google Calendar and downloadable Apple / Outlook (.ics) calendar links
 */

export interface LessonCalendarDetails {
  id?: string;
  title: string;
  description: string;
  scheduledAt: string | Date;
  durationMinutes: number;
  zoomLink?: string | null;
  teacherName?: string;
  studentName?: string;
}

/**
 * Format a Date object into UTC string YYYYMMDDTHHmmssZ
 */
function formatToUTCString(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Generate a 1-click Google Calendar web link
 */
export function getGoogleCalendarUrl(lesson: LessonCalendarDetails): string {
  const start = new Date(lesson.scheduledAt);
  const end = new Date(start.getTime() + (lesson.durationMinutes || 25) * 60 * 1000);

  const startStr = formatToUTCString(start);
  const endStr = formatToUTCString(end);

  const title = encodeURIComponent(lesson.title || 'Engrew Hebrew Lesson');
  const details = encodeURIComponent(
    `${lesson.description || 'Interactive 1-on-1 Hebrew Lesson on Engrew.'}\n\nJoin Zoom Link: ${
      lesson.zoomLink || 'Available in Engrew Dashboard'
    }\nTeacher: ${lesson.teacherName || 'Engrew Certified Instructor'}\nStudent: ${
      lesson.studentName || 'Student'
    }`
  );
  const location = encodeURIComponent(lesson.zoomLink || 'Engrew Virtual Classroom');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
}

/**
 * Generate and trigger download of an RFC 5545 standard .ics file for Apple iCal and Outlook
 */
export function downloadIcsFile(lesson: LessonCalendarDetails): void {
  const start = new Date(lesson.scheduledAt);
  const end = new Date(start.getTime() + (lesson.durationMinutes || 25) * 60 * 1000);

  const startStr = formatToUTCString(start);
  const endStr = formatToUTCString(end);
  const nowStr = formatToUTCString(new Date());

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Engrew Hebrew Academy//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:engrew-lesson-${lesson.id || Date.now()}@engrew.com`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${lesson.title || 'Engrew Hebrew Lesson'}`,
    `DESCRIPTION:${(lesson.description || '1-on-1 Hebrew Lesson on Engrew.')
      .replace(/\n/g, '\\n')} - Zoom Link: ${lesson.zoomLink || 'Check Dashboard'}`,
    `LOCATION:${lesson.zoomLink || 'Engrew Virtual Classroom'}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Your Engrew Hebrew lesson starts in 15 minutes!',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.setAttribute('download', `engrew-lesson-${(lesson.id || 'event').substring(0, 8)}.ics`);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
