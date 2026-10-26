import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { deleteAllUserData } from '../../utils/deleteUserData';
import { MIN_PASSWORD_LENGTH } from '../../utils/authValidation';
import { Capacitor } from '@capacitor/core';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import pushService from '../../services/pushService';
import { useTranslation } from '../../i18n/LanguageContext';
import Icon from '../common/Icon';
import { readOfflinePreview, writeOfflinePreview } from '../../utils/offlinePreview';
import './AccountSettings.css';

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

function accountInitial(user, language) {
  const source = (user?.displayName || user?.email || '').trim();
  const letter = Array.from(source)[0] || '';
  return letter ? letter.toLocaleUpperCase(language) : '?';
}

function SettingsTimeField({ id, value, onChange }) {
  return (
    <div className="settings-time-field">
      <input
        id={id}
        type="time"
        className="form-control"
        value={value}
        onChange={onChange}
      />
      <Icon name="schedule" className="settings-time-icon" aria-hidden />
    </div>
  );
}

function SettingsSwitch({ id, label, checked, onChange, strong = false }) {
  return (
    <div className={`settings-switch-row${strong ? ' settings-switch-row--strong' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={onChange}
      />
    </div>
  );
}

function SettingsCollapseRow({
  id,
  label,
  value,
  open,
  onToggle,
  children,
  danger = false,
  disabled = false,
}) {
  const panelId = `settings-panel-${id}`;
  const className = `settings-row${danger ? ' settings-row--danger' : ''}`;
  const chevron = (
    <Icon
      name="expand_more"
      className={`settings-row-chevron settings-row-chevron--expand${
        open ? ' settings-row-chevron--open' : ''
      }`}
    />
  );

  if (disabled) {
    return (
      <div className={className}>
        <span className="settings-row-label">{label}</span>
        {value != null && value !== '' && (
          <span className="settings-row-value">{value}</span>
        )}
      </div>
    );
  }

  if (open) {
    return (
      <div className="settings-editor">
        <button
          type="button"
          className="settings-editor-toggle"
          onClick={onToggle}
          aria-expanded="true"
          aria-controls={panelId}
        >
          <span className="settings-row-label" id={`${panelId}-label`}>
            {label}
          </span>
          {chevron}
        </button>
        <div
          id={panelId}
          className="settings-editor-body"
          role="region"
          aria-labelledby={`${panelId}-label`}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onToggle}
      aria-expanded="false"
      aria-controls={panelId}
    >
      <span className="settings-row-label">{label}</span>
      {value != null && value !== '' && (
        <span className="settings-row-value">{value}</span>
      )}
      {chevron}
    </button>
  );
}

function AccountSettings() {
  const { currentUser, deleteAccount, changeEmail, changePassword } = useAuth();
  const { t, language } = useTranslation();
  const { showSuccess } = useToast();
  const pushNotifications = usePushNotifications();
  const [openPanel, setOpenPanel] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [emailDraft, setEmailDraft] = useState(pushNotifications.pushPreferences);
  const [offlinePreview, setOfflinePreview] = useState(readOfflinePreview);
  const [newEmail, setNewEmail] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);
  const [emailChangeError, setEmailChangeError] = useState('');
  const [currentPasswordForChange, setCurrentPasswordForChange] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');

  const isGoogleUser = currentUser?.providerData.some(
    (provider) => provider.providerId === 'google.com'
  );

  const closePanel = () => setOpenPanel(null);

  const togglePanel = (id) => {
    const current = openPanel;
    const next = current === id ? null : id;

    if (current === 'email' && next !== 'email') {
      setNewEmail('');
      setEmailChangeError('');
    }
    if (current === 'password' && next !== 'password') {
      setCurrentPasswordForChange('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordChangeError('');
    }

    setOpenPanel(next);
  };

  const resetDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setPassword('');
    setError('');
  };

  const handleSaveEmailPreferences = async () => {
    if (emailDraft.enabled) {
      if (Capacitor.isNativePlatform()) {
        await pushService.requestNativePushPermission();
      } else if (
        typeof Notification !== 'undefined' &&
        Notification.permission === 'default'
      ) {
        await Notification.requestPermission();
      }
    }
    const payload = {
      ...emailDraft,
      reminderTime:
        emailDraft.dailyReminderTime ||
        emailDraft.reminderTime ||
        '09:00',
      userId: currentUser?.uid || emailDraft.userId,
      ...(currentUser?.email && { userEmail: currentUser.email }),
      userName: currentUser?.displayName || emailDraft.userName,
    };
    pushNotifications.updatePushPreferences(payload);
    showSuccess(t('settings.notificationsSaved'));
  };

  useEffect(() => {
    setEmailDraft({
      ...pushNotifications.pushPreferences,
      userId: currentUser?.uid || pushNotifications.pushPreferences.userId,
      ...(currentUser?.email && { userEmail: currentUser.email }),
      userName: currentUser?.displayName || pushNotifications.pushPreferences.userName,
    });
  }, [
    currentUser?.uid,
    currentUser?.email,
    currentUser?.displayName,
    pushNotifications.pushPreferences,
  ]);

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    setEmailChangeError('');

    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail || trimmedEmail.toLowerCase() === (currentUser?.email || '').toLowerCase()) {
      setEmailChangeError(t('settings.enterDifferentEmail'));
      return;
    }

    try {
      setChangingEmail(true);
      await changeEmail(trimmedEmail);
      showSuccess(t('settings.emailChangeSent', { email: trimmedEmail }));
      setNewEmail('');
      setEmailChangeError('');
      closePanel();
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        setEmailChangeError(t('settings.incorrectPassword'));
      } else if (err.code === 'auth/requires-recent-login') {
        setEmailChangeError(t('settings.requiresRecentLogin'));
      } else if (err.code === 'auth/email-already-in-use') {
        setEmailChangeError(t('settings.emailInUse'));
      } else if (err.code === 'auth/invalid-email') {
        setEmailChangeError(t('settings.invalidEmail'));
      } else if (err.message?.includes('popup')) {
        setEmailChangeError(t('settings.allowPopups'));
      } else {
        setEmailChangeError(t('settings.emailChangeFailed'));
      }
    } finally {
      setChangingEmail(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordChangeError('');

    if (!currentPasswordForChange || !newPassword || !confirmNewPassword) {
      setPasswordChangeError(t('auth.fillAllFields'));
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordChangeError(t('auth.passwordTooShort', { min: MIN_PASSWORD_LENGTH }));
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError(t('auth.passwordsNoMatch'));
      return;
    }

    try {
      setChangingPassword(true);
      await changePassword(currentPasswordForChange, newPassword);
      showSuccess(t('settings.passwordChanged'));
      setCurrentPasswordForChange('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordChangeError('');
      closePanel();
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        setPasswordChangeError(t('settings.incorrectPassword'));
      } else if (err.code === 'auth/requires-recent-login') {
        setPasswordChangeError(t('settings.requiresRecentLogin'));
      } else if (err.code === 'auth/weak-password') {
        setPasswordChangeError(t('auth.weakPassword'));
      } else {
        setPasswordChangeError(t('settings.passwordChangeFailed'));
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!isGoogleUser && !password) {
      setError(t('settings.enterPasswordError'));
      return;
    }

    try {
      setDeleting(true);
      setError('');

      await deleteAllUserData(currentUser.uid, {
        userEmail: currentUser.email ?? undefined,
      });

      pushNotifications.resetPushPreferences();

      await deleteAccount(isGoogleUser ? null : password);
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        setError(t('settings.incorrectPassword'));
      } else if (err.code === 'auth/requires-recent-login') {
        setError(t('settings.requiresRecentLogin'));
      } else if (err.message?.includes('popup')) {
        setError(t('settings.allowPopups'));
      } else {
        setError(t('settings.deleteFailed', { message: err.message }));
      }

      setDeleting(false);
    }
  };

  const accountName = currentUser?.displayName?.trim() || '';

  return (
    <div className="settings-page h-100 overflow-auto">
      <div className="settings-body">
        <div className="settings-group">
          <h2 className="settings-card-title">{t('settings.accountDetails')}</h2>
          <div className="settings-profile">
            <span className="settings-profile-avatar" aria-hidden>
              {accountInitial(currentUser, language)}
            </span>
            <div className="settings-profile-copy">
              <div className="settings-profile-name">{accountName || currentUser?.email}</div>
              {accountName && currentUser?.email ? (
                <div className="settings-profile-email">{currentUser.email}</div>
              ) : null}
            </div>
          </div>
          <SettingsCollapseRow
            id="email"
            label={t('settings.changeEmail')}
            open={openPanel === 'email'}
            onToggle={() => togglePanel('email')}
            disabled={isGoogleUser}
          >
            <form onSubmit={handleChangeEmail} className="settings-editor-form">
              {emailChangeError && (
                <div className="alert alert-danger mb-0 py-2">{emailChangeError}</div>
              )}
              <div className="settings-field">
                <label htmlFor="current-email" className="settings-field-label">
                  {t('settings.email')}
                </label>
                <input
                  id="current-email"
                  type="email"
                  className="form-control"
                  value={currentUser?.email || ''}
                  readOnly
                />
              </div>
              <div className="settings-field">
                <label htmlFor="new-email" className="settings-field-label">
                  {t('settings.newEmail')}
                </label>
                <input
                  id="new-email"
                  type="email"
                  className="form-control"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder={t('settings.newEmailPlaceholder')}
                  disabled={changingEmail}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              <div className="settings-editor-actions">
                <button type="submit" className="btn settings-editor-save" disabled={changingEmail}>
                  {changingEmail ? t('common.saving') : t('forms.update')}
                </button>
                <button
                  type="button"
                  className="btn settings-editor-cancel"
                  onClick={closePanel}
                  disabled={changingEmail}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </SettingsCollapseRow>

          <SettingsCollapseRow
            id="password"
            label={t('settings.changePassword')}
            open={openPanel === 'password'}
            onToggle={() => togglePanel('password')}
            disabled={isGoogleUser}
          >
            <form onSubmit={handleChangePassword} className="settings-editor-form">
              {passwordChangeError && (
                <div className="alert alert-danger mb-0 py-2">{passwordChangeError}</div>
              )}
              <div className="settings-field">
                <label htmlFor="current-password-for-change" className="settings-field-label">
                  {t('settings.currentPassword')}
                </label>
                <input
                  id="current-password-for-change"
                  type="password"
                  className="form-control"
                  value={currentPasswordForChange}
                  onChange={(e) => setCurrentPasswordForChange(e.target.value)}
                  disabled={changingPassword}
                  autoComplete="current-password"
                  autoFocus
                />
              </div>
              <div className="settings-field">
                <label htmlFor="new-password" className="settings-field-label">
                  {t('settings.newPassword')}
                </label>
                <input
                  id="new-password"
                  type="password"
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={changingPassword}
                  autoComplete="new-password"
                />
              </div>
              <div className="settings-field">
                <label htmlFor="confirm-new-password" className="settings-field-label">
                  {t('settings.confirmNewPassword')}
                </label>
                <input
                  id="confirm-new-password"
                  type="password"
                  className="form-control"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  disabled={changingPassword}
                  autoComplete="new-password"
                />
              </div>
              <div className="settings-editor-actions">
                <button type="submit" className="btn settings-editor-save" disabled={changingPassword}>
                  {changingPassword ? t('common.saving') : t('forms.update')}
                </button>
                <button
                  type="button"
                  className="btn settings-editor-cancel"
                  onClick={closePanel}
                  disabled={changingPassword}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </SettingsCollapseRow>
          <SettingsSwitch
            id="offline-preview"
            label={t('settings.offlinePreview')}
            checked={offlinePreview}
            onChange={(e) => {
              const next = e.target.checked;
              setOfflinePreview(next);
              writeOfflinePreview(next);
            }}
          />
        </div>

        <div className="settings-group">
          <h2 className="settings-card-title">{t('settings.tab.notifications')}</h2>
          <SettingsSwitch
            id="email-notifications"
            label={t('settings.pushNotifications')}
            strong
            checked={emailDraft.enabled}
            onChange={(e) =>
              setEmailDraft((prev) => ({
                ...prev,
                enabled: e.target.checked,
              }))
            }
          />

          {emailDraft.enabled && (
            <>
              <div className="settings-notify-block">
                <SettingsSwitch
                  id="daily-reminder"
                  label={t('settings.dailyReminder')}
                  strong
                  checked={!!emailDraft.dailyReminder}
                  onChange={(e) =>
                    setEmailDraft((prev) => ({
                      ...prev,
                      dailyReminder: e.target.checked,
                    }))
                  }
                />
                {emailDraft.dailyReminder && (
                  <div className="settings-notify-fields">
                    <SettingsTimeField
                      id="daily-reminder-time"
                      value={
                        emailDraft.dailyReminderTime ||
                        emailDraft.reminderTime ||
                        '09:00'
                      }
                      onChange={(e) =>
                        setEmailDraft((prev) => ({
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
                  checked={!!emailDraft.advanceReminders}
                  onChange={(e) =>
                    setEmailDraft((prev) => ({
                      ...prev,
                      advanceReminders: e.target.checked,
                    }))
                  }
                />
                {emailDraft.advanceReminders && (
                  <div className="settings-notify-fields settings-notify-fields--split">
                    <div className="settings-notify-labeled">
                      <label htmlFor="advance-days">{t('settings.daysBeforeDue')}</label>
                      <input
                        id="advance-days"
                        type="number"
                        className="form-control"
                        value={emailDraft.advanceDays}
                        onChange={(e) =>
                          setEmailDraft((prev) => ({
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
                        value={
                          emailDraft.advanceReminderTime ||
                          emailDraft.reminderTime ||
                          '09:00'
                        }
                        onChange={(e) =>
                          setEmailDraft((prev) => ({
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
                  checked={!!emailDraft.weeklySummary}
                  onChange={(e) =>
                    setEmailDraft((prev) => ({
                      ...prev,
                      weeklySummary: e.target.checked,
                    }))
                  }
                />
                {emailDraft.weeklySummary && (
                  <div className="settings-notify-fields settings-notify-fields--split">
                    <select
                      id="weekly-summary-day"
                      className="form-select"
                      value={emailDraft.weeklySummaryDay ?? 1}
                      aria-label={t('settings.dayOfWeek')}
                      onChange={(e) =>
                        setEmailDraft((prev) => ({
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
                      value={emailDraft.weeklySummaryTime || '08:00'}
                      onChange={(e) =>
                        setEmailDraft((prev) => ({
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

          <button
            className="settings-save"
            type="button"
            onClick={handleSaveEmailPreferences}
          >
            {t('common.save')}
          </button>
        </div>

        <button
          type="button"
          className="settings-delete-link"
          onClick={() => setShowDeleteConfirm(true)}
        >
          {t('settings.deleteAccount')}
        </button>
      </div>

      <Modal show={showDeleteConfirm} onHide={resetDeleteConfirm} centered>
        <Modal.Header closeButton={!deleting}>
          <Modal.Title>{t('settings.deleteAccount')}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-grid gap-3">
          <div className="alert alert-danger mb-0">
            <strong>{t('settings.warning')}</strong> {t('settings.cannotUndo')}
            <ul className="mb-0 mt-2">
              <li>{t('settings.deleteBullet1')}</li>
              <li>{t('settings.deleteBullet2')}</li>
              <li>{t('settings.deleteBullet3')}</li>
            </ul>
          </div>

          {error && <div className="alert alert-danger mb-0">{error}</div>}

          {!isGoogleUser && (
            <div>
              <label htmlFor="confirm-password" className="form-label">
                {t('settings.enterPasswordConfirm')}
              </label>
              <input
                id="confirm-password"
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('settings.passwordPlaceholder')}
                disabled={deleting}
                autoComplete="current-password"
              />
            </div>
          )}

          {isGoogleUser && (
            <div className="alert alert-info mb-0">{t('settings.googleReauthNotice')}</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={resetDeleteConfirm}
            disabled={deleting}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDeleteAccount}
            disabled={deleting || (!isGoogleUser && !password)}
          >
            {deleting ? t('settings.deleting') : t('settings.deleteMyAccount')}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default AccountSettings;
