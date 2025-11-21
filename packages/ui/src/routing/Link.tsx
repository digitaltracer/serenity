'use client'

import React, { useMemo } from 'react';

/**
 * Universal Link component that works across Next.js and React Router
 *
 * Usage:
 * <Link href="/path">Text</Link>  // Works in both Next.js and React Router
 * <Link to="/path">Text</Link>    // React Router style (also works in Next.js)
 */

interface UniversalLinkProps {
  href?: string;
  to?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  target?: string;
  rel?: string;
}

export const Link: React.FC<UniversalLinkProps> = ({
  href,
  to,
  children,
  ...props
}) => {
  const path = href || to || '/';

  // Check if we're in Next.js environment
  const isNextJS = typeof window !== 'undefined' && typeof (window as any).__NEXT_DATA__ !== 'undefined';

  // Memoize the component to avoid re-requiring on every render
  const LinkComponent = useMemo(() => {
    if (isNextJS) {
      // Use Next.js Link
      try {
        const NextLink = require('next/link').default;
        return ({ href, children, ...props }: any) => (
          <NextLink href={href} {...props}>
            {children}
          </NextLink>
        );
      } catch (e) {
        // Fallback to anchor tag if Next.js Link not available
        return ({ href, children, ...props }: any) => (
          <a href={href} {...props}>
            {children}
          </a>
        );
      }
    } else {
      // Use React Router Link
      try {
        const RouterLink = require('react-router-dom').Link;
        return ({ href, children, ...props }: any) => (
          <RouterLink to={href} {...props}>
            {children}
          </RouterLink>
        );
      } catch (e) {
        // Fallback to anchor tag if React Router not available
        return ({ href, children, ...props }: any) => (
          <a href={href} {...props}>
            {children}
          </a>
        );
      }
    }
  }, [isNextJS]);

  return <LinkComponent href={path} {...props}>{children}</LinkComponent>;
};
