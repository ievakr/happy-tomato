import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import dayjs from 'dayjs';
import CalendarContext from '../../context/CalendarContext';
import EventContext from '../../context/EventContext';
import { getDayHeaders } from '../../utils';
import { useResponsive, useSwipeGestures } from '../../hooks';
import { PLANT_LABELS } from '../../constants';
import EventItem from './EventItem';
import '../../index.css';

const DailyView = () => {
  const { 
    daySelected,
    setDaySelected,
    monthIndex,
    setMonthIndex
  } = useContext(CalendarContext);
  const {
    filteredEvents,
    setShowEventModal,
    setSelectedEvent,
    isInitialLoading,
    dispatchCallEvent,
    isLoading,
    loadingOperation
  } = useContext(EventContext);
  
  const { isMobile } = useResponsive();
  const scrollContainerRef = useRef(null);
  const [displayedMonth, setDisplayedMonth] = useState(dayjs());
  const [eventToDelete, setEventToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const initialLoadRef = useRef(true);

  // Swipe handlers for month navigation in selected day area
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

  // Get current day or fallback to today
  const currentDay = daySelected || dayjs();

  // Generate days around the current day for mobile scrolling
  const daysToShow = 60; // Show 30 days before and 30 days after current day
  const startDay = currentDay.subtract(Math.floor(daysToShow / 2), 'day');
  const allDays = Array.from({ length: daysToShow }, (_, i) => 
    startDay.add(i, 'day')
  );

  const dayHeaders = getDayHeaders('short');

  // Function to calculate which day is currently centered in viewport
  const updateDisplayedMonth = useCallback(() => {
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
  }, [allDays, displayedMonth, isMobile]);

  // Scroll to current day only on initial mount
  useEffect(() => {
    if (scrollContainerRef.current && isMobile && initialLoadRef.current) {
      const currentDayIndex = allDays.findIndex(day => 
        day.format("DD-MM-YY") === currentDay.format("DD-MM-YY")
      );
      
      if (currentDayIndex !== -1) {
        const scrollPosition = currentDayIndex * 70 - (window.innerWidth / 2) + 35; // Center the current day
        scrollContainerRef.current.scrollTo({
          left: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
        initialLoadRef.current = false;
      }
    }
  }, [isMobile, allDays, currentDay]);

  // Update displayed month when currentDay changes
  useEffect(() => {
    setDisplayedMonth(currentDay);
  }, [currentDay]);

  // Add scroll event listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && isMobile) {
      let scrollTimeout;
      const handleScroll = () => {
        // Debounce scroll events
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(updateDisplayedMonth, 150);
      };
      
      container.addEventListener('scroll', handleScroll);
      return () => {
        container.removeEventListener('scroll', handleScroll);
        clearTimeout(scrollTimeout);
      };
    }
  }, [updateDisplayedMonth, isMobile]);

  // Update month index when displayed month changes
  useEffect(() => {
    if (displayedMonth.month() !== monthIndex) {
      setMonthIndex(displayedMonth.month());
    }
  }, [displayedMonth, monthIndex, setMonthIndex]);

  const handleDayClick = (day) => {
    setDaySelected(day);
    setShowEventModal(true);
  };

  const handleDaySelection = useCallback((day, index) => {
    setDaySelected(day);
    // Center the selected day in viewport
    const scrollPosition = index * 70 - (window.innerWidth / 2) + 35;
    scrollContainerRef.current?.scrollTo({
      left: Math.max(0, scrollPosition),
      behavior: 'smooth'
    });
  }, [setDaySelected]);

  const handleEventClick = (evt, e) => {
    e.stopPropagation();
    setSelectedEvent(evt);
    setShowEventModal(true);
  };

  const handleQuickDelete = (evt, e) => {
    e.stopPropagation();
    setEventToDelete(evt);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (eventToDelete) {
      try {
        await dispatchCallEvent({ type: "delete", payload: eventToDelete });
        setShowDeleteConfirm(false);
        setEventToDelete(null);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const getEventsForDay = (day) => {
    return filteredEvents.filter(evt => 
      dayjs(evt.day).format("DD-MM-YY") === day.format("DD-MM-YY")
    );
  };

  const getCurrentDayClass = (day) => {
    return day.format("DD-MM-YY") === dayjs().format("DD-MM-YY")
      ? 'today'
      : '';
  };

  const isSelectedDay = (day) => {
    return day.format("DD-MM-YY") === currentDay.format("DD-MM-YY");
  };

  if (isInitialLoading) {
    return (
      <div className="daily-view-loading d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="daily-view flex-grow-1 d-flex flex-column">
      {/* Mobile: Horizontal scrollable week header */}
      {isMobile && (
        <div className="daily-week-header bg-light py-2" style={{ minHeight: '60px' }}>
          <div 
            ref={scrollContainerRef}
            className="d-flex daily-week-scroll"
          >
            <style dangerouslySetInnerHTML={{
              __html: `
                .daily-week-header .d-flex::-webkit-scrollbar {
                  display: none;
                }
              `
            }} />
            {allDays.map((day, index) => {
              // Convert dayjs day index (0=Sunday) to getDayHeaders index (0=Monday)
              const dayOfWeek = (day.day() + 6) % 7;
              const dayEvents = getEventsForDay(day);
              
              return (
                <div
                  key={day.format('YYYY-MM-DD')}
                  className={`daily-week-day text-center ${getCurrentDayClass(day)} ${isSelectedDay(day) ? 'selected' : ''}`}
                  onClick={() => handleDaySelection(day, index)}
                >
                  <div className="day-name-mini text-muted">
                    {dayHeaders[dayOfWeek]}
                  </div>
                  <div 
                    className={`day-number-mini fw-bold`}
                  >
                    {day.format('D')}
                  </div>
                  {dayEvents.length > 0 && (
                    <div className="events-indicator">
                      <span className="badge bg-secondary rounded-pill">
                        {dayEvents.length}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Day Info and Events */}
        <div 
          ref={isMobile ? swipeRef : null} 
          className="selected-day-info flex-grow-1 p-3 d-flex flex-column"
          style={{ 
            touchAction: isMobile ? 'pan-y' : 'auto',
            overflow: 'hidden',
            minHeight: 0
          }}
        >
        {/* Day title */}
        <div className="mb-3">
          <h4 className="mb-1">
            {currentDay.format('dddd, MMMM D, YYYY')}
          </h4>
          {currentDay.format("DD-MM-YY") === dayjs().format("DD-MM-YY") && (
            <small className="text-muted">Today</small>
          )}
        </div>

        {/* Scrollable Events container */}
        <div 
          className="daily-events flex-grow-1"
          style={{
            overflowY: 'auto',
            minHeight: 0
          }}
        >
              {(() => {
                const dayEvents = getEventsForDay(currentDay);
                
                if (dayEvents.length === 0) {
                  return (
                    <div className="no-events text-center py-5">
                      <div className="text-muted mb-3">
                        <span className="material-icons-outlined" style={{ fontSize: '3rem' }}>
                          event_available
                        </span>
                      </div>
                      <p className="text-muted">No events scheduled for this day</p>
                    </div>
                  );
                }

                return (
                  <div className="events-list">
                    <h6 className="mb-3">Events ({dayEvents.length})</h6>
                    {dayEvents.map((evt, idx) => {
                        // Check if this is a completed todo
                        const isCompletedTodo = evt.toDo && evt.completed;
                        
                        return (
                        <div 
                          key={evt.id || idx}
                          className={`event-item-daily mb-2 p-2 border rounded position-relative ${isCompletedTodo ? 'event-item-daily-completed' : ''}`}
                          onClick={(e) => handleEventClick(evt, e)}
                        >
                          <EventItem 
                            event={evt} 
                            compact={false}
                            showTime={true}
                            labelsMapping={PLANT_LABELS}
                            showAllIcons={true}
                          />
                          {/* Quick delete button */}
                          {!isMobile && (
                            <button
                              className="quick-delete-btn btn btn-sm btn-danger position-absolute"
                              onClick={(e) => handleQuickDelete(evt, e)}
                              title="Delete event"
                            >
                              ×
                            </button>
                          )}
                        </div>
                        );
                      })}
                  </div>
                );
              })()}
        </div>
        
        {/* Add event button - always visible at bottom */}
        <div className="mt-3 pt-3 border-top">
          <button 
            className="btn btn-danger w-100"
            onClick={() => handleDayClick(currentDay)}
          >
            <span className="material-icons-outlined me-2" style={{ fontSize: '1rem' }}>
              add
            </span>
            Add Event
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && eventToDelete && (
        <>
          <div className="modal fade show d-block" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered modal-sm">
              <div className="modal-content">
                <div className="modal-header">
                  <h6 className="modal-title">Delete Event</h6>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setEventToDelete(null);
                    }}
                    aria-label="Close"
                    disabled={isLoading}
                  />
                </div>
                <div className="modal-body">
                  <p className="mb-2 text-muted">
                    Delete "{eventToDelete.title || eventToDelete.toDo}"?
                  </p>
                  <p className="mb-0 text-muted small">This action cannot be undone.</p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setEventToDelete(null);
                    }}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={confirmDelete}
                    disabled={isLoading}
                  >
                    {isLoading && loadingOperation === 'delete' ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Deleting...</span>
                        </span>
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}
    </div>
  );
};

export default DailyView;
