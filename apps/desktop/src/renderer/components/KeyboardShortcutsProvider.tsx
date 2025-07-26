/**
 * Keyboard Shortcuts Provider
 * Handles global keyboard shortcuts for the entire application
 */

import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  RootState,
  AppDispatch,
  selectShortcuts,
  selectShortcutsEnabled,
  selectIsHelpModalOpen,
  selectIsCustomizeModalOpen,
  selectShortcutConflicts,
  openHelpModal,
  closeHelpModal,
  openCustomizeModal,
  closeCustomizeModal,
  updateShortcut,
  toggleShortcut,
  resetShortcuts,
  resetCategory,
  openTaskModal,
  openJournalModal,
  toggleSidebar,
  toggleTheme,
  toggleCompactMode,
  openGlobalSearch,
  useGlobalKeyboardShortcuts,
  useShortcutActions,
  KeyboardShortcut,
  ShortcutCategory
} from '@serenity/core';
import {
  KeyboardShortcutsHelp,
  ShortcutsCustomizer
} from '@serenity/ui';

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
}

export const KeyboardShortcutsProvider: React.FC<KeyboardShortcutsProviderProps> = ({
  children
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  // Selectors
  const shortcuts = useSelector((state: RootState) => selectShortcuts(state));
  const shortcutsEnabled = useSelector((state: RootState) => selectShortcutsEnabled(state));
  const isHelpModalOpen = useSelector((state: RootState) => selectIsHelpModalOpen(state));
  const isCustomizeModalOpen = useSelector((state: RootState) => selectIsCustomizeModalOpen(state));
  const conflicts = useSelector((state: RootState) => selectShortcutConflicts(state));

  // Enhanced shortcut handler with navigation support
  const handleShortcut = useCallback(async (shortcut: KeyboardShortcut, event: KeyboardEvent) => {
    const { action } = shortcut;
    console.log('🎹 Keyboard shortcut triggered:', action, shortcut.key, shortcut.modifiers);
    
    switch (action) {
      // General actions
      case 'QUICK_ADD_TASK':
        dispatch(openTaskModal());
        break;
        
      case 'QUICK_ADD_JOURNAL':
        dispatch(openJournalModal());
        break;
        
      case 'OPEN_GLOBAL_SEARCH':
        dispatch(openGlobalSearch());
        break;
        
      case 'OPEN_COMMAND_PALETTE':
        // TODO: Implement command palette
        console.log('Command palette not yet implemented');
        break;
        
      // Navigation actions
      case 'NAVIGATE_HOME':
        navigate('/');
        break;
        
      case 'NAVIGATE_ACTIONHUB':
        navigate('/actionhub');
        break;
        
      case 'NAVIGATE_JOURNAL':
        navigate('/journal');
        break;
        
      case 'NAVIGATE_ANALYTICS':
        navigate('/analytics');
        break;
        
      case 'NAVIGATE_SETTINGS':
        navigate('/settings');
        break;
        
      // UI actions
      case 'TOGGLE_SIDEBAR':
        dispatch(toggleSidebar());
        break;
        
      case 'TOGGLE_THEME':
        dispatch(toggleTheme());
        break;
        
      case 'TOGGLE_COMPACT_MODE':
        dispatch(toggleCompactMode());
        break;
        
      case 'CLOSE_MODAL':
        // Close any open modals
        dispatch(closeHelpModal());
        dispatch(closeCustomizeModal());
        // TODO: Add other modal close actions
        break;
        
      // Help and shortcuts
      case 'SHOW_SHORTCUTS_HELP':
        dispatch(openHelpModal());
        break;
        
      // Task actions (would need context from current page)
      case 'COMPLETE_SELECTED_TASK':
      case 'DELETE_SELECTED_TASK':
      case 'EDIT_SELECTED_TASK':
      case 'DUPLICATE_SELECTED_TASK':
        // These would be handled by page-specific components
        console.log(`Task action: ${action} - handled by page context`);
        break;
        
      // Selection actions
      case 'SELECT_ALL':
      case 'SELECT_NONE':
        // These would be handled by page-specific components
        console.log(`Selection action: ${action} - handled by page context`);
        break;
        
      // Search actions
      case 'FOCUS_SEARCH':
        // Focus search input if available
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        break;
        
      default:
        console.warn(`Unhandled keyboard shortcut action: ${action}`);
    }
  }, [dispatch, navigate]);

  // Use global keyboard shortcuts
  useGlobalKeyboardShortcuts(handleShortcut, shortcuts, shortcutsEnabled);
  
  // Debug: Log shortcuts state
  React.useEffect(() => {
    console.log('🎹 Keyboard shortcuts state:', {
      totalShortcuts: shortcuts.length,
      enabledShortcuts: shortcuts.filter(s => s.enabled).length,
      globalShortcuts: shortcuts.filter(s => s.isGlobal).length,
      shortcutsEnabled
    });
    
    // Debug: Log first few shortcuts to see their structure
    console.log('🔍 First 5 shortcuts:', shortcuts.slice(0, 5).map(s => ({
      id: s.id,
      key: s.key,
      isGlobal: s.isGlobal,
      enabled: s.enabled,
      action: s.action,
      modifiers: s.modifiers
    })));
    
    // Debug: Log all global shortcuts specifically
    const globalOnes = shortcuts.filter(s => s.isGlobal);
    console.log('🌍 All global shortcuts:', globalOnes.map(s => ({
      id: s.id,
      key: s.key,
      isGlobal: s.isGlobal,
      action: s.action
    })));
    
    // Debug: Check if DEFAULT_SHORTCUTS is being used correctly
    console.log('📋 Checking DEFAULT_SHORTCUTS import...');
    import('@serenity/core').then(core => {
      const { DEFAULT_SHORTCUTS } = core;
      console.log('📦 DEFAULT_SHORTCUTS from core:', {
        total: DEFAULT_SHORTCUTS?.length || 0,
        globalCount: DEFAULT_SHORTCUTS?.filter(s => s.isGlobal)?.length || 0,
        firstFive: DEFAULT_SHORTCUTS?.slice(0, 5)?.map(s => ({
          id: s.id,
          isGlobal: s.isGlobal,
          key: s.key
        })) || []
      });
    });
  }, [shortcuts, shortcutsEnabled]);

  // Handlers for shortcut management
  const handleUpdateShortcut = useCallback((shortcut: KeyboardShortcut) => {
    dispatch(updateShortcut(shortcut));
  }, [dispatch]);

  const handleToggleShortcut = useCallback((id: string) => {
    dispatch(toggleShortcut(id));
  }, [dispatch]);

  const handleResetShortcuts = useCallback(() => {
    dispatch(resetShortcuts());
  }, [dispatch]);

  const handleResetCategory = useCallback((category: ShortcutCategory) => {
    dispatch(resetCategory(category));
  }, [dispatch]);

  const handleCloseHelp = useCallback(() => {
    dispatch(closeHelpModal());
  }, [dispatch]);

  const handleCloseCustomizer = useCallback(() => {
    dispatch(closeCustomizeModal());
  }, [dispatch]);

  const handleOpenCustomizer = useCallback(() => {
    dispatch(openCustomizeModal());
  }, [dispatch]);

  return (
    <>
      {children}
      
      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        isOpen={isHelpModalOpen}
        onClose={handleCloseHelp}
        shortcuts={shortcuts}
        onCustomize={handleOpenCustomizer}
      />
      
      {/* Shortcuts Customizer Modal */}
      <ShortcutsCustomizer
        isOpen={isCustomizeModalOpen}
        onClose={handleCloseCustomizer}
        shortcuts={shortcuts}
        conflicts={conflicts}
        onUpdateShortcut={handleUpdateShortcut}
        onToggleShortcut={handleToggleShortcut}
        onResetShortcuts={handleResetShortcuts}
        onResetCategory={handleResetCategory}
      />
    </>
  );
};