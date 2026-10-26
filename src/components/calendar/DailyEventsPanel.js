import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EventItem, { eventTodoOrTitleText } from './EventItem';
import MobileDailyEventRow from './MobileDailyEventRow';
import { filterEventsForDay, isToday } from '../../utils/eventDates';
import { capitalizeFirst } from '../../utils';
import { useTranslation } from '../../i18n/LanguageContext';
import DailySkyChips from './DailySkyChips';

export default function DailyEventsPanel({
  currentDay,
  isMobile,
  filteredEvents,
  plantsById,
  bulkEditMode,
  setBulkEditMode,
  bulkSelectedEventIds,
  setBulkSelectedEventIds,
  toggleBulkEventSelection,
  supportsDayViewCompleteToggle,
  renderDayTodoCompleteButton,
  handleEventClick,
  onRequestDeleteConfirm,
  handleQuickDelete,
  isLoading,
  onAddEvent,
  onOpenBulkMove,
  onOpenBulkDelete,
}) {
  const { t, language } = useTranslation();
  const selectAllCheckboxRef = useRef(null);

  const dayEvents = useMemo(() => {
    return filterEventsForDay(filteredEvents, currentDay, {
      sortMobile: isMobile,
      plantsById: plantsById || {},
    });
  }, [filteredEvents, currentDay, isMobile, plantsById]);

  const dayEventIds = useMemo(() => dayEvents.map((e) => e.id).filter(Boolean), [dayEvents]);
  const selectedOnDayCount = dayEventIds.filter((id) => bulkSelectedEventIds.includes(id)).length;
  const doneCount = dayEvents.filter((evt) => evt.completed).length;
  const progress = dayEvents.length ? Math.round((doneCount / dayEvents.length) * 100) : 0;
  const dateLabel = capitalizeFirst(currentDay.locale(language).format('dddd, MMMM D'));

  useEffect(() => {
    const el = selectAllCheckboxRef.current;
    if (!el || !bulkEditMode) return;
    const n = dayEventIds.filter((id) => bulkSelectedEventIds.includes(id)).length;
    el.indeterminate = n > 0 && n < dayEventIds.length;
  }, [bulkEditMode, dayEventIds, bulkSelectedEventIds]);

  const toggleSelectAllDay = useCallback(() => {
    if (dayEventIds.length === 0) return;
    const allSelected = dayEventIds.every((id) => bulkSelectedEventIds.includes(id));
    if (allSelected) {
      setBulkSelectedEventIds((prev) => prev.filter((id) => !dayEventIds.includes(id)));
    } else {
      setBulkSelectedEventIds((prev) => [...new Set([...prev, ...dayEventIds])]);
    }
  }, [dayEventIds, bulkSelectedEventIds, setBulkSelectedEventIds]);

  return (
    <div
      className="selected-day-info flex-grow-1 p-3 d-flex flex-column"
      style={{
        touchAction: isMobile ? 'pan-y' : 'auto',
        overflow: 'hidden',
        minHeight: 0,
      }}
    >
      <div className="daily-day-heading">
        {isToday(currentDay) && <div className="daily-today-kicker">{t('calendar.today')}</div>}
        <h2 className="daily-day-title">{dateLabel}</h2>
        <DailySkyChips day={currentDay} />
      </div>

      {dayEvents.length > 0 && (
        <div className="daily-progress">
          <div className="daily-progress-track">
            <div className="daily-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="daily-progress-count">
            {doneCount}/{dayEvents.length}
          </span>
        </div>
      )}

      <div
        className={`daily-events flex-grow-1${dayEvents.length === 0 ? ' daily-events--empty' : ''}`}
        style={{
          overflowY: 'auto',
          minHeight: 0,
        }}
      >
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <h6 className="mb-0 daily-todos-heading">{t('calendar.todosCount', { count: dayEvents.length })}</h6>
          {dayEvents.length > 0 && (
            <div className="d-flex align-items-center flex-wrap gap-2">
              {!isMobile && bulkEditMode && (
                <>
                  <div className="form-check d-flex align-items-center mb-0">
                    <input
                      ref={isMobile ? undefined : selectAllCheckboxRef}
                      type="checkbox"
                      className="form-check-input bulk-edit-day-checkbox me-2"
                      id="daily-bulk-select-all-desktop"
                      checked={dayEventIds.length > 0 && selectedOnDayCount === dayEventIds.length}
                      onChange={toggleSelectAllDay}
                    />
                    <label className="form-check-label small mb-0" htmlFor="daily-bulk-select-all-desktop">
                      {t('calendar.selectAll')}
                    </label>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-success"
                    disabled={selectedOnDayCount === 0}
                    onClick={onOpenBulkMove}
                  >
                    {t('calendar.move')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    disabled={selectedOnDayCount === 0}
                    onClick={onOpenBulkDelete}
                  >
                    {t('common.delete')}
                  </button>
                </>
              )}
              <button
                type="button"
                className="daily-bulk-edit"
                onClick={() => setBulkEditMode(!bulkEditMode)}
              >
                {bulkEditMode ? (isMobile ? t('calendar.done') : t('common.cancel')) : t('calendar.bulkEdit')}
              </button>
            </div>
          )}
        </div>
        {isMobile && bulkEditMode && dayEvents.length > 0 && (
          <div className="daily-bulk-bar">
            <label className="daily-bulk-select" htmlFor="daily-bulk-select-all">
              <input
                ref={selectAllCheckboxRef}
                type="checkbox"
                className="daily-bulk-check"
                id="daily-bulk-select-all"
                checked={dayEventIds.length > 0 && selectedOnDayCount === dayEventIds.length}
                onChange={toggleSelectAllDay}
              />
              <span>{t('calendar.selectAll')}</span>
            </label>
            <span className="daily-bulk-count">{selectedOnDayCount}</span>
            <div className="daily-bulk-actions">
              <button
                type="button"
                className="daily-bulk-move"
                disabled={selectedOnDayCount === 0 || isLoading}
                onClick={onOpenBulkMove}
              >
                {t('calendar.move')}
              </button>
              <button
                type="button"
                className="daily-bulk-delete"
                disabled={selectedOnDayCount === 0}
                onClick={onOpenBulkDelete}
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        )}
        {dayEvents.length === 0 ? (
          <div className="daily-empty">
            <span className="material-icons-outlined daily-empty-icon" aria-hidden>
              calendar_month
            </span>
            <p>{t('calendar.noTodosForDay')}</p>
          </div>
        ) : (
          <div className="events-list">
            {dayEvents.map((evt, idx) => {
              if (isMobile) {
                return (
                  <MobileDailyEventRow
                    key={evt.id || idx}
                    evt={evt}
                    bulkEditMode={bulkEditMode}
                    bulkSelectedEventIds={bulkSelectedEventIds}
                    plantsById={plantsById}
                    toggleBulkEventSelection={toggleBulkEventSelection}
                    supportsDayViewCompleteToggle={supportsDayViewCompleteToggle}
                    renderDayTodoCompleteButton={renderDayTodoCompleteButton}
                    handleEventClick={handleEventClick}
                    onRequestDeleteConfirm={onRequestDeleteConfirm}
                    deleteDisabled={isLoading}
                  />
                );
              }

              const isDone = !!evt.completed;

              return (
                <div key={evt.id || idx} className="d-flex align-items-start gap-2 mb-2">
                  {bulkEditMode && (
                    <input
                      type="checkbox"
                      className="form-check-input bulk-edit-day-checkbox flex-shrink-0 mt-2"
                      checked={evt.id ? bulkSelectedEventIds.includes(evt.id) : false}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => evt.id && toggleBulkEventSelection(evt.id)}
                      aria-label={t('calendar.selectEventAria', { name: eventTodoOrTitleText(evt) || t('calendar.eventFallback') })}
                    />
                  )}
                  {!bulkEditMode &&
                    supportsDayViewCompleteToggle(evt) &&
                    renderDayTodoCompleteButton(evt, 'align-self-center')}
                  <div
                    className={`event-item-daily flex-grow-1 p-2 border rounded position-relative min-w-0 ${isDone ? 'event-item-daily-completed' : ''} ${bulkEditMode && evt.id && bulkSelectedEventIds.includes(evt.id) ? 'border-success border-2' : ''}`}
                    onClick={(e) => handleEventClick(evt, e)}
                    role={bulkEditMode ? 'button' : undefined}
                  >
                    <EventItem
                      event={evt}
                      compact={false}
                      showTime={true}
                      plantsById={plantsById || {}}
                      showAllIcons={true}
                      hideLeadingCompleteIcon
                    />
                    {!bulkEditMode && (
                      <button
                        className="quick-delete-btn btn btn-sm btn-danger position-absolute"
                        onClick={(e) => handleQuickDelete(evt, e)}
                        title={t('calendar.deleteEvent')}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="daily-view-footer-actions">
        <button className="btn btn-danger w-100 daily-add-btn" onClick={onAddEvent}>
          <span className="material-icons-outlined" aria-hidden>add</span>
          {t('calendar.addEvent')}
        </button>
      </div>
    </div>
  );
}

export function useDailyBulkEditState(currentDay) {
  const [showBulkMoveModal, setShowBulkMoveModal] = useState(false);
  const [bulkMoveDate, setBulkMoveDate] = useState(() => new Date());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const openBulkMoveModal = useCallback(
    (bulkSelectedEventIds) => {
      if (bulkSelectedEventIds.length === 0) return;
      setBulkMoveDate(currentDay.toDate());
      setShowBulkMoveModal(true);
    },
    [currentDay]
  );

  return {
    showBulkMoveModal,
    setShowBulkMoveModal,
    bulkMoveDate,
    setBulkMoveDate,
    showBulkDeleteConfirm,
    setShowBulkDeleteConfirm,
    openBulkMoveModal,
  };
}
