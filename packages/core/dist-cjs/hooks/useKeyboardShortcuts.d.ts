import { KeyboardShortcut, ShortcutContext } from '../utils/keyboardShortcuts';
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
export declare const useKeyboardShortcuts: (handler: ShortcutHandler, options: UseKeyboardShortcutsOptions) => void;
/**
 * Hook for global keyboard shortcuts (available everywhere)
 */
export declare const useGlobalKeyboardShortcuts: (handler: ShortcutHandler, shortcuts: KeyboardShortcut[], enabled?: boolean) => void;
/**
 * Hook for context-specific keyboard shortcuts
 */
export declare const useContextualKeyboardShortcuts: (handler: ShortcutHandler, shortcuts: KeyboardShortcut[], context: ShortcutContext, enabled?: boolean) => void;
/**
 * Hook for handling specific shortcut actions
 */
export declare const useShortcutActions: () => (shortcut: KeyboardShortcut, event: KeyboardEvent) => Promise<void>;
/**
 * Hook for list navigation with arrow keys
 */
export declare const useListNavigation: (items: any[], selectedIndex: number, onSelectionChange: (index: number) => void, onActivate?: (index: number, item: any) => void, enabled?: boolean) => void;
