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
  const { monthIndex, setMonthIndex } = useCalendarContext();
  const { isMobile } = useResponsive();

  const monthAnchor = calendarDateFromMonthIndex(monthIndex).locale(language);

  const handlePrevMonth = () => setMonthIndex(monthIndex - 1);
  const handleNextMonth = () => setMonthIndex(monthIndex + 1);

  return (
    <>
      {isMobile && (
        <div className="d-flex align-items-center justify-content-center gap-2 py-2 bg-light border-bottom">
          <button
            className="btn btn-sm btn-light"
            onClick={handlePrevMonth}
            aria-label={t('calendar.prevMonth')}
            title={t('calendar.prevMonth')}
            type="button"
          >
            <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
              chevron_left
            </span>
          </button>
          <span className="calendar-month-label">
            {capitalizeFirst(monthAnchor.format('MMMM YYYY'))}
          </span>
          <button
            className="btn btn-sm btn-light"
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
      )}
      <div className="calendar-header-days bg-light border-bottom">
        {dayHeaders.map((day, index) => (
          <div key={index} className="text-center text-muted small fw-semibold py-1">
            {day}
          </div>
        ))}
      </div>
    </>
  );
});

export default CalendarHeader; 