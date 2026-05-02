/**
 * Parse wall-clock HH:mm (optional :ss) into hour/minute, or null if invalid.
 * @param {unknown} raw
 * @returns {{ h: number, m: number } | null}
 */
export function reminderWallParts(raw) {
  if (raw === null || raw === undefined || raw === '') {
    return null;
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const n = Math.trunc(raw);
    if (n < 0 || n >= 24 * 60) return null;
    return { h: Math.floor(n / 60), m: n % 60 };
  }
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?/.exec(String(raw).trim());
  if (!m) return null;
  const h = Number.parseInt(m[1], 10);
  const min = Number.parseInt(m[2], 10);
  if (
    Number.isNaN(h) ||
    Number.isNaN(min) ||
    h < 0 ||
    h > 23 ||
    min < 0 ||
    min > 59
  ) {
    return null;
  }
  return { h, m: min };
}

/**
 * Normalize reminder clock strings ("HH:mm" or optional seconds).
 * @param {unknown} raw
 * @param {string} fallback
 * @returns {string}
 */
export function coerceReminderTimeHm(raw, fallback = '09:00') {
  const p = reminderWallParts(raw);
  if (!p) {
    return fallback;
  }
  return `${String(p.h).padStart(2, '0')}:${String(p.m).padStart(2, '0')}`;
}
