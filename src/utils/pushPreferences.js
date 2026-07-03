import { coerceReminderTimeHm } from './reminderTime';

export const PUSH_PREFS_STORAGE_KEY = 'push-notification-preferences';
export const PUSH_PREFS_LEGACY_STORAGE_KEY = 'email-preferences';

/** Match Cloud Function cron step (minutes) for client-side shouldSend* windows */
export const REMINDER_SEND_WINDOW_MINUTES = 5;

export const DEFAULT_PUSH_PREFS = {
  enabled: true,
  userEmail: '',
  userName: '',
  userId: '',
  dailyReminder: true,
  reminderTime: '09:00',
  dailyReminderTime: '09:00',
  advanceReminderTime: '09:00',
  overdueReminders: true,
  dueTodayReminders: true,
  advanceReminders: true,
  advanceDays: 3,
  weeklySummary: false,
  weeklySummaryDay: 1,
  weeklySummaryTime: '08:00',
  lastReminderSent: null,
  lastAdvanceReminderSent: null,
  lastAutoReminderSent: null,
  lastAutoAdvanceReminderSent: null,
  lastWeeklySummarySent: null,
};

/**
 * Merge legacy `reminderTime` into per-type times and coerce day-of-week.
 */
export function normalizePushPreferences(raw) {
  const merged = { ...DEFAULT_PUSH_PREFS, ...raw };
  const reminderTime = coerceReminderTimeHm(
    typeof merged.reminderTime === 'string' && merged.reminderTime.trim()
      ? merged.reminderTime.trim()
      : merged.reminderTime,
    '09:00'
  );
  let dailyReminderTime =
    typeof merged.dailyReminderTime === 'string' && merged.dailyReminderTime.trim()
      ? coerceReminderTimeHm(merged.dailyReminderTime.trim(), reminderTime)
      : reminderTime;
  let advanceReminderTime =
    typeof merged.advanceReminderTime === 'string' && merged.advanceReminderTime.trim()
      ? coerceReminderTimeHm(merged.advanceReminderTime.trim(), reminderTime)
      : reminderTime;

  if (
    advanceReminderTime === '15:00' &&
    dailyReminderTime !== '15:00' &&
    reminderTime === dailyReminderTime
  ) {
    advanceReminderTime = dailyReminderTime;
  }
  let weeklySummaryDay = parseInt(merged.weeklySummaryDay, 10);
  if (Number.isNaN(weeklySummaryDay) || weeklySummaryDay < 0 || weeklySummaryDay > 6) {
    weeklySummaryDay = 1;
  }
  const weeklySummaryTime = coerceReminderTimeHm(
    typeof merged.weeklySummaryTime === 'string' && merged.weeklySummaryTime.trim()
      ? merged.weeklySummaryTime.trim()
      : merged.weeklySummaryTime,
    '08:00'
  );

  return {
    ...merged,
    reminderTime,
    dailyReminderTime,
    advanceReminderTime,
    weeklySummaryDay,
    weeklySummaryTime,
  };
}

export function loadInitialPushPreferences() {
  const saved = localStorage.getItem(PUSH_PREFS_STORAGE_KEY);
  if (saved) {
    return normalizePushPreferences(JSON.parse(saved));
  }
  const legacy = localStorage.getItem(PUSH_PREFS_LEGACY_STORAGE_KEY);
  if (legacy) {
    localStorage.setItem(PUSH_PREFS_STORAGE_KEY, legacy);
    return normalizePushPreferences(JSON.parse(legacy));
  }
  return normalizePushPreferences({ ...DEFAULT_PUSH_PREFS });
}

export function effectiveDailyReminderTime(prefs) {
  return prefs.dailyReminderTime || prefs.reminderTime || '09:00';
}

export function effectiveAdvanceReminderTime(prefs) {
  return prefs.advanceReminderTime || prefs.reminderTime || '09:00';
}
