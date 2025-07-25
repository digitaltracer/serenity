/**
 * React Hooks for Drag and Drop Functionality
 * Provides easy-to-use hooks for implementing drag and drop in components
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  DragItem,
  DropZone,
  DropResult,
  canDropItem,
  getDropEffect,
  createDragPreview,
  updateDragPreviewPosition,
  calculateNewOrder,
} from '../utils/dragDrop';
import {
  startDrag,
  endDrag,
  registerDropZone,
  unregisterDropZone,
  setDragOver,
  handleDrop,
  handleDropFailure,
  selectIsDragging,
  selectDragItem,
  selectIsDropZoneActive,
} from '../store/slices/dragDropSlice';
import {
  reorderTasks,
  moveTaskToProject,
  changeTaskPriority,
  scheduleTask,
  reorderSubtasks,
} from '../store/slices/tasksSlice';
import { AppDispatch } from '../store/store';

/**
 * Hook for making an element draggable
 */
export const useDraggable = (
  dragItem: DragItem,
  enabled: boolean = true
) => {
  const dispatch = useDispatch<AppDispatch>();
  const dragRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragPreviewRef = useRef<HTMLElement | null>(null);

  const handleDragStart = useCallback((e: DragEvent) => {
    if (!enabled || !dragRef.current) return;

    setIsDragging(true);
    dispatch(startDrag(dragItem));

    // Create drag preview
    const preview = createDragPreview(dragItem, dragRef.current);
    document.body.appendChild(preview);
    dragPreviewRef.current = preview;

    // Hide default drag image
    if (e.dataTransfer) {
      const emptyImg = new Image();
      e.dataTransfer.setDragImage(emptyImg, 0, 0);
      e.dataTransfer.effectAllowed = 'move';
    }
  }, [dispatch, dragItem, enabled]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    dispatch(endDrag());

    // Remove drag preview
    if (dragPreviewRef.current) {
      document.body.removeChild(dragPreviewRef.current);
      dragPreviewRef.current = null;
    }
  }, [dispatch]);

  const handleDrag = useCallback((e: DragEvent) => {
    if (dragPreviewRef.current) {
      updateDragPreviewPosition(dragPreviewRef.current, e.clientX, e.clientY);
    }
  }, []);

  useEffect(() => {
    const element = dragRef.current;
    if (!element || !enabled) return;

    element.draggable = true;
    element.addEventListener('dragstart', handleDragStart);
    element.addEventListener('dragend', handleDragEnd);
    element.addEventListener('drag', handleDrag);

    return () => {
      element.draggable = false;
      element.removeEventListener('dragstart', handleDragStart);
      element.removeEventListener('dragend', handleDragEnd);
      element.removeEventListener('drag', handleDrag);
    };
  }, [enabled, handleDragStart, handleDragEnd, handleDrag]);

  return {
    dragRef,
    isDragging,
    dragProps: {
      draggable: enabled,
      style: {
        cursor: enabled ? 'grab' : 'default',
        opacity: isDragging ? 0.5 : 1,
      },
    },
  };
};

/**
 * Hook for making an element a drop zone
 */
export const useDropZone = (
  dropZone: DropZone,
  onDrop: (dragItem: DragItem, dropResult: DropResult) => void,
  enabled: boolean = true
) => {
  const dispatch = useDispatch<AppDispatch>();
  const dropRef = useRef<HTMLDivElement>(null);
  const [isOver, setIsOver] = useState(false);
  const [canDrop, setCanDrop] = useState(false);
  
  const dragItem = useSelector(selectDragItem);
  const isActive = useSelector(selectIsDropZoneActive(dropZone.id));

  // Register/unregister drop zone
  useEffect(() => {
    if (enabled) {
      dispatch(registerDropZone(dropZone));
    }
    return () => {
      dispatch(unregisterDropZone(dropZone.id));
    };
  }, [dispatch, dropZone, enabled]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    
    if (!dragItem || !enabled) return;

    const canDropHere = canDropItem(dragItem, dropZone);
    setCanDrop(canDropHere);
    
    if (canDropHere) {
      e.dataTransfer!.dropEffect = getDropEffect(
        dragItem,
        dropZone,
        {
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
        }
      );
    } else {
      e.dataTransfer!.dropEffect = 'none';
    }
  }, [dragItem, dropZone, enabled]);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsOver(true);
    dispatch(setDragOver({ dropZoneId: dropZone.id, isOver: true }));
  }, [dispatch, dropZone.id]);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    // Only set isOver to false if we're leaving the drop zone entirely
    const rect = dropRef.current?.getBoundingClientRect();
    if (rect) {
      const isOutside = (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      );
      if (isOutside) {
        setIsOver(false);
        dispatch(setDragOver({ dropZoneId: dropZone.id, isOver: false }));
      }
    }
  }, [dispatch, dropZone.id]);

  const handleDropEvent = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    dispatch(setDragOver({ dropZoneId: dropZone.id, isOver: false }));

    if (!dragItem || !canDrop || !enabled) return;

    const dropResult: DropResult = {
      targetIndex: 0, // Will be set by specific implementations
      targetContainer: dropZone.id,
      dropEffect: getDropEffect(
        dragItem,
        dropZone,
        {
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
        }
      ),
    };

    try {
      if (onDrop) {
        onDrop(dragItem, dropResult);
      }
      dispatch(handleDrop(dropResult));
    } catch (error) {
      dispatch(handleDropFailure(error instanceof Error ? error.message : 'Drop failed'));
    }
  }, [dispatch, dragItem, dropZone, canDrop, enabled, onDrop]);

  useEffect(() => {
    const element = dropRef.current;
    if (!element || !enabled) return;

    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('dragenter', handleDragEnter);
    element.addEventListener('dragleave', handleDragLeave);
    element.addEventListener('drop', handleDropEvent);

    return () => {
      element.removeEventListener('dragover', handleDragOver);
      element.removeEventListener('dragenter', handleDragEnter);
      element.removeEventListener('dragleave', handleDragLeave);
      element.removeEventListener('drop', handleDropEvent);
    };
  }, [handleDragOver, handleDragEnter, handleDragLeave, handleDropEvent, enabled]);

  return {
    dropRef,
    isOver,
    canDrop,
    isActive,
    dropProps: {
      style: {
        backgroundColor: isOver && canDrop ? '#EFF6FF' : 
                        isOver && !canDrop ? '#FEF2F2' :
                        isActive && canDrop ? '#F0FDF4' : 'transparent',
        border: isOver && canDrop ? '2px dashed #3B82F6' :
                isOver && !canDrop ? '2px dashed #EF4444' :
                isActive && canDrop ? '1px dashed #22C55E' : '1px solid transparent',
        borderRadius: '8px',
        transition: 'all 0.2s ease',
      },
    },
  };
};

