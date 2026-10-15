import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/LanguageContext';
import Icon from '../common/Icon';
import LanguageSwitcher from '../common/LanguageSwitcher';
import logo from '../../assets/logo.png';
import './Auth.css';

function Login({ onForgotPassword, onBack }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, loginWithGoogle } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError(t('auth.fillAllFields'));
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login(email, password);
    } catch {
      setError(t('auth.signInFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
    } catch {
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
        <h1 className="auth-signup-title">{t('auth.signIn')}</h1>

        {error && <div className="auth-error alert alert-danger">{error}</div>}

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
                autoComplete="current-password"
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
            type="button"
            className="auth-forgot-link"
            onClick={onForgotPassword}
            disabled={loading}
          >
            {t('auth.forgotPassword')}
          </button>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-100 auth-signup-submit"
            disabled={loading}
          >
            {loading ? t('auth.signingIn') : t('auth.signIn')}
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

export default Login;
