import React from 'react';

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
  const isNextJS = typeof window !== 'undefined'
    ? typeof (window as any).__NEXT_DATA__ !== 'undefined'
    : false;

  if (isNextJS) {
    // Use Next.js Link
    // Dynamic import to avoid bundling Next.js in desktop app
    const NextLink = require('next/link').default;
    return (
      <NextLink href={path} {...props}>
        {children}
      </NextLink>
    );
  }

  // Use React Router Link
  const RouterLink = require('react-router-dom').Link;
  return (
    <RouterLink to={path} {...props}>
      {children}
    </RouterLink>
  );
};
