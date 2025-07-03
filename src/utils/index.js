import dayjs from 'dayjs';

/**
 * Get the calendar month grid for a given month
 * @param {number} month - Month index (0-11)
 * @returns {Array<Array<dayjs.Dayjs>>} 2D array representing calendar weeks
 */
export function getMonth(month = dayjs().month()) {
  const year = dayjs().year();
  const firstDayOfTheMonth = dayjs(new Date(year, month, 1)).day();
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
    ? 'bg-primary text-white rounded-circle d-flex align-items-center justify-content-center'
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