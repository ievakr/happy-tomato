import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Login from './Login';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';
import ResetPasswordAction from './ResetPasswordAction';

/** Reads the `mode=resetPassword&oobCode=...` params from a Firebase password reset email link. */
function getResetPasswordCode() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('mode') === 'resetPassword' ? params.get('oobCode') : null;
}

function clearResetPasswordParamsFromUrl() {
  const params = new URLSearchParams(window.location.search);
  ['mode', 'oobCode', 'apiKey', 'lang', 'continueUrl'].forEach((key) => params.delete(key));
  const qs = params.toString();
  const clean = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
  window.history.replaceState({}, '', clean);
}

function AuthWrapper({ children }) {
  const { currentUser, bootLoading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login', 'signup', or 'forgot'
  const [resetCode, setResetCode] = useState(getResetPasswordCode);

  // Handle the password reset link first, even if the user already has a session
  // (e.g. they opened the link on a device where they're still signed in).
  if (resetCode) {
    return (
      <ResetPasswordAction
        oobCode={resetCode}
        onDone={() => {
          clearResetPasswordParamsFromUrl();
          setResetCode(null);
          setAuthView('login');
        }}
      />
    );
  }

  // While auth is still resolving, render the app shell (boot splash lives there).
  // Avoid flashing the login screen for users who already have a session.
  if (bootLoading || currentUser) {
    return children;
  }

  // Confirmed signed out — show authentication screens
  return (
    <>
      {authView === 'login' && (
        <Login
          onSwitchToSignup={() => setAuthView('signup')}
          onForgotPassword={() => setAuthView('forgot')}
        />
      )}
      {authView === 'signup' && (
        <Signup onSwitchToLogin={() => setAuthView('login')} />
      )}
      {authView === 'forgot' && (
        <ForgotPassword onBackToLogin={() => setAuthView('login')} />
      )}
    </>
  );
}

export default AuthWrapper;

