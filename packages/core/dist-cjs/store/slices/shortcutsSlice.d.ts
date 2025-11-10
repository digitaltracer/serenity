/**
 * Keyboard Shortcuts State Management
 * Manages user-customizable keyboard shortcuts
 */
import { KeyboardShortcut, ShortcutCategory } from '../../utils/keyboardShortcuts';
export interface ShortcutsState {
    shortcuts: KeyboardShortcut[];
    enabled: boolean;
    conflicts: KeyboardShortcut[][];
    isHelpModalOpen: boolean;
    isCustomizeModalOpen: boolean;
    searchQuery: string;
    selectedCategory: ShortcutCategory | 'all';
}
export declare const setShortcutsEnabled: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "shortcuts/setShortcutsEnabled">, updateShortcut: import("@reduxjs/toolkit").ActionCreatorWithPayload<KeyboardShortcut, "shortcuts/updateShortcut">, toggleShortcut: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "shortcuts/toggleShortcut">, resetShortcuts: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"shortcuts/resetShortcuts">, resetCategory: import("@reduxjs/toolkit").ActionCreatorWithPayload<ShortcutCategory, "shortcuts/resetCategory">, importShortcuts: import("@reduxjs/toolkit").ActionCreatorWithPayload<KeyboardShortcut[], "shortcuts/importShortcuts">, openHelpModal: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"shortcuts/openHelpModal">, closeHelpModal: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"shortcuts/closeHelpModal">, openCustomizeModal: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"shortcuts/openCustomizeModal">, closeCustomizeModal: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"shortcuts/closeCustomizeModal">, setShortcutSearchQuery: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "shortcuts/setShortcutSearchQuery">, setSelectedCategory: import("@reduxjs/toolkit").ActionCreatorWithPayload<ShortcutCategory | "all", "shortcuts/setSelectedCategory">, clearFilters: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"shortcuts/clearFilters">;
declare const _default: import("redux").Reducer<ShortcutsState>;
export default _default;
export declare const selectShortcuts: (state: {
    shortcuts: ShortcutsState;
}) => KeyboardShortcut[];
export declare const selectShortcutsEnabled: (state: {
    shortcuts: ShortcutsState;
}) => boolean;
export declare const selectShortcutConflicts: (state: {
    shortcuts: ShortcutsState;
}) => KeyboardShortcut[][];
export declare const selectIsHelpModalOpen: (state: {
    shortcuts: ShortcutsState;
}) => boolean;
export declare const selectIsCustomizeModalOpen: (state: {
    shortcuts: ShortcutsState;
}) => boolean;
export declare const selectShortcutSearchQuery: (state: {
    shortcuts: ShortcutsState;
}) => string;
export declare const selectSelectedCategory: (state: {
    shortcuts: ShortcutsState;
}) => ShortcutCategory | "all";
export declare const selectEnabledShortcuts: (state: {
    shortcuts: ShortcutsState;
}) => KeyboardShortcut[];
export declare const selectFilteredShortcuts: (state: {
    shortcuts: ShortcutsState;
}) => KeyboardShortcut[];
export declare const selectShortcutsByCategory: (state: {
    shortcuts: ShortcutsState;
}) => Record<ShortcutCategory, KeyboardShortcut[]>;
export declare const selectShortcutById: (state: {
    shortcuts: ShortcutsState;
}, id: string) => KeyboardShortcut | undefined;
export declare const selectHasConflicts: (state: {
    shortcuts: ShortcutsState;
}) => boolean;
