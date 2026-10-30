import { useCallback, useMemo, useState } from 'react';
import { useEventContext } from '../context/EventContext';
import { EVENT_ACTIONS } from '../constants';
import { getUserRecurringSeriesForEvent } from '../utils/recurringTodos';

const EMPTY_SERIES = [];

/**
 * Shared delete-confirmation flow for calendar views.
 */
export function useEventDeleteConfirm() {
  const { dispatchCallEvent, dispatchBulkCallEvents, filteredEvents, isLoading, loadingOperation } =
    useEventContext();
  const [eventToDelete, setEventToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const requestDeleteConfirm = useCallback((evt) => {
    setEventToDelete(evt);
    setShowDeleteConfirm(true);
  }, []);

  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    setEventToDelete(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!eventToDelete) return;
    try {
      await dispatchCallEvent({ type: EVENT_ACTIONS.DELETE, payload: eventToDelete });
      cancelDelete();
    } catch {
      // Toast already shown by dispatchCallEvent
    }
  }, [eventToDelete, dispatchCallEvent, cancelDelete]);

  const seriesEvents = useMemo(() => {
    if (!eventToDelete || !showDeleteConfirm) return EMPTY_SERIES;
    return getUserRecurringSeriesForEvent(filteredEvents, eventToDelete);
  }, [eventToDelete, showDeleteConfirm, filteredEvents]);
  const seriesCount = seriesEvents.length > 1 ? seriesEvents.length : 0;

  const confirmDeleteSeries = useCallback(async () => {
    if (seriesEvents.length < 2) return;
    try {
      await dispatchBulkCallEvents(
        seriesEvents
          .filter((evt) => evt?.id)
          .map((evt) => ({ type: EVENT_ACTIONS.DELETE, payload: evt }))
      );
      cancelDelete();
    } catch {
      // Toast already shown by dispatchBulkCallEvents
    }
  }, [seriesEvents, dispatchBulkCallEvents, cancelDelete]);

  const handleQuickDelete = useCallback(
    (evt, e) => {
      e.stopPropagation();
      requestDeleteConfirm(evt);
    },
    [requestDeleteConfirm]
  );

  return {
    eventToDelete,
    showDeleteConfirm,
    seriesCount,
    requestDeleteConfirm,
    cancelDelete,
    confirmDelete,
    confirmDeleteSeries,
    handleQuickDelete,
    isDeleting: isLoading && loadingOperation === 'delete',
  };
}
