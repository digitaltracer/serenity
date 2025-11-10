import { Goal, Task, JournalEntry, Project } from '../types';
/**
 * Auto-Progress Calculation Utilities for Goals
 * Calculates goal progress based on actual app data
 */
interface ProgressCalculationData {
    tasks: Task[];
    journalEntries: JournalEntry[];
    projects: Project[];
}
interface GoalProgress {
    current: number;
    target: number;
    percentage: number;
    isCompleted: boolean;
    periodStart: Date;
    periodEnd: Date;
}
/**
 * Calculate the current period (start and end dates) based on timeframe
 */
export declare function getCurrentPeriod(timeframe: 'daily' | 'weekly' | 'monthly', customStart?: Date): {
    start: Date;
    end: Date;
};
/**
 * Main function to calculate goal progress based on goal type
 */
export declare function calculateGoalProgress(goal: Goal, data: ProgressCalculationData): GoalProgress;
/**
 * Get human-readable goal type label
 */
export declare function getGoalTypeLabel(type: Goal['type']): string;
/**
 * Get human-readable goal description based on config
 */
export declare function getGoalDescription(goal: Goal, projects?: Project[]): string;
export {};
