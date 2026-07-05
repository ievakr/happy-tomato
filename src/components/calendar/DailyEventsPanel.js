import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EventItem, { eventTodoOrTitleText } from './EventItem';
import MobileDailyEventRow from './MobileDailyEventRow';
import { filterEventsForDay, isToday } from '../../utils/eventDates';
import { capitalizeFirst } from '../../utils';
import { useTranslation } from '../../i18n/LanguageContext';

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
      <div className="mb-3">
        <h5 className="mb-1">{capitalizeFirst(currentDay.locale(language).format('dddd, MMMM D, YYYY'))}</h5>
        {isToday(currentDay) && <small className="text-muted">{t('calendar.today')}</small>}
      </div>

      <div
        className="daily-events flex-grow-1"
        style={{
          overflowY: 'auto',
          minHeight: 0,
        }}
      >
        {dayEvents.length === 0 ? (
          <div className="no-events text-center py-5">
            <div className="text-muted mb-3">
              <span className="material-icons-outlined" style={{ fontSize: '3rem' }}>
                event_available
              </span>
            </div>
            <p className="text-muted">{t('calendar.noTodosForDay')}</p>
          </div>
        ) : (
          <div className="events-list">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
              <h6 className="mb-0">{t('calendar.todosCount', { count: dayEvents.length })}</h6>
              <div className="d-flex align-items-center flex-wrap gap-2">
                {bulkEditMode && (
                  <>
                    <div className="form-check d-flex align-items-center mb-0">
                      <input
                        ref={selectAllCheckboxRef}
                        type="checkbox"
                        className="form-check-input bulk-edit-day-checkbox me-2"
                        id="daily-bulk-select-all"
                        checked={
                          dayEventIds.length > 0 &&
                          dayEventIds.every((id) => bulkSelectedEventIds.includes(id))
                        }
                        onChange={toggleSelectAllDay}
                      />
                      <label className="form-check-label small mb-0" htmlFor="daily-bulk-select-all">
                        {t('calendar.selectAll')}
                      </label>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-success"
                      disabled={bulkSelectedEventIds.length === 0}
                      onClick={onOpenBulkMove}
                    >
                      {t('calendar.move')}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      disabled={bulkSelectedEventIds.length === 0}
                      onClick={onOpenBulkDelete}
                    >
                      {t('common.delete')}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setBulkEditMode(!bulkEditMode)}
                >
                  {bulkEditMode ? t('common.cancel') : t('calendar.bulkEdit')}
                </button>
              </div>
            </div>
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

      <div className="mt-3 pt-3 border-top daily-view-footer-actions">
        <button className="btn btn-danger w-100" onClick={onAddEvent}>
          <span className="material-icons-outlined me-2" style={{ fontSize: '1rem' }}>
            add
          </span>
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
