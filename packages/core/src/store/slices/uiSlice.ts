import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
  // Bulk operations state
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

const initialState: UIState = {
  sidebarCollapsed: false,
  theme: 'system',
  compactMode: false,
  activeModal: null,
  modals: {
    taskModal: false,
    journalModal: false,
    subtaskModal: false,
  },
  bulkSelection: {
    isActive: false,
    selectedItems: {
      tasks: [],
      journalEntries: [],
      projects: [],
    },
    selectAll: {
      tasks: false,
      journalEntries: false,
      projects: false,
    },
  },
  notifications: [],
  loading: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    setCompactMode: (state, action: PayloadAction<boolean>) => {
      state.compactMode = action.payload;
    },
    toggleCompactMode: (state) => {
      state.compactMode = !state.compactMode;
    },
    setActiveModal: (state, action: PayloadAction<string | null>) => {
      state.activeModal = action.payload;
    },
    openTaskModal: (state) => {
      state.modals.taskModal = true;
    },
    closeTaskModal: (state) => {
      state.modals.taskModal = false;
    },
    openJournalModal: (state) => {
      state.modals.journalModal = true;
    },
    closeJournalModal: (state) => {
      state.modals.journalModal = false;
    },
    openSubtaskModal: (state) => {
      state.modals.subtaskModal = true;
    },
    closeSubtaskModal: (state) => {
      state.modals.subtaskModal = false;
    },
    addNotification: (state, action: PayloadAction<Omit<UIState['notifications'][0], 'id'>>) => {
      const notification = {
        ...action.payload,
        id: Date.now().toString(),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setLoading: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      state.loading[action.payload.key] = action.payload.loading;
    },
    clearLoading: (state, action: PayloadAction<string>) => {
      delete state.loading[action.payload];
    },
    
    // Bulk Selection Actions
    enterBulkMode: (state) => {
      state.bulkSelection.isActive = true;
    },
    
    exitBulkMode: (state) => {
      state.bulkSelection.isActive = false;
      state.bulkSelection.selectedItems = {
        tasks: [],
        journalEntries: [],
        projects: [],
      };
      state.bulkSelection.selectAll = {
        tasks: false,
        journalEntries: false,
        projects: false,
      };
    },
    
    toggleItemSelection: (state, action: PayloadAction<{ type: 'tasks' | 'journalEntries' | 'projects'; id: string }>) => {
      const { type, id } = action.payload;
      const selectedItems = state.bulkSelection.selectedItems[type];
      const index = selectedItems.indexOf(id);
      
      if (index >= 0) {
        selectedItems.splice(index, 1);
      } else {
        selectedItems.push(id);
      }
      
      // Update select all state
      state.bulkSelection.selectAll[type] = false;
    },
    
    selectAllItems: (state, action: PayloadAction<{ type: 'tasks' | 'journalEntries' | 'projects'; items: string[] }>) => {
      const { type, items } = action.payload;
      state.bulkSelection.selectedItems[type] = [...items];
      state.bulkSelection.selectAll[type] = true;
    },
    
    deselectAllItems: (state, action: PayloadAction<'tasks' | 'journalEntries' | 'projects'>) => {
      const type = action.payload;
      state.bulkSelection.selectedItems[type] = [];
      state.bulkSelection.selectAll[type] = false;
    },
    
    setSelectedItems: (state, action: PayloadAction<{ type: 'tasks' | 'journalEntries' | 'projects'; items: string[] }>) => {
      const { type, items } = action.payload;
      state.bulkSelection.selectedItems[type] = items;
    },
  },
});

export const {
  setSidebarCollapsed,
  toggleSidebar,
  setTheme,
  toggleTheme,
  setCompactMode,
  toggleCompactMode,
  setActiveModal,
  openTaskModal,
  closeTaskModal,
  openJournalModal,
  closeJournalModal,
  openSubtaskModal,
  closeSubtaskModal,
  addNotification,
  removeNotification,
  clearNotifications,
  setLoading,
  clearLoading,
  // Bulk Selection Actions
  enterBulkMode,
  exitBulkMode,
  toggleItemSelection,
  selectAllItems,
  deselectAllItems,
  setSelectedItems,
} = uiSlice.actions;

// Selectors  
export const selectSidebarCollapsed = (state: { ui: UIState }) => state.ui.sidebarCollapsed;
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectCompactMode = (state: { ui: UIState }) => state.ui.compactMode;
export const selectActiveModal = (state: { ui: UIState }) => state.ui.activeModal;
export const selectTaskModalOpen = (state: { ui: UIState }) => state.ui.modals.taskModal;
export const selectJournalModalOpen = (state: { ui: UIState }) => state.ui.modals.journalModal;
export const selectSubtaskModalOpen = (state: { ui: UIState }) => state.ui.modals.subtaskModal;
export const selectNotifications = (state: { ui: UIState }) => state.ui.notifications;
export const selectLoading = (state: { ui: UIState }) => (key: string) => state.ui.loading[key] || false;

// Bulk Selection Selectors
export const selectBulkSelectionState = (state: { ui: UIState }) => state.ui.bulkSelection;
export const selectIsBulkModeActive = (state: { ui: UIState }) => state.ui.bulkSelection.isActive;
export const selectSelectedTasks = (state: { ui: UIState }) => state.ui.bulkSelection.selectedItems.tasks;
export const selectSelectedJournalEntries = (state: { ui: UIState }) => state.ui.bulkSelection.selectedItems.journalEntries;
export const selectSelectedProjects = (state: { ui: UIState }) => state.ui.bulkSelection.selectedItems.projects;
export const selectIsTaskSelected = (taskId: string) => (state: { ui: UIState }) => 
  state.ui.bulkSelection.selectedItems.tasks.includes(taskId);
export const selectIsJournalEntrySelected = (entryId: string) => (state: { ui: UIState }) => 
  state.ui.bulkSelection.selectedItems.journalEntries.includes(entryId);
export const selectIsProjectSelected = (projectId: string) => (state: { ui: UIState }) => 
  state.ui.bulkSelection.selectedItems.projects.includes(projectId);
export const selectSelectedItemsCount = (state: { ui: UIState }) => {
  const { tasks, journalEntries, projects } = state.ui.bulkSelection.selectedItems;
  return tasks.length + journalEntries.length + projects.length;
};
export const selectTaskSelectAllState = (state: { ui: UIState }) => state.ui.bulkSelection.selectAll.tasks;
export const selectJournalSelectAllState = (state: { ui: UIState }) => state.ui.bulkSelection.selectAll.journalEntries;
export const selectProjectSelectAllState = (state: { ui: UIState }) => state.ui.bulkSelection.selectAll.projects;

export default uiSlice.reducer;