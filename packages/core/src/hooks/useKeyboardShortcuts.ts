/**
 * React Hook for Keyboard Shortcuts
 * Provides keyboard shortcut functionality with context awareness
 */

import { useEffect, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { 
  KeyboardShortcut,
  ShortcutContext,
  matchesShortcut,
  shouldIgnoreShortcuts,
  getGlobalShortcuts,
  getEnabledShortcuts 
} from '../utils/keyboardShortcuts';

export interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  context?: ShortcutContext;
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export interface ShortcutHandler {
  (shortcut: KeyboardShortcut, event: KeyboardEvent): void | Promise<void>;
}

/**
 * Hook for handling keyboard shortcuts
 */
export const useKeyboardShortcuts = (
  handler: ShortcutHandler,
  options: UseKeyboardShortcutsOptions
) => {
  const {
    shortcuts,
    context = {},
    enabled = true,
    preventDefault = true,
    stopPropagation = true,
  } = options;

  const handlerRef = useRef(handler);
  const shortcutsRef = useRef(shortcuts);
  
  // Keep refs updated
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);
  
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback(async (event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Skip if typing in input fields
    if (shouldIgnoreShortcuts(event.target)) {
      return;
    }
    
    const enabledShortcuts = getEnabledShortcuts(shortcutsRef.current);
    
    // Find matching shortcut
    const matchingShortcut = enabledShortcuts.find(shortcut => 
      matchesShortcut(event, shortcut)
    );
    
    if (matchingShortcut) {
      if (preventDefault) {
        event.preventDefault();
      }
      if (stopPropagation) {
        event.stopPropagation();
      }
      
      try {
        await handlerRef.current(matchingShortcut, event);
      } catch (error) {
        console.error('Keyboard shortcut handler error:', error);
      }
    }
  }, [enabled, preventDefault, stopPropagation]);

  useEffect(() => {
    if (!enabled) return;
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
};

/**
 * Hook for global keyboard shortcuts (available everywhere)
 */
export const useGlobalKeyboardShortcuts = (
  handler: ShortcutHandler,
  shortcuts: KeyboardShortcut[],
  enabled = true
) => {
  const globalShortcuts = getGlobalShortcuts(shortcuts);
  
  useKeyboardShortcuts(handler, {
    shortcuts: globalShortcuts,
    enabled,
    preventDefault: true,
    stopPropagation: true,
  });
};

/**
 * Hook for context-specific keyboard shortcuts
 */
export const useContextualKeyboardShortcuts = (
  handler: ShortcutHandler,
  shortcuts: KeyboardShortcut[],
  context: ShortcutContext,
  enabled = true
) => {
  // Filter shortcuts based on context
  const contextualShortcuts = shortcuts.filter(shortcut => {
    // Global shortcuts are always available
    if (shortcut.isGlobal) return true;
    
    // Context-specific filtering logic can be added here
    // For now, include all non-global shortcuts
    return !shortcut.isGlobal;
  });
  
  useKeyboardShortcuts(handler, {
    shortcuts: contextualShortcuts,
    context,
    enabled,
  });
};

/**
 * Hook for handling specific shortcut actions
 */
export const useShortcutActions = () => {
  const dispatch = useDispatch();
  
  return useCallback(async (shortcut: KeyboardShortcut, event: KeyboardEvent) => {
    const { action } = shortcut;
    
    switch (action) {
      // General actions
      case 'QUICK_ADD_TASK':
        dispatch({ type: 'ui/openTaskModal' });
        break;
        
      case 'QUICK_ADD_JOURNAL':
        dispatch({ type: 'ui/openJournalModal' });
        break;
        
      case 'OPEN_GLOBAL_SEARCH':
        dispatch({ type: 'ui/openGlobalSearch' });
        break;
        
      case 'OPEN_COMMAND_PALETTE':
        dispatch({ type: 'ui/openCommandPalette' });
        break;
        
      // Navigation actions
      case 'NAVIGATE_HOME':
        dispatch({ type: 'ui/setCurrentPage', payload: 'home' });
        break;
        
      case 'NAVIGATE_ACTIONHUB':
        dispatch({ type: 'ui/setCurrentPage', payload: 'actionhub' });
        break;
        
      case 'NAVIGATE_JOURNAL':
        dispatch({ type: 'ui/setCurrentPage', payload: 'journal' });
        break;
        
      case 'NAVIGATE_ANALYTICS':
        dispatch({ type: 'ui/setCurrentPage', payload: 'analytics' });
        break;
        
      case 'NAVIGATE_SETTINGS':
        dispatch({ type: 'ui/setCurrentPage', payload: 'settings' });
        break;
        
      // UI actions
      case 'TOGGLE_SIDEBAR':
        dispatch({ type: 'ui/toggleSidebar' });
        break;
        
      case 'TOGGLE_THEME':
        dispatch({ type: 'ui/toggleTheme' });
        break;
        
      case 'TOGGLE_COMPACT_MODE':
        dispatch({ type: 'ui/toggleCompactMode' });
        break;
        
      case 'CLOSE_MODAL':
        dispatch({ type: 'ui/closeAllModals' });
        break;
        
      // Task actions (these would need selected task context)
      case 'COMPLETE_SELECTED_TASK':
        dispatch({ type: 'tasks/completeSelected' });
        break;
        
      case 'DELETE_SELECTED_TASK':
        dispatch({ type: 'tasks/deleteSelected' });
        break;
        
      case 'EDIT_SELECTED_TASK':
        dispatch({ type: 'ui/editSelectedTask' });
        break;
        
      case 'DUPLICATE_SELECTED_TASK':
        dispatch({ type: 'tasks/duplicateSelected' });
        break;
        
      // Selection actions
      case 'SELECT_ALL':
        dispatch({ type: 'ui/selectAll' });
        break;
        
      case 'SELECT_NONE':
        dispatch({ type: 'ui/clearSelection' });
        break;
        
      // Search actions
      case 'FOCUS_SEARCH':
        // Focus search input if available
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
        break;
        
      case 'SHOW_SHORTCUTS_HELP':
        dispatch({ type: 'ui/openShortcutsHelp' });
        break;
        
      default:
        console.warn(`Unhandled keyboard shortcut action: ${action}`);
    }
  }, [dispatch]);
};

/**
 * Hook for list navigation with arrow keys
 */
export const useListNavigation = (
  items: any[],
  selectedIndex: number,
  onSelectionChange: (index: number) => void,
  onActivate?: (index: number, item: any) => void,
  enabled = true
) => {
  const handleNavigation = useCallback((shortcut: KeyboardShortcut, event: KeyboardEvent) => {
    const { action } = shortcut;
    
    switch (action) {
      case 'NAVIGATE_UP':
        if (selectedIndex > 0) {
          onSelectionChange(selectedIndex - 1);
        }
        break;
        
      case 'NAVIGATE_DOWN':
        if (selectedIndex < items.length - 1) {
          onSelectionChange(selectedIndex + 1);
        }
        break;
        
      case 'NAVIGATE_ACTIVATE':
        if (onActivate && selectedIndex >= 0 && selectedIndex < items.length) {
          onActivate(selectedIndex, items[selectedIndex]);
        }
        break;
    }
  }, [items, selectedIndex, onSelectionChange, onActivate]);
  
  const navigationShortcuts: KeyboardShortcut[] = [
    {
      id: 'nav-up',
      key: 'ArrowUp',
      modifiers: {},
      description: 'Navigate up',
      category: 'navigation',
      action: 'NAVIGATE_UP',
      enabled: true,
    },
    {
      id: 'nav-down',
      key: 'ArrowDown',
      modifiers: {},
      description: 'Navigate down',
      category: 'navigation',
      action: 'NAVIGATE_DOWN',
      enabled: true,
    },
    {
      id: 'nav-activate',
      key: 'Enter',
      modifiers: {},
      description: 'Activate selected item',
      category: 'navigation',
      action: 'NAVIGATE_ACTIVATE',
      enabled: true,
    },
  ];
  
  useKeyboardShortcuts(handleNavigation, {
    shortcuts: navigationShortcuts,
    enabled,
  });
};