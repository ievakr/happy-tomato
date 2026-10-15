import React from 'react';
import { getDayHeaders } from '../../utils';
import { useCalendarContext } from '../../context/CalendarContext';
import { useTranslation } from '../../i18n/LanguageContext';
import CategoryFilter from './CategoryFilter';

export default function DailyDayStrip({
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
      <CategoryFilter />
      <div className="daily-strip-toolbar">
        <button
          className="btn btn-sm daily-strip-toolbar-btn"
          onClick={() => setCurrentView('month')}
          type="button"
          title={t('layout.monthView')}
          aria-label={t('layout.monthView')}
        >
          {t('layout.month')}
        </button>
        <button
          className="btn btn-sm daily-strip-toolbar-btn"
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
