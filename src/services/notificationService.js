/**
 * Notification Service for TODO Reminders
 * Handles scheduled checks and automatic email sending
 */

class NotificationService {
  constructor() {
    this.checkInterval = null;
    this.isRunning = false;
    this.checkFrequency = 60000; // Check every minute
    this.lastCheck = null;
  }

  /**
   * Start the notification service
   * @param {Object} emailHook - Email notifications hook instance
   */
  start(emailHook) {
    if (this.isRunning) {
      console.log('Notification service already running');
      return;
    }

    console.log('Starting notification service...');
    this.isRunning = true;
    this.emailHook = emailHook;

    // Check immediately
    this.checkForReminders();

    // Set up interval checking
    this.checkInterval = setInterval(() => {
      this.checkForReminders();
    }, this.checkFrequency);

    console.log(`Notification service started - checking every ${this.checkFrequency / 1000} seconds`);
  }

  /**
   * Stop the notification service
   */
  stop() {
    if (!this.isRunning) {
      console.log('Notification service not running');
      return;
    }

    console.log('Stopping notification service...');
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this.isRunning = false;
    this.emailHook = null;
    console.log('Notification service stopped');
  }

  /**
   * Check if reminders should be sent
   */
  async checkForReminders() {
    if (!this.emailHook || !this.isRunning) {
      return;
    }

    try {
      this.lastCheck = new Date();
      
      // Get current status for debugging
      const shouldSendDaily = this.emailHook.shouldSendDailyReminder();
      const shouldSendAdvance = this.emailHook.shouldSendAdvanceReminder();
      const todoSummary = this.emailHook.getTodoSummary();
      
      // Log check details for debugging
      console.log(`🔍 Reminder check at ${this.lastCheck.toLocaleTimeString()}:`, {
        shouldSendDaily,
        shouldSendAdvance,
        todosCount: {
          dueToday: todoSummary.dueToday,
          overdue: todoSummary.overdue,
          advance: todoSummary.advance
        },
        preferences: {
          enabled: this.emailHook.emailPreferences.enabled,
          dailyReminder: this.emailHook.emailPreferences.dailyReminder,
          reminderTime: this.emailHook.emailPreferences.reminderTime,
          userEmail: !!this.emailHook.emailPreferences.userEmail
        }
      });

      // Check if daily reminder should be sent
      if (shouldSendDaily) {
        console.log('📅 Time for daily reminder - sending email...');
        
        const success = await this.emailHook.sendDailyReminder();
        
        if (success) {
          console.log('✅ Daily reminder sent successfully');
          this.logNotification('daily_reminder', 'success', `${todoSummary.dueToday + todoSummary.overdue} TODOs`);
        } else {
          console.warn('⚠️ Failed to send daily reminder');
          this.logNotification('daily_reminder', 'failed');
        }
      }

      // Check if advance reminder should be sent
      if (shouldSendAdvance) {
        const advanceDays = this.emailHook.emailPreferences.advanceDays || 3;
        console.log(`🔔 Time for ${advanceDays}-day advance reminder - sending email...`);
        
        const success = await this.emailHook.sendAdvanceReminder();
        
        if (success) {
          console.log(`✅ ${advanceDays}-day advance reminder sent successfully`);
          this.logNotification('advance_reminder', 'success', `${advanceDays} days ahead - ${todoSummary.advance} TODOs`);
        } else {
          console.warn(`⚠️ Failed to send ${advanceDays}-day advance reminder`);
          this.logNotification('advance_reminder', 'failed', `${advanceDays} days ahead`);
        }
      }

      // Log when no reminders are needed (for debugging quiet periods)
      if (!shouldSendDaily && !shouldSendAdvance) {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        
        // Only log every 10 minutes during business hours to avoid spam
        if (hour >= 6 && hour <= 22 && minute % 10 === 0) {
          this.logNotification('check_no_action', 'info', 
            `No reminders needed. Due today: ${todoSummary.dueToday}, Overdue: ${todoSummary.overdue}, Advance: ${todoSummary.advance}`);
        }
      }
    } catch (error) {
      console.error('Error during reminder check:', error);
      this.logNotification('check_error', 'error', error.message);
    }
  }

  /**
   * Force send a reminder immediately (for testing or manual trigger)
   * @param {string} reminderType - Type of reminder to send ('daily' or 'advance')
   * @returns {Promise<boolean>} Success status
   */
  async sendManualReminder(reminderType = 'daily') {
    if (!this.emailHook) {
      console.error('Email hook not available');
      return false;
    }

    try {
      console.log(`Sending manual reminder: ${reminderType}`);
      
      let success = false;
      
      if (reminderType === 'advance') {
        success = await this.emailHook.sendAdvanceReminder();
      } else {
        success = await this.emailHook.sendDailyReminder();
      }
      
      if (success) {
        console.log(`✅ Manual ${reminderType} reminder sent successfully`);
        this.logNotification('manual_reminder', 'success', reminderType);
      } else {
        console.warn(`⚠️ Failed to send manual ${reminderType} reminder`);
        this.logNotification('manual_reminder', 'failed', reminderType);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending manual reminder:', error);
      this.logNotification('manual_reminder', 'error', error.message);
      return false;
    }
  }

  /**
   * Log notification events for debugging and monitoring
   * @param {string} type - Type of notification
   * @param {string} status - Status (success, failed, error)
   * @param {string} details - Additional details
   */
  logNotification(type, status, details = '') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      status,
      details
    };

    console.log('📧 Notification Log:', logEntry);

    // Store in localStorage for debugging (keep last 50 entries)
    try {
      const logs = JSON.parse(localStorage.getItem('notification-logs') || '[]');
      logs.unshift(logEntry);
      
      // Keep only last 50 entries
      const trimmedLogs = logs.slice(0, 50);
      localStorage.setItem('notification-logs', JSON.stringify(trimmedLogs));
    } catch (error) {
      console.warn('Failed to save notification log:', error);
    }
  }

  /**
   * Get notification logs for debugging
   * @returns {Array} Array of log entries
   */
  getNotificationLogs() {
    try {
      return JSON.parse(localStorage.getItem('notification-logs') || '[]');
    } catch (error) {
      console.warn('Failed to retrieve notification logs:', error);
      return [];
    }
  }

  /**
   * Clear notification logs
   */
  clearNotificationLogs() {
    try {
      localStorage.removeItem('notification-logs');
      console.log('Notification logs cleared');
    } catch (error) {
      console.warn('Failed to clear notification logs:', error);
    }
  }

  /**
   * Get service status
   * @returns {Object} Service status information
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastCheck: this.lastCheck,
      checkFrequency: this.checkFrequency,
      hasEmailHook: !!this.emailHook
    };
  }

  /**
   * Update check frequency
   * @param {number} frequency - New frequency in milliseconds
   */
  setCheckFrequency(frequency) {
    if (frequency < 10000) { // Minimum 10 seconds
      console.warn('Check frequency too low, setting to minimum (10 seconds)');
      frequency = 10000;
    }

    this.checkFrequency = frequency;
    
    // Restart interval if service is running
    if (this.isRunning) {
      this.stop();
      setTimeout(() => this.start(this.emailHook), 100);
    }
    
    console.log(`Check frequency updated to ${frequency / 1000} seconds`);
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;

