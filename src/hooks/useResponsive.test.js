import { renderHook, act } from '@testing-library/react';
import { useResponsive } from './useResponsive';
import { BREAKPOINTS } from '../constants';

describe('useResponsive', () => {
  let addListenerSpy;
  let removeListenerSpy;
  const originalWidth = window.innerWidth;
  const originalHeight = window.innerHeight;

  function setWindowSize(width, height) {
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width });
    Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: height });
  }

  beforeEach(() => {
    addListenerSpy = jest.spyOn(window, 'addEventListener');
    removeListenerSpy = jest.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    setWindowSize(originalWidth, originalHeight);
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    test('should initialize with current window size', () => {
      setWindowSize(1200, 800);

      const { result } = renderHook(() => useResponsive());

      expect(result.current.windowSize.width).toBe(1200);
      expect(result.current.windowSize.height).toBe(800);
    });

    test('should handle zero dimensions', () => {
      setWindowSize(0, 0);

      const { result } = renderHook(() => useResponsive());

      expect(result.current.windowSize.width).toBe(0);
      expect(result.current.windowSize.height).toBe(0);
    });
  });

  describe('breakpoint detection', () => {
    test('should detect mobile breakpoint', () => {
      setWindowSize(600, 800);
      const { result } = renderHook(() => useResponsive());
      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(false);
    });

    test('should detect mobile at exact breakpoint', () => {
      setWindowSize(BREAKPOINTS.MOBILE, 800);
      const { result } = renderHook(() => useResponsive());
      expect(result.current.isMobile).toBe(true);
    });

    test('should detect tablet breakpoint', () => {
      setWindowSize(900, 800);
      const { result } = renderHook(() => useResponsive());
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isDesktop).toBe(false);
    });

    test('should detect tablet at upper boundary', () => {
      setWindowSize(BREAKPOINTS.TABLET, 800);
      const { result } = renderHook(() => useResponsive());
      expect(result.current.isTablet).toBe(true);
    });

    test('should detect desktop breakpoint', () => {
      setWindowSize(1200, 800);
      const { result } = renderHook(() => useResponsive());
      expect(result.current.isDesktop).toBe(true);
    });

    test('should detect desktop at exact breakpoint', () => {
      setWindowSize(BREAKPOINTS.DESKTOP, 800);
      const { result } = renderHook(() => useResponsive());
      expect(result.current.isDesktop).toBe(true);
    });
  });

  describe('window resize', () => {
    test('should add resize event listener', () => {
      renderHook(() => useResponsive());
      expect(addListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    test('should remove resize event listener on cleanup', () => {
      const { unmount } = renderHook(() => useResponsive());
      unmount();
      expect(removeListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    test('should update size on window resize', () => {
      setWindowSize(1024, 768);
      const { result } = renderHook(() => useResponsive());
      const handler = addListenerSpy.mock.calls.find(([event]) => event === 'resize')?.[1];

      act(() => {
        setWindowSize(600, 400);
        handler?.();
      });

      expect(result.current.windowSize.width).toBe(600);
      expect(result.current.windowSize.height).toBe(400);
    });

    test('should update breakpoint flags on resize', () => {
      setWindowSize(1200, 800);
      const { result } = renderHook(() => useResponsive());
      const handler = addListenerSpy.mock.calls.find(([event]) => event === 'resize')?.[1];

      expect(result.current.isDesktop).toBe(true);

      act(() => {
        setWindowSize(600, 800);
        handler?.();
      });

      expect(result.current.isMobile).toBe(true);
      expect(result.current.isDesktop).toBe(false);
    });
  });

  describe('breakpoints export', () => {
    test('should expose BREAKPOINTS constant', () => {
      const { result } = renderHook(() => useResponsive());
      expect(result.current.breakpoints).toEqual(BREAKPOINTS);
    });
  });

  describe('edge cases', () => {
    test('should handle very small window sizes', () => {
      setWindowSize(320, 568);
      const { result } = renderHook(() => useResponsive());
      expect(result.current.isMobile).toBe(true);
    });

    test('should handle very large window sizes', () => {
      setWindowSize(3840, 2160);
      const { result } = renderHook(() => useResponsive());
      expect(result.current.isDesktop).toBe(true);
    });

    test('should correctly classify width just above mobile', () => {
      setWindowSize(BREAKPOINTS.MOBILE + 1, 800);
      const { result } = renderHook(() => useResponsive());
      expect(result.current.isTablet).toBe(true);
    });

    test('should correctly classify width just below desktop', () => {
      setWindowSize(BREAKPOINTS.DESKTOP - 1, 800);
      const { result } = renderHook(() => useResponsive());
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isDesktop).toBe(false);
    });
  });
});
