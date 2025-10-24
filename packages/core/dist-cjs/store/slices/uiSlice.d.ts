export interface UIState {
    sidebarCollapsed: boolean;
    theme: 'light' | 'dark' | 'system';
    compactMode: boolean;
    activeModal: string | null;
    modals: {
        taskModal: boolean;
        journalModal: boolean;
        subtaskModal: boolean;
    };
    bulkSelection: {
        isActive: boolean;
        selectedItems: {
            tasks: string[];
            journalEntries: string[];
            projects: string[];
        };
        selectAll: {
            tasks: boolean;
            journalEntries: boolean;
            projects: boolean;
        };
    };
    notifications: Array<{
        id: string;
        type: 'success' | 'error' | 'warning' | 'info';
        title: string;
        message: string;
        duration?: number;
    }>;
    loading: {
        [key: string]: boolean;
    };
}
export declare const setSidebarCollapsed: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "ui/setSidebarCollapsed">, toggleSidebar: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"ui/toggleSidebar">, setTheme: import("@reduxjs/toolkit").ActionCreatorWithPayload<"light" | "dark" | "system", "ui/setTheme">, toggleTheme: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"ui/toggleTheme">, setCompactMode: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "ui/setCompactMode">, toggleCompactMode: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"ui/toggleCompactMode">, setActiveModal: import("@reduxjs/toolkit").ActionCreatorWithPayload<string | null, "ui/setActiveModal">, openTaskModal: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"ui/openTaskModal">, closeTaskModal: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"ui/closeTaskModal">, openJournalModal: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"ui/openJournalModal">, closeJournalModal: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"ui/closeJournalModal">, openSubtaskModal: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"ui/openSubtaskModal">, closeSubtaskModal: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"ui/closeSubtaskModal">, addNotification: import("@reduxjs/toolkit").ActionCreatorWithPayload<Omit<{
    id: string;
    type: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
    duration?: number;
}, "id">, "ui/addNotification">, removeNotification: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "ui/removeNotification">, clearNotifications: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"ui/clearNotifications">, setLoading: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    key: string;
    loading: boolean;
}, "ui/setLoading">, clearLoading: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "ui/clearLoading">, enterBulkMode: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"ui/enterBulkMode">, exitBulkMode: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"ui/exitBulkMode">, toggleItemSelection: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    type: "tasks" | "journalEntries" | "projects";
    id: string;
}, "ui/toggleItemSelection">, selectAllItems: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    type: "tasks" | "journalEntries" | "projects";
    items: string[];
}, "ui/selectAllItems">, deselectAllItems: import("@reduxjs/toolkit").ActionCreatorWithPayload<"tasks" | "journalEntries" | "projects", "ui/deselectAllItems">, setSelectedItems: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    type: "tasks" | "journalEntries" | "projects";
    items: string[];
}, "ui/setSelectedItems">;
export declare const selectSidebarCollapsed: (state: {
    ui: UIState;
}) => boolean;
export declare const selectTheme: (state: {
    ui: UIState;
}) => "light" | "dark" | "system";
export declare const selectCompactMode: (state: {
    ui: UIState;
}) => boolean;
export declare const selectActiveModal: (state: {
    ui: UIState;
}) => string | null;
export declare const selectTaskModalOpen: (state: {
    ui: UIState;
}) => boolean;
export declare const selectJournalModalOpen: (state: {
    ui: UIState;
}) => boolean;
export declare const selectSubtaskModalOpen: (state: {
    ui: UIState;
}) => boolean;
export declare const selectNotifications: (state: {
    ui: UIState;
}) => {
    id: string;
    type: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
    duration?: number;
}[];
export declare const selectLoading: (state: {
    ui: UIState;
}) => (key: string) => boolean;
export declare const selectBulkSelectionState: (state: {
    ui: UIState;
}) => {
    isActive: boolean;
    selectedItems: {
        tasks: string[];
        journalEntries: string[];
        projects: string[];
    };
    selectAll: {
        tasks: boolean;
        journalEntries: boolean;
        projects: boolean;
    };
};
export declare const selectIsBulkModeActive: (state: {
    ui: UIState;
}) => boolean;
export declare const selectSelectedTasks: (state: {
    ui: UIState;
}) => string[];
export declare const selectSelectedJournalEntries: (state: {
    ui: UIState;
}) => string[];
export declare const selectSelectedProjects: (state: {
    ui: UIState;
}) => string[];
export declare const selectIsTaskSelected: (taskId: string) => (state: {
    ui: UIState;
}) => boolean;
export declare const selectIsJournalEntrySelected: (entryId: string) => (state: {
    ui: UIState;
}) => boolean;
export declare const selectIsProjectSelected: (projectId: string) => (state: {
    ui: UIState;
}) => boolean;
export declare const selectSelectedItemsCount: (state: {
    ui: UIState;
}) => number;
export declare const selectTaskSelectAllState: (state: {
    ui: UIState;
}) => boolean;
export declare const selectJournalSelectAllState: (state: {
    ui: UIState;
}) => boolean;
export declare const selectProjectSelectAllState: (state: {
    ui: UIState;
}) => boolean;
declare const _default: import("redux").Reducer<UIState>;
export default _default;
