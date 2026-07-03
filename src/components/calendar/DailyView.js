import React from 'react';
import dayjs from 'dayjs';
import { useCalendarContext } from '../../context/CalendarContext';
import { useEventContext } from '../../context/EventContext';
import { useToast } from '../../context/ToastContext';
import { useResponsive, useRecurringActions, useEventDeleteConfirm, useDailyDayStrip, useCalendarEventActions } from '../../hooks';
import DailyDayStrip from './DailyDayStrip';
import DailyEventsPanel, { useDailyBulkEditState } from './DailyEventsPanel';
import DailyBulkEditModals from './DailyBulkEditModals';
import EventDeleteConfirmModal from './EventDeleteConfirmModal';
import '../../index.css';

const DailyView = () => {
  const { showError } = useToast();
  const { daySelected, setDaySelected, monthIndex, setMonthIndex } = useCalendarContext();
  const {
    filteredEvents,
    isInitialLoading,
    isLoading,
    plantsById,
    bulkEditMode,
    setBulkEditMode,
    bulkSelectedEventIds,
    setBulkSelectedEventIds,
    toggleBulkEventSelection,
  } = useEventContext();
  const {
    completeTodo,
    uncompleteTodo,
    supportsDayViewCompleteToggle,
  } = useRecurringActions();

  const { isMobile } = useResponsive();
  const { handleEventClick, openEventForDay } = useCalendarEventActions({ bulkEditMode });

  const currentDay = daySelected || dayjs();

  const strip = useDailyDayStrip({
    daySelected,
    setDaySelected,
    monthIndex,
    setMonthIndex,
    isMobile,
    isInitialLoading,
    filteredEvents,
    openNewEventForDay: openEventForDay,
  });

  const {
    eventToDelete,
    showDeleteConfirm,
    requestDeleteConfirm,
    cancelDelete,
    confirmDelete,
    handleQuickDelete,
    isDeleting,
  } = useEventDeleteConfirm();

  const {
    showBulkMoveModal,
    setShowBulkMoveModal,
    bulkMoveDate,
    setBulkMoveDate,
    showBulkDeleteConfirm,
    setShowBulkDeleteConfirm,
    openBulkMoveModal,
  } = useDailyBulkEditState(currentDay);

  const handleDayViewToggleComplete = async (evt, e) => {
    e.stopPropagation();
    if (!evt?.id || bulkEditMode) return;
    try {
      if (evt.completed) {
        await uncompleteTodo(evt);
      } else {
        await completeTodo(evt);
      }
    } catch {
      showError(evt.completed ? 'Could not restore to-do.' : 'Could not mark complete.');
    }
  };

  const renderDayTodoCompleteButton = (evt, extraClassName = '') => (
    <button
      type="button"
      className={`daily-todo-complete-circle flex-shrink-0 ${evt.completed ? 'daily-todo-complete-circle--done' : ''} ${extraClassName}`.trim()}
      onClick={(e) => handleDayViewToggleComplete(evt, e)}
      disabled={isLoading}
      aria-label={evt.completed ? 'Mark as to-do' : 'Mark complete'}
      aria-pressed={!!evt.completed}
    >
      {evt.completed && (
        <span className="material-icons-outlined daily-todo-complete-circle__check" aria-hidden>
          check
        </span>
      )}
    </button>
  );

  if (isInitialLoading) {
    return null;
  }

  return (
    <div className="daily-view flex-grow-1 d-flex flex-column">
      {isMobile && (
        <DailyDayStrip
          {...strip}
          openNewEventForDay={openEventForDay}
        />
      )}

      <DailyEventsPanel
        currentDay={currentDay}
        isMobile={isMobile}
        filteredEvents={filteredEvents}
        plantsById={plantsById}
        bulkEditMode={bulkEditMode}
        setBulkEditMode={setBulkEditMode}
        bulkSelectedEventIds={bulkSelectedEventIds}
        setBulkSelectedEventIds={setBulkSelectedEventIds}
        toggleBulkEventSelection={toggleBulkEventSelection}
        supportsDayViewCompleteToggle={supportsDayViewCompleteToggle}
        renderDayTodoCompleteButton={renderDayTodoCompleteButton}
        handleEventClick={handleEventClick}
        onRequestDeleteConfirm={requestDeleteConfirm}
        handleQuickDelete={handleQuickDelete}
        isLoading={isLoading}
        onAddEvent={() => openEventForDay(currentDay)}
        onOpenBulkMove={() => openBulkMoveModal(bulkSelectedEventIds)}
        onOpenBulkDelete={() => setShowBulkDeleteConfirm(true)}
      />

      <EventDeleteConfirmModal
        show={showDeleteConfirm}
        event={eventToDelete}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isLoading={isDeleting}
      />

      <DailyBulkEditModals
        showBulkMoveModal={showBulkMoveModal}
        setShowBulkMoveModal={setShowBulkMoveModal}
        bulkMoveDate={bulkMoveDate}
        setBulkMoveDate={setBulkMoveDate}
        showBulkDeleteConfirm={showBulkDeleteConfirm}
        setShowBulkDeleteConfirm={setShowBulkDeleteConfirm}
        bulkSelectedEventIds={bulkSelectedEventIds}
        setBulkEditMode={setBulkEditMode}
      />
    </div>
  );
};

export default DailyView;
