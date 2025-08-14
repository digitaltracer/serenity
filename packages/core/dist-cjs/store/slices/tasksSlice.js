"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectTodayTasks = exports.selectFilteredTasks = exports.selectTaskFilters = exports.selectTasksError = exports.selectTasksLoading = exports.selectAllTasks = exports.updateAllTasks = exports.bulkDeleteTasks = exports.bulkUpdateTasks = exports.reorderSubtasks = exports.scheduleTask = exports.changeTaskPriority = exports.moveTaskToProject = exports.reorderTasks = exports.setTasksError = exports.setTasksLoading = exports.setTasks = exports.clearTaskFilters = exports.setTaskFilter = exports.updateSubtaskTitle = exports.removeSubtask = exports.addSubtask = exports.toggleSubtask = exports.toggleTask = exports.deleteTask = exports.updateTask = exports.addTask = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const utils_1 = require("../../utils");
const persistence_1 = require("../../utils/persistence");
// Load tasks from localStorage on initialization
const initialTasks = (() => {
    try {
        return (0, persistence_1.loadTasks)();
    }
    catch (error) {
        console.error('Failed to load tasks from storage:', error);
        return [];
    }
})();
const initialState = {
    tasks: initialTasks,
    loading: false,
    error: null,
    filters: {
        search: '',
        priority: 'all',
        status: 'all',
        project: null,
    },
};
const tasksSlice = (0, toolkit_1.createSlice)({
    name: 'tasks',
    initialState,
    reducers: {
        addTask: {
            reducer: (state, action) => {
                state.tasks.push(action.payload);
            },
            prepare: (taskData) => {
                const newTask = {
                    ...taskData,
                    id: (0, utils_1.generateId)(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                return { payload: newTask };
            }
        },
        updateTask: (state, action) => {
            const index = state.tasks.findIndex(task => task.id === action.payload.id);
            if (index !== -1) {
                state.tasks[index] = {
                    ...state.tasks[index],
                    ...action.payload,
                    updatedAt: new Date(),
                };
            }
        },
        deleteTask: (state, action) => {
            state.tasks = state.tasks.filter(task => task.id !== action.payload);
        },
        toggleTask: (state, action) => {
            const task = state.tasks.find(task => task.id === action.payload);
            if (task) {
                task.completed = !task.completed;
                task.updatedAt = new Date();
            }
        },
        toggleSubtask: (state, action) => {
            const task = state.tasks.find(task => task.id === action.payload.taskId);
            if (task && task.subtasks) {
                const subtask = task.subtasks.find(st => st.id === action.payload.subtaskId);
                if (subtask) {
                    subtask.completed = !subtask.completed;
                    task.updatedAt = new Date();
                }
            }
        },
        addSubtask: (state, action) => {
            const task = state.tasks.find(task => task.id === action.payload.taskId);
            if (task) {
                if (!task.subtasks)
                    task.subtasks = [];
                const newSubtask = {
                    id: (0, utils_1.generateId)(),
                    title: action.payload.title,
                    completed: false,
                    order: task.subtasks.length,
                };
                task.subtasks.push(newSubtask);
                task.updatedAt = new Date();
            }
        },
        removeSubtask: (state, action) => {
            const task = state.tasks.find(task => task.id === action.payload.taskId);
            if (task && task.subtasks) {
                task.subtasks = task.subtasks.filter(st => st.id !== action.payload.subtaskId);
                task.updatedAt = new Date();
            }
        },
        updateSubtaskTitle: (state, action) => {
            const task = state.tasks.find(task => task.id === action.payload.taskId);
            if (task && task.subtasks) {
                const subtask = task.subtasks.find(st => st.id === action.payload.subtaskId);
                if (subtask) {
                    subtask.title = action.payload.title;
                    task.updatedAt = new Date();
                }
            }
        },
        setTaskFilter: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearFilters: (state) => {
            state.filters = initialState.filters;
        },
        setTasks: (state, action) => {
            state.tasks = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        // Drag and Drop Actions
        reorderTasks: (state, action) => {
            const { taskIds, newOrder } = action.payload;
            const reorderedTasks = [];
            // Create new array in the specified order
            for (let i = 0; i < newOrder.length; i++) {
                const taskId = taskIds[newOrder[i]];
                const task = state.tasks.find(t => t.id === taskId);
                if (task) {
                    reorderedTasks.push({ ...task, updatedAt: new Date() });
                }
            }
            // Add tasks that weren't in the reorder operation
            const reorderedIds = new Set(taskIds);
            const otherTasks = state.tasks.filter(t => !reorderedIds.has(t.id));
            state.tasks = [...reorderedTasks, ...otherTasks];
        },
        moveTaskToProject: (state, action) => {
            const { taskId, projectId } = action.payload;
            const task = state.tasks.find(t => t.id === taskId);
            if (task) {
                task.projectId = projectId;
                task.updatedAt = new Date();
            }
        },
        changeTaskPriority: (state, action) => {
            const { taskId, priority } = action.payload;
            const task = state.tasks.find(t => t.id === taskId);
            if (task) {
                task.priority = priority;
                task.updatedAt = new Date();
            }
        },
        scheduleTask: (state, action) => {
            const { taskId, dueDate } = action.payload;
            const task = state.tasks.find(t => t.id === taskId);
            if (task) {
                task.dueDate = dueDate;
                task.updatedAt = new Date();
            }
        },
        reorderSubtasks: (state, action) => {
            const { parentTaskId, subtaskIds, newOrder } = action.payload;
            const parentTask = state.tasks.find(t => t.id === parentTaskId);
            if (parentTask && parentTask.subtasks) {
                const reorderedSubtasks = [];
                // Create new array in the specified order
                for (let i = 0; i < newOrder.length; i++) {
                    const subtaskId = subtaskIds[newOrder[i]];
                    const subtask = parentTask.subtasks.find(st => st.id === subtaskId);
                    if (subtask) {
                        reorderedSubtasks.push(subtask);
                    }
                }
                // Add subtasks that weren't in the reorder operation
                const reorderedIds = new Set(subtaskIds);
                const otherSubtasks = parentTask.subtasks.filter(st => !reorderedIds.has(st.id));
                parentTask.subtasks = [...reorderedSubtasks, ...otherSubtasks];
                parentTask.updatedAt = new Date();
            }
        },
        // Bulk operations (for future bulk operations feature)
        bulkUpdateTasks: (state, action) => {
            const { taskIds, updates } = action.payload;
            taskIds.forEach(taskId => {
                const task = state.tasks.find(t => t.id === taskId);
                if (task) {
                    Object.assign(task, updates, { updatedAt: new Date() });
                }
            });
        },
        bulkDeleteTasks: (state, action) => {
            const taskIds = action.payload;
            state.tasks = state.tasks.filter(task => !taskIds.includes(task.id));
        },
        updateAllTasks: (state, action) => {
            state.tasks = action.payload;
        },
    },
});
_a = tasksSlice.actions, exports.addTask = _a.addTask, exports.updateTask = _a.updateTask, exports.deleteTask = _a.deleteTask, exports.toggleTask = _a.toggleTask, exports.toggleSubtask = _a.toggleSubtask, exports.addSubtask = _a.addSubtask, exports.removeSubtask = _a.removeSubtask, exports.updateSubtaskTitle = _a.updateSubtaskTitle, exports.setTaskFilter = _a.setTaskFilter, exports.clearTaskFilters = _a.clearFilters, exports.setTasks = _a.setTasks, exports.setTasksLoading = _a.setLoading, exports.setTasksError = _a.setError, 
// Drag and Drop actions
exports.reorderTasks = _a.reorderTasks, exports.moveTaskToProject = _a.moveTaskToProject, exports.changeTaskPriority = _a.changeTaskPriority, exports.scheduleTask = _a.scheduleTask, exports.reorderSubtasks = _a.reorderSubtasks, 
// Bulk operations
exports.bulkUpdateTasks = _a.bulkUpdateTasks, exports.bulkDeleteTasks = _a.bulkDeleteTasks, exports.updateAllTasks = _a.updateAllTasks;
// Selectors
const selectAllTasks = (state) => state.tasks.tasks;
exports.selectAllTasks = selectAllTasks;
const selectTasksLoading = (state) => state.tasks.loading;
exports.selectTasksLoading = selectTasksLoading;
const selectTasksError = (state) => state.tasks.error;
exports.selectTasksError = selectTasksError;
const selectTaskFilters = (state) => state.tasks.filters;
exports.selectTaskFilters = selectTaskFilters;
exports.selectFilteredTasks = (0, toolkit_1.createSelector)([exports.selectAllTasks, exports.selectTaskFilters], (tasks, filters) => {
    return tasks.filter(task => {
        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const matchesSearch = task.title.toLowerCase().includes(searchLower) ||
                task.description?.toLowerCase().includes(searchLower);
            if (!matchesSearch)
                return false;
        }
        // Priority filter
        if (filters.priority !== 'all' && task.priority !== filters.priority) {
            return false;
        }
        // Status filter
        if (filters.status !== 'all') {
            const isCompleted = task.completed;
            if (filters.status === 'completed' && !isCompleted)
                return false;
            if (filters.status === 'pending' && isCompleted)
                return false;
        }
        // Project filter
        if (filters.project && task.projectId !== filters.project) {
            return false;
        }
        return true;
    });
});
exports.selectTodayTasks = (0, toolkit_1.createSelector)([exports.selectAllTasks], (tasks) => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    return tasks.filter(task => {
        if (!task.dueDate)
            return false;
        const taskDateString = new Date(task.dueDate).toISOString().split('T')[0];
        return taskDateString === todayString;
    });
});
exports.default = tasksSlice.reducer;
