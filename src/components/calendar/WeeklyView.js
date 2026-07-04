import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useCalendarContext } from '../../context/CalendarContext';
import { useEventContext } from '../../context/EventContext';
import {
  getWeekByIndex,
  getWeekDateRange,
  getDayHeaders,
  getCurrentWeekIndex,
  monthIndexFromCalendarDate,
  calendarDateFromMonthIndex,
  filterEventsForDay,
  isToday,
} from '../../utils';
import { useResponsive, useSwipeGestures, useEventDeleteConfirm, useCalendarEventActions } from '../../hooks';
import { useTranslation } from '../../i18n/LanguageContext';
import EventDeleteConfirmModal from './EventDeleteConfirmModal';
import EventItem from './EventItem';
import '../../index.css';

const WeeklyView = () => {
  const { t } = useTranslation();
  const { 
    monthIndex, 
    weekIndex, 
    setMonthIndex,
    setWeekIndex,
  } = useCalendarContext();

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
    isInitialLoading,
    plantsById
  } = useEventContext();
  
  const { isMobile } = useResponsive();
  const { handleEventClick, openEventForDay } = useCalendarEventActions();
  const [currentWeek, setCurrentWeek] = useState([]);

  const {
    eventToDelete,
    showDeleteConfirm,
    cancelDelete,
    confirmDelete,
    handleQuickDelete,
    isDeleting,
  } = useEventDeleteConfirm();

  const handleSwipeLeft = () => {
    if (isMobile) {
      handleNextWeek();
    }
  };
  
  const handleSwipeRight = () => {
    if (isMobile) {
      handlePrevWeek();
    }
  };
  
  const swipeRef = useSwipeGestures(handleSwipeLeft, handleSwipeRight, 50, 0.3);

  useEffect(() => {
    const week = getWeekByIndex(monthIndex, weekIndex);
    setCurrentWeek(week);
  }, [monthIndex, weekIndex]);

  const handleDayClick = (day) => openEventForDay(day);

  const getEventsForDay = (day) =>
    filterEventsForDay(filteredEvents, day, {
      sortMobile: isMobile,
      plantsById: plantsById || {},
    });

  const getCurrentDayClass = (day) => (isToday(day) ? 'current-day' : '');

  const weekMonthAnchor = calendarDateFromMonthIndex(monthIndex);
  const isCurrentMonth = (day) => day.isSame(weekMonthAnchor, 'month');

  if (isInitialLoading) {
    return null;
  }

  return (
    <div 
      ref={isMobile ? swipeRef : null}
      className="weekly-view flex-grow-1 d-flex flex-column"
      style={{ 
        touchAction: isMobile ? 'pan-y' : 'auto'
      }}
    >
      <div className="week-header d-flex align-items-center justify-content-center gap-1 py-2 border-bottom bg-light">
        <button
          type="button"
          className="btn btn-sm btn-light p-1"
          onClick={handlePrevWeek}
          aria-label={t('calendar.prevWeek')}
          title={t('calendar.prevWeek')}
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
          aria-label={t('calendar.nextWeek')}
          title={t('calendar.nextWeek')}
        >
          <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
            chevron_right
          </span>
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary ms-2"
          onClick={handleToday}
          aria-label={t('calendar.goToToday')}
          title={t('calendar.goToToday')}
        >
          {t('calendar.today')}
        </button>
      </div>

      <div 
        className={`week-grid-container flex-grow-1 ${isMobile ? 'week-grid-scroll' : ''}`}
      >
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
                <div className="day-header">
                  <div className="day-name text-muted small">
                    {dayHeaders[dayIndex]}
                  </div>
                  <div className={`day-number ${getCurrentDayClass(day) ? 'current' : ''}`}>
                    {day.format('D')}
                  </div>
                </div>

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
                              title={t('calendar.deleteEvent')}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-events text-muted small text-center py-2">
                      {isMobile ? '' : t('calendar.noEvents')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <EventDeleteConfirmModal
        show={showDeleteConfirm}
        event={eventToDelete}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default WeeklyView;
