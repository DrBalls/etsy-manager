export function formatDate(
  date: Date | string,
  format: 'short' | 'medium' | 'long' = 'medium',
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions = {
    short: { month: 'numeric', day: 'numeric', year: '2-digit' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
  }[format] as Intl.DateTimeFormatOptions;

  return new Intl.DateTimeFormat('en-US', options).format(d);
}

export function formatDateTime(date: Date | string, includeSeconds = false): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...(includeSeconds && { second: '2-digit' }),
  };

  return new Intl.DateTimeFormat('en-US', options).format(d);
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(d, 'short');
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getDateRange(period: 'today' | 'week' | 'month' | 'quarter' | 'year'): {
  start: Date;
  end: Date;
} {
  const now = new Date();
  const start = new Date();

  switch (period) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };

    case 'week':
      start.setDate(now.getDate() - 7);
      return { start: startOfDay(start), end: endOfDay(now) };

    case 'month':
      start.setMonth(now.getMonth() - 1);
      return { start: startOfDay(start), end: endOfDay(now) };

    case 'quarter':
      start.setMonth(now.getMonth() - 3);
      return { start: startOfDay(start), end: endOfDay(now) };

    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      return { start: startOfDay(start), end: endOfDay(now) };
  }
}
