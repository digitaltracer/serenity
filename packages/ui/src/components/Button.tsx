import React from 'react';
import { cn } from '../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 text-center',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
          'disabled:pointer-events-none disabled:opacity-50',
          'whitespace-nowrap leading-none',

          // Variants aligned to design tokens
          {
            // Primary
            'bg-primary text-primary-foreground border border-border hover:bg-primary/90': variant === 'primary',

            // Secondary
            'bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80': variant === 'secondary',

            // Ghost
            'bg-transparent text-foreground/80 border border-transparent hover:bg-accent/50 hover:text-foreground': variant === 'ghost',

            // Destructive
            'bg-destructive text-destructive-foreground border border-border hover:bg-destructive/90': variant === 'destructive',

            // Outline variant
            'bg-transparent border border-border text-foreground hover:bg-accent/40': variant === 'outline',
          },
          
          // Sizes - bounded by min/max to avoid scaling with viewport
          {
            // Small: ~32–40px height
            'h-auto min-h-[32px] max-h-[40px] px-3 py-2 text-sm min-w-[2.5rem] max-w-full': size === 'sm',
            // Medium: ~40–44px height
            'h-auto min-h-[40px] max-h-[44px] px-4 py-2.5 text-sm min-w-[3rem] max-w-full': size === 'md',
            // Large: ~44–48px height
            'h-auto min-h-[44px] max-h-[48px] px-5 py-3 text-base min-w-[3.5rem] max-w-full': size === 'lg',
          },

          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
