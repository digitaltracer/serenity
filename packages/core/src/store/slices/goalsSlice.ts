import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Goal, Reminder, Task, JournalEntry, Project } from '../../types';
import { calculateGoalProgress } from '../../utils/goalProgress';

export interface GoalsState {
  goals: Goal[];
  reminders: Reminder[];
  selectedGoalId: string | null;
  isGoalModalOpen: boolean;
  isReminderModalOpen: boolean;
  goalFilters: {
    status: 'all' | 'active' | 'completed' | 'paused' | 'failed';
    type: 'all' | 'weekly_tasks' | 'project_tasks' | 'priority_tasks' | 'daily_streak' | 'journal_weekly' | 'completion_rate';
    priority: 'all' | 'high' | 'medium' | 'low';
  };
  loading: boolean;
  error: string | null;
}


const initialState: GoalsState = {
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

const goalsSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
    setGoals: (state, action: PayloadAction<Goal[]>) => {
      state.goals = action.payload || [];
    },
    // Goal CRUD operations
    addGoal: (state, action: PayloadAction<Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'progress'>>) => {
      const now = new Date();
      const newGoal: Goal = {
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

    updateGoal: (state, action: PayloadAction<{ id: string; updates: Partial<Goal> }>) => {
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

    deleteGoal: (state, action: PayloadAction<string>) => {
      state.goals = state.goals.filter(goal => goal.id !== action.payload);
      // Also remove related reminders
      state.reminders = state.reminders.filter(reminder => reminder.goalId !== action.payload);
    },

    // Auto-calculate progress for all goals based on current data
    updateGoalsProgress: (state, action: PayloadAction<{ tasks: Task[]; journalEntries: JournalEntry[]; projects: Project[] }>) => {
      const { tasks, journalEntries, projects } = action.payload;
      
      state.goals.forEach((goal, index) => {
        if (goal.status === 'active') {
          const newProgress = calculateGoalProgress(goal, { tasks, journalEntries, projects });
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
    addReminder: (state, action: PayloadAction<Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const newReminder: Reminder = {
        ...action.payload,
        id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      state.reminders.push(newReminder);
    },

    updateReminder: (state, action: PayloadAction<{ id: string; updates: Partial<Reminder> }>) => {
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

    deleteReminder: (state, action: PayloadAction<string>) => {
      state.reminders = state.reminders.filter(reminder => reminder.id !== action.payload);
    },

    dismissReminder: (state, action: PayloadAction<string>) => {
      const reminderIndex = state.reminders.findIndex(reminder => reminder.id === action.payload);
      if (reminderIndex !== -1) {
        state.reminders[reminderIndex].status = 'dismissed';
        state.reminders[reminderIndex].updatedAt = new Date();
      }
    },

    snoozeReminder: (state, action: PayloadAction<{ id: string; snoozeMinutes: number }>) => {
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

    selectGoal: (state, action: PayloadAction<string>) => {
      state.selectedGoalId = action.payload;
    },

    // Filters
    setGoalFilters: (state, action: PayloadAction<Partial<GoalsState['goalFilters']>>) => {
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

export const {
  setGoals,
  addGoal,
  updateGoal,
  deleteGoal,
  updateGoalsProgress,
  addReminder,
  updateReminder,
  deleteReminder,
  dismissReminder,
  snoozeReminder,
  openGoalModal,
  closeGoalModal,
  openReminderModal,
  closeReminderModal,
  selectGoal,
  setGoalFilters,
  clearGoalFilters,
} = goalsSlice.actions;

// Selectors
export const selectAllGoals = (state: { goals: GoalsState }) => state.goals.goals;
export const selectActiveGoals = (state: { goals: GoalsState }) => 
  state.goals.goals.filter(goal => goal.status === 'active');
export const selectCompletedGoals = (state: { goals: GoalsState }) => 
  state.goals.goals.filter(goal => goal.status === 'completed');
export const selectGoalById = (id: string) => (state: { goals: GoalsState }) =>
  state.goals.goals.find(goal => goal.id === id);
export const selectGoalsByType = (type: Goal['type']) => (state: { goals: GoalsState }) =>
  state.goals.goals.filter(goal => goal.type === type);

export const selectAllReminders = (state: { goals: GoalsState }) => state.goals.reminders;
export const selectPendingReminders = (state: { goals: GoalsState }) => 
  state.goals.reminders.filter(reminder => 
    reminder.status === 'pending' && new Date(reminder.reminderDate) <= new Date()
  );
export const selectUpcomingReminders = (state: { goals: GoalsState }) => 
  state.goals.reminders.filter(reminder => 
    reminder.status === 'pending' && new Date(reminder.reminderDate) > new Date()
  );

export const selectFilteredGoals = (state: { goals: GoalsState }) => {
  const { goals, goalFilters } = state.goals;
  
  return goals.filter(goal => {
    if (goalFilters.status !== 'all' && goal.status !== goalFilters.status) return false;
    if (goalFilters.type !== 'all' && goal.type !== goalFilters.type) return false;
    if (goalFilters.priority !== 'all' && goal.priority !== goalFilters.priority) return false;
    return true;
  });
};

export const selectGoalModalOpen = (state: { goals: GoalsState }) => state.goals.isGoalModalOpen;
export const selectReminderModalOpen = (state: { goals: GoalsState }) => state.goals.isReminderModalOpen;
export const selectSelectedGoalId = (state: { goals: GoalsState }) => state.goals.selectedGoalId;
export const selectGoalFilters = (state: { goals: GoalsState }) => state.goals.goalFilters;
export const selectGoalsLoading = (state: { goals: GoalsState }) => state.goals.loading;
export const selectGoalsError = (state: { goals: GoalsState }) => state.goals.error;

export default goalsSlice.reducer;
