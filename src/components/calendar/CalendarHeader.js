import React, { memo } from 'react';
import { useCalendarContext } from '../../context/CalendarContext';
import { useResponsive } from '../../hooks';
import { getDayHeaders, calendarDateFromMonthIndex, capitalizeFirst } from '../../utils';
import { useTranslation } from '../../i18n/LanguageContext';

/**
 * Calendar header component that displays day names starting from Monday
 */
const CalendarHeader = memo(() => {
  const { t, language } = useTranslation();
  const dayHeaders = getDayHeaders('short');
  const { monthIndex, setMonthIndex, setCurrentView, goToToday } = useCalendarContext();
  const { isMobile } = useResponsive();

  const monthAnchor = calendarDateFromMonthIndex(monthIndex).locale(language);

  const handlePrevMonth = () => setMonthIndex(monthIndex - 1);
  const handleNextMonth = () => setMonthIndex(monthIndex + 1);

  return (
    <>
      {isMobile && (
        <div className="d-flex align-items-center justify-content-between gap-2 py-2 px-2 bg-light border-bottom">
          <button
            className="btn btn-sm btn-outline-secondary flex-shrink-0"
            onClick={() => setCurrentView('year')}
            type="button"
            title={t('layout.yearShort')}
            aria-label={t('layout.yearShort')}
          >
            {t('layout.yearShort')}
          </button>
          <div className="d-flex align-items-center justify-content-center gap-2 min-w-0">
            <button
              className="btn btn-sm btn-light flex-shrink-0"
              onClick={handlePrevMonth}
              aria-label={t('calendar.prevMonth')}
              title={t('calendar.prevMonth')}
              type="button"
            >
              <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
                chevron_left
              </span>
            </button>
            <span className="calendar-month-label calendar-month-label--month-view text-truncate">
              {capitalizeFirst(monthAnchor.format('MMMM YYYY'))}
            </span>
            <button
              className="btn btn-sm btn-light flex-shrink-0"
              onClick={handleNextMonth}
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
            onClick={() => {
              goToToday();
              setCurrentView('daily');
            }}
            type="button"
            title={t('calendar.goToToday')}
            aria-label={t('calendar.goToToday')}
          >
            {t('calendar.today')}
          </button>
        </div>
      )}
      <div className={`calendar-header-days border-bottom${isMobile ? ' calendar-header-days--month' : ' bg-light'}`}>
        {dayHeaders.map((day, index) => (
          <div
            key={index}
            className={`text-center small fw-semibold py-1${
              isMobile ? ' calendar-header-day-label' : ' text-muted'
            }`}
          >
            {day}
          </div>
        ))}
      </div>
    </>
  );
});

export default CalendarHeader; 