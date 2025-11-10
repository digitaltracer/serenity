/**
 * Drag and Drop Utilities for Serenity Notes
 * Provides comprehensive drag and drop functionality for tasks, projects, and priorities
 */

export interface DragItem {
  id: string;
  type: DragItemType;
  data: any;
  sourceIndex?: number;
  sourceContainer?: string;
}

export type DragItemType = 
  | 'task' 
  | 'subtask' 
  | 'project' 
  | 'journal-entry'
  | 'tag';

export interface DropResult {
  targetIndex: number;
  targetContainer: string;
  dropEffect: DropEffect;
}

export type DropEffect = 
  | 'move'      // Move item to new position
  | 'copy'      // Copy item to new location
  | 'link'      // Link to another item
  | 'none';     // No drop allowed

export interface DragDropState {
  isDragging: boolean;
  dragItem: DragItem | null;
  dropZones: DropZone[];
  dragPreview?: HTMLElement;
}

export interface DropZone {
  id: string;
  type: string;
  accepts: DragItemType[];
  isActive: boolean;
  isOver: boolean;
  canDrop: boolean;
}

/**
 * Drag and drop actions for different scenarios
 */
export interface DragDropActions {
  // Task operations
  reorderTasks: (taskIds: string[], newOrder: number[]) => void;
  moveTaskToProject: (taskId: string, projectId: string) => void;
  changeTaskPriority: (taskId: string, priority: 'low' | 'medium' | 'high') => void;
  scheduleTask: (taskId: string, dueDate: Date) => void;
  
  // Subtask operations
  reorderSubtasks: (parentTaskId: string, subtaskIds: string[], newOrder: number[]) => void;
  promoteSubtask: (subtaskId: string, parentTaskId: string) => void;
  
  // Project operations
  reorderProjects: (projectIds: string[], newOrder: number[]) => void;
  
  // Journal operations
  reorderJournalEntries: (entryIds: string[], newOrder: number[]) => void;
}

/**
 * Calculate new order after drag and drop
 */
export const calculateNewOrder = (
  items: any[],
  dragIndex: number,
  dropIndex: number
): any[] => {
  const result = Array.from(items);
  const [removed] = result.splice(dragIndex, 1);
  result.splice(dropIndex, 0, removed);
  return result;
};

/**
 * Get drop effect based on drag item and drop zone
 */
export const getDropEffect = (
  dragItem: DragItem,
  dropZone: DropZone,
  modifierKeys: {
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
  }
): DropEffect => {
  // Copy with Ctrl key
  if (modifierKeys.ctrlKey) {
    return 'copy';
  }
  
  // Different effects based on drop zone type
  switch (dropZone.type) {
    case 'task-list':
      return dragItem.sourceContainer === dropZone.id ? 'move' : 'move';
    case 'project-drop':
      return 'move';
    case 'priority-drop':
      return 'move';
    case 'calendar-drop':
      return 'move';
    default:
      return 'move';
  }
};

/**
 * Validate if drop is allowed
 */
export const canDropItem = (
  dragItem: DragItem,
  dropZone: DropZone
): boolean => {
  // Check if drop zone accepts this item type
  if (!dropZone.accepts.includes(dragItem.type)) {
    return false;
  }
  
  // Don't allow dropping on self
  if (dragItem.sourceContainer === dropZone.id && 
      dragItem.sourceIndex !== undefined) {
    return false;
  }
  
  // Additional validation based on item type
  switch (dragItem.type) {
    case 'subtask':
      // Subtasks can't be moved to become main tasks (for now)
      return dropZone.type === 'subtask-list';
    
    case 'task':
      // Tasks can be moved to task lists or project drops
      return ['task-list', 'project-drop', 'priority-drop', 'calendar-drop'].includes(dropZone.type);
    
    default:
      return true;
  }
};

/**
 * Generate drag preview element
 */
export const createDragPreview = (
  dragItem: DragItem,
  sourceElement: HTMLElement
): HTMLElement => {
  const preview = sourceElement.cloneNode(true) as HTMLElement;
  
  // Style the preview
  preview.style.position = 'fixed';
  preview.style.pointerEvents = 'none';
  preview.style.zIndex = '9999';
  preview.style.opacity = '0.8';
  preview.style.transform = 'rotate(2deg)';
  preview.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
  preview.style.borderRadius = '8px';
  preview.style.maxWidth = '300px';
  
  // Add dragging indicator
  const badge = document.createElement('div');
  badge.textContent = '↗️ Dragging';
  badge.style.position = 'absolute';
  badge.style.top = '-8px';
  badge.style.right = '-8px';
  badge.style.background = '#3B82F6';
  badge.style.color = 'white';
  badge.style.padding = '2px 8px';
  badge.style.borderRadius = '12px';
  badge.style.fontSize = '10px';
  badge.style.fontWeight = 'bold';
  
  preview.appendChild(badge);
  
  return preview;
};

/**
 * Update drag preview position
 */
export const updateDragPreviewPosition = (
  preview: HTMLElement,
  x: number,
  y: number
): void => {
  preview.style.left = `${x + 10}px`;
  preview.style.top = `${y + 10}px`;
};

/**
 * Animate drop success
 */
export const animateDropSuccess = (
  element: HTMLElement,
  callback?: () => void
): void => {
  element.style.transition = 'all 0.3s ease';
  element.style.transform = 'scale(1.05)';
  element.style.backgroundColor = '#10B981';
  element.style.color = 'white';
  
  setTimeout(() => {
    element.style.transform = 'scale(1)';
    element.style.backgroundColor = '';
    element.style.color = '';
    callback?.();
  }, 300);
};

/**
 * Animate drop failure
 */
export const animateDropFailure = (
  element: HTMLElement,
  callback?: () => void
): void => {
  element.style.transition = 'all 0.2s ease';
  element.style.transform = 'translateX(-10px)';
  element.style.backgroundColor = '#EF4444';
  element.style.color = 'white';
  
  setTimeout(() => {
    element.style.transform = 'translateX(10px)';
  }, 100);
  
  setTimeout(() => {
    element.style.transform = 'translateX(0)';
    element.style.backgroundColor = '';
    element.style.color = '';
    callback?.();
  }, 200);
};

/**
 * Generate drop zone visual feedback
 */
export const getDropZoneStyles = (
  dropZone: DropZone,
  isDragOver: boolean
): React.CSSProperties => {
  const baseStyles: React.CSSProperties = {
    transition: 'all 0.2s ease',
    borderRadius: '8px',
    minHeight: '40px',
  };
  
  if (!dropZone.isActive) {
    return baseStyles;
  }
  
  if (isDragOver && dropZone.canDrop) {
    return {
      ...baseStyles,
      backgroundColor: '#EFF6FF',
      border: '2px dashed #3B82F6',
      transform: 'scale(1.02)',
    };
  }
  
  if (isDragOver && !dropZone.canDrop) {
    return {
      ...baseStyles,
      backgroundColor: '#FEF2F2',
      border: '2px dashed #EF4444',
    };
  }
  
  if (dropZone.canDrop) {
    return {
      ...baseStyles,
      backgroundColor: '#F0FDF4',
      border: '1px dashed #22C55E',
    };
  }
  
  return baseStyles;
};