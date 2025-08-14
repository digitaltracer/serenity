import { Task } from '../../types';
export interface TasksState {
    tasks: Task[];
    loading: boolean;
    error: string | null;
    filters: {
        search: string;
        priority: 'all' | 'high' | 'medium' | 'low';
        status: 'all' | 'pending' | 'completed';
        project: string | null;
    };
}
export declare const addTask: import("@reduxjs/toolkit").ActionCreatorWithPreparedPayload<[taskData: Omit<Task, "id" | "createdAt" | "updatedAt">], Task, "tasks/addTask", never, never>, updateTask: import("@reduxjs/toolkit").ActionCreatorWithPayload<Partial<Task> & {
    id: string;
}, "tasks/updateTask">, deleteTask: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "tasks/deleteTask">, toggleTask: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "tasks/toggleTask">, toggleSubtask: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    taskId: string;
    subtaskId: string;
}, "tasks/toggleSubtask">, addSubtask: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    taskId: string;
    title: string;
}, "tasks/addSubtask">, removeSubtask: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    taskId: string;
    subtaskId: string;
}, "tasks/removeSubtask">, updateSubtaskTitle: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    taskId: string;
    subtaskId: string;
    title: string;
}, "tasks/updateSubtaskTitle">, setTaskFilter: import("@reduxjs/toolkit").ActionCreatorWithPayload<Partial<{
    search: string;
    priority: "all" | "high" | "medium" | "low";
    status: "all" | "pending" | "completed";
    project: string | null;
}>, "tasks/setTaskFilter">, clearTaskFilters: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"tasks/clearFilters">, setTasks: import("@reduxjs/toolkit").ActionCreatorWithPayload<Task[], "tasks/setTasks">, setTasksLoading: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "tasks/setLoading">, setTasksError: import("@reduxjs/toolkit").ActionCreatorWithPayload<string | null, "tasks/setError">, reorderTasks: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    taskIds: string[];
    newOrder: number[];
}, "tasks/reorderTasks">, moveTaskToProject: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    taskId: string;
    projectId: string | undefined;
}, "tasks/moveTaskToProject">, changeTaskPriority: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    taskId: string;
    priority: "low" | "medium" | "high";
}, "tasks/changeTaskPriority">, scheduleTask: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    taskId: string;
    dueDate: Date | undefined;
}, "tasks/scheduleTask">, reorderSubtasks: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    parentTaskId: string;
    subtaskIds: string[];
    newOrder: number[];
}, "tasks/reorderSubtasks">, bulkUpdateTasks: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    taskIds: string[];
    updates: Partial<Task>;
}, "tasks/bulkUpdateTasks">, bulkDeleteTasks: import("@reduxjs/toolkit").ActionCreatorWithPayload<string[], "tasks/bulkDeleteTasks">, updateAllTasks: import("@reduxjs/toolkit").ActionCreatorWithPayload<Task[], "tasks/updateAllTasks">;
export declare const selectAllTasks: (state: {
    tasks: TasksState;
}) => Task[];
export declare const selectTasksLoading: (state: {
    tasks: TasksState;
}) => boolean;
export declare const selectTasksError: (state: {
    tasks: TasksState;
}) => string | null;
export declare const selectTaskFilters: (state: {
    tasks: TasksState;
}) => {
    search: string;
    priority: "all" | "high" | "medium" | "low";
    status: "all" | "pending" | "completed";
    project: string | null;
};
export declare const selectFilteredTasks: ((state: {
    tasks: TasksState;
} & {
    tasks: TasksState;
}) => Task[]) & import("reselect").OutputSelectorFields<(args_0: Task[], args_1: {
    search: string;
    priority: "all" | "high" | "medium" | "low";
    status: "all" | "pending" | "completed";
    project: string | null;
}) => Task[], {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const selectTodayTasks: ((state: {
    tasks: TasksState;
}) => Task[]) & import("reselect").OutputSelectorFields<(args_0: Task[]) => Task[], {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
declare const _default: import("redux").Reducer<TasksState>;
export default _default;
//# sourceMappingURL=tasksSlice.d.ts.map