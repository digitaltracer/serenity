import React, { useEffect, useState } from 'react';
import { cn } from '../utils/cn';

export interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
}

const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className,
  duration = 300,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        'transition-all transform-gpu',
        {
          'opacity-100 translate-y-0 scale-100': isVisible,
          'opacity-0 translate-y-4 scale-98': !isVisible,
        },
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {children}
    </div>
  );
};

export { PageTransition };