import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { usePushNotifications } from './usePushNotifications';
import notificationService from '../services/notificationService';
import { getFirebaseMessaging } from '../firebase';

const OPEN_DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function dispatchOpenDay(openDay, kind) {
  window.dispatchEvent(
    new CustomEvent('happy-tomato-open-day', { detail: { day: openDay, kind } }),
  );
}

/**
 * Starts reminder delivery and routes notification taps back into the calendar.
 */
export default function useAppNotifications() {
  const pushNotifications = usePushNotifications();

  useEffect(() => {
    if (pushNotifications.pushPreferences.enabled) {
      notificationService.start(pushNotifications);
    } else {
      notificationService.stop();
    }

    return () => {
      notificationService.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pushNotifications.pushPreferences.enabled]);

  useEffect(() => {
    if (notificationService.isRunning) {
      notificationService.updateReminderHook(pushNotifications);
    }
  }, [pushNotifications]);

  // Foreground FCM: show a system notification when the tab is active
  useEffect(() => {
    let unsubscribe;
    (async () => {
      const messaging = await getFirebaseMessaging();
      if (!messaging) return;
      const { onMessage } = await import('firebase/messaging');
      unsubscribe = onMessage(messaging, (payload) => {
        if (
          typeof document !== 'undefined' &&
          document.visibilityState === 'visible' &&
          payload?.notification?.title
        ) {
          try {
            const openDay = payload?.data?.openDay ? String(payload.data.openDay) : '';
            const kind = payload?.data?.kind ? String(payload.data.kind) : '';
            const notificationData =
              openDay || kind ? { ...(openDay ? { openDay } : {}), ...(kind ? { kind } : {}) } : undefined;
            // eslint-disable-next-line no-new
            const n = new Notification(payload.notification.title, {
              body: payload.notification.body || '',
              icon: '/logo192.png',
              data: notificationData,
            });
            n.onclick = () => {
              window.focus();
              if (openDay) {
                dispatchOpenDay(openDay, kind);
              }
              n.close();
            };
          } catch (e) {
            // Ignore duplicate or blocked notifications
          }
        }
      });
    })();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // iOS/Android: open the calendar day when the user taps a push notification
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return undefined;
    }
    let handle;
    const pending = (async () => {
      try {
        const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
        handle = await FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
          const raw = event.notification?.data;
          const openDay =
            raw && typeof raw === 'object' && raw !== null && 'openDay' in raw
              ? String(raw.openDay)
              : '';
          const kind =
            raw && typeof raw === 'object' && raw !== null && 'kind' in raw ? String(raw.kind) : '';
          if (openDay && OPEN_DAY_PATTERN.test(openDay)) {
            dispatchOpenDay(openDay, kind);
          }
        });
      } catch (e) {
        // Plugin unavailable
      }
    })();
    return () => {
      pending
        .then(() => handle?.remove?.())
        .catch(() => {});
    };
  }, []);
}
