import { useRef, useEffect } from 'react';

/**
 * Custom hook for handling swipe gestures on touch devices
 * @param {Function} onSwipeLeft - Callback for left swipe
 * @param {Function} onSwipeRight - Callback for right swipe  
 * @param {number} threshold - Minimum distance for swipe to trigger (default: 50px)
 * @param {number} velocityThreshold - Minimum velocity for swipe (default: 0.3)
 */
export const useSwipeGestures = (onSwipeLeft, onSwipeRight, threshold = 50, velocityThreshold = 0.3) => {
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);
  const startTimeRef = useRef(null);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e) => {
      // Only handle single touch
      if (e.touches.length !== 1) return;
      
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY
      };
      startTimeRef.current = Date.now();
    };

    const handleTouchMove = (e) => {
      if (!touchStartRef.current) return;
      
      const touch = e.touches[0];
      touchEndRef.current = {
        x: touch.clientX,
        y: touch.clientY
      };
    };

    const handleTouchEnd = (e) => {
      if (!touchStartRef.current || !touchEndRef.current) {
        touchStartRef.current = null;
        touchEndRef.current = null;
        return;
      }

      const deltaX = touchEndRef.current.x - touchStartRef.current.x;
      const deltaY = touchEndRef.current.y - touchStartRef.current.y;
      const deltaTime = Date.now() - startTimeRef.current;
      
      // Calculate velocity
      const velocity = Math.abs(deltaX) / deltaTime;
      
      // Check if horizontal swipe is more dominant than vertical
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
      
      // Check if swipe meets threshold requirements
      const meetsDistanceThreshold = Math.abs(deltaX) > threshold;
      const meetsVelocityThreshold = velocity > velocityThreshold;
      
      if (isHorizontalSwipe && (meetsDistanceThreshold || meetsVelocityThreshold)) {
        if (deltaX > 0) {
          // Swipe right
          onSwipeRight && onSwipeRight();
        } else {
          // Swipe left  
          onSwipeLeft && onSwipeLeft();
        }
      }

      // Reset
      touchStartRef.current = null;
      touchEndRef.current = null;
      startTimeRef.current = null;
    };

    // Add passive option to improve performance
    const options = { passive: true };
    
    element.addEventListener('touchstart', handleTouchStart, options);
    element.addEventListener('touchmove', handleTouchMove, options);
    element.addEventListener('touchend', handleTouchEnd, options);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart, options);
      element.removeEventListener('touchmove', handleTouchMove, options);
      element.removeEventListener('touchend', handleTouchEnd, options);
    };
  }, [onSwipeLeft, onSwipeRight, threshold, velocityThreshold]);

  return elementRef;
};

