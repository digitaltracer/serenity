"use strict";
/**
 * Actionability Service
 * Generates concrete, actionable suggestions from AI insights
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionabilityService = void 0;
const store_1 = require("../store");
const logger_1 = require("../utils/logger");
class ActionabilityService {
    /**
     * Analyze an insight and generate actionable suggestions
     */
    static generateSuggestions(insight, userContext) {
        logger_1.logger.info('Generating actionability suggestions', {
            component: 'ActionabilityService',
            operation: 'generateSuggestions',
            metadata: { insightId: insight.id, insightType: insight.type }
        });
        const suggestions = [];
        // Check if insight is actionable
        if (!this.isActionable(insight)) {
            return suggestions;
        }
        // Generate suggestions based on insight type and category
        switch (insight.type) {
            case 'productivity':
                suggestions.push(...this.generateProductivitySuggestions(insight, userContext));
                break;
            case 'behavior':
                suggestions.push(...this.generateBehaviorSuggestions(insight, userContext));
                break;
            case 'recommendation':
                suggestions.push(...this.generateRecommendationSuggestions(insight, userContext));
                break;
            case 'warning':
                suggestions.push(...this.generateWarningSuggestions(insight, userContext));
                break;
        }
        // Deduplicate suggestions
        return this.deduplicateSuggestions(suggestions);
    }
    /**
     * Check if an insight is actionable based on type and content
     */
    static isActionable(insight) {
        // Explicitly marked as actionable
        if (insight.actionable === true) {
            return true;
        }
        // Recommendations and warnings are generally actionable
        if (insight.type === 'recommendation' || insight.type === 'warning') {
            return true;
        }
        // Productivity insights about patterns are actionable
        if (insight.type === 'productivity' && insight.category === 'tasks') {
            return true;
        }
        // Behavior insights can be actionable if they suggest changes
        if (insight.type === 'behavior') {
            const actionKeywords = ['should', 'try', 'consider', 'recommend', 'suggest', 'could'];
            const hasActionKeyword = actionKeywords.some(keyword => insight.description.toLowerCase().includes(keyword));
            return hasActionKeyword;
        }
        return false;
    }
    /**
     * Convert a suggestion into a concrete action (e.g., create task)
     */
    static async executeSuggestion(suggestion, dispatch) {
        try {
            logger_1.logger.info('Executing actionability suggestion', {
                component: 'ActionabilityService',
                operation: 'executeSuggestion',
                metadata: { suggestionId: suggestion.id, type: suggestion.type }
            });
            switch (suggestion.type) {
                case 'task':
                    return await this.executeTaskSuggestion(suggestion, dispatch);
                case 'goal':
                    return await this.executeGoalSuggestion(suggestion, dispatch);
                case 'habit':
                    return await this.executeHabitSuggestion(suggestion, dispatch);
                case 'journal_prompt':
                    return await this.executeJournalPromptSuggestion(suggestion, dispatch);
                default:
                    return { success: false, error: 'Unknown suggestion type' };
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to execute suggestion', {
                component: 'ActionabilityService',
                operation: 'executeSuggestion'
            }, error);
            return { success: false, error: error.message };
        }
    }
    // =====================================================================
    // Private Helper Methods
    // =====================================================================
    static generateProductivitySuggestions(insight, userContext) {
        const suggestions = [];
        // Pattern: "You complete more tasks in the morning"
        if (insight.description.toLowerCase().includes('morning') &&
            insight.description.toLowerCase().includes('complete')) {
            suggestions.push({
                id: `${insight.id}_morning_block`,
                action: 'Block morning time for focused work',
                description: 'Schedule 2 hours each morning for your most important tasks',
                type: 'habit',
                priority: 'high',
                metadata: {
                    suggestedTitle: 'Morning Focus Block',
                    suggestedDescription: 'Dedicate 2 hours each morning to high-priority tasks',
                    suggestedTags: ['productivity', 'habit'],
                }
            });
        }
        // Pattern: "X overdue tasks"
        const overdueMatch = insight.description.match(/(\d+)\s+overdue/i);
        if (overdueMatch) {
            const count = parseInt(overdueMatch[1]);
            suggestions.push({
                id: `${insight.id}_review_overdue`,
                action: 'Review overdue tasks',
                description: `Review and reschedule ${count} overdue task${count > 1 ? 's' : ''}`,
                type: 'task',
                priority: 'high',
                metadata: {
                    suggestedTitle: 'Review Overdue Tasks',
                    suggestedDescription: `Reschedule or complete ${count} overdue tasks`,
                    suggestedTags: ['review', 'overdue'],
                    suggestedDueDate: new Date().toISOString(),
                }
            });
        }
        // Pattern: Low task completion rate
        if (insight.description.toLowerCase().includes('completion rate') &&
            (insight.description.toLowerCase().includes('low') ||
                insight.description.toLowerCase().includes('decreased'))) {
            suggestions.push({
                id: `${insight.id}_review_tasks`,
                action: 'Review task workload',
                description: 'Assess if tasks are too ambitious or need to be broken down',
                type: 'task',
                priority: 'medium',
                metadata: {
                    suggestedTitle: 'Review Task Workload',
                    suggestedDescription: 'Evaluate current tasks and break down large tasks into smaller ones',
                    suggestedTags: ['review', 'planning'],
                }
            });
        }
        return suggestions;
    }
    static generateBehaviorSuggestions(insight, userContext) {
        const suggestions = [];
        // Pattern: Haven't journaled in X days
        const journalMatch = insight.description.match(/haven'?t.*journal.*?(\d+)\s+days?/i);
        if (journalMatch) {
            suggestions.push({
                id: `${insight.id}_journal_entry`,
                action: 'Write a journal entry',
                description: 'Take time to reflect on your recent experiences',
                type: 'journal_prompt',
                priority: 'medium',
                metadata: {
                    suggestedTitle: 'Daily Reflection',
                    suggestedDescription: 'What happened today? How do you feel?',
                    suggestedTags: ['reflection', 'journal'],
                }
            });
        }
        // Pattern: Consistent pattern detected
        if (insight.description.toLowerCase().includes('consistently') ||
            insight.description.toLowerCase().includes('pattern')) {
            suggestions.push({
                id: `${insight.id}_build_habit`,
                action: 'Create a habit tracker',
                description: 'Turn this pattern into a tracked habit',
                type: 'habit',
                priority: 'low',
                metadata: {
                    suggestedTitle: 'New Habit Tracker',
                    suggestedDescription: insight.title,
                    suggestedTags: ['habit', 'pattern'],
                }
            });
        }
        return suggestions;
    }
    static generateRecommendationSuggestions(insight, userContext) {
        const suggestions = [];
        // Recommendations are generally actionable - create a task
        suggestions.push({
            id: `${insight.id}_implement`,
            action: 'Implement this recommendation',
            description: insight.description,
            type: 'task',
            priority: insight.metadata?.priority || 'medium',
            metadata: {
                suggestedTitle: insight.title,
                suggestedDescription: insight.description,
                suggestedTags: ['ai-recommendation', ...(insight.metadata?.tags || [])],
            }
        });
        // If it's about goals, suggest creating a goal
        if (insight.category === 'goals' || insight.description.toLowerCase().includes('goal')) {
            suggestions.push({
                id: `${insight.id}_set_goal`,
                action: 'Set this as a goal',
                description: 'Track progress on this recommendation',
                type: 'goal',
                priority: 'medium',
                metadata: {
                    suggestedTitle: insight.title,
                    suggestedDescription: insight.description,
                    suggestedTags: ['ai-recommendation'],
                }
            });
        }
        return suggestions;
    }
    static generateWarningSuggestions(insight, userContext) {
        const suggestions = [];
        // Warnings require immediate attention - high priority task
        suggestions.push({
            id: `${insight.id}_address`,
            action: 'Address this warning',
            description: insight.description,
            type: 'task',
            priority: 'high',
            metadata: {
                suggestedTitle: `⚠️ ${insight.title}`,
                suggestedDescription: insight.description,
                suggestedTags: ['warning', 'urgent', ...(insight.metadata?.tags || [])],
                suggestedDueDate: new Date().toISOString(), // Due today
            }
        });
        return suggestions;
    }
    static deduplicateSuggestions(suggestions) {
        const seen = new Set();
        return suggestions.filter(suggestion => {
            const key = `${suggestion.type}_${suggestion.action}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
    static async executeTaskSuggestion(suggestion, dispatch) {
        const now = new Date();
        const task = {
            id: `task_${Date.now()}`,
            title: suggestion.metadata?.suggestedTitle || suggestion.action,
            description: suggestion.metadata?.suggestedDescription || suggestion.description,
            completed: false,
            tags: suggestion.metadata?.suggestedTags || [],
            priority: suggestion.priority,
            createdAt: now,
            updatedAt: now,
        };
        if (suggestion.metadata?.suggestedDueDate) {
            task.dueDate = new Date(suggestion.metadata.suggestedDueDate);
        }
        dispatch((0, store_1.addTask)(task));
        logger_1.logger.info('Task created from suggestion', {
            component: 'ActionabilityService',
            operation: 'executeTaskSuggestion',
            metadata: { taskId: task.id }
        });
        return { success: true, actionId: task.id };
    }
    static async executeGoalSuggestion(suggestion, dispatch) {
        const now = new Date();
        const targetCount = suggestion.metadata?.suggestedTargetValue || 10;
        const goal = {
            id: `goal_${Date.now()}`,
            title: suggestion.metadata?.suggestedTitle || suggestion.action,
            description: suggestion.metadata?.suggestedDescription || suggestion.description,
            type: 'weekly_tasks', // Default type
            status: 'active',
            priority: suggestion.priority,
            config: {
                targetCount,
                timeframe: 'weekly',
            },
            progress: {
                current: 0,
                target: targetCount,
                percentage: 0,
                isCompleted: false,
                periodStart: now,
                periodEnd: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week
            },
            reminders: [],
            createdAt: now,
            updatedAt: now,
        };
        dispatch((0, store_1.addGoal)(goal));
        logger_1.logger.info('Goal created from suggestion', {
            component: 'ActionabilityService',
            operation: 'executeGoalSuggestion',
            metadata: { goalId: goal.id }
        });
        return { success: true, actionId: goal.id };
    }
    static async executeHabitSuggestion(suggestion, dispatch) {
        // For now, create a recurring task as a habit
        // In the future, this could use a dedicated habits system
        const now = new Date();
        const task = {
            id: `habit_${Date.now()}`,
            title: suggestion.metadata?.suggestedTitle || suggestion.action,
            description: suggestion.metadata?.suggestedDescription || suggestion.description,
            completed: false,
            tags: [...(suggestion.metadata?.suggestedTags || []), 'habit'],
            priority: suggestion.priority,
            recurring: {
                type: 'daily',
                interval: 1,
            },
            createdAt: now,
            updatedAt: now,
        };
        dispatch((0, store_1.addTask)(task));
        logger_1.logger.info('Habit (recurring task) created from suggestion', {
            component: 'ActionabilityService',
            operation: 'executeHabitSuggestion',
            metadata: { taskId: task.id }
        });
        return { success: true, actionId: task.id };
    }
    static async executeJournalPromptSuggestion(suggestion, dispatch) {
        // Create a task to remind the user to journal
        const now = new Date();
        const task = {
            id: `journal_${Date.now()}`,
            title: suggestion.metadata?.suggestedTitle || 'Write a journal entry',
            description: suggestion.metadata?.suggestedDescription || suggestion.description,
            completed: false,
            tags: [...(suggestion.metadata?.suggestedTags || []), 'journal'],
            priority: suggestion.priority,
            dueDate: now, // Due today
            createdAt: now,
            updatedAt: now,
        };
        dispatch((0, store_1.addTask)(task));
        logger_1.logger.info('Journal prompt task created from suggestion', {
            component: 'ActionabilityService',
            operation: 'executeJournalPromptSuggestion',
            metadata: { taskId: task.id }
        });
        return { success: true, actionId: task.id };
    }
}
exports.ActionabilityService = ActionabilityService;
