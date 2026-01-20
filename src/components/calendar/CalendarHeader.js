import React, { memo } from 'react';
import { getDayHeaders } from '../../utils';

/**
 * Calendar header component that displays day names starting from Monday
 */
const CalendarHeader = memo(() => {
  const dayHeaders = getDayHeaders('short');

  return (
    <div className="calendar-header-days bg-light border-bottom">
      {dayHeaders.map((day, index) => (
        <div key={index} className="text-center text-muted small fw-semibold py-1">
          {day}
        </div>
      ))}
    </div>
  );
});

export default CalendarHeader; 