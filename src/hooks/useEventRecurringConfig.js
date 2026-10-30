import { useCallback, useState } from 'react';
import dayjs from 'dayjs';
import { useTranslation } from '../i18n/LanguageContext';
import { validateUserRecurringConfig } from '../utils/recurringSchedule';

const DEFAULT_UNTIL_OFFSET_MONTHS = 1;

function defaultUntilDate(fromDate) {
  return dayjs(fromDate || new Date())
    .add(DEFAULT_UNTIL_OFFSET_MONTHS, 'month')
    .toDate();
}

function recurringStateFromEvent(selectedEvent) {
  const untilFromEvent = defaultUntilDate(selectedEvent?.day);
  const empty = {
    isRecurring: false,
    recurringInterval: 7,
    recurringMaxOccurrences: 2,
    recurringEndType: 'count',
    recurringUntilDate: untilFromEvent,
  };

  if (!selectedEvent?.userRecurringConfig) {
    if (selectedEvent?.recurringInterval) {
      return {
        ...empty,
        isRecurring: true,
        recurringInterval: selectedEvent.recurringInterval || 7,
      };
    }
    return empty;
  }

  const cfg = selectedEvent.userRecurringConfig;
  const useUntil =
    cfg.endType === 'count'
      ? false
      : cfg.endType === 'until'
        ? cfg.untilDate != null
        : cfg.untilDate != null;

  if (useUntil && cfg.untilDate != null) {
    return {
      isRecurring: true,
      recurringInterval: cfg.interval || 7,
      recurringMaxOccurrences: 2,
      recurringEndType: 'until',
      recurringUntilDate: new Date(cfg.untilDate),
    };
  }

  return {
    isRecurring: true,
    recurringInterval: cfg.interval || 7,
    recurringMaxOccurrences: cfg.maxOccurrences || 2,
    recurringEndType: 'count',
    recurringUntilDate: untilFromEvent,
  };
}

/**
 * Recurring-series form state for EventModal.
 */
export function useEventRecurringConfig(selectedEvent) {
  const { t } = useTranslation();
  const initial = recurringStateFromEvent(selectedEvent);
  const [isRecurring, setIsRecurring] = useState(initial.isRecurring);
  const [recurringInterval, setRecurringInterval] = useState(initial.recurringInterval);
  const [recurringMaxOccurrences, setRecurringMaxOccurrences] = useState(initial.recurringMaxOccurrences);
  const [recurringEndType, setRecurringEndType] = useState(initial.recurringEndType);
  const [recurringUntilDate, setRecurringUntilDate] = useState(initial.recurringUntilDate);

  const resetForNewEvent = useCallback((daySelected) => {
    setIsRecurring(false);
    setRecurringInterval(7);
    setRecurringMaxOccurrences(2);
    setRecurringEndType('count');
    setRecurringUntilDate(defaultUntilDate(daySelected?.toDate?.() || daySelected));
  }, []);

  const applyFromEvent = useCallback((event) => {
    const next = recurringStateFromEvent(event);
    setIsRecurring(next.isRecurring);
    setRecurringInterval(next.recurringInterval);
    setRecurringMaxOccurrences(next.recurringMaxOccurrences);
    setRecurringEndType(next.recurringEndType);
    setRecurringUntilDate(next.recurringUntilDate);
  }, []);

  const buildUserRecurringConfig = useCallback(
    (toDoValue) => {
      if (!toDoValue || !isRecurring) return null;
      return {
        enabled: true,
        interval: Number(recurringInterval),
        unit: 'days',
        endType: recurringEndType,
        ...(recurringEndType === 'count'
          ? { maxOccurrences: Number(recurringMaxOccurrences) }
          : { untilDate: dayjs(recurringUntilDate).endOf('day').valueOf() }),
      };
    },
    [isRecurring, recurringInterval, recurringEndType, recurringMaxOccurrences, recurringUntilDate]
  );

  const validateRecurringConfig = useCallback(
    (toDoValue, selectedDate, showError) => {
      if (!toDoValue || !isRecurring) return true;

      const result = validateUserRecurringConfig(
        {
          enabled: true,
          interval: recurringInterval,
          endType: recurringEndType,
          maxOccurrences: recurringMaxOccurrences,
          untilDate: recurringUntilDate,
        },
        selectedDate
      );
      if (!result.ok) {
        showError(t(result.errorKey));
        return false;
      }
      return true;
    },
    [isRecurring, recurringEndType, recurringInterval, recurringMaxOccurrences, recurringUntilDate, t]
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
