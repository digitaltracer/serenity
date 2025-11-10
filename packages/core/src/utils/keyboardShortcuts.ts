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
  isGlobal?: boolean; // Available across all contexts
}

export interface KeyModifiers {
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean; // Cmd on Mac, Windows key on PC
}

export type ShortcutCategory = 
  | 'general'
  | 'tasks' 
  | 'journal'
  | 'navigation'
  | 'ui'
  | 'projects'
  | 'search';

export interface ShortcutContext {
  page?: string;
  modal?: string;
  focus?: string;
}

// Default keyboard shortcuts configuration
export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  // General shortcuts
  {
    id: 'quick-add-task',
    key: 'n',
    modifiers: { meta: true },
    description: 'Quick add new task',
    category: 'general',
    action: 'QUICK_ADD_TASK',
    enabled: true,
    isGlobal: true,
  },
  {
    id: 'quick-add-journal',
    key: 'j',
    modifiers: { meta: true },
    description: 'Quick add journal entry',
    category: 'general',
    action: 'QUICK_ADD_JOURNAL',
    enabled: true,
    isGlobal: true,
  },
  {
    id: 'global-search',
    key: 'k',
    modifiers: { meta: true },
    description: 'Open global search',
    category: 'search',
    action: 'OPEN_GLOBAL_SEARCH',
    enabled: true,
    isGlobal: true,
  },
  {
    id: 'command-palette',
    key: 'p',
    modifiers: { meta: true, shift: true },
    description: 'Open command palette',
    category: 'general',
    action: 'OPEN_COMMAND_PALETTE',
    enabled: true,
    isGlobal: true,
  },

  // Navigation shortcuts
  {
    id: 'nav-home',
    key: '1',
    modifiers: { meta: true },
    description: 'Go to Home',
    category: 'navigation',
    action: 'NAVIGATE_HOME',
    enabled: true,
    isGlobal: true,
  },
  {
    id: 'nav-actionhub',
    key: '2',
    modifiers: { meta: true },
    description: 'Go to ActionHub',
    category: 'navigation',
    action: 'NAVIGATE_ACTIONHUB',
    enabled: true,
    isGlobal: true,
  },
  {
    id: 'nav-journal',
    key: '3',
    modifiers: { meta: true },
    description: 'Go to Journal',
    category: 'navigation',
    action: 'NAVIGATE_JOURNAL',
    enabled: true,
    isGlobal: true,
  },
  {
    id: 'nav-analytics',
    key: '4',
    modifiers: { meta: true },
    description: 'Go to Analytics',
    category: 'navigation',
    action: 'NAVIGATE_ANALYTICS',
    enabled: true,
    isGlobal: true,
  },
  {
    id: 'nav-settings',
    key: '5',
    modifiers: { meta: true },
    description: 'Go to Settings',
    category: 'navigation',
    action: 'NAVIGATE_SETTINGS',
    enabled: true,
    isGlobal: true,
  },

  // Task shortcuts
  {
    id: 'task-complete-selected',
    key: 'Enter',
    modifiers: {},
    description: 'Complete selected task',
    category: 'tasks',
    action: 'COMPLETE_SELECTED_TASK',
    enabled: true,
  },
  {
    id: 'task-delete-selected',
    key: 'Delete',
    modifiers: {},
    description: 'Delete selected task',
    category: 'tasks',
    action: 'DELETE_SELECTED_TASK',
    enabled: true,
  },
  {
    id: 'task-edit-selected',
    key: 'e',
    modifiers: {},
    description: 'Edit selected task',
    category: 'tasks',
    action: 'EDIT_SELECTED_TASK',
    enabled: true,
  },
  {
    id: 'task-duplicate-selected',
    key: 'd',
    modifiers: { ctrl: true },
    description: 'Duplicate selected task',
    category: 'tasks',
    action: 'DUPLICATE_SELECTED_TASK',
    enabled: true,
  },
  {
    id: 'task-priority-high',
    key: '!',
    modifiers: { shift: true },
    description: 'Set task priority to high',
    category: 'tasks',
    action: 'SET_TASK_PRIORITY_HIGH',
    enabled: true,
  },
  {
    id: 'task-priority-medium',
    key: '@',
    modifiers: { shift: true },
    description: 'Set task priority to medium',
    category: 'tasks',
    action: 'SET_TASK_PRIORITY_MEDIUM',
    enabled: true,
  },
  {
    id: 'task-priority-low',
    key: '#',
    modifiers: { shift: true },
    description: 'Set task priority to low',
    category: 'tasks',
    action: 'SET_TASK_PRIORITY_LOW',
    enabled: true,
  },

  // UI shortcuts
  {
    id: 'toggle-sidebar',
    key: 'b',
    modifiers: { meta: true },
    description: 'Toggle sidebar',
    category: 'ui',
    action: 'TOGGLE_SIDEBAR',
    enabled: true,
    isGlobal: true,
  },
  {
    id: 'toggle-theme',
    key: 't',
    modifiers: { meta: true, shift: true },
    description: 'Toggle theme (light/dark)',
    category: 'ui',
    action: 'TOGGLE_THEME',
    enabled: true,
    isGlobal: true,
  },
  {
    id: 'toggle-compact-mode',
    key: 'c',
    modifiers: { meta: true, shift: true },
    description: 'Toggle compact mode',
    category: 'ui',
    action: 'TOGGLE_COMPACT_MODE',
    enabled: true,
    isGlobal: true,
  },
  {
    id: 'focus-search',
    key: 'f',
    modifiers: { meta: true },
    description: 'Focus search field',
    category: 'search',
    action: 'FOCUS_SEARCH',
    enabled: true,
    isGlobal: true,
  },

  // Journal shortcuts
  {
    id: 'journal-pin-selected',
    key: 'p',
    modifiers: {},
    description: 'Pin/unpin selected journal entry',
    category: 'journal',
    action: 'TOGGLE_PIN_JOURNAL',
    enabled: true,
  },
  {
    id: 'journal-delete-selected',
    key: 'Delete',
    modifiers: {},
    description: 'Delete selected journal entry',
    category: 'journal',
    action: 'DELETE_SELECTED_JOURNAL',
    enabled: true,
  },

  // Project shortcuts
  {
    id: 'project-create',
    key: 'p',
    modifiers: { meta: true, shift: true },
    description: 'Create new project',
    category: 'projects',
    action: 'CREATE_PROJECT',
    enabled: true,
    isGlobal: true,
  },

  // Selection and bulk operations
  {
    id: 'select-all',
    key: 'a',
    modifiers: { ctrl: true },
    description: 'Select all items',
    category: 'general',
    action: 'SELECT_ALL',
    enabled: true,
  },
  {
    id: 'select-none',
    key: 'Escape',
    modifiers: {},
    description: 'Clear selection',
    category: 'general',
    action: 'SELECT_NONE',
    enabled: true,
  },
  {
    id: 'bulk-complete',
    key: 'Enter',
    modifiers: { ctrl: true },
    description: 'Complete selected items',
    category: 'tasks',
    action: 'BULK_COMPLETE',
    enabled: true,
  },
  {
    id: 'bulk-delete',
    key: 'Delete',
    modifiers: { ctrl: true },
    description: 'Delete selected items',
    category: 'general',
    action: 'BULK_DELETE',
    enabled: true,
  },

  // Modal and overlay shortcuts
  {
    id: 'close-modal',
    key: 'Escape',
    modifiers: {},
    description: 'Close current modal/overlay',
    category: 'ui',
    action: 'CLOSE_MODAL',
    enabled: true,
    isGlobal: true,
  },
  {
    id: 'save-and-close',
    key: 'Enter',
    modifiers: { ctrl: true },
    description: 'Save and close modal',
    category: 'ui',
    action: 'SAVE_AND_CLOSE',
    enabled: true,
  },

  // Arrow key navigation
  {
    id: 'navigate-up',
    key: 'ArrowUp',
    modifiers: {},
    description: 'Navigate up in lists',
    category: 'navigation',
    action: 'NAVIGATE_UP',
    enabled: true,
  },
  {
    id: 'navigate-down',
    key: 'ArrowDown',
    modifiers: {},
    description: 'Navigate down in lists',
    category: 'navigation',
    action: 'NAVIGATE_DOWN',
    enabled: true,
  },
  {
    id: 'navigate-left',
    key: 'ArrowLeft',
    modifiers: {},
    description: 'Navigate left',
    category: 'navigation',
    action: 'NAVIGATE_LEFT',
    enabled: true,
  },
  {
    id: 'navigate-right',
    key: 'ArrowRight',
    modifiers: {},
    description: 'Navigate right',
    category: 'navigation',
    action: 'NAVIGATE_RIGHT',
    enabled: true,
  },

  // Help and reference
  {
    id: 'show-shortcuts',
    key: '?',
    modifiers: { shift: true },
    description: 'Show keyboard shortcuts help',
    category: 'general',
    action: 'SHOW_SHORTCUTS_HELP',
    enabled: true,
    isGlobal: true,
  },
];

