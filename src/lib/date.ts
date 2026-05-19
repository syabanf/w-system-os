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
