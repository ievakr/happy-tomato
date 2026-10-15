import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/LanguageContext';
import Icon from '../common/Icon';
import LanguageSwitcher from '../common/LanguageSwitcher';
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
    <div className="auth-container auth-signup d-flex justify-content-center">
      <div className="auth-signup-inner">
        <div className="auth-signup-bar">
          <button type="button" className="auth-back-link" onClick={onBack}>
            <Icon name="chevron_left" />
            <span>{t('auth.back')}</span>
          </button>
          <LanguageSwitcher variant="segment" />
        </div>

        <img src={logo} alt="" className="auth-signup-logo" />
        <h1 className="auth-signup-title">{t('auth.signUp')}</h1>

        {error && <div className="auth-error alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form auth-signup-form">
          <div className="auth-field">
            <label htmlFor="displayName" className="form-label">{t('auth.fullName')}</label>
            <input
              id="displayName"
              type="text"
              className="form-control auth-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
              autoComplete="name"
              required
            />
          </div>

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

          <div className="auth-field">
            <label htmlFor="password" className="form-label">{t('auth.password')}</label>
            <div className="auth-input-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-control auth-input auth-input--with-toggle"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            className="btn btn-primary btn-lg w-100 auth-signup-submit"
            disabled={loading}
          >
            {loading ? t('auth.creatingAccount') : t('auth.signUp')}
          </button>
        </form>

        <div className="auth-divider">
          <span>{t('auth.or')}</span>
        </div>

        <button
          type="button"
          className="auth-google-btn"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <span className="auth-google-mark" aria-hidden>G</span>
          {t('auth.continueWithGoogle')}
        </button>
      </div>
    </div>
  );
}

export default Signup;
