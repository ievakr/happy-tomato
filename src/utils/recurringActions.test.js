import dayjs from 'dayjs';
import { generateRecurringToDos } from './recurringActions';

function seriesEvent(day, overrides = {}) {
  const { userRecurringConfig, ...rest } = overrides;
  return {
    title: 'TO DO: Water',
    toDo: 'TO DO: Water',
    labels: ['basil'],
    day: day.valueOf(),
    userRecurringConfig: {
      enabled: true,
      interval: 7,
      unit: 'days',
      endType: 'count',
      maxOccurrences: 2,
      ...userRecurringConfig,
    },
    ...rest,
  };
}

describe('generateRecurringToDos user series', () => {
  const start = dayjs().add(30, 'day').startOf('day');

  test('a different plant on the same day does not block the series', () => {
    const existing = {
      day: start.valueOf(),
      toDo: 'TO DO: Water',
      title: 'TO DO: Water',
      labels: ['tomato'],
      isRecurringTodo: true,
      completed: false,
      userRecurringConfig: { enabled: true },
    };
    const todos = generateRecurringToDos(
      seriesEvent(start, { userRecurringConfig: { maxOccurrences: 1 } }),
      '',
      6,
      [existing],
      true
    );
    expect(todos).toHaveLength(1);
    expect(todos[0].labels).toEqual(['basil']);
  });

  test('a completed copy of the same to-do and plant blocks a second copy', () => {
    const existing = {
      day: start.valueOf(),
      toDo: 'TO DO: Water',
      title: 'Water',
      labels: ['basil'],
      completed: true,
      isRecurringTodo: false,
      createdFromAction: true,
      userRecurringConfig: { enabled: true },
    };
    const todos = generateRecurringToDos(
      seriesEvent(start, { userRecurringConfig: { maxOccurrences: 1 } }),
      '',
      6,
      [existing],
      true
    );
    expect(todos).toHaveLength(0);
  });

  test('empty labels do not match a planted event', () => {
    const existing = {
      day: start.valueOf(),
      toDo: 'TO DO: Water',
      title: 'TO DO: Water',
      labels: ['basil'],
      isRecurringTodo: true,
      completed: false,
    };
    const todos = generateRecurringToDos(
      seriesEvent(start, { labels: [], userRecurringConfig: { maxOccurrences: 1 } }),
      '',
      6,
      [existing],
      true
    );
    expect(todos).toHaveLength(1);
    expect(todos[0].labels).toEqual([]);
  });

  test('an until date on the start date creates one event', () => {
    const todos = generateRecurringToDos(
      seriesEvent(start, {
        userRecurringConfig: {
          endType: 'until',
          untilDate: start.endOf('day').valueOf(),
          maxOccurrences: undefined,
        },
      }),
      '',
      6,
      [],
      true
    );
    expect(todos).toHaveLength(1);
    expect(dayjs(todos[0].day).isSame(start, 'day')).toBe(true);
  });

  test('an until date one interval later creates two events', () => {
    const todos = generateRecurringToDos(
      seriesEvent(start, {
        userRecurringConfig: {
          interval: 7,
          endType: 'until',
          untilDate: start.add(7, 'day').endOf('day').valueOf(),
        },
      }),
      '',
      6,
      [],
      true
    );
    expect(todos.map((todo) => dayjs(todo.day).format('YYYY-MM-DD'))).toEqual([
      start.format('YYYY-MM-DD'),
      start.add(7, 'day').format('YYYY-MM-DD'),
    ]);
  });

  test('an until range stops at 50 events', () => {
    const todos = generateRecurringToDos(
      seriesEvent(start, {
        userRecurringConfig: {
          interval: 1,
          endType: 'until',
          untilDate: start.add(200, 'day').endOf('day').valueOf(),
        },
      }),
      '',
      6,
      [],
      true
    );
    expect(todos).toHaveLength(50);
  });

  test('a past start is saved already completed and later dates stay open', () => {
    const past = dayjs().subtract(10, 'day').startOf('day');
    const todos = generateRecurringToDos(
      seriesEvent(past, { userRecurringConfig: { interval: 7, maxOccurrences: 3 } }),
      '',
      6,
      [],
      true
    );
    expect(todos).toHaveLength(3);
    expect(todos[0].completed).toBe(true);
    expect(todos[1].completed).toBe(true);
    expect(todos[2].completed).toBe(false);
    expect(todos[0].title.startsWith('TO DO:')).toBe(false);
    expect(todos[2].title.startsWith('TO DO:')).toBe(true);
  });
});
