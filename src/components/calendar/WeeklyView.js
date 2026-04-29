import React, { useContext, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import CalendarContext from '../../context/CalendarContext';
import { useEventContext } from '../../context/EventContext';
import {
  getWeekByIndex,
  getWeekDateRange,
  getDayHeaders,
  getCurrentWeekIndex,
  monthIndexFromCalendarDate,
  calendarDateFromMonthIndex,
} from '../../utils';
import { useResponsive, useSwipeGestures } from '../../hooks';
import { ConfirmModal } from '../common';
import EventItem from './EventItem';
import '../../index.css';

const WeeklyView = () => {
  const { 
    monthIndex, 
    weekIndex, 
    setMonthIndex,
    setWeekIndex,
    setDaySelected,
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
    const idx = monthIndexFromCalendarDate(now);
    setMonthIndex(idx);
    setWeekIndex(getCurrentWeekIndex(idx, now));
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
  } = useEventContext();
  
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
      } catch {
        // Toast already shown by dispatchCallEvent
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

  const weekMonthAnchor = calendarDateFromMonthIndex(monthIndex);
  const isCurrentMonth = (day) => day.isSame(weekMonthAnchor, 'month');

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

export default WeeklyView; 