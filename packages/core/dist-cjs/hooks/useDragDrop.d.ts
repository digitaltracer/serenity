/**
 * React Hooks for Drag and Drop Functionality
 * Provides easy-to-use hooks for implementing drag and drop in components
 */
import { DragItem, DropZone, DropResult } from '../utils/dragDrop';
/**
 * Hook for making an element draggable
 */
export declare const useDraggable: (dragItem: DragItem, enabled?: boolean) => {
    dragRef: import("react").RefObject<HTMLDivElement>;
    isDragging: boolean;
    dragProps: {
        draggable: boolean;
        style: {
            cursor: string;
            opacity: number;
        };
    };
};
/**
 * Hook for making an element a drop zone
 */
export declare const useDropZone: (dropZone: DropZone, onDrop: (dragItem: DragItem, dropResult: DropResult) => void, enabled?: boolean) => {
    dropRef: import("react").RefObject<HTMLDivElement>;
    isOver: boolean;
    canDrop: boolean;
    isActive: boolean;
    dropProps: {
        style: {
            backgroundColor: string;
            border: string;
            borderRadius: string;
            transition: string;
        };
    };
};
/**
 * Hook for task-specific drag and drop operations
 */
export declare const useTaskDragDrop: () => {
    handleTaskDrop: (dragItem: DragItem, dropResult: DropResult) => void;
    handleSubtaskDrop: (dragItem: DragItem, dropResult: DropResult) => void;
    createTaskDragItem: (task: any, sourceIndex?: number, sourceContainer?: string) => DragItem;
    createSubtaskDragItem: (subtask: any, parentTaskId: string, sourceIndex?: number) => DragItem;
};
/**
 * Hook for project drop zones
 */
export declare const useProjectDropZone: (projectId: string) => {
    dropRef: import("react").RefObject<HTMLDivElement>;
    isOver: boolean;
    canDrop: boolean;
    isActive: boolean;
    dropProps: {
        style: {
            backgroundColor: string;
            border: string;
            borderRadius: string;
            transition: string;
        };
    };
};
/**
 * Hook for priority drop zones
 */
export declare const usePriorityDropZone: (priority: "low" | "medium" | "high") => {
    dropRef: import("react").RefObject<HTMLDivElement>;
    isOver: boolean;
    canDrop: boolean;
    isActive: boolean;
    dropProps: {
        style: {
            backgroundColor: string;
            border: string;
            borderRadius: string;
            transition: string;
        };
    };
};
