'use client';

import { useCallback, useState } from 'react';

/**
 * Persist a piece of state to localStorage. Same call shape as useState,
 * but the initial value is read from (and every update written to) the
 * given localStorage key. SSR-safe: falls back to `initialValue` on the
 * server, where `window` doesn't exist yet.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setStoredValue = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = next instanceof Function ? next(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // localStorage unavailable (private mode, quota, etc.) — state still updates in memory
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, setStoredValue];
}

export default useLocalStorage;
