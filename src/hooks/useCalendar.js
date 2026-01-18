import { useState, useEffect, useContext } from 'react';
import { getMonth } from '../utils';
import CalendarContext from '../context/CalendarContext';

/**
 * Custom hook for calendar state management
 */
export const useCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(getMonth());
  const { monthIndex } = useContext(CalendarContext);

  useEffect(() => {
    setCurrentMonth(getMonth(monthIndex));
  }, [monthIndex]);

  return {
    currentMonth,
    setCurrentMonth
  };
}; 