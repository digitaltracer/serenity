/**
 * Keyboard Shortcuts System for Serenity Notes
 * Provides comprehensive keyboard shortcuts for productivity
 */
export interface KeyboardShortcut {
    id: string;
    key: string;
    modifiers: KeyModifiers;
    description: string;
    category: ShortcutCategory;
    action: string;
    enabled: boolean;
    isGlobal?: boolean;
}
export interface KeyModifiers {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
}
export type ShortcutCategory = 'general' | 'tasks' | 'journal' | 'navigation' | 'ui' | 'projects' | 'search';
export interface ShortcutContext {
    page?: string;
    modal?: string;
    focus?: string;
}
export declare const DEFAULT_SHORTCUTS: KeyboardShortcut[];
/**
 * Check if the current platform is Mac
 */
export declare const isMac: () => boolean;
/**
 * Convert keyboard shortcut to display string
 */
export declare const formatShortcut: (shortcut: KeyboardShortcut) => string;
/**
 * Check if a keyboard event matches a shortcut
 */
export declare const matchesShortcut: (event: KeyboardEvent, shortcut: KeyboardShortcut) => boolean;
/**
 * Get shortcuts by category
 */
export declare const getShortcutsByCategory: (shortcuts: KeyboardShortcut[], category: ShortcutCategory) => KeyboardShortcut[];
/**
 * Get all enabled shortcuts
 */
export declare const getEnabledShortcuts: (shortcuts: KeyboardShortcut[]) => KeyboardShortcut[];
/**
 * Get global shortcuts (available in all contexts)
 */
export declare const getGlobalShortcuts: (shortcuts: KeyboardShortcut[]) => KeyboardShortcut[];
/**
 * Find shortcut by ID
 */
export declare const findShortcutById: (shortcuts: KeyboardShortcut[], id: string) => KeyboardShortcut | undefined;
/**
 * Check if element should ignore keyboard shortcuts
 */
export declare const shouldIgnoreShortcuts: (target: EventTarget | null) => boolean;
/**
 * Get shortcut conflicts (same key combination)
 */
export declare const getShortcutConflicts: (shortcuts: KeyboardShortcut[]) => KeyboardShortcut[][];
