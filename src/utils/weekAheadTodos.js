import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrBefore);

function isTodoEvent(evt) {
  return (
    evt.isRecurringTodo ||
    (typeof evt.title === 'string' && evt.title.startsWith('TO DO:')) ||
    (typeof evt.toDo === 'string' && evt.toDo.startsWith('TO DO:'))
  );
}

function eventDayStart(evt) {
  if (evt.day == null) return null;
  const d = dayjs(evt.day);
  return d.isValid() ? d.startOf('day') : null;
}

export function formatTodoLabel(evt) {
  if (evt.toDo) {
    const raw = Array.isArray(evt.toDo) ? evt.toDo.join(', ') : String(evt.toDo);
    return raw.replace(/^TO DO:\s*/i, '').trim() || raw;
  }
  if (typeof evt.title === 'string' && evt.title.startsWith('TO DO:')) {
    return evt.title.replace(/^TO DO:\s*/i, '').trim() || evt.title;
  }
  return evt.title || 'Task';
}

function compareTodosByLabel(a, b) {
  return formatTodoLabel(a).localeCompare(formatTodoLabel(b), undefined, {
    sensitivity: 'base',
  });
}

/**
 * TODOs for the current "week ahead" window (Mon–Sun), matching Cloud Function logic.
 * @param {Array<Object>} events
 * @return {{ overdue: Array, byDay: Record<string, Array>, weekStart: dayjs.Dayjs, weekEnd: dayjs.Dayjs }}
 */
export function getTodosForWeekAhead(events) {
  const now = dayjs();
  const today = now.startOf('day');
  const dayOfWeek = now.day();
  const weekStart =
    dayOfWeek === 0 ? today.add(1, 'day') : today.startOf('week').add(1, 'day');
  const weekEnd = weekStart.add(6, 'days');

  const overdue = [];
  const byDay = {};

  for (let d = weekStart.clone(); d.isSameOrBefore(weekEnd, 'day'); d = d.add(1, 'day')) {
    byDay[d.format('YYYY-MM-DD')] = [];
  }

  (events || []).forEach((evt) => {
    if (!isTodoEvent(evt) || evt.completed) return;
    const eventDate = eventDayStart(evt);
    if (!eventDate) return;

    if (eventDate.isBefore(today, 'day')) {
      overdue.push(evt);
    } else if (!eventDate.isAfter(weekEnd, 'day')) {
      const key = eventDate.format('YYYY-MM-DD');
      if (byDay[key]) {
        byDay[key].push(evt);
      }
    }
  });

  overdue.sort(compareTodosByLabel);
  Object.keys(byDay).forEach((key) => {
    byDay[key].sort(compareTodosByLabel);
  });

  return { overdue, byDay, weekStart, weekEnd };
}
