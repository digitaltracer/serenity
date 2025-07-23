import React from 'react';
import { useSelector } from 'react-redux';
import { selectCompactMode } from '@serenity/core';
import { cn } from '../utils/cn';

export interface SidebarProps {
  children: React.ReactNode;
  className?: string;
  collapsed?: boolean;
}

export interface SidebarItemProps {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ children, className, collapsed }) => {
  return (
    <div
      className={cn(
        // Professional sidebar styling for both light and dark themes
        'flex flex-col h-full bg-gray-50/80 backdrop-blur-md border-r border-gray-200',
        'dark:bg-gray-900/30 dark:border-gray-700/30',
        'transition-all duration-300 ease-in-out shadow-lg shadow-gray-200/30',
        'dark:shadow-black/20',
        {
          'w-56': !collapsed,
          'w-20': collapsed,
        },
        className
      )}
    >
      {children}
    </div>
  );
};

const SidebarHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => {
  const compactMode = useSelector(selectCompactMode);
  
  return (
    <div className={cn(
      'border-b border-gray-200 dark:border-gray-700/20',
      'bg-gradient-to-b from-gray-100/50 to-transparent dark:from-gray-800/5',
      // Compact mode responsive padding
      {
        'p-6': !compactMode,
        'p-4': compactMode,
      },
      className
    )}>
      {children}
    </div>
  );
};

const SidebarContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn('flex-1 overflow-y-auto p-4', className)}>
      {children}
    </div>
  );
};

const SidebarItem: React.FC<SidebarItemProps> = ({ 
  children, 
  icon, 
  active, 
  onClick, 
  className 
}) => {
  const compactMode = useSelector(selectCompactMode);
  
  return (
    <div
      className={cn(
        'flex items-center rounded-lg cursor-pointer transition-all duration-150',
        'hover:bg-gray-200 dark:hover:bg-gray-800/40',
        // Compact mode responsive padding and spacing
        {
          'gap-3 px-4 py-3': !compactMode,
          'gap-2 px-3 py-2': compactMode,
          // Active state styling for both themes
          'bg-gray-300 text-gray-900 border border-gray-400 dark:bg-gray-600/40 dark:text-gray-100 dark:border-gray-500/50': active,
          'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white': !active,
          'justify-center': !children, // Center icon when no text
        },
        className
      )}
      onClick={onClick}
    >
      {icon && (
        <div className="flex-shrink-0 w-5 h-5">
          {icon}
        </div>
      )}
      {children && <span className="font-medium truncate">{children}</span>}
    </div>
  );
};

const SidebarSection: React.FC<{ 
  title: string; 
  children: React.ReactNode; 
  className?: string;
}> = ({ title, children, className }) => {
  const compactMode = useSelector(selectCompactMode);
  
  return (
    <div className={cn(
      // Compact mode responsive margin
      {
        'mb-6': !compactMode,
        'mb-4': compactMode,
      },
      className
    )}>
      <h3 className={cn(
        'text-xs font-semibold text-gray-400 uppercase tracking-wider',
        // Compact mode responsive spacing
        {
          'px-4 mb-3': !compactMode,
          'px-3 mb-2': compactMode,
        }
      )}>
        {title}
      </h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
};

export { Sidebar, SidebarHeader, SidebarContent, SidebarItem, SidebarSection };