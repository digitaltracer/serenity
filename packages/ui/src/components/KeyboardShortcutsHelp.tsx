/**
 * Keyboard Shortcuts Help Modal
 * Displays all available keyboard shortcuts organized by category
 */

import React, { useState } from 'react';
import { 
  KeyboardIcon, 
  SearchIcon, 
  FilterIcon,
  CommandIcon,
  MousePointerIcon,
  NavigationIcon,
  SettingsIcon,
  BookOpenIcon,
  FolderIcon,
  LayoutGridIcon
} from 'lucide-react';
import { 
  KeyboardShortcut, 
  ShortcutCategory, 
  formatShortcut,
  getShortcutsByCategory 
} from '@serenity/core';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';

// Component for displaying individual shortcut keys with proper styling
const ShortcutKey: React.FC<{ shortcut: KeyboardShortcut }> = ({ shortcut }) => {
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
    <div className="flex items-center space-x-1">
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          <kbd 
            className={`
              inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 text-xs font-mono 
              border rounded shadow-sm
              ${part.type === 'modifier' 
                ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-300'
                : 'bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-500 text-gray-900 dark:text-gray-100 font-semibold'
              }
            `}
          >
            {part.text}
          </kbd>
          {index < parts.length - 1 && !mac && (
            <span className="text-gray-400 dark:text-gray-500 text-xs font-medium">+</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
  onCustomize?: () => void;
}

const categoryIcons: Record<ShortcutCategory, React.ReactNode> = {
  general: <CommandIcon className="w-4 h-4" />,
  tasks: <MousePointerIcon className="w-4 h-4" />,
  journal: <BookOpenIcon className="w-4 h-4" />,
  navigation: <NavigationIcon className="w-4 h-4" />,
  ui: <LayoutGridIcon className="w-4 h-4" />,
  projects: <FolderIcon className="w-4 h-4" />,
  search: <SearchIcon className="w-4 h-4" />,
};

const categoryNames: Record<ShortcutCategory, string> = {
  general: 'General',
  tasks: 'Tasks',
  journal: 'Journal',
  navigation: 'Navigation',
  ui: 'Interface',
  projects: 'Projects',
  search: 'Search',
};

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  isOpen,
  onClose,
  shortcuts,
  onCustomize,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ShortcutCategory | 'all'>('all');

  // Filter shortcuts based on search and category
  const filteredShortcuts = shortcuts.filter(shortcut => {
    if (!shortcut.enabled) return false;
    
    // Category filter
    if (selectedCategory !== 'all' && shortcut.category !== selectedCategory) {
      return false;
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        shortcut.description.toLowerCase().includes(query) ||
        shortcut.action.toLowerCase().includes(query) ||
        shortcut.key.toLowerCase().includes(query) ||
        categoryNames[shortcut.category].toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Group shortcuts by category
  const groupedShortcuts = filteredShortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<ShortcutCategory, KeyboardShortcut[]>);

  const categories = Object.keys(categoryNames) as ShortcutCategory[];
  const availableCategories = categories.filter(category => 
    shortcuts.some(s => s.category === category && s.enabled)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header with search and filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search shortcuts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ShortcutCategory | 'all')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {availableCategories.map(category => (
                <option key={category} value={category}>
                  {categoryNames[category]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Shortcuts list */}
        <div className="max-h-96 overflow-y-auto">
          {Object.keys(groupedShortcuts).length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <KeyboardIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No shortcuts found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                <div key={category} className="space-y-3">
                  {/* Category header */}
                  <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                    {categoryIcons[category as ShortcutCategory]}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {categoryNames[category as ShortcutCategory]}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({categoryShortcuts.length})
                    </span>
                  </div>
                  
                  {/* Shortcuts in this category */}
                  <div className="grid gap-2">
                    {categoryShortcuts.map(shortcut => (
                      <div
                        key={shortcut.id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {shortcut.description}
                          </p>
                          {shortcut.isGlobal && (
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              Global shortcut
                            </p>
                          )}
                        </div>
                        
                        <div className="ml-4">
                          <ShortcutKey shortcut={shortcut} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {filteredShortcuts.length} shortcuts available
          </div>
          
          <div className="flex space-x-3">
            {onCustomize && (
              <Button
                onClick={() => {
                  onClose();
                  onCustomize();
                }}
                variant="secondary"
                size="sm"
                className="flex items-center space-x-2"
              >
                <SettingsIcon className="w-4 h-4" />
                <span>Customize</span>
              </Button>
            )}
            
            <Button
              onClick={onClose}
              variant="primary"
              size="sm"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

/**
 * Compact shortcuts reference component
 */
export const ShortcutsReference: React.FC<{
  shortcuts: KeyboardShortcut[];
  category?: ShortcutCategory;
  className?: string;
}> = ({ shortcuts, category, className = '' }) => {
  const relevantShortcuts = category 
    ? getShortcutsByCategory(shortcuts, category).slice(0, 3)
    : shortcuts.filter(s => s.isGlobal).slice(0, 3);

  if (relevantShortcuts.length === 0) return null;

  return (
    <div className={`text-xs text-gray-500 dark:text-gray-400 ${className}`}>
      <div className="flex flex-wrap gap-2">
        {relevantShortcuts.map(shortcut => (
          <div key={shortcut.id} className="flex items-center space-x-1">
            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
              {formatShortcut(shortcut)}
            </kbd>
            <span>{shortcut.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
};