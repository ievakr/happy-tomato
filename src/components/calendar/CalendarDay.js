import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useCalendarContext } from '../../context/CalendarContext';
import { useEventContext } from '../../context/EventContext';
import { useResponsive, useCalendarEventActions } from '../../hooks';
import { filterEventsForDay, isToday } from '../../utils/eventDates';
import Icon from '../common/Icon';
import CalendarEventChip from './CalendarEventChip';
import { eventActionText } from './EventItem';
import '../../index.css';

export default function CalendarDay({ day }) {
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

  const renderMobileEvents = () => {
    if (dayEvents.length === 0) return null;

    const visible = dayEvents.slice(0, 2);
    const extra = dayEvents.length - visible.length;

    return (
      <div className="month-day-events">
        {visible.map((evt, idx) => {
          const label = evt.labels?.[0];
          const plant = label ? plantsById?.[label] : null;
          const text = eventActionText(evt);
          const done = !!evt.completed;
          return (
            <span
              key={evt.id || idx}
              className={`month-event-chip${done ? ' month-event-chip--done' : ''}`}
              title={text}
            >
              <Icon plantIcon={plant?.icon || 'leaf'} className="month-event-chip-icon" />
              <span className="month-event-chip-text">{text}</span>
            </span>
          );
        })}
        {extra > 0 && (
          <span
            className={`month-event-more${
              dayEvents.slice(2).some((evt) => !evt.completed) ? '' : ' month-event-more--done'
            }`}
          >
            +{extra}
          </span>
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
        <span className="month-day-number">
          {day.format('D')}
        </span>
        {renderMobileEvents()}
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
