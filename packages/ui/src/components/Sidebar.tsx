import React from 'react';
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
        'flex flex-col h-full bg-white border-r border-gray-200',
        'dark:bg-gray-900 dark:border-gray-800',
        'transition-all duration-300',
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
  return (
    <div className={cn('p-4 border-b border-gray-200 dark:border-gray-800', className)}>
      {children}
    </div>
  );
};

const SidebarContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn('flex-1 overflow-y-auto p-2', className)}>
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
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors',
        'hover:bg-gray-100 dark:hover:bg-gray-700',
        {
          'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300': active,
          'text-gray-700 dark:text-gray-200': !active,
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
  return (
    <div className={cn('mb-4', className)}>
      <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-300">
        {title}
      </h3>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
};

export { Sidebar, SidebarHeader, SidebarContent, SidebarItem, SidebarSection };