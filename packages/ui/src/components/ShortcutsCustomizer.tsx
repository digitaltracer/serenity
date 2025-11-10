/**
 * Keyboard Shortcuts Customization Modal
 * Allows users to customize keyboard shortcuts
 */

import React, { useState, useRef } from 'react';
import { 
  KeyboardIcon, 
  SearchIcon, 
  RefreshCwIcon, 
  AlertTriangleIcon,
  CheckCircleIcon,
  SettingsIcon,
  SaveIcon,
  XIcon,
  EditIcon
} from 'lucide-react';
import { 
  KeyboardShortcut, 
  ShortcutCategory, 
  formatShortcut,
  matchesShortcut,
  KeyModifiers 
} from '@serenity/core';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { Toggle } from './Toggle';

interface ShortcutsCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
  conflicts: KeyboardShortcut[][];
  onUpdateShortcut: (shortcut: KeyboardShortcut) => void;
  onToggleShortcut: (id: string) => void;
  onResetShortcuts: () => void;
  onResetCategory: (category: ShortcutCategory) => void;
}

interface EditingShortcut {
  id: string;
  key: string;
  modifiers: KeyModifiers;
  recording: boolean;
}

export const ShortcutsCustomizer: React.FC<ShortcutsCustomizerProps> = ({
  isOpen,
  onClose,
  shortcuts,
  conflicts,
  onUpdateShortcut,
  onToggleShortcut,
  onResetShortcuts,
  onResetCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ShortcutCategory | 'all'>('all');
  const [editingShortcut, setEditingShortcut] = useState<EditingShortcut | null>(null);
  const [pendingKey, setPendingKey] = useState<string>('');
  const [pendingModifiers, setPendingModifiers] = useState<KeyModifiers>({});
  
  const recordingRef = useRef<HTMLDivElement>(null);

  // Filter shortcuts
  const filteredShortcuts = shortcuts.filter(shortcut => {
    if (selectedCategory !== 'all' && shortcut.category !== selectedCategory) {
      return false;
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        shortcut.description.toLowerCase().includes(query) ||
        shortcut.action.toLowerCase().includes(query) ||
        shortcut.key.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Check if a shortcut has conflicts
  const hasConflict = (shortcut: KeyboardShortcut): boolean => {
    return conflicts.some(group => group.some(s => s.id === shortcut.id));
  };

  // Get conflicting shortcuts for a given shortcut
  const getConflicts = (shortcut: KeyboardShortcut): KeyboardShortcut[] => {
    const conflictGroup = conflicts.find(group => group.some(s => s.id === shortcut.id));
    return conflictGroup ? conflictGroup.filter(s => s.id !== shortcut.id) : [];
  };

  // Start recording a new shortcut
  const startRecording = (shortcut: KeyboardShortcut) => {
    setEditingShortcut({
      id: shortcut.id,
      key: shortcut.key,
      modifiers: { ...shortcut.modifiers },
      recording: true,
    });
    setPendingKey('');
    setPendingModifiers({});
    
    // Focus the recording area
    setTimeout(() => {
      recordingRef.current?.focus();
    }, 100);
  };

  // Handle key recording
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!editingShortcut?.recording) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const key = event.key;
    const modifiers: KeyModifiers = {
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      alt: event.altKey,
      meta: event.metaKey,
    };
    
    // Don't record modifier keys alone
    if (['Control', 'Shift', 'Alt', 'Meta', 'Cmd'].includes(key)) {
      setPendingModifiers(modifiers);
      return;
    }
    
    setPendingKey(key);
    setPendingModifiers(modifiers);
  };

  // Save the recorded shortcut
  const saveShortcut = () => {
    if (!editingShortcut || !pendingKey) return;
    
    const shortcut = shortcuts.find(s => s.id === editingShortcut.id);
    if (!shortcut) return;
    
    const updatedShortcut: KeyboardShortcut = {
      ...shortcut,
      key: pendingKey,
      modifiers: pendingModifiers,
    };
    
    onUpdateShortcut(updatedShortcut);
    setEditingShortcut(null);
    setPendingKey('');
    setPendingModifiers({});
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingShortcut(null);
    setPendingKey('');
    setPendingModifiers({});
  };

  // Format the pending shortcut
  const formatPendingShortcut = (): string => {
    if (!pendingKey) return 'Press keys...';
    
    const tempShortcut: KeyboardShortcut = {
      id: '',
      key: pendingKey,
      modifiers: pendingModifiers,
      description: '',
      category: 'general',
      action: '',
      enabled: true,
    };
    
    return formatShortcut(tempShortcut);
  };

  const categories: { value: ShortcutCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'general', label: 'General' },
    { value: 'navigation', label: 'Navigation' },
    { value: 'tasks', label: 'Tasks' },
    { value: 'journal', label: 'Journal' },
    { value: 'ui', label: 'Interface' },
    { value: 'projects', label: 'Projects' },
    { value: 'search', label: 'Search' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customize Keyboard Shortcuts"
      size="xl"
    >
      <div className="space-y-6">
        {/* Header controls */}
        <div className="flex flex-col lg:flex-row gap-4">
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
          
          <div className="lg:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ShortcutCategory | 'all')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          
          <Button
            onClick={onResetShortcuts}
            variant="secondary"
            size="sm"
            className="flex items-center space-x-2"
          >
            <RefreshCwIcon className="w-4 h-4" />
            <span>Reset All</span>
          </Button>
        </div>

        {/* Conflicts warning */}
        {conflicts.length > 0 && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                Shortcut Conflicts Detected
              </h4>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} found. 
              Conflicting shortcuts may not work as expected.
            </p>
          </div>
        )}

        {/* Key recording modal */}
        {editingShortcut?.recording && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Record New Shortcut
              </h3>
              
              <div
                ref={recordingRef}
                tabIndex={0}
                onKeyDown={handleKeyDown}
                className="p-6 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg text-center focus:outline-none focus:border-blue-500"
              >
                <KeyboardIcon className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Press the keys you want to use
                </p>
                <div className="text-lg font-mono text-gray-900 dark:text-gray-100">
                  {formatPendingShortcut()}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  onClick={cancelEditing}
                  variant="secondary"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveShortcut}
                  disabled={!pendingKey}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <SaveIcon className="w-4 h-4" />
                  <span>Save</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Shortcuts list */}
        <div className="max-h-96 overflow-y-auto">
          <div className="space-y-1">
            {filteredShortcuts.map(shortcut => {
              const isConflicted = hasConflict(shortcut);
              const conflictingShortcuts = getConflicts(shortcut);
              const isEditing = editingShortcut?.id === shortcut.id;
              
              return (
                <div
                  key={shortcut.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    isConflicted 
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <Toggle
                          checked={shortcut.enabled}
                          onChange={() => onToggleShortcut(shortcut.id)}
                          size="sm"
                        />
                        
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {shortcut.description}
                          </h4>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="capitalize">{shortcut.category}</span>
                            {shortcut.isGlobal && (
                              <>
                                <span>•</span>
                                <span className="text-blue-600 dark:text-blue-400">Global</span>
                              </>
                            )}
                            {isConflicted && (
                              <>
                                <span>•</span>
                                <span className="text-red-600 dark:text-red-400">
                                  Conflicts with {conflictingShortcuts.length} other{conflictingShortcuts.length > 1 ? 's' : ''}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 ml-4">
                      <kbd className="inline-flex items-center px-2 py-1 text-sm font-mono bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded shadow-sm text-gray-700 dark:text-gray-300">
                        {formatShortcut(shortcut)}
                      </kbd>
                      
                      <Button
                        onClick={() => startRecording(shortcut)}
                        variant="secondary"
                        size="sm"
                        className="flex items-center space-x-1"
                        disabled={!shortcut.enabled}
                      >
                        <EditIcon className="w-3 h-3" />
                        <span>Edit</span>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Show conflicts */}
                  {isConflicted && (
                    <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                        Conflicts with:
                      </p>
                      <div className="space-y-1">
                        {conflictingShortcuts.map(conflict => (
                          <div key={conflict.id} className="text-sm text-red-600 dark:text-red-400">
                            • {conflict.description} ({conflict.category})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {filteredShortcuts.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <SettingsIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No shortcuts found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {filteredShortcuts.length} shortcuts • {shortcuts.filter(s => s.enabled).length} enabled
          </div>
          
          <Button onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};