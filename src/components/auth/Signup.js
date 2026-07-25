import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/LanguageContext';
import Icon from '../common/Icon';
import TomatoBackground from './TomatoBackground';
import logo from '../../assets/logo.png';
import { MIN_PASSWORD_LENGTH } from '../../utils/authValidation';
import './Auth.css';

function Signup({ onBack }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signup, loginWithGoogle } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password || !displayName) {
      setError(t('auth.fillAllFields'));
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t('auth.passwordTooShort', { min: MIN_PASSWORD_LENGTH }));
      return;
    }

    try {
      setError('');
      setLoading(true);
      await signup(email, password, displayName);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError(t('auth.emailInUse'));
      } else if (err.code === 'auth/invalid-email') {
        setError(t('auth.invalidEmail'));
      } else if (err.code === 'auth/weak-password') {
        setError(t('auth.weakPassword'));
      } else {
        setError(t('auth.createFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
    } catch (err) {
      setError(t('auth.googleFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container d-flex align-items-center justify-content-center">
      <TomatoBackground />
      <div className="auth-card auth-card--compact card shadow-lg border-0">
        <div className="card-body">
          {onBack && (
            <button type="button" className="auth-back-btn" onClick={onBack} aria-label={t('auth.back')}>
              <Icon name="arrow_back" />
            </button>
          )}

          <div className="auth-brand">
            <img src={logo} alt="" />
            <span>Happy Tomato</span>
          </div>

          <div className="text-center mb-4">
            <h2 className="auth-title mb-1">{t('auth.signUp')}</h2>
          </div>

          {error && <div className="auth-error alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form d-grid gap-3">
            <div className="auth-field">
              <label htmlFor="displayName" className="form-label">{t('auth.fullName')}</label>
              <div className="auth-input-wrap">
                <Icon name="person" className="auth-input-icon" />
                <input
                  id="displayName"
                  type="text"
                  className="form-control form-control-lg auth-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t('auth.fullNamePlaceholder')}
                  disabled={loading}
                  required
                />
              </div>
            </div>

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

            <div className="auth-field">
              <label htmlFor="password" className="form-label">{t('auth.password')}</label>
              <div className="auth-input-wrap">
                <Icon name="lock" className="auth-input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control form-control-lg auth-input auth-input--with-toggle"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.createPasswordPlaceholder')}
                  disabled={loading}
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="auth-input-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-100 mt-2"
              disabled={loading}
            >
              {loading ? t('auth.creatingAccount') : t('auth.createAccount')}
            </button>
          </form>

          <div className="auth-divider">
            <span>{t('auth.orSignUpWith')}</span>
          </div>

          <div className="auth-social-row">
            <button
              type="button"
              className="auth-social-btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
              aria-label={t('auth.continueWithGoogle')}
              title={t('auth.continueWithGoogle')}
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Signup;
