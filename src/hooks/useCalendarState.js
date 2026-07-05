import { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import { useResponsive } from './useResponsive';
import { getCurrentWeekIndex, monthIndexFromCalendarDate } from '../utils';

/**
 * Hook for calendar view state: month, week, day selection, and view mode.
 */
export function useCalendarState() {
  const { isMobile } = useResponsive();
  const getInitialView = () => (isMobile ? 'daily' : 'month');

  const [monthIndex, setMonthIndex] = useState(dayjs().month());
  const [smallCalendarMonth, setSmallCalendarMonth] = useState(null);
  const [daySelected, setDaySelected] = useState(dayjs());
  const [currentView, setCurrentView] = useState(getInitialView());
  const [weekIndex, setWeekIndex] = useState(0);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [todayFocusNonce, setTodayFocusNonce] = useState(0);

  const goToToday = useCallback(() => {
    const today = dayjs().startOf('day');
    setDaySelected(today);
    setMonthIndex(monthIndexFromCalendarDate(today));
    setWeekIndex(getCurrentWeekIndex(monthIndexFromCalendarDate(today), today));
    setTodayFocusNonce((n) => n + 1);
  }, []);

  // Sync small calendar month selection to main month
  useEffect(() => {
    if (smallCalendarMonth !== null) {
      setMonthIndex(smallCalendarMonth);
    }
  }, [smallCalendarMonth]);

  return {
    monthIndex,
    setMonthIndex,
    smallCalendarMonth,
    setSmallCalendarMonth,
    daySelected,
    setDaySelected,
    currentView,
    setCurrentView,
    weekIndex,
    setWeekIndex,
    currentDayIndex,
    setCurrentDayIndex,
    todayFocusNonce,
    goToToday,
  };
}
