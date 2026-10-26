import React from 'react';
import { useEventContext } from '../../context/EventContext';
import { useTranslation } from '../../i18n/LanguageContext';
import Icon from '../common/Icon';
import CategoryFilter from './CategoryFilter';

export default function DailyDayStrip({
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
  const { t, language } = useTranslation();
  const { setShowWeeklySummaryModal } = useEventContext();

  return (
    <>
      <div className="daily-tools-row">
        <CategoryFilter />
        <button
          type="button"
          className="daily-week-ahead"
          onClick={() => setShowWeeklySummaryModal(true)}
        >
          <Icon name="calendar_month" className="daily-week-ahead-icon" />
          <span>{t('calendar.weekAhead')}</span>
        </button>
      </div>

      <div className="daily-week-header">
        <div
          ref={bindStripScrollContainer}
          className="d-flex daily-week-scroll"
          onScroll={scheduleStripScrollWork}
          onTouchMove={scheduleStripScrollWork}
          onTouchEnd={scheduleStripScrollWork}
        >
          {allDays.map((day) => {
            const dayEvents = getEventsForDay(day);
            const key = day.format('YYYY-MM-DD');
            const letter = day.locale(language).format('dd').charAt(0).toUpperCase();

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
                <div className="day-name-mini">{letter}</div>
                <div className="day-number-mini">{day.format('D')}</div>
                {dayEvents.length > 0 && (
                  <div className="daily-day-badge">{dayEvents.length}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
