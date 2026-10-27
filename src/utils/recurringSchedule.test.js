import dayjs from 'dayjs';
import {
  MAX_RECURRING_OCCURRENCES,
  validateUserRecurringConfig,
} from './recurringSchedule';

describe('validateUserRecurringConfig', () => {
  const start = dayjs('2026-10-27').startOf('day');

  function config(overrides) {
    return {
      enabled: true,
      interval: 7,
      endType: 'count',
      maxOccurrences: 2,
      ...overrides,
    };
  }

  test('an end date equal to the start date is one event', () => {
    const result = validateUserRecurringConfig(
      config({ endType: 'until', untilDate: start.toDate() }),
      start.toDate()
    );
    expect(result).toEqual({ ok: true, count: 1 });
  });

  test('an end date before the start date is rejected', () => {
    const result = validateUserRecurringConfig(
      config({ endType: 'until', untilDate: start.subtract(1, 'day').toDate() }),
      start.toDate()
    );
    expect(result.ok).toBe(false);
    expect(result.errorKey).toBe('forms.recurringEndBeforeStart');
  });

  test('a daily series longer than a year is rejected', () => {
    const result = validateUserRecurringConfig(
      config({
        interval: 1,
        endType: 'until',
        untilDate: start.add(1, 'year').toDate(),
      }),
      start.toDate()
    );
    expect(result.ok).toBe(false);
    expect(result.errorKey).toBe('forms.recurringTooMany');
    expect(result.count).toBeGreaterThan(MAX_RECURRING_OCCURRENCES);
  });

  test('rejects an empty interval and zero', () => {
    expect(validateUserRecurringConfig(config({ interval: '' }), start.toDate()).errorKey).toBe(
      'forms.recurringInvalidInterval'
    );
    expect(validateUserRecurringConfig(config({ interval: 0 }), start.toDate()).errorKey).toBe(
      'forms.recurringInvalidInterval'
    );
  });

  test('allows the corners of the allowed range', () => {
    expect(validateUserRecurringConfig(config({ interval: 1, maxOccurrences: 50 }), start.toDate())).toEqual({
      ok: true,
      count: 50,
    });
    expect(validateUserRecurringConfig(config({ interval: 365, maxOccurrences: 2 }), start.toDate())).toEqual({
      ok: true,
      count: 2,
    });
  });

  test('rejects an interval of 366 and a count of 51', () => {
    expect(validateUserRecurringConfig(config({ interval: 366 }), start.toDate()).errorKey).toBe(
      'forms.recurringInvalidInterval'
    );
    expect(validateUserRecurringConfig(config({ maxOccurrences: 51 }), start.toDate()).errorKey).toBe(
      'forms.recurringInvalidCount'
    );
  });
});
