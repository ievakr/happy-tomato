// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  persistentSingleTabManager
} from "firebase/firestore";
import {
    getAuth,
    initializeAuth,
    browserLocalPersistence
} from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getMessaging, isSupported } from "firebase/messaging";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { Capacitor } from "@capacitor/core";

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Validate that all required environment variables are present
const requiredEnvVars = [
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_AUTH_DOMAIN',
    'REACT_APP_FIREBASE_PROJECT_ID',
    'REACT_APP_FIREBASE_STORAGE_BUCKET',
    'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
    'REACT_APP_FIREBASE_APP_ID'
];

if (process.env.NODE_ENV !== 'production') {
    const presence = requiredEnvVars.reduce((acc, key) => {
        acc[key] = Boolean(process.env[key]);
        return acc;
    }, {});
    // eslint-disable-next-line no-console
    console.info('[firebase env] presence', { NODE_ENV: process.env.NODE_ENV, ...presence });
}

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    throw new Error(
        `Missing required environment variables: ${missingEnvVars.join(', ')}\n` +
        'Please check your .env file and ensure all Firebase configuration variables are set.'
    );
}

const app = initializeApp(firebaseConfig);

// Bot/abuse protection for Auth, Firestore, and Functions calls. Web-only for now —
// native Capacitor builds would need App Attest/Play Integrity providers instead of
// reCAPTCHA, which isn't wired up yet. No-ops if REACT_APP_RECAPTCHA_SITE_KEY isn't
// set, so this stays inert until App Check is actually enabled for the project.
// Setup (do this in the Firebase console, not in code):
//   1. Firebase Console → Build → App Check → register this web app with reCAPTCHA v3,
//      then put the generated site key in REACT_APP_RECAPTCHA_SITE_KEY.
//   2. In App Check → APIs, turn on enforcement for Authentication (and Firestore/
//      Functions if desired) once you've confirmed real traffic isn't being blocked.
//   3. For local dev, the console will log a debug token on first run — add it under
//      App Check → Manage debug tokens so localhost isn't treated as unverified.
const recaptchaSiteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

if (!Capacitor.isNativePlatform() && recaptchaSiteKey) {
    if (process.env.NODE_ENV !== "production") {
        window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
    initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
    });
}

const tabManager = Capacitor.isNativePlatform()
    ? persistentSingleTabManager()
    : persistentMultipleTabManager();

const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager })
});

// WKWebView IndexedDB auth persistence can stall onAuthStateChanged; localStorage is reliable in Capacitor.
const auth = (() => {
    if (Capacitor.isNativePlatform()) {
        try {
            return initializeAuth(app, { persistence: browserLocalPersistence });
        } catch (e) {
            if (e && typeof e === "object" && "code" in e && e.code === "auth/already-initialized") {
                return getAuth(app);
            }
            throw e;
        }
    }
    return getAuth(app);
})();

const functions = getFunctions(app);

let messagingPromise = null;

/**
 * Firebase Cloud Messaging instance (web only). Resolves null on native or unsupported browsers.
 */
export function getFirebaseMessaging() {
  if (Capacitor.isNativePlatform()) {
    return Promise.resolve(null);
  }
  if (!messagingPromise) {
    messagingPromise = isSupported().then((ok) => (ok ? getMessaging(app) : null));
  }
  return messagingPromise;
}

export { db, auth, functions, httpsCallable };
