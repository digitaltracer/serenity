/**
 * Drag and Drop State Management
 * Manages drag and drop operations across the application
 */
import { DragItem, DropZone, DragDropState, DropResult } from '../../utils/dragDrop';
export interface DragDropReduxState extends DragDropState {
    isAnimating: boolean;
    lastDropResult: DropResult | null;
    dropFeedback: {
        show: boolean;
        message: string;
        type: 'success' | 'error' | 'info';
    };
}
export declare const startDrag: import("@reduxjs/toolkit").ActionCreatorWithPayload<DragItem, "dragDrop/startDrag">, endDrag: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"dragDrop/endDrag">, registerDropZone: import("@reduxjs/toolkit").ActionCreatorWithPayload<DropZone, "dragDrop/registerDropZone">, unregisterDropZone: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "dragDrop/unregisterDropZone">, updateDropZone: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    id: string;
    updates: Partial<DropZone>;
}, "dragDrop/updateDropZone">, setDragOver: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    dropZoneId: string;
    isOver: boolean;
}, "dragDrop/setDragOver">, handleDrop: import("@reduxjs/toolkit").ActionCreatorWithPayload<DropResult, "dragDrop/handleDrop">, handleDropFailure: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "dragDrop/handleDropFailure">, clearDropFeedback: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"dragDrop/clearDropFeedback">, updateDropZonesForDragItem: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"dragDrop/updateDropZonesForDragItem">;
export declare const selectIsDragging: (state: {
    dragDrop: DragDropReduxState;
}) => boolean;
export declare const selectDragItem: (state: {
    dragDrop: DragDropReduxState;
}) => DragItem | null;
export declare const selectDropZones: (state: {
    dragDrop: DragDropReduxState;
}) => DropZone[];
export declare const selectIsAnimating: (state: {
    dragDrop: DragDropReduxState;
}) => boolean;
export declare const selectDropFeedback: (state: {
    dragDrop: DragDropReduxState;
}) => {
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
};
export declare const selectLastDropResult: (state: {
    dragDrop: DragDropReduxState;
}) => DropResult | null;
export declare const selectActiveDropZones: (state: {
    dragDrop: DragDropReduxState;
}) => DropZone[];
export declare const selectIsDropZoneActive: (dropZoneId: string) => (state: {
    dragDrop: DragDropReduxState;
}) => boolean;
export declare const selectIsDraggingType: (itemType: string) => (state: {
    dragDrop: DragDropReduxState;
}) => boolean;
declare const _default: import("redux").Reducer<DragDropReduxState>;
export default _default;
