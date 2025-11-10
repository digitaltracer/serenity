/**
 * Drag and Drop State Management
 * Manages drag and drop operations across the application
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DragItem, DropZone, DragDropState, DropResult, DropEffect } from '../../utils/dragDrop';

export interface DragDropReduxState extends DragDropState {
  // Additional UI state
  isAnimating: boolean;
  lastDropResult: DropResult | null;
  dropFeedback: {
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  };
}

const initialState: DragDropReduxState = {
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

const dragDropSlice = createSlice({
  name: 'dragDrop',
  initialState,
  reducers: {
    // Start dragging
    startDrag: (state, action: PayloadAction<DragItem>) => {
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
    registerDropZone: (state, action: PayloadAction<DropZone>) => {
      const existingIndex = state.dropZones.findIndex(zone => zone.id === action.payload.id);
      if (existingIndex >= 0) {
        state.dropZones[existingIndex] = action.payload;
      } else {
        state.dropZones.push(action.payload);
      }
    },

    // Unregister a drop zone
    unregisterDropZone: (state, action: PayloadAction<string>) => {
      state.dropZones = state.dropZones.filter(zone => zone.id !== action.payload);
    },

    // Update drop zone state
    updateDropZone: (state, action: PayloadAction<{ id: string; updates: Partial<DropZone> }>) => {
      const zone = state.dropZones.find(z => z.id === action.payload.id);
      if (zone) {
        Object.assign(zone, action.payload.updates);
      }
    },

    // Set drag over state for a drop zone
    setDragOver: (state, action: PayloadAction<{ dropZoneId: string; isOver: boolean }>) => {
      const zone = state.dropZones.find(z => z.id === action.payload.dropZoneId);
      if (zone) {
        zone.isOver = action.payload.isOver;
      }
    },

    // Handle drop operation
    handleDrop: (state, action: PayloadAction<DropResult>) => {
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
    handleDropFailure: (state, action: PayloadAction<string>) => {
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
      if (!state.dragItem) return;
      
      state.dropZones.forEach(zone => {
        // Update canDrop based on drag item
        zone.canDrop = zone.accepts.includes(state.dragItem!.type);
        
        // Activate drop zones that can accept the item
        zone.isActive = zone.canDrop;
      });
    },
  },
});

export const {
  startDrag,
  endDrag,
  registerDropZone,
  unregisterDropZone,
  updateDropZone,
  setDragOver,
  handleDrop,
  handleDropFailure,
  clearDropFeedback,
  updateDropZonesForDragItem,
} = dragDropSlice.actions;

// Selectors
export const selectIsDragging = (state: { dragDrop: DragDropReduxState }) => state.dragDrop.isDragging;
export const selectDragItem = (state: { dragDrop: DragDropReduxState }) => state.dragDrop.dragItem;
export const selectDropZones = (state: { dragDrop: DragDropReduxState }) => state.dragDrop.dropZones;
export const selectIsAnimating = (state: { dragDrop: DragDropReduxState }) => state.dragDrop.isAnimating;
export const selectDropFeedback = (state: { dragDrop: DragDropReduxState }) => state.dragDrop.dropFeedback;
export const selectLastDropResult = (state: { dragDrop: DragDropReduxState }) => state.dragDrop.lastDropResult;

// Get active drop zones
export const selectActiveDropZones = (state: { dragDrop: DragDropReduxState }) => 
  state.dragDrop.dropZones.filter(zone => zone.isActive);

// Check if a specific drop zone is active
export const selectIsDropZoneActive = (dropZoneId: string) => 
  (state: { dragDrop: DragDropReduxState }) => 
    state.dragDrop.dropZones.find(zone => zone.id === dropZoneId)?.isActive || false;

// Check if currently dragging a specific type
export const selectIsDraggingType = (itemType: string) => 
  (state: { dragDrop: DragDropReduxState }) => 
    state.dragDrop.isDragging && state.dragDrop.dragItem?.type === itemType;

export default dragDropSlice.reducer;