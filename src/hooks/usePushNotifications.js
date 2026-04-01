import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { useEventContext } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import pushService from '../services/pushService';
import dayjs from 'dayjs';
import { db } from '../firebase';
import { doc, setDoc, getDoc, arrayUnion } from 'firebase/firestore';

const STORAGE_KEY = 'push-notification-preferences';
const LEGACY_STORAGE_KEY = 'email-preferences';

function loadInitialPreferences() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacy) {
    localStorage.setItem(STORAGE_KEY, legacy);
    return JSON.parse(legacy);
  }
  return {
    enabled: true,
    userEmail: '',
    userName: '',
    userId: '',
    dailyReminder: true,
    reminderTime: '09:00',
    overdueReminders: true,
    dueTodayReminders: true,
    advanceReminders: true,
    advanceDays: 3,
    weeklySummary: false,
    weeklySummaryTime: '08:00',
    lastReminderSent: null,
    lastAdvanceReminderSent: null,
    lastAutoReminderSent: null,
    lastAutoAdvanceReminderSent: null,
    lastWeeklySummarySent: null,
  };
}

/**
 * Reminder preferences and delivery via web push (FCM)
 */
export const usePushNotifications = () => {
  const { currentUser } = useAuth();
  const { filteredEvents, savedEvents } = useEventContext();

  const allEvents =
    Array.isArray(savedEvents) && savedEvents.length > 0 ? savedEvents : filteredEvents;
  const [pushPreferences, setPushPreferences] = useState(loadInitialPreferences);

  const nativeSyncEmailRef = useRef('');
  const nativeSyncUidRef = useRef('');
  const nativePushEnabledRef = useRef(false);

  useEffect(() => {
    nativeSyncEmailRef.current = (pushPreferences.userEmail || currentUser?.email || '').trim();
    nativeSyncUidRef.current = currentUser?.uid || '';
    nativePushEnabledRef.current = Boolean(pushPreferences.enabled);
  });

  const prefsEmail = useCallback(
    (prefs) => (prefs.userEmail || currentUser?.email || '').trim(),
    [currentUser?.email],
  );

  const syncPreferencesToFirestore = useCallback(
    async (preferences) => {
      try {
        const emailForDoc = prefsEmail(preferences);
        if (!emailForDoc) return;

        const docId = emailForDoc.replace(/[.#$[\]]/g, '_');
        const payload = {
          ...preferences,
          userId: currentUser?.uid || preferences.userId,
          userEmail: emailForDoc,
          updatedAt: new Date().toISOString(),
        };

        await setDoc(doc(db, 'emailPreferences', docId), payload);
      } catch (error) {
        // Non-fatal
      }
    },
    [currentUser?.uid, prefsEmail],
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pushPreferences));
  }, [pushPreferences]);

  const loadFromFirestore = useCallback(async () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    const localPrefs = JSON.parse(saved);
    const email = prefsEmail(localPrefs);
    if (!email) return;

    try {
      const docId = email.replace(/[.#$[\]]/g, '_');
      const docRef = doc(db, 'emailPreferences', docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const firestorePrefs = docSnap.data();
        const localUpdated = localPrefs.updatedAt || 0;
        const firestoreUpdated = firestorePrefs.updatedAt || 0;

        if (firestoreUpdated > localUpdated) {
          setPushPreferences((prev) => ({
            ...prev,
            ...firestorePrefs,
            lastReminderSent: Math.max(
              prev.lastReminderSent || 0,
              firestorePrefs.lastReminderSent || 0,
            ),
            lastAdvanceReminderSent: Math.max(
              prev.lastAdvanceReminderSent || 0,
              firestorePrefs.lastAdvanceReminderSent || 0,
            ),
            lastAutoReminderSent:
              firestorePrefs.lastAutoReminderSent || prev.lastAutoReminderSent,
            lastAutoAdvanceReminderSent:
              firestorePrefs.lastAutoAdvanceReminderSent ||
              prev.lastAutoAdvanceReminderSent,
          }));
        } else if (localUpdated > firestoreUpdated) {
          syncPreferencesToFirestore(localPrefs);
        }
      } else {
        syncPreferencesToFirestore(localPrefs);
      }
    } catch (error) {
      // Non-fatal
    }
  }, [syncPreferencesToFirestore, prefsEmail]);

  useEffect(() => {
    loadFromFirestore();
  }, [loadFromFirestore]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (prefsEmail(pushPreferences)) {
        loadFromFirestore();
      }
    }, 30000);
    return () => clearInterval(intervalId);
  }, [pushPreferences, loadFromFirestore, prefsEmail]);

  useEffect(() => {
    const run = async () => {
      const email = prefsEmail(pushPreferences);
      if (!pushPreferences.enabled || !currentUser?.uid || !email) return;
      if (!pushService.isReady()) return;
      if (!Capacitor.isNativePlatform()) {
        if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
          return;
        }
      }
      const docId = email.replace(/[.#$[\]]/g, '_');
      await pushService.ensureFcmTokenRegistered(db, docId, currentUser.uid, email);
    };
    run();
  }, [pushPreferences, prefsEmail, currentUser?.uid, currentUser?.email]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !pushPreferences.enabled) {
      return undefined;
    }
    let listenerHandle;
    const pending = (async () => {
      try {
        const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
        listenerHandle = await FirebaseMessaging.addListener('tokenReceived', async (event) => {
          if (!nativePushEnabledRef.current) return;
          const em = nativeSyncEmailRef.current;
          const uid = nativeSyncUidRef.current;
          if (!em || !uid || !event?.token) return;
          const docId = em.replace(/[.#$[\]]/g, '_');
          try {
            await setDoc(
              doc(db, 'emailPreferences', docId),
              {
                userId: uid,
                userEmail: em,
                fcmTokens: arrayUnion(event.token),
                updatedAt: new Date().toISOString(),
              },
              { merge: true },
            );
          } catch (e) {
            // Non-fatal
          }
        });
      } catch (e) {
        // Plugin unavailable
      }
    })();
    return () => {
      pending
        .then(() => {
          listenerHandle?.remove?.();
        })
        .catch(() => {});
    };
  }, [pushPreferences.enabled]);

  const updatePushPreferences = (newPreferences) => {
    setPushPreferences((prev) => {
      const updated = {
        ...prev,
        ...newPreferences,
        updatedAt: new Date().toISOString(),
      };

      if (newPreferences.reminderTime && newPreferences.reminderTime !== prev.reminderTime) {
        updated.lastAutoReminderSent = null;
        updated.lastAutoAdvanceReminderSent = null;
      }

      if (newPreferences.advanceDays && newPreferences.advanceDays !== prev.advanceDays) {
        updated.lastAutoAdvanceReminderSent = null;
      }

      const email = prefsEmail(updated);
      if (email) {
        syncPreferencesToFirestore(updated);
      }

      return updated;
    });
  };

  const resetPushPreferences = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    setPushPreferences({
      enabled: false,
      userEmail: '',
      userName: '',
      userId: '',
      dailyReminder: true,
      reminderTime: '09:00',
      overdueReminders: true,
      dueTodayReminders: true,
      advanceReminders: true,
      advanceDays: 3,
      weeklySummary: false,
      weeklySummaryTime: '08:00',
      lastReminderSent: null,
      lastAdvanceReminderSent: null,
      lastAutoReminderSent: null,
      lastAutoAdvanceReminderSent: null,
      lastWeeklySummarySent: null,
    });
  };

  const forceUpdateReminderTime = (newTime) => {
    setPushPreferences((prev) => ({
      ...prev,
      reminderTime: newTime,
      lastAutoReminderSent: null,
      lastAutoAdvanceReminderSent: null,
    }));
  };

  const getDueTodos = () => {
    const today = dayjs();
    return allEvents.filter((evt) => {
      const isTodoEvent =
        evt.isRecurringTodo ||
        (typeof evt.title === 'string' && evt.title.startsWith('TO DO:')) ||
        (typeof evt.toDo === 'string' && evt.toDo.startsWith('TO DO:'));
      if (!isTodoEvent || evt.completed) return false;
      return dayjs(evt.day).isSame(today, 'day');
    });
  };

  const getOverdueTodos = () => {
    const today = dayjs();
    return allEvents.filter((evt) => {
      const isTodoEvent =
        evt.isRecurringTodo ||
        (typeof evt.title === 'string' && evt.title.startsWith('TO DO:')) ||
        (typeof evt.toDo === 'string' && evt.toDo.startsWith('TO DO:'));
      if (!isTodoEvent || evt.completed) return false;
      return dayjs(evt.day).isBefore(today, 'day');
    });
  };

  const getUpcomingTodos = () => {
    const today = dayjs();
    const nextWeek = today.add(7, 'days');
    return allEvents.filter((evt) => {
      const isTodoEvent =
        evt.isRecurringTodo ||
        (typeof evt.title === 'string' && evt.title.startsWith('TO DO:')) ||
        (typeof evt.toDo === 'string' && evt.toDo.startsWith('TO DO:'));
      if (!isTodoEvent || evt.completed) return false;
      const eventDate = dayjs(evt.day);
      return eventDate.isAfter(today, 'day') && eventDate.isBefore(nextWeek, 'day');
    });
  };

  const getTodosInAdvance = (days = 3) => {
    const targetDate = dayjs().add(days, 'days');
    return allEvents.filter((evt) => {
      const isTodoEvent =
        evt.isRecurringTodo ||
        (typeof evt.title === 'string' && evt.title.startsWith('TO DO:')) ||
        (typeof evt.toDo === 'string' && evt.toDo.startsWith('TO DO:'));
      if (!isTodoEvent || evt.completed) return false;
      return dayjs(evt.day).isSame(targetDate, 'day');
    });
  };

  const firestoreDocIdForPrefs = () => {
    const email = prefsEmail(pushPreferences);
    if (!email) return null;
    return email.replace(/[.#$[\]]/g, '_');
  };

  const sendDailyReminder = async (isAutomatic = false) => {
    const email = prefsEmail(pushPreferences);
    if (!pushPreferences.enabled || !email || !currentUser?.uid) {
      return false;
    }

    try {
      const docId = firestoreDocIdForPrefs();
      if (docId) {
        const docSnap = await getDoc(doc(db, 'emailPreferences', docId));
        if (docSnap.exists()) {
          const fs = docSnap.data();
          const lastSent = fs.lastAutoReminderSent;
          if (lastSent) {
            const lastSentDate = lastSent?.toDate ? lastSent.toDate() : new Date(lastSent);
            if (dayjs(lastSentDate).isSame(dayjs(), 'day')) {
              return true;
            }
          }
        }
      }
    } catch (e) {
      // continue
    }

    const dueTodos = getDueTodos();
    const overdueTodos = getOverdueTodos();
    const allTodos = [...overdueTodos, ...dueTodos];

    if (allTodos.length === 0) {
      return true;
    }

    try {
      const success = await pushService.sendTodoReminder({
        todos: allTodos,
        reminderType: 'Daily Garden Reminder',
      });

      if (success) {
        const updated = {
          ...pushPreferences,
          lastReminderSent: Date.now(),
          ...(isAutomatic && { lastAutoReminderSent: Date.now() }),
        };
        setPushPreferences((prev) => ({ ...prev, ...updated }));
        if (prefsEmail(updated)) syncPreferencesToFirestore(updated);
      }

      return success;
    } catch (error) {
      return false;
    }
  };

  const sendAdvanceReminder = async (isAutomatic = false) => {
    const email = prefsEmail(pushPreferences);
    if (!pushPreferences.enabled || !email || !currentUser?.uid || !pushPreferences.advanceReminders) {
      return false;
    }

    try {
      const docId = firestoreDocIdForPrefs();
      if (docId) {
        const docSnap = await getDoc(doc(db, 'emailPreferences', docId));
        if (docSnap.exists()) {
          const fs = docSnap.data();
          const lastSent = fs.lastAutoAdvanceReminderSent;
          if (lastSent) {
            const lastSentDate = lastSent?.toDate ? lastSent.toDate() : new Date(lastSent);
            if (dayjs(lastSentDate).isSame(dayjs(), 'day')) {
              return true;
            }
          }
        }
      }
    } catch (e) {
      // continue
    }

    const advanceTodos = getTodosInAdvance(pushPreferences.advanceDays);

    if (advanceTodos.length === 0) {
      return true;
    }

    try {
      const success = await pushService.sendTodoReminder({
        todos: advanceTodos,
        reminderType: `${pushPreferences.advanceDays}-Day Advance Garden Reminder`,
      });

      if (success) {
        const updated = {
          ...pushPreferences,
          lastAdvanceReminderSent: Date.now(),
          ...(isAutomatic && { lastAutoAdvanceReminderSent: Date.now() }),
        };
        setPushPreferences((prev) => ({ ...prev, ...updated }));
        if (prefsEmail(updated)) syncPreferencesToFirestore(updated);
      }

      return success;
    } catch (error) {
      return false;
    }
  };

  const sendWeeklySummary = async () => {
    const email = prefsEmail(pushPreferences);
    if (!pushPreferences.enabled || !email || !currentUser?.uid) {
      return false;
    }
    try {
      return await pushService.sendWeeklySummary();
    } catch (error) {
      return false;
    }
  };

  const sendImmediateReminder = async (todos, reminderType = 'TODO Reminder') => {
    const email = prefsEmail(pushPreferences);
    if (!pushPreferences.enabled || !email || !currentUser?.uid) {
      return false;
    }
    if (!todos || todos.length === 0) {
      return false;
    }
    try {
      return await pushService.sendTodoReminder({
        todos,
        reminderType,
      });
    } catch (error) {
      return false;
    }
  };

  const testPushConfiguration = async () => {
    if (!currentUser?.uid) {
      throw new Error('Sign in to enable push notifications');
    }
    const email = prefsEmail(pushPreferences);
    if (!email) {
      throw new Error('Your account needs an email address to sync notification settings');
    }
    return pushService.testPushConfiguration();
  };

  const shouldSendDailyReminder = () => {
    if (!pushPreferences.enabled || !pushPreferences.dailyReminder) {
      return false;
    }

    const now = dayjs();
    const [reminderHour, reminderMinute] = pushPreferences.reminderTime.split(':').map(Number);
    const lastSent = pushPreferences.lastAutoReminderSent
      ? dayjs(pushPreferences.lastAutoReminderSent)
      : null;

    const reminderTimeToday = now.hour(reminderHour).minute(reminderMinute).second(0);
    const fiveMinutesAfter = reminderTimeToday.add(5, 'minutes');
    const isTimeToSend = now.isAfter(reminderTimeToday) && now.isBefore(fiveMinutesAfter);
    const haventSentAutoToday = !lastSent || !lastSent.isSame(now, 'day');

    const dueTodos = getDueTodos();
    const overdueTodos = getOverdueTodos();
    const hasTodosToRemind = dueTodos.length > 0 || overdueTodos.length > 0;

    return isTimeToSend && haventSentAutoToday && hasTodosToRemind;
  };

  const shouldSendAdvanceReminder = () => {
    if (!pushPreferences.enabled || !pushPreferences.advanceReminders) {
      return false;
    }

    const now = dayjs();
    const [reminderHour, reminderMinute] = pushPreferences.reminderTime.split(':').map(Number);
    const lastSent = pushPreferences.lastAutoAdvanceReminderSent
      ? dayjs(pushPreferences.lastAutoAdvanceReminderSent)
      : null;

    const reminderTimeToday = now.hour(reminderHour).minute(reminderMinute).second(0);
    const fiveMinutesAfter = reminderTimeToday.add(5, 'minutes');
    const isTimeToSend = now.isAfter(reminderTimeToday) && now.isBefore(fiveMinutesAfter);
    const haventSentAutoToday = !lastSent || !lastSent.isSame(now, 'day');

    const advanceTodos = getTodosInAdvance(pushPreferences.advanceDays);
    const hasTodosToRemind = advanceTodos.length > 0;

    return isTimeToSend && haventSentAutoToday && hasTodosToRemind;
  };

  const getTodoSummary = () => {
    const dueTodos = getDueTodos();
    const overdueTodos = getOverdueTodos();
    const upcomingTodos = getUpcomingTodos();
    const advanceTodos = getTodosInAdvance(pushPreferences.advanceDays);

    return {
      dueToday: dueTodos.length,
      overdue: overdueTodos.length,
      upcoming: upcomingTodos.length,
      advance: advanceTodos.length,
      total: dueTodos.length + overdueTodos.length + upcomingTodos.length,
      dueTodos,
      overdueTodos,
      upcomingTodos,
      advanceTodos,
    };
  };

  const isPushServiceReady = () => pushService.isReady();
  const getPushServiceStatus = () => pushService.getConfigurationStatus();

  return {
    pushPreferences,
    updatePushPreferences,
    resetPushPreferences,
    forceUpdateReminderTime,
    loadFromFirestore,
    getDueTodos,
    getOverdueTodos,
    getUpcomingTodos,
    getTodosInAdvance,
    sendDailyReminder,
    sendAdvanceReminder,
    sendWeeklySummary,
    sendImmediateReminder,
    testPushConfiguration,
    shouldSendDailyReminder,
    shouldSendAdvanceReminder,
    getTodoSummary,
    isPushServiceReady,
    getPushServiceStatus,
    emailPreferences: pushPreferences,
    updateEmailPreferences: updatePushPreferences,
    resetEmailPreferences: resetPushPreferences,
    testEmailConfiguration: testPushConfiguration,
    isEmailServiceReady: isPushServiceReady,
    getEmailServiceStatus: getPushServiceStatus,
  };
};
