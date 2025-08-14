import { Goal, Reminder, Task, JournalEntry, Project } from '../../types';
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
export declare const addGoal: import("@reduxjs/toolkit").ActionCreatorWithPayload<Omit<Goal, "id" | "createdAt" | "updatedAt" | "progress">, "goals/addGoal">, updateGoal: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    id: string;
    updates: Partial<Goal>;
}, "goals/updateGoal">, deleteGoal: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "goals/deleteGoal">, updateGoalsProgress: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    tasks: Task[];
    journalEntries: JournalEntry[];
    projects: Project[];
}, "goals/updateGoalsProgress">, addReminder: import("@reduxjs/toolkit").ActionCreatorWithPayload<Omit<Reminder, "id" | "createdAt" | "updatedAt">, "goals/addReminder">, updateReminder: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    id: string;
    updates: Partial<Reminder>;
}, "goals/updateReminder">, deleteReminder: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "goals/deleteReminder">, dismissReminder: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "goals/dismissReminder">, snoozeReminder: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    id: string;
    snoozeMinutes: number;
}, "goals/snoozeReminder">, openGoalModal: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"goals/openGoalModal">, closeGoalModal: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"goals/closeGoalModal">, openReminderModal: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"goals/openReminderModal">, closeReminderModal: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"goals/closeReminderModal">, selectGoal: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "goals/selectGoal">, setGoalFilters: import("@reduxjs/toolkit").ActionCreatorWithPayload<Partial<{
    status: "all" | "active" | "completed" | "paused" | "failed";
    type: "all" | "weekly_tasks" | "project_tasks" | "priority_tasks" | "daily_streak" | "journal_weekly" | "completion_rate";
    priority: "all" | "high" | "medium" | "low";
}>, "goals/setGoalFilters">, clearGoalFilters: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"goals/clearGoalFilters">;
export declare const selectAllGoals: (state: {
    goals: GoalsState;
}) => Goal[];
export declare const selectActiveGoals: (state: {
    goals: GoalsState;
}) => Goal[];
export declare const selectCompletedGoals: (state: {
    goals: GoalsState;
}) => Goal[];
export declare const selectGoalById: (id: string) => (state: {
    goals: GoalsState;
}) => Goal | undefined;
export declare const selectGoalsByType: (type: Goal["type"]) => (state: {
    goals: GoalsState;
}) => Goal[];
export declare const selectAllReminders: (state: {
    goals: GoalsState;
}) => Reminder[];
export declare const selectPendingReminders: (state: {
    goals: GoalsState;
}) => Reminder[];
export declare const selectUpcomingReminders: (state: {
    goals: GoalsState;
}) => Reminder[];
export declare const selectFilteredGoals: (state: {
    goals: GoalsState;
}) => Goal[];
export declare const selectGoalModalOpen: (state: {
    goals: GoalsState;
}) => boolean;
export declare const selectReminderModalOpen: (state: {
    goals: GoalsState;
}) => boolean;
export declare const selectSelectedGoalId: (state: {
    goals: GoalsState;
}) => string | null;
export declare const selectGoalFilters: (state: {
    goals: GoalsState;
}) => {
    status: "all" | "active" | "completed" | "paused" | "failed";
    type: "all" | "weekly_tasks" | "project_tasks" | "priority_tasks" | "daily_streak" | "journal_weekly" | "completion_rate";
    priority: "all" | "high" | "medium" | "low";
};
export declare const selectGoalsLoading: (state: {
    goals: GoalsState;
}) => boolean;
export declare const selectGoalsError: (state: {
    goals: GoalsState;
}) => string | null;
declare const _default: import("redux").Reducer<GoalsState>;
export default _default;
//# sourceMappingURL=goalsSlice.d.ts.map