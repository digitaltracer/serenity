"use strict";
/**
 * React Hook for Keyboard Shortcuts
 * Provides keyboard shortcut functionality with context awareness
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useListNavigation = exports.useShortcutActions = exports.useContextualKeyboardShortcuts = exports.useGlobalKeyboardShortcuts = exports.useKeyboardShortcuts = void 0;
const react_1 = require("react");
const react_redux_1 = require("react-redux");
const logger_1 = require("../utils/logger");
const keyboardShortcuts_1 = require("../utils/keyboardShortcuts");
/**
 * Hook for handling keyboard shortcuts
 */
const useKeyboardShortcuts = (handler, options) => {
    const { shortcuts, context = {}, enabled = true, preventDefault = true, stopPropagation = true, } = options;
    const handlerRef = (0, react_1.useRef)(handler);
    const shortcutsRef = (0, react_1.useRef)(shortcuts);
    // Keep refs updated
    (0, react_1.useEffect)(() => {
        handlerRef.current = handler;
    }, [handler]);
    (0, react_1.useEffect)(() => {
        shortcutsRef.current = shortcuts;
    }, [shortcuts]);
    const handleKeyDown = (0, react_1.useCallback)(async (event) => {
        if (!enabled)
            return;
        // Skip if typing in input fields
        if ((0, keyboardShortcuts_1.shouldIgnoreShortcuts)(event.target)) {
            return;
        }
        const enabledShortcuts = (0, keyboardShortcuts_1.getEnabledShortcuts)(shortcutsRef.current);
        // Find matching shortcut
        const matchingShortcut = enabledShortcuts.find(shortcut => (0, keyboardShortcuts_1.matchesShortcut)(event, shortcut));
        if (matchingShortcut) {
            if (preventDefault) {
                event.preventDefault();
            }
            if (stopPropagation) {
                event.stopPropagation();
            }
            try {
                await handlerRef.current(matchingShortcut, event);
            }
            catch (error) {
                logger_1.logger.error('Keyboard shortcut handler error:', { component: 'useKeyboardShortcuts', operation: 'keyboardShortcutHandler' }, error);
            }
        }
    }, [enabled, preventDefault, stopPropagation]);
    (0, react_1.useEffect)(() => {
        if (!enabled)
            return;
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown, enabled]);
};
exports.useKeyboardShortcuts = useKeyboardShortcuts;
/**
 * Hook for global keyboard shortcuts (available everywhere)
 */
const useGlobalKeyboardShortcuts = (handler, shortcuts, enabled = true) => {
    const globalShortcuts = (0, keyboardShortcuts_1.getGlobalShortcuts)(shortcuts);
    (0, exports.useKeyboardShortcuts)(handler, {
        shortcuts: globalShortcuts,
        enabled,
        preventDefault: true,
        stopPropagation: true,
    });
};
exports.useGlobalKeyboardShortcuts = useGlobalKeyboardShortcuts;
/**
 * Hook for context-specific keyboard shortcuts
 */
const useContextualKeyboardShortcuts = (handler, shortcuts, context, enabled = true) => {
    // Filter shortcuts based on context
    const contextualShortcuts = shortcuts.filter(shortcut => {
        // Global shortcuts are always available
        if (shortcut.isGlobal)
            return true;
        // Context-specific filtering logic can be added here
        // For now, include all non-global shortcuts
        return !shortcut.isGlobal;
    });
    (0, exports.useKeyboardShortcuts)(handler, {
        shortcuts: contextualShortcuts,
        context,
        enabled,
    });
};
exports.useContextualKeyboardShortcuts = useContextualKeyboardShortcuts;
/**
 * Hook for handling specific shortcut actions
 */
const useShortcutActions = () => {
    const dispatch = (0, react_redux_1.useDispatch)();
    return (0, react_1.useCallback)(async (shortcut, event) => {
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
                const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]');
                if (searchInput) {
                    searchInput.focus();
                }
                break;
            case 'SHOW_SHORTCUTS_HELP':
                dispatch({ type: 'ui/openShortcutsHelp' });
                break;
            default:
                logger_1.logger.warn(`Unhandled keyboard shortcut action: ${action}`, { component: 'useKeyboardShortcuts', operation: 'unhandledKeyboardShortcut' });
        }
    }, [dispatch]);
};
exports.useShortcutActions = useShortcutActions;
/**
 * Hook for list navigation with arrow keys
 */
const useListNavigation = (items, selectedIndex, onSelectionChange, onActivate, enabled = true) => {
    const handleNavigation = (0, react_1.useCallback)((shortcut, event) => {
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
    const navigationShortcuts = [
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
    (0, exports.useKeyboardShortcuts)(handleNavigation, {
        shortcuts: navigationShortcuts,
        enabled,
    });
};
exports.useListNavigation = useListNavigation;
