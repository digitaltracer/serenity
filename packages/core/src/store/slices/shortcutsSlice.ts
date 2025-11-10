/**
 * Keyboard Shortcuts State Management
 * Manages user-customizable keyboard shortcuts
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  KeyboardShortcut, 
  DEFAULT_SHORTCUTS, 
  ShortcutCategory,
  getShortcutConflicts 
} from '../../utils/keyboardShortcuts';

export interface ShortcutsState {
  shortcuts: KeyboardShortcut[];
  enabled: boolean;
  conflicts: KeyboardShortcut[][];
  isHelpModalOpen: boolean;
  isCustomizeModalOpen: boolean;
  searchQuery: string;
  selectedCategory: ShortcutCategory | 'all';
}

const initialState: ShortcutsState = {
  shortcuts: DEFAULT_SHORTCUTS,
  enabled: true,
  conflicts: [],
  isHelpModalOpen: false,
  isCustomizeModalOpen: false,
  searchQuery: '',
  selectedCategory: 'all',
};

const shortcutsSlice = createSlice({
  name: 'shortcuts',
  initialState,
  reducers: {
    // Enable/disable shortcuts system
    setShortcutsEnabled: (state, action: PayloadAction<boolean>) => {
      state.enabled = action.payload;
    },
    
    // Update a single shortcut
    updateShortcut: (state, action: PayloadAction<KeyboardShortcut>) => {
      const index = state.shortcuts.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.shortcuts[index] = action.payload;
        state.conflicts = getShortcutConflicts(state.shortcuts);
      }
    },
    
    // Enable/disable a specific shortcut
    toggleShortcut: (state, action: PayloadAction<string>) => {
      const shortcut = state.shortcuts.find(s => s.id === action.payload);
      if (shortcut) {
        shortcut.enabled = !shortcut.enabled;
        state.conflicts = getShortcutConflicts(state.shortcuts.filter(s => s.enabled));
      }
    },
    
    // Reset shortcuts to defaults
    resetShortcuts: (state) => {
      state.shortcuts = DEFAULT_SHORTCUTS;
      state.conflicts = [];
    },
    
    // Reset a specific category to defaults
    resetCategory: (state, action: PayloadAction<ShortcutCategory>) => {
      const defaultShortcuts = DEFAULT_SHORTCUTS.filter(s => s.category === action.payload);
      
      // Remove existing shortcuts in this category
      state.shortcuts = state.shortcuts.filter(s => s.category !== action.payload);
      
      // Add default shortcuts for this category
      state.shortcuts.push(...defaultShortcuts);
      
      state.conflicts = getShortcutConflicts(state.shortcuts.filter(s => s.enabled));
    },
    
    // Import shortcuts configuration
    importShortcuts: (state, action: PayloadAction<KeyboardShortcut[]>) => {
      // Validate shortcuts before importing
      const validShortcuts = action.payload.filter(shortcut => 
        shortcut.id && shortcut.key && shortcut.action && shortcut.category
      );
      
      state.shortcuts = validShortcuts;
      state.conflicts = getShortcutConflicts(validShortcuts.filter(s => s.enabled));
    },
    
    // UI state management
    openHelpModal: (state) => {
      state.isHelpModalOpen = true;
    },
    
    closeHelpModal: (state) => {
      state.isHelpModalOpen = false;
    },
    
    openCustomizeModal: (state) => {
      state.isCustomizeModalOpen = true;
    },
    
    closeCustomizeModal: (state) => {
      state.isCustomizeModalOpen = false;
    },
    
    // Search and filtering
    setShortcutSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    
    setSelectedCategory: (state, action: PayloadAction<ShortcutCategory | 'all'>) => {
      state.selectedCategory = action.payload;
    },
    
    // Clear search and filters
    clearFilters: (state) => {
      state.searchQuery = '';
      state.selectedCategory = 'all';
    },
  },
});

export const {
  setShortcutsEnabled,
  updateShortcut,
  toggleShortcut,
  resetShortcuts,
  resetCategory,
  importShortcuts,
  openHelpModal,
  closeHelpModal,
  openCustomizeModal,
  closeCustomizeModal,
  setShortcutSearchQuery,
  setSelectedCategory,
  clearFilters,
} = shortcutsSlice.actions;

export default shortcutsSlice.reducer;

// Selectors
export const selectShortcuts = (state: { shortcuts: ShortcutsState }) => state.shortcuts.shortcuts;
export const selectShortcutsEnabled = (state: { shortcuts: ShortcutsState }) => state.shortcuts.enabled;
export const selectShortcutConflicts = (state: { shortcuts: ShortcutsState }) => state.shortcuts.conflicts;
export const selectIsHelpModalOpen = (state: { shortcuts: ShortcutsState }) => state.shortcuts.isHelpModalOpen;
export const selectIsCustomizeModalOpen = (state: { shortcuts: ShortcutsState }) => state.shortcuts.isCustomizeModalOpen;
export const selectShortcutSearchQuery = (state: { shortcuts: ShortcutsState }) => state.shortcuts.searchQuery;
export const selectSelectedCategory = (state: { shortcuts: ShortcutsState }) => state.shortcuts.selectedCategory;

// Complex selectors
export const selectEnabledShortcuts = (state: { shortcuts: ShortcutsState }) => 
  state.shortcuts.shortcuts.filter(shortcut => shortcut.enabled);

export const selectFilteredShortcuts = (state: { shortcuts: ShortcutsState }) => {
  const { shortcuts, searchQuery, selectedCategory } = state.shortcuts;
  
  let filtered = shortcuts;
  
  // Filter by category
  if (selectedCategory !== 'all') {
    filtered = filtered.filter(shortcut => shortcut.category === selectedCategory);
  }
  
  // Filter by search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(shortcut => 
      shortcut.description.toLowerCase().includes(query) ||
      shortcut.action.toLowerCase().includes(query) ||
      shortcut.key.toLowerCase().includes(query)
    );
  }
  
  return filtered;
};

export const selectShortcutsByCategory = (state: { shortcuts: ShortcutsState }) => {
  const shortcuts = state.shortcuts.shortcuts;
  const categories: Record<ShortcutCategory, KeyboardShortcut[]> = {
    general: [],
    tasks: [],
    journal: [],
    navigation: [],
    ui: [],
    projects: [],
    search: [],
  };
  
  shortcuts.forEach(shortcut => {
    if (categories[shortcut.category]) {
      categories[shortcut.category].push(shortcut);
    }
  });
  
  return categories;
};

export const selectShortcutById = (state: { shortcuts: ShortcutsState }, id: string) =>
  state.shortcuts.shortcuts.find(shortcut => shortcut.id === id);

export const selectHasConflicts = (state: { shortcuts: ShortcutsState }) =>
  state.shortcuts.conflicts.length > 0;