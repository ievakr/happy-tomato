import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/LanguageContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
import Icon from '../common/Icon';
import { useAuthError } from './useAuthError';
import './Auth.css';

function ForgotPassword({ onBackToLogin }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const error = useAuthError();
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      error.set('auth.enterEmail');
      return;
    }

    try {
      error.clear();
      setSuccess(false);
      setLoading(true);
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        // Show the same success state as a real account, so this form can't be used
        // to check which emails are registered. No email actually goes out, but the
        // response is indistinguishable from the real thing.
        setSuccess(true);
      } else if (err.code === 'auth/invalid-email') {
        error.set('auth.invalidEmail');
      } else {
        error.set('auth.resetFailed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container auth-signup d-flex justify-content-center">
      <div className="auth-signup-inner">
        <div className="auth-signup-bar">
          <button type="button" className="auth-back-link" onClick={onBackToLogin}>
            <Icon name="chevron_left" />
            <span>{t('auth.back')}</span>
          </button>
          <LanguageSwitcher variant="segment" />
        </div>

        <h1 className="auth-signup-title">{t('auth.resetPassword')}</h1>

        {error.message && <div className="auth-error alert alert-danger">{error.message}</div>}
        {success && (
          <div className="auth-success alert alert-success">{t('auth.resetEmailSent')}</div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="auth-form auth-signup-form">
            <div className="auth-field">
              <label htmlFor="email" className="form-label">{t('auth.email')}</label>
              <input
                id="email"
                type="email"
                className="form-control auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-100 auth-signup-submit"
              disabled={loading}
            >
              {loading ? t('auth.sending') : t('auth.sendResetLink')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
