import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup
} from 'firebase/auth';
import { auth } from '../firebase';
import IntroSplash from '../components/common/IntroSplash';

// Minimum time (ms) to show the intro splash on app open, so the brand is
// always visible for a moment even when auth resolves instantly.
const INTRO_MIN_DISPLAY_MS = 2000;

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [error, setError] = useState(null);

  // Keep the intro splash up until auth has resolved AND the minimum time passed.
  const loading = !(authReady && minTimeElapsed);

  // Sign up with email and password
  async function signup(email, password, displayName) {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      if (displayName && result.user) {
        await updateProfile(result.user, { displayName });
      }
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Sign in with email and password
  async function login(email, password) {
    try {
      setError(null);
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Sign in with Google
  async function loginWithGoogle() {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      return await signInWithPopup(auth, provider);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Sign out
  async function logout() {
    try {
      setError(null);
      return await signOut(auth);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Reset password
  async function resetPassword(email) {
    try {
      setError(null);
      return await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Update user profile
  async function updateUserProfile(updates) {
    try {
      setError(null);
      if (currentUser) {
        await updateProfile(currentUser, updates);
        setCurrentUser({ ...currentUser, ...updates });
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Reauthenticate user (required before sensitive operations like delete)
  async function reauthenticate(password = null) {
    try {
      setError(null);
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      // Check if user signed in with Google
      const isGoogleUser = currentUser.providerData.some(
        provider => provider.providerId === 'google.com'
      );

      if (isGoogleUser) {
        // Reauthenticate with Google
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(currentUser, provider);
      } else {
        // Reauthenticate with email/password
        if (!password) {
          throw new Error('Password required for reauthentication');
        }
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          password
        );
        await reauthenticateWithCredential(currentUser, credential);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Delete user account
  async function deleteAccount(password = null) {
    try {
      setError(null);
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      // Reauthenticate first (required by Firebase for security)
      await reauthenticate(password);

      // Delete the user account
      await deleteUser(currentUser);
      
      // User is automatically signed out after deletion
      setCurrentUser(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  useEffect(() => {
    const minTimer = setTimeout(() => setMinTimeElapsed(true), INTRO_MIN_DISPLAY_MS);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthReady(true);
    });

    return () => {
      clearTimeout(minTimer);
      unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    reauthenticate,
    deleteAccount,
    error,
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <IntroSplash label="Loading session…" /> : children}
    </AuthContext.Provider>
  );
}

