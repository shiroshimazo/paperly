/**
 * Date formatting helpers — locale-aware, no external deps.
 */

const DAY_MS = 1000 * 60 * 60 * 24;

/** Returns a stable absolute date string, e.g. "May 28, 2026". */
export function formatAbsolute(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Returns a date + time string, e.g. "May 28, 2026, 10:42 AM". */
export function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Returns a friendly relative time, e.g. "just now", "5m ago", "yesterday", "May 12". */
export function formatRelative(iso, now = Date.now()) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const diffMs = now - d.getTime();
  if (diffMs < 0) return formatAbsolute(iso);

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 45) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfThat = new Date(d);
  startOfThat.setHours(0, 0, 0, 0);
  const dayDelta = Math.round(
    (startOfToday.getTime() - startOfThat.getTime()) / DAY_MS,
  );

  if (dayDelta === 1) return "yesterday";
  if (dayDelta < 7) return `${dayDelta}d ago`;

  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}
