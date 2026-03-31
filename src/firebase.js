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
