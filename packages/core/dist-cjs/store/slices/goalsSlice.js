"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectGoalsError = exports.selectGoalsLoading = exports.selectGoalFilters = exports.selectSelectedGoalId = exports.selectReminderModalOpen = exports.selectGoalModalOpen = exports.selectFilteredGoals = exports.selectUpcomingReminders = exports.selectPendingReminders = exports.selectAllReminders = exports.selectGoalsByType = exports.selectGoalById = exports.selectCompletedGoals = exports.selectActiveGoals = exports.selectAllGoals = exports.clearGoalFilters = exports.setGoalFilters = exports.selectGoal = exports.closeReminderModal = exports.openReminderModal = exports.closeGoalModal = exports.openGoalModal = exports.snoozeReminder = exports.dismissReminder = exports.deleteReminder = exports.updateReminder = exports.addReminder = exports.updateGoalsProgress = exports.deleteGoal = exports.updateGoal = exports.addGoal = exports.setGoals = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const goalProgress_1 = require("../../utils/goalProgress");
const initialState = {
    goals: [],
    reminders: [],
    selectedGoalId: null,
    isGoalModalOpen: false,
    isReminderModalOpen: false,
    goalFilters: {
        status: 'all',
        type: 'all',
        priority: 'all',
    },
    loading: false,
    error: null,
};
const goalsSlice = (0, toolkit_1.createSlice)({
    name: 'goals',
    initialState,
    reducers: {
        setGoals: (state, action) => {
            state.goals = action.payload || [];
        },
        // Goal CRUD operations
        addGoal: (state, action) => {
            const now = new Date();
            const newGoal = {
                ...action.payload,
                id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                // Initialize with zero progress - will be calculated by updateGoalProgress
                progress: {
                    current: 0,
                    target: action.payload.config.targetCount || action.payload.config.streakDays || action.payload.config.targetRate || 1,
                    percentage: 0,
                    isCompleted: false,
                    periodStart: now,
                    periodEnd: now,
                },
                createdAt: now,
                updatedAt: now,
            };
            state.goals.push(newGoal);
        },
        updateGoal: (state, action) => {
            const { id, updates } = action.payload;
            const goalIndex = state.goals.findIndex(goal => goal.id === id);
            if (goalIndex !== -1) {
                state.goals[goalIndex] = {
                    ...state.goals[goalIndex],
                    ...updates,
                    updatedAt: new Date(),
                };
            }
        },
        deleteGoal: (state, action) => {
            state.goals = state.goals.filter(goal => goal.id !== action.payload);
            // Also remove related reminders
            state.reminders = state.reminders.filter(reminder => reminder.goalId !== action.payload);
        },
        // Auto-calculate progress for all goals based on current data
        updateGoalsProgress: (state, action) => {
            const { tasks, journalEntries, projects } = action.payload;
            state.goals.forEach((goal, index) => {
                if (goal.status === 'active') {
                    const newProgress = (0, goalProgress_1.calculateGoalProgress)(goal, { tasks, journalEntries, projects });
                    state.goals[index].progress = newProgress;
                    state.goals[index].updatedAt = new Date();
                    // Auto-complete goal if target reached
                    if (newProgress.isCompleted && goal.status === 'active') {
                        state.goals[index].status = 'completed';
                    }
                }
            });
        },
        // Reminder CRUD operations
        addReminder: (state, action) => {
            const newReminder = {
                ...action.payload,
                id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            state.reminders.push(newReminder);
        },
        updateReminder: (state, action) => {
            const { id, updates } = action.payload;
            const reminderIndex = state.reminders.findIndex(reminder => reminder.id === id);
            if (reminderIndex !== -1) {
                state.reminders[reminderIndex] = {
                    ...state.reminders[reminderIndex],
                    ...updates,
                    updatedAt: new Date(),
                };
            }
        },
        deleteReminder: (state, action) => {
            state.reminders = state.reminders.filter(reminder => reminder.id !== action.payload);
        },
        dismissReminder: (state, action) => {
            const reminderIndex = state.reminders.findIndex(reminder => reminder.id === action.payload);
            if (reminderIndex !== -1) {
                state.reminders[reminderIndex].status = 'dismissed';
                state.reminders[reminderIndex].updatedAt = new Date();
            }
        },
        snoozeReminder: (state, action) => {
            const { id, snoozeMinutes } = action.payload;
            const reminderIndex = state.reminders.findIndex(reminder => reminder.id === id);
            if (reminderIndex !== -1) {
                const newReminderDate = new Date();
                newReminderDate.setMinutes(newReminderDate.getMinutes() + snoozeMinutes);
                state.reminders[reminderIndex].reminderDate = newReminderDate;
                state.reminders[reminderIndex].status = 'snoozed';
                state.reminders[reminderIndex].updatedAt = new Date();
            }
        },
        // UI state management
        openGoalModal: (state) => {
            state.isGoalModalOpen = true;
        },
        closeGoalModal: (state) => {
            state.isGoalModalOpen = false;
            state.selectedGoalId = null;
        },
        openReminderModal: (state) => {
            state.isReminderModalOpen = true;
        },
        closeReminderModal: (state) => {
            state.isReminderModalOpen = false;
        },
        selectGoal: (state, action) => {
            state.selectedGoalId = action.payload;
        },
        // Filters
        setGoalFilters: (state, action) => {
            state.goalFilters = { ...state.goalFilters, ...action.payload };
        },
        clearGoalFilters: (state) => {
            state.goalFilters = {
                status: 'all',
                type: 'all',
                priority: 'all',
            };
        },
    },
});
_a = goalsSlice.actions, exports.setGoals = _a.setGoals, exports.addGoal = _a.addGoal, exports.updateGoal = _a.updateGoal, exports.deleteGoal = _a.deleteGoal, exports.updateGoalsProgress = _a.updateGoalsProgress, exports.addReminder = _a.addReminder, exports.updateReminder = _a.updateReminder, exports.deleteReminder = _a.deleteReminder, exports.dismissReminder = _a.dismissReminder, exports.snoozeReminder = _a.snoozeReminder, exports.openGoalModal = _a.openGoalModal, exports.closeGoalModal = _a.closeGoalModal, exports.openReminderModal = _a.openReminderModal, exports.closeReminderModal = _a.closeReminderModal, exports.selectGoal = _a.selectGoal, exports.setGoalFilters = _a.setGoalFilters, exports.clearGoalFilters = _a.clearGoalFilters;
// Selectors
const selectAllGoals = (state) => state.goals.goals;
exports.selectAllGoals = selectAllGoals;
const selectActiveGoals = (state) => state.goals.goals.filter(goal => goal.status === 'active');
exports.selectActiveGoals = selectActiveGoals;
const selectCompletedGoals = (state) => state.goals.goals.filter(goal => goal.status === 'completed');
exports.selectCompletedGoals = selectCompletedGoals;
const selectGoalById = (id) => (state) => state.goals.goals.find(goal => goal.id === id);
exports.selectGoalById = selectGoalById;
const selectGoalsByType = (type) => (state) => state.goals.goals.filter(goal => goal.type === type);
exports.selectGoalsByType = selectGoalsByType;
const selectAllReminders = (state) => state.goals.reminders;
exports.selectAllReminders = selectAllReminders;
const selectPendingReminders = (state) => state.goals.reminders.filter(reminder => reminder.status === 'pending' && new Date(reminder.reminderDate) <= new Date());
exports.selectPendingReminders = selectPendingReminders;
const selectUpcomingReminders = (state) => state.goals.reminders.filter(reminder => reminder.status === 'pending' && new Date(reminder.reminderDate) > new Date());
exports.selectUpcomingReminders = selectUpcomingReminders;
const selectFilteredGoals = (state) => {
    const { goals, goalFilters } = state.goals;
    return goals.filter(goal => {
        if (goalFilters.status !== 'all' && goal.status !== goalFilters.status)
            return false;
        if (goalFilters.type !== 'all' && goal.type !== goalFilters.type)
            return false;
        if (goalFilters.priority !== 'all' && goal.priority !== goalFilters.priority)
            return false;
        return true;
    });
};
exports.selectFilteredGoals = selectFilteredGoals;
const selectGoalModalOpen = (state) => state.goals.isGoalModalOpen;
exports.selectGoalModalOpen = selectGoalModalOpen;
const selectReminderModalOpen = (state) => state.goals.isReminderModalOpen;
exports.selectReminderModalOpen = selectReminderModalOpen;
const selectSelectedGoalId = (state) => state.goals.selectedGoalId;
exports.selectSelectedGoalId = selectSelectedGoalId;
const selectGoalFilters = (state) => state.goals.goalFilters;
exports.selectGoalFilters = selectGoalFilters;
const selectGoalsLoading = (state) => state.goals.loading;
exports.selectGoalsLoading = selectGoalsLoading;
const selectGoalsError = (state) => state.goals.error;
exports.selectGoalsError = selectGoalsError;
exports.default = goalsSlice.reducer;
