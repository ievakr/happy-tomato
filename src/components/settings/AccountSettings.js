import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { deleteAllUserData } from '../../utils/deleteUserData';
import { Capacitor } from '@capacitor/core';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import pushService from '../../services/pushService';
import { useTranslation } from '../../i18n/LanguageContext';

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

function AccountSettings({ onClose }) {
  const { currentUser, deleteAccount, updateUserProfile } = useAuth();
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const pushNotifications = usePushNotifications();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('account'); // 'account' or 'notifications'
  const [emailDraft, setEmailDraft] = useState(pushNotifications.pushPreferences);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const isGoogleUser = currentUser?.providerData.some(
    provider => provider.providerId === 'google.com'
  );

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
      userName: currentUser?.displayName || pushNotifications.pushPreferences.userName
    });
  }, [currentUser?.uid, currentUser?.email, currentUser?.displayName, pushNotifications.pushPreferences]);

  useEffect(() => {
    setDisplayName(currentUser?.displayName || '');
  }, [currentUser?.displayName]);

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setSavingProfile(true);
    try {
      const newName = displayName.trim() || null;
      await updateUserProfile({ displayName: newName });
      pushNotifications.updatePushPreferences({
        ...pushNotifications.pushPreferences,
        userId: currentUser.uid,
        userEmail: currentUser.email || pushNotifications.pushPreferences.userEmail,
        userName: newName || currentUser.displayName
      });
      showSuccess(t('settings.profileUpdated'));
    } catch (err) {
      showError(err.message || t('settings.profileUpdateFailed'));
    } finally {
      setSavingProfile(false);
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

      // Step 1: Delete user's Firestore data (events, plants, notifications, saved to-dos)
      await deleteAllUserData(currentUser.uid, {
        userEmail: currentUser.email ?? undefined,
      });

      // Step 2: Clear local notification prefs (FCM tokens are removed from Firestore above)
      pushNotifications.resetPushPreferences();

      // Step 3: Delete the Firebase Auth account
      await deleteAccount(isGoogleUser ? null : password);

      // User is automatically logged out and redirected to login screen
    } catch (err) {
      
      if (err.code === 'auth/wrong-password') {
        setError(t('settings.incorrectPassword'));
      } else if (err.code === 'auth/requires-recent-login') {
        setError(t('settings.requiresRecentLogin'));
      } else if (err.message.includes('popup')) {
        setError(t('settings.allowPopups'));
      } else {
        setError(t('settings.deleteFailed', { message: err.message }));
      }
      
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">{t('settings.title')}</h4>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                disabled={deleting}
                aria-label={t('common.close')}
              />
            </div>
            <div className="modal-body">
              <ul className="nav nav-tabs mb-3">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'account' ? 'active' : ''}`}
                    onClick={() => setActiveTab('account')}
                    disabled={deleting}
                    type="button"
                  >
                    <span className="material-icons-outlined me-1">person</span>
                    {t('settings.tab.account')}
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'notifications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('notifications')}
                    disabled={deleting}
                    type="button"
                  >
                    <span className="material-icons-outlined me-1">notifications</span>
                    {t('settings.tab.notifications')}
                  </button>
                </li>
              </ul>

              {activeTab === 'account' && (
                <div className="d-grid gap-3">
                  <div className="card">
                    <div className="card-body">
                      <h5 className="card-title">{t('settings.accountInformation')}</h5>
                      <div className="row g-2">
                        <div className="col-12">
                          <label className="form-label text-muted">{t('settings.name')}</label>
                          <div className="d-flex gap-2">
                            <input
                              type="text"
                              className="form-control"
                              value={displayName}
                              onChange={(e) => setDisplayName(e.target.value)}
                              placeholder={t('settings.namePlaceholder')}
                            />
                            <button
                              type="button"
                              className="btn btn-success"
                              onClick={handleSaveProfile}
                              disabled={savingProfile || displayName === (currentUser?.displayName || '')}
                            >
                              {savingProfile ? t('common.saving') : t('common.save')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card border-danger">
                    <div className="card-body">
                      <h5 className="card-title text-danger">{t('settings.accountManagement')}</h5>
                      {!showDeleteConfirm ? (
                        <div>
                          <p className="text-muted">
                            {t('settings.deleteDescription')}
                          </p>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={deleting}
                            type="button"
                          >
                            {t('settings.deleteAccount')}
                          </button>
                        </div>
                      ) : (
                        <div className="d-grid gap-3">
                          <div className="alert alert-danger">
                            <strong>{t('settings.warning')}</strong> {t('settings.cannotUndo')}
                            <ul className="mb-0 mt-2">
                              <li>{t('settings.deleteBullet1')}</li>
                              <li>{t('settings.deleteBullet2')}</li>
                              <li>{t('settings.deleteBullet3')}</li>
                            </ul>
                          </div>

                          {error && <div className="alert alert-danger">{error}</div>}

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
                            <div className="alert alert-info mb-0">
                              {t('settings.googleReauthNotice')}
                            </div>
                          )}

                          <div className="d-flex flex-column flex-sm-row gap-2 justify-content-end">
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => {
                                setShowDeleteConfirm(false);
                                setPassword('');
                                setError('');
                              }}
                              disabled={deleting}
                              type="button"
                            >
                              {t('common.cancel')}
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={handleDeleteAccount}
                              disabled={deleting || (!isGoogleUser && !password)}
                              type="button"
                            >
                              {deleting ? t('settings.deleting') : t('settings.deleteMyAccount')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="d-grid gap-3">
                  <div className="card">
                    <div className="card-body">
                      <h5 className="card-title">{t('settings.pushNotifications')}</h5>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="email-notifications"
                          checked={emailDraft.enabled}
                          onChange={(e) => setEmailDraft(prev => ({
                            ...prev,
                            enabled: e.target.checked
                          }))}
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
                              onChange={(e) => setEmailDraft(prev => ({
                                ...prev,
                                dailyReminder: e.target.checked
                              }))}
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
                              onChange={(e) => setEmailDraft(prev => ({
                                ...prev,
                                advanceReminders: e.target.checked
                              }))}
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
                              onChange={(e) => setEmailDraft(prev => ({
                                ...prev,
                                weeklySummary: e.target.checked
                              }))}
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
                      <div className="d-flex justify-content-end mt-3">
                        <button
                          className="btn btn-success"
                          type="button"
                          onClick={handleSaveEmailPreferences}
                        >
                          {t('common.save')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}

export default AccountSettings;

