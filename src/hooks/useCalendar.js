import { useState, useEffect, useContext } from 'react';
import { getMonth } from '../utils';
import GlobalContext from '../context/GlobalContext';

/**
 * Custom hook for calendar state management
 */
export const useCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(getMonth());
  const { monthIndex } = useContext(GlobalContext);

  useEffect(() => {
    setCurrentMonth(getMonth(monthIndex));
  }, [monthIndex]);

  return {
    currentMonth,
    setCurrentMonth
  };
}; 