'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Persist a piece of state to localStorage. Same call shape as useState,
 * but the initial value is read from (and every update written to) the
 * given localStorage key. Always renders `initialValue` on the first pass
 * (server and client alike) and only swaps in the stored value after
 * mount, so hydration never diffs against a value only the client could
 * have known (e.g. a theme or sidebar-collapsed flag from a prior visit).
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) setValue(JSON.parse(stored));
    } catch {
      // localStorage unavailable (private mode, quota, etc.) — keep initialValue
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

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
