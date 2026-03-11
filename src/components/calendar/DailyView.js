import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import dayjs from 'dayjs';
import CalendarContext from '../../context/CalendarContext';
import { useEventContext } from '../../context/EventContext';
import { getDayHeaders } from '../../utils';
import { useResponsive, useSwipeGestures } from '../../hooks';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../common';
import EventItem from './EventItem';
import '../../index.css';

const DailyView = () => {
  const { showError } = useToast();
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
    loadingOperation,
    plantsById
  } = useEventContext();
  
  const { isMobile } = useResponsive();
  const scrollContainerRef = useRef(null);
  const dayElementMapRef = useRef(new Map());
  const [displayedMonth, setDisplayedMonth] = useState(dayjs());
  const [eventToDelete, setEventToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const initialLoadRef = useRef(true);

  const applyMonthChange = useCallback((newMonth) => {
    const currentDayValue = daySelected || dayjs();
    const dayOfMonth = currentDayValue.date();
    const newDay = dayjs(new Date(currentDayValue.year(), newMonth, dayOfMonth));
    setMonthIndex(newMonth);
    setDaySelected(newDay);
  }, [daySelected, setMonthIndex, setDaySelected]);

  const scrollToDay = useCallback((targetEl) => {
    const container = scrollContainerRef.current;
    if (!container || !targetEl) {
      return;
    }

    const targetCenter = targetEl.offsetLeft + (targetEl.offsetWidth / 2);
    const desiredLeft = targetCenter - (container.clientWidth / 2);
    const maxLeft = container.scrollWidth - container.clientWidth;
    const targetLeft = Math.max(0, Math.min(desiredLeft, maxLeft));
    container.scrollLeft = targetLeft;
  }, []);

  // Swipe handlers for month navigation in selected day area
  const handleSwipeLeft = () => {
    if (isMobile) {
      applyMonthChange(monthIndex + 1); // Next month
    }
  };
  
  const handleSwipeRight = () => {
    if (isMobile) {
      applyMonthChange(monthIndex - 1); // Previous month
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

  // Keep the day scroller aligned when selected day changes externally
  useEffect(() => {
    if (!isMobile) {
      return;
    }

    const selectedKey = currentDay.format('YYYY-MM-DD');
    const selectedEl = dayElementMapRef.current.get(selectedKey);
    if (selectedEl) {
      scrollToDay(selectedEl);
    }
  }, [currentDay, isMobile, scrollToDay]);

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

  const handleDaySelection = useCallback((day, index, event) => {
    setDaySelected(day);
    if (!isMobile) {
      return;
    }

    const target = event?.currentTarget;
    if (target) {
      scrollToDay(target);
      return;
    }

    // Fallback to manual centering if needed
    const scrollPosition = index * 70 - (window.innerWidth / 2) + 35;
    scrollContainerRef.current?.scrollTo({
      left: Math.max(0, scrollPosition),
      behavior: 'smooth'
    });
  }, [isMobile, scrollToDay, setDaySelected]);

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
      } catch {
        showError('Failed to delete event. Please try again.');
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

  const jumpToToday = useCallback(() => {
    const today = dayjs();
    setDaySelected(today);
    setMonthIndex(today.month());
  }, [setDaySelected, setMonthIndex]);

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
      {/* Mobile: Month navigation */}
      {isMobile && (
        <div className="position-relative py-2 bg-light">
          <div className="d-flex align-items-center justify-content-center gap-2">
            <button
              className="btn btn-sm btn-light"
              onClick={() => applyMonthChange(monthIndex - 1)}
              aria-label="Previous month"
              title="Previous month"
              type="button"
            >
              <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
                chevron_left
              </span>
            </button>
            <span className="calendar-month-label">
              {displayedMonth.format("MMMM YYYY")}
            </span>
            <button
              className="btn btn-sm btn-light"
              onClick={() => applyMonthChange(monthIndex + 1)}
              aria-label="Next month"
              title="Next month"
              type="button"
            >
              <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
                chevron_right
              </span>
            </button>
          </div>
          <button
            className="btn btn-sm btn-outline-secondary position-absolute top-50 end-0 translate-middle-y me-2"
            onClick={jumpToToday}
            type="button"
          >
            Today
          </button>
        </div>
      )}

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
                  onClick={(event) => handleDaySelection(day, index, event)}
                  ref={(node) => {
                    const key = day.format('YYYY-MM-DD');
                    if (node) {
                      dayElementMapRef.current.set(key, node);
                    } else {
                      dayElementMapRef.current.delete(key);
                    }
                  }}
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
          <h5 className="mb-1">
            {currentDay.format('dddd, MMMM D, YYYY')}
          </h5>
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
                            plantsById={plantsById || {}}
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

      {showDeleteConfirm && eventToDelete && (
        <ConfirmModal
          title="Delete Event"
          message={
            <>
              <p className="mb-2">Delete "{eventToDelete.title || eventToDelete.toDo}"?</p>
              <p className="mb-0 small">This action cannot be undone.</p>
            </>
          }
          confirmLabel="Delete"
          variant="danger"
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setEventToDelete(null);
          }}
          isLoading={isLoading && loadingOperation === 'delete'}
        />
      )}
    </div>
  );
};

export default DailyView;
