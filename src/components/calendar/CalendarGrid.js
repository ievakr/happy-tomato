import React from 'react';
import CalendarDay from './CalendarDay';
import { CalendarDaySkeleton } from '../common';
import { useCalendarContext } from '../../context/CalendarContext';
import { useEventContext } from '../../context/EventContext';
import { useSwipeGestures, useResponsive } from '../../hooks';
import { useTranslation } from '../../i18n/LanguageContext';

/**
 * Calendar grid component that renders the monthly calendar layout
 * @param {Array<Array<dayjs.Dayjs>>} month - 2D array of days representing the calendar month
 */
const CalendarGrid = ({ month }) => {
  const { t } = useTranslation();
  const { isInitialLoading } = useEventContext();
  const { monthIndex, setMonthIndex } = useCalendarContext();
  const { isMobile } = useResponsive();
  
  // Swipe handlers for mobile navigation
  const handleSwipeLeft = () => {
    if (isMobile) {
      setMonthIndex(monthIndex + 1); // Next month
    }
  };
  
  const handleSwipeRight = () => {
    if (isMobile) {
      setMonthIndex(monthIndex - 1); // Previous month
    }
  };
  
  const swipeRef = useSwipeGestures(handleSwipeLeft, handleSwipeRight, 50, 0.3);
  
  if (!month || !Array.isArray(month)) {
    return <div className="calendar-grid">{t('calendar.noCalendarData')}</div>;
  }

  return (
    <div 
      ref={swipeRef}
      className={`calendar-grid flex-grow-1${isMobile ? ' calendar-grid--month' : ''}`}
      style={{ touchAction: isMobile ? 'pan-y' : 'auto' }}
      role="grid"
      aria-label={t('calendar.monthViewLabel')}
    >
      {month.map((week, weekIndex) => (
        <React.Fragment key={`week-${weekIndex}`}>
          {week.map((day, dayIndex) => (
            isInitialLoading ? (
              <CalendarDaySkeleton key={`skeleton-${weekIndex}-${dayIndex}`} />
            ) : (
              <CalendarDay 
                key={`${day.format('YYYY-MM-DD')}-${dayIndex}`}
                day={day} 
                rowIndex={weekIndex}
              />
            )
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};

export default CalendarGrid;