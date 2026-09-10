import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to detect user inactivity and trigger auto-logout
 * @param {Function} onIdle - Callback function to execute when user becomes idle
 * @param {number} [timeout=900000] - Timeout in milliseconds (default: 15 minutes)
 * @param {Array} [events] - Array of event names to listen for activity
 * 
 * @example
 * useIdleTimer(() => logout(), 900000); // 15 minutes
 */
export function useIdleTimer(
  onIdle,
  timeout = 15 * 60 * 1000, // 15 minutes default
  events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
) {
  const timeoutId = useRef(null);
  const lastActivityTime = useRef(Date.now());

  const resetTimer = useCallback(() => {
    // Clear existing timeout
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }

    // Update last activity time
    lastActivityTime.current = Date.now();

    // Set new timeout
    timeoutId.current = setTimeout(() => {
      if (onIdle) {
        onIdle();
      }
    }, timeout);
  }, [onIdle, timeout]);

  useEffect(() => {
    // Start the timer
    resetTimer();

    // Add event listeners for user activity
    events.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    // Cleanup
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [resetTimer, events]);

  return {
    resetTimer,
    getLastActivityTime: () => lastActivityTime.current,
  };
}

export default useIdleTimer;
