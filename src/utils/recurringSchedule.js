import dayjs from 'dayjs';

export const MIN_RECURRING_INTERVAL = 1;
export const MAX_RECURRING_INTERVAL = 365;
export const MAX_RECURRING_OCCURRENCES = 50;

function integerInRange(value, min, max) {
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max;
}

/**
 * How many dates a user series will create, including the start date.
 * Returns 0 when the inputs cannot form a series.
 * Stops after MAX + 1 so a huge "until" range can be rejected without looping for years.
 */
export function countUserRecurringOccurrences({
  startDate,
  interval,
  endType,
  maxOccurrences,
  untilDate,
}) {
  if (!integerInRange(interval, MIN_RECURRING_INTERVAL, MAX_RECURRING_INTERVAL)) return 0;
  const start = dayjs(startDate).startOf('day');
  if (!start.isValid()) return 0;

  if (endType === 'until') {
    const until = dayjs(untilDate).startOf('day');
    if (!until.isValid() || until.isBefore(start, 'day')) return 0;
    let count = 0;
    let cursor = start;
    const stop = MAX_RECURRING_OCCURRENCES + 1;
    while (!cursor.isAfter(until, 'day') && count < stop) {
      count += 1;
      cursor = cursor.add(Number(interval), 'day');
    }
    return count;
  }

  const count = Number(maxOccurrences);
  if (!Number.isInteger(count) || count < 1) return 0;
  return count;
}

/**
 * @returns {{ ok: true, count: number } | { ok: false, errorKey: string, count: number }}
 */
export function validateUserRecurringConfig(config, selectedDate) {
  if (!config?.enabled) return { ok: true, count: 0 };

  if (!integerInRange(config.interval, MIN_RECURRING_INTERVAL, MAX_RECURRING_INTERVAL)) {
    return { ok: false, errorKey: 'forms.recurringInvalidInterval', count: 0 };
  }

  if (config.endType === 'until') {
    const start = dayjs(selectedDate).startOf('day');
    const until = dayjs(config.untilDate).startOf('day');
    if (!until.isValid() || until.isBefore(start, 'day')) {
      return { ok: false, errorKey: 'forms.recurringEndBeforeStart', count: 0 };
    }
    const count = countUserRecurringOccurrences({
      startDate: selectedDate,
      interval: config.interval,
      endType: 'until',
      untilDate: config.untilDate,
    });
    if (count > MAX_RECURRING_OCCURRENCES) {
      return { ok: false, errorKey: 'forms.recurringTooMany', count };
    }
    if (count < 1) {
      return { ok: false, errorKey: 'forms.recurringEndBeforeStart', count: 0 };
    }
    return { ok: true, count };
  }

  if (!integerInRange(config.maxOccurrences, 1, MAX_RECURRING_OCCURRENCES)) {
    return { ok: false, errorKey: 'forms.recurringInvalidCount', count: 0 };
  }

  return { ok: true, count: Number(config.maxOccurrences) };
}
