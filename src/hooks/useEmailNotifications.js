import { useState, useEffect, useContext, useCallback } from 'react';
import EventContext from '../context/EventContext';
import emailService from '../services/emailService';
import dayjs from 'dayjs';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * Custom hook for managing email notifications for TODOs
 */
export const useEmailNotifications = () => {
  const { filteredEvents, savedEvents } = useContext(EventContext);
  
  // IMPORTANT: For email notifications, we should check ALL events, not just filtered ones
  // The filteredEvents may be empty if labels are unchecked, but we still need to send reminders
  // for all todos regardless of label filtering
  const allEvents = savedEvents || filteredEvents;
  const [emailPreferences, setEmailPreferences] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem('email-preferences');
    return saved ? JSON.parse(saved) : {
      enabled: true,
      userEmail: '',
      userName: '',
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
      lastWeeklySummarySent: null
    };
  });

  /**
   * Sync preferences to Firestore for Cloud Functions
   */
  const syncPreferencesToFirestore = useCallback(async (preferences) => {
    try {
      // Use email as document ID (or user ID if you have authentication)
      const docId = preferences.userEmail.replace(/[.#$[\]]/g, '_'); // Sanitize email for Firestore
      
      await setDoc(doc(db, 'emailPreferences', docId), {
        ...preferences,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      // Error propagates to caller
    }
  }, []); // No dependencies - uses parameter directly

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('email-preferences', JSON.stringify(emailPreferences));
  }, [emailPreferences]);

  /**
   * Load preferences from Firestore and sync with local state
   * This can be called on mount or manually to refresh
   */
  const loadFromFirestore = useCallback(async () => {
    const saved = localStorage.getItem('email-preferences');
    if (!saved) {
      return;
    }
    
    const localPrefs = JSON.parse(saved);
    if (!localPrefs.userEmail) {
      return;
    }
    
    try {
      const docId = localPrefs.userEmail.replace(/[.#$[\]]/g, '_');
      const docRef = doc(db, 'emailPreferences', docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const firestorePrefs = docSnap.data();
        
        // Check if Firestore has a newer version
        const localUpdated = localPrefs.updatedAt || 0;
        const firestoreUpdated = firestorePrefs.updatedAt || 0;
        
        if (firestoreUpdated > localUpdated) {
          
          // Update local state with Firestore data
          setEmailPreferences(prev => ({
            ...prev,
            ...firestorePrefs,
            // Preserve local-only timestamps if they're more recent
            lastReminderSent: Math.max(prev.lastReminderSent || 0, firestorePrefs.lastReminderSent || 0),
            lastAdvanceReminderSent: Math.max(prev.lastAdvanceReminderSent || 0, firestorePrefs.lastAdvanceReminderSent || 0),
            lastAutoReminderSent: firestorePrefs.lastAutoReminderSent || prev.lastAutoReminderSent,
            lastAutoAdvanceReminderSent: firestorePrefs.lastAutoAdvanceReminderSent || prev.lastAutoAdvanceReminderSent
          }));
        } else {
          // Sync local to Firestore if local is newer
          if (localUpdated > firestoreUpdated) {
            syncPreferencesToFirestore(localPrefs);
          }
        }
      } else {
        // No Firestore data yet, sync local to Firestore
        syncPreferencesToFirestore(localPrefs);
      }
    } catch (error) {
      // Error propagates to caller
    }
  }, [syncPreferencesToFirestore]);

  // Load preferences from Firestore on mount (to sync across devices)
  useEffect(() => {
    loadFromFirestore();
  }, [loadFromFirestore]); // Run once on mount

  // Also check Firestore periodically (every 30 seconds) to catch updates from other devices
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (emailPreferences.userEmail) {
        loadFromFirestore();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, [emailPreferences.userEmail, loadFromFirestore]); // Re-create interval if email changes

  /**
   * Update email preferences
   * @param {Object} newPreferences - Updated preferences
   */
  const updateEmailPreferences = (newPreferences) => {
    setEmailPreferences(prev => {
      const updated = { 
        ...prev, 
        ...newPreferences,
        updatedAt: new Date().toISOString() // Add timestamp to track which version is newest
      };
      
      // If reminder time changed, clear auto reminder timestamps so reminders can be sent at new time
      if (newPreferences.reminderTime && newPreferences.reminderTime !== prev.reminderTime) {
        updated.lastAutoReminderSent = null;
        updated.lastAutoAdvanceReminderSent = null;
      }
      
      // If advance days changed, clear advance reminder timestamp
      if (newPreferences.advanceDays && newPreferences.advanceDays !== prev.advanceDays) {
        updated.lastAutoAdvanceReminderSent = null;
      }

      if (updated.userEmail) {
        syncPreferencesToFirestore(updated);
      }
      
      return updated;
    });
  };

  /**
   * Reset email preferences to defaults and clear localStorage
   */
  const resetEmailPreferences = () => {
    localStorage.removeItem('email-preferences');
    setEmailPreferences({
      enabled: false,
      userEmail: '',
      userName: '',
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
      lastWeeklySummarySent: null
    });
  };

  /**
   * Force update reminder time (workaround for React state caching)
   */
  const forceUpdateReminderTime = (newTime) => {
    setEmailPreferences(prev => ({
      ...prev,
      reminderTime: newTime,
      lastAutoReminderSent: null,
      lastAutoAdvanceReminderSent: null
    }));
  };

  /**
   * Get TODOs that are due today
   * @returns {Array} Array of due TODOs
   */
  const getDueTodos = () => {
    const today = dayjs();
    
    return allEvents.filter(evt => {
      // Include both recurring TODOs and manually created TODOs (title starts with "TO DO:" OR toDo field starts with "TO DO:")
      const isTodoEvent = evt.isRecurringTodo || 
                         (typeof evt.title === 'string' && evt.title.startsWith("TO DO:")) ||
                         (typeof evt.toDo === 'string' && evt.toDo.startsWith("TO DO:"));
      if (!isTodoEvent || evt.completed) return false;
      
      const eventDate = dayjs(evt.day);
      return eventDate.isSame(today, 'day');
    });
  };

  /**
   * Get overdue TODOs
   * @returns {Array} Array of overdue TODOs
   */
  const getOverdueTodos = () => {
    const today = dayjs();
    
    return allEvents.filter(evt => {
      // Include both recurring TODOs and manually created TODOs (title starts with "TO DO:" OR toDo field starts with "TO DO:")
      const isTodoEvent = evt.isRecurringTodo || 
                         (typeof evt.title === 'string' && evt.title.startsWith("TO DO:")) ||
                         (typeof evt.toDo === 'string' && evt.toDo.startsWith("TO DO:"));
      if (!isTodoEvent || evt.completed) return false;
      
      const eventDate = dayjs(evt.day);
      return eventDate.isBefore(today, 'day');
    });
  };

  /**
   * Get upcoming TODOs (next 7 days)
   * @returns {Array} Array of upcoming TODOs
   */
  const getUpcomingTodos = () => {
    const today = dayjs();
    const nextWeek = today.add(7, 'days');
    
    return allEvents.filter(evt => {
      // Include both recurring TODOs and manually created TODOs (title starts with "TO DO:" OR toDo field starts with "TO DO:")
      const isTodoEvent = evt.isRecurringTodo || 
                         (typeof evt.title === 'string' && evt.title.startsWith("TO DO:")) ||
                         (typeof evt.toDo === 'string' && evt.toDo.startsWith("TO DO:"));
      if (!isTodoEvent || evt.completed) return false;
      
      const eventDate = dayjs(evt.day);
      return eventDate.isAfter(today, 'day') && eventDate.isBefore(nextWeek, 'day');
    });
  };

  /**
   * Get TODOs due in specified number of days (for advance reminders)
   * @param {number} days - Number of days ahead to check (default: 3)
   * @returns {Array} Array of TODOs due in specified days
   */
  const getTodosInAdvance = (days = 3) => {
    const targetDate = dayjs().add(days, 'days');
    
    const matchingTodos = allEvents.filter(evt => {
      // Include both recurring TODOs and manually created TODOs (title starts with "TO DO:" OR toDo field starts with "TO DO:")
      const isTodoEvent = evt.isRecurringTodo || 
                         (typeof evt.title === 'string' && evt.title.startsWith("TO DO:")) ||
                         (typeof evt.toDo === 'string' && evt.toDo.startsWith("TO DO:"));
      if (!isTodoEvent || evt.completed) return false;
      
      const eventDate = dayjs(evt.day);
      const matches = eventDate.isSame(targetDate, 'day');
      
      return matches;
    });
    
    return matchingTodos;
  };

  /**
   * Send daily reminder email
   * @param {boolean} isAutomatic - Whether this is an automatic reminder (vs manual)
   * @returns {Promise<boolean>} Success status
   */
  const sendDailyReminder = async (isAutomatic = false) => {

    if (!emailPreferences.enabled || !emailPreferences.userEmail) {
      return false;
    }

    // Check Firestore first - another tab or Cloud Function may have already sent
    try {
      const docId = emailPreferences.userEmail.replace(/[.#$[\]]/g, '_');
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
    } catch (e) {
      // Error checking Firestore - continue with send attempt
    }

    const dueTodos = getDueTodos();
    const overdueTodos = getOverdueTodos();
    const allTodos = [...overdueTodos, ...dueTodos];

    if (allTodos.length === 0) {
      return true; // No error, just nothing to send
    }

    try {
      const success = await emailService.sendTodoReminder({
        userEmail: emailPreferences.userEmail,
        userName: emailPreferences.userName,
        todos: allTodos,
        reminderType: 'Daily Garden Reminder'
      });

      if (success) {
        const updated = {
          ...emailPreferences,
          lastReminderSent: Date.now(),
          ...(isAutomatic && { lastAutoReminderSent: Date.now() })
        };
        setEmailPreferences(prev => ({ ...prev, ...updated }));
        // Sync to Firestore so Cloud Functions and other tabs see we already sent
        if (updated.userEmail) syncPreferencesToFirestore(updated);
      }

      return success;
    } catch (error) {
      return false;
    }
  };

  /**
   * Send advance reminder email for TODOs due in X days
   * @param {boolean} isAutomatic - Whether this is an automatic reminder (vs manual)
   * @returns {Promise<boolean>} Success status
   */
  const sendAdvanceReminder = async (isAutomatic = false) => {

    if (!emailPreferences.enabled || !emailPreferences.userEmail || !emailPreferences.advanceReminders) {
      return false;
    }

    // Check Firestore first - another tab or Cloud Function may have already sent
    try {
      const docId = emailPreferences.userEmail.replace(/[.#$[\]]/g, '_');
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
    } catch (e) {
      // Error checking Firestore - continue with send attempt
    }

    const advanceTodos = getTodosInAdvance(emailPreferences.advanceDays);

    if (advanceTodos.length === 0) {
      return true; // No error, just nothing to send
    }

    try {
      const success = await emailService.sendTodoReminder({
        userEmail: emailPreferences.userEmail,
        userName: emailPreferences.userName,
        todos: advanceTodos,
        reminderType: `${emailPreferences.advanceDays}-Day Advance Garden Reminder`
      });

      if (success) {
        const updated = {
          ...emailPreferences,
          lastAdvanceReminderSent: Date.now(),
          ...(isAutomatic && { lastAutoAdvanceReminderSent: Date.now() })
        };
        setEmailPreferences(prev => ({ ...prev, ...updated }));
        // Sync to Firestore so Cloud Functions and other tabs see we already sent
        if (updated.userEmail) syncPreferencesToFirestore(updated);
      }

      return success;
    } catch (error) {
      return false;
    }
  };

  /**
   * Send weekly summary email ("here's your week ahead")
   * @returns {Promise<boolean>} Success status
   */
  const sendWeeklySummary = async () => {
    if (!emailPreferences.enabled || !emailPreferences.userEmail) {
      return false;
    }

    try {
      return await emailService.sendWeeklySummary({
        userEmail: emailPreferences.userEmail,
        userName: emailPreferences.userName
      });
    } catch (error) {
      return false;
    }
  };

  /**
   * Send immediate reminder for specific TODOs
   * @param {Array} todos - TODOs to send reminder for
   * @param {string} reminderType - Type of reminder
   * @returns {Promise<boolean>} Success status
   */
  const sendImmediateReminder = async (todos, reminderType = 'TODO Reminder') => {
    if (!emailPreferences.enabled || !emailPreferences.userEmail) {
      return false;
    }

    if (!todos || todos.length === 0) {
      return false;
    }

    try {
      return await emailService.sendTodoReminder({
        userEmail: emailPreferences.userEmail,
        userName: emailPreferences.userName,
        todos: todos,
        reminderType: reminderType
      });
    } catch (error) {
      return false;
    }
  };

  /**
   * Test email configuration
   * @returns {Promise<boolean>} Success status
   */
  const testEmailConfiguration = async () => {
    if (!emailPreferences.userEmail) {
      throw new Error('Please enter your email address first');
    }

    return await emailService.testEmailConfiguration(emailPreferences.userEmail);
  };

  /**
   * Check if daily reminder should be sent
   * @returns {boolean} Whether to send reminder
   */
  const shouldSendDailyReminder = () => {
    if (!emailPreferences.enabled || !emailPreferences.dailyReminder) {
      return false;
    }

    const now = dayjs();
    const [reminderHour, reminderMinute] = emailPreferences.reminderTime.split(':').map(Number);
    const lastSent = emailPreferences.lastAutoReminderSent 
      ? dayjs(emailPreferences.lastAutoReminderSent) 
      : null;

    // Create a time today at the reminder time for comparison
    const reminderTimeToday = now.hour(reminderHour).minute(reminderMinute).second(0);

    // Check if current time is within the reminder window (reminder time to 5 minutes after)
    const fiveMinutesAfter = reminderTimeToday.add(5, 'minutes');
    const isTimeToSend = now.isAfter(reminderTimeToday) && now.isBefore(fiveMinutesAfter);

    // Check if we haven't sent an automatic reminder today yet 
    const haventSentAutoToday = !lastSent || !lastSent.isSame(now, 'day');

    // Check if there are TODOs that need reminding
    const dueTodos = getDueTodos();
    const overdueTodos = getOverdueTodos();
    const hasTodosToRemind = dueTodos.length > 0 || overdueTodos.length > 0;

    return isTimeToSend && haventSentAutoToday && hasTodosToRemind;
  };

  /**
   * Check if advance reminder should be sent
   * @returns {boolean} Whether to send advance reminder
   */
  const shouldSendAdvanceReminder = () => {
    if (!emailPreferences.enabled || !emailPreferences.advanceReminders) {
      return false;
    }

    const now = dayjs();
    const [reminderHour, reminderMinute] = emailPreferences.reminderTime.split(':').map(Number);
    const lastSent = emailPreferences.lastAutoAdvanceReminderSent 
      ? dayjs(emailPreferences.lastAutoAdvanceReminderSent) 
      : null;

    // Create a time today at the reminder time for comparison
    const reminderTimeToday = now.hour(reminderHour).minute(reminderMinute).second(0);

    // Check if current time is within the reminder window (reminder time to 5 minutes after)
    const fiveMinutesAfter = reminderTimeToday.add(5, 'minutes');
    const isTimeToSend = now.isAfter(reminderTimeToday) && now.isBefore(fiveMinutesAfter);

    // Check if we haven't sent an automatic advance reminder today yet
    const haventSentAutoToday = !lastSent || !lastSent.isSame(now, 'day');

    // Check if there are actually TODOs due in the advance period
    const advanceTodos = getTodosInAdvance(emailPreferences.advanceDays);
    const hasTodosToRemind = advanceTodos.length > 0;

    return isTimeToSend && haventSentAutoToday && hasTodosToRemind;
  };

  /**
   * Get summary of TODOs for display
   * @returns {Object} TODO summary
   */
  const getTodoSummary = () => {
    const dueTodos = getDueTodos();
    const overdueTodos = getOverdueTodos();
    const upcomingTodos = getUpcomingTodos();
    const advanceTodos = getTodosInAdvance(emailPreferences.advanceDays);

    return {
      dueToday: dueTodos.length,
      overdue: overdueTodos.length,
      upcoming: upcomingTodos.length,
      advance: advanceTodos.length,
      total: dueTodos.length + overdueTodos.length + upcomingTodos.length,
      dueTodos,
      overdueTodos,
      upcomingTodos,
      advanceTodos
    };
  };

  /**
   * Check if email service is properly configured
   * @returns {boolean} Configuration status
   */
  const isEmailServiceReady = () => {
    return emailService.isReady();
  };

  /**
   * Get email service configuration details
   * @returns {Object} Configuration details
   */
  const getEmailServiceStatus = () => {
    return emailService.getConfigurationStatus();
  };

  return {
    emailPreferences,
    updateEmailPreferences,
    resetEmailPreferences,
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
    testEmailConfiguration,
    shouldSendDailyReminder,
    shouldSendAdvanceReminder,
    getTodoSummary,
    isEmailServiceReady,
    getEmailServiceStatus
  };
};

