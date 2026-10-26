import React, { useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import Icon from '../common/Icon';
import TodoRowCalendarLike from '../common/TodoRowCalendarLike';
import { useCalendarContext } from '../../context/CalendarContext';
import { useEventContext } from '../../context/EventContext';
import { capitalizeFirst, monthIndexFromCalendarDate } from '../../utils';
import { getTodosForWeekAhead } from '../../utils/weekAheadTodos';
import { useTranslation } from '../../i18n/LanguageContext';

/**
 * Lists week-ahead + overdue TODOs after opening a weekly summary push notification.
 */
export default function WeeklySummaryTodoModal({ events, onClose }) {
  const { t, language } = useTranslation();
  const { plantsById } = useEventContext();
  const { setDaySelected, setMonthIndex, setCurrentView } = useCalendarContext();
  const { overdue, byDay } = useMemo(
    () => getTodosForWeekAhead(events),
    [events],
  );

  const dayKeys = useMemo(() => Object.keys(byDay).sort(), [byDay]);

  const totalInWeek =
    overdue.length +
    dayKeys.reduce((sum, k) => sum + (byDay[k]?.length || 0), 0);

  const openEventDay = (evt) => {
    const day = dayjs(evt.day);
    if (!day.isValid()) return;
    setDaySelected(day);
    setMonthIndex(monthIndexFromCalendarDate(day));
    setCurrentView('daily');
    onClose();
  };

  const dayLabel = (key) => {
    const day = dayjs(key, 'YYYY-MM-DD').locale(language);
    if (day.isSame(dayjs(), 'day')) return t('calendar.today');
    return capitalizeFirst(day.format('dddd, MMM D'));
  };

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="week-ahead-backdrop" onClick={onClose}>
      <div
        className="week-ahead-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="week-ahead-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="week-ahead-grabber" aria-hidden="true" />
        <div className="week-ahead-sheet-header">
          <h2 id="week-ahead-title" className="week-ahead-sheet-title">
            {t('calendar.weekAhead')}
          </h2>
          <button
            type="button"
            className="week-ahead-close"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="week-ahead-sheet-body">
      {totalInWeek === 0 ? (
        <p className="text-muted mb-0">{t('calendar.noTasksInWindow')}</p>
      ) : (
        <div className="week-ahead-sections">
          {overdue.length > 0 && (
            <section className="week-ahead-section">
              <h3 className="week-ahead-heading week-ahead-heading--overdue">{t('calendar.overdue')}</h3>
              {overdue.map((evt, idx) => (
                <TodoRowCalendarLike
                  key={evt.id || `overdue-${idx}`}
                  event={evt}
                  plantsById={plantsById || {}}
                  onOpen={openEventDay}
                />
              ))}
            </section>
          )}

          {dayKeys.map((key) => {
            const list = byDay[key];
            if (!list || list.length === 0) return null;
            return (
              <section key={key} className="week-ahead-section">
                <h3 className="week-ahead-heading">{dayLabel(key)}</h3>
                {list.map((evt, idx) => (
                  <TodoRowCalendarLike
                    key={evt.id || `${key}-${idx}`}
                    event={evt}
                    plantsById={plantsById || {}}
                    onOpen={openEventDay}
                  />
                ))}
              </section>
            );
          })}
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
