/**
 * Central time/date formatting utilities.
 * Uses 12-hour format (AM/PM) throughout the entire app — easier for
 * non-technical staff, vendors, and customers than 24-hour.
 */

/** Format a date/string as "3:45 PM" */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/** Format a date/string as "19 Sep" */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/** Format a date/string as "Fri, 19 Sep" */
export function formatDateFull(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Format a date/string as "19 Sep · 3:45 PM" */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return `${formatDate(d)} · ${formatTime(d)}`;
}

/** Returns "Yesterday", "Today", "Tomorrow", or a date string */
export function formatDayLabel(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

  if (diff === 0) return 'Today';
  if (diff === -1) return 'Yesterday';
  if (diff === 1) return 'Tomorrow';
  return formatDate(d);
}

/**
 * Checks whether a date falls in the window for a given day filter.
 * @param date - the date to check
 * @param filter - 'YESTERDAY' | 'TODAY' | 'TOMORROW' | 'ALL'
 */
export function matchesDayFilter(
  date: Date | string | null | undefined,
  filter: 'YESTERDAY' | 'TODAY' | 'TOMORROW' | 'ALL'
): boolean {
  if (filter === 'ALL') return true;
  if (!date) return false;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return false;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const offset = filter === 'YESTERDAY' ? -1 : filter === 'TOMORROW' ? 1 : 0;
  const targetDay = new Date(today);
  targetDay.setDate(today.getDate() + offset);
  const nextDay = new Date(targetDay);
  nextDay.setDate(targetDay.getDate() + 1);

  return d >= targetDay && d < nextDay;
}
