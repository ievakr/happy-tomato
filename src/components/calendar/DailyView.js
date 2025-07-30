import React, { useContext, useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import GlobalContext from '../../context/GlobalContext';
import { PLANT_LABELS } from '../../constants';
import { getDayHeaders } from '../../utils';
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
  const scrollContainerRef = useRef(null);
  const [displayedMonth, setDisplayedMonth] = useState(daySelected || dayjs());

  const currentDay = daySelected || dayjs();
  
  // Generate multiple weeks of days for continuous scrolling
  const generateDaysForScrolling = () => {
    const days = [];
    const weeksToShow = isMobile ? 6 : 4; // Show more weeks on mobile for better scrolling
    const startDate = currentDay.subtract(weeksToShow, 'week').startOf('week').add(1, 'day'); // Start from Monday
    
    for (let i = 0; i < (weeksToShow * 2 + 1) * 7; i++) {
      days.push(startDate.add(i, 'day'));
    }
    
    return days;
  };

  const allDays = generateDaysForScrolling();
  const dayHeaders = getDayHeaders('short');

  // Function to calculate which day is currently centered in viewport
  const updateDisplayedMonth = () => {
    if (!scrollContainerRef.current || !isMobile) return;
    
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const containerWidth = container.clientWidth;
    const dayWidth = 70; // Width of each day
    
    // Calculate which day is in the center of the viewport
    const centerPosition = scrollLeft + (containerWidth / 2);
    const centeredDayIndex = Math.floor(centerPosition / dayWidth);
    
    if (centeredDayIndex >= 0 && centeredDayIndex < allDays.length) {
      const centeredDay = allDays[centeredDayIndex];
      // Only update if the month actually changed
      if (!displayedMonth.isSame(centeredDay, 'month')) {
        setDisplayedMonth(centeredDay);
      }
    }
  };

  // Scroll to current day when component mounts or current day changes
  useEffect(() => {
    if (scrollContainerRef.current && isMobile) {
      const currentDayIndex = allDays.findIndex(day => 
        day.format("DD-MM-YY") === currentDay.format("DD-MM-YY")
      );
      
      if (currentDayIndex !== -1) {
        const scrollPosition = currentDayIndex * 70 - (window.innerWidth / 2) + 35; // Center the current day
        scrollContainerRef.current.scrollTo({
          left: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
      }
    }
  }, [currentDay, isMobile]);

  // Update displayed month when currentDay changes
  useEffect(() => {
    setDisplayedMonth(currentDay);
  }, [currentDay]);

  // Add scroll event listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !isMobile) return;

    let scrollTimeout;
    const handleScroll = () => {
      // Debounce the scroll handler to avoid too many updates
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(updateDisplayedMonth, 100);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [allDays, displayedMonth, isMobile]);

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
      {/* Month header */}
      <div className="month-header text-center py-2 bg-light text-dark">
        <h3 className="mb-0 fs-5 fw-bold">
          {displayedMonth.format('MMMM YYYY')}
        </h3>
      </div>

      {/* Clickable week row with continuous scrolling */}
      <div className="daily-week-header bg-light border-bottom">
        <div 
          ref={scrollContainerRef}
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
          
          {allDays.map((day, index) => {
            const isSelected = day.format("DD-MM-YY") === currentDay.format("DD-MM-YY");
            const isDayToday = day.format("DD-MM-YY") === dayjs().format("DD-MM-YY");
            const dayOfWeek = day.day(); // 0 = Sunday, 1 = Monday, etc.
            const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday = 0, Sunday = 6
            
            return (
              <div
                key={day.format('YYYY-MM-DD')}
                className={`daily-week-day ${isSelected ? 'selected' : ''} ${isDayToday ? 'today' : ''}`}
                onClick={() => handleDayClick(day)}
                style={{ 
                  cursor: 'pointer',
                  minWidth: isMobile ? '70px' : '60px',
                  width: isMobile ? '70px' : 'auto',
                  flex: isMobile ? '0 0 auto' : '1 0 auto',
                  maxWidth: isMobile ? '70px' : '120px'
                }}
              >
                <div className="day-header-mini">
                  <div className="day-name-mini">
                    {dayHeaders[adjustedDayOfWeek]}
                  </div>
                  <div className="day-number-mini">
                    {day.format('D')}
                  </div>
                </div>
              </div>
            );
          })}
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