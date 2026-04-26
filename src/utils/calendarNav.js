import dayjs from 'dayjs';

/** Reference year used by {@link getMonth} — `new Date(refYear, monthIndex, d)`. */
export function calendarNavRefYear() {
  return dayjs().year();
}

/**
 * Linear month index used across the app: months since January of {@link calendarNavRefYear}.
 * @param {import('dayjs').Dayjs} d
 */
export function monthIndexFromCalendarDate(d) {
  const ref = calendarNavRefYear();
  return (d.year() - ref) * 12 + d.month();
}

/** First day of the month for a given month index (same convention as getMonth). */
export function calendarDateFromMonthIndex(monthIndex) {
  return dayjs(new Date(calendarNavRefYear(), monthIndex, 1));
}
