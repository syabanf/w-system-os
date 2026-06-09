import { differenceInCalendarDays, format, formatDistanceStrict, parseISO } from "date-fns";

export function formatDate(iso: string, pattern = "dd MMM yyyy"): string {
  return format(parseISO(iso), pattern);
}

export function formatDateTime(iso: string, pattern = "dd MMM yyyy HH:mm"): string {
  return format(parseISO(iso), pattern);
}

export function daysFromNow(iso: string): number {
  return differenceInCalendarDays(parseISO(iso), DEMO_TODAY);
}

export function relativeFromNow(iso: string): string {
  return formatDistanceStrict(parseISO(iso), DEMO_TODAY, { addSuffix: true });
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

/** Calendar year of the demo timeline (e.g. for INV-2026-… id generators). */
export const DEMO_YEAR = DEMO_TODAY.getFullYear();

/**
 * Canonical demo "now": the pinned demo DAY with the live wall-clock TIME, so
 * clocks still tick while every date stays on the demo timeline. Use this
 * anywhere a bare `new Date()` would otherwise drift off the seed data (record
 * timestamps, "today" defaults, SLA / overdue calcs). This is the ONE place a
 * real `new Date()` is allowed.
 */
export function demoNow(): Date {
  const t = new Date();
  return new Date(2026, 4, 18, t.getHours(), t.getMinutes(), t.getSeconds(), t.getMilliseconds());
}

/** ISO timestamp for the demo "now" — for record createdAt/updatedAt/etc. */
export function demoNowISO(): string {
  return demoNow().toISOString();
}

/** "yyyy-MM-dd" for the demo day — for date-only fields / `<input type="date">`. */
export function demoDateInput(): string {
  return format(DEMO_TODAY, "yyyy-MM-dd");
}
