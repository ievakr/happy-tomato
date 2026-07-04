import React from 'react';
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
  const { t } = useTranslation();
  return (
    <>
      <div className="form-check">
        <input
          className="form-check-input"
          type="checkbox"
          id="isRecurringCheck"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="isRecurringCheck">
          <span
            className="material-icons-outlined me-1"
            style={{ fontSize: '1rem', verticalAlign: 'middle' }}
          >
            repeat
          </span>
          {t('forms.recurringEvent')}
        </label>
      </div>

      {isRecurring && (
        <div className="border rounded p-3 bg-light">
          <div className="mb-3">
            <label htmlFor="recurringInterval" className="form-label small text-muted">
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
          <div className="mb-2" role="group" aria-label={t('forms.howRecurringEnds')}>
            <div className="form-label small text-muted mb-2">{t('forms.seriesEnds')}</div>
            <div className="d-flex flex-column gap-2">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="recurringEndType"
                  id="recurringEndCount"
                  checked={recurringEndType === 'count'}
                  onChange={() => setRecurringEndType('count')}
                />
                <label className="form-check-label" htmlFor="recurringEndCount">
                  {t('forms.afterOccurrences')}
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="recurringEndType"
                  id="recurringEndUntil"
                  checked={recurringEndType === 'until'}
                  onChange={() => setRecurringEndType('until')}
                />
                <label className="form-check-label" htmlFor="recurringEndUntil">
                  {t('forms.onDateInclusive')}
                </label>
              </div>
            </div>
          </div>

          {recurringEndType === 'count' && (
            <div className="mb-2">
              <label htmlFor="recurringMaxOccurrences" className="form-label small text-muted">
                {t('forms.numberOfOccurrences')}
              </label>
              <input
                type="number"
                className="form-control"
                id="recurringMaxOccurrences"
                min="1"
                max="50"
                value={recurringMaxOccurrences === '' ? '' : recurringMaxOccurrences}
                onChange={(e) => {
                  const val = e.target.value;
                  setRecurringMaxOccurrences(val === '' ? '' : parseInt(val, 10) || 12);
                }}
              />
              <div className="form-text">
                {t('forms.occurrencesHelp')}
              </div>
            </div>
          )}

          {recurringEndType === 'until' && (
            <div className="mb-2">
              <label
                className="form-label small text-muted d-flex align-items-center gap-2"
                htmlFor="recurringUntilDate"
              >
                <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
                  event_repeat
                </span>
                {t('forms.repeatUntil')}
              </label>
              <div>
                <Localization date={new DateLocalizer({ firstOfWeek: 1 })}>
                  <DatePicker
                    id="recurringUntilDate"
                    value={recurringUntilDate}
                    onChange={(date) => date && setRecurringUntilDate(date)}
                    valueFormat={{ dateStyle: 'medium' }}
                    className="w-100"
                    inputProps={RW_DATE_PICKER_INPUT_PROPS}
                  />
                </Localization>
              </div>
              <div className="form-text">{t('forms.repeatUntilHelp')}</div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
