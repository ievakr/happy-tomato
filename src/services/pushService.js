/**
 * Push reminders: web (FCM + service worker + VAPID) and native (Capacitor Firebase Messaging).
 */

import { Capacitor } from '@capacitor/core';
import { getToken } from 'firebase/messaging';
import { doc, setDoc, arrayUnion } from 'firebase/firestore';
import { functions, httpsCallable, getFirebaseMessaging } from '../firebase';

class PushService {
  constructor() {
    this.sendTodoReminderPush = httpsCallable(functions, 'sendTodoReminderPush');
    this.sendWeeklySummaryPush = httpsCallable(functions, 'sendWeeklySummaryPush');
  }

  sanitizeTodos(todos) {
    if (!Array.isArray(todos)) {
      return [];
    }
    return todos.filter((todo) => {
      if (!todo || typeof todo !== 'object') {
        return false;
      }
      const date = new Date(todo.day);
      return !Number.isNaN(date.getTime());
    });
  }

  normalizeReminderType(reminderType) {
    if (typeof reminderType !== 'string') {
      return 'TODO Reminder';
    }
    const trimmed = reminderType.trim();
    return trimmed.length > 0 ? trimmed : 'TODO Reminder';
  }

  async sendTodoReminder(params) {
    try {
      if (!params || typeof params !== 'object') {
        return false;
      }

      const sanitizedTodos = this.sanitizeTodos(params.todos);
      if (sanitizedTodos.length === 0) {
        return false;
      }

      const reminderType = this.normalizeReminderType(params.reminderType);

      const { data } = await this.sendTodoReminderPush({
        todos: sanitizedTodos,
        reminderType,
      });

      return data?.success === true;
    } catch (error) {
      return false;
    }
  }

  async sendWeeklySummary() {
    try {
      const { data } = await this.sendWeeklySummaryPush({});
      return data?.success === true;
    } catch (error) {
      return false;
    }
  }

  async testPushConfiguration() {
    const testTodos = [
      {
        id: 'test',
        title: 'TO DO: Water plants',
        day: new Date().toISOString(),
        labels: ['Tomatoes'],
        isRecurringTodo: true,
      },
    ];

    return this.sendTodoReminder({
      todos: testTodos,
      reminderType: 'Configuration Test',
    });
  }

  isReady() {
    if (Capacitor.isNativePlatform()) {
      return true;
    }
    if (typeof window === 'undefined') {
      return false;
    }
    return Boolean(process.env.REACT_APP_FIREBASE_VAPID_KEY);
  }

  getConfigurationStatus() {
    if (Capacitor.isNativePlatform()) {
      return {
        isConfigured: true,
        provider: 'Firebase Cloud Messaging (iOS/Android app)',
        missingVars: [],
      };
    }
    const hasVapid = Boolean(process.env.REACT_APP_FIREBASE_VAPID_KEY);
    return {
      isConfigured: hasVapid,
      provider: 'Firebase Cloud Messaging (web)',
      missingVars: hasVapid ? [] : ['REACT_APP_FIREBASE_VAPID_KEY'],
    };
  }

  /**
   * Store FCM token on the user's notification preferences document (web + native).
   */
  async persistFcmToken(db, prefsDocId, userId, userEmail, token) {
    if (!token || !prefsDocId || !userId || !userEmail) {
      return;
    }
    const ref = doc(db, 'emailPreferences', prefsDocId);
    await setDoc(
      ref,
      {
        userId,
        userEmail,
        fcmTokens: arrayUnion(token),
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  }

  async ensureNativeFcmToken(db, prefsDocId, userId, userEmail) {
    try {
      const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
      const check = await FirebaseMessaging.checkPermissions();
      if (check.receive !== 'granted') {
        const requested = await FirebaseMessaging.requestPermissions();
        if (requested.receive !== 'granted') {
          return null;
        }
      }
      const { token } = await FirebaseMessaging.getToken();
      if (!token) {
        return null;
      }
      await this.persistFcmToken(db, prefsDocId, userId, userEmail, token);
      return token;
    } catch (error) {
      return null;
    }
  }

  /**
   * Obtain FCM token and store on the user's notification preferences doc
   */
  async ensureFcmTokenRegistered(db, prefsDocId, userId, userEmail) {
    if (!prefsDocId || !userId || !userEmail) {
      return null;
    }

    if (Capacitor.isNativePlatform()) {
      return this.ensureNativeFcmToken(db, prefsDocId, userId, userEmail);
    }

    if (!this.isReady()) {
      return null;
    }
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      return null;
    }
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      return null;
    }

    const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;
    const reg = await navigator.serviceWorker.ready;
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: reg,
    });

    if (!token) {
      return null;
    }

    await this.persistFcmToken(db, prefsDocId, userId, userEmail, token);
    return token;
  }

  /**
   * Request notification permission on native (iOS/Android). No-op on web.
   */
  async requestNativePushPermission() {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    try {
      const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
      await FirebaseMessaging.requestPermissions();
    } catch (error) {
      // Non-fatal
    }
  }
}

const pushService = new PushService();

export default pushService;
