import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectTheme } from '@serenity/core';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const theme = useSelector(selectTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    body.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      // Use system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      body.classList.add(systemTheme);
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        root.classList.remove('light', 'dark');
        body.classList.remove('light', 'dark');
        const newTheme = e.matches ? 'dark' : 'light';
        root.classList.add(newTheme);
        body.classList.add(newTheme);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Use explicit theme
      root.classList.add(theme);
      body.classList.add(theme);
    }
  }, [theme]);

  return <>{children}</>;
};