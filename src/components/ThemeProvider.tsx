'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Persists the user's preferred theme to localStorage and applies it as the
 * `class="dark"` attribute on <html>. Tailwind's darkMode='class' setup picks
 * this up everywhere.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('darb-theme') as Theme | null;
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    const initial = stored || system;
    setThemeState(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
    setMounted(true);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('darb-theme', t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  };

  const toggle = () => setTheme(theme === 'light' ? 'dark' : 'light');

  // Always wrap children in the Provider so server-rendered consumers (Header,
  // editor, etc.) see a valid context. We only hide visually until mounted to
  // prevent the wrong-theme FOUC.
  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      <div style={{ visibility: mounted ? 'visible' : 'hidden' }}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
