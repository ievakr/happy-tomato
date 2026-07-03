import dayjs from 'dayjs';
import {
  isTodoEvent,
  isCompletedTodoAction,
  supportsDayViewCompleteToggle,
  eventMatchesAction,
  labelsMatch,
  filterRecurringTodosInSeries,
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

  describe('isSameCalendarDay', () => {
    it('compares calendar days ignoring time', () => {
      expect(isSameCalendarDay(todayMs, today.endOf('day'))).toBe(true);
      expect(isSameCalendarDay(todayMs, today.add(1, 'day'))).toBe(false);
    });
  });
});
