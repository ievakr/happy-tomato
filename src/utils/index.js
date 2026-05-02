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
 * Get user-friendly loading messages for different operations
 * @param {string} operation - The operation being performed
 * @returns {string} User-friendly loading message
 */
export function getLoadingMessage(operation) {
  const messages = {
    'load': 'Loading your calendar...',
    'push': 'Creating event...',
    'update': 'Updating event...',
    'delete': 'Deleting event...',
    'sync': 'Syncing with cloud...',
    'save': 'Saving changes...'
  };
  
  return messages[operation] || 'Loading...';
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 12) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength);
}

/**
 * Check if text is truncated
 * @param {string} text - Text to check
 * @param {number} maxLength - Maximum length
 * @returns {boolean} Whether text is truncated
 */
export function isTextTruncated(text, maxLength = 12) {
  return text && text.length > maxLength;
}

/**
 * Get current day CSS class for highlighting today
 * @param {dayjs.Dayjs} day - Day to check
 * @returns {string} CSS class string
 */
export function getCurrentDayClass(day) {
  return day.format("DD-MM-YY") === dayjs().format("DD-MM-YY")
    ? 'bg-danger text-white rounded-circle d-flex align-items-center justify-content-center'
    : "";
}

/**
 * Debounce function for performance optimization
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Format date for display
 * @param {dayjs.Dayjs} date - Date to format
 * @param {string} format - Format string
 * @returns {string} Formatted date
 */
export function formatDate(date, format) {
  return dayjs(date).format(format);
}

/**
 * Check if device supports touch
 * @returns {boolean} Whether device supports touch
 */
export function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (Array.isArray(obj)) return obj.map(item => deepClone(item));
  
  const cloned = {};
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
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