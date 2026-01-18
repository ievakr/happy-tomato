/**
 * Error Logger Utility
 * Centralized error logging and reporting
 */

import { captureError, setSentryUser } from './sentry';

class ErrorLogger {
  constructor() {
    this.errorQueue = [];
    this.isOnline = navigator.onLine;
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Log an error with context information
   * @param {Error} error - The error object
   * @param {Object} errorInfo - React error info
   * @param {string} context - Context where the error occurred
   * @param {Object} additionalData - Additional context data
   */
  logError(error, errorInfo = null, context = 'Unknown', additionalData = {}) {
    const userId = this.getUserId();
    const sessionId = this.getSessionId();
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      },
      context,
      errorInfo: errorInfo ? {
        componentStack: errorInfo.componentStack
      } : null,
      userAgent: navigator.userAgent,
      url: window.location.href,
      additionalData,
      userId,
      sessionId,
      buildVersion: process.env.REACT_APP_VERSION || 'unknown'
    };

    // Log to console
    console.error(`[${context}] Error logged:`, errorLog);

    // Store in local storage for persistence
    this.storeErrorLocally(errorLog);

    // Send to remote service if online
    if (this.isOnline) {
      this.sendToErrorService(errorLog);
    } else {
      this.errorQueue.push(errorLog);
    }
  }

  /**
   * Store error locally in localStorage
   * @param {Object} errorLog - The error log object
   */
  storeErrorLocally(errorLog) {
    try {
      const storedErrors = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      storedErrors.push(errorLog);
      
      // Keep only last 50 errors to prevent storage overflow
      if (storedErrors.length > 50) {
        storedErrors.splice(0, storedErrors.length - 50);
      }
      
      localStorage.setItem('errorLogs', JSON.stringify(storedErrors));
    } catch (e) {
      console.error('Failed to store error locally:', e);
    }
  }

  /**
   * Send error to remote error reporting service
   * @param {Object} errorLog - The error log object
   */
  async sendToErrorService(errorLog) {
    try {
      setSentryUser(errorLog.userId);

      const sentryError = new Error(
        errorLog.error?.message || 'Unknown error'
      );
      sentryError.name = errorLog.error?.name || 'Error';
      sentryError.stack = errorLog.error?.stack;

      captureError(sentryError, {
        tags: {
          context: errorLog.context
        },
        extras: {
          additionalData: errorLog.additionalData,
          sessionId: errorLog.sessionId,
          buildVersion: errorLog.buildVersion,
          userAgent: errorLog.userAgent,
          url: errorLog.url
        },
        contexts: errorLog.errorInfo ? {
          react: {
            componentStack: errorLog.errorInfo.componentStack
          }
        } : undefined
      });
    } catch (e) {
      console.error('Failed to send error to service:', e);
      // Add back to queue for retry
      this.errorQueue.push(errorLog);
    }
  }

  /**
   * Flush queued errors when coming back online
   */
  flushErrorQueue() {
    if (this.errorQueue.length > 0) {
      console.log(`Flushing ${this.errorQueue.length} queued errors`);
      
      this.errorQueue.forEach(errorLog => {
        this.sendToErrorService(errorLog);
      });
      
      this.errorQueue = [];
    }
  }

  /**
   * Get user ID from context or localStorage
   * @returns {string} User ID or 'anonymous'
   */
  getUserId() {
    // Implement based on your auth system
    return localStorage.getItem('userId') || 'anonymous';
  }

  /**
   * Get or generate session ID
   * @returns {string} Session ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  /**
   * Get stored error logs
   * @returns {Array} Array of error logs
   */
  getStoredErrors() {
    try {
      return JSON.parse(localStorage.getItem('errorLogs') || '[]');
    } catch (e) {
      console.error('Failed to retrieve stored errors:', e);
      return [];
    }
  }

  /**
   * Clear stored error logs
   */
  clearStoredErrors() {
    try {
      localStorage.removeItem('errorLogs');
    } catch (e) {
      console.error('Failed to clear stored errors:', e);
    }
  }
}

// Create singleton instance
const errorLogger = new ErrorLogger();

export default errorLogger; 