import { useCallback } from 'react';
import errorLogger from '../utils/errorLogger';

/**
 * Custom hook for error handling
 * Provides utilities for reporting errors manually
 */
export function useErrorHandler() {
  /**
   * Report an error manually
   * @param {Error} error - The error to report
   * @param {string} context - Context where the error occurred
   * @param {Object} additionalData - Additional data about the error
   */
  const reportError = useCallback((error, context = 'Manual Report', additionalData = {}) => {
    errorLogger.logError(error, null, context, additionalData);
  }, []);

  /**
   * Create an error boundary for async operations
   * @param {string} context - Context for the operation
   * @returns {Function} Error handler function
   */
  const createAsyncErrorHandler = useCallback((context) => {
    return (error) => {
      console.error(`Async error in ${context}:`, error);
      errorLogger.logError(error, null, `Async Operation: ${context}`, {
        type: 'async-error',
        timestamp: new Date().toISOString()
      });
    };
  }, []);

  /**
   * Wrap an async function with error handling
   * @param {Function} asyncFn - The async function to wrap
   * @param {string} context - Context for error reporting
   * @returns {Function} Wrapped function
   */
  const wrapAsync = useCallback((asyncFn, context = 'Async Operation') => {
    return async (...args) => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        const errorHandler = createAsyncErrorHandler(context);
        errorHandler(error);
        throw error; // Re-throw to maintain normal error flow
      }
    };
  }, [createAsyncErrorHandler]);

  /**
   * Handle errors in event handlers
   * @param {Function} eventHandler - The event handler function
   * @param {string} context - Context for error reporting
   * @returns {Function} Wrapped event handler
   */
  const wrapEventHandler = useCallback((eventHandler, context = 'Event Handler') => {
    return (...args) => {
      try {
        return eventHandler(...args);
      } catch (error) {
        console.error(`Error in ${context}:`, error);
        errorLogger.logError(error, null, `Event Handler: ${context}`, {
          type: 'event-handler-error',
          arguments: args,
          timestamp: new Date().toISOString()
        });
        // Don't re-throw for event handlers to prevent app crashes
      }
    };
  }, []);

  return {
    reportError,
    createAsyncErrorHandler,
    wrapAsync,
    wrapEventHandler
  };
}

export default useErrorHandler; 