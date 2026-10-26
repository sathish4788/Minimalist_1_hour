export interface ReminderPreset {
  label: string;
  minutes: number;
}

export const REMINDER_PRESETS: ReminderPreset[] = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '45 min', minutes: 45 },
  { label: '1 hour (Default)', minutes: 60 },
  { label: '2 hours', minutes: 120 },
  { label: '4 hours', minutes: 240 },
  { label: 'Tomorrow morning', minutes: 720 }, // calculated dynamically or approx 12h
];

/**
 * Calculates a future timestamp based on minutes from now
 */
export function getFutureTimestamp(minutes: number): number {
  return Date.now() + minutes * 60 * 1000;
}

/**
 * Formats a friendly countdown string e.g. "in 54m", "in 2h 10m", "due now", "overdue 5m"
 */
export function formatReminderCountdown(reminderAt: number): {
  text: string;
  isOverdue: boolean;
  isDueSoon: boolean; // within 10 minutes
} {
  const diffMs = reminderAt - Date.now();
  const diffMinutes = Math.round(diffMs / (60 * 1000));

  if (diffMinutes <= 0) {
    const overdueMins = Math.abs(diffMinutes);
    if (overdueMins === 0) {
      return { text: 'Due right now', isOverdue: true, isDueSoon: true };
    }
    if (overdueMins < 60) {
      return { text: `${overdueMins}m overdue`, isOverdue: true, isDueSoon: true };
    }
    const overdueHours = Math.floor(overdueMins / 60);
    const remMins = overdueMins % 60;
    return {
      text: remMins > 0 ? `${overdueHours}h ${remMins}m overdue` : `${overdueHours}h overdue`,
      isOverdue: true,
      isDueSoon: true,
    };
  }

  // Future
  if (diffMinutes < 60) {
    return {
      text: `in ${diffMinutes}m`,
      isOverdue: false,
      isDueSoon: diffMinutes <= 10,
    };
  }

  const hours = Math.floor(diffMinutes / 60);
  const remainingMins = diffMinutes % 60;
  if (hours < 24) {
    return {
      text: remainingMins > 0 ? `in ${hours}h ${remainingMins}m` : `in ${hours}h`,
      isOverdue: false,
      isDueSoon: false,
    };
  }

  const days = Math.floor(hours / 24);
  return {
    text: `in ${days}d`,
    isOverdue: false,
    isDueSoon: false,
  };
}

/**
 * Formats absolute timestamp to readable string e.g. "Today 7:45 PM" or "Oct 26, 9:00 AM"
 */
export function formatExactDateTime(timestamp: number): string {
  const target = new Date(timestamp);
  const now = new Date();

  const isToday =
    target.getDate() === now.getDate() &&
    target.getMonth() === now.getMonth() &&
    target.getFullYear() === now.getFullYear();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    target.getDate() === tomorrow.getDate() &&
    target.getMonth() === tomorrow.getMonth() &&
    target.getFullYear() === tomorrow.getFullYear();

  const timeStr = target.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (isToday) {
    return `Today at ${timeStr}`;
  }
  if (isTomorrow) {
    return `Tomorrow at ${timeStr}`;
  }

  const dateStr = target.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return `${dateStr}, ${timeStr}`;
}

/**
 * Format timestamp into input datetime-local string (YYYY-MM-DDTHH:mm)
 */
export function toDateTimeLocalValue(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Parse input datetime-local string to epoch milliseconds
 */
export function fromDateTimeLocalValue(val: string): number | null {
  if (!val) return null;
  const d = new Date(val);
  const ms = d.getTime();
  return isNaN(ms) ? null : ms;
}

/**
 * Parses natural language time phrases from input string
 * Examples: "in 30m", "in 2 hours", "tomorrow morning", "at 5pm"
 */
export function parseNaturalLanguageTime(input: string): {
  cleanText: string;
  detectedMinutes: number;
  label: string;
} | null {
  if (!input) return null;

  // 1. "in X min/mins/m"
  const minMatch = input.match(/\bin\s+(\d+)\s*(?:m|min|mins|minutes)\b/i);
  if (minMatch) {
    const mins = parseInt(minMatch[1], 10);
    if (!isNaN(mins) && mins > 0 && mins <= 1440 * 7) {
      const clean = input.replace(minMatch[0], '').trim();
      return { cleanText: clean, detectedMinutes: mins, label: `in ${mins}m` };
    }
  }

  // 2. "in X hour/hours/h"
  const hourMatch = input.match(/\bin\s+(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/i);
  if (hourMatch) {
    const hrs = parseFloat(hourMatch[1]);
    if (!isNaN(hrs) && hrs > 0) {
      const mins = Math.round(hrs * 60);
      const clean = input.replace(hourMatch[0], '').trim();
      return { cleanText: clean, detectedMinutes: mins, label: `in ${hrs}h` };
    }
  }

  // 3. "tomorrow morning" or "tomorrow 9am"
  const tomorrowMatch = input.match(/\btomorrow(?:\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?\b/i);
  if (tomorrowMatch) {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0); // default 9 AM
    if (tomorrowMatch[1]) {
      let hour = parseInt(tomorrowMatch[1], 10);
      const min = tomorrowMatch[2] ? parseInt(tomorrowMatch[2], 10) : 0;
      const ampm = tomorrowMatch[3]?.toLowerCase();
      if (ampm === 'pm' && hour < 12) hour += 12;
      if (ampm === 'am' && hour === 12) hour = 0;
      target.setHours(hour, min, 0, 0);
    }
    const diffMins = Math.round((target.getTime() - Date.now()) / (60 * 1000));
    if (diffMins > 0) {
      const clean = input.replace(tomorrowMatch[0], '').trim();
      return { cleanText: clean, detectedMinutes: diffMins, label: 'Tomorrow' };
    }
  }

  // 4. "tonight"
  const tonightMatch = input.match(/\btonight\b/i);
  if (tonightMatch) {
    const now = new Date();
    const tonight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0); // 8:00 PM
    const diffMins = Math.round((tonight.getTime() - Date.now()) / (60 * 1000));
    if (diffMins > 0) {
      const clean = input.replace(tonightMatch[0], '').trim();
      return { cleanText: clean, detectedMinutes: diffMins, label: 'Tonight 8 PM' };
    }
  }

  return null;
}

