import { useState, useEffect, useContext, useCallback } from 'react';
import GlobalContext from '../context/GlobalContext';
import emailService from '../services/emailService';
import dayjs from 'dayjs';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * Custom hook for managing email notifications for TODOs
 */
export const useEmailNotifications = () => {
  const { filteredEvents, savedEvents } = useContext(GlobalContext);
  
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
      lastReminderSent: null,
      lastAdvanceReminderSent: null,
      lastAutoReminderSent: null,
      lastAutoAdvanceReminderSent: null
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
      
      console.log('✅ Email preferences synced to Firestore');
    } catch (error) {
      console.error('❌ Failed to sync preferences to Firestore:', error);
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
      console.log('⚠️ No local preferences found, skipping Firestore sync');
      return;
    }
    
    const localPrefs = JSON.parse(saved);
    if (!localPrefs.userEmail) {
      console.log('⚠️ No email configured, skipping Firestore sync');
      return;
    }
    
    try {
      console.log('🔄 Checking Firestore for updated preferences...');
      const docId = localPrefs.userEmail.replace(/[.#$[\]]/g, '_');
      const docRef = doc(db, 'emailPreferences', docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const firestorePrefs = docSnap.data();
        
        // Check if Firestore has a newer version
        const localUpdated = localPrefs.updatedAt || 0;
        const firestoreUpdated = firestorePrefs.updatedAt || 0;
        
        console.log('📊 Version comparison:', {
          local: { time: localUpdated, reminderTime: localPrefs.reminderTime },
          firestore: { time: firestoreUpdated, reminderTime: firestorePrefs.reminderTime }
        });
        
        if (firestoreUpdated > localUpdated) {
          console.log('📥 Loading newer preferences from Firestore', {
            firestoreTime: firestoreUpdated,
            localTime: localUpdated,
            reminderTime: firestorePrefs.reminderTime
          });
          
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
          console.log('📤 Local preferences are up to date or newer', {
            firestoreTime: firestoreUpdated,
            localTime: localUpdated
          });
          
          // Sync local to Firestore if local is newer
          if (localUpdated > firestoreUpdated) {
            console.log('📤 Syncing newer local preferences to Firestore');
            syncPreferencesToFirestore(localPrefs);
          }
        }
      } else {
        console.log('📤 No Firestore preferences found, syncing local to Firestore');
        // No Firestore data yet, sync local to Firestore
        syncPreferencesToFirestore(localPrefs);
      }
    } catch (error) {
      console.error('❌ Failed to load preferences from Firestore:', error);
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
        console.log('🔄 Periodic Firestore sync check...');
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
        console.log('⏰ Reminder time changed from', prev.reminderTime, 'to', newPreferences.reminderTime);
        console.log('🔄 Clearing auto reminder timestamps to allow sending at new time');
        updated.lastAutoReminderSent = null;
        updated.lastAutoAdvanceReminderSent = null;
      }
      
      // If advance days changed, clear advance reminder timestamp
      if (newPreferences.advanceDays && newPreferences.advanceDays !== prev.advanceDays) {
        console.log('📅 Advance days changed from', prev.advanceDays, 'to', newPreferences.advanceDays);
        console.log('🔄 Clearing advance reminder timestamp');
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
      lastReminderSent: null,
      lastAdvanceReminderSent: null,
      lastAutoReminderSent: null,
      lastAutoAdvanceReminderSent: null
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
    
    console.log('🔍 getTodosInAdvance DEBUG:', {
      daysAhead: days,
      targetDate: targetDate.format('YYYY-MM-DD'),
      totalEvents: allEvents.length
    });
    
    // Log all events to see what we have
    const allTodos = allEvents.filter(evt => {
      const isTodoEvent = evt.isRecurringTodo || 
                         (typeof evt.title === 'string' && evt.title.startsWith("TO DO:")) ||
                         (typeof evt.toDo === 'string' && evt.toDo.startsWith("TO DO:"));
      return isTodoEvent && !evt.completed;
    });
    
    console.log(`📋 All pending todos (${allTodos.length}):`, allTodos.map(t => ({
      title: t.title || t.toDo,
      day: dayjs(t.day).format('YYYY-MM-DD'),
      isRecurringTodo: t.isRecurringTodo,
      completed: t.completed
    })));
    
    const matchingTodos = allEvents.filter(evt => {
      // Include both recurring TODOs and manually created TODOs (title starts with "TO DO:" OR toDo field starts with "TO DO:")
      const isTodoEvent = evt.isRecurringTodo || 
                         (typeof evt.title === 'string' && evt.title.startsWith("TO DO:")) ||
                         (typeof evt.toDo === 'string' && evt.toDo.startsWith("TO DO:"));
      if (!isTodoEvent || evt.completed) return false;
      
      const eventDate = dayjs(evt.day);
      const matches = eventDate.isSame(targetDate, 'day');
      
      if (isTodoEvent && !evt.completed) {
        console.log(`  📝 Checking todo: ${evt.title || evt.toDo} on ${eventDate.format('YYYY-MM-DD')} - ${matches ? '✅ MATCH' : '❌ no match'}`);
      }
      
      return matches;
    });
    
    console.log(`✅ Found ${matchingTodos.length} todos matching target date ${targetDate.format('YYYY-MM-DD')}`);
    
    return matchingTodos;
  };

  /**
   * Send daily reminder email
   * @param {boolean} isAutomatic - Whether this is an automatic reminder (vs manual)
   * @returns {Promise<boolean>} Success status
   */
  const sendDailyReminder = async (isAutomatic = false) => {

    if (!emailPreferences.enabled || !emailPreferences.userEmail) {
      console.log('❌ Email notifications not enabled or email not configured');
      return false;
    }

    const dueTodos = getDueTodos();
    const overdueTodos = getOverdueTodos();
    const allTodos = [...overdueTodos, ...dueTodos];

    if (allTodos.length === 0) {
      console.log('⚠️ No TODOs to remind about');
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
        // Update appropriate timestamp based on whether this is automatic or manual
        setEmailPreferences(prev => ({
          ...prev,
          lastReminderSent: Date.now(),
          ...(isAutomatic && { lastAutoReminderSent: Date.now() })
        }));
      } else {
        console.log('❌ Email service returned false');
      }

      return success;
    } catch (error) {
      console.error('❌ Failed to send daily reminder:', error);
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
      console.log('❌ Advance reminders not enabled or email not configured');
      return false;
    }

    const advanceTodos = getTodosInAdvance(emailPreferences.advanceDays);

    if (advanceTodos.length === 0) {
      console.log('⚠️ No TODOs due in advance period to remind about');
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
        // Update appropriate timestamp based on whether this is automatic or manual
        setEmailPreferences(prev => ({
          ...prev,
          lastAdvanceReminderSent: Date.now(),
          ...(isAutomatic && { lastAutoAdvanceReminderSent: Date.now() })
        }));
      } else {
        console.log('❌ Advance email service returned false');
      }

      return success;
    } catch (error) {
      console.error('❌ Failed to send advance reminder:', error);
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
      console.log('Email notifications not enabled or email not configured');
      return false;
    }

    if (!todos || todos.length === 0) {
      console.log('No TODOs provided for reminder');
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
      console.error('Failed to send immediate reminder:', error);
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
      console.log('❌ Daily reminder check: Not enabled or disabled', {
        enabled: emailPreferences.enabled,
        dailyReminder: emailPreferences.dailyReminder
      });
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

    console.log('🔍 Daily reminder check details:', {
      currentTime: now.format('HH:mm:ss'),
      reminderTime: emailPreferences.reminderTime,
      reminderTimeToday: reminderTimeToday.format('HH:mm:ss'),
      isTimeToSend,
      haventSentAutoToday,
      hasTodosToRemind,
      lastSent: lastSent ? lastSent.format('YYYY-MM-DD HH:mm:ss') : 'Never',
      dueTodosCount: dueTodos.length,
      overdueTodosCount: overdueTodos.length,
      shouldSend: isTimeToSend && haventSentAutoToday && hasTodosToRemind
    });

    return isTimeToSend && haventSentAutoToday && hasTodosToRemind;
  };

  /**
   * Check if advance reminder should be sent
   * @returns {boolean} Whether to send advance reminder
   */
  const shouldSendAdvanceReminder = () => {
    if (!emailPreferences.enabled || !emailPreferences.advanceReminders) {
      console.log('❌ Advance reminder check: Not enabled or disabled', {
        enabled: emailPreferences.enabled,
        advanceReminders: emailPreferences.advanceReminders
      });
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

    console.log('🔍 Advance reminder check details:', {
      currentTime: now.format('HH:mm:ss'),
      reminderTime: emailPreferences.reminderTime,
      reminderTimeToday: reminderTimeToday.format('HH:mm:ss'),
      isTimeToSend,
      haventSentAutoToday,
      hasTodosToRemind,
      advanceDays: emailPreferences.advanceDays,
      lastSent: lastSent ? lastSent.format('YYYY-MM-DD HH:mm:ss') : 'Never',
      advanceTodosCount: advanceTodos.length,
      shouldSend: isTimeToSend && haventSentAutoToday && hasTodosToRemind
    });

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
    sendImmediateReminder,
    testEmailConfiguration,
    shouldSendDailyReminder,
    shouldSendAdvanceReminder,
    getTodoSummary,
    isEmailServiceReady,
    getEmailServiceStatus
  };
};

