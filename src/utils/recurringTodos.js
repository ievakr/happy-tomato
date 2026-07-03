import dayjs from 'dayjs';
import { isSameCalendarDay } from './eventDates';

/** True if the event carries a to-do (field or legacy title-only). */
export function eventHasTodoContent(evt) {
  if (!evt) return false;
  const td = evt.toDo;
  if (td) {
    if (Array.isArray(td)) return td.length > 0;
    return Boolean(String(td).trim());
  }
  return (
    evt.title &&
    typeof evt.title === 'string' &&
    evt.title.trim().startsWith('TO DO:')
  );
}

/**
 * Calendar day (start) of inclusive "repeat until" end, or null if series does not use until-date.
 */
export function getUserRecurringUntilStartOfDay(userRecurringConfig) {
  if (!userRecurringConfig?.enabled || userRecurringConfig.untilDate == null) {
    return null;
  }
  if (userRecurringConfig.endType === 'count') {
    return null;
  }
  return dayjs(userRecurringConfig.untilDate).startOf('day');
}

/** Pending manual or auto-generated to-do (not yet completed). */
export function isTodoEvent(event) {
  if (!event || event.completed) return false;
  return (
    event.isRecurringTodo ||
    (event.title && typeof event.title === 'string' && event.title.startsWith('TO DO:')) ||
    (typeof event.toDo === 'string' && event.toDo.startsWith('TO DO:'))
  );
}

/** Completed to-do or action derived from a to-do. */
export function isCompletedTodoAction(event) {
  if (!event?.completed) return false;
  if (event.createdFromAction) return true;
  if (event.isRecurringTodo) return true;
  if (typeof event.toDo === 'string' && event.toDo.trim().length > 0) return true;
  if (typeof event.title === 'string' && event.title.startsWith('TO DO:')) return true;
  return false;
}

export function supportsDayViewCompleteToggle(event) {
  return Boolean(event && (isTodoEvent(event) || isCompletedTodoAction(event)));
}

/** Match event labels exactly (order-independent). */
export function labelsMatch(a = [], b = []) {
  if (!a?.length && !b?.length) return true;
  if (!a?.length || !b?.length || a.length !== b.length) return false;
  return a.every((label) => b.includes(label));
}

/**
 * Match an action/todo name against an event, handling "TO DO:" prefix variations.
 */
export function eventMatchesAction(evt, actionName) {
  if (!actionName) return false;
  const base = actionName.startsWith('TO DO: ') ? actionName.replace('TO DO: ', '') : actionName;
  return (
    (evt.actions && evt.actions.includes(actionName)) ||
    (evt.actions && evt.actions.includes(base)) ||
    (evt.toDo && String(evt.toDo).includes(actionName)) ||
    (evt.title && typeof evt.title === 'string' && evt.title.includes(actionName)) ||
    (actionName.startsWith('TO DO: ') &&
      ((evt.actions && evt.actions.includes(base)) ||
        (evt.title && evt.title.includes(base)))) ||
    (!actionName.startsWith('TO DO: ') &&
      evt.title &&
      typeof evt.title === 'string' &&
      evt.title.includes(`TO DO: ${actionName}`))
  );
}

/** Filter recurring to-dos in a series (excludes original event id). */
export function filterRecurringTodosInSeries(events, { actionName, labels, excludeId }) {
  return events.filter((evt) => {
    if (!evt.isRecurringTodo || evt.completed) return false;
    if (excludeId && evt.id === excludeId) return false;
    return eventMatchesAction(evt, actionName) && labelsMatch(labels, evt.labels);
  });
}

/** All pending recurring to-dos in a series, sorted by day. */
export function getRecurringSeriesEvents(events, actionName, labels) {
  return events
    .filter(
      (evt) =>
        evt.isRecurringTodo &&
        !evt.completed &&
        eventMatchesAction(evt, actionName) &&
        labelsMatch(labels, evt.labels)
    )
    .sort((a, b) => a.day - b.day);
}

/** Related events for max-occurrence counting when regenerating a legacy series. */
export function filterRelatedEventsForCount(events, { sourceItem, labels, excludeId }) {
  return events.filter((evt) => {
    if (excludeId && evt.id === excludeId) return false;
    const hasMatchingAction =
      sourceItem &&
      ((evt.actions && evt.actions.includes(sourceItem)) ||
        (evt.title && evt.title.includes(sourceItem)) ||
        (!evt.isRecurringTodo && evt.title === sourceItem));
    return hasMatchingAction && labelsMatch(labels, evt.labels);
  });
}

export function filterPendingTodosForDay(events, day) {
  return events.filter((evt) => isTodoEvent(evt) && isSameCalendarDay(evt.day, day));
}

export function filterCompletedActionsForDay(events, day) {
  return events.filter(
    (evt) => isSameCalendarDay(evt.day, day) && evt.createdFromAction && evt.completed
  );
}

export function filterAllPendingTodos(events) {
  return events.filter((evt) => isTodoEvent(evt));
}

export function filterUpcomingTodos(events, action, labels, daysAhead = 30) {
  const today = dayjs();
  const futureDate = today.add(daysAhead, 'days');

  return events.filter((evt) => {
    const eventDate = dayjs(evt.day);
    return (
      isTodoEvent(evt) &&
      eventDate.isAfter(today) &&
      eventDate.isBefore(futureDate) &&
      evt.actions &&
      evt.actions.includes(action) &&
      labels.some((label) => evt.labels && evt.labels.includes(label))
    );
  });
}
