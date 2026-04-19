/**
 * Notification Service for TODO Reminders
 *
 * Scheduled pushes are delivered by Cloud Functions (hourly cron). This service
 * only keeps lightweight diagnostics for the settings/debug UI and supports
 * manual "Send now" from settings — it does not auto-send, to avoid duplicate
 * notifications when the app is open.
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
   * @param {Object} reminderHook - usePushNotifications() instance
   */
  start(reminderHook) {
    if (this.isRunning) {
      this.reminderHook = reminderHook;
      return;
    }

    this.isRunning = true;
    this.reminderHook = reminderHook;

    // Check immediately
    this.checkForReminders();

    // Set up interval checking
    this.checkInterval = setInterval(() => {
      this.checkForReminders();
    }, this.checkFrequency);
  }

  /**
   * Update the reminder hook reference without restarting the service
   * @param {Object} reminderHook - Updated hook instance
   */
  updateReminderHook(reminderHook) {
    this.reminderHook = reminderHook;
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
    this.reminderHook = null;
  }

  /**
   * Check if reminders should be sent
   */
  async checkForReminders() {
    if (!this.reminderHook || !this.isRunning) {
      return;
    }

    try {
      this.lastCheck = new Date();
      
      const shouldSendDaily = this.reminderHook.shouldSendDailyReminder();
      const shouldSendAdvance = this.reminderHook.shouldSendAdvanceReminder();
      const todoSummary = this.reminderHook.getTodoSummary();

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
   * @param {string} reminderType - Type of reminder to send ('daily', 'advance', or 'weekly')
   * @returns {Promise<boolean>} Success status
   */
  async sendManualReminder(reminderType = 'daily') {
    if (!this.reminderHook) {
      return false;
    }

    try {
      let success = false;
      
      if (reminderType === 'advance') {
        success = await this.reminderHook.sendAdvanceReminder();
      } else if (reminderType === 'weekly') {
        success = await this.reminderHook.sendWeeklySummary();
      } else {
        success = await this.reminderHook.sendDailyReminder();
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
      hasReminderHook: !!this.reminderHook
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
      setTimeout(() => this.start(this.reminderHook), 100);
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;

