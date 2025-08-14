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
export type DragItemType = 'task' | 'subtask' | 'project' | 'journal-entry' | 'tag';
export interface DropResult {
    targetIndex: number;
    targetContainer: string;
    dropEffect: DropEffect;
}
export type DropEffect = 'move' | 'copy' | 'link' | 'none';
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
    reorderTasks: (taskIds: string[], newOrder: number[]) => void;
    moveTaskToProject: (taskId: string, projectId: string) => void;
    changeTaskPriority: (taskId: string, priority: 'low' | 'medium' | 'high') => void;
    scheduleTask: (taskId: string, dueDate: Date) => void;
    reorderSubtasks: (parentTaskId: string, subtaskIds: string[], newOrder: number[]) => void;
    promoteSubtask: (subtaskId: string, parentTaskId: string) => void;
    reorderProjects: (projectIds: string[], newOrder: number[]) => void;
    reorderJournalEntries: (entryIds: string[], newOrder: number[]) => void;
}
/**
 * Calculate new order after drag and drop
 */
export declare const calculateNewOrder: (items: any[], dragIndex: number, dropIndex: number) => any[];
/**
 * Get drop effect based on drag item and drop zone
 */
export declare const getDropEffect: (dragItem: DragItem, dropZone: DropZone, modifierKeys: {
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
}) => DropEffect;
/**
 * Validate if drop is allowed
 */
export declare const canDropItem: (dragItem: DragItem, dropZone: DropZone) => boolean;
/**
 * Generate drag preview element
 */
export declare const createDragPreview: (dragItem: DragItem, sourceElement: HTMLElement) => HTMLElement;
/**
 * Update drag preview position
 */
export declare const updateDragPreviewPosition: (preview: HTMLElement, x: number, y: number) => void;
/**
 * Animate drop success
 */
export declare const animateDropSuccess: (element: HTMLElement, callback?: () => void) => void;
/**
 * Animate drop failure
 */
export declare const animateDropFailure: (element: HTMLElement, callback?: () => void) => void;
/**
 * Generate drop zone visual feedback
 */
export declare const getDropZoneStyles: (dropZone: DropZone, isDragOver: boolean) => React.CSSProperties;
//# sourceMappingURL=dragDrop.d.ts.map