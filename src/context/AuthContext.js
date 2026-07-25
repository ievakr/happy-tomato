import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  updateProfile,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  verifyBeforeUpdateEmail,
  applyActionCode,
  checkActionCode,
  updatePassword
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { auth } from '../firebase';

// Minimum time (ms) to show the intro splash on app open, so the brand is
// always visible for a moment even when auth resolves instantly.
const INTRO_MIN_DISPLAY_MS = 3000;

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
      // continueUrl: if the console's custom action URL isn't configured (or fails to save),
      // Firebase's own hosted reset page will still show a "Continue" link back into the app.
      // On native, window.location.origin is Capacitor's internal scheme (e.g. capacitor://localhost),
      // not a real authorized web domain, so fall back to the public web app URL there.
      const continueUrl = Capacitor.isNativePlatform()
        ? `https://${process.env.REACT_APP_FIREBASE_AUTH_DOMAIN}`
        : window.location.origin;
      const actionCodeSettings = {
        url: continueUrl,
        handleCodeInApp: false,
      };
      return await sendPasswordResetEmail(auth, email, actionCodeSettings);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Verify a password reset code (from an email link) and return the associated email
  async function verifyResetCode(oobCode) {
    try {
      setError(null);
      return await verifyPasswordResetCode(auth, oobCode);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Complete a password reset using the code from an email link
  async function confirmReset(oobCode, newPassword) {
    try {
      setError(null);
      return await confirmPasswordReset(auth, oobCode, newPassword);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Change the account email. This doesn't take effect immediately — Firebase sends a
  // verification link to the new address, and the change only completes once that link
  // is clicked (see EmailAction, which handles the `mode=verifyAndChangeEmail` link).
  async function changeEmail(newEmail, password = null) {
    try {
      setError(null);
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      await reauthenticate(password);

      // Same reasoning as resetPassword: native's window.location.origin isn't a real,
      // authorized web domain, so fall back to the public web app URL there.
      const continueUrl = Capacitor.isNativePlatform()
        ? `https://${process.env.REACT_APP_FIREBASE_AUTH_DOMAIN}`
        : window.location.origin;
      await verifyBeforeUpdateEmail(currentUser, newEmail, {
        url: continueUrl,
        handleCodeInApp: false,
      });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Change the account password. Takes effect immediately (unlike changeEmail, there's no
  // confirmation link) — requires reauthentication first since it's security-sensitive.
  async function changePassword(currentPassword, newPassword) {
    try {
      setError(null);
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      await reauthenticate(currentPassword);
      await updatePassword(currentUser, newPassword);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Inspect an emailed action code (e.g. verifyAndChangeEmail, recoverEmail) before applying it.
  async function checkAuthActionCode(oobCode) {
    try {
      setError(null);
      return await checkActionCode(auth, oobCode);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Complete an emailed action code (finishes an email change, or reverts one via recoverEmail).
  async function applyAuthActionCode(oobCode) {
    try {
      setError(null);
      await applyActionCode(auth, oobCode);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Refresh the locally cached user after a change Firebase made out-of-band (e.g. an
  // email change action link). Forces a fresh ID token too, since Firestore security
  // rules key off the token's email claim, which otherwise stays stale until its next
  // natural refresh — no-ops if this browser tab isn't signed in as the affected user.
  async function refreshCurrentUser() {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    setCurrentUser({ ...auth.currentUser });
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
    verifyResetCode,
    confirmReset,
    changeEmail,
    changePassword,
    checkAuthActionCode,
    applyAuthActionCode,
    refreshCurrentUser,
    updateUserProfile,
    reauthenticate,
    deleteAccount,
    error,
    clearError: () => setError(null),
    bootLoading: loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

