import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/LanguageContext';
import TomatoBackground from './TomatoBackground';
import logo from '../../assets/logo.png';
import { migrateEmailPreferencesDoc } from '../../utils/deleteUserData';
import './Auth.css';

const STATUS = {
  VERIFYING: 'verifying',
  CHANGED: 'changed',
  REVERTED: 'reverted',
  INVALID: 'invalid',
};

/**
 * Handles the email links Firebase sends for an email change:
 * - `?mode=verifyAndChangeEmail&oobCode=...` — clicked on the NEW address, completes the change.
 * - `?mode=recoverEmail&oobCode=...` — clicked on the OLD address, undoes an unrecognized change.
 * Mirrors ResetPasswordAction so both action-link flows feel the same.
 */
function EmailAction({ oobCode, onDone }) {
  const { t } = useTranslation();
  const { checkAuthActionCode, applyAuthActionCode, refreshCurrentUser } = useAuth();
  const [status, setStatus] = useState(STATUS.VERIFYING);
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    let cancelled = false;

    if (!oobCode) {
      setStatus(STATUS.INVALID);
      return undefined;
    }

    (async () => {
      try {
        const info = await checkAuthActionCode(oobCode);
        const isRevert = info?.operation === 'RECOVER_EMAIL';
        const data = info?.data || {};

        await applyAuthActionCode(oobCode);
        if (cancelled) return;

        if (isRevert) {
          // Refreshes the local session if this tab happens to still be signed in as the
          // affected user; harmless no-op otherwise.
          await refreshCurrentUser().catch(() => {});
          if (cancelled) return;
          setStatus(STATUS.REVERTED);
        } else {
          // For verifyAndChangeEmail, data.email is the new address and data.previousEmail
          // the old one — migrate notification settings so they aren't silently dropped.
          // Only does anything if this tab is signed in as the affected user (Firestore
          // rules require a matching ID token); otherwise it's a harmless no-op and a
          // fresh preferences doc is created under the new email next time settings change.
          if (data.previousEmail && data.email) {
            await migrateEmailPreferencesDoc(data.previousEmail, data.email, {
              onBeforeWrite: refreshCurrentUser,
            }).catch(() => {});
          }
          await refreshCurrentUser().catch(() => {});
          if (cancelled) return;
          setNewEmail(data.email || '');
          setStatus(STATUS.CHANGED);
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
                <h2 className="auth-title mb-1">{t('auth.emailLinkInvalidTitle')}</h2>
              </div>
              <div className="auth-error alert alert-danger">{t('auth.emailLinkInvalid')}</div>
              <button type="button" className="btn btn-primary btn-lg w-100" onClick={onDone}>
                {t('auth.backToLogin')}
              </button>
            </>
          )}

          {status === STATUS.CHANGED && (
            <>
              <div className="text-center mb-4">
                <h2 className="auth-title mb-1">{t('auth.emailChanged')}</h2>
                <p className="auth-subtitle mb-0">
                  {newEmail ? t('auth.emailChangedDesc', { email: newEmail }) : t('auth.emailChangedDescGeneric')}
                </p>
              </div>
              <button type="button" className="btn btn-primary btn-lg w-100" onClick={onDone}>
                {t('auth.continueToSignIn')}
              </button>
            </>
          )}

          {status === STATUS.REVERTED && (
            <>
              <div className="text-center mb-4">
                <h2 className="auth-title mb-1">{t('auth.emailChangeReverted')}</h2>
                <p className="auth-subtitle mb-0">{t('auth.emailChangeRevertedDesc')}</p>
              </div>
              <div className="auth-error alert alert-warning">{t('auth.emailChangeRevertedNotice')}</div>
              <button type="button" className="btn btn-primary btn-lg w-100" onClick={onDone}>
                {t('auth.backToLogin')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmailAction;
