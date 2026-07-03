import { useCallback, useState } from 'react';
import { useEventContext } from '../context/EventContext';
import { EVENT_ACTIONS } from '../constants';

/**
 * Shared delete-confirmation flow for calendar views.
 */
export function useEventDeleteConfirm() {
  const { dispatchCallEvent, isLoading, loadingOperation } = useEventContext();
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
    requestDeleteConfirm,
    cancelDelete,
    confirmDelete,
    handleQuickDelete,
    isDeleting: isLoading && loadingOperation === 'delete',
  };
}
