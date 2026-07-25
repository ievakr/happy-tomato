import React from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
import TomatoBackground from './TomatoBackground';
import logo from '../../assets/logo.png';
import './Auth.css';

/**
 * First screen shown to signed-out users: a big friendly "Welcome!" with a
 * tomato hero graphic, followed by Login / Sign Up choices. Mirrors the
 * classic mobile-app "welcome chooser" pattern (logo -> hero -> heading ->
 * CTA buttons), with the rotating tomato background standing in for an
 * illustration.
 */
function Welcome({ onLogin, onSignup }) {
  const { t } = useTranslation();

  return (
    <div className="auth-container d-flex align-items-center justify-content-center">
      <TomatoBackground />
      <div className="auth-card card shadow-lg border-0">
        <div className="card-body text-center">
          <div className="auth-corner-lang">
            <LanguageSwitcher variant="corner" />
          </div>

          <div className="auth-welcome-hero" aria-hidden="true">
            <img src={logo} alt="" />
          </div>

          <h1 className="auth-welcome-title">{t('auth.welcomeHeading')}</h1>
          <p className="auth-subtitle mb-4">{t('auth.welcomeSubtitle')}</p>

          <div className="d-grid gap-3">
            <button type="button" className="btn btn-primary btn-lg" onClick={onLogin}>
              {t('auth.signIn')}
            </button>
            <button type="button" className="btn btn-outline-primary btn-lg" onClick={onSignup}>
              {t('auth.signUp')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Welcome;
