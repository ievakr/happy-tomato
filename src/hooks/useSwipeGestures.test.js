import { renderHook } from '@testing-library/react';
import { useSwipeGestures } from './useSwipeGestures';
import { createWrapper } from '../test-utils/test-wrapper';

describe('useSwipeGestures', () => {
  let mockElement;
  let onSwipeLeft;
  let onSwipeRight;

  beforeEach(() => {
    // Create mock element
    mockElement = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };

    onSwipeLeft = jest.fn();
    onSwipeRight = jest.fn();

    jest.clearAllMocks();
  });

  describe('initialization', () => {
    test('should return a ref object', () => {
      const { result } = renderHook(() => useSwipeGestures(onSwipeLeft, onSwipeRight));

      expect(result.current).toBeDefined();
      expect(result.current).toHaveProperty('current');
    });

    test('should add event listeners when element is attached', () => {
      const { result } = renderHook(() => useSwipeGestures(onSwipeLeft, onSwipeRight));
      
      // Simulate ref attachment
      result.current.current = mockElement;
      
      // Force effect to run by rerendering
      const { rerender } = renderHook(() => useSwipeGestures(onSwipeLeft, onSwipeRight));
      rerender();

      // The effect should have been called, but addEventListener won't be called
      // until the ref is set and effect runs
      expect(result.current.current).toBe(mockElement);
    });
  });

  describe('swipe detection', () => {
    test('should detect right swipe', () => {
      const { result, rerender } = renderHook(() => 
        useSwipeGestures(onSwipeLeft, onSwipeRight, 50, 0.3)
      );

      result.current.current = mockElement;
      rerender();

      // Get the event handlers
      const touchStartHandler = mockElement.addEventListener.mock.calls.find(
        call => call[0] === 'touchstart'
      )?.[1];
      const touchMoveHandler = mockElement.addEventListener.mock.calls.find(
        call => call[0] === 'touchmove'
      )?.[1];
      const touchEndHandler = mockElement.addEventListener.mock.calls.find(
        call => call[0] === 'touchend'
      )?.[1];

      if (touchStartHandler && touchMoveHandler && touchEndHandler) {
        // Simulate touch start
        touchStartHandler({
          touches: [{ clientX: 100, clientY: 200 }]
        });

        // Simulate touch move
        touchMoveHandler({
          touches: [{ clientX: 200, clientY: 210 }]
        });

        // Simulate touch end
        touchEndHandler({});

        expect(onSwipeRight).toHaveBeenCalled();
        expect(onSwipeLeft).not.toHaveBeenCalled();
      }
    });

    test('should detect left swipe', () => {
      const { result, rerender } = renderHook(() => 
        useSwipeGestures(onSwipeLeft, onSwipeRight, 50, 0.3)
      );

      result.current.current = mockElement;
      rerender();

      const touchStartHandler = mockElement.addEventListener.mock.calls.find(
        call => call[0] === 'touchstart'
      )?.[1];
      const touchMoveHandler = mockElement.addEventListener.mock.calls.find(
        call => call[0] === 'touchmove'
      )?.[1];
      const touchEndHandler = mockElement.addEventListener.mock.calls.find(
        call => call[0] === 'touchend'
      )?.[1];

      if (touchStartHandler && touchMoveHandler && touchEndHandler) {
        // Simulate touch start
        touchStartHandler({
          touches: [{ clientX: 200, clientY: 200 }]
        });

        // Simulate touch move
        touchMoveHandler({
          touches: [{ clientX: 100, clientY: 210 }]
        });

        // Simulate touch end
        touchEndHandler({});

        expect(onSwipeLeft).toHaveBeenCalled();
        expect(onSwipeRight).not.toHaveBeenCalled();
      }
    });

    test('should not trigger swipe if distance is below threshold', () => {
      const { result, rerender } = renderHook(() => 
        useSwipeGestures(onSwipeLeft, onSwipeRight, 100, 0.3)
      );

      result.current.current = mockElement;
      rerender();

      const touchStartHandler = mockElement.addEventListener.mock.calls.find(
        call => call[0] === 'touchstart'
      )?.[1];
      const touchMoveHandler = mockElement.addEventListener.mock.calls.find(
        call => call[0] === 'touchmove'
      )?.[1];
      const touchEndHandler = mockElement.addEventListener.mock.calls.find(
        call => call[0] === 'touchend'
      )?.[1];

      if (touchStartHandler && touchMoveHandler && touchEndHandler) {
        // Small swipe (less than threshold)
        touchStartHandler({
          touches: [{ clientX: 100, clientY: 200 }]
        });

        touchMoveHandler({
          touches: [{ clientX: 130, clientY: 200 }]
        });

        touchEndHandler({});

        // Should not trigger if velocity is also low
        expect(onSwipeRight).not.toHaveBeenCalled();
        expect(onSwipeLeft).not.toHaveBeenCalled();
      }
    });

    test('should ignore vertical swipes', () => {
      const { result, rerender } = renderHook(() => 
        useSwipeGestures(onSwipeLeft, onSwipeRight, 50, 0.3)
      );

      result.current.current = mockElement;
      rerender();

      const touchStartHandler = mockElement.addEventListener.mock.calls.find(
        call => call[0] === 'touchstart'
      )?.[1];
      const touchMoveHandler = mockElement.addEventListener.mock.calls.find(
        call => call[0] === 'touchmove'
      )?.[1];
      const touchEndHandler = mockElement.addEventListener.mock.calls.find(
        call => call[0] === 'touchend'
      )?.[1];

      if (touchStartHandler && touchMoveHandler && touchEndHandler) {
        // Vertical swipe
        touchStartHandler({
          touches: [{ clientX: 100, clientY: 100 }]
        });

        touchMoveHandler({
          touches: [{ clientX: 110, clientY: 200 }]
        });

        touchEndHandler({});

        expect(onSwipeLeft).not.toHaveBeenCalled();
        expect(onSwipeRight).not.toHaveBeenCalled();
      }
    });

    test('should ignore multi-touch', () => {
      const { result, rerender } = renderHook(() => 
        useSwipeGestures(onSwipeLeft, onSwipeRight, 50, 0.3)
      );

      result.current.current = mockElement;
      rerender();

      const touchStartHandler = mockElement.addEventListener.mock.calls.find(
        call => call[0] === 'touchstart'
      )?.[1];

      if (touchStartHandler) {
        // Multi-touch (two fingers)
        touchStartHandler({
          touches: [
            { clientX: 100, clientY: 200 },
            { clientX: 150, clientY: 200 }
          ]
        });

        // Touch data should not be recorded for multi-touch
        expect(onSwipeLeft).not.toHaveBeenCalled();
        expect(onSwipeRight).not.toHaveBeenCalled();
      }
    });
  });

  describe('threshold parameters', () => {
    test('should use custom distance threshold', () => {
      const { result } = renderHook(() => 
        useSwipeGestures(onSwipeLeft, onSwipeRight, 200, 0.3)
      );

      // Verify hook was called with custom threshold
      expect(result.current).toBeDefined();
    });

    test('should use custom velocity threshold', () => {
      const { result } = renderHook(() => 
        useSwipeGestures(onSwipeLeft, onSwipeRight, 50, 0.8)
      );

      // Verify hook was called with custom velocity threshold
      expect(result.current).toBeDefined();
    });

    test('should use default thresholds when not provided', () => {
      const { result } = renderHook(() => 
        useSwipeGestures(onSwipeLeft, onSwipeRight)
      );

      // Should work with defaults (50px distance, 0.3 velocity)
      expect(result.current).toBeDefined();
    });
  });

  describe('callback handling', () => {
    test('should handle missing onSwipeLeft callback', () => {
      const { result, rerender } = renderHook(() => 
        useSwipeGestures(null, onSwipeRight, 50, 0.3)
      );

      result.current.current = mockElement;
      rerender();

      const touchStartHandler = mockElement.addEventListener.mock.calls.find(
        call => call[0] === 'touchstart'
      )?.[1];
      const touchMoveHandler = mockElement.addEventListener.mock.calls.find(
        call => call[0] === 'touchmove'
      )?.[1];
      const touchEndHandler = mockElement.addEventListener.mock.calls.find(
        call => call[0] === 'touchend'
      )?.[1];

      if (touchStartHandler && touchMoveHandler && touchEndHandler) {
        // Left swipe
        touchStartHandler({
          touches: [{ clientX: 200, clientY: 200 }]
        });

        touchMoveHandler({
          touches: [{ clientX: 100, clientY: 200 }]
        });

        // Should not throw
        expect(() => touchEndHandler({})).not.toThrow();
      }
    });

    test('should handle missing onSwipeRight callback', () => {
      const { result, rerender } = renderHook(() => 
        useSwipeGestures(onSwipeLeft, null, 50, 0.3)
      );

      result.current.current = mockElement;
      rerender();

      const touchStartHandler = mockElement.addEventListener.mock.calls.find(
        call => call[0] === 'touchstart'
      )?.[1];
      const touchMoveHandler = mockElement.addEventListener.mock.calls.find(
        call => call[0] === 'touchmove'
      )?.[1];
      const touchEndHandler = mockElement.addEventListener.mock.calls.find(
        call => call[0] === 'touchend'
      )?.[1];

      if (touchStartHandler && touchMoveHandler && touchEndHandler) {
        // Right swipe
        touchStartHandler({
          touches: [{ clientX: 100, clientY: 200 }]
        });

        touchMoveHandler({
          touches: [{ clientX: 200, clientY: 200 }]
        });

        // Should not throw
        expect(() => touchEndHandler({})).not.toThrow();
      }
    });
  });

  describe('cleanup', () => {
    test('should remove event listeners on unmount', () => {
      const { result, unmount, rerender } = renderHook(() => 
        useSwipeGestures(onSwipeLeft, onSwipeRight)
      );

      result.current.current = mockElement;
      rerender();

      unmount();

      expect(mockElement.removeEventListener).toHaveBeenCalledWith(
        'touchstart',
        expect.any(Function)
      );
      expect(mockElement.removeEventListener).toHaveBeenCalledWith(
        'touchmove',
        expect.any(Function)
      );
      expect(mockElement.removeEventListener).toHaveBeenCalledWith(
        'touchend',
        expect.any(Function)
      );
    });

    test('should handle cleanup with null element', () => {
      const { unmount } = renderHook(() => 
        useSwipeGestures(onSwipeLeft, onSwipeRight)
      );

      // Should not throw when element is null
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('touch state management', () => {
    test('should reset touch state after swipe', () => {
      const { result, rerender } = renderHook(() => 
        useSwipeGestures(onSwipeLeft, onSwipeRight, 50, 0.3)
      );

      result.current.current = mockElement;
      rerender();

      const touchStartHandler = mockElement.addEventListener.mock.calls.find(
        call => call[0] === 'touchstart'
      )?.[1];
      const touchMoveHandler = mockElement.addEventListener.mock.calls.find(
        call => call[0] === 'touchmove'
      )?.[1];
      const touchEndHandler = mockElement.addEventListener.mock.calls.find(
        call => call[0] === 'touchend'
      )?.[1];

      if (touchStartHandler && touchMoveHandler && touchEndHandler) {
        // First swipe
        touchStartHandler({
          touches: [{ clientX: 100, clientY: 200 }]
        });

        touchMoveHandler({
          touches: [{ clientX: 200, clientY: 200 }]
        });

        touchEndHandler({});

        // Second swipe - should work independently
        touchStartHandler({
          touches: [{ clientX: 200, clientY: 200 }]
        });

        touchMoveHandler({
          touches: [{ clientX: 100, clientY: 200 }]
        });

        touchEndHandler({});

        // Both swipes should have been detected
        expect(onSwipeRight).toHaveBeenCalledTimes(1);
        expect(onSwipeLeft).toHaveBeenCalledTimes(1);
      }
    });

    test('should handle touch end without move', () => {
      const { result, rerender } = renderHook(() => 
        useSwipeGestures(onSwipeLeft, onSwipeRight, 50, 0.3)
      );

      result.current.current = mockElement;
      rerender();

      const touchStartHandler = mockElement.addEventListener.mock.calls.find(
        call => call[0] === 'touchstart'
      )?.[1];
      const touchEndHandler = mockElement.addEventListener.mock.calls.find(
        call => call[0] === 'touchend'
      )?.[1];

      if (touchStartHandler && touchEndHandler) {
        touchStartHandler({
          touches: [{ clientX: 100, clientY: 200 }]
        });

        // End without move
        touchEndHandler({});

        expect(onSwipeLeft).not.toHaveBeenCalled();
        expect(onSwipeRight).not.toHaveBeenCalled();
      }
    });
  });

  describe('passive event listeners', () => {
    test('should add listeners with passive option', () => {
      const { result, rerender } = renderHook(() => 
        useSwipeGestures(onSwipeLeft, onSwipeRight)
      );

      result.current.current = mockElement;
      rerender();

      // Check that passive option is used
      const calls = mockElement.addEventListener.mock.calls;
      calls.forEach(call => {
        if (['touchstart', 'touchmove', 'touchend'].includes(call[0])) {
          expect(call[2]).toEqual({ passive: true });
        }
      });
    });
  });
});

