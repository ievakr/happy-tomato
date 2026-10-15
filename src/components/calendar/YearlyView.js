import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { useCalendarContext } from '../../context/CalendarContext';
import { useEventContext } from '../../context/EventContext';
import { useResponsive } from '../../hooks';
import { calendarDateFromMonthIndex, calendarNavRefYear } from '../../utils';
import { isTodoEvent, isCompletedTodoAction } from '../../utils/recurringTodos';
import { useTranslation } from '../../i18n/LanguageContext';

const MONTHS_0_11 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

/**
 * Mobile year picker: 12 month cards. Counts under each name split open to-dos
 * (red) and completed ones (green). Picking a month returns to month view.
 */
export default function YearlyView() {
  const { t, language } = useTranslation();
  const { monthIndex, setMonthIndex, setCurrentView } = useCalendarContext();
  const { filteredEvents, isInitialLoading } = useEventContext();
  const { isMobile } = useResponsive();

  const refYear = calendarNavRefYear();
  const yearAnchor = calendarDateFromMonthIndex(monthIndex);
  const displayYear = yearAnchor.year();
  const selectedMonth = yearAnchor.month();

  const countsByMonth = useMemo(() => {
    const counts = {};
    (filteredEvents || []).forEach((evt) => {
      const d = dayjs(evt.day);
      if (!d.isValid() || d.year() !== displayYear) return;
      const bucket = counts[d.month()] || { todo: 0, done: 0 };
      if (isTodoEvent(evt)) bucket.todo += 1;
      if (isCompletedTodoAction(evt)) bucket.done += 1;
      counts[d.month()] = bucket;
    });
    return counts;
  }, [filteredEvents, displayYear]);

  const selectMonth = (month0to11) => {
    const nextIndex = (displayYear - refYear) * 12 + month0to11;
    setMonthIndex(nextIndex);
    setCurrentView('month');
  };

  if (!isMobile || isInitialLoading) {
    return null;
  }

  return (
    <div className="yearly-view flex-grow-1" role="navigation" aria-label={t('calendar.yearViewLabel')}>
      <div className="yearly-view-grid">
        {MONTHS_0_11.map((m) => {
          const label = dayjs(new Date(displayYear, m, 1)).locale(language).format('MMM');
          const current = m === selectedMonth;
          const { todo, done } = countsByMonth[m] || { todo: 0, done: 0 };
          return (
            <button
              key={m}
              type="button"
              className={`year-month${current ? ' year-month--current' : ''}`}
              onClick={() => selectMonth(m)}
              aria-current={current ? 'date' : undefined}
            >
              <span className="year-month-name">{label}</span>
              <span className="year-month-counts">
                {todo > 0 && (
                  <span
                    className="month-day-count bg-danger text-white"
                    title={t('calendar.notDoneTapToView', { count: todo })}
                  >
                    {todo}
                  </span>
                )}
                {done > 0 && (
                  <span
                    className="month-day-count bg-success text-white"
                    title={t('calendar.doneTapToView', { count: done })}
                  >
                    {done}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
