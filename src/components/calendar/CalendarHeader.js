import React, { memo } from 'react';
import { useResponsive } from '../../hooks';
import { capitalizeFirst, getDayHeaders } from '../../utils';

/**
 * Calendar header component that displays day names starting from Monday
 */
const CalendarHeader = memo(() => {
  const { isMobile } = useResponsive();
  const dayHeaders = getDayHeaders('short').map((day) =>
    isMobile ? capitalizeFirst(day.toLowerCase()) : day
  );

  return (
    <>
      <div className={`calendar-header-days border-bottom${isMobile ? ' calendar-header-days--month' : ' bg-light'}`}>
        {dayHeaders.map((day, index) => (
          <div
            key={index}
            className={`text-center${
              isMobile ? ' calendar-header-day-label' : ' small fw-semibold py-1 text-muted'
            }`}
          >
            {day}
          </div>
        ))}
      </div>
    </>
  );
});

export default CalendarHeader; 