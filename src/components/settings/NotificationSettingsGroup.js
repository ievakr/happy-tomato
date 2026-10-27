import React from 'react';
import { SettingsSwitch, SettingsTimeField } from './settingsControls';

/** Labels ordered Monday–Sunday; values match dayjs `.day()` (0 = Sunday … 6 = Saturday). */
const NOTIFICATION_WEEKDAYS = [
  { value: 1, labelKey: 'settings.weekday.monday' },
  { value: 2, labelKey: 'settings.weekday.tuesday' },
  { value: 3, labelKey: 'settings.weekday.wednesday' },
  { value: 4, labelKey: 'settings.weekday.thursday' },
  { value: 5, labelKey: 'settings.weekday.friday' },
  { value: 6, labelKey: 'settings.weekday.saturday' },
  { value: 0, labelKey: 'settings.weekday.sunday' },
];

function NotificationSettingsGroup({ t, draft, setDraft, onSave }) {
  return (
    <div className="settings-group">
      <h2 className="settings-card-title">{t('settings.tab.notifications')}</h2>
      <SettingsSwitch
        id="email-notifications"
        label={t('settings.pushNotifications')}
        strong
        checked={draft.enabled}
        onChange={(e) =>
          setDraft((prev) => ({
            ...prev,
            enabled: e.target.checked,
          }))
        }
      />

      {draft.enabled && (
        <>
          <div className="settings-notify-block">
            <SettingsSwitch
              id="daily-reminder"
              label={t('settings.dailyReminder')}
              strong
              checked={!!draft.dailyReminder}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  dailyReminder: e.target.checked,
                }))
              }
            />
            {draft.dailyReminder && (
              <div className="settings-notify-fields">
                <SettingsTimeField
                  id="daily-reminder-time"
                  value={draft.dailyReminderTime || draft.reminderTime || '09:00'}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      dailyReminderTime: e.target.value,
                      reminderTime: e.target.value,
                    }))
                  }
                />
              </div>
            )}
            <p className="settings-notify-caption">{t('settings.dailyReminderCaption')}</p>
          </div>

          <div className="settings-notify-block">
            <SettingsSwitch
              id="advance-reminders"
              label={t('settings.advanceReminder')}
              strong
              checked={!!draft.advanceReminders}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  advanceReminders: e.target.checked,
                }))
              }
            />
            {draft.advanceReminders && (
              <div className="settings-notify-fields settings-notify-fields--split">
                <div className="settings-notify-labeled">
                  <label htmlFor="advance-days">{t('settings.daysBeforeDue')}</label>
                  <input
                    id="advance-days"
                    type="number"
                    className="form-control"
                    value={draft.advanceDays}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        advanceDays: parseInt(e.target.value, 10) || 3,
                      }))
                    }
                    min="1"
                    max="30"
                  />
                </div>
                <div className="settings-notify-labeled">
                  <label htmlFor="advance-reminder-time">{t('settings.time')}</label>
                  <SettingsTimeField
                    id="advance-reminder-time"
                    value={draft.advanceReminderTime || draft.reminderTime || '09:00'}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        advanceReminderTime: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            )}
            <p className="settings-notify-caption">{t('settings.advanceReminderCaption')}</p>
          </div>

          <div className="settings-notify-block">
            <SettingsSwitch
              id="weekly-summary"
              label={t('settings.weeklySummary')}
              strong
              checked={!!draft.weeklySummary}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  weeklySummary: e.target.checked,
                }))
              }
            />
            {draft.weeklySummary && (
              <div className="settings-notify-fields settings-notify-fields--split">
                <select
                  id="weekly-summary-day"
                  className="form-select"
                  value={draft.weeklySummaryDay ?? 1}
                  aria-label={t('settings.dayOfWeek')}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      weeklySummaryDay: parseInt(e.target.value, 10),
                    }))
                  }
                >
                  {NOTIFICATION_WEEKDAYS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {t(d.labelKey)}
                    </option>
                  ))}
                </select>
                <SettingsTimeField
                  id="weekly-summary-time"
                  value={draft.weeklySummaryTime || '08:00'}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      weeklySummaryTime: e.target.value,
                    }))
                  }
                />
              </div>
            )}
            <p className="settings-notify-caption">{t('settings.weeklySummaryCaption')}</p>
          </div>
        </>
      )}

      <button className="settings-save" type="button" onClick={onSave}>
        {t('common.save')}
      </button>
    </div>
  );
}

export default NotificationSettingsGroup;
