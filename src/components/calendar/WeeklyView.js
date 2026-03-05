import React, { useContext, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import CalendarContext from '../../context/CalendarContext';
import EventContext from '../../context/EventContext';
import { getWeekByIndex, getWeekDateRange, getDayHeaders, getCurrentWeekIndex } from '../../utils';
import { useResponsive, useSwipeGestures } from '../../hooks';
import EventItem from './EventItem';
import '../../index.css';

const WeeklyView = () => {
  const { 
    monthIndex, 
    weekIndex, 
    setMonthIndex,
    setWeekIndex,
    setDaySelected
  } = useContext(CalendarContext);

  const handlePrevWeek = () => {
    if (weekIndex > 0) {
      setWeekIndex(weekIndex - 1);
    } else {
      setMonthIndex(monthIndex - 1);
      setWeekIndex(4);
    }
  };

  const handleNextWeek = () => {
    if (weekIndex < 4) {
      setWeekIndex(weekIndex + 1);
    } else {
      setMonthIndex(monthIndex + 1);
      setWeekIndex(0);
    }
  };

  const handleToday = () => {
    const now = dayjs();
    setMonthIndex(now.month());
    setWeekIndex(getCurrentWeekIndex(now.month(), now));
  };

  const {
    filteredEvents,
    setShowEventModal,
    setSelectedEvent,
    isInitialLoading,
    dispatchCallEvent,
    isLoading,
    loadingOperation,
    plantsById
  } = useContext(EventContext);
  
  const { isMobile } = useResponsive();
  const [currentWeek, setCurrentWeek] = useState([]);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Swipe handlers for week navigation
  const handleSwipeLeft = () => {
    if (isMobile) {
      if (weekIndex < 4) {
        setWeekIndex(weekIndex + 1);
      } else {
        // Go to next month, first week
        setMonthIndex(monthIndex + 1);
        setWeekIndex(0);
      }
    }
  };
  
  const handleSwipeRight = () => {
    if (isMobile) {
      if (weekIndex > 0) {
        setWeekIndex(weekIndex - 1);
      } else {
        // Go to previous month, last week
        setMonthIndex(monthIndex - 1);
        setWeekIndex(4);
      }
    }
  };
  
  const swipeRef = useSwipeGestures(handleSwipeLeft, handleSwipeRight, 50, 0.3);

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
      ? 'current-day'
      : '';
  };

  const isCurrentMonth = (day) => {
    return day.month() === monthIndex;
  };

  if (isInitialLoading) {
    return (
      <div className="weekly-view-loading d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={isMobile ? swipeRef : null}
      className="weekly-view flex-grow-1 d-flex flex-column"
      style={{ 
        touchAction: isMobile ? 'pan-y' : 'auto' // Allow vertical scrolling but handle horizontal swipes
      }}
    >
      {/* Week date range header with navigation */}
      <div className="week-header d-flex align-items-center justify-content-center gap-1 py-2 border-bottom bg-light">
        <button
          type="button"
          className="btn btn-sm btn-light p-1"
          onClick={handlePrevWeek}
          aria-label="Previous week"
          title="Previous week"
        >
          <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
            chevron_left
          </span>
        </button>
        <h3 className="mb-0 fs-6 text-muted text-center" style={{ minWidth: 'fit-content' }}>
          {getWeekDateRange(currentWeek)}
        </h3>
        <button
          type="button"
          className="btn btn-sm btn-light p-1"
          onClick={handleNextWeek}
          aria-label="Next week"
          title="Next week"
        >
          <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
            chevron_right
          </span>
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary ms-2"
          onClick={handleToday}
          aria-label="Go to today"
          title="Go to today"
        >
          Today
        </button>
      </div>

      {/* Weekly planner grid container with horizontal scroll */}
      <div 
        className={`week-grid-container flex-grow-1 ${isMobile ? 'week-grid-scroll' : ''}`}
      >
        {/* Hide scrollbar for webkit browsers */}
        {isMobile && (
          <style dangerouslySetInnerHTML={{
            __html: `
              .week-grid-container::-webkit-scrollbar {
                display: none;
              }
            `
          }} />
        )}
        
        {/* Weekly planner grid */}
        <div 
          className={`week-grid ${isMobile ? 'week-grid-mobile' : ''}`}
        >
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
                          className="event-item-weekly position-relative"
                          onClick={(e) => handleEventClick(evt, e)}
                        >
                          <EventItem 
                            event={evt} 
                            compact={true}
                            showTime={!isMobile}
                            plantsById={plantsById || {}}
                          />
                          {/* Quick delete button - only show on desktop */}
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

export default WeeklyView; 