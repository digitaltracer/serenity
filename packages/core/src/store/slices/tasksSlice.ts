import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit';
import { Task } from '../../types';
import { generateId } from '../../utils';
import { loadTasks } from '../../utils/persistence';

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

// Load tasks from localStorage on initialization
const initialTasks = (() => {
  try {
    return loadTasks();
  } catch (error) {
    console.error('Failed to load tasks from storage:', error);
    return [];
  }
})();

const initialState: TasksState = {
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

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    addTask: {
      reducer: (state, action: PayloadAction<Task>) => {
        state.tasks.push(action.payload);
      },
      prepare: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newTask: Task = {
          ...taskData,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return { payload: newTask };
      }
    },
    updateTask: (state, action: PayloadAction<Partial<Task> & { id: string }>) => {
      const index = state.tasks.findIndex(task => task.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = {
          ...state.tasks[index],
          ...action.payload,
          updatedAt: new Date(),
        };
      }
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(task => task.id !== action.payload);
    },
    toggleTask: (state, action: PayloadAction<string>) => {
      const task = state.tasks.find(task => task.id === action.payload);
      if (task) {
        task.completed = !task.completed;
        task.updatedAt = new Date();
      }
    },
    toggleSubtask: (state, action: PayloadAction<{ taskId: string; subtaskId: string }>) => {
      const task = state.tasks.find(task => task.id === action.payload.taskId);
      if (task && task.subtasks) {
        const subtask = task.subtasks.find(st => st.id === action.payload.subtaskId);
        if (subtask) {
          subtask.completed = !subtask.completed;
          task.updatedAt = new Date();
        }
      }
    },
    addSubtask: (state, action: PayloadAction<{ taskId: string; title: string }>) => {
      const task = state.tasks.find(task => task.id === action.payload.taskId);
      if (task) {
        if (!task.subtasks) task.subtasks = [];
        const newSubtask = {
          id: generateId(),
          title: action.payload.title,
          completed: false,
          order: task.subtasks.length,
        };
        task.subtasks.push(newSubtask);
        task.updatedAt = new Date();
      }
    },
    removeSubtask: (state, action: PayloadAction<{ taskId: string; subtaskId: string }>) => {
      const task = state.tasks.find(task => task.id === action.payload.taskId);
      if (task && task.subtasks) {
        task.subtasks = task.subtasks.filter(st => st.id !== action.payload.subtaskId);
        task.updatedAt = new Date();
      }
    },
    setTaskFilter: (state, action: PayloadAction<Partial<TasksState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // Drag and Drop Actions
    reorderTasks: (state, action: PayloadAction<{ taskIds: string[]; newOrder: number[] }>) => {
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
    
    moveTaskToProject: (state, action: PayloadAction<{ taskId: string; projectId: string | undefined }>) => {
      const { taskId, projectId } = action.payload;
      const task = state.tasks.find(t => t.id === taskId);
      if (task) {
        task.projectId = projectId;
        task.updatedAt = new Date();
      }
    },
    
    changeTaskPriority: (state, action: PayloadAction<{ taskId: string; priority: 'low' | 'medium' | 'high' }>) => {
      const { taskId, priority } = action.payload;
      const task = state.tasks.find(t => t.id === taskId);
      if (task) {
        task.priority = priority;
        task.updatedAt = new Date();
      }
    },
    
    scheduleTask: (state, action: PayloadAction<{ taskId: string; dueDate: Date | undefined }>) => {
      const { taskId, dueDate } = action.payload;
      const task = state.tasks.find(t => t.id === taskId);
      if (task) {
        task.dueDate = dueDate;
        task.updatedAt = new Date();
      }
    },
    
    reorderSubtasks: (state, action: PayloadAction<{ parentTaskId: string; subtaskIds: string[]; newOrder: number[] }>) => {
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
    bulkUpdateTasks: (state, action: PayloadAction<{ taskIds: string[]; updates: Partial<Task> }>) => {
      const { taskIds, updates } = action.payload;
      taskIds.forEach(taskId => {
        const task = state.tasks.find(t => t.id === taskId);
        if (task) {
          Object.assign(task, updates, { updatedAt: new Date() });
        }
      });
    },
    
    bulkDeleteTasks: (state, action: PayloadAction<string[]>) => {
      const taskIds = action.payload;
      state.tasks = state.tasks.filter(task => !taskIds.includes(task.id));
    },
    
    updateAllTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
    },
  },
});

export const {
  addTask,
  updateTask,
  deleteTask,
  toggleTask,
  toggleSubtask,
  addSubtask,
  removeSubtask,
  setTaskFilter,
  clearFilters: clearTaskFilters,
  setTasks,
  setLoading: setTasksLoading,
  setError: setTasksError,
  // Drag and Drop actions
  reorderTasks,
  moveTaskToProject,
  changeTaskPriority,
  scheduleTask,
  reorderSubtasks,
  // Bulk operations
  bulkUpdateTasks,
  bulkDeleteTasks,
  updateAllTasks,
} = tasksSlice.actions;

// Selectors
export const selectAllTasks = (state: { tasks: TasksState }) => state.tasks.tasks;
export const selectTasksLoading = (state: { tasks: TasksState }) => state.tasks.loading;
export const selectTasksError = (state: { tasks: TasksState }) => state.tasks.error;
export const selectTaskFilters = (state: { tasks: TasksState }) => state.tasks.filters;

export const selectFilteredTasks = createSelector(
  [selectAllTasks, selectTaskFilters],
  (tasks, filters) => {
    return tasks.filter(task => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Priority filter
      if (filters.priority !== 'all' && task.priority !== filters.priority) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all') {
        const isCompleted = task.completed;
        if (filters.status === 'completed' && !isCompleted) return false;
        if (filters.status === 'pending' && isCompleted) return false;
      }

      // Project filter
      if (filters.project && task.projectId !== filters.project) {
        return false;
      }

      return true;
    });
  }
);

export const selectTodayTasks = createSelector(
  [selectAllTasks],
  (tasks) => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDateString = new Date(task.dueDate).toISOString().split('T')[0];
      return taskDateString === todayString;
    });
  }
);

export default tasksSlice.reducer;