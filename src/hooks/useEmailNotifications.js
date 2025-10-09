import { useState, useEffect, useContext } from 'react';
import GlobalContext from '../context/GlobalContext';
import emailService from '../services/emailService';
import dayjs from 'dayjs';

/**
 * Custom hook for managing email notifications for TODOs
 */
export const useEmailNotifications = () => {
  const { filteredEvents } = useContext(GlobalContext);
  const [emailPreferences, setEmailPreferences] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem('email-preferences');
    return saved ? JSON.parse(saved) : {
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
      lastAdvanceReminderSent: null
    };
  });

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('email-preferences', JSON.stringify(emailPreferences));
  }, [emailPreferences]);

  /**
   * Update email preferences
   * @param {Object} newPreferences - Updated preferences
   */
  const updateEmailPreferences = (newPreferences) => {
    setEmailPreferences(prev => ({ ...prev, ...newPreferences }));
  };

  /**
   * Get TODOs that are due today
   * @returns {Array} Array of due TODOs
   */
  const getDueTodos = () => {
    const today = dayjs();
    
    return filteredEvents.filter(evt => {
      // Include both recurring TODOs and manually created TODOs (title starts with "TO DO:")
      const isTodoEvent = evt.isRecurringTodo || (typeof evt.title === 'string' && evt.title.startsWith("TO DO:"));
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
    
    return filteredEvents.filter(evt => {
      // Include both recurring TODOs and manually created TODOs (title starts with "TO DO:")
      const isTodoEvent = evt.isRecurringTodo || (typeof evt.title === 'string' && evt.title.startsWith("TO DO:"));
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
    
    return filteredEvents.filter(evt => {
      // Include both recurring TODOs and manually created TODOs (title starts with "TO DO:")
      const isTodoEvent = evt.isRecurringTodo || (typeof evt.title === 'string' && evt.title.startsWith("TO DO:"));
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
    
    return filteredEvents.filter(evt => {
      // Include both recurring TODOs and manually created TODOs (title starts with "TO DO:")
      const isTodoEvent = evt.isRecurringTodo || (typeof evt.title === 'string' && evt.title.startsWith("TO DO:"));
      if (!isTodoEvent || evt.completed) return false;
      
      const eventDate = dayjs(evt.day);
      return eventDate.isSame(targetDate, 'day');
    });
  };

  /**
   * Send daily reminder email
   * @returns {Promise<boolean>} Success status
   */
  const sendDailyReminder = async () => {
    if (!emailPreferences.enabled || !emailPreferences.userEmail) {
      console.log('Email notifications not enabled or email not configured');
      return false;
    }

    const dueTodos = getDueTodos();
    const overdueTodos = getOverdueTodos();
    const allTodos = [...overdueTodos, ...dueTodos];

    if (allTodos.length === 0) {
      console.log('No TODOs to remind about');
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
        // Update last reminder sent timestamp
        setEmailPreferences(prev => ({
          ...prev,
          lastReminderSent: Date.now()
        }));
      }

      return success;
    } catch (error) {
      console.error('Failed to send daily reminder:', error);
      return false;
    }
  };

  /**
   * Send advance reminder email for TODOs due in X days
   * @returns {Promise<boolean>} Success status
   */
  const sendAdvanceReminder = async () => {
    if (!emailPreferences.enabled || !emailPreferences.userEmail || !emailPreferences.advanceReminders) {
      console.log('Advance reminders not enabled or email not configured');
      return false;
    }

    const advanceTodos = getTodosInAdvance(emailPreferences.advanceDays);

    if (advanceTodos.length === 0) {
      console.log('No TODOs due in advance period to remind about');
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
        // Update last advance reminder sent timestamp
        setEmailPreferences(prev => ({
          ...prev,
          lastAdvanceReminderSent: Date.now()
        }));
      }

      return success;
    } catch (error) {
      console.error('Failed to send advance reminder:', error);
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
    const lastSent = emailPreferences.lastReminderSent 
      ? dayjs(emailPreferences.lastReminderSent) 
      : null;

    // Create a time today at the reminder time for comparison
    const reminderTimeToday = now.hour(reminderHour).minute(reminderMinute).second(0);

    // Check if current time is past reminder time
    const isTimeToSend = now.isAfter(reminderTimeToday) || now.isSame(reminderTimeToday, 'minute');

    // Check if we haven't sent a reminder today yet
    const haventSentToday = !lastSent || !lastSent.isSame(now, 'day');

    // Check if there are TODOs that need reminding
    const dueTodos = getDueTodos();
    const overdueTodos = getOverdueTodos();
    const hasTodosToRemind = dueTodos.length > 0 || overdueTodos.length > 0;

    console.log('🔍 Daily reminder check details:', {
      currentTime: now.format('HH:mm:ss'),
      reminderTime: emailPreferences.reminderTime,
      reminderTimeToday: reminderTimeToday.format('HH:mm:ss'),
      isTimeToSend,
      haventSentToday,
      hasTodosToRemind,
      lastSent: lastSent ? lastSent.format('YYYY-MM-DD HH:mm:ss') : 'Never',
      dueTodosCount: dueTodos.length,
      overdueTodosCount: overdueTodos.length,
      shouldSend: isTimeToSend && haventSentToday && hasTodosToRemind
    });

    return isTimeToSend && haventSentToday && hasTodosToRemind;
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
    const lastSent = emailPreferences.lastAdvanceReminderSent 
      ? dayjs(emailPreferences.lastAdvanceReminderSent) 
      : null;

    // Create a time today at the reminder time for comparison
    const reminderTimeToday = now.hour(reminderHour).minute(reminderMinute).second(0);

    // Check if current time is past reminder time
    const isTimeToSend = now.isAfter(reminderTimeToday) || now.isSame(reminderTimeToday, 'minute');

    // Check if we haven't sent an advance reminder today yet
    const haventSentToday = !lastSent || !lastSent.isSame(now, 'day');

    // Check if there are actually TODOs due in the advance period
    const advanceTodos = getTodosInAdvance(emailPreferences.advanceDays);
    const hasTodosToRemind = advanceTodos.length > 0;

    console.log('🔍 Advance reminder check details:', {
      currentTime: now.format('HH:mm:ss'),
      reminderTime: emailPreferences.reminderTime,
      reminderTimeToday: reminderTimeToday.format('HH:mm:ss'),
      isTimeToSend,
      haventSentToday,
      hasTodosToRemind,
      advanceDays: emailPreferences.advanceDays,
      lastSent: lastSent ? lastSent.format('YYYY-MM-DD HH:mm:ss') : 'Never',
      advanceTodosCount: advanceTodos.length,
      shouldSend: isTimeToSend && haventSentToday && hasTodosToRemind
    });

    return isTimeToSend && haventSentToday && hasTodosToRemind;
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

