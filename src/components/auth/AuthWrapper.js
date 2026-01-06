import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Login from './Login';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';

function AuthWrapper({ children }) {
  const { currentUser } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login', 'signup', or 'forgot'

  // If user is authenticated, show the app
  if (currentUser) {
    return children;
  }

  // Otherwise, show authentication screens
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

