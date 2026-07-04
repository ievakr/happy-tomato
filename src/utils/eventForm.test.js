import dayjs from 'dayjs';
import { buildCalendarEventPayload } from './eventForm';

describe('buildCalendarEventPayload', () => {
  const recurringConfig = {
    enabled: true,
    interval: 7,
    unit: 'days',
    endType: 'count',
    maxOccurrences: 4,
  };

  test('keeps past-date todos non-recurring and completed', () => {
    const pastDate = dayjs().subtract(3, 'day').toDate();
    const payload = buildCalendarEventPayload({
      selectedEvent: { id: '1', completedAt: 1000 },
      todoText: 'Water',
      title: 'Water',
      description: 'desc',
      selectedLabels: [],
      selectedDate: pastDate,
      userRecurringConfig: null,
      displayNameToPlantId: {},
    });

    expect(payload.userRecurringConfig).toBeNull();
    expect(payload.completed).toBe(true);
    expect(payload.isRecurringTodo).toBe(false);
    expect(payload.title).toBe('Water');
  });

  test('allows converting a completed past todo into a recurring series', () => {
    const pastDate = dayjs().subtract(5, 'day').toDate();
    const payload = buildCalendarEventPayload({
      selectedEvent: {
        id: '1',
        completed: true,
        completedAt: 12345,
        createdFromAction: true,
        title: 'Water',
        toDo: 'TO DO: Water',
      },
      todoText: 'Water',
      title: 'Water',
      description: 'desc',
      selectedLabels: [],
      selectedDate: pastDate,
      userRecurringConfig: recurringConfig,
      displayNameToPlantId: {},
    });

    expect(payload.userRecurringConfig).toEqual(recurringConfig);
    expect(payload.isRecurringTodo).toBe(true);
    expect(payload.completed).toBe(true);
    expect(payload.completedAt).toBe(12345);
    expect(payload.toDo).toBe('TO DO: Water');
  });

  test('allows converting a completed todo on today into a recurring series', () => {
    const today = dayjs().startOf('day').toDate();
    const payload = buildCalendarEventPayload({
      selectedEvent: {
        id: '2',
        completed: true,
        completedAt: 999,
        createdFromAction: true,
        title: 'Fertilize',
        toDo: 'TO DO: Fertilize',
      },
      todoText: 'Fertilize',
      title: 'Fertilize',
      description: 'desc',
      selectedLabels: [],
      selectedDate: today,
      userRecurringConfig: recurringConfig,
      displayNameToPlantId: {},
    });

    expect(payload.userRecurringConfig).toEqual(recurringConfig);
    expect(payload.isRecurringTodo).toBe(true);
    expect(payload.completed).toBe(true);
  });
});
