import React, { useEffect, useState } from 'react';
import { cn } from '../utils/cn';

export interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
}

const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 500,
  direction = 'up',
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const directionClasses = {
    up: {
      hidden: 'translate-y-8',
      visible: 'translate-y-0',
    },
    down: {
      hidden: '-translate-y-8',
      visible: 'translate-y-0',
    },
    left: {
      hidden: 'translate-x-8',
      visible: 'translate-x-0',
    },
    right: {
      hidden: '-translate-x-8',
      visible: 'translate-x-0',
    },
    none: {
      hidden: '',
      visible: '',
    },
  };

  return (
    <div
      className={cn(
        'transition-all transform-gpu',
        {
          [`opacity-100 ${directionClasses[direction].visible}`]: isVisible,
          [`opacity-0 ${directionClasses[direction].hidden}`]: !isVisible,
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

export { FadeIn };