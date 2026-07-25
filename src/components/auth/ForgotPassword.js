import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/LanguageContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
import Icon from '../common/Icon';
import TomatoBackground from './TomatoBackground';
import logo from '../../assets/logo.png';
import './Auth.css';

function ForgotPassword({ onBackToLogin }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError(t('auth.enterEmail'));
      return;
    }

    try {
      setError('');
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
        setError(t('auth.invalidEmail'));
      } else {
        setError(t('auth.resetFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container d-flex align-items-center justify-content-center">
      <TomatoBackground />
      <div className="auth-card card shadow-lg border-0">
        <div className="card-body">
          <div className="auth-brand">
            <img src={logo} alt="" />
            <span>Happy Tomato</span>
          </div>

          <div className="text-center mb-4">
            <h2 className="auth-title mb-1">{t('auth.resetPassword')}</h2>
            <p className="auth-subtitle mb-0">
              {t('auth.resetInstructions')}
            </p>
          </div>

          {error && <div className="auth-error alert alert-danger">{error}</div>}
          {success && (
            <div className="auth-success alert alert-success">
              {t('auth.resetEmailSent')}
            </div>
          )}

          {!success ? (
            <form onSubmit={handleSubmit} className="auth-form d-grid gap-3">
              <div className="auth-field">
                <label htmlFor="email" className="form-label">{t('auth.email')}</label>
                <div className="auth-input-wrap">
                  <Icon name="email" className="auth-input-icon" />
                  <input
                    id="email"
                    type="email"
                    className="form-control form-control-lg auth-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg w-100"
                disabled={loading}
              >
                {loading ? t('auth.sending') : t('auth.sendResetLink')}
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-lg w-100"
              onClick={onBackToLogin}
            >
              {t('auth.backToLogin')}
            </button>
          )}

          {!success && (
            <div className="auth-footer text-center mt-4">
              <button
                type="button"
                className="btn btn-link p-0 fw-semibold text-decoration-none"
                onClick={onBackToLogin}
                disabled={loading}
              >
                ← {t('auth.backToLogin')}
              </button>
            </div>
          )}

          <div className="d-flex justify-content-center mt-4">
            <LanguageSwitcher variant="dropdown" abbreviateEnglish className="auth-language-dropdown" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;