/**
 * Check if the current platform is Mac
 */
export const isMac = (): boolean => {
  return typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
};

/**
 * Convert keyboard shortcut to display string
 */
export const formatShortcut = (shortcut: KeyboardShortcut): string => {
  const parts: string[] = [];
  const mac = isMac();
  
  if (shortcut.modifiers.ctrl) {
    parts.push(mac ? '⌘' : 'Ctrl');
  }
  if (shortcut.modifiers.shift) {
    parts.push(mac ? '⇧' : 'Shift');
  }
  if (shortcut.modifiers.alt) {
    parts.push(mac ? '⌥' : 'Alt');
  }
  if (shortcut.modifiers.meta) {
    parts.push(mac ? '⌘' : 'Win');
  }
  
  // Format the key
  let key = shortcut.key;
  const keyMappings: Record<string, string> = {
    'ArrowUp': mac ? '↑' : '↑',
    'ArrowDown': mac ? '↓' : '↓',
    'ArrowLeft': mac ? '←' : '←',
    'ArrowRight': mac ? '→' : '→',
    'Enter': mac ? '↵' : 'Enter',
    'Escape': mac ? '⎋' : 'Esc',
    'Delete': mac ? '⌫' : 'Del',
    'Backspace': mac ? '⌫' : 'Backspace',
    'Tab': mac ? '⇥' : 'Tab',
    ' ': 'Space',
  };
  
  if (keyMappings[key]) {
    key = keyMappings[key];
  } else {
    key = key.toUpperCase();
  }
  
  parts.push(key);
  
  return parts.join(mac ? '' : '+');
};

