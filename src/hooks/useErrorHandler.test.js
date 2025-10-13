import { renderHook, act } from '@testing-library/react';
import { useErrorHandler } from './useErrorHandler';
import errorLogger from '../utils/errorLogger';
import { createWrapper } from '../test-utils/test-wrapper';

// Mock error logger
jest.mock('../utils/errorLogger', () => ({
  logError: jest.fn()
}));

describe('useErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('reportError', () => {
    test('should report error with default context', () => {
      const { result } = renderHook(() => useErrorHandler(), { wrapper: createWrapper() });
      const testError = new Error('Test error');

      act(() => {
        result.current.reportError(testError);
      });

      expect(errorLogger.logError).toHaveBeenCalledWith(
        testError,
        null,
        'Manual Report',
        {}
      );
    });

    test('should report error with custom context', () => {
      const { result } = renderHook(() => useErrorHandler(), { wrapper: createWrapper() });
      const testError = new Error('Test error');

      act(() => {
        result.current.reportError(testError, 'Custom Context');
      });

      expect(errorLogger.logError).toHaveBeenCalledWith(
        testError,
        null,
        'Custom Context',
        {}
      );
    });

    test('should report error with additional data', () => {
      const { result } = renderHook(() => useErrorHandler(), { wrapper: createWrapper() });
      const testError = new Error('Test error');
      const additionalData = { userId: '123', action: 'submit' };

      act(() => {
        result.current.reportError(testError, 'Form Submission', additionalData);
      });

      expect(errorLogger.logError).toHaveBeenCalledWith(
        testError,
        null,
        'Form Submission',
        additionalData
      );
    });

    test('should maintain stable reference across renders', () => {
      const { result, rerender } = renderHook(() => useErrorHandler(), { wrapper: createWrapper() });
      const firstRef = result.current.reportError;

      rerender();

      expect(result.current.reportError).toBe(firstRef);
    });
  });

  describe('createAsyncErrorHandler', () => {
    test('should create error handler for async operations', () => {
      const { result } = renderHook(() => useErrorHandler(), { wrapper: createWrapper() });
      const testError = new Error('Async error');

      let errorHandler;
      act(() => {
        errorHandler = result.current.createAsyncErrorHandler('API Call');
      });

      act(() => {
        errorHandler(testError);
      });

      expect(console.error).toHaveBeenCalledWith(
        'Async error in API Call:',
        testError
      );
      expect(errorLogger.logError).toHaveBeenCalledWith(
        testError,
        null,
        'Async Operation: API Call',
        expect.objectContaining({
          type: 'async-error',
          timestamp: expect.any(String)
        })
      );
    });

    test('should include timestamp in error log', () => {
      const { result } = renderHook(() => useErrorHandler(), { wrapper: createWrapper() });
      const testError = new Error('Async error');

      let errorHandler;
      act(() => {
        errorHandler = result.current.createAsyncErrorHandler('Data Fetch');
      });

      const beforeTime = new Date().toISOString();
      act(() => {
        errorHandler(testError);
      });
      const afterTime = new Date().toISOString();

      const logCall = errorLogger.logError.mock.calls[0];
      const loggedData = logCall[3];
      
      expect(loggedData.timestamp).toBeDefined();
      expect(loggedData.timestamp >= beforeTime).toBe(true);
      expect(loggedData.timestamp <= afterTime).toBe(true);
    });
  });

  describe('wrapAsync', () => {
    test('should wrap async function and handle success', async () => {
      const { result } = renderHook(() => useErrorHandler(), { wrapper: createWrapper() });
      const mockAsyncFn = jest.fn().mockResolvedValue('success');

      let wrappedFn;
      act(() => {
        wrappedFn = result.current.wrapAsync(mockAsyncFn, 'Test Operation');
      });

      const returnValue = await wrappedFn('arg1', 'arg2');

      expect(mockAsyncFn).toHaveBeenCalledWith('arg1', 'arg2');
      expect(returnValue).toBe('success');
      expect(errorLogger.logError).not.toHaveBeenCalled();
    });

    test('should wrap async function and handle errors', async () => {
      const { result } = renderHook(() => useErrorHandler(), { wrapper: createWrapper() });
      const testError = new Error('Async failure');
      const mockAsyncFn = jest.fn().mockRejectedValue(testError);

      let wrappedFn;
      act(() => {
        wrappedFn = result.current.wrapAsync(mockAsyncFn, 'Test Operation');
      });

      await expect(wrappedFn()).rejects.toThrow('Async failure');

      expect(console.error).toHaveBeenCalledWith(
        'Async error in Test Operation:',
        testError
      );
      expect(errorLogger.logError).toHaveBeenCalledWith(
        testError,
        null,
        'Async Operation: Test Operation',
        expect.objectContaining({
          type: 'async-error'
        })
      );
    });

    test('should pass arguments correctly', async () => {
      const { result } = renderHook(() => useErrorHandler(), { wrapper: createWrapper() });
      const mockAsyncFn = jest.fn().mockResolvedValue('result');

      let wrappedFn;
      act(() => {
        wrappedFn = result.current.wrapAsync(mockAsyncFn);
      });

      await wrappedFn(1, 2, 3);

      expect(mockAsyncFn).toHaveBeenCalledWith(1, 2, 3);
    });
  });

  describe('wrapEventHandler', () => {
    test('should wrap event handler and handle success', () => {
      const { result } = renderHook(() => useErrorHandler(), { wrapper: createWrapper() });
      const mockHandler = jest.fn().mockReturnValue('success');

      let wrappedHandler;
      act(() => {
        wrappedHandler = result.current.wrapEventHandler(mockHandler, 'Click Handler');
      });

      const returnValue = wrappedHandler('event', 'data');

      expect(mockHandler).toHaveBeenCalledWith('event', 'data');
      expect(returnValue).toBe('success');
      expect(errorLogger.logError).not.toHaveBeenCalled();
    });

    test('should wrap event handler and catch errors', () => {
      const { result } = renderHook(() => useErrorHandler(), { wrapper: createWrapper() });
      const testError = new Error('Handler error');
      const mockHandler = jest.fn().mockImplementation(() => {
        throw testError;
      });

      let wrappedHandler;
      act(() => {
        wrappedHandler = result.current.wrapEventHandler(mockHandler, 'Submit Handler');
      });

      // Should not throw - errors are caught
      expect(() => wrappedHandler('arg1', 'arg2')).not.toThrow();

      expect(console.error).toHaveBeenCalledWith(
        'Error in Submit Handler:',
        testError
      );
      expect(errorLogger.logError).toHaveBeenCalledWith(
        testError,
        null,
        'Event Handler: Submit Handler',
        expect.objectContaining({
          type: 'event-handler-error',
          arguments: ['arg1', 'arg2'],
          timestamp: expect.any(String)
        })
      );
    });

    test('should include event arguments in error log', () => {
      const { result } = renderHook(() => useErrorHandler(), { wrapper: createWrapper() });
      const testError = new Error('Handler error');
      const mockHandler = jest.fn().mockImplementation(() => {
        throw testError;
      });

      let wrappedHandler;
      act(() => {
        wrappedHandler = result.current.wrapEventHandler(mockHandler);
      });

      wrappedHandler('click', { target: 'button' }, 123);

      const logCall = errorLogger.logError.mock.calls[0];
      const loggedData = logCall[3];
      
      expect(loggedData.arguments).toEqual(['click', { target: 'button' }, 123]);
    });

    test('should not re-throw errors to prevent app crashes', () => {
      const { result } = renderHook(() => useErrorHandler(), { wrapper: createWrapper() });
      const testError = new Error('Critical error');
      const mockHandler = jest.fn().mockImplementation(() => {
        throw testError;
      });

      let wrappedHandler;
      act(() => {
        wrappedHandler = result.current.wrapEventHandler(mockHandler);
      });

      // Should not throw and should not crash
      expect(() => {
        wrappedHandler();
      }).not.toThrow();
    });
  });

  describe('function stability', () => {
    test('all returned functions should maintain stable references', () => {
      const { result, rerender } = renderHook(() => useErrorHandler(), { wrapper: createWrapper() });
      
      const firstRefs = {
        reportError: result.current.reportError,
        createAsyncErrorHandler: result.current.createAsyncErrorHandler,
        wrapAsync: result.current.wrapAsync,
        wrapEventHandler: result.current.wrapEventHandler
      };

      rerender();

      expect(result.current.reportError).toBe(firstRefs.reportError);
      expect(result.current.createAsyncErrorHandler).toBe(firstRefs.createAsyncErrorHandler);
      expect(result.current.wrapAsync).toBe(firstRefs.wrapAsync);
      expect(result.current.wrapEventHandler).toBe(firstRefs.wrapEventHandler);
    });
  });
});

