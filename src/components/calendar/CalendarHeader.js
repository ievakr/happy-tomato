import React from 'react';
import { getDayHeaders } from '../../utils';

/**
 * Calendar header component that displays day names starting from Monday
 */
const CalendarHeader = () => {
  const dayHeaders = getDayHeaders('short');

  return (
    <div 
      className="calendar-header-days d-grid border-bottom border-secondary" 
      style={{ 
        gridTemplateColumns: 'repeat(7, 1fr)',
        backgroundColor: '#f8f9fa',
        padding: '8px 0'
      }}
    >
      {dayHeaders.map((day, index) => (
        <div 
          key={index} 
          className="text-center text-muted small fw-bold"
          style={{ padding: '4px 0' }}
        >
          {day}
        </div>
      ))}
    </div>
  );
};

export default CalendarHeader; 