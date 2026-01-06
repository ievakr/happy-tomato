import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { deleteAllUserData } from '../../utils/deleteUserData';
import './AccountSettings.css';

function AccountSettings({ onClose }) {
  const { currentUser, deleteAccount } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const isGoogleUser = currentUser?.providerData.some(
    provider => provider.providerId === 'google.com'
  );

  const handleDeleteAccount = async () => {
    if (!isGoogleUser && !password) {
      setError('Please enter your password to confirm deletion');
      return;
    }

    // Final confirmation
    const finalConfirm = window.confirm(
      '⚠️ FINAL WARNING: This will permanently delete your account and ALL your data. This action CANNOT be undone. Are you absolutely sure?'
    );

    if (!finalConfirm) {
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
          <h2>Account Settings</h2>
          <button 
            className="close-button" 
            onClick={onClose}
            disabled={deleting}
          >
            ×
          </button>
        </div>

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
      </div>
    </div>
  );
}

export default AccountSettings;

