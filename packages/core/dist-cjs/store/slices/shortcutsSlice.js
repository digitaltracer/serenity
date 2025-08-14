"use strict";
/**
 * Keyboard Shortcuts State Management
 * Manages user-customizable keyboard shortcuts
 */
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectHasConflicts = exports.selectShortcutById = exports.selectShortcutsByCategory = exports.selectFilteredShortcuts = exports.selectEnabledShortcuts = exports.selectSelectedCategory = exports.selectShortcutSearchQuery = exports.selectIsCustomizeModalOpen = exports.selectIsHelpModalOpen = exports.selectShortcutConflicts = exports.selectShortcutsEnabled = exports.selectShortcuts = exports.clearFilters = exports.setSelectedCategory = exports.setShortcutSearchQuery = exports.closeCustomizeModal = exports.openCustomizeModal = exports.closeHelpModal = exports.openHelpModal = exports.importShortcuts = exports.resetCategory = exports.resetShortcuts = exports.toggleShortcut = exports.updateShortcut = exports.setShortcutsEnabled = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const keyboardShortcuts_1 = require("../../utils/keyboardShortcuts");
const initialState = {
    shortcuts: keyboardShortcuts_1.DEFAULT_SHORTCUTS,
    enabled: true,
    conflicts: [],
    isHelpModalOpen: false,
    isCustomizeModalOpen: false,
    searchQuery: '',
    selectedCategory: 'all',
};
const shortcutsSlice = (0, toolkit_1.createSlice)({
    name: 'shortcuts',
    initialState,
    reducers: {
        // Enable/disable shortcuts system
        setShortcutsEnabled: (state, action) => {
            state.enabled = action.payload;
        },
        // Update a single shortcut
        updateShortcut: (state, action) => {
            const index = state.shortcuts.findIndex(s => s.id === action.payload.id);
            if (index !== -1) {
                state.shortcuts[index] = action.payload;
                state.conflicts = (0, keyboardShortcuts_1.getShortcutConflicts)(state.shortcuts);
            }
        },
        // Enable/disable a specific shortcut
        toggleShortcut: (state, action) => {
            const shortcut = state.shortcuts.find(s => s.id === action.payload);
            if (shortcut) {
                shortcut.enabled = !shortcut.enabled;
                state.conflicts = (0, keyboardShortcuts_1.getShortcutConflicts)(state.shortcuts.filter(s => s.enabled));
            }
        },
        // Reset shortcuts to defaults
        resetShortcuts: (state) => {
            state.shortcuts = keyboardShortcuts_1.DEFAULT_SHORTCUTS;
            state.conflicts = [];
        },
        // Reset a specific category to defaults
        resetCategory: (state, action) => {
            const defaultShortcuts = keyboardShortcuts_1.DEFAULT_SHORTCUTS.filter(s => s.category === action.payload);
            // Remove existing shortcuts in this category
            state.shortcuts = state.shortcuts.filter(s => s.category !== action.payload);
            // Add default shortcuts for this category
            state.shortcuts.push(...defaultShortcuts);
            state.conflicts = (0, keyboardShortcuts_1.getShortcutConflicts)(state.shortcuts.filter(s => s.enabled));
        },
        // Import shortcuts configuration
        importShortcuts: (state, action) => {
            // Validate shortcuts before importing
            const validShortcuts = action.payload.filter(shortcut => shortcut.id && shortcut.key && shortcut.action && shortcut.category);
            state.shortcuts = validShortcuts;
            state.conflicts = (0, keyboardShortcuts_1.getShortcutConflicts)(validShortcuts.filter(s => s.enabled));
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
        setShortcutSearchQuery: (state, action) => {
            state.searchQuery = action.payload;
        },
        setSelectedCategory: (state, action) => {
            state.selectedCategory = action.payload;
        },
        // Clear search and filters
        clearFilters: (state) => {
            state.searchQuery = '';
            state.selectedCategory = 'all';
        },
    },
});
_a = shortcutsSlice.actions, exports.setShortcutsEnabled = _a.setShortcutsEnabled, exports.updateShortcut = _a.updateShortcut, exports.toggleShortcut = _a.toggleShortcut, exports.resetShortcuts = _a.resetShortcuts, exports.resetCategory = _a.resetCategory, exports.importShortcuts = _a.importShortcuts, exports.openHelpModal = _a.openHelpModal, exports.closeHelpModal = _a.closeHelpModal, exports.openCustomizeModal = _a.openCustomizeModal, exports.closeCustomizeModal = _a.closeCustomizeModal, exports.setShortcutSearchQuery = _a.setShortcutSearchQuery, exports.setSelectedCategory = _a.setSelectedCategory, exports.clearFilters = _a.clearFilters;
exports.default = shortcutsSlice.reducer;
// Selectors
const selectShortcuts = (state) => state.shortcuts.shortcuts;
exports.selectShortcuts = selectShortcuts;
const selectShortcutsEnabled = (state) => state.shortcuts.enabled;
exports.selectShortcutsEnabled = selectShortcutsEnabled;
const selectShortcutConflicts = (state) => state.shortcuts.conflicts;
exports.selectShortcutConflicts = selectShortcutConflicts;
const selectIsHelpModalOpen = (state) => state.shortcuts.isHelpModalOpen;
exports.selectIsHelpModalOpen = selectIsHelpModalOpen;
const selectIsCustomizeModalOpen = (state) => state.shortcuts.isCustomizeModalOpen;
exports.selectIsCustomizeModalOpen = selectIsCustomizeModalOpen;
const selectShortcutSearchQuery = (state) => state.shortcuts.searchQuery;
exports.selectShortcutSearchQuery = selectShortcutSearchQuery;
const selectSelectedCategory = (state) => state.shortcuts.selectedCategory;
exports.selectSelectedCategory = selectSelectedCategory;
// Complex selectors
const selectEnabledShortcuts = (state) => state.shortcuts.shortcuts.filter(shortcut => shortcut.enabled);
exports.selectEnabledShortcuts = selectEnabledShortcuts;
const selectFilteredShortcuts = (state) => {
    const { shortcuts, searchQuery, selectedCategory } = state.shortcuts;
    let filtered = shortcuts;
    // Filter by category
    if (selectedCategory !== 'all') {
        filtered = filtered.filter(shortcut => shortcut.category === selectedCategory);
    }
    // Filter by search query
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(shortcut => shortcut.description.toLowerCase().includes(query) ||
            shortcut.action.toLowerCase().includes(query) ||
            shortcut.key.toLowerCase().includes(query));
    }
    return filtered;
};
exports.selectFilteredShortcuts = selectFilteredShortcuts;
const selectShortcutsByCategory = (state) => {
    const shortcuts = state.shortcuts.shortcuts;
    const categories = {
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
exports.selectShortcutsByCategory = selectShortcutsByCategory;
const selectShortcutById = (state, id) => state.shortcuts.shortcuts.find(shortcut => shortcut.id === id);
exports.selectShortcutById = selectShortcutById;
const selectHasConflicts = (state) => state.shortcuts.conflicts.length > 0;
exports.selectHasConflicts = selectHasConflicts;
