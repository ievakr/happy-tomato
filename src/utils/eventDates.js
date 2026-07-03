import dayjs from 'dayjs';
import { DATE_FORMATS } from '../constants';
import { sortCalendarEventsAlphabeticallyMobile } from './eventSorting';

export function formatCalendarDay(day) {
  return dayjs(day).format(DATE_FORMATS.DAY_MONTH_YEAR);
}

export function isSameCalendarDay(a, b) {
  return formatCalendarDay(a) === formatCalendarDay(b);
}

export function isToday(day) {
  return isSameCalendarDay(day, dayjs());
}

/**
 * Filter events that fall on a given calendar day.
 * @param {Array} events
 * @param {dayjs.Dayjs|Date|number|string} day
 * @param {{ sortMobile?: boolean, plantsById?: object }} [options]
 */
export function filterEventsForDay(events, day, { sortMobile = false, plantsById = {} } = {}) {
  const forDay = events.filter((evt) => isSameCalendarDay(evt.day, day));
  if (sortMobile) {
    return sortCalendarEventsAlphabeticallyMobile(forDay, plantsById);
  }
  return forDay;
}
