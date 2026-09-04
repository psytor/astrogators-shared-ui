/**
 * Time formatting helpers shared by suite chrome (e.g. the NavBar's
 * RosterRefresh control). All pure functions — no timers, no side effects.
 */

/**
 * Parse a backend timestamp into a Date.
 *
 * Astrogator's Table backends emit **naive UTC** ISO strings (no timezone
 * suffix, e.g. `2026-09-04T12:34:56`). `new Date()` would read those as *local*
 * time, so append `Z` when no offset is already present.
 */
export function parseBackendTimestamp(iso: string): Date {
  const hasTz = /([zZ]|[+-]\d{2}:?\d{2})$/.test(iso);
  return new Date(hasTz ? iso : `${iso}Z`);
}

/**
 * Compact "time since" label: `"12s ago"`, `"5m ago"`, `"3h ago"`, `"2d ago"`.
 * `nowMs` is passed in (not read from `Date.now()`) so a caller driving a
 * display clock re-renders deterministically.
 */
export function formatRelativeTime(date: Date, nowMs: number): string {
  const sec = Math.max(0, Math.floor((nowMs - date.getTime()) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

/** `m:ss` countdown, e.g. `formatCountdown(125)` → `"2:05"`. */
export function formatCountdown(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
