import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { deleteAllUserData } from '../../utils/deleteUserData';
import { MIN_PASSWORD_LENGTH } from '../../utils/authValidation';
import { Capacitor } from '@capacitor/core';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import pushService from '../../services/pushService';
import { useTranslation } from '../../i18n/LanguageContext';
import { readOfflinePreview, writeOfflinePreview } from '../../utils/offlinePreview';
import { useAuthError } from '../auth/useAuthError';
import { SettingsCollapseRow, SettingsSwitch } from './settingsControls';
import NotificationSettingsGroup from './NotificationSettingsGroup';
import DeleteAccountModal from './DeleteAccountModal';
import './AccountSettings.css';

function accountInitial(user, language) {
  const source = (user?.displayName || user?.email || '').trim();
  const letter = Array.from(source)[0] || '';
  return letter ? letter.toLocaleUpperCase(language) : '?';
}

function AccountSettings() {
  const { currentUser, deleteAccount, changeEmail, changePassword } = useAuth();
  const { t, language } = useTranslation();
  const { showSuccess } = useToast();
  const pushNotifications = usePushNotifications();
  const [openPanel, setOpenPanel] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const deleteError = useAuthError();
  const [deleting, setDeleting] = useState(false);
  const [emailDraft, setEmailDraft] = useState(pushNotifications.pushPreferences);
  const [offlinePreview, setOfflinePreview] = useState(readOfflinePreview);
  const [newEmail, setNewEmail] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);
  const emailChangeError = useAuthError();
  const [currentPasswordForChange, setCurrentPasswordForChange] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const passwordChangeError = useAuthError();

  const isGoogleUser = currentUser?.providerData.some(
    (provider) => provider.providerId === 'google.com'
  );

  const closePanel = () => setOpenPanel(null);

  const togglePanel = (id) => {
    const current = openPanel;
    const next = current === id ? null : id;

    if (current === 'email' && next !== 'email') {
      setNewEmail('');
      emailChangeError.clear();
    }
    if (current === 'password' && next !== 'password') {
      setCurrentPasswordForChange('');
      setNewPassword('');
      setConfirmNewPassword('');
      passwordChangeError.clear();
    }

    setOpenPanel(next);
  };

  const resetDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setPassword('');
    deleteError.clear();
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
    emailChangeError.clear();

    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail || trimmedEmail.toLowerCase() === (currentUser?.email || '').toLowerCase()) {
      emailChangeError.set('settings.enterDifferentEmail');
      return;
    }

    try {
      setChangingEmail(true);
      await changeEmail(trimmedEmail);
      showSuccess(t('settings.emailChangeSent', { email: trimmedEmail }));
      setNewEmail('');
      emailChangeError.clear();
      closePanel();
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        emailChangeError.set('settings.incorrectPassword');
      } else if (err.code === 'auth/requires-recent-login') {
        emailChangeError.set('settings.requiresRecentLogin');
      } else if (err.code === 'auth/email-already-in-use') {
        emailChangeError.set('settings.emailInUse');
      } else if (err.code === 'auth/invalid-email') {
        emailChangeError.set('settings.invalidEmail');
      } else if (err.message?.includes('popup')) {
        emailChangeError.set('settings.allowPopups');
      } else {
        emailChangeError.set('settings.emailChangeFailed');
      }
    } finally {
      setChangingEmail(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    passwordChangeError.clear();

    if (!currentPasswordForChange || !newPassword || !confirmNewPassword) {
      passwordChangeError.set('auth.fillAllFields');
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      passwordChangeError.set('auth.passwordTooShort', { min: MIN_PASSWORD_LENGTH });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      passwordChangeError.set('auth.passwordsNoMatch');
      return;
    }

    try {
      setChangingPassword(true);
      await changePassword(currentPasswordForChange, newPassword);
      showSuccess(t('settings.passwordChanged'));
      setCurrentPasswordForChange('');
      setNewPassword('');
      setConfirmNewPassword('');
      passwordChangeError.clear();
      closePanel();
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        passwordChangeError.set('settings.incorrectPassword');
      } else if (err.code === 'auth/requires-recent-login') {
        passwordChangeError.set('settings.requiresRecentLogin');
      } else if (err.code === 'auth/weak-password') {
        passwordChangeError.set('auth.weakPassword');
      } else {
        passwordChangeError.set('settings.passwordChangeFailed');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!isGoogleUser && !password) {
      deleteError.set('settings.enterPasswordError');
      return;
    }

    try {
      setDeleting(true);
      deleteError.clear();

      await deleteAllUserData(currentUser.uid, {
        userEmail: currentUser.email ?? undefined,
      });

      pushNotifications.resetPushPreferences();

      await deleteAccount(isGoogleUser ? null : password);
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        deleteError.set('settings.incorrectPassword');
      } else if (err.code === 'auth/requires-recent-login') {
        deleteError.set('settings.requiresRecentLogin');
      } else if (err.message?.includes('popup')) {
        deleteError.set('settings.allowPopups');
      } else {
        deleteError.set('settings.deleteFailed', { message: err.message });
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
              {emailChangeError.message && (
                <div className="alert alert-danger mb-0 py-2">{emailChangeError.message}</div>
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
              {passwordChangeError.message && (
                <div className="alert alert-danger mb-0 py-2">{passwordChangeError.message}</div>
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

        <NotificationSettingsGroup
          t={t}
          draft={emailDraft}
          setDraft={setEmailDraft}
          onSave={handleSaveEmailPreferences}
        />

        <button
          type="button"
          className="settings-delete-link"
          onClick={() => setShowDeleteConfirm(true)}
        >
          {t('settings.deleteAccount')}
        </button>
      </div>

      <DeleteAccountModal
        show={showDeleteConfirm}
        onHide={resetDeleteConfirm}
        deleting={deleting}
        error={deleteError.message}
        password={password}
        onPasswordChange={(e) => setPassword(e.target.value)}
        isGoogleUser={isGoogleUser}
        onDelete={handleDeleteAccount}
        t={t}
      />
    </div>
  );
}

export default AccountSettings;
