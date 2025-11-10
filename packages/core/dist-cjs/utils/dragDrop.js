"use strict";
/**
 * Drag and Drop Utilities for Serenity Notes
 * Provides comprehensive drag and drop functionality for tasks, projects, and priorities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDropZoneStyles = exports.animateDropFailure = exports.animateDropSuccess = exports.updateDragPreviewPosition = exports.createDragPreview = exports.canDropItem = exports.getDropEffect = exports.calculateNewOrder = void 0;
/**
 * Calculate new order after drag and drop
 */
const calculateNewOrder = (items, dragIndex, dropIndex) => {
    const result = Array.from(items);
    const [removed] = result.splice(dragIndex, 1);
    result.splice(dropIndex, 0, removed);
    return result;
};
exports.calculateNewOrder = calculateNewOrder;
/**
 * Get drop effect based on drag item and drop zone
 */
const getDropEffect = (dragItem, dropZone, modifierKeys) => {
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
exports.getDropEffect = getDropEffect;
/**
 * Validate if drop is allowed
 */
const canDropItem = (dragItem, dropZone) => {
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
exports.canDropItem = canDropItem;
/**
 * Generate drag preview element
 */
const createDragPreview = (dragItem, sourceElement) => {
    const preview = sourceElement.cloneNode(true);
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
exports.createDragPreview = createDragPreview;
/**
 * Update drag preview position
 */
const updateDragPreviewPosition = (preview, x, y) => {
    preview.style.left = `${x + 10}px`;
    preview.style.top = `${y + 10}px`;
};
exports.updateDragPreviewPosition = updateDragPreviewPosition;
/**
 * Animate drop success
 */
const animateDropSuccess = (element, callback) => {
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
exports.animateDropSuccess = animateDropSuccess;
/**
 * Animate drop failure
 */
const animateDropFailure = (element, callback) => {
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
exports.animateDropFailure = animateDropFailure;
/**
 * Generate drop zone visual feedback
 */
const getDropZoneStyles = (dropZone, isDragOver) => {
    const baseStyles = {
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
exports.getDropZoneStyles = getDropZoneStyles;
