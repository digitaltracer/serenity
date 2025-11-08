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
  console.log('🎭 ==========================================');
  console.log('🎭 [Modal] COMPONENT RENDER');
  console.log('🎭 [Modal] isOpen:', isOpen);
  console.log('🎭 [Modal] title:', title);
  console.log('🎭 [Modal] size:', size);
  console.log('🎭 ==========================================');

  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    console.log('🎬 [Modal] useEffect triggered - isOpen:', isOpen);

    if (isOpen) {
      console.log('🎬 [Modal] Opening modal...');
      setIsVisible(true);
      // Prevent body scrolling
      document.body.style.overflow = 'hidden';
      // Trigger animation after mount
      setTimeout(() => {
        console.log('🎬 [Modal] Starting animation...');
        setIsAnimating(true);
      }, 10);
    } else {
      console.log('🎬 [Modal] Closing modal...');
      setIsAnimating(false);
      // Restore body scrolling
      document.body.style.overflow = 'unset';
      // Wait for animation to complete before hiding
      setTimeout(() => {
        console.log('🎬 [Modal] Hiding modal...');
        setIsVisible(false);
      }, 200);
    }

    // Cleanup function to restore scrolling if component unmounts
    return () => {
      if (isOpen) {
        document.body.style.overflow = 'unset';
      }
    };
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

  if (!isVisible) {
    console.log('🚫 [Modal] EARLY RETURN - isVisible is false');
    console.log('🚫 [Modal] isOpen:', isOpen);
    console.log('🚫 [Modal] isVisible:', isVisible);
    console.log('🚫 [Modal] Modal will NOT render');
    return null;
  }

  console.log('✅ [Modal] RENDERING MODAL');
  console.log('✅ [Modal] isVisible:', isVisible);
  console.log('✅ [Modal] isAnimating:', isAnimating);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        "transition-all duration-200 overflow-y-auto",
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
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
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
        
        {/* Content with better spacing and internal scrolling */}
        <div className="p-4 max-h-[65vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export { Modal };