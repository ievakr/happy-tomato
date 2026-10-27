import dayjs from 'dayjs';
import { EVENT_ACTIONS, PLANT_ACTIONS } from '../constants';
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
  getUserRecurringSeriesEvents,
  filterRelatedEventsForCount,
} from '../utils/recurringTodos';

function seriesActionName(event) {
  if (event?.actions?.length) return event.actions[0];
  if (Array.isArray(event?.toDo)) return event.toDo[0];
  if (event?.toDo) return event.toDo;
  return event?.title;
}

function recurringScheduleChanged(prev = {}, next = {}) {
  if (!next?.enabled) return false;
  if (!prev?.enabled) return true;
  if (Number(prev.interval) !== Number(next.interval)) return true;
  if ((prev.unit || 'days') !== (next.unit || 'days')) return true;
  const prevEnd = prev.endType || 'count';
  const nextEnd = next.endType || 'count';
  if (prevEnd !== nextEnd) return true;
  if (nextEnd === 'count') {
    return Number(prev.maxOccurrences) !== Number(next.maxOccurrences);
  }
  const prevUntil = prev.untilDate == null ? null : dayjs(prev.untilDate).startOf('day').valueOf();
  const nextUntil = next.untilDate == null ? null : dayjs(next.untilDate).startOf('day').valueOf();
  return prevUntil !== nextUntil;
}

function seriesPayload(member, generated) {
  const completed = Boolean(member?.completed || generated.completed);
  const payload = {
    ...generated,
    id: member.id,
    completed,
  };
  if (completed) {
    payload.completedAt = member.completedAt || generated.completedAt || Date.now();
  } else {
    payload.completedAt = undefined;
  }
  return payload;
}

/**
 * Replace the series so it matches the new interval and end rule, starting from the earliest date.
 * A date-only edit does not come through here: moving or deleting one date leaves the others put.
 */
async function rebuildUserRecurringSeries(updatedEvent, originalEvent, events, dispatchCallEvent) {
  const actionName = seriesActionName(originalEvent);
  const members = getUserRecurringSeriesEvents(events, actionName, originalEvent.labels || []);
  if (!members.some((evt) => evt.id === originalEvent.id)) {
    members.push(originalEvent);
    members.sort((a, b) => a.day - b.day);
  }

  const anchor = members.reduce((earliest, evt) => {
    const day = evt.id === originalEvent.id ? dayjs(updatedEvent.day) : dayjs(evt.day);
    if (!earliest || day.isBefore(earliest, 'day')) return day.startOf('day');
    return earliest;
  }, null);

  const template = { ...updatedEvent, day: anchor.valueOf() };
  delete template.id;
  const desired = generateRecurringToDos(template, '', 6, [], true, {
    ignoreSeriesCancellation: true,
  });

  const used = new Set();
  for (const generated of desired) {
    const desiredDay = dayjs(generated.day);
    const onThatDay = members.find(
      (evt) => !used.has(evt.id) && dayjs(evt.day).isSame(desiredDay, 'day')
    );
    const edited =
      !onThatDay &&
      members.find(
        (evt) =>
          evt.id === originalEvent.id &&
          !used.has(evt.id) &&
          dayjs(updatedEvent.day).isSame(desiredDay, 'day')
      );
    const member = onThatDay || edited;
    if (member) {
      used.add(member.id);
      await dispatchCallEvent({
        type: EVENT_ACTIONS.UPDATE,
        payload: seriesPayload(member, generated),
      });
    } else {
      await dispatchCallEvent({ type: EVENT_ACTIONS.PUSH, payload: generated });
    }
  }

  for (const member of members) {
    if (!used.has(member.id)) {
      await dispatchCallEvent({ type: EVENT_ACTIONS.DELETE, payload: member });
    }
  }
}

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
    const additionalTodos = generateRecurringToDos(recurringEvent, '', 6, filteredEvents, false, {
      ignoreSeriesCancellation: true,
    });
    for (const todo of additionalTodos) {
      await dispatchCallEvent({ type: EVENT_ACTIONS.PUSH, payload: todo });
    }
    return;
  }

  // Editing the repeat rule rebuilds the series from its earliest date.
  // Moving this date, or turning repeat off, updates this date only. Deleting one date leaves the rest.
  if (originalEvent.userRecurringConfig?.enabled) {
    if (
      updatedEvent.userRecurringConfig?.enabled &&
      recurringScheduleChanged(originalEvent.userRecurringConfig, updatedEvent.userRecurringConfig)
    ) {
      await rebuildUserRecurringSeries(updatedEvent, originalEvent, filteredEvents, dispatchCallEvent);
      return;
    }
    await dispatchCallEvent({ type: EVENT_ACTIONS.UPDATE, payload: updatedEvent });
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

      // TODO_ACTIONS was removed from constants; todo-specific dosage lookup no
      // longer applies. Fall back to plant-action dosage only.
      const dosageText = PLANT_ACTIONS[firstAction];

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
