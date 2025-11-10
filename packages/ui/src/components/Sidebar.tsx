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
        // Tokenized sidebar
        'flex flex-col h-full bg-card border-r border-border text-card-foreground',
        'transition-all duration-200 ease-in-out',
        {
          'w-56': !collapsed,
          'w-16': collapsed,
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
      'border-b border-border bg-card text-card-foreground',
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
        'relative flex items-center rounded-lg cursor-pointer transition-colors duration-150',
        'hover:bg-accent/60',
        // Compact mode responsive padding and spacing
        {
          'gap-3 px-4 py-3': !compactMode,
          'gap-2 px-3 py-2': compactMode,
          // Active state styling for both themes
          'bg-accent text-accent-foreground before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[2px] before:bg-ring': active,
          'text-foreground/80 hover:text-foreground': !active,
          'justify-center': !children, // Center icon when no text
        },
        className
      )}
      onClick={onClick}
    >
      {icon && (
        <div className="flex-shrink-0 w-4 h-4">
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
        'text-xs font-semibold text-muted-foreground uppercase tracking-wider',
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
