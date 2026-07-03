import { useCallback, useState } from 'react';
import dayjs from 'dayjs';

const DEFAULT_UNTIL_OFFSET_MONTHS = 1;

function defaultUntilDate(fromDate) {
  return dayjs(fromDate || new Date())
    .add(DEFAULT_UNTIL_OFFSET_MONTHS, 'month')
    .toDate();
}

/**
 * Recurring-series form state for EventModal.
 */
export function useEventRecurringConfig() {
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState(7);
  const [recurringMaxOccurrences, setRecurringMaxOccurrences] = useState(2);
  const [recurringEndType, setRecurringEndType] = useState('count');
  const [recurringUntilDate, setRecurringUntilDate] = useState(() => defaultUntilDate());

  const resetForNewEvent = useCallback((daySelected) => {
    setIsRecurring(false);
    setRecurringInterval(7);
    setRecurringMaxOccurrences(2);
    setRecurringEndType('count');
    setRecurringUntilDate(defaultUntilDate(daySelected?.toDate?.() || daySelected));
  }, []);

  const applyFromEvent = useCallback((selectedEvent) => {
    if (!selectedEvent?.userRecurringConfig) {
      if (selectedEvent?.recurringInterval) {
        setIsRecurring(true);
        setRecurringInterval(selectedEvent.recurringInterval || 7);
        setRecurringEndType('count');
        setRecurringMaxOccurrences(2);
        setRecurringUntilDate(defaultUntilDate(selectedEvent.day));
      } else {
        resetForNewEvent(selectedEvent.day);
      }
      return;
    }

    setIsRecurring(true);
    const cfg = selectedEvent.userRecurringConfig;
    setRecurringInterval(cfg.interval || 7);

    const useUntil =
      cfg.endType === 'count'
        ? false
        : cfg.endType === 'until'
          ? cfg.untilDate != null
          : cfg.untilDate != null;

    if (useUntil && cfg.untilDate != null) {
      setRecurringEndType('until');
      setRecurringUntilDate(new Date(cfg.untilDate));
    } else {
      setRecurringEndType('count');
      setRecurringMaxOccurrences(cfg.maxOccurrences || 2);
      setRecurringUntilDate(defaultUntilDate(selectedEvent.day));
    }
  }, [resetForNewEvent]);

  const buildUserRecurringConfig = useCallback(
    (toDoValue) => {
      if (!toDoValue || !isRecurring) return null;
      return {
        enabled: true,
        interval: Number(recurringInterval) || 7,
        unit: 'days',
        endType: recurringEndType,
        ...(recurringEndType === 'count'
          ? { maxOccurrences: Number(recurringMaxOccurrences) || 2 }
          : { untilDate: dayjs(recurringUntilDate).endOf('day').valueOf() }),
      };
    },
    [isRecurring, recurringInterval, recurringEndType, recurringMaxOccurrences, recurringUntilDate]
  );

  const validateRecurringConfig = useCallback(
    (toDoValue, selectedDate, showError) => {
      if (!toDoValue || !isRecurring) return true;

      if (recurringEndType === 'count') {
        const n = Number(recurringMaxOccurrences);
        if (!Number.isFinite(n) || n < 1) {
          showError('Enter a valid number of occurrences (at least 1).');
          return false;
        }
      } else {
        const startDay = dayjs(selectedDate).startOf('day');
        const untilDay = dayjs(recurringUntilDate).startOf('day');
        if (untilDay.isBefore(startDay)) {
          showError('The end date must be on or after the event date.');
          return false;
        }
      }
      return true;
    },
    [isRecurring, recurringEndType, recurringMaxOccurrences, recurringUntilDate]
  );

  return {
    isRecurring,
    setIsRecurring,
    recurringInterval,
    setRecurringInterval,
    recurringMaxOccurrences,
    setRecurringMaxOccurrences,
    recurringEndType,
    setRecurringEndType,
    recurringUntilDate,
    setRecurringUntilDate,
    applyFromEvent,
    resetForNewEvent,
    buildUserRecurringConfig,
    validateRecurringConfig,
  };
}
