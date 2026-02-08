import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { deleteAllUserData } from '../../utils/deleteUserData';
import { useEmailNotifications } from '../../hooks/useEmailNotifications';

function AccountSettings({ onClose }) {
  const { currentUser, deleteAccount } = useAuth();
  const { showSuccess } = useToast();
  const emailNotifications = useEmailNotifications();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('account'); // 'account' or 'notifications'
  const [emailDraft, setEmailDraft] = useState(emailNotifications.emailPreferences);

  const isGoogleUser = currentUser?.providerData.some(
    provider => provider.providerId === 'google.com'
  );

  const handleSaveEmailPreferences = () => {
    emailNotifications.updateEmailPreferences(emailDraft);
    showSuccess('Email notification settings saved.');
  };

  useEffect(() => {
    setEmailDraft(emailNotifications.emailPreferences);
  }, [emailNotifications.emailPreferences]);

  const handleDeleteAccount = async () => {
    if (!isGoogleUser && !password) {
      setError('Please enter your password to confirm deletion');
      return;
    }

    try {
      setDeleting(true);
      setError('');

      // Step 1: Delete user's events and data
      console.log('Deleting user data...');
      await deleteAllUserData(currentUser.uid);

      // Step 2: Delete the Firebase Auth account
      console.log('Deleting user account...');
      await deleteAccount(isGoogleUser ? null : password);

      // User is automatically logged out and redirected to login screen
      console.log('Account deleted successfully');
    } catch (err) {
      console.error('Error deleting account:', err);
      
      if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/requires-recent-login') {
        setError('For security reasons, please log out and log back in before deleting your account.');
      } else if (err.message.includes('popup')) {
        setError('Please allow popups to reauthenticate with Google.');
      } else {
        setError('Failed to delete account: ' + err.message);
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
              <h4 className="modal-title">Settings</h4>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                disabled={deleting}
                aria-label="Close"
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
                    Account
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
                    Notifications
                  </button>
                </li>
              </ul>

              {activeTab === 'account' && (
                <div className="d-grid gap-3">
                  <div className="card">
                    <div className="card-body">
                      <h5 className="card-title">Account Information</h5>
                      <div className="row g-2">
                        <div className="col-12">
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Name</span>
                            <span>{currentUser?.displayName || 'Not set'}</span>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Email</span>
                            <span>{currentUser?.email}</span>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Sign-in method</span>
                            <span>{isGoogleUser ? 'Google' : 'Email/Password'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card border-danger">
                    <div className="card-body">
                      <h5 className="card-title text-danger">Account Management</h5>
                      {!showDeleteConfirm ? (
                        <div>
                          <p className="text-muted">
                            Permanently delete your account and all associated data.
                          </p>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={deleting}
                            type="button"
                          >
                            Delete Account
                          </button>
                        </div>
                      ) : (
                        <div className="d-grid gap-3">
                          <div className="alert alert-danger">
                            <strong>Warning:</strong> This action cannot be undone.
                            <ul className="mb-0 mt-2">
                              <li>Permanently delete all your events and data</li>
                              <li>Remove your account from the system</li>
                              <li>Log you out immediately</li>
                            </ul>
                          </div>

                          {error && <div className="alert alert-danger">{error}</div>}

                          {!isGoogleUser && (
                            <div>
                              <label htmlFor="confirm-password" className="form-label">
                                Enter your password to confirm
                              </label>
                              <input
                                id="confirm-password"
                                type="password"
                                className="form-control"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Your password"
                                disabled={deleting}
                                autoComplete="current-password"
                              />
                            </div>
                          )}

                          {isGoogleUser && (
                            <div className="alert alert-info mb-0">
                              You'll be asked to sign in with Google to confirm deletion.
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
                              Cancel
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={handleDeleteAccount}
                              disabled={deleting || (!isGoogleUser && !password)}
                              type="button"
                            >
                              {deleting ? 'Deleting...' : 'Delete My Account'}
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
                      <h5 className="card-title">Email Notifications</h5>
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
                          Enable email notifications
                        </label>
                      </div>

                      {emailDraft.enabled && (
                        <div className="d-grid gap-3 mt-3">
                          <div>
                            <label className="form-label" htmlFor="user-email">
                              Email Address
                            </label>
                            <input
                              id="user-email"
                              type="email"
                              className="form-control"
                              value={emailDraft.userEmail}
                              onChange={(e) => setEmailDraft(prev => ({
                                ...prev,
                                userEmail: e.target.value
                              }))}
                              placeholder="your@email.com"
                            />
                          </div>

                          <div>
                            <label className="form-label" htmlFor="advance-days">
                              Advance Notice (Days)
                            </label>
                            <input
                              id="advance-days"
                              type="number"
                              className="form-control"
                              value={emailDraft.advanceDays}
                              onChange={(e) => setEmailDraft(prev => ({
                                ...prev,
                                advanceDays: parseInt(e.target.value, 10) || 3
                              }))}
                              min="1"
                              max="30"
                            />
                          </div>

                          <div>
                            <label className="form-label" htmlFor="reminder-time">
                              Reminder Time (Hour)
                            </label>
                            <select
                              id="reminder-time"
                              className="form-select"
                              value={emailDraft.reminderTime || '09:00'}
                              onChange={(e) => setEmailDraft(prev => ({
                                ...prev,
                                reminderTime: e.target.value
                              }))}
                            >
                              {Array.from({ length: 24 }, (_, hour) => {
                                const timeValue = `${String(hour).padStart(2, '0')}:00`;
                                return (
                                  <option key={timeValue} value={timeValue}>
                                    {timeValue}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </div>
                      )}
                      <div className="d-flex justify-content-end mt-3">
                        <button
                          className="btn btn-danger"
                          type="button"
                          onClick={handleSaveEmailPreferences}
                        >
                          Save
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

