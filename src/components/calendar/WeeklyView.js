import React, { useContext, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import GlobalContext from '../../context/GlobalContext';
import { getWeekByIndex, getWeekDateRange, getDayHeaders } from '../../utils';
import { useResponsive, useSwipeGestures } from '../../hooks';
import { PLANT_LABELS } from '../../constants';
import EventItem from './EventItem';
import '../../index.css';

const WeeklyView = () => {
  const { 
    monthIndex, 
    weekIndex, 
    setMonthIndex,
    setWeekIndex,
    filteredEvents, 
    setDaySelected, 
    setShowEventModal, 
    setSelectedEvent,
    isInitialLoading,
    dispatchCallEvent,
    isLoading,
    loadingOperation
  } = useContext(GlobalContext);
  
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
      {/* Week date range header */}
      <div className="week-header text-center py-2 border-bottom bg-light">
        <h3 className="mb-0 fs-6 text-muted">
          {getWeekDateRange(currentWeek)}
        </h3>
      </div>

      {/* Weekly planner grid container with horizontal scroll */}
      <div 
        className="week-grid-container flex-grow-1"
        style={{
          overflowX: isMobile ? 'auto' : 'hidden',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch', // iOS smooth scrolling
          scrollBehavior: 'smooth',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none' // IE
        }}
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
          className="week-grid"
          style={{
            minWidth: isMobile ? '700px' : '100%', // Ensure minimum width on mobile for proper day spacing
            height: '100%'
          }}
        >
          {currentWeek.map((day, dayIndex) => {
            const dayEvents = getEventsForDay(day);
            const dayHeaders = getDayHeaders('short');
            
            return (
              <div 
                key={day.format('YYYY-MM-DD')}
                className={`week-day ${getCurrentDayClass(day)} ${!isCurrentMonth(day) ? 'other-month' : ''}`}
                onClick={() => handleDayClick(day)}
                style={{
                  minWidth: isMobile ? '100px' : 'auto' // Ensure minimum width for each day on mobile
                }}
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
                          style={{ 
                            cursor: 'pointer',
                            borderRadius: '4px',
                            padding: '2px',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
                            const deleteBtn = e.currentTarget.querySelector('.quick-delete-btn');
                            if (deleteBtn) deleteBtn.style.opacity = '1';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            const deleteBtn = e.currentTarget.querySelector('.quick-delete-btn');
                            if (deleteBtn) deleteBtn.style.opacity = '0';
                          }}
                        >
                          <EventItem 
                            event={evt} 
                            compact={true}
                            showTime={!isMobile}
                            labelsMapping={PLANT_LABELS}
                          />
                          {/* Quick delete button - only show on desktop */}
                          {!isMobile && (
                            <button
                              className="quick-delete-btn btn btn-sm position-absolute"
                              style={{
                                top: '2px',
                                right: '2px',
                                padding: '2px 4px',
                                fontSize: '0.6rem',
                                lineHeight: '1',
                                opacity: '0',
                                transition: 'opacity 0.2s ease',
                                backgroundColor: 'rgba(220, 53, 69, 0.8)',
                                border: 'none',
                                borderRadius: '3px',
                                color: 'white',
                                zIndex: 10
                              }}
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
        <div className="position-fixed w-100 h-100 top-0 start-0 d-flex justify-content-center align-items-center" style={{ zIndex: 1070, backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="bg-white rounded shadow-lg p-4" style={{ maxWidth: '300px', width: '90%' }}>
            <h6 className="mb-3">Delete Event</h6>
            <p className="mb-3 text-muted">
              Delete "{eventToDelete.title || eventToDelete.toDo}"?
            </p>
            <p className="mb-4 text-muted small">This action cannot be undone.</p>
            <div className="d-flex justify-content-end gap-2">
              <button 
                type="button" 
                className="btn btn-sm btn-outline-secondary"
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
                className="btn btn-sm btn-danger"
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
      )}
    </div>
  );
};

export default WeeklyView; 