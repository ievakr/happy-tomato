import dayjs from 'dayjs';
import { EVENT_ACTIONS, PLANT_ACTIONS, TODO_ACTIONS } from '../constants';
import {
  generateRecurringToDos,
  shouldGenerateRecurringTodos,
  parseRecurringInterval,
} from '../utils/recurringActions';
import {
  eventHasTodoContent,
  getUserRecurringUntilStartOfDay,
  filterRecurringTodosInSeries,
  getRecurringSeriesEvents,
  filterRelatedEventsForCount,
} from '../utils/recurringTodos';

/**
 * Update an event and recalculate its recurring to-dos when the date or series config changes.
 */
export async function updateEventWithRecurringRecalculation(
  updatedEvent,
  originalEvent,
  { dispatchCallEvent, filteredEvents, deleteRecurringTodosForEvent }
) {
  if (!originalEvent?.id) {
    throw new Error('Cannot update event: missing original event or ID');
  }
  if (!updatedEvent?.id) {
    throw new Error('Cannot update event: missing updated event ID');
  }

  const hasActions = updatedEvent.actions?.length > 0;
  const hasTodos = eventHasTodoContent(updatedEvent);
  const isRecurringTodo = originalEvent.isRecurringTodo === true;

  if (!hasActions && !hasTodos) {
    await dispatchCallEvent({ type: EVENT_ACTIONS.UPDATE, payload: updatedEvent });
    return;
  }

  const originalDate = dayjs(originalEvent.day);
  const newDate = dayjs(updatedEvent.day);
  const dateChanged = !originalDate.isSame(newDate, 'day');

  const isConvertingToRecurring =
    !originalEvent.isRecurringTodo &&
    !originalEvent.userRecurringConfig?.enabled &&
    Boolean(updatedEvent.userRecurringConfig?.enabled);

  if (isConvertingToRecurring) {
    const recurringEvent = { ...updatedEvent, isRecurringTodo: true };
    await dispatchCallEvent({ type: EVENT_ACTIONS.UPDATE, payload: recurringEvent });
    const additionalTodos = generateRecurringToDos(recurringEvent, '', 6, filteredEvents, false);
    for (const todo of additionalTodos) {
      await dispatchCallEvent({ type: EVENT_ACTIONS.PUSH, payload: todo });
    }
    return;
  }

  if (!dateChanged) {
    await dispatchCallEvent({ type: EVENT_ACTIONS.UPDATE, payload: updatedEvent });
    return;
  }

  try {
    const firstAction = updatedEvent.actions?.length ? updatedEvent.actions[0] : null;
    const firstTodo = Array.isArray(updatedEvent.toDo) ? updatedEvent.toDo[0] : updatedEvent.toDo;
    const sourceItem = firstAction || firstTodo;
    const actionToMatch = firstAction || firstTodo;

    if (isRecurringTodo) {
      const isUserRecurringTodo = updatedEvent.userRecurringConfig?.enabled;

      if (isUserRecurringTodo && actionToMatch) {
        const dateShift = newDate.diff(originalDate, 'day');
        const seriesEvents = getRecurringSeriesEvents(
          filteredEvents,
          actionToMatch,
          updatedEvent.labels
        );
        const untilDay = getUserRecurringUntilStartOfDay(updatedEvent.userRecurringConfig);
        const primaryPastUntil = untilDay != null && newDate.startOf('day').isAfter(untilDay);

        if (primaryPastUntil) {
          await dispatchCallEvent({ type: EVENT_ACTIONS.DELETE, payload: originalEvent });
        } else {
          await dispatchCallEvent({ type: EVENT_ACTIONS.UPDATE, payload: updatedEvent });
        }

        if (!primaryPastUntil) {
          const eventsToShift = seriesEvents.filter(
            (evt) => evt.id !== updatedEvent.id && dayjs(evt.day).isAfter(originalDate)
          );

          for (const evt of eventsToShift) {
            const shiftedDay = dayjs(evt.day).add(dateShift, 'day').startOf('day');
            if (untilDay != null && shiftedDay.isAfter(untilDay)) {
              await dispatchCallEvent({ type: EVENT_ACTIONS.DELETE, payload: evt });
            } else {
              await dispatchCallEvent({
                type: EVENT_ACTIONS.UPDATE,
                payload: { ...evt, day: shiftedDay.valueOf() },
              });
            }
          }
        }
        return;
      }

      if (actionToMatch) {
        const todosToDelete = filterRecurringTodosInSeries(filteredEvents, {
          actionName: actionToMatch,
          labels: updatedEvent.labels,
          excludeId: originalEvent.id,
        });
        for (const todo of todosToDelete) {
          await dispatchCallEvent({ type: EVENT_ACTIONS.DELETE, payload: todo });
        }
      }

      await dispatchCallEvent({ type: EVENT_ACTIONS.UPDATE, payload: updatedEvent });

      let dosageText = PLANT_ACTIONS[firstAction];
      if (!dosageText && firstTodo) {
        dosageText = TODO_ACTIONS[firstTodo];
      }

      if (shouldGenerateRecurringTodos(sourceItem, dosageText, updatedEvent.userRecurringConfig)) {
        const existingEventsExcludingCurrent = filteredEvents.filter(
          (evt) => evt.id !== updatedEvent.id
        );
        const recurringTodos = generateRecurringToDos(
          updatedEvent,
          dosageText,
          6,
          existingEventsExcludingCurrent,
          false
        );
        const recurringInfo = parseRecurringInterval(dosageText, updatedEvent.userRecurringConfig);
        const maxTotalEvents = recurringInfo.maxOccurrences;
        const existingRelatedEvents = filterRelatedEventsForCount(filteredEvents, {
          sourceItem,
          labels: updatedEvent.labels,
          excludeId: updatedEvent.id,
        });
        const maxAdditionalTodos = Math.max(0, maxTotalEvents - (1 + existingRelatedEvents.length));

        for (const todo of recurringTodos.slice(0, maxAdditionalTodos)) {
          await dispatchCallEvent({ type: EVENT_ACTIONS.PUSH, payload: todo });
        }
      }
      return;
    }

    if (actionToMatch) {
      await deleteRecurringTodosForEvent(originalEvent.id, actionToMatch, updatedEvent.labels);
    }

    await dispatchCallEvent({ type: EVENT_ACTIONS.UPDATE, payload: updatedEvent });

    const hasPlantActionForUpdate = !!firstAction && !!PLANT_ACTIONS[firstAction];
    const dosageText = hasPlantActionForUpdate ? PLANT_ACTIONS[firstAction] : null;

    if (
      hasPlantActionForUpdate &&
      shouldGenerateRecurringTodos(sourceItem, dosageText, updatedEvent.userRecurringConfig)
    ) {
      const recurringTodos = generateRecurringToDos(updatedEvent, dosageText, 6, filteredEvents, false);
      for (const todo of recurringTodos) {
        await dispatchCallEvent({ type: EVENT_ACTIONS.PUSH, payload: todo });
      }
    }
  } catch (recalcError) {
    await dispatchCallEvent({ type: EVENT_ACTIONS.UPDATE, payload: updatedEvent });
    throw recalcError;
  }
}
