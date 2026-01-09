import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { deleteAllUserData } from '../../utils/deleteUserData';
import { useEmailNotifications } from '../../hooks/useEmailNotifications';
import './AccountSettings.css';

function AccountSettings({ onClose }) {
  const { currentUser, deleteAccount } = useAuth();
  const emailNotifications = useEmailNotifications();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('account'); // 'account' or 'notifications'
  const [saveStatus, setSaveStatus] = useState(''); // 'saved', 'saving', or ''

  const isGoogleUser = currentUser?.providerData.some(
    provider => provider.providerId === 'google.com'
  );

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
    <div className="account-settings-overlay">
      <div className="account-settings-modal">
        <div className="account-settings-header">
          <h2>Settings</h2>
          <button 
            className="close-button" 
            onClick={onClose}
            disabled={deleting}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
            disabled={deleting}
          >
            <span className="material-icons-outlined">person</span>
            Account
          </button>
          <button
            className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
            disabled={deleting}
          >
            <span className="material-icons-outlined">notifications</span>
            Notifications
          </button>
        </div>

        {/* Account Tab */}
        {activeTab === 'account' && (
          <>
            <div className="account-info">
          <h3>Account Information</h3>
          <div className="info-row">
            <span className="label">Name:</span>
            <span className="value">{currentUser?.displayName || 'Not set'}</span>
          </div>
          <div className="info-row">
            <span className="label">Email:</span>
            <span className="value">{currentUser?.email}</span>
          </div>
          <div className="info-row">
            <span className="label">Sign-in method:</span>
            <span className="value">
              {isGoogleUser ? 'Google' : 'Email/Password'}
            </span>
          </div>
        </div>

        <div className="danger-zone">
          <h3>Account Management</h3>
          
          {!showDeleteConfirm ? (
            <div className="danger-zone-content">
              <p>
                Permanently delete your account and all associated data.
              </p>
              <button
                className="btn-danger-outline"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Account
              </button>
            </div>
          ) : (
            <div className="delete-confirm">
              <div className="warning-box">
                <p><strong>⚠️ Warning: This action cannot be undone!</strong></p>
                <p>Deleting your account will:</p>
                <ul>
                  <li>Permanently delete all your events and data</li>
                  <li>Remove your account from the system</li>
                  <li>Log you out immediately</li>
                </ul>
              </div>

              {error && <div className="error-message">{error}</div>}

              {!isGoogleUser && (
                <div className="password-confirm">
                  <label htmlFor="confirm-password">
                    Enter your password to confirm:
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    disabled={deleting}
                    autoComplete="current-password"
                  />
                </div>
              )}

              {isGoogleUser && (
                <div className="google-reauth-note">
                  <p>You'll be asked to sign in with Google to confirm deletion.</p>
                </div>
              )}

              <div className="delete-actions">
                <button
                  className="btn-cancel"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setPassword('');
                    setError('');
                  }}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  className="btn-danger"
                  onClick={handleDeleteAccount}
                  disabled={deleting || (!isGoogleUser && !password)}
                >
                  {deleting ? 'Deleting...' : 'Delete My Account'}
                </button>
              </div>
            </div>
          )}
        </div>
          </>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="notifications-settings">
            <h3>Email Notifications</h3>
            
            <div className="setting-section">
              <div className="setting-row">
                <div className="setting-info">
                  <label className="setting-label">Enable Email Notifications</label>
                  <p className="setting-description">
                    Receive email reminders for upcoming tasks
                  </p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={emailNotifications.emailPreferences.enabled}
                    onChange={(e) => {
                      setSaveStatus('saving');
                      emailNotifications.updateEmailPreferences({ 
                        enabled: e.target.checked 
                      });
                      setTimeout(() => {
                        setSaveStatus('saved');
                        setTimeout(() => setSaveStatus(''), 2000);
                      }, 500);
                    }}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {emailNotifications.emailPreferences.enabled && (
                <>
                  <div className="setting-row">
                    <div className="setting-info">
                      <label className="setting-label" htmlFor="user-email">
                        Email Address
                      </label>
                      <p className="setting-description">
                        Where to send reminders
                      </p>
                    </div>
                    <input
                      id="user-email"
                      type="email"
                      className="setting-input"
                      value={emailNotifications.emailPreferences.userEmail}
                      onChange={(e) => {
                        setSaveStatus('saving');
                        emailNotifications.updateEmailPreferences({ 
                          userEmail: e.target.value 
                        });
                        setTimeout(() => {
                          setSaveStatus('saved');
                          setTimeout(() => setSaveStatus(''), 2000);
                        }, 500);
                      }}
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="setting-row">
                    <div className="setting-info">
                      <label className="setting-label" htmlFor="advance-days">
                        Advance Notice (Days)
                      </label>
                      <p className="setting-description">
                        How many days before a task to send reminders
                      </p>
                    </div>
                    <input
                      id="advance-days"
                      type="number"
                      className="setting-input"
                      value={emailNotifications.emailPreferences.advanceDays}
                      onChange={(e) => {
                        setSaveStatus('saving');
                        emailNotifications.updateEmailPreferences({ 
                          advanceDays: parseInt(e.target.value) || 3 
                        });
                        setTimeout(() => {
                          setSaveStatus('saved');
                          setTimeout(() => setSaveStatus(''), 2000);
                        }, 500);
                      }}
                      min="1"
                      max="30"
                    />
                  </div>

                  <div className="setting-row">
                    <div className="setting-info">
                      <label className="setting-label" htmlFor="reminder-time">
                        Reminder Time (Hour)
                      </label>
                      <p className="setting-description">
                        At which hour to send reminders
                      </p>
                    </div>
                    <select
                      id="reminder-time"
                      className="setting-input time-select"
                      value={emailNotifications.emailPreferences.reminderTime || '09:00'}
                      onChange={(e) => {
                        setSaveStatus('saving');
                        emailNotifications.updateEmailPreferences({ reminderTime: e.target.value });
                        setTimeout(() => {
                          setSaveStatus('saved');
                          setTimeout(() => setSaveStatus(''), 2000);
                        }, 500);
                      }}
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

                  {saveStatus === 'saving' && (
                    <div className="save-status saving">💾 Saving...</div>
                  )}
                  {saveStatus === 'saved' && (
                    <div className="save-status saved">✓ Saved to Firestore</div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AccountSettings;

