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
  const today = dayjs();

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
          const isCurrentMonth = displayYear === today.year() && m === today.month();
          const { todo, done } = countsByMonth[m] || { todo: 0, done: 0 };
          return (
            <button
              key={m}
              type="button"
              className={`year-month${isCurrentMonth ? ' year-month--current' : ''}`}
              onClick={() => selectMonth(m)}
              aria-current={isCurrentMonth ? 'date' : undefined}
            >
              <span className="year-month-name">{label}</span>
              {(todo > 0 || done > 0) && (
                <span className="year-month-counts">
                  {todo > 0 && (
                    <span
                      className="year-count year-count--todo"
                      title={t('calendar.notDoneTapToView', { count: todo })}
                    >
                      {todo}
                    </span>
                  )}
                  {done > 0 && (
                    <span
                      className="year-count year-count--done"
                      title={t('calendar.doneTapToView', { count: done })}
                    >
                      {done}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
