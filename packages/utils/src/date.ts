// ============================================================================
// Pagmenos — Date Utilities
// ============================================================================

const TIMEZONE = 'America/Fortaleza';

/**
 * Formats a date string or Date to pt-BR short date.
 * @example formatDate("2026-08-17T16:30:00Z") => "17/08/2026"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formats a date string or Date to pt-BR date and time.
 * @example formatDateTime("2026-08-17T16:30:00Z") => "17/08/2026 13:30"
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats a date for display in a friendly way.
 * @example formatDateFriendly("2026-08-17") => "17 de agosto de 2026"
 */
export function formatDateFriendly(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', {
    timeZone: TIMEZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formats a date for relative display.
 * "Hoje", "Ontem", or the date.
 */
export function formatDateRelative(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  const targetDate = new Date(d.toLocaleString('en-US', { timeZone: TIMEZONE }));
  const todayDate = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));

  targetDate.setHours(0, 0, 0, 0);
  todayDate.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((todayDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  return formatDate(d);
}
