import dayjs from 'dayjs';
import {
  isTodoEvent,
  isCompletedTodoAction,
  supportsDayViewCompleteToggle,
  eventMatchesAction,
  labelsMatch,
  filterRecurringTodosInSeries,
  findRecurringScheduleConflict,
  findSameDayMatchingEvent,
  getUserRecurringSeriesForEvent,
} from '../utils/recurringTodos';
import { isSameCalendarDay } from '../utils/eventDates';

describe('recurringTodos utilities', () => {
  const today = dayjs();
  const todayMs = today.valueOf();

  describe('isTodoEvent', () => {
    it('identifies pending recurring todo', () => {
      expect(isTodoEvent({ isRecurringTodo: true, completed: false })).toBe(true);
    });

    it('identifies manual todo by title prefix', () => {
      expect(isTodoEvent({ title: 'TO DO: Water', completed: false })).toBe(true);
    });

    it('excludes completed todos', () => {
      expect(isTodoEvent({ title: 'TO DO: Water', completed: true })).toBe(false);
    });
  });

  describe('isCompletedTodoAction', () => {
    it('identifies completed action from todo', () => {
      expect(isCompletedTodoAction({ completed: true, createdFromAction: true })).toBe(true);
    });
  });

  describe('supportsDayViewCompleteToggle', () => {
    it('returns true for pending or completed todo-like events', () => {
      expect(supportsDayViewCompleteToggle({ title: 'TO DO: X', completed: false })).toBe(true);
      expect(supportsDayViewCompleteToggle({ completed: true, createdFromAction: true })).toBe(true);
      expect(supportsDayViewCompleteToggle({ title: 'Watered', completed: false })).toBe(false);
    });
  });

  describe('eventMatchesAction', () => {
    it('matches action in actions array', () => {
      expect(eventMatchesAction({ actions: ['Fertilize'] }, 'Fertilize')).toBe(true);
    });

    it('matches TO DO prefix variations', () => {
      expect(eventMatchesAction({ title: 'TO DO: Water' }, 'Water')).toBe(true);
    });
  });

  describe('labelsMatch', () => {
    it('requires exact label sets', () => {
      expect(labelsMatch(['Tomatoes'], ['Tomatoes'])).toBe(true);
      expect(labelsMatch(['Tomatoes'], ['Peppers'])).toBe(false);
      expect(labelsMatch([], [])).toBe(true);
    });
  });

  describe('filterRecurringTodosInSeries', () => {
    const events = [
      {
        id: '1',
        isRecurringTodo: true,
        completed: false,
        actions: ['Fertilize'],
        labels: ['Tomatoes'],
        day: todayMs,
      },
      {
        id: '2',
        isRecurringTodo: true,
        completed: false,
        actions: ['Fertilize'],
        labels: ['Tomatoes'],
        day: today.add(7, 'day').valueOf(),
      },
      {
        id: '3',
        isRecurringTodo: true,
        completed: true,
        actions: ['Fertilize'],
        labels: ['Tomatoes'],
        day: todayMs,
      },
    ];

    it('collects every date in a user repeat, including finished ones', () => {
      const series = {
        userRecurringConfig: { enabled: true },
        toDo: 'TO DO: Water',
        labels: ['Tomatoes'],
      };
      const events = [
        { id: 'a', ...series, day: todayMs, completed: true },
        { id: 'b', ...series, day: today.add(1, 'day').valueOf(), completed: false },
        { id: 'c', toDo: 'TO DO: Water', labels: ['Peppers'], userRecurringConfig: { enabled: true }, day: todayMs },
      ];
      const result = getUserRecurringSeriesForEvent(events, events[1]);
      expect(result.map((evt) => evt.id)).toEqual(['a', 'b']);
    });

    it('returns matching series members excluding specified id', () => {
      const result = filterRecurringTodosInSeries(events, {
        actionName: 'Fertilize',
        labels: ['Tomatoes'],
        excludeId: '1',
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });
  });

  describe('findSameDayMatchingEvent', () => {
    const day = today.startOf('day').valueOf();
    const existing = {
      id: 'existing',
      day,
      toDo: 'TO DO: Water',
      title: 'TO DO: Water',
      labels: ['basil'],
      completed: true,
    };

    it('finds the same to-do and plant on that day', () => {
      const match = findSameDayMatchingEvent([existing], {
        day,
        toDo: 'TO DO: Water',
        labels: ['basil'],
      });
      expect(match?.id).toBe('existing');
    });

    it('ignores a different plant and a different day', () => {
      expect(
        findSameDayMatchingEvent([existing], {
          day,
          toDo: 'TO DO: Water',
          labels: ['tomato'],
        })
      ).toBeNull();
      expect(
        findSameDayMatchingEvent([existing], {
          day: today.add(1, 'day').valueOf(),
          toDo: 'TO DO: Water',
          labels: ['basil'],
        })
      ).toBeNull();
    });

    it('does not treat the event being edited as a duplicate', () => {
      expect(findSameDayMatchingEvent([existing], { ...existing })).toBeNull();
    });
  });

  describe('findRecurringScheduleConflict', () => {
    const start = today.startOf('day');
    const series = {
      toDo: 'TO DO: Water',
      labels: ['basil'],
      userRecurringConfig: {
        enabled: true,
        interval: 7,
        unit: 'days',
        endType: 'count',
        maxOccurrences: 3,
      },
    };
    const existing = [0, 1, 2].map((step, index) => ({
      id: `day-${index}`,
      day: start.add(step * 7, 'day').valueOf(),
      toDo: 'TO DO: Water',
      title: 'TO DO: Water',
      labels: ['basil'],
      isRecurringTodo: true,
    }));

    it('blocks a new series that starts on a later occupied date', () => {
      const conflict = findRecurringScheduleConflict(existing, {
        ...series,
        day: start.add(7, 'day').valueOf(),
      });
      expect(conflict?.event.id).toBe('day-1');
      expect(conflict.day.isSame(start.add(7, 'day'), 'day')).toBe(true);
    });

    it('blocks a series that starts on a free day and later hits an existing date', () => {
      const conflict = findRecurringScheduleConflict(existing, {
        ...series,
        day: start.subtract(7, 'day').valueOf(),
      });
      expect(conflict?.event.id).toBe('day-0');
    });

    it('allows the same series to be edited', () => {
      const conflict = findRecurringScheduleConflict(
        existing,
        { ...series, id: 'day-0', day: start.valueOf() },
        new Set(existing.map((evt) => evt.id))
      );
      expect(conflict).toBeNull();
    });
  });

  describe('isSameCalendarDay', () => {
    it('compares calendar days ignoring time', () => {
      expect(isSameCalendarDay(todayMs, today.endOf('day'))).toBe(true);
      expect(isSameCalendarDay(todayMs, today.add(1, 'day'))).toBe(false);
    });
  });
});
