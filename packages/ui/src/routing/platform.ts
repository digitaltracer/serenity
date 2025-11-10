/**
 * Platform detection utilities for routing
 * Determines whether we're running in Next.js (web) or Electron (desktop)
 */

export const isNextJS = () => {
  // Check if we're in a Next.js environment
  // Next.js sets process.env.NEXT_RUNTIME or has next/router available
  if (typeof window === 'undefined') {
    // Server-side: check for Next.js environment variables
    return typeof process !== 'undefined' && process.env.__NEXT_RUNTIME !== undefined;
  }

  // Client-side: check for Next.js router or electronAPI
  return typeof (window as any).next !== 'undefined' ||
         (typeof (window as any).__NEXT_DATA__ !== 'undefined');
};

export const isElectron = () => {
  // Check if we're in an Electron environment
  return typeof window !== 'undefined' &&
         typeof (window as any).electronAPI !== 'undefined';
};

export const getRoutingMode = (): 'nextjs' | 'react-router' => {
  // Electron desktop app uses React Router
  if (isElectron()) {
    return 'react-router';
  }

  // Next.js web app
  if (isNextJS()) {
    return 'nextjs';
  }

  // Default to react-router for standalone React apps
  return 'react-router';
};
