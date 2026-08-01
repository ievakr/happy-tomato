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
import TomatoBackground from '../auth/TomatoBackground';
import { getUserAvatarSrc } from '../../utils/userAvatar';
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

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className="settings-row-label">{label}</span>
        {value != null && value !== '' && (
          <span className="settings-row-value">{value}</span>
        )}
        <Icon
          name="expand_more"
          className={`settings-row-chevron settings-row-chevron--expand${
            open ? ' settings-row-chevron--open' : ''
          }`}
        />
      </button>
      {open && (
        <div id={panelId} className="settings-collapse-body">
          {children}
        </div>
      )}
    </>
  );
}

function AccountSettings() {
  const { currentUser, deleteAccount, updateUserProfile, changeEmail, changePassword } = useAuth();
  const { t, language, setLanguage, languages } = useTranslation();
  const { showSuccess, showError } = useToast();
  const pushNotifications = usePushNotifications();
  const [openPanel, setOpenPanel] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [emailDraft, setEmailDraft] = useState(pushNotifications.pushPreferences);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);
  const [emailChangeError, setEmailChangeError] = useState('');
  const [currentPasswordForChange, setCurrentPasswordForChange] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');

  const isGoogleUser = currentUser?.providerData.some(
    (provider) => provider.providerId === 'google.com'
  );

  const currentLanguageLabel =
    languages.find((lng) => lng.code === language)?.nativeLabel || language;

  const closePanel = () => setOpenPanel(null);

  const togglePanel = (id) => {
    const current = openPanel;
    const next = current === id ? null : id;

    if (next === 'name') {
      setDisplayName(currentUser?.displayName || '');
    }
    if (current === 'email' && next !== 'email') {
      setNewEmail('');
      setEmailPassword('');
      setEmailChangeError('');
    }
    if (current === 'password' && next !== 'password') {
      setCurrentPasswordForChange('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowNewPassword(false);
      setShowConfirmNewPassword(false);
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

  useEffect(() => {
    setDisplayName(currentUser?.displayName || '');
  }, [currentUser?.displayName]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    setSavingProfile(true);
    try {
      const newName = displayName.trim() || null;
      await updateUserProfile({ displayName: newName });
      pushNotifications.updatePushPreferences({
        ...pushNotifications.pushPreferences,
        userId: currentUser.uid,
        userEmail: currentUser.email || pushNotifications.pushPreferences.userEmail,
        userName: newName || currentUser.displayName,
      });
      showSuccess(t('settings.profileUpdated'));
      closePanel();
    } catch (err) {
      showError(err.message || t('settings.profileUpdateFailed'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    setEmailChangeError('');

    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail || trimmedEmail.toLowerCase() === (currentUser?.email || '').toLowerCase()) {
      setEmailChangeError(t('settings.enterDifferentEmail'));
      return;
    }
    if (!emailPassword) {
      setEmailChangeError(t('settings.enterPasswordError'));
      return;
    }

    try {
      setChangingEmail(true);
      await changeEmail(trimmedEmail, emailPassword);
      showSuccess(t('settings.emailChangeSent', { email: trimmedEmail }));
      setNewEmail('');
      setEmailPassword('');
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
      setShowNewPassword(false);
      setShowConfirmNewPassword(false);
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

  return (
    <div className="settings-page h-100 overflow-auto">
      <div className="settings-hero" aria-hidden="true">
        <div className="settings-hero-clip">
          <TomatoBackground cols={7} rows={3} maxSize={72} minSize={32} seed={42} />
        </div>
        <div className="settings-avatar-wrap">
          <img
            src={getUserAvatarSrc(currentUser)}
            alt=""
            className="settings-avatar"
          />
        </div>
      </div>

      <div className="settings-body">
        <h2 className="settings-section-title">{t('settings.accountDetails')}</h2>

        <div className="settings-group">
          <SettingsCollapseRow
            id="name"
            label={t('settings.name')}
            value={currentUser?.displayName || t('settings.notSet')}
            open={openPanel === 'name'}
            onToggle={() => togglePanel('name')}
          >
            <form onSubmit={handleSaveProfile} className="d-grid gap-2">
              <div>
                <label htmlFor="edit-display-name" className="form-label small mb-1">
                  {t('settings.name')}
                </label>
                <input
                  id="edit-display-name"
                  type="text"
                  className="form-control"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t('settings.namePlaceholder')}
                  disabled={savingProfile}
                  autoFocus
                />
              </div>
              <div className="settings-collapse-actions">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closePanel}
                  disabled={savingProfile}
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-success" disabled={savingProfile}>
                  {savingProfile ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </SettingsCollapseRow>
        </div>

        <div className="settings-group">
          <SettingsCollapseRow
            id="email"
            label={t('settings.email')}
            value={currentUser?.email || ''}
            open={openPanel === 'email'}
            onToggle={() => togglePanel('email')}
            disabled={isGoogleUser}
          >
            <form onSubmit={handleChangeEmail} className="d-grid gap-2">
              {emailChangeError && (
                <div className="alert alert-danger mb-0 py-2">{emailChangeError}</div>
              )}
              <div>
                <label htmlFor="new-email" className="form-label small mb-1">
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
              <div>
                <label htmlFor="email-change-password" className="form-label small mb-1">
                  {t('settings.currentPassword')}
                </label>
                <input
                  id="email-change-password"
                  type="password"
                  className="form-control"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder={t('settings.passwordPlaceholder')}
                  disabled={changingEmail}
                  autoComplete="current-password"
                />
              </div>
              <div className="settings-collapse-actions">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closePanel}
                  disabled={changingEmail}
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-success" disabled={changingEmail}>
                  {changingEmail ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </SettingsCollapseRow>

          <SettingsCollapseRow
            id="password"
            label={t('settings.password')}
            value="••••••••"
            open={openPanel === 'password'}
            onToggle={() => togglePanel('password')}
            disabled={isGoogleUser}
          >
            <form onSubmit={handleChangePassword} className="d-grid gap-2">
              {passwordChangeError && (
                <div className="alert alert-danger mb-0 py-2">{passwordChangeError}</div>
              )}
              <div>
                <label htmlFor="current-password-for-change" className="form-label small mb-1">
                  {t('settings.currentPassword')}
                </label>
                <input
                  id="current-password-for-change"
                  type="password"
                  className="form-control"
                  value={currentPasswordForChange}
                  onChange={(e) => setCurrentPasswordForChange(e.target.value)}
                  placeholder={t('settings.passwordPlaceholder')}
                  disabled={changingPassword}
                  autoComplete="current-password"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="new-password" className="form-label small mb-1">
                  {t('settings.newPassword')}
                </label>
                <div className="input-group">
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    className="form-control"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('settings.newPasswordPlaceholder')}
                    disabled={changingPassword}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowNewPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    <Icon name={showNewPassword ? 'visibility_off' : 'visibility'} />
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirm-new-password" className="form-label small mb-1">
                  {t('settings.confirmNewPassword')}
                </label>
                <div className="input-group">
                  <input
                    id="confirm-new-password"
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    className="form-control"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder={t('settings.confirmNewPasswordPlaceholder')}
                    disabled={changingPassword}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowConfirmNewPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    <Icon name={showConfirmNewPassword ? 'visibility_off' : 'visibility'} />
                  </button>
                </div>
              </div>
              <div className="settings-collapse-actions">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closePanel}
                  disabled={changingPassword}
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-success" disabled={changingPassword}>
                  {changingPassword ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </SettingsCollapseRow>
        </div>

        <div className="settings-group">
          <SettingsCollapseRow
            id="language"
            label={t('auth.language')}
            value={currentLanguageLabel}
            open={openPanel === 'language'}
            onToggle={() => togglePanel('language')}
          >
            {languages.map((lng) => {
              const active = lng.code === language;
              return (
                <button
                  key={lng.code}
                  type="button"
                  className="settings-language-option"
                  onClick={() => {
                    setLanguage(lng.code);
                    closePanel();
                  }}
                >
                  <span>{lng.nativeLabel}</span>
                  {active && (
                    <Icon name="check" className="settings-language-check" />
                  )}
                </button>
              );
            })}
          </SettingsCollapseRow>
        </div>

        <div className="settings-group">
          <SettingsCollapseRow
            id="notifications"
            label={t('settings.tab.notifications')}
            value={emailDraft.enabled ? t('settings.on') : t('settings.off')}
            open={openPanel === 'notifications'}
            onToggle={() => togglePanel('notifications')}
          >
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="email-notifications"
                checked={emailDraft.enabled}
                onChange={(e) =>
                  setEmailDraft((prev) => ({
                    ...prev,
                    enabled: e.target.checked,
                  }))
                }
              />
              <label className="form-check-label" htmlFor="email-notifications">
                {t('settings.enablePush')}
              </label>
            </div>

            {emailDraft.enabled && (
              <div className="d-grid gap-3 mt-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="daily-reminder"
                    checked={emailDraft.dailyReminder}
                    onChange={(e) =>
                      setEmailDraft((prev) => ({
                        ...prev,
                        dailyReminder: e.target.checked,
                      }))
                    }
                  />
                  <label className="form-check-label" htmlFor="daily-reminder">
                    {t('settings.dailyRemindersOverdue')}
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="advance-reminders"
                    checked={emailDraft.advanceReminders}
                    onChange={(e) =>
                      setEmailDraft((prev) => ({
                        ...prev,
                        advanceReminders: e.target.checked,
                      }))
                    }
                  />
                  <label className="form-check-label" htmlFor="advance-reminders">
                    {t('settings.advanceReminders')}
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="weekly-summary"
                    checked={emailDraft.weeklySummary ?? false}
                    onChange={(e) =>
                      setEmailDraft((prev) => ({
                        ...prev,
                        weeklySummary: e.target.checked,
                      }))
                    }
                  />
                  <label className="form-check-label" htmlFor="weekly-summary">
                    {t('settings.weeklySummary')}
                  </label>
                </div>

                {emailDraft.dailyReminder && (
                  <div className="border rounded p-3 bg-light bg-opacity-50">
                    <div className="fw-semibold mb-2">{t('settings.todayReminder')}</div>
                    <label className="form-label small mb-1" htmlFor="daily-reminder-time">
                      {t('settings.time')}
                    </label>
                    <input
                      id="daily-reminder-time"
                      type="time"
                      className="form-control"
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

                {emailDraft.advanceReminders && (
                  <div className="border rounded p-3 bg-light bg-opacity-50">
                    <div className="fw-semibold mb-2">{t('settings.advanceReminder')}</div>
                    <label className="form-label small mb-1" htmlFor="advance-days">
                      {t('settings.daysBeforeDue')}
                    </label>
                    <input
                      id="advance-days"
                      type="number"
                      className="form-control mb-2"
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
                    <label className="form-label small mb-1" htmlFor="advance-reminder-time">
                      {t('settings.time')}
                    </label>
                    <input
                      id="advance-reminder-time"
                      type="time"
                      className="form-control"
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
                )}

                {emailDraft.weeklySummary && (
                  <div className="border rounded p-3 bg-light bg-opacity-50">
                    <div className="fw-semibold mb-2">{t('settings.weeklySummary')}</div>
                    <label className="form-label small mb-1" htmlFor="weekly-summary-day">
                      {t('settings.dayOfWeek')}
                    </label>
                    <select
                      id="weekly-summary-day"
                      className="form-select mb-2"
                      value={emailDraft.weeklySummaryDay ?? 1}
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
                    <label className="form-label small mb-1" htmlFor="weekly-summary-time">
                      {t('settings.time')}
                    </label>
                    <input
                      id="weekly-summary-time"
                      type="time"
                      className="form-control"
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
              </div>
            )}

            <div className="settings-collapse-actions">
              <button
                className="btn btn-success"
                type="button"
                onClick={handleSaveEmailPreferences}
              >
                {t('common.save')}
              </button>
            </div>
          </SettingsCollapseRow>
        </div>

        <div className="settings-group">
          <button
            type="button"
            className="settings-row settings-row--danger"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <span className="settings-row-label">{t('settings.deleteAccount')}</span>
          </button>
        </div>
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
