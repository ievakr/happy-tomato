import { useState, useEffect } from 'react';
import { getMonth } from '../utils';
import { useCalendarContext } from '../context/CalendarContext';

/**
 * Custom hook for calendar state management
 */
export const useCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(getMonth());
  const { monthIndex } = useCalendarContext();

  useEffect(() => {
    setCurrentMonth(getMonth(monthIndex));
  }, [monthIndex]);

  return {
    currentMonth,
    setCurrentMonth
  };
}; 