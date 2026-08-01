import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useCalendarContext } from '../../context/CalendarContext';
import { useEventContext } from '../../context/EventContext';
import { useResponsive, useCalendarEventActions } from '../../hooks';
import { filterEventsForDay, isToday } from '../../utils/eventDates';
import { isTodoEvent, isCompletedTodoAction } from '../../utils/recurringTodos';
import { useTranslation } from '../../i18n/LanguageContext';
import CalendarEventChip from './CalendarEventChip';
import '../../index.css';

export default function CalendarDay({ day }) {
  const { t } = useTranslation();
  const { setDaySelected, setCurrentView, monthIndex } = useCalendarContext();
  const { filteredEvents, plantsById } = useEventContext();
  const { isMobile } = useResponsive();
  const { handleEventClick, openEventForDay } = useCalendarEventActions();
  const [dayEvents, setDayEvents] = useState([]);

  const monthAnchor = dayjs(new Date(dayjs().year(), monthIndex, 1));
  const isCurrentMonth = day.isSame(monthAnchor, 'month');
  const today = isToday(day);

  useEffect(() => {
    setDayEvents(filterEventsForDay(filteredEvents, day));
  }, [filteredEvents, day]);

  const handleDayClick = () => {
    setDaySelected(day);

    if (isMobile) {
      setCurrentView('daily');
    } else {
      openEventForDay(day);
    }
  };

  // Mobile: count circles sit under the day number (Uber-style price slot).
  const renderMobileEventCount = () => {
    if (!isCurrentMonth) return null;

    const pendingCount = dayEvents.filter((evt) => isTodoEvent(evt)).length;
    const doneCount = dayEvents.filter((evt) => isCompletedTodoAction(evt)).length;

    if (pendingCount === 0 && doneCount === 0) {
      return <div className="month-day-meta" aria-hidden />;
    }

    return (
      <div className="month-day-meta d-flex justify-content-center align-items-center gap-1">
        {pendingCount > 0 && (
          <div
            className="month-day-count bg-danger text-white"
            title={t('calendar.notDoneTapToView', { count: pendingCount })}
          >
            {pendingCount}
          </div>
        )}
        {doneCount > 0 && (
          <div
            className="month-day-count bg-success text-white"
            title={t('calendar.doneTapToView', { count: doneCount })}
          >
            {doneCount}
          </div>
        )}
      </div>
    );
  };

  const renderDesktopEvents = () => {
    return (
      <>
        {dayEvents.map((evt, idx) => (
          <CalendarEventChip
            key={evt.id || idx}
            event={evt}
            plantsById={plantsById}
            onClick={(e) => handleEventClick(evt, e, day)}
          />
        ))}
      </>
    );
  };

  if (isMobile) {
    return (
      <button
        type="button"
        className={`month-day${isCurrentMonth ? '' : ' month-day--muted'}${
          today ? ' month-day--today' : ''
        }`}
        onClick={handleDayClick}
        aria-label={day.format('D MMMM YYYY')}
      >
        <span className={`month-day-number${today ? ' month-day-number--today' : ''}`}>
          {day.format('D')}
        </span>
        {renderMobileEventCount()}
      </button>
    );
  }

  return (
    <div
      className={`day-cell border border-secondary d-flex flex-column cursor-pointer ${
        isCurrentMonth ? '' : 'day-cell--other'
      }`}
      onClick={handleDayClick}
    >
      <header className="d-flex flex-column align-items-center flex-shrink-0 py-1">
        <div
          className={`day-number text-center ${today ? 'day-number-current' : ''} ${
            !isCurrentMonth ? 'text-muted' : ''
          }`}
        >
          {day.format('DD')}
        </div>
      </header>
      <div
        className="day-cell-body flex-grow-1 position-relative"
        style={{
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {renderDesktopEvents()}
      </div>
    </div>
  );
}
