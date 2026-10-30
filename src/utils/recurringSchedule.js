import dayjs from 'dayjs';

export const MIN_RECURRING_INTERVAL = 1;
export const MAX_RECURRING_INTERVAL = 365;
/** A series is not generated past this, so one save cannot run on without an end. */
export const MAX_RECURRING_YEARS = 10;

function integerInRange(value, min, max) {
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max;
}

function seriesHorizon(start) {
  return start.add(MAX_RECURRING_YEARS, 'year');
}

/**
 * How many dates a user series will create, including the start date.
 * Returns 0 when the inputs cannot form a series.
 * Counts only through the generation horizon, matching the events that are saved.
 */
/** Calendar days a user series will occupy, including the start date. */
export function listUserRecurringDates({
  startDate,
  interval,
  endType,
  maxOccurrences,
  untilDate,
}) {
  if (!integerInRange(interval, MIN_RECURRING_INTERVAL, MAX_RECURRING_INTERVAL)) return [];
  const start = dayjs(startDate).startOf('day');
  if (!start.isValid()) return [];
  const step = Number(interval);
  const horizon = seriesHorizon(start);
  const dates = [];

  if (endType === 'until') {
    const until = dayjs(untilDate).startOf('day');
    if (!until.isValid() || until.isBefore(start, 'day')) return [];
    const end = until.isAfter(horizon, 'day') ? horizon : until;
    let cursor = start;
    while (!cursor.isAfter(end, 'day')) {
      dates.push(cursor);
      cursor = cursor.add(step, 'day');
    }
    return dates;
  }

  const count = Number(maxOccurrences);
  if (!Number.isInteger(count) || count < 1) return [];
  let cursor = start;
  while (!cursor.isAfter(horizon, 'day') && dates.length < count) {
    dates.push(cursor);
    cursor = cursor.add(step, 'day');
  }
  return dates;
}

export function countUserRecurringOccurrences(config) {
  return listUserRecurringDates(config).length;
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
    if (count < 1) {
      return { ok: false, errorKey: 'forms.recurringEndBeforeStart', count: 0 };
    }
    return { ok: true, count };
  }

  const requestedCount = Number(config.maxOccurrences);
  if (!Number.isInteger(requestedCount) || requestedCount < 1) {
    return { ok: false, errorKey: 'forms.recurringInvalidCount', count: 0 };
  }

  return {
    ok: true,
    count: countUserRecurringOccurrences({
      startDate: selectedDate,
      interval: config.interval,
      endType: 'count',
      maxOccurrences: requestedCount,
    }),
  };
}
