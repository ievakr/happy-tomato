import dayjs from 'dayjs';
import { EVENT_ACTIONS } from '../constants';
import { updateEventWithRecurringRecalculation } from './recurringEventRecalculation';

function member(id, day, overrides = {}) {
  return {
    id,
    title: 'TO DO: Water',
    toDo: 'TO DO: Water',
    labels: ['basil'],
    day: day.valueOf(),
    isRecurringTodo: true,
    completed: false,
    userRecurringConfig: {
      enabled: true,
      interval: 7,
      unit: 'days',
      endType: 'count',
      maxOccurrences: 2,
    },
    ...overrides,
    userRecurringConfig: {
      enabled: true,
      interval: 7,
      unit: 'days',
      endType: 'count',
      maxOccurrences: 2,
      ...(overrides.userRecurringConfig || {}),
    },
  };
}

describe('updateEventWithRecurringRecalculation user series', () => {
  const start = dayjs().add(14, 'day').startOf('day');
  const second = start.add(7, 'day');

  test('moving one date updates that date and leaves the other', async () => {
    const original = member('a', start);
    const sibling = member('b', second);
    const updated = { ...original, day: start.add(1, 'day').valueOf() };
    const dispatchCallEvent = jest.fn(() => Promise.resolve());

    await updateEventWithRecurringRecalculation(updated, original, {
      dispatchCallEvent,
      filteredEvents: [original, sibling],
    });

    expect(dispatchCallEvent).toHaveBeenCalledTimes(1);
    expect(dispatchCallEvent).toHaveBeenCalledWith({
      type: EVENT_ACTIONS.UPDATE,
      payload: updated,
    });
  });

  test('changing the interval rebuilds from the first date', async () => {
    const original = member('a', start);
    const sibling = member('b', second);
    const updated = {
      ...original,
      userRecurringConfig: { ...original.userRecurringConfig, interval: 14 },
    };
    const dispatchCallEvent = jest.fn(() => Promise.resolve());

    await updateEventWithRecurringRecalculation(updated, original, {
      dispatchCallEvent,
      filteredEvents: [original, sibling],
    });

    expect(dispatchCallEvent.mock.calls.map((call) => call[0].type)).toEqual([
      EVENT_ACTIONS.UPDATE,
      EVENT_ACTIONS.PUSH,
      EVENT_ACTIONS.DELETE,
    ]);
    expect(dispatchCallEvent.mock.calls[0][0].payload.id).toBe('a');
    expect(dayjs(dispatchCallEvent.mock.calls[0][0].payload.day).isSame(start, 'day')).toBe(true);
    expect(dispatchCallEvent.mock.calls[0][0].payload.userRecurringConfig.interval).toBe(14);
    expect(dayjs(dispatchCallEvent.mock.calls[1][0].payload.day).isSame(start.add(14, 'day'), 'day')).toBe(
      true
    );
    expect(dispatchCallEvent.mock.calls[2][0].payload.id).toBe('b');
  });

  test('changing the interval on a later date still starts from the first date', async () => {
    const first = member('a', start);
    const original = member('b', second);
    const updated = {
      ...original,
      userRecurringConfig: { ...original.userRecurringConfig, interval: 14 },
    };
    const dispatchCallEvent = jest.fn(() => Promise.resolve());

    await updateEventWithRecurringRecalculation(updated, original, {
      dispatchCallEvent,
      filteredEvents: [first, original],
    });

    expect(dispatchCallEvent.mock.calls[0][0].payload.id).toBe('a');
    expect(dayjs(dispatchCallEvent.mock.calls[0][0].payload.day).isSame(start, 'day')).toBe(true);
    expect(dayjs(dispatchCallEvent.mock.calls[1][0].payload.day).isSame(start.add(14, 'day'), 'day')).toBe(
      true
    );
    expect(dispatchCallEvent.mock.calls[2][0].payload.id).toBe('b');
  });

  test('turning repeat off updates only that event', async () => {
    const original = member('a', start);
    const sibling = member('b', second);
    const updated = { ...original, userRecurringConfig: null, isRecurringTodo: false };
    const dispatchCallEvent = jest.fn(() => Promise.resolve());

    await updateEventWithRecurringRecalculation(updated, original, {
      dispatchCallEvent,
      filteredEvents: [original, sibling],
    });

    expect(dispatchCallEvent).toHaveBeenCalledTimes(1);
    expect(dispatchCallEvent).toHaveBeenCalledWith({
      type: EVENT_ACTIONS.UPDATE,
      payload: updated,
    });
  });

  test('a completed date that remains on the schedule stays completed', async () => {
    const original = member('a', start, {
      completed: true,
      isRecurringTodo: false,
      createdFromAction: true,
      completedAt: 111,
    });
    const sibling = member('b', second);
    const updated = {
      ...original,
      userRecurringConfig: { ...original.userRecurringConfig, maxOccurrences: 1 },
    };
    const dispatchCallEvent = jest.fn(() => Promise.resolve());

    await updateEventWithRecurringRecalculation(updated, original, {
      dispatchCallEvent,
      filteredEvents: [original, sibling],
    });

    expect(dispatchCallEvent.mock.calls[0][0].payload).toEqual(
      expect.objectContaining({
        id: 'a',
        completed: true,
        completedAt: 111,
      })
    );
    expect(dispatchCallEvent.mock.calls[1][0]).toEqual({
      type: EVENT_ACTIONS.DELETE,
      payload: sibling,
    });
  });
});
