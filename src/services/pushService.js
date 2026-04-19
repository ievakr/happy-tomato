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
      if (data?.success !== true) {
        return false;
      }
      // Backend returns sent: false when there are no tasks (nothing was pushed).
      if (Object.prototype.hasOwnProperty.call(data || {}, "sent")) {
        return data.sent === true;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  formatTestPushFailure(data) {
    if (!data || data.success === true) {
      return '';
    }
    if (data.failureReason === 'no_fcm_tokens') {
      return (
        'No device token saved for your account yet. Turn on push in Settings → Notifications, ' +
        'tap Save, wait a few seconds, then try Test push again. ' +
        'On iOS, notifications must be allowed for this app.'
      );
    }
    if (data.failureReason === 'delivery_failed') {
      const detail = data.failureDetail || '';
      // FCM uses this when it cannot auth to APNs (iOS) or Web Push (VAPID)—not Google Cloud IAM.
      if (/third-party-auth-error/i.test(detail)) {
        return (
          'FCM could not authenticate to Apple APNs (or web VAPID), not your GCP IAM. ' +
          'Firebase Console → Project settings → Cloud Messaging → Apple apps: confirm APNs Auth Key ' +
          '(.p8), Key ID, and Team ID match Apple Developer; environment must match the build ' +
          '(dev vs production). Web: add Web Push certificates. ' +
          'https://firebase.google.com/docs/cloud-messaging/ios/certs'
        );
      }
      if (/missing required authentication credential/i.test(detail)) {
        return (
          'Google API rejected the send (credentials). Enable FCM + IAM Credentials APIs in GCP ' +
          'for this Firebase project, or see APNs/VAPID if the error also mentions third-party.'
        );
      }
      const d = detail ? ` (${detail})` : '';
      return `Firebase could not deliver to your device${d}. Try opening the app once, then test again.`;
    }
    return 'Push could not be sent. Check that functions are deployed and you are online.';
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

    try {
      const { data } = await this.sendTodoReminderPush({
        todos: testTodos,
        reminderType: 'Push test',
      });
      if (data?.success === true) {
        return true;
      }
      throw new Error(this.formatTestPushFailure(data));
    } catch (e) {
      if (e?.code?.startsWith?.('functions/')) {
        throw new Error(e.message || 'Cloud function error');
      }
      throw e;
    }
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

  /**
   * iOS: Firebase logs I-FCM002022 if getToken runs before APNs device token is set. The native layer
   * re-registers for remote notifications after authorization; we wait for tokenReceived and/or retry getToken.
   */
  async waitForIosFcmToken(FirebaseMessaging, timeoutMs = 60000) {
    let listenerHandle;
    let settled = false;
    const tokenPromise = new Promise((resolve) => {
      FirebaseMessaging.addListener('tokenReceived', (event) => {
        const t = event?.token;
        if (t && !settled) {
          settled = true;
          listenerHandle?.remove?.();
          resolve(t);
        }
      }).then((handle) => {
        listenerHandle = handle;
      });
    });

    const delayMs = 500;
    const maxPolls = Math.ceil(timeoutMs / delayMs);
    const pollPromise = (async () => {
      for (let i = 0; i < maxPolls && !settled; i += 1) {
        try {
          const { token } = await FirebaseMessaging.getToken();
          if (token && !settled) {
            settled = true;
            listenerHandle?.remove?.();
            return token;
          }
        } catch (e) {
          const msg = `${e?.message || e?.errorMessage || e || ''}`;
          const isApnsNotReady =
            /APNS token|apns token|Code=505|No APNS|FCM002022/i.test(msg) ||
            (typeof e === 'object' && e !== null && String(e.code || '') === '505');
          if (!isApnsNotReady) {
            break;
          }
        }
        await new Promise((r) => setTimeout(r, delayMs));
      }
      return null;
    })();

    const winner = await Promise.race([
      tokenPromise,
      pollPromise,
      new Promise((resolve) => {
        setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
    if (!settled) {
      settled = true;
    }
    listenerHandle?.remove?.();
    return winner || null;
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

      const isIos = Capacitor.getPlatform() === 'ios';
      let token;
      if (isIos) {
        // Let AppDelegate re-register for remote notifications after permission (async) before we poll FCM.
        await new Promise((r) => setTimeout(r, 350));
        token = await this.waitForIosFcmToken(FirebaseMessaging);
      } else {
        const maxAttempts = 12;
        const delayMs = 400;
        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
          try {
            const result = await FirebaseMessaging.getToken();
            if (result?.token) {
              token = result.token;
              break;
            }
          } catch (e) {
            const msg = `${e?.message || e?.errorMessage || e || ''}`;
            const isApnsNotReady =
              /APNS token|apns token|Code=505|No APNS/i.test(msg) ||
              (typeof e === 'object' &&
                e !== null &&
                String(e.code || '') === '505');
            if (!isApnsNotReady || attempt === maxAttempts - 1) {
              break;
            }
          }
          if (attempt < maxAttempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }
      }

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
