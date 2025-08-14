"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentPeriod = getCurrentPeriod;
exports.calculateGoalProgress = calculateGoalProgress;
exports.getGoalTypeLabel = getGoalTypeLabel;
exports.getGoalDescription = getGoalDescription;
/**
 * Calculate the current period (start and end dates) based on timeframe
 */
function getCurrentPeriod(timeframe, customStart) {
    const now = customStart || new Date();
    const start = new Date(now);
    const end = new Date(now);
    switch (timeframe) {
        case 'daily':
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case 'weekly':
            // Start from Sunday of current week
            const dayOfWeek = start.getDay();
            start.setDate(start.getDate() - dayOfWeek);
            start.setHours(0, 0, 0, 0);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            break;
        case 'monthly':
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            end.setMonth(end.getMonth() + 1, 0); // Last day of current month
            end.setHours(23, 59, 59, 999);
            break;
    }
    return { start, end };
}
/**
 * Calculate progress for weekly_tasks goal type
 */
function calculateWeeklyTasksProgress(goal, data) {
    const { start, end } = getCurrentPeriod(goal.config.timeframe);
    const target = goal.config.targetCount || 0;
    const completedTasks = data.tasks.filter(task => {
        if (!task.completed || !task.updatedAt)
            return false;
        const completionDate = new Date(task.updatedAt);
        return completionDate >= start && completionDate <= end;
    });
    const current = completedTasks.length;
    const percentage = target > 0 ? Math.round((current / target) * 100) : 0;
    return {
        current,
        target,
        percentage,
        isCompleted: current >= target,
        periodStart: start,
        periodEnd: end,
    };
}
/**
 * Calculate progress for project_tasks goal type
 */
function calculateProjectTasksProgress(goal, data) {
    const { start, end } = getCurrentPeriod(goal.config.timeframe);
    const target = goal.config.targetCount || 0;
    const projectId = goal.config.projectId;
    const completedTasks = data.tasks.filter(task => {
        if (!task.completed || !task.updatedAt)
            return false;
        if (projectId && task.projectId !== projectId)
            return false;
        const completionDate = new Date(task.updatedAt);
        return completionDate >= start && completionDate <= end;
    });
    const current = completedTasks.length;
    const percentage = target > 0 ? Math.round((current / target) * 100) : 0;
    return {
        current,
        target,
        percentage,
        isCompleted: current >= target,
        periodStart: start,
        periodEnd: end,
    };
}
/**
 * Calculate progress for priority_tasks goal type
 */
function calculatePriorityTasksProgress(goal, data) {
    const { start, end } = getCurrentPeriod(goal.config.timeframe);
    const priority = goal.config.priority;
    // Find all tasks with the specified priority in the period
    const priorityTasks = data.tasks.filter(task => {
        const createdDate = new Date(task.createdAt);
        return task.priority === priority && createdDate >= start && createdDate <= end;
    });
    const completedPriorityTasks = priorityTasks.filter(task => {
        if (!task.completed || !task.updatedAt)
            return false;
        const completionDate = new Date(task.updatedAt);
        return completionDate >= start && completionDate <= end;
    });
    const target = priorityTasks.length;
    const current = completedPriorityTasks.length;
    const percentage = target > 0 ? Math.round((current / target) * 100) : 0;
    return {
        current,
        target,
        percentage,
        isCompleted: current >= target,
        periodStart: start,
        periodEnd: end,
    };
}
/**
 * Calculate progress for daily_streak goal type
 */
function calculateDailyStreakProgress(goal, data) {
    const targetDays = goal.config.streakDays || 7;
    const today = new Date();
    // Check each day backwards from today
    let currentStreak = 0;
    let checkDate = new Date(today);
    for (let i = 0; i < targetDays + 10; i++) { // Check a few extra days to find actual streak
        const dateKey = checkDate.toISOString().split('T')[0];
        const hasTasksOnDay = data.tasks.some(task => {
            if (!task.completed || !task.updatedAt)
                return false;
            const completionDate = new Date(task.updatedAt);
            return completionDate.toISOString().split('T')[0] === dateKey;
        });
        if (hasTasksOnDay) {
            currentStreak++;
        }
        else if (i > 0) { // Don't break on first day (today might not have tasks yet)
            break;
        }
        checkDate.setDate(checkDate.getDate() - 1);
    }
    const percentage = Math.round((currentStreak / targetDays) * 100);
    return {
        current: currentStreak,
        target: targetDays,
        percentage,
        isCompleted: currentStreak >= targetDays,
        periodStart: new Date(today.getTime() - (targetDays - 1) * 24 * 60 * 60 * 1000),
        periodEnd: today,
    };
}
/**
 * Calculate progress for journal_weekly goal type
 */
