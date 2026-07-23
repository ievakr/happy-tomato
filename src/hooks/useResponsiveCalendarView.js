import { useCallback, useEffect } from 'react';
import dayjs from 'dayjs';
import { useCalendarContext } from '../context/CalendarContext';
import { getCurrentWeekIndex } from '../utils';
import { useResponsive } from './useResponsive';

/**
 * Auto-switch calendar views on resize and expose view-switch helpers for the header.
 */
export function useResponsiveCalendarView() {
  const {
    currentView,
    setCurrentView,
    monthIndex,
    setWeekIndex,
    daySelected,
    setDaySelected,
  } = useCalendarContext();
  const { isMobile } = useResponsive();

  const switchToWeekView = useCallback(() => {
    setCurrentView('week');
    setWeekIndex(getCurrentWeekIndex(monthIndex, dayjs()));
  }, [monthIndex, setCurrentView, setWeekIndex]);

  const switchToDailyView = useCallback(() => {
    setCurrentView('daily');
    if (!daySelected) {
      setDaySelected(dayjs());
    }
  }, [daySelected, setCurrentView, setDaySelected]);

  useEffect(() => {
    if (currentView === 'garden') {
      setCurrentView(isMobile ? 'daily' : 'month');
      return;
    }
    if (currentView === 'guide' || currentView === 'disease-guide') {
      return;
    }
    if (!isMobile && currentView === 'year') {
      setCurrentView('month');
      return;
    }
    if (!isMobile && currentView === 'daily') {
      switchToWeekView();
    } else if (isMobile && currentView === 'week') {
      switchToDailyView();
    }
  }, [isMobile, currentView, setCurrentView, switchToWeekView, switchToDailyView]);

  return { switchToWeekView, switchToDailyView };
}
