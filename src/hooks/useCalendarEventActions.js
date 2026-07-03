import { useCallback } from 'react';
import { useCalendarContext } from '../context/CalendarContext';
import { useEventContext } from '../context/EventContext';

/**
 * Shared event click / open-modal handlers for calendar views.
 */
export function useCalendarEventActions({ bulkEditMode = false } = {}) {
  const { setDaySelected } = useCalendarContext();
  const {
    setShowEventModal,
    setSelectedEvent,
    toggleBulkEventSelection,
  } = useEventContext();

  const handleEventClick = useCallback(
    (evt, e, day) => {
      e.stopPropagation();
      if (bulkEditMode) {
        if (evt.id) toggleBulkEventSelection(evt.id);
        return;
      }
      setSelectedEvent(evt);
      if (day) setDaySelected(day);
      setShowEventModal(true);
    },
    [bulkEditMode, toggleBulkEventSelection, setSelectedEvent, setDaySelected, setShowEventModal]
  );

  const openEventForDay = useCallback(
    (day) => {
      setDaySelected(day);
      setSelectedEvent(null);
      setShowEventModal(true);
    },
    [setDaySelected, setSelectedEvent, setShowEventModal]
  );

  return { handleEventClick, openEventForDay };
}
