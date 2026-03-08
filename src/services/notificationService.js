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
      this.emailHook = emailHook;
      return;
    }

    this.isRunning = true;
    this.emailHook = emailHook;

    // Check immediately
    this.checkForReminders();

    // Set up interval checking
    this.checkInterval = setInterval(() => {
      this.checkForReminders();
    }, this.checkFrequency);
  }

  /**
   * Update the email hook reference without restarting the service
   * @param {Object} emailHook - Updated email notifications hook instance
   */
  updateEmailHook(emailHook) {
    this.emailHook = emailHook;
  }

  /**
   * Stop the notification service
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this.isRunning = false;
    this.emailHook = null;
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

      // Only send ONE type of reminder per check cycle to avoid race conditions
      // Priority: Daily reminder first, then advance reminder in next cycle
      if (shouldSendDaily) {
        const success = await this.emailHook.sendDailyReminder(true); // isAutomatic = true
        
        if (success) {
          this.logNotification('daily_reminder', 'success', `${todoSummary.dueToday + todoSummary.overdue} TODOs`);
        } else {
          this.logNotification('daily_reminder', 'failed');
        }
      } else if (shouldSendAdvance) {
        // Only check advance if daily wasn't sent
        const advanceDays = this.emailHook.emailPreferences.advanceDays || 3;
        const success = await this.emailHook.sendAdvanceReminder(true); // isAutomatic = true
        
        if (success) {
          this.logNotification('advance_reminder', 'success', `${advanceDays} days ahead - ${todoSummary.advance} TODOs`);
        } else {
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
      return false;
    }

    try {
      let success = false;
      
      if (reminderType === 'advance') {
        success = await this.emailHook.sendAdvanceReminder();
      } else {
        success = await this.emailHook.sendDailyReminder();
      }
      
      if (success) {
        this.logNotification('manual_reminder', 'success', reminderType);
      } else {
        this.logNotification('manual_reminder', 'failed', reminderType);
      }
      
      return success;
    } catch (error) {
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

    // Store in localStorage for debugging (keep last 50 entries)
    try {
      const logs = JSON.parse(localStorage.getItem('notification-logs') || '[]');
      logs.unshift(logEntry);
      
      // Keep only last 50 entries
      const trimmedLogs = logs.slice(0, 50);
      localStorage.setItem('notification-logs', JSON.stringify(trimmedLogs));
    } catch (error) {
      // Failed to save notification log
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
      return [];
    }
  }

  /**
   * Clear notification logs
   */
  clearNotificationLogs() {
    try {
      localStorage.removeItem('notification-logs');
    } catch (error) {
      // Failed to clear notification logs
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
      frequency = 10000;
    }

    this.checkFrequency = frequency;
    
    // Restart interval if service is running
    if (this.isRunning) {
      this.stop();
      setTimeout(() => this.start(this.emailHook), 100);
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;

