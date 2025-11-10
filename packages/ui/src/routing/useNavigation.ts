/**
 * Universal navigation hook that works across Next.js and React Router
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

export const useNavigation = (): NavigationResult => {
  // Check if we're in Next.js environment
  const isNextJS = typeof window !== 'undefined'
    ? typeof (window as any).__NEXT_DATA__ !== 'undefined'
    : false;

  if (isNextJS) {
    // Use Next.js router
    const { useRouter } = require('next/navigation');
    const router = useRouter();

    return {
      push: (path: string) => router.push(path),
      replace: (path: string) => router.replace(path),
      back: () => router.back(),
    };
  }

  // Use React Router
  const { useNavigate } = require('react-router-dom');
  const navigate = useNavigate();

  return {
    push: (path: string) => navigate(path),
    replace: (path: string) => navigate(path, { replace: true }),
    back: () => navigate(-1),
  };
};
