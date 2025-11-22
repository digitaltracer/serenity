/**
 * Universal navigation hook that works across Next.js and React Router
 *
 * SSR-safe: On server-side, returns no-op functions
 * Client-side: Detects environment and uses appropriate router
 *
 * Usage:
 * const navigation = useNavigation();
 * navigation.push('/path');
 */

interface NavigationResult {
  push: (path: string) => void;
  replace: (path: string) => void;
  back: () => void;
}

/**
 * Detect if we're in an Electron environment (client-side only)
 * Electron uses React Router, Next.js uses next/navigation
 */
const isElectronClient = (): boolean => {
  if (typeof window === 'undefined') return false;
  return typeof (window as any).electronAPI !== 'undefined';
};

/**
 * No-op navigation for server-side rendering
 */
const noopNavigation: NavigationResult = {
  push: () => {},
  replace: () => {},
  back: () => {},
};

export const useNavigation = (): NavigationResult => {
  // Server-side: Return no-op (navigation only happens on client)
  if (typeof window === 'undefined') {
    return noopNavigation;
  }

  // Client-side: Check environment
  if (isElectronClient()) {
    // Electron desktop app - use React Router
    try {
      const { useNavigate } = require('react-router-dom');
      const navigate = useNavigate();

      return {
        push: (path: string) => navigate(path),
        replace: (path: string) => navigate(path, { replace: true }),
        back: () => navigate(-1),
      };
    } catch {
      // Fallback to window.location
      return {
        push: (path: string) => { window.location.href = path; },
        replace: (path: string) => { window.location.replace(path); },
        back: () => { window.history.back(); },
      };
    }
  }

  // Next.js web app - use next/navigation
  try {
    const { useRouter } = require('next/navigation');
    const router = useRouter();

    return {
      push: (path: string) => router.push(path),
      replace: (path: string) => router.replace(path),
      back: () => router.back(),
    };
  } catch {
    // Fallback to window.location
    return {
      push: (path: string) => { window.location.href = path; },
      replace: (path: string) => { window.location.replace(path); },
      back: () => { window.history.back(); },
    };
  }
};
