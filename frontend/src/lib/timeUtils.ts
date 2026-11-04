/**
 * Time and Timezone utilities for Engrew
 * Enforces 12-Hour format with AM/PM and Israel Standard/Daylight Timing (Asia/Jerusalem).
 */

export const ISRAEL_TIMEZONE = 'Asia/Jerusalem';
export const ISRAEL_TZ_LABEL = 'Israel Time (IST/IDT)';

/**
 * Converts a 24h "HH:mm" time string (e.g. "09:00", "14:25") to 12h format with AM/PM
 * Example: "09:00" -> "9:00 AM", "14:25" -> "2:25 PM"
 */
export function formatTo12Hour(time24: string): string {
  if (!time24) return '';
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // '0' should be '12'
  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Formats a 25-minute, 40-minute, or 55-minute slot range in 12-hour system
 * Example: ("09:00", "09:25") -> "9:00 AM – 9:25 AM"
 */
export function formatSlotRange12Hour(start: string, end: string): string {
  return `${formatTo12Hour(start)} – ${formatTo12Hour(end)}`;
}

/**
 * Calculates end time string "HH:mm" from start time and duration (25, 40, or 55 min)
 */
export function calculateSlotEndTime(startTime: string, durationMinutes: number = 25): string {
  const [h, m] = startTime.split(':').map(Number);
  const totalMin = h * 60 + m + durationMinutes;
  const endH = Math.floor(totalMin / 60) % 24;
  const endM = totalMin % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

/**
 * Calculates duration in minutes from start and end time (e.g. 25, 40, 55)
 */
export function getSlotDurationMinutes(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 25;
  const [h1, m1] = startTime.split(':').map(Number);
  const [h2, m2] = endTime.split(':').map(Number);
  const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
  return diff > 0 ? diff : 25;
}

/**
 * Formats a full Date or ISO string in 12-hour format strictly converted to Israel Time
 * Example: "2026-11-05T09:00:00Z" -> "Nov 5, 2026, 11:00 AM (Israel Time)"
 */
export function formatIsraelDateTime(
  dateInput: string | Date,
  options: {
    includeDate?: boolean;
    includeWeekday?: boolean;
    includeTzLabel?: boolean;
    locale?: string;
  } = {}
): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const {
    includeDate = true,
    includeWeekday = false,
    includeTzLabel = true,
    locale = 'en-US',
  } = options;

  const intlOptions: Intl.DateTimeFormatOptions = {
    timeZone: ISRAEL_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };

  if (includeDate) {
    intlOptions.month = 'short';
    intlOptions.day = 'numeric';
  }

  if (includeWeekday) {
    intlOptions.weekday = 'short';
  }

  const formatted = new Intl.DateTimeFormat(locale, intlOptions).format(date);
  return includeTzLabel ? `${formatted} (${ISRAEL_TZ_LABEL})` : formatted;
}

