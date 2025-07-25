import React, { useContext, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import GlobalContext from '../../context/GlobalContext';
import { getWeekByIndex, getWeekDateRange, getDayHeaders } from '../../utils';
import { useResponsive } from '../../hooks';
import { PLANT_LABELS } from '../../constants';
import EventItem from './EventItem';
import '../../index.css';

const WeeklyView = () => {
  const { 
    monthIndex, 
    weekIndex, 
    filteredEvents, 
    setDaySelected, 
    setShowEventModal, 
    setSelectedEvent,
    isInitialLoading 
  } = useContext(GlobalContext);
  
  const { isMobile } = useResponsive();
  const [currentWeek, setCurrentWeek] = useState([]);

  useEffect(() => {
    const week = getWeekByIndex(monthIndex, weekIndex);
    setCurrentWeek(week);
  }, [monthIndex, weekIndex]);

  const handleDayClick = (day) => {
    setDaySelected(day);
    setShowEventModal(true);
  };

  const handleEventClick = (evt, e) => {
    e.stopPropagation();
    setSelectedEvent(evt);
    setShowEventModal(true);
  };

  const getEventsForDay = (day) => {
    return filteredEvents.filter(evt => 
      dayjs(evt.day).format("DD-MM-YY") === day.format("DD-MM-YY")
    );
  };

  const getCurrentDayClass = (day) => {
    return day.format("DD-MM-YY") === dayjs().format("DD-MM-YY")
      ? 'current-day'
      : '';
  };

  const isCurrentMonth = (day) => {
    return day.month() === monthIndex;
  };

  if (isInitialLoading) {
    return (
      <div className="weekly-view-loading d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="weekly-view flex-grow-1 d-flex flex-column">
      {/* Week date range header */}
      <div className="week-header text-center py-2 border-bottom bg-light">
        <h3 className="mb-0 fs-6 text-muted">
          {getWeekDateRange(currentWeek)}
        </h3>
      </div>

      {/* Weekly planner grid */}
      <div className="week-grid flex-grow-1">
        {currentWeek.map((day, dayIndex) => {
          const dayEvents = getEventsForDay(day);
          const dayHeaders = getDayHeaders('short');
          
          return (
            <div 
              key={day.format('YYYY-MM-DD')}
              className={`week-day ${getCurrentDayClass(day)} ${!isCurrentMonth(day) ? 'other-month' : ''}`}
              onClick={() => handleDayClick(day)}
            >
              {/* Day header */}
              <div className="day-header">
                <div className="day-name text-muted small">
                  {dayHeaders[dayIndex]}
                </div>
                <div className={`day-number ${getCurrentDayClass(day) ? 'current' : ''}`}>
                  {day.format('D')}
                </div>
              </div>

              {/* Events list */}
              <div className="day-events">
                {dayEvents.length > 0 ? (
                  <div className="events-list">
                    {dayEvents.map((evt, idx) => (
                      <div 
                        key={evt.id || idx}
                        className="event-item-weekly"
                        onClick={(e) => handleEventClick(evt, e)}
                      >
                        <EventItem 
                          event={evt} 
                          compact={true}
                          showTime={!isMobile}
                          labelsMapping={PLANT_LABELS}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-events text-muted small text-center py-2">
                    {isMobile ? '' : 'No events'}
                  </div>
                )}


              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyView; 