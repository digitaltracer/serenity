"use strict";
/**
 * Drag and Drop State Management
 * Manages drag and drop operations across the application
 */
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectIsDraggingType = exports.selectIsDropZoneActive = exports.selectActiveDropZones = exports.selectLastDropResult = exports.selectDropFeedback = exports.selectIsAnimating = exports.selectDropZones = exports.selectDragItem = exports.selectIsDragging = exports.updateDropZonesForDragItem = exports.clearDropFeedback = exports.handleDropFailure = exports.handleDrop = exports.setDragOver = exports.updateDropZone = exports.unregisterDropZone = exports.registerDropZone = exports.endDrag = exports.startDrag = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const initialState = {
    isDragging: false,
    dragItem: null,
    dropZones: [],
    isAnimating: false,
    lastDropResult: null,
    dropFeedback: {
        show: false,
        message: '',
        type: 'info',
    },
};
const dragDropSlice = (0, toolkit_1.createSlice)({
    name: 'dragDrop',
    initialState,
    reducers: {
        // Start dragging
        startDrag: (state, action) => {
            state.isDragging = true;
            state.dragItem = action.payload;
            state.dropFeedback.show = false;
        },
        // End dragging
        endDrag: (state) => {
            state.isDragging = false;
            state.dragItem = null;
            state.dropZones = [];
        },
        // Register a drop zone
        registerDropZone: (state, action) => {
            const existingIndex = state.dropZones.findIndex(zone => zone.id === action.payload.id);
            if (existingIndex >= 0) {
                state.dropZones[existingIndex] = action.payload;
            }
            else {
                state.dropZones.push(action.payload);
            }
        },
        // Unregister a drop zone
        unregisterDropZone: (state, action) => {
            state.dropZones = state.dropZones.filter(zone => zone.id !== action.payload);
        },
        // Update drop zone state
        updateDropZone: (state, action) => {
            const zone = state.dropZones.find(z => z.id === action.payload.id);
            if (zone) {
                Object.assign(zone, action.payload.updates);
            }
        },
        // Set drag over state for a drop zone
        setDragOver: (state, action) => {
            const zone = state.dropZones.find(z => z.id === action.payload.dropZoneId);
            if (zone) {
                zone.isOver = action.payload.isOver;
            }
        },
        // Handle drop operation
        handleDrop: (state, action) => {
            state.lastDropResult = action.payload;
            state.isAnimating = true;
            // Show success feedback
            state.dropFeedback = {
                show: true,
                message: `Item ${action.payload.dropEffect}d successfully`,
                type: 'success',
            };
        },
        // Handle drop failure
        handleDropFailure: (state, action) => {
            state.dropFeedback = {
                show: true,
                message: action.payload,
                type: 'error',
            };
        },
        // Clear drop feedback
        clearDropFeedback: (state) => {
            state.dropFeedback.show = false;
            state.isAnimating = false;
        },
        // Update all drop zones based on current drag item
        updateDropZonesForDragItem: (state) => {
            if (!state.dragItem)
                return;
            state.dropZones.forEach(zone => {
                // Update canDrop based on drag item
                zone.canDrop = zone.accepts.includes(state.dragItem.type);
                // Activate drop zones that can accept the item
                zone.isActive = zone.canDrop;
            });
        },
    },
});
_a = dragDropSlice.actions, exports.startDrag = _a.startDrag, exports.endDrag = _a.endDrag, exports.registerDropZone = _a.registerDropZone, exports.unregisterDropZone = _a.unregisterDropZone, exports.updateDropZone = _a.updateDropZone, exports.setDragOver = _a.setDragOver, exports.handleDrop = _a.handleDrop, exports.handleDropFailure = _a.handleDropFailure, exports.clearDropFeedback = _a.clearDropFeedback, exports.updateDropZonesForDragItem = _a.updateDropZonesForDragItem;
// Selectors
const selectIsDragging = (state) => state.dragDrop.isDragging;
exports.selectIsDragging = selectIsDragging;
const selectDragItem = (state) => state.dragDrop.dragItem;
exports.selectDragItem = selectDragItem;
const selectDropZones = (state) => state.dragDrop.dropZones;
exports.selectDropZones = selectDropZones;
const selectIsAnimating = (state) => state.dragDrop.isAnimating;
exports.selectIsAnimating = selectIsAnimating;
const selectDropFeedback = (state) => state.dragDrop.dropFeedback;
exports.selectDropFeedback = selectDropFeedback;
const selectLastDropResult = (state) => state.dragDrop.lastDropResult;
exports.selectLastDropResult = selectLastDropResult;
// Get active drop zones
const selectActiveDropZones = (state) => state.dragDrop.dropZones.filter(zone => zone.isActive);
exports.selectActiveDropZones = selectActiveDropZones;
// Check if a specific drop zone is active
const selectIsDropZoneActive = (dropZoneId) => (state) => state.dragDrop.dropZones.find(zone => zone.id === dropZoneId)?.isActive || false;
exports.selectIsDropZoneActive = selectIsDropZoneActive;
// Check if currently dragging a specific type
const selectIsDraggingType = (itemType) => (state) => state.dragDrop.isDragging && state.dragDrop.dragItem?.type === itemType;
exports.selectIsDraggingType = selectIsDraggingType;
exports.default = dragDropSlice.reducer;
