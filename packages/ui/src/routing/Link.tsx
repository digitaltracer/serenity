'use client'

import React from 'react';

/**
 * Universal Link component that works across Next.js and React Router
 *
 * SSR-safe: On server-side, renders a plain <a> tag
 * Client-side: Detects environment and uses appropriate router
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

/**
 * Detect if we're in an Electron environment (client-side only)
 * Electron uses React Router, Next.js uses next/link
 */
const isElectronClient = (): boolean => {
  if (typeof window === 'undefined') return false;
  return typeof (window as any).electronAPI !== 'undefined';
};

export const Link: React.FC<UniversalLinkProps> = ({
  href,
  to,
  children,
  className,
  onClick,
  target,
  rel,
}) => {
  const path = href || to || '/';

  // Server-side: Always render plain <a> tag (SSR-safe)
  if (typeof window === 'undefined') {
    return (
      <a href={path} className={className} onClick={onClick} target={target} rel={rel}>
        {children}
      </a>
    );
  }

  // Client-side: Check environment
  if (isElectronClient()) {
    // Electron desktop app - use React Router
    try {
      const RouterLink = require('react-router-dom').Link;
      return (
        <RouterLink to={path} className={className} onClick={onClick} target={target} rel={rel}>
          {children}
        </RouterLink>
      );
    } catch {
      // Fallback to anchor tag
      return (
        <a href={path} className={className} onClick={onClick} target={target} rel={rel}>
          {children}
        </a>
      );
    }
  }

  // Next.js web app - use next/link
  try {
    const NextLink = require('next/link').default;
    return (
      <NextLink href={path} className={className} onClick={onClick} target={target} rel={rel}>
        {children}
      </NextLink>
    );
  } catch {
    // Fallback to anchor tag
    return (
      <a href={path} className={className} onClick={onClick} target={target} rel={rel}>
        {children}
      </a>
    );
  }
};
