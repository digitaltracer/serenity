"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectProjectSelectAllState = exports.selectJournalSelectAllState = exports.selectTaskSelectAllState = exports.selectSelectedItemsCount = exports.selectIsProjectSelected = exports.selectIsJournalEntrySelected = exports.selectIsTaskSelected = exports.selectSelectedProjects = exports.selectSelectedJournalEntries = exports.selectSelectedTasks = exports.selectIsBulkModeActive = exports.selectBulkSelectionState = exports.selectLoading = exports.selectNotifications = exports.selectSubtaskModalOpen = exports.selectJournalModalOpen = exports.selectTaskModalOpen = exports.selectActiveModal = exports.selectCompactMode = exports.selectTheme = exports.selectSidebarCollapsed = exports.setSelectedItems = exports.deselectAllItems = exports.selectAllItems = exports.toggleItemSelection = exports.exitBulkMode = exports.enterBulkMode = exports.clearLoading = exports.setLoading = exports.clearNotifications = exports.removeNotification = exports.addNotification = exports.closeSubtaskModal = exports.openSubtaskModal = exports.closeJournalModal = exports.openJournalModal = exports.closeTaskModal = exports.openTaskModal = exports.setActiveModal = exports.toggleCompactMode = exports.setCompactMode = exports.toggleTheme = exports.setTheme = exports.toggleSidebar = exports.setSidebarCollapsed = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const initialState = {
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
const uiSlice = (0, toolkit_1.createSlice)({
    name: 'ui',
    initialState,
    reducers: {
        setSidebarCollapsed: (state, action) => {
            state.sidebarCollapsed = action.payload;
        },
        toggleSidebar: (state) => {
            state.sidebarCollapsed = !state.sidebarCollapsed;
        },
        setTheme: (state, action) => {
            state.theme = action.payload;
        },
        toggleTheme: (state) => {
            state.theme = state.theme === 'light' ? 'dark' : 'light';
        },
        setCompactMode: (state, action) => {
            state.compactMode = action.payload;
        },
        toggleCompactMode: (state) => {
            state.compactMode = !state.compactMode;
        },
        setActiveModal: (state, action) => {
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
        addNotification: (state, action) => {
            const notification = {
                ...action.payload,
                id: Date.now().toString(),
            };
            state.notifications.push(notification);
        },
        removeNotification: (state, action) => {
            state.notifications = state.notifications.filter(n => n.id !== action.payload);
        },
        clearNotifications: (state) => {
            state.notifications = [];
        },
        setLoading: (state, action) => {
            state.loading[action.payload.key] = action.payload.loading;
        },
        clearLoading: (state, action) => {
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
        toggleItemSelection: (state, action) => {
            const { type, id } = action.payload;
            const selectedItems = state.bulkSelection.selectedItems[type];
            const index = selectedItems.indexOf(id);
            if (index >= 0) {
                selectedItems.splice(index, 1);
            }
            else {
                selectedItems.push(id);
            }
            // Update select all state
            state.bulkSelection.selectAll[type] = false;
        },
        selectAllItems: (state, action) => {
            const { type, items } = action.payload;
            state.bulkSelection.selectedItems[type] = [...items];
            state.bulkSelection.selectAll[type] = true;
        },
        deselectAllItems: (state, action) => {
            const type = action.payload;
            state.bulkSelection.selectedItems[type] = [];
            state.bulkSelection.selectAll[type] = false;
        },
        setSelectedItems: (state, action) => {
            const { type, items } = action.payload;
            state.bulkSelection.selectedItems[type] = items;
        },
    },
});
_a = uiSlice.actions, exports.setSidebarCollapsed = _a.setSidebarCollapsed, exports.toggleSidebar = _a.toggleSidebar, exports.setTheme = _a.setTheme, exports.toggleTheme = _a.toggleTheme, exports.setCompactMode = _a.setCompactMode, exports.toggleCompactMode = _a.toggleCompactMode, exports.setActiveModal = _a.setActiveModal, exports.openTaskModal = _a.openTaskModal, exports.closeTaskModal = _a.closeTaskModal, exports.openJournalModal = _a.openJournalModal, exports.closeJournalModal = _a.closeJournalModal, exports.openSubtaskModal = _a.openSubtaskModal, exports.closeSubtaskModal = _a.closeSubtaskModal, exports.addNotification = _a.addNotification, exports.removeNotification = _a.removeNotification, exports.clearNotifications = _a.clearNotifications, exports.setLoading = _a.setLoading, exports.clearLoading = _a.clearLoading, 
// Bulk Selection Actions
exports.enterBulkMode = _a.enterBulkMode, exports.exitBulkMode = _a.exitBulkMode, exports.toggleItemSelection = _a.toggleItemSelection, exports.selectAllItems = _a.selectAllItems, exports.deselectAllItems = _a.deselectAllItems, exports.setSelectedItems = _a.setSelectedItems;
// Selectors  
const selectSidebarCollapsed = (state) => state.ui.sidebarCollapsed;
exports.selectSidebarCollapsed = selectSidebarCollapsed;
const selectTheme = (state) => state.ui.theme;
exports.selectTheme = selectTheme;
const selectCompactMode = (state) => state.ui.compactMode;
exports.selectCompactMode = selectCompactMode;
const selectActiveModal = (state) => state.ui.activeModal;
exports.selectActiveModal = selectActiveModal;
const selectTaskModalOpen = (state) => state.ui.modals.taskModal;
exports.selectTaskModalOpen = selectTaskModalOpen;
const selectJournalModalOpen = (state) => state.ui.modals.journalModal;
exports.selectJournalModalOpen = selectJournalModalOpen;
const selectSubtaskModalOpen = (state) => state.ui.modals.subtaskModal;
exports.selectSubtaskModalOpen = selectSubtaskModalOpen;
const selectNotifications = (state) => state.ui.notifications;
exports.selectNotifications = selectNotifications;
const selectLoading = (state) => (key) => state.ui.loading[key] || false;
exports.selectLoading = selectLoading;
// Bulk Selection Selectors
const selectBulkSelectionState = (state) => state.ui.bulkSelection;
exports.selectBulkSelectionState = selectBulkSelectionState;
const selectIsBulkModeActive = (state) => state.ui.bulkSelection.isActive;
exports.selectIsBulkModeActive = selectIsBulkModeActive;
const selectSelectedTasks = (state) => state.ui.bulkSelection.selectedItems.tasks;
exports.selectSelectedTasks = selectSelectedTasks;
const selectSelectedJournalEntries = (state) => state.ui.bulkSelection.selectedItems.journalEntries;
exports.selectSelectedJournalEntries = selectSelectedJournalEntries;
const selectSelectedProjects = (state) => state.ui.bulkSelection.selectedItems.projects;
exports.selectSelectedProjects = selectSelectedProjects;
const selectIsTaskSelected = (taskId) => (state) => state.ui.bulkSelection.selectedItems.tasks.includes(taskId);
exports.selectIsTaskSelected = selectIsTaskSelected;
const selectIsJournalEntrySelected = (entryId) => (state) => state.ui.bulkSelection.selectedItems.journalEntries.includes(entryId);
exports.selectIsJournalEntrySelected = selectIsJournalEntrySelected;
const selectIsProjectSelected = (projectId) => (state) => state.ui.bulkSelection.selectedItems.projects.includes(projectId);
exports.selectIsProjectSelected = selectIsProjectSelected;
const selectSelectedItemsCount = (state) => {
    const { tasks, journalEntries, projects } = state.ui.bulkSelection.selectedItems;
    return tasks.length + journalEntries.length + projects.length;
};
exports.selectSelectedItemsCount = selectSelectedItemsCount;
const selectTaskSelectAllState = (state) => state.ui.bulkSelection.selectAll.tasks;
exports.selectTaskSelectAllState = selectTaskSelectAllState;
const selectJournalSelectAllState = (state) => state.ui.bulkSelection.selectAll.journalEntries;
exports.selectJournalSelectAllState = selectJournalSelectAllState;
const selectProjectSelectAllState = (state) => state.ui.bulkSelection.selectAll.projects;
exports.selectProjectSelectAllState = selectProjectSelectAllState;
exports.default = uiSlice.reducer;
