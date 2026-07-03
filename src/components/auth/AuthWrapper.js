import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Login from './Login';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';

function AuthWrapper({ children }) {
  const { currentUser, bootLoading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login', 'signup', or 'forgot'

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

