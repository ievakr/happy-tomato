import React from 'react';
import { getDayHeaders } from '../../utils';
import { useCalendarContext } from '../../context/CalendarContext';
import { useTranslation } from '../../i18n/LanguageContext';

export default function DailyDayStrip({
  visibleMonthLabel,
  monthIndex,
  applyMonthChange,
  jumpToToday,
  bindStripScrollContainer,
  scheduleStripScrollWork,
  allDays,
  selectedDayCalendarKey,
  getTodayClass,
  getEventsForDay,
  handleStripDayClick,
  handleStripDayTouchEnd,
  openNewEventForDay,
  registerDayElement,
}) {
  const { t } = useTranslation();
  const { setCurrentView } = useCalendarContext();
  const dayHeaders = getDayHeaders('short');

  return (
    <>
      <div className="d-flex align-items-center justify-content-between gap-2 py-2 px-2 bg-light">
        <button
          className="btn btn-sm btn-outline-secondary flex-shrink-0"
          onClick={() => setCurrentView('month')}
          type="button"
          title={t('layout.monthView')}
          aria-label={t('layout.monthView')}
        >
          {t('layout.month')}
        </button>
        <div className="d-flex align-items-center justify-content-center gap-2 min-w-0">
          <button
            className="btn btn-sm btn-light flex-shrink-0"
            onClick={() => applyMonthChange(monthIndex - 1)}
            aria-label={t('calendar.prevMonth')}
            title={t('calendar.prevMonth')}
            type="button"
          >
            <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
              chevron_left
            </span>
          </button>
          <span className="calendar-month-label text-truncate">{visibleMonthLabel}</span>
          <button
            className="btn btn-sm btn-light flex-shrink-0"
            onClick={() => applyMonthChange(monthIndex + 1)}
            aria-label={t('calendar.nextMonth')}
            title={t('calendar.nextMonth')}
            type="button"
          >
            <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
              chevron_right
            </span>
          </button>
        </div>
        <button
          className="btn btn-sm btn-outline-secondary flex-shrink-0"
          onClick={jumpToToday}
          type="button"
        >
          {t('calendar.today')}
        </button>
      </div>

      <div className="daily-week-header bg-light py-2" style={{ minHeight: '60px' }}>
        <div
          ref={bindStripScrollContainer}
          className="d-flex daily-week-scroll"
          onScroll={scheduleStripScrollWork}
          onTouchMove={scheduleStripScrollWork}
          onTouchEnd={scheduleStripScrollWork}
        >
          {allDays.map((day) => {
            const dayOfWeek = (day.day() + 6) % 7;
            const dayEvents = getEventsForDay(day);
            const key = day.format('YYYY-MM-DD');

            return (
              <div
                key={key}
                data-daily-strip-date={key}
                className={`daily-week-day text-center ${getTodayClass(day)}${
                  selectedDayCalendarKey === key ? ' selected' : ''
                }`}
                onClick={() => handleStripDayClick(day)}
                onDoubleClick={() => openNewEventForDay(day)}
                onTouchEnd={() => handleStripDayTouchEnd(day)}
                ref={(node) => registerDayElement(key, node)}
              >
                <div className="day-name-mini text-muted">{dayHeaders[dayOfWeek]}</div>
                <div className="day-number-mini fw-bold">{day.format('D')}</div>
                {dayEvents.length > 0 && (
                  <div className="events-indicator">
                    <span className="badge bg-secondary rounded-pill">{dayEvents.length}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