/**
 * Check if a keyboard event matches a shortcut
 */
export const matchesShortcut = (event: KeyboardEvent, shortcut: KeyboardShortcut): boolean => {
  // Check modifiers - need to match exactly what's expected
  const expectedCtrl = shortcut.modifiers.ctrl || false;
  const expectedShift = shortcut.modifiers.shift || false;
  const expectedAlt = shortcut.modifiers.alt || false;
  const expectedMeta = shortcut.modifiers.meta || false;
  
  // Handle cross-platform ctrl/cmd key mapping
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  let actualCtrl, actualMeta;
  
  if (isMac && expectedCtrl && !expectedMeta) {
    // On Mac, for Ctrl shortcuts, accept either Ctrl or Cmd
    actualCtrl = event.ctrlKey || event.metaKey;
    actualMeta = false; // Don't check meta separately when it's being used as Ctrl
  } else if (expectedMeta && !expectedCtrl) {
    // Cross-platform meta key handling: 
    // On Mac, meta means Command key (metaKey)
    // On Windows/Linux, meta means Windows key, but for shortcuts we want Ctrl behavior
    if (isMac) {
      actualMeta = event.metaKey;
      actualCtrl = event.ctrlKey;
    } else {
      // On Windows/Linux, treat meta shortcuts as Ctrl shortcuts for usability
      actualMeta = event.ctrlKey;  // Ctrl key acts as meta key
      actualCtrl = false;  // Don't check ctrl separately since we're using it as meta
    }
  } else {
    // Normal behavior: check keys as-is
    actualCtrl = event.ctrlKey;
    actualMeta = event.metaKey;
  }
  
  const actualShift = event.shiftKey;
  const actualAlt = event.altKey;
  
  // All modifiers must match exactly
  const ctrlMatch = expectedCtrl === actualCtrl;
  const shiftMatch = expectedShift === actualShift;
  const altMatch = expectedAlt === actualAlt;
  const metaMatch = expectedMeta === actualMeta;
  
  // Check key
  let keyMatch = false;
  if (shortcut.key.length === 1) {
    // Single character key
    keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
  } else {
    // Special key (Enter, Escape, etc.)
    keyMatch = event.key === shortcut.key || event.code === shortcut.key;
  }
  
  return ctrlMatch && shiftMatch && altMatch && metaMatch && keyMatch;
};

/**
 * Get shortcuts by category
 */
export const getShortcutsByCategory = (
  shortcuts: KeyboardShortcut[],
  category: ShortcutCategory
): KeyboardShortcut[] => {
  return shortcuts.filter(shortcut => shortcut.category === category && shortcut.enabled);
};

/**
 * Get all enabled shortcuts
 */
export const getEnabledShortcuts = (shortcuts: KeyboardShortcut[]): KeyboardShortcut[] => {
  return shortcuts.filter(shortcut => shortcut.enabled);
};

/**
 * Get global shortcuts (available in all contexts)
 */
export const getGlobalShortcuts = (shortcuts: KeyboardShortcut[]): KeyboardShortcut[] => {
  return shortcuts.filter(shortcut => shortcut.isGlobal && shortcut.enabled);
};

/**
 * Find shortcut by ID
 */
export const findShortcutById = (
  shortcuts: KeyboardShortcut[],
  id: string
): KeyboardShortcut | undefined => {
  return shortcuts.find(shortcut => shortcut.id === id);
};

/**
 * Check if element should ignore keyboard shortcuts
 */
export const shouldIgnoreShortcuts = (target: EventTarget | null): boolean => {
  if (!target || !(target instanceof Element)) {
    return false;
  }
  
  const tagName = target.tagName.toLowerCase();
  const contentEditable = target.getAttribute('contenteditable');
  
  // Ignore shortcuts when typing in inputs, textareas, or contenteditable elements
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    contentEditable === 'true' ||
    contentEditable === ''
  );
};

/**
 * Get shortcut conflicts (same key combination)
 */
export const getShortcutConflicts = (shortcuts: KeyboardShortcut[]): KeyboardShortcut[][] => {
  const conflicts: KeyboardShortcut[][] = [];
  const processed = new Set<string>();
  
  for (const shortcut of shortcuts) {
    if (processed.has(shortcut.id)) continue;
    
    const conflicting = shortcuts.filter(s => 
      s.id !== shortcut.id &&
      s.key === shortcut.key &&
      JSON.stringify(s.modifiers) === JSON.stringify(shortcut.modifiers)
    );
    
    if (conflicting.length > 0) {
      const group = [shortcut, ...conflicting];
      conflicts.push(group);
      group.forEach(s => processed.add(s.id));
    }
  }
  
  return conflicts;
};