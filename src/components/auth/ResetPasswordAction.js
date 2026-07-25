import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/LanguageContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
import Icon from '../common/Icon';
import TomatoBackground from './TomatoBackground';
import logo from '../../assets/logo.png';
import { MIN_PASSWORD_LENGTH } from '../../utils/authValidation';
import './Auth.css';

const STATUS = {
  VERIFYING: 'verifying',
  READY: 'ready',
  INVALID: 'invalid',
  SUCCESS: 'success',
};

/**
 * Handles the `?mode=resetPassword&oobCode=...` link from the Firebase password
 * reset email, letting the user set a new password inside the app instead of
 * Firebase's generic hosted page.
 */
function ResetPasswordAction({ oobCode, onDone }) {
  const { t } = useTranslation();
  const { verifyResetCode, confirmReset } = useAuth();
  const [status, setStatus] = useState(STATUS.VERIFYING);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!oobCode) {
      setStatus(STATUS.INVALID);
      return undefined;
    }

    (async () => {
      try {
        const verifiedEmail = await verifyResetCode(oobCode);
        if (!cancelled) {
          setEmail(verifiedEmail);
          setStatus(STATUS.READY);
        }
      } catch {
        if (!cancelled) setStatus(STATUS.INVALID);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setError(t('auth.fillAllFields'));
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t('auth.passwordTooShort', { min: MIN_PASSWORD_LENGTH }));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordsNoMatch'));
      return;
    }

    try {
      setError('');
      setSubmitting(true);
      await confirmReset(oobCode, password);
      setStatus(STATUS.SUCCESS);
    } catch (err) {
      if (err.code === 'auth/weak-password') {
        setError(t('auth.weakPassword'));
      } else if (err.code === 'auth/expired-action-code' || err.code === 'auth/invalid-action-code') {
        setStatus(STATUS.INVALID);
      } else {
        setError(t('auth.resetFailed'));
      }
    } finally {
      setSubmitting(false);
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

          {status === STATUS.VERIFYING && (
            <div className="text-center py-4">
              <div className="spinner-border text-success mb-3" role="status" aria-hidden="true" />
              <p className="mb-0">{t('auth.verifyingLink')}</p>
            </div>
          )}

          {status === STATUS.INVALID && (
            <>
              <div className="text-center mb-4">
                <h2 className="auth-title mb-1">{t('auth.resetPassword')}</h2>
              </div>
              <div className="auth-error alert alert-danger">{t('auth.resetLinkInvalid')}</div>
              <button type="button" className="btn btn-primary btn-lg w-100" onClick={onDone}>
                {t('auth.backToLogin')}
              </button>
            </>
          )}

          {status === STATUS.READY && (
            <>
              <div className="text-center mb-4">
                <h2 className="auth-title mb-1">{t('auth.setNewPassword')}</h2>
                <p className="auth-subtitle mb-0">{t('auth.newPasswordFor', { email })}</p>
              </div>

              {error && <div className="auth-error alert alert-danger">{error}</div>}

              <form onSubmit={handleSubmit} className="auth-form d-grid gap-3">
                <div className="auth-field">
                  <label htmlFor="new-password" className="form-label">
                    {t('auth.password')}
                  </label>
                  <div className="auth-input-wrap">
                    <Icon name="lock" className="auth-input-icon" />
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      className="form-control form-control-lg auth-input auth-input--with-toggle"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('auth.createPasswordPlaceholder')}
                      disabled={submitting}
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

                <div className="auth-field">
                  <label htmlFor="confirm-new-password" className="form-label">
                    {t('auth.confirmPassword')}
                  </label>
                  <div className="auth-input-wrap">
                    <Icon name="lock" className="auth-input-icon" />
                    <input
                      id="confirm-new-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="form-control form-control-lg auth-input auth-input--with-toggle"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('auth.confirmPasswordPlaceholder')}
                      disabled={submitting}
                      minLength={MIN_PASSWORD_LENGTH}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="auth-input-toggle"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    >
                      <Icon name={showConfirmPassword ? 'visibility_off' : 'visibility'} />
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg w-100" disabled={submitting}>
                  {submitting ? t('auth.updatingPassword') : t('auth.updatePassword')}
                </button>
              </form>
            </>
          )}

          {status === STATUS.SUCCESS && (
            <>
              <div className="text-center mb-4">
                <h2 className="auth-title mb-1">{t('auth.passwordUpdated')}</h2>
                <p className="auth-subtitle mb-0">{t('auth.passwordUpdatedDesc')}</p>
              </div>
              <button type="button" className="btn btn-primary btn-lg w-100" onClick={onDone}>
                {t('auth.continueToSignIn')}
              </button>
            </>
          )}

          <div className="d-flex justify-content-center mt-4">
            <LanguageSwitcher variant="dropdown" abbreviateEnglish className="auth-language-dropdown" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordAction;