/**
 * Hook for task-specific drag and drop operations
 */
export const useTaskDragDrop = () => {
  const dispatch = useDispatch<AppDispatch>();

  const handleTaskDrop = useCallback((dragItem: DragItem, dropResult: DropResult) => {
    if (dragItem.type !== 'task') return;

    // Determine action based on target container
    if (dropResult.targetContainer.startsWith('project-')) {
      // Move task to different project
      const projectId = dropResult.targetContainer.replace('project-', '');
      dispatch(moveTaskToProject({
        taskId: dragItem.id,
        projectId: projectId === 'none' ? undefined : projectId,
      }));
    } else if (dropResult.targetContainer.startsWith('priority-')) {
      // Change task priority
      const priority = dropResult.targetContainer.replace('priority-', '') as 'low' | 'medium' | 'high';
      dispatch(changeTaskPriority({
        taskId: dragItem.id,
        priority,
      }));
    } else if (dropResult.targetContainer.startsWith('calendar-')) {
      // Schedule task (would need date from drop zone)
      // This would be handled by calendar components
    } else if (dragItem.sourceContainer === dropResult.targetContainer) {
      // Handle task reordering within the same container
      if (dragItem.sourceIndex !== undefined && dropResult.targetIndex !== undefined) {
        // This would need more context from the calling component
        // For now, we'll let the component handle the specific reordering
      }
    }
  }, [dispatch]);

  const handleSubtaskDrop = useCallback((dragItem: DragItem, dropResult: DropResult) => {
    if (dragItem.type !== 'subtask') return;

    // Handle subtask reordering within the same parent task
    if (dragItem.sourceContainer === dropResult.targetContainer) {
      const parentTaskId = dragItem.data.parentTaskId;
      if (parentTaskId && dragItem.sourceIndex !== undefined && dropResult.targetIndex !== undefined) {
        // This would need the full list of subtask IDs from the component
        // For now, we'll let the component handle the specific reordering
      }
    }
  }, [dispatch]);

  return {
    handleTaskDrop,
    handleSubtaskDrop,
    // Helper functions for creating drag items
    createTaskDragItem: (task: any, sourceIndex?: number, sourceContainer?: string): DragItem => ({
      id: task.id,
      type: 'task',
      data: task,
      sourceIndex,
      sourceContainer,
    }),
    createSubtaskDragItem: (subtask: any, parentTaskId: string, sourceIndex?: number): DragItem => ({
      id: subtask.id,
      type: 'subtask',
      data: { ...subtask, parentTaskId },
      sourceIndex,
      sourceContainer: `subtasks-${parentTaskId}`,
    }),
  };
};

/**
 * Hook for project drop zones
 */
export const useProjectDropZone = (projectId: string) => {
  const { handleTaskDrop } = useTaskDragDrop();

  const dropZone: DropZone = {
    id: `project-${projectId}`,
    type: 'project-drop',
    accepts: ['task'],
    isActive: false,
    isOver: false,
    canDrop: true,
  };

  return useDropZone(dropZone, handleTaskDrop);
};

/**
 * Hook for priority drop zones
 */
export const usePriorityDropZone = (priority: 'low' | 'medium' | 'high') => {
  const { handleTaskDrop } = useTaskDragDrop();

  const dropZone: DropZone = {
    id: `priority-${priority}`,
    type: 'priority-drop',
    accepts: ['task'],
    isActive: false,
    isOver: false,
    canDrop: true,
  };

  return useDropZone(dropZone, handleTaskDrop);
};