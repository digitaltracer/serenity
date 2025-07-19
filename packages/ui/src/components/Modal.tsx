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
        "fixed inset-0 z-50 flex items-center justify-center p-4",
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
          'relative w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl',
          'border border-gray-200/50 shadow-gray-500/20',
          'dark:bg-gray-900/90 dark:border-gray-700/30 dark:shadow-black/50',
          'transition-all duration-200 transform-gpu',
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
          <div className="flex items-center justify-between p-8 pb-6 border-b border-gray-200/30 dark:border-gray-700/20">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-10 w-10 p-0 hover:bg-gray-800/50 text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        )}
        
        {/* Content with better spacing */}
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export { Modal };