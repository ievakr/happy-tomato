import React, { memo } from 'react';
import { useCalendarContext } from '../../context/CalendarContext';
import { useResponsive } from '../../hooks';
import { getDayHeaders } from '../../utils';
import { useTranslation } from '../../i18n/LanguageContext';

/**
 * Calendar header component that displays day names starting from Monday
 */
const CalendarHeader = memo(() => {
  const { t } = useTranslation();
  const dayHeaders = getDayHeaders('short');
  const { setCurrentView, goToToday } = useCalendarContext();
  const { isMobile } = useResponsive();

  return (
    <>
      {isMobile && (
        <div className="daily-strip-toolbar">
          <button
            className="btn btn-sm daily-strip-toolbar-btn"
            onClick={() => setCurrentView('year')}
            type="button"
            title={t('layout.yearShort')}
            aria-label={t('layout.yearShort')}
          >
            {t('layout.yearShort')}
          </button>
          <button
            className="btn btn-sm daily-strip-toolbar-btn"
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