import React from 'react';
import CalendarDay from './CalendarDay';

/**
 * Calendar grid component that renders the monthly calendar layout
 * @param {Array<Array<dayjs.Dayjs>>} month - 2D array of days representing the calendar month
 */
const CalendarGrid = ({ month }) => {
  if (!month || !Array.isArray(month)) {
    return <div className="calendar-grid">No calendar data available</div>;
  }

  return (
    <div 
      className="calendar-grid flex-grow-1 d-grid" 
      style={{ 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gridTemplateRows: 'repeat(5, 1fr)',
        height: '100%',
        maxHeight: '100%',
        overflow: 'hidden'
      }}
      role="grid"
      aria-label="Calendar month view"
    >
      {month.map((week, weekIndex) => (
        <React.Fragment key={`week-${weekIndex}`}>
          {week.map((day, dayIndex) => (
            <CalendarDay 
              key={`${day.format('YYYY-MM-DD')}-${dayIndex}`}
              day={day} 
              rowIndex={weekIndex}
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};

export default CalendarGrid;