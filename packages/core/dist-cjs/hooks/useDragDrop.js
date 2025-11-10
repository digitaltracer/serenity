"use strict";
/**
 * React Hooks for Drag and Drop Functionality
 * Provides easy-to-use hooks for implementing drag and drop in components
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePriorityDropZone = exports.useProjectDropZone = exports.useTaskDragDrop = exports.useDropZone = exports.useDraggable = void 0;
const react_1 = require("react");
const react_redux_1 = require("react-redux");
const dragDrop_1 = require("../utils/dragDrop");
const dragDropSlice_1 = require("../store/slices/dragDropSlice");
const tasksSlice_1 = require("../store/slices/tasksSlice");
/**
 * Hook for making an element draggable
 */
const useDraggable = (dragItem, enabled = true) => {
    const dispatch = (0, react_redux_1.useDispatch)();
    const dragRef = (0, react_1.useRef)(null);
    const [isDragging, setIsDragging] = (0, react_1.useState)(false);
    const dragPreviewRef = (0, react_1.useRef)(null);
    const handleDragStart = (0, react_1.useCallback)((e) => {
        if (!enabled || !dragRef.current)
            return;
        setIsDragging(true);
        dispatch((0, dragDropSlice_1.startDrag)(dragItem));
        // Create drag preview
        const preview = (0, dragDrop_1.createDragPreview)(dragItem, dragRef.current);
        document.body.appendChild(preview);
        dragPreviewRef.current = preview;
        // Hide default drag image
        if (e.dataTransfer) {
            const emptyImg = new Image();
            e.dataTransfer.setDragImage(emptyImg, 0, 0);
            e.dataTransfer.effectAllowed = 'move';
        }
    }, [dispatch, dragItem, enabled]);
    const handleDragEnd = (0, react_1.useCallback)(() => {
        setIsDragging(false);
        dispatch((0, dragDropSlice_1.endDrag)());
        // Remove drag preview
        if (dragPreviewRef.current) {
            document.body.removeChild(dragPreviewRef.current);
            dragPreviewRef.current = null;
        }
    }, [dispatch]);
    const handleDrag = (0, react_1.useCallback)((e) => {
        if (dragPreviewRef.current) {
            (0, dragDrop_1.updateDragPreviewPosition)(dragPreviewRef.current, e.clientX, e.clientY);
        }
    }, []);
    (0, react_1.useEffect)(() => {
        const element = dragRef.current;
        if (!element || !enabled)
            return;
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
exports.useDraggable = useDraggable;
/**
 * Hook for making an element a drop zone
 */
const useDropZone = (dropZone, onDrop, enabled = true) => {
    const dispatch = (0, react_redux_1.useDispatch)();
    const dropRef = (0, react_1.useRef)(null);
    const [isOver, setIsOver] = (0, react_1.useState)(false);
    const [canDrop, setCanDrop] = (0, react_1.useState)(false);
    const dragItem = (0, react_redux_1.useSelector)(dragDropSlice_1.selectDragItem);
    const isActive = (0, react_redux_1.useSelector)((0, dragDropSlice_1.selectIsDropZoneActive)(dropZone.id));
    // Register/unregister drop zone
    (0, react_1.useEffect)(() => {
        if (enabled) {
            dispatch((0, dragDropSlice_1.registerDropZone)(dropZone));
        }
        return () => {
            dispatch((0, dragDropSlice_1.unregisterDropZone)(dropZone.id));
        };
    }, [dispatch, dropZone, enabled]);
    const handleDragOver = (0, react_1.useCallback)((e) => {
        e.preventDefault();
        if (!dragItem || !enabled)
            return;
        const canDropHere = (0, dragDrop_1.canDropItem)(dragItem, dropZone);
        setCanDrop(canDropHere);
        if (canDropHere) {
            e.dataTransfer.dropEffect = (0, dragDrop_1.getDropEffect)(dragItem, dropZone, {
                ctrlKey: e.ctrlKey,
                shiftKey: e.shiftKey,
                altKey: e.altKey,
            });
        }
        else {
            e.dataTransfer.dropEffect = 'none';
        }
    }, [dragItem, dropZone, enabled]);
    const handleDragEnter = (0, react_1.useCallback)((e) => {
        e.preventDefault();
        setIsOver(true);
        dispatch((0, dragDropSlice_1.setDragOver)({ dropZoneId: dropZone.id, isOver: true }));
    }, [dispatch, dropZone.id]);
    const handleDragLeave = (0, react_1.useCallback)((e) => {
        e.preventDefault();
        // Only set isOver to false if we're leaving the drop zone entirely
        const rect = dropRef.current?.getBoundingClientRect();
        if (rect) {
            const isOutside = (e.clientX < rect.left ||
                e.clientX > rect.right ||
                e.clientY < rect.top ||
                e.clientY > rect.bottom);
            if (isOutside) {
                setIsOver(false);
                dispatch((0, dragDropSlice_1.setDragOver)({ dropZoneId: dropZone.id, isOver: false }));
            }
        }
    }, [dispatch, dropZone.id]);
    const handleDropEvent = (0, react_1.useCallback)((e) => {
        e.preventDefault();
        setIsOver(false);
        dispatch((0, dragDropSlice_1.setDragOver)({ dropZoneId: dropZone.id, isOver: false }));
        if (!dragItem || !canDrop || !enabled)
            return;
        const dropResult = {
            targetIndex: 0, // Will be set by specific implementations
            targetContainer: dropZone.id,
            dropEffect: (0, dragDrop_1.getDropEffect)(dragItem, dropZone, {
                ctrlKey: e.ctrlKey,
                shiftKey: e.shiftKey,
                altKey: e.altKey,
            }),
        };
        try {
            if (onDrop) {
                onDrop(dragItem, dropResult);
            }
            dispatch((0, dragDropSlice_1.handleDrop)(dropResult));
        }
        catch (error) {
            dispatch((0, dragDropSlice_1.handleDropFailure)(error instanceof Error ? error.message : 'Drop failed'));
        }
    }, [dispatch, dragItem, dropZone, canDrop, enabled, onDrop]);
    (0, react_1.useEffect)(() => {
        const element = dropRef.current;
        if (!element || !enabled)
            return;
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
exports.useDropZone = useDropZone;
/**
 * Hook for task-specific drag and drop operations
 */
const useTaskDragDrop = () => {
    const dispatch = (0, react_redux_1.useDispatch)();
    const handleTaskDrop = (0, react_1.useCallback)((dragItem, dropResult) => {
        if (dragItem.type !== 'task')
            return;
        // Determine action based on target container
        if (dropResult.targetContainer.startsWith('project-')) {
            // Move task to different project
            const projectId = dropResult.targetContainer.replace('project-', '');
            dispatch((0, tasksSlice_1.moveTaskToProject)({
                taskId: dragItem.id,
                projectId: projectId === 'none' ? undefined : projectId,
            }));
        }
        else if (dropResult.targetContainer.startsWith('priority-')) {
            // Change task priority
            const priority = dropResult.targetContainer.replace('priority-', '');
            dispatch((0, tasksSlice_1.changeTaskPriority)({
                taskId: dragItem.id,
                priority,
            }));
        }
        else if (dropResult.targetContainer.startsWith('calendar-')) {
            // Schedule task (would need date from drop zone)
            // This would be handled by calendar components
        }
        else if (dragItem.sourceContainer === dropResult.targetContainer) {
            // Handle task reordering within the same container
            if (dragItem.sourceIndex !== undefined && dropResult.targetIndex !== undefined) {
                // This would need more context from the calling component
                // For now, we'll let the component handle the specific reordering
            }
        }
    }, [dispatch]);
    const handleSubtaskDrop = (0, react_1.useCallback)((dragItem, dropResult) => {
        if (dragItem.type !== 'subtask')
            return;
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
        createTaskDragItem: (task, sourceIndex, sourceContainer) => ({
            id: task.id,
            type: 'task',
            data: task,
            sourceIndex,
            sourceContainer,
        }),
        createSubtaskDragItem: (subtask, parentTaskId, sourceIndex) => ({
            id: subtask.id,
            type: 'subtask',
            data: { ...subtask, parentTaskId },
            sourceIndex,
            sourceContainer: `subtasks-${parentTaskId}`,
        }),
    };
};
exports.useTaskDragDrop = useTaskDragDrop;
/**
 * Hook for project drop zones
 */
const useProjectDropZone = (projectId) => {
    const { handleTaskDrop } = (0, exports.useTaskDragDrop)();
    const dropZone = {
        id: `project-${projectId}`,
        type: 'project-drop',
        accepts: ['task'],
        isActive: false,
        isOver: false,
        canDrop: true,
    };
    return (0, exports.useDropZone)(dropZone, handleTaskDrop);
};
exports.useProjectDropZone = useProjectDropZone;
/**
 * Hook for priority drop zones
 */
const usePriorityDropZone = (priority) => {
    const { handleTaskDrop } = (0, exports.useTaskDragDrop)();
    const dropZone = {
        id: `priority-${priority}`,
        type: 'priority-drop',
        accepts: ['task'],
        isActive: false,
        isOver: false,
        canDrop: true,
    };
    return (0, exports.useDropZone)(dropZone, handleTaskDrop);
};
exports.usePriorityDropZone = usePriorityDropZone;
