import { differenceInCalendarDays, format, formatDistanceToNowStrict, parseISO } from "date-fns";

export function formatDate(iso: string, pattern = "dd MMM yyyy"): string {
  return format(parseISO(iso), pattern);
}

export function formatDateTime(iso: string, pattern = "dd MMM yyyy HH:mm"): string {
  return format(parseISO(iso), pattern);
}

export function daysFromNow(iso: string): number {
  return differenceInCalendarDays(parseISO(iso), new Date());
}

export function relativeFromNow(iso: string): string {
  return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true });
}

/**
 * Canonical demo "today" for the app. The entire mock dataset is pinned to this
 * fixed day — do NOT swap this for a live `new Date()`.
 */
export const DEMO_TODAY = new Date(2026, 4, 18); // Monday, 18 May 2026

/**
 * Long-form rendering of the demo "today", e.g. "Monday, 18 May".
 * Pass a date-fns `pattern` to override the default formatting.
 */
export function formatDemoToday(pattern?: string): string {
  if (pattern) return format(DEMO_TODAY, pattern);
  return DEMO_TODAY.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