function calculateJournalWeeklyProgress(goal, data) {
    const { start, end } = getCurrentPeriod(goal.config.timeframe);
    const target = goal.config.targetCount || 0;
    const journalEntriesInPeriod = data.journalEntries.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        return entryDate >= start && entryDate <= end;
    });
    const current = journalEntriesInPeriod.length;
    const percentage = target > 0 ? Math.round((current / target) * 100) : 0;
    return {
        current,
        target,
        percentage,
        isCompleted: current >= target,
        periodStart: start,
        periodEnd: end,
    };
}
/**
 * Calculate progress for completion_rate goal type
 */
function calculateCompletionRateProgress(goal, data) {
    const { start, end } = getCurrentPeriod(goal.config.timeframe);
    const targetRate = goal.config.targetRate || 80;
    // Find all tasks created in the period
    const tasksInPeriod = data.tasks.filter(task => {
        const createdDate = new Date(task.createdAt);
        return createdDate >= start && createdDate <= end;
    });
    const completedTasksInPeriod = tasksInPeriod.filter(task => {
        if (!task.completed)
            return false;
        const completionDate = new Date(task.updatedAt);
        return completionDate >= start && completionDate <= end;
    });
    const actualRate = tasksInPeriod.length > 0
        ? Math.round((completedTasksInPeriod.length / tasksInPeriod.length) * 100)
        : 0;
    return {
        current: actualRate,
        target: targetRate,
        percentage: Math.round((actualRate / targetRate) * 100),
        isCompleted: actualRate >= targetRate,
        periodStart: start,
        periodEnd: end,
    };
}
/**
 * Main function to calculate goal progress based on goal type
 */
function calculateGoalProgress(goal, data) {
    switch (goal.type) {
        case 'weekly_tasks':
            return calculateWeeklyTasksProgress(goal, data);
        case 'project_tasks':
            return calculateProjectTasksProgress(goal, data);
        case 'priority_tasks':
            return calculatePriorityTasksProgress(goal, data);
        case 'daily_streak':
            return calculateDailyStreakProgress(goal, data);
        case 'journal_weekly':
            return calculateJournalWeeklyProgress(goal, data);
        case 'completion_rate':
            return calculateCompletionRateProgress(goal, data);
        default:
            // Fallback for unknown goal types
            return {
                current: 0,
                target: 1,
                percentage: 0,
                isCompleted: false,
                periodStart: new Date(),
                periodEnd: new Date(),
            };
    }
}
/**
 * Get human-readable goal type label
 */
function getGoalTypeLabel(type) {
    switch (type) {
        case 'weekly_tasks': return 'Weekly Tasks';
        case 'project_tasks': return 'Project Tasks';
        case 'priority_tasks': return 'Priority Tasks';
        case 'daily_streak': return 'Daily Streak';
        case 'journal_weekly': return 'Journal Weekly';
        case 'completion_rate': return 'Completion Rate';
        default: return 'Custom Goal';
    }
}
/**
 * Get human-readable goal description based on config
 */
function getGoalDescription(goal, projects) {
    const { type, config } = goal;
    switch (type) {
        case 'weekly_tasks':
            return `Complete ${config.targetCount} tasks ${config.timeframe}`;
        case 'project_tasks':
            const project = projects?.find(p => p.id === config.projectId);
            const projectName = project?.name || 'selected project';
            return `Complete ${config.targetCount} tasks in ${projectName} ${config.timeframe}`;
        case 'priority_tasks':
            return `Complete all ${config.priority}-priority tasks ${config.timeframe}`;
        case 'daily_streak':
            return `Complete at least 1 task daily for ${config.streakDays} consecutive days`;
        case 'journal_weekly':
            return `Write ${config.targetCount} journal entries ${config.timeframe}`;
        case 'completion_rate':
            return `Maintain ${config.targetRate}% task completion rate ${config.timeframe}`;
        default:
            return goal.description || 'Custom goal';
    }
}
