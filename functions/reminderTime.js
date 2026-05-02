/**
 * @param {unknown} raw
 * @return {{ h: number, m: number } | null}
 */
function reminderWallParts(raw) {
  if (raw === null || raw === undefined || raw === "") {
    return null;
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const n = Math.trunc(raw);
    if (n < 0 || n >= 24 * 60) return null;
    return {h: Math.floor(n / 60), m: n % 60};
  }
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?/.exec(String(raw).trim());
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
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
  return {h, m: min};
}

/**
 * @param {unknown} raw
 * @param {string} fallback
 * @return {string}
 */
function coerceReminderTimeHm(raw, fallback = "09:00") {
  const p = reminderWallParts(raw);
  if (!p) {
    return fallback;
  }
  return `${String(p.h).padStart(2, "0")}:${String(p.m).padStart(2, "0")}`;
}

/**
 * Stale UI bug: advance stuck at 15:00 while daily + legacy reminder aligned.
 * @param {string} dailyHm - Coerced daily reminder "HH:mm".
 * @param {string} reminderHm - Coerced legacy reminderTime "HH:mm".
 * @param {string} advanceHm - Coerced advance reminder "HH:mm".
 * @return {string} Effective advance time "HH:mm".
 */
function effectiveAdvanceReminderTimeDedup(dailyHm, reminderHm, advanceHm) {
  let a = advanceHm;
  if (
    a === "15:00" &&
    dailyHm !== "15:00" &&
    reminderHm === dailyHm
  ) {
    a = dailyHm;
  }
  return a;
}

module.exports = {
  coerceReminderTimeHm,
  reminderWallParts,
  effectiveAdvanceReminderTimeDedup,
};
