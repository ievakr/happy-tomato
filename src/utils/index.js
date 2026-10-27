import dayjs from 'dayjs';

export {
  calendarNavRefYear,
  monthIndexFromCalendarDate,
  calendarDateFromMonthIndex,
} from './calendarNav';

export {
  getCalendarEventAlphabeticalLabel,
  sortCalendarEventsAlphabeticallyMobile,
} from './eventSorting';

export {
  formatCalendarDay,
  isSameCalendarDay,
  isToday,
  filterEventsForDay,
} from './eventDates';

export {
  eventHasTodoContent,
  isTodoEvent,
  isCompletedTodoAction,
  supportsDayViewCompleteToggle,
} from './recurringTodos';

/**
 * Get the calendar month grid for a given month
 * @param {number} month - Month index ( offset from January of the current calendar year; any integer )
 * @returns {Array<Array<dayjs.Dayjs>>} 2D array representing calendar weeks
 */
export function getMonth(month = dayjs().month()) {
  const year = dayjs().year();
  // Adjust to make Monday the first day of the week (0=Sunday, 1=Monday, etc.)
  // Convert Sunday=0 to Sunday=6, Monday=1 to Monday=0, etc.
  const firstDayOfTheMonth = (dayjs(new Date(year, month, 1)).day() + 6) % 7;
  let currentMonthCount = 0 - firstDayOfTheMonth;

  const daysMatrix = new Array(5).fill([]).map(() => {
    return new Array(7).fill(null).map(() => {
      currentMonthCount++;
      return dayjs(new Date(year, month, currentMonthCount));
    });
  });

  return daysMatrix;
}



/**
 * Capitalize the first character of a string. Used for date labels because
 * some locales (e.g. Lithuanian) render month/weekday names lowercase.
 * @param {string} str
 * @returns {string}
 */
export function capitalizeFirst(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get day headers starting from Monday
 * @param {string} format - Format type ('short' for 3-letter, 'single' for 1-letter)
 * @returns {Array<string>} Array of day headers
 */
export function getDayHeaders(format = 'short') {
  // Create a reference Monday (January 1, 2024 was a Monday)
  const monday = dayjs('2024-01-01');
  
  const headers = [];
  for (let i = 0; i < 7; i++) {
    const day = monday.add(i, 'day');
    if (format === 'single') {
      headers.push(day.format('dd').charAt(0));
    } else {
      headers.push(day.format('ddd').toUpperCase());
    }
  }
  
  return headers;
}

/**
 * Get the current week's days starting from Monday
 * @param {dayjs.Dayjs} date - Reference date to get the week for
 * @returns {Array<dayjs.Dayjs>} Array of 7 days representing the week
 */
export function getWeek(date = dayjs()) {
  const startOfWeek = date.startOf('week').add(1, 'day'); // Start from Monday
  const week = [];
  
  for (let i = 0; i < 7; i++) {
    week.push(startOfWeek.add(i, 'day'));
  }
  
  return week;
}

/**
 * Get the week for a specific month and week index
 * @param {number} month - Month index (0-11)
 * @param {number} weekIndex - Week index (0-based)
 * @returns {Array<dayjs.Dayjs>} Array of 7 days representing the week
 */
export function getWeekByIndex(month = dayjs().month(), weekIndex = 0) {
  const monthData = getMonth(month);
  if (weekIndex >= 0 && weekIndex < monthData.length) {
    return monthData[weekIndex];
  }
  return getWeek();
}

/**
 * Get week date range for display
 * @param {Array<dayjs.Dayjs>} week - Array of week days
 * @returns {string} Formatted week range (e.g., "Dec 2-8, 2024")
 */
export function getWeekDateRange(week) {
  if (!week || week.length === 0) return '';
  
  const firstDay = week[0];
  const lastDay = week[6];
  
  if (firstDay.month() === lastDay.month()) {
    return `${firstDay.format('MMM')} ${firstDay.format('D')}-${lastDay.format('D')}, ${firstDay.format('YYYY')}`;
  } else {
    return `${firstDay.format('MMM D')} - ${lastDay.format('MMM D')}, ${firstDay.format('YYYY')}`;
  }
}

/**
 * Get the current week index for a given month
 * @param {number} month - Month index (0-11)
 * @param {dayjs.Dayjs} date - Reference date
 * @returns {number} Week index within the month
 */
export function getCurrentWeekIndex(month = dayjs().month(), date = dayjs()) {
  const monthData = getMonth(month);
  const currentDateStr = date.format("DD-MM-YY");
  
  for (let weekIndex = 0; weekIndex < monthData.length; weekIndex++) {
    const week = monthData[weekIndex];
    for (let day of week) {
      if (day.format("DD-MM-YY") === currentDateStr) {
        return weekIndex;
      }
    }
  }
  return 0;
} 