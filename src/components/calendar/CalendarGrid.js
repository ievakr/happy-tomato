import React, { useContext } from 'react';
import CalendarDay from './CalendarDay';
import { CalendarDaySkeleton } from '../common';
import CalendarContext from '../../context/CalendarContext';
import EventContext from '../../context/EventContext';
import { useSwipeGestures, useResponsive } from '../../hooks';

/**
 * Calendar grid component that renders the monthly calendar layout
 * @param {Array<Array<dayjs.Dayjs>>} month - 2D array of days representing the calendar month
 */
const CalendarGrid = ({ month }) => {
  const { isInitialLoading } = useContext(EventContext);
  const { monthIndex, setMonthIndex } = useContext(CalendarContext);
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
    return <div className="calendar-grid">No calendar data available</div>;
  }

  return (
    <div 
      ref={swipeRef}
      className="calendar-grid flex-grow-1 d-grid" 
      style={{ 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gridTemplateRows: 'repeat(5, 1fr)',
        height: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
        touchAction: isMobile ? 'pan-y' : 'auto' // Allow vertical scrolling but handle horizontal swipes
      }}
      role="grid"
      aria-label="Calendar month view"
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