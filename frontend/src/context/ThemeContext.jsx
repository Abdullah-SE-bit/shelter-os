'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const ThemeContext = createContext(null);

const getSystemTheme = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

export const ThemeProvider = ({ children }) => {
  // 'light' | 'dark' | 'system' — the user's explicit preference (or lack of one)
  const [theme, setTheme] = useLocalStorage('shelter-os-theme', 'system');
  // The actually-applied theme, resolved from `theme` + the OS setting.
  // Starts 'light' to match the server render exactly; the inline script in
  // the root layout already paints the correct theme via CSS before this
  // mounts, so this only has to catch up for React-driven bits (icons, etc)
  // without diffing against a value the server couldn't have known.
  const [resolvedTheme, setResolvedTheme] = useState('light');

  useEffect(() => {
    const next = theme === 'system' ? getSystemTheme() : theme;
    setResolvedTheme(next);
    document.documentElement.dataset.theme = next;
  }, [theme]);

  // Live-update when the OS theme changes, but only while following "system"
  useEffect(() => {
    if (theme !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const next = mql.matches ? 'dark' : 'light';
      setResolvedTheme(next);
      document.documentElement.dataset.theme = next;
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
};
