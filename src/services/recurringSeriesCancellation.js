import { EVENT_ACTIONS } from '../constants';
import {
  labelsMatch,
  eventMatchesAction,
  filterRecurringTodosInSeries,
  filterAllPendingTodos,
} from '../utils/recurringTodos';

/**
 * Mark original action events as having their recurring series cancelled.
 */
export async function cancelRecurringSeries(
  actionName,
  labels = [],
  { dispatchCallEvent, filteredEvents }
) {
  const originalActions = filteredEvents.filter((evt) => {
    if (evt.isRecurringTodo || evt.completed || evt.createdFromAction) return false;
    return eventMatchesAction(evt, actionName) && labelsMatch(labels, evt.labels);
  });

  for (const action of originalActions) {
    await dispatchCallEvent({
      type: EVENT_ACTIONS.UPDATE,
      payload: {
        ...action,
        recurringCancelled: true,
        recurringCancelledAt: Date.now(),
      },
    });
  }

  return originalActions.length;
}

/**
 * Delete recurring todos generated from a specific original event.
 */
export async function deleteRecurringTodosForEvent(
  originalEventId,
  originalAction,
  originalLabels,
  { dispatchCallEvent, filteredEvents }
) {
  const todosToDelete = filterRecurringTodosInSeries(filteredEvents, {
    actionName: originalAction,
    labels: originalLabels,
    excludeId: originalEventId,
  });

  for (const todo of todosToDelete) {
    await dispatchCallEvent({ type: EVENT_ACTIONS.DELETE, payload: todo });
  }

  return todosToDelete.length;
}

/**
 * Delete all pending auto-generated recurring TO DO events, optionally filtered.
 */
export async function deleteAllRecurringTodos(
  filterAction,
  filterLabels,
  { dispatchCallEvent, filteredEvents, cancelSeries }
) {
  let todosToDelete = filterAllPendingTodos(filteredEvents);

  if (filterAction) {
    todosToDelete = todosToDelete.filter(
      (evt) => evt.actions && evt.actions.includes(filterAction)
    );
  }

  if (filterLabels && filterLabels.length > 0) {
    todosToDelete = todosToDelete.filter(
      (evt) => evt.labels && filterLabels.some((label) => evt.labels.includes(label))
    );
  }

  for (const todo of todosToDelete) {
    await dispatchCallEvent({ type: EVENT_ACTIONS.DELETE, payload: todo });
  }

  const actionsCancelled = new Set();

  for (const todo of todosToDelete) {
    const actionToCancel =
      todo.actions && todo.actions.length > 0
        ? todo.actions[0]
        : todo.toDo || todo.title.replace('TO DO: ', '');

    if (actionToCancel && !actionsCancelled.has(actionToCancel)) {
      actionsCancelled.add(actionToCancel);
      try {
        await cancelSeries(actionToCancel, todo.labels);
      } catch {
        // Failed to cancel series
      }
    }
  }

  return todosToDelete.length;
}
