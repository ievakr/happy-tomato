import React, { useContext } from 'react';
import dayjs from 'dayjs';
import GlobalContext from '../../context/GlobalContext';
import { PLANT_LABELS } from '../../constants';
import { getWeek, getDayHeaders } from '../../utils';
import { useResponsive } from '../../hooks';
import EventItem from './EventItem';
import '../../index.css';

const DailyView = () => {
  const { 
    daySelected,
    filteredEvents, 
    setDaySelected, 
    setShowEventModal, 
    setSelectedEvent,
    isInitialLoading 
  } = useContext(GlobalContext);
  
  const { isMobile } = useResponsive();

  const currentDay = daySelected || dayjs();
  const currentWeek = getWeek(currentDay);
  const dayHeaders = getDayHeaders('short');

  const handleAddEvent = () => {
    setDaySelected(currentDay);
    setShowEventModal(true);
  };

  const handleEventClick = (evt, e) => {
    e.stopPropagation();
    setSelectedEvent(evt);
    setShowEventModal(true);
  };

  const handleDayClick = (day) => {
    setDaySelected(day);
  };

  const getEventsForDay = (day) => {
    return filteredEvents.filter(evt => 
      dayjs(evt.day).format("DD-MM-YY") === day.format("DD-MM-YY")
    );
  };

  const dayEvents = getEventsForDay(currentDay);
  const isToday = currentDay.format("DD-MM-YY") === dayjs().format("DD-MM-YY");

  if (isInitialLoading) {
    return (
      <div className="daily-view-loading d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="daily-view flex-grow-1 d-flex flex-column">
      {/* Clickable week row */}
      <div className="daily-week-header bg-light border-bottom">
        <div 
          className="d-flex" 
          style={{ 
            width: '100%',
            overflowX: 'auto',
            overflowY: 'hidden',
            gap: '1px',
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE
            WebkitOverflowScrolling: 'touch', // iOS smooth scrolling
            scrollBehavior: 'smooth'
          }}
        >
          {/* Hide scrollbar for webkit browsers */}
          <style dangerouslySetInnerHTML={{
            __html: `
              .daily-week-header .d-flex::-webkit-scrollbar {
                display: none;
              }
            `
          }} />
          
          {currentWeek.map((day, index) => {
            const isSelected = day.format("DD-MM-YY") === currentDay.format("DD-MM-YY");
            const isDayToday = day.format("DD-MM-YY") === dayjs().format("DD-MM-YY");
            
            return (
              <div
                key={day.format('YYYY-MM-DD')}
                className={`daily-week-day ${isSelected ? 'selected' : ''} ${isDayToday ? 'today' : ''}`}
                onClick={() => handleDayClick(day)}
                style={{ 
                  cursor: 'pointer',
                  minWidth: isMobile ? '70px' : '60px', // Increased mobile min-width for better spacing
                  width: isMobile ? '70px' : 'auto', // Fixed width on mobile to ensure overflow
                  flex: isMobile ? '0 0 auto' : '1 0 auto', // Don't grow on mobile, fixed size
                  maxWidth: isMobile ? '70px' : '120px' // Fixed max width on mobile
                }}
              >
                <div className="day-header-mini">
                  <div className="day-name-mini">
                    {dayHeaders[index]}
                  </div>
                  <div className="day-number-mini">
                    {day.format('D')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Selected day details */}
        <div className="selected-day-info text-center py-2 border-top">
          <h4 className={`mb-0 ${isToday ? 'text-primary' : 'text-secondary'}`}>
            {currentDay.format('dddd, MMMM D, YYYY')}
            {isToday && <small className="text-primary ms-2">Today</small>}
          </h4>
        </div>
      </div>

      {/* Events section */}
      <div className="daily-events flex-grow-1 p-3">
        {dayEvents.length > 0 ? (
          <div className="events-container">
            <h4 className="mb-3 text-secondary">
              Events ({dayEvents.length})
            </h4>
            <div className="events-list-daily">
              {dayEvents.map((evt, idx) => (
                <div 
                  key={evt.id || idx}
                  className="daily-event-item mb-3 p-3 bg-white border rounded shadow-sm"
                  onClick={(e) => handleEventClick(evt, e)}
                  style={{ cursor: 'pointer' }}
                >
                  <EventItem 
                    event={evt} 
                    compact={false}
                    showTime={true}
                    labelsMapping={PLANT_LABELS}
                    showAllIcons={true}
                  />
                  {evt.description && (
                    <div className="mt-2 text-muted small">
                      {evt.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="no-events-container text-center py-5">
            <div className="mb-3">
              <span className="material-icons-outlined text-muted" style={{ fontSize: '3rem' }}>
                event_available
              </span>
            </div>
            <h4 className="text-muted mb-3">No events today</h4>
            <p className="text-muted mb-3">
              {isToday ? "You're all free today!" : "Nothing scheduled for this day"}
            </p>
          </div>
        )}

        {/* Add event button */}
        <div className="add-event-section mt-4">
          <button 
            className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
            onClick={handleAddEvent}
          >
            <span className="material-icons-outlined me-2">
              add
            </span>
            Add Event
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyView; 