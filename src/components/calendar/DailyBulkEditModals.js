import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { ConfirmModal, Modal } from '../common';
import Icon from '../common/Icon';
import { EVENT_ACTIONS } from '../../constants';
import { useToast } from '../../context/ToastContext';
import { useEventContext } from '../../context/EventContext';
import { useRecurringActions } from '../../hooks';
import { capitalizeFirst } from '../../utils';
import { useTranslation } from '../../i18n/LanguageContext';

function monthCells(monthAnchor) {
  const start = monthAnchor.startOf('month');
  const offset = (start.day() + 6) % 7;
  const count = Math.ceil((offset + monthAnchor.daysInMonth()) / 7) * 7;
  const first = start.subtract(offset, 'day');
  return Array.from({ length: count }, (_, i) => first.add(i, 'day'));
}

export default function DailyBulkEditModals({
  showBulkMoveModal,
  setShowBulkMoveModal,
  bulkMoveDate,
  setBulkMoveDate,
  showBulkDeleteConfirm,
  setShowBulkDeleteConfirm,
  bulkSelectedEventIds,
  setBulkEditMode,
}) {
  const { t, language } = useTranslation();
  const { showError } = useToast();
  const { filteredEvents, dispatchCallEvent, dispatchBulkCallEvents, isLoading, loadingOperation } =
    useEventContext();
  const { deleteRecurringTodosForEvent } = useRecurringActions();
  const selected = dayjs(bulkMoveDate);
  const [monthCursor, setMonthCursor] = useState(() => selected.startOf('month'));

  useEffect(() => {
    if (showBulkMoveModal) {
      setMonthCursor(dayjs(bulkMoveDate).startOf('month'));
    }
  }, [showBulkMoveModal, bulkMoveDate]);

  const weekLetters = useMemo(
    () => Array.from({ length: 7 }, (_, i) =>
      dayjs('2024-01-01').locale(language).add(i, 'day').format('dd').charAt(0).toUpperCase(),
    ),
    [language],
  );
  const days = useMemo(() => monthCells(monthCursor), [monthCursor]);
  const selectedCount = bulkSelectedEventIds.length;

  const selectDay = (day) => {
    setBulkMoveDate(day.toDate());
    if (!day.isSame(monthCursor, 'month')) setMonthCursor(day.startOf('month'));
  };

  const jumpToToday = () => {
    const today = dayjs();
    setBulkMoveDate(today.toDate());
    setMonthCursor(today.startOf('month'));
  };

  const confirmBulkMove = async () => {
    const dayMs = dayjs(bulkMoveDate).startOf('day').valueOf();
    try {
      const operations = bulkSelectedEventIds
        .map((id) => filteredEvents.find((e) => e.id === id))
        .filter(Boolean)
        .map((evt) => ({
          type: EVENT_ACTIONS.UPDATE,
          payload: { ...evt, day: dayMs },
        }));

      await dispatchBulkCallEvents(operations);
      setShowBulkMoveModal(false);
      setBulkEditMode(false);
    } catch {
      showError(t('calendar.moveFailed'));
    }
  };

  const confirmBulkDelete = async () => {
    try {
      for (const id of bulkSelectedEventIds) {
        const evt = filteredEvents.find((e) => e.id === id);
        if (!evt) continue;
        if (evt.isRecurringTodo) {
          await dispatchCallEvent({ type: EVENT_ACTIONS.DELETE, payload: evt });
        } else {
          if (evt.actions && evt.actions.length > 0) {
            try {
              await deleteRecurringTodosForEvent(evt.id, evt.actions[0], evt.labels);
            } catch {
              // Proceed with main delete
            }
          }
          await dispatchCallEvent({ type: EVENT_ACTIONS.DELETE, payload: evt });
        }
      }
      setShowBulkDeleteConfirm(false);
      setBulkEditMode(false);
    } catch {
      showError(t('calendar.deleteFailed'));
    }
  };

  return (
    <>
      {showBulkMoveModal && (
        <Modal
          className="bulk-move-modal"
          title={t('calendar.move')}
          onClose={() => setShowBulkMoveModal(false)}
        >
          <p className="bulk-move-count">
            {t(
              selectedCount === 1
                ? 'calendar.moveTodoCountSingular'
                : 'calendar.moveTodoCountPlural',
              { count: selectedCount },
            )}
          </p>
          <p className="bulk-move-label">{t('calendar.moveTo')}</p>
          <div className="bulk-move-calendar">
            <div className="bulk-move-month">
              <button
                type="button"
                className="bulk-move-chevron"
                onClick={() => setMonthCursor((current) => current.subtract(1, 'month'))}
                aria-label={t('layout.previousMonth')}
              >
                <Icon name="chevron_left" />
              </button>
              <span>{capitalizeFirst(monthCursor.locale(language).format('MMMM YYYY'))}</span>
              <button
                type="button"
                className="bulk-move-chevron"
                onClick={() => setMonthCursor((current) => current.add(1, 'month'))}
                aria-label={t('layout.nextMonth')}
              >
                <Icon name="chevron_right" />
              </button>
            </div>
            <div className="bulk-move-weekdays">
              {weekLetters.map((letter, index) => (
                <span key={`${letter}-${index}`}>{letter}</span>
              ))}
            </div>
            <div className="bulk-move-grid">
              {days.map((day) => {
                const key = day.format('YYYY-MM-DD');
                const isSelected = day.isSame(selected, 'day');
                const inMonth = day.isSame(monthCursor, 'month');
                return (
                  <button
                    key={key}
                    type="button"
                    className={`bulk-move-day${isSelected ? ' is-selected' : ''}${inMonth ? '' : ' is-outside'}`}
                    onClick={() => selectDay(day)}
                  >
                    {day.date()}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="bulk-move-selected-row">
            <span>{capitalizeFirst(selected.locale(language).format('dddd, MMMM D'))}</span>
            <button type="button" className="bulk-move-today" onClick={jumpToToday}>
              {t('calendar.today')}
            </button>
          </div>
          <button
            type="button"
            className="bulk-move-confirm"
            onClick={confirmBulkMove}
            disabled={isLoading}
          >
            {isLoading && loadingOperation === 'update' ? t('calendar.moving') : t('calendar.move')}
          </button>
        </Modal>
      )}

      {showBulkDeleteConfirm && (
        <ConfirmModal
          title={t('calendar.deleteEventsTitle')}
          message={
            <p className="mb-0">
              {t(
                bulkSelectedEventIds.length !== 1
                  ? 'calendar.deleteEventsConfirmPlural'
                  : 'calendar.deleteEventsConfirmSingular',
                { count: bulkSelectedEventIds.length },
              )}
            </p>
          }
          confirmLabel={t('calendar.deleteAll')}
          variant="danger"
          onConfirm={confirmBulkDelete}
          onCancel={() => setShowBulkDeleteConfirm(false)}
          isLoading={isLoading && loadingOperation === 'delete'}
          zIndex={1060}
        />
      )}
    </>
  );
}
