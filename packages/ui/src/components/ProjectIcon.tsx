'use client'

import React, { useEffect, useState } from 'react';
import { cn } from '../utils/cn';

interface ProjectIconProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  alt?: string;
}

export const ProjectIcon: React.FC<ProjectIconProps> = ({
  size = 'md',
  className = '',
  alt = 'Project'
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Detect theme from document or system preference
    const detectTheme = () => {
      const isDark = document.documentElement.classList.contains('dark') ||
                    document.documentElement.getAttribute('data-theme') === 'dark' ||
                    (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setTheme(isDark ? 'dark' : 'light');
    };

    detectTheme();

    // Listen for theme changes
    const observer = new MutationObserver(detectTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    });

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', detectTheme);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', detectTheme);
    };
  }, []);

  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48
  };

  const iconSize = typeof size === 'number' ? size : sizeMap[size];

  // Create an inline SVG version of the helmet icon that adapts to theme
  const helmetSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <path
        d="M75 85 C 85 85, 85 80, 85 75 L 85 45 C 85 25, 70 15, 50 15 C 30 15, 15 25, 15 45 L 15 75 C 15 80, 15 85, 25 85 Z"
        fill="none"
        stroke="${theme === 'dark' ? '#e5e7eb' : '#374151'}"
        stroke-width="6"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M25 60 L 35 55 L 65 55 L 75 60"
        fill="none"
        stroke="${theme === 'dark' ? '#e5e7eb' : '#374151'}"
        stroke-width="4"
        stroke-linecap="round"
      />
      <path
        d="M40 35 L 60 35"
        fill="none"
        stroke="${theme === 'dark' ? '#e5e7eb' : '#374151'}"
        stroke-width="3"
        stroke-linecap="round"
      />
    </svg>
  `;

  const encodedSvg = `data:image/svg+xml,${encodeURIComponent(helmetSvg)}`;

  return (
    <div
      className={cn(
        'inline-block shrink-0 bg-no-repeat bg-center bg-contain',
        className
      )}
      style={{
        width: iconSize,
        height: iconSize,
        backgroundImage: `url("${encodedSvg}")`,
      }}
      role="img"
      aria-label={alt}
      title={alt}
    />
  );
};

// Usage examples:
// <ProjectIcon size="sm" />
// <ProjectIcon size={20} className="my-custom-class" />
// <ProjectIcon size="lg" alt="My Project" />
