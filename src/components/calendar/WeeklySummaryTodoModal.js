import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import Modal from '../common/Modal';
import TodoRowCalendarLike from '../common/TodoRowCalendarLike';
import { useEventContext } from '../../context/EventContext';
import { getTodosForWeekAhead } from '../../utils/weekAheadTodos';
import { useTranslation } from '../../i18n/LanguageContext';

/**
 * Lists week-ahead + overdue TODOs after opening a weekly summary push notification.
 */
export default function WeeklySummaryTodoModal({ events, onClose }) {
  const { t } = useTranslation();
  const { plantsById } = useEventContext();
  const { overdue, byDay, weekStart, weekEnd } = useMemo(
    () => getTodosForWeekAhead(events),
    [events],
  );

  const dayKeys = useMemo(() => Object.keys(byDay).sort(), [byDay]);

  const totalInWeek =
    overdue.length +
    dayKeys.reduce((sum, k) => sum + (byDay[k]?.length || 0), 0);

  return (
    <Modal
      title={t('calendar.weekAhead')}
      icon="calendar_view_week"
      size="lg"
      scrollable
      onClose={onClose}
      footer={
        <button type="button" className="btn btn-primary w-100" onClick={onClose}>
          {t('common.close')}
        </button>
      }
    >
      <p className="text-muted small mb-3">
        {weekStart.format('MMM D')} – {weekEnd.format('MMM D, YYYY')}
        {totalInWeek > 0
          ? ` · ${t(
              totalInWeek !== 1
                ? 'calendar.weekTasksCountPlural'
                : 'calendar.weekTasksCountSingular',
              { count: totalInWeek },
            )}`
          : ''}
      </p>

      {totalInWeek === 0 ? (
        <p className="text-muted mb-0">{t('calendar.noTasksInWindow')}</p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {overdue.length > 0 && (
            <div>
              <div className="fw-semibold text-danger small mb-2">{t('calendar.overdue')}</div>
              <ul className="list-unstyled list-group list-group-flush border rounded small">
                {overdue.map((evt, idx) => (
                  <li key={evt.id || `overdue-${idx}`} className="list-group-item py-2">
                    <TodoRowCalendarLike event={evt} plantsById={plantsById || {}} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {dayKeys.map((key) => {
            const list = byDay[key];
            if (!list || list.length === 0) return null;
            const label = dayjs(key, 'YYYY-MM-DD').format('dddd, MMM D');
            return (
              <div key={key}>
                <div className="fw-semibold small mb-2 text-secondary">{label}</div>
                <ul className="list-unstyled list-group list-group-flush border rounded small">
                  {list.map((evt, idx) => (
                    <li key={evt.id || `${key}-${idx}`} className="list-group-item py-2">
                      <TodoRowCalendarLike event={evt} plantsById={plantsById || {}} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
