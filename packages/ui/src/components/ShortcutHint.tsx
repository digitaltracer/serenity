/**
 * Shortcut Hint Component
 * Shows keyboard shortcut hints inline with buttons and actions
 */

import React from 'react';
import { KeyboardIcon } from 'lucide-react';
import { KeyboardShortcut, formatShortcut } from '@serenity/core';

interface ShortcutHintProps {
  shortcut?: KeyboardShortcut;
  keys?: string; // Alternative: pass formatted keys directly
  className?: string;
  show?: boolean;
}

// Component for displaying individual shortcut keys with proper styling (compact version)
const CompactShortcutKey: React.FC<{ shortcut: KeyboardShortcut }> = ({ shortcut }) => {
  const mac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const parts: Array<{ text: string; type: 'modifier' | 'key' }> = [];
  
  if (shortcut.modifiers.ctrl) {
    parts.push({ text: mac ? '⌘' : 'Ctrl', type: 'modifier' });
  }
  if (shortcut.modifiers.shift) {
    parts.push({ text: mac ? '⇧' : 'Shift', type: 'modifier' });
  }
  if (shortcut.modifiers.alt) {
    parts.push({ text: mac ? '⌥' : 'Alt', type: 'modifier' });
  }
  if (shortcut.modifiers.meta) {
    parts.push({ text: mac ? '⌘' : 'Win', type: 'modifier' });
  }
  
  // Format the key
  let key = shortcut.key;
  const keyMappings: Record<string, string> = {
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Enter': '↵',
    'Escape': 'Esc',
    'Delete': '⌫',
    'Backspace': '⌫',
    'Tab': '⇥',
    ' ': 'Space',
    '?': '?',
  };
  
  if (keyMappings[key]) {
    key = keyMappings[key];
  } else {
    key = key.toUpperCase();
  }
  
  parts.push({ text: key, type: 'key' });
  
  return (
    <div className="flex items-center space-x-0.5">
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          <kbd 
            className={`
              inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-xs font-mono 
              border rounded
              ${part.type === 'modifier' 
                ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                : 'bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 font-semibold'
              }
            `}
          >
            {part.text}
          </kbd>
          {index < parts.length - 1 && !mac && (
            <span className="text-gray-400 dark:text-gray-500 text-xs">+</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export const ShortcutHint: React.FC<ShortcutHintProps> = ({
  shortcut,
  keys,
  className = '',
  show = true,
}) => {
  if (!show) return null;
  
  // If we have a shortcut object, use the improved component
  if (shortcut) {
    return (
      <div className={className}>
        <CompactShortcutKey shortcut={shortcut} />
      </div>
    );
  }
  
  // Fallback for string keys
  const displayKeys = keys || '';
  if (!displayKeys) return null;

  return (
    <kbd className={`inline-flex items-center px-1.5 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-600 dark:text-gray-400 ${className}`}>
      {displayKeys}
    </kbd>
  );
};

/**
 * Button with integrated shortcut hint
 */
interface ButtonWithShortcutProps {
  children: React.ReactNode;
  shortcut?: KeyboardShortcut;
  keys?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  showShortcut?: boolean;
}

export const ButtonWithShortcut: React.FC<ButtonWithShortcutProps> = ({
  children,
  shortcut,
  keys,
  onClick,
  className = '',
  disabled = false,
  variant = 'secondary',
  showShortcut = true,
}) => {
  const baseClasses = `
    inline-flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
    disabled:opacity-50 disabled:cursor-not-allowed
  `;
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border-gray-600',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      <span>{children}</span>
      {showShortcut && (shortcut || keys) && (
        <ShortcutHint 
          shortcut={shortcut} 
          keys={keys} 
          className="ml-2 bg-gray-200 dark:bg-gray-700"
        />
      )}
    </button>
  );
};

/**
 * Menu item with shortcut hint
 */
interface MenuItemWithShortcutProps {
  children: React.ReactNode;
  shortcut?: KeyboardShortcut;
  keys?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export const MenuItemWithShortcut: React.FC<MenuItemWithShortcutProps> = ({
  children,
  shortcut,
  keys,
  onClick,
  className = '',
  disabled = false,
  icon,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center justify-between px-4 py-2 text-sm text-left
        text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800
        disabled:opacity-50 disabled:cursor-not-allowed transition-colors
        ${className}
      `}
    >
      <div className="flex items-center space-x-3">
        {icon && <span className="w-4 h-4">{icon}</span>}
        <span>{children}</span>
      </div>
      
      {(shortcut || keys) && (
        <ShortcutHint shortcut={shortcut} keys={keys} />
      )}
    </button>
  );
};

/**
 * Tooltip with shortcut information
 */
interface ShortcutTooltipProps {
  children: React.ReactNode;
  shortcut?: KeyboardShortcut;
  keys?: string;
  description?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const ShortcutTooltip: React.FC<ShortcutTooltipProps> = ({
  children,
  shortcut,
  keys,
  description,
  position = 'bottom',
  className = '',
}) => {
  const displayKeys = keys || (shortcut ? formatShortcut(shortcut) : '');
  const displayDescription = description || shortcut?.description || '';
  
  if (!displayKeys && !displayDescription) {
    return <>{children}</>;
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  return (
    <div className={`relative group ${className}`}>
      {children}
      
      <div className={`
        absolute z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200
        pointer-events-none px-3 py-2 text-sm bg-gray-900 dark:bg-gray-700 text-white
        rounded-lg shadow-lg whitespace-nowrap ${positionClasses[position]}
      `}>
        {displayDescription && (
          <div className="font-medium">{displayDescription}</div>
        )}
        {displayKeys && (
          <div className="flex items-center space-x-1 text-xs opacity-75">
            <KeyboardIcon className="w-3 h-3" />
            <span>{displayKeys}</span>
          </div>
        )}
        
        {/* Arrow */}
        <div className={`
          absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45
          ${position === 'top' && 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2'}
          ${position === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2'}
          ${position === 'left' && 'left-full top-1/2 -translate-y-1/2 -translate-x-1/2'}
          ${position === 'right' && 'right-full top-1/2 -translate-y-1/2 translate-x-1/2'}
        `} />
      </div>
    </div>
  );
};