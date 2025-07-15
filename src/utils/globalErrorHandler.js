import errorLogger from './errorLogger';

/**
 * Global Error Handler
 * Handles uncaught errors and promise rejections
 */
class GlobalErrorHandler {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize global error handlers
   */
  init() {
    if (this.initialized) return;

    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      console.error('Global error caught:', event.error);
      
      errorLogger.logError(
        event.error || new Error(event.message),
        null,
        'Global Error Handler',
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          type: 'javascript-error'
        }
      );
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(event.reason?.toString() || 'Unknown promise rejection');
      
      errorLogger.logError(
        error,
        null,
        'Unhandled Promise Rejection',
        {
          type: 'promise-rejection',
          reason: event.reason
        }
      );
      
      // Prevent the default behavior (logging to console)
      event.preventDefault();
    });

    // Handle React errors that might not be caught by error boundaries
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Check if this is a React error
      if (args[0] && typeof args[0] === 'string' && args[0].includes('React')) {
        const error = new Error(args.join(' '));
        errorLogger.logError(
          error,
          null,
          'React Console Error',
          {
            type: 'react-error',
            arguments: args
          }
        );
      }
      
      // Call original console.error
      originalConsoleError.apply(console, args);
    };

    this.initialized = true;
    console.log('Global error handler initialized');
  }

  /**
   * Manually report an error
   * @param {Error} error - The error to report
   * @param {string} context - Context information
   * @param {Object} additionalData - Additional data
   */
  reportError(error, context = 'Manual Report', additionalData = {}) {
    errorLogger.logError(error, null, context, additionalData);
  }
}

// Create and export singleton instance
const globalErrorHandler = new GlobalErrorHandler();

export default globalErrorHandler; 