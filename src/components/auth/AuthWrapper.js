import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Welcome from './Welcome';
import Login from './Login';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';
import ResetPasswordAction from './ResetPasswordAction';
import EmailAction from './EmailAction';

// Firebase `mode` values we handle in-app instead of on Firebase's default hosted page.
const EMAIL_ACTION_MODES = ['verifyAndChangeEmail', 'recoverEmail'];

/** Reads `mode`/`oobCode` from a Firebase auth action email link (reset password, email change, ...). */
function getAuthActionParams() {
  if (typeof window === 'undefined') return { mode: null, oobCode: null };
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  const oobCode = params.get('oobCode');
  if (!oobCode || (mode !== 'resetPassword' && !EMAIL_ACTION_MODES.includes(mode))) {
    return { mode: null, oobCode: null };
  }
  return { mode, oobCode };
}

function clearAuthActionParamsFromUrl() {
  const params = new URLSearchParams(window.location.search);
  ['mode', 'oobCode', 'apiKey', 'lang', 'continueUrl'].forEach((key) => params.delete(key));
  const qs = params.toString();
  const clean = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
  window.history.replaceState({}, '', clean);
}

function AuthWrapper({ children }) {
  const { currentUser, bootLoading } = useAuth();
  const [authView, setAuthView] = useState('welcome'); // 'welcome', 'login', 'signup', or 'forgot'
  const [actionParams, setActionParams] = useState(getAuthActionParams);

  // Handle password reset / email change links first, even if the user already has a
  // session (e.g. they opened the link on a device where they're still signed in).
  if (actionParams.oobCode) {
    const finishAction = () => {
      clearAuthActionParamsFromUrl();
      setActionParams({ mode: null, oobCode: null });
      setAuthView('login');
    };

    if (actionParams.mode === 'resetPassword') {
      return <ResetPasswordAction oobCode={actionParams.oobCode} onDone={finishAction} />;
    }
    return <EmailAction oobCode={actionParams.oobCode} onDone={finishAction} />;
  }

  // While auth is still resolving, render the app shell (boot splash lives there).
  // Avoid flashing the login screen for users who already have a session.
  if (bootLoading || currentUser) {
    return children;
  }

  // Confirmed signed out — show authentication screens
  return (
    <>
      {authView === 'welcome' && (
        <Welcome
          onLogin={() => setAuthView('login')}
          onSignup={() => setAuthView('signup')}
        />
      )}
      {authView === 'login' && (
        <Login
          onForgotPassword={() => setAuthView('forgot')}
          onBack={() => setAuthView('welcome')}
        />
      )}
      {authView === 'signup' && (
        <Signup onBack={() => setAuthView('welcome')} />
      )}
      {authView === 'forgot' && (
        <ForgotPassword onBackToLogin={() => setAuthView('login')} />
      )}
    </>
  );
}

export default AuthWrapper;

