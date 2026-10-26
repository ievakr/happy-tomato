import React, { useEffect, useRef } from 'react';
import DatePicker from 'react-widgets/DatePicker';
import { Localization } from 'react-widgets';
import { DateLocalizer } from 'react-widgets/IntlLocalizer';
import { RW_DATE_PICKER_INPUT_PROPS } from '../../constants/datePicker';
import { useTranslation } from '../../i18n/LanguageContext';

export default function RecurringConfigSection({
  isRecurring,
  setIsRecurring,
  recurringInterval,
  setRecurringInterval,
  recurringEndType,
  setRecurringEndType,
  recurringMaxOccurrences,
  setRecurringMaxOccurrences,
  recurringUntilDate,
  setRecurringUntilDate,
}) {
  const { t, language } = useTranslation();
  const dateCulture = language === 'lt' ? 'lt' : 'en-GB';
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isRecurring) return;
    panelRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [isRecurring, recurringEndType]);
  return (
    <>
      <div className="event-modal-switch">
        <label htmlFor="isRecurringCheck">{t('forms.recurringEvent')}</label>
        <input
          type="checkbox"
          role="switch"
          id="isRecurringCheck"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
        />
      </div>

      {isRecurring && (
        <div className="event-recur-panel" ref={panelRef}>
          <div>
            <label htmlFor="recurringInterval" className="event-recur-label">
              {t('forms.repeatEveryDays')}
            </label>
            <input
              type="number"
              className="form-control"
              id="recurringInterval"
              min="1"
              max="365"
              value={recurringInterval === '' ? '' : recurringInterval}
              onChange={(e) => {
                const val = e.target.value;
                setRecurringInterval(val === '' ? '' : parseInt(val, 10) || 7);
              }}
            />
          </div>
          <div className="event-recur-ends" role="group" aria-label={t('forms.howRecurringEnds')}>
            <button
              type="button"
              className={recurringEndType === 'count' ? 'is-selected' : ''}
              aria-pressed={recurringEndType === 'count'}
              onClick={() => setRecurringEndType('count')}
            >
              {t('forms.afterOccurrences')}
            </button>
            <button
              type="button"
              className={recurringEndType === 'until' ? 'is-selected' : ''}
              aria-pressed={recurringEndType === 'until'}
              onClick={() => setRecurringEndType('until')}
            >
              {t('forms.onDate')}
            </button>
          </div>

          {recurringEndType === 'count' ? (
            <input
              type="number"
              className="form-control"
              id="recurringMaxOccurrences"
              aria-label={t('forms.numberOfOccurrences')}
              min="1"
              max="50"
              value={recurringMaxOccurrences === '' ? '' : recurringMaxOccurrences}
              onChange={(e) => {
                const val = e.target.value;
                setRecurringMaxOccurrences(val === '' ? '' : parseInt(val, 10) || 12);
              }}
            />
          ) : (
            <Localization date={new DateLocalizer({ culture: dateCulture, firstOfWeek: 1 })}>
              <DatePicker
                value={recurringUntilDate}
                onChange={(date) => date && setRecurringUntilDate(date)}
                valueFormat={{ day: '2-digit', month: '2-digit', year: 'numeric' }}
                className="w-100"
                dropUp
                inputProps={{
                  ...RW_DATE_PICKER_INPUT_PROPS,
                  id: 'recurringUntilDate',
                  'aria-label': t('forms.repeatUntil'),
                }}
              />
            </Localization>
          )}
        </div>
      )}
    </>
  );
}
