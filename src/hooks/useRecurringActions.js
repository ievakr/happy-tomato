import { useEventContext } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { EVENT_ACTIONS } from '../constants';
import { createActionWithRecurringTodos as createActionWithRecurringTodosService } from '../services/recurringEventCreation';
import {
  cancelRecurringSeries as cancelRecurringSeriesService,
  deleteAllRecurringTodos as deleteAllRecurringTodosService,
  deleteRecurringTodosForEvent as deleteRecurringTodosForEventService,
} from '../services/recurringSeriesCancellation';
import {
  buildCompletedTodoAction,
  buildRestoredTodoEvent,
  buildMarkedCompletedTodo,
} from '../utils/todoMutations';
import {
  isTodoEvent,
  isCompletedTodoAction,
  supportsDayViewCompleteToggle,
  filterPendingTodosForDay,
  filterCompletedActionsForDay,
  filterAllPendingTodos,
  filterUpcomingTodos,
} from '../utils/recurringTodos';
import { updateEventWithRecurringRecalculation as recalculateRecurringEvent } from '../services/recurringEventRecalculation';

/**
 * Custom hook for managing recurring actions and TO DO completion
 */
export const useRecurringActions = () => {
  const { dispatchCallEvent, filteredEvents } = useEventContext();
  const { currentUser } = useAuth();

  const createActionWithRecurringTodos = async (actionEvent) =>
    createActionWithRecurringTodosService(actionEvent, { dispatchCallEvent, filteredEvents });

  /**
   * Complete a TO DO event and convert it to an action
   * @param {Object} todoEvent - The TO DO event to complete
   */
  const completeTodo = async (todoEvent) => {
    await dispatchCallEvent({
      type: EVENT_ACTIONS.UPDATE,
      payload: buildCompletedTodoAction(todoEvent),
    });
  };

  /**
   * Reverse {@link completeTodo}: restore pending TO DO fields and clear completion.
   */
  const uncompleteTodo = async (event) => {
    await dispatchCallEvent({
      type: EVENT_ACTIONS.UPDATE,
      payload: buildRestoredTodoEvent(event),
    });
  };

  /**
   * Mark a TO DO as completed without deleting it (for UI feedback)
   * @param {Object} todoEvent - The TO DO event to mark as completed
   */
  const markTodoCompleted = async (todoEvent) => {
    await dispatchCallEvent({
      type: EVENT_ACTIONS.UPDATE,
      payload: buildMarkedCompletedTodo(todoEvent),
    });
  };

  /**
   * Get all pending TO DOs for a specific day
   * @param {dayjs} day - The day to check
   * @returns {Array} - Array of pending TO DO events
   */
  const getPendingTodosForDay = (day) => filterPendingTodosForDay(filteredEvents, day);

  const getCompletedActionsForDay = (day) => filterCompletedActionsForDay(filteredEvents, day);

  const getUpcomingTodos = (action, labels, daysAhead = 30) =>
    filterUpcomingTodos(filteredEvents, action, labels, daysAhead);

  const getAllPendingTodos = () => filterAllPendingTodos(filteredEvents);

  const deps = { dispatchCallEvent, filteredEvents };

  const cancelRecurringSeries = async (actionName, labels = []) =>
    cancelRecurringSeriesService(actionName, labels, deps);

  const deleteRecurringTodosForEvent = async (originalEventId, originalAction, originalLabels) =>
    deleteRecurringTodosForEventService(originalEventId, originalAction, originalLabels, deps);

  const deleteAllRecurringTodos = async (filterAction = null, filterLabels = null) =>
    deleteAllRecurringTodosService(filterAction, filterLabels, {
      ...deps,
      cancelSeries: cancelRecurringSeries,
    });

  const updateEventWithRecurringRecalculation = async (updatedEvent, originalEvent) =>
    recalculateRecurringEvent(updatedEvent, originalEvent, {
      dispatchCallEvent,
      filteredEvents,
      deleteRecurringTodosForEvent,
    });

  /**
   * Targeted delete for recurring todos by pattern matching in Firebase
   */
  const deleteRecurringTodosByPatternFromFirebase = async (actionName, labels = []) => {
    if (!currentUser?.uid) return 0;
    try {
      const { deleteRecurringTodosByPatternFromFirebase: deleteByPattern } = await import(
        '../services/recurringFirebaseCleanup'
      );
      return deleteByPattern(currentUser.uid, actionName, labels);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Nuclear option: Delete ALL recurring todos directly from Firebase
   */
  const nukeAllRecurringTodosFromFirebase = async () => {
    if (!currentUser?.uid) return 0;
    try {
      const { nukeAllRecurringTodosFromFirebase: nukeAll } = await import(
        '../services/recurringFirebaseCleanup'
      );
      return nukeAll(currentUser.uid, cancelRecurringSeries);
    } catch (error) {
      throw error;
    }
  };

  return {
    createActionWithRecurringTodos,
    completeTodo,
    uncompleteTodo,
    markTodoCompleted,
    getPendingTodosForDay,
    getCompletedActionsForDay,
    isTodoEvent,
    isCompletedTodoAction,
    supportsDayViewCompleteToggle,
    getUpcomingTodos,
    getAllPendingTodos,
    deleteAllRecurringTodos,
    deleteRecurringTodosForEvent,
    updateEventWithRecurringRecalculation,
    deleteRecurringTodosByPatternFromFirebase,
    nukeAllRecurringTodosFromFirebase,
    cancelRecurringSeries
  };
};
