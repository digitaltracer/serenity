import React, { useEffect, useState } from 'react';
import { cn } from '../utils/cn';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  size = 'md',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Trigger animation after mount
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before hiding
      setTimeout(() => setIsVisible(false), 200);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isVisible) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto",
        "transition-all duration-200",
        {
          "opacity-100": isAnimating,
          "opacity-0": !isAnimating,
        }
      )}
      onClick={handleBackdropClick}
    >
      {/* Enhanced Backdrop with better blur */}
      <div
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-xl transition-all duration-200",
          {
            "opacity-100": isAnimating,
            "opacity-0": !isAnimating,
          }
        )}
      />
      
      {/* Modal with enhanced glassmorphism */}
      <div
        className={cn(
          // Professional modal styling for both light and dark themes
          'relative w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl my-8',
          'border border-gray-200/50 shadow-gray-500/20',
          'dark:bg-gray-900/90 dark:border-gray-700/30 dark:shadow-black/50',
          'transition-all duration-200 transform-gpu overflow-visible',
          {
            'scale-100 translate-y-0': isAnimating,
            'scale-95 translate-y-4': !isAnimating,
          },
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with enhanced styling */}
        {title && (
          <div className="flex items-center justify-between p-4 pb-3 border-b border-gray-200/30 dark:border-gray-700/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* Content with better spacing */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export { Modal };