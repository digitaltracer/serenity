/**
 * Integration sync service
 * Handles syncing data from external services to tasks
 */
import { Task } from '../types';
export interface SyncResult {
    success: boolean;
    tasksCreated: number;
    tasksUpdated: number;
    errors: string[];
}
export declare class IntegrationSyncService {
    /**
     * Sync Google Calendar events to tasks
     */
    static syncGoogleCalendarEvents(accessToken: string, existingTasks: Task[], dateRange: {
        start: Date;
        end: Date;
    }, connectionDate?: string): Promise<{
        tasks: Task[];
        result: SyncResult;
    }>;
    /**
     * Sync GitHub Pull Requests from today only (across ALL user repositories)
     */
    static syncGitHubActivity(accessToken: string, repositories: string[], // This is now only used for display purposes
    existingTasks: Task[], existingProjects: any[], // Add projects array to check/create Github project
    since?: Date): Promise<{
        tasks: Task[];
        result: SyncResult;
        githubProjectId?: string;
    }>;
    /**
     * Convert Google Calendar event to task
     */
    private static convertCalendarEventToTask;
    /**
     * Convert GitHub pull request to task
     */
    private static convertPullRequestToTask;
    /**
     * Get date range for syncing (e.g., last 30 days)
     */
    static getDefaultSyncDateRange(days?: number): {
        start: Date;
        end: Date;
    };
    /**
     * Check if a task is from an integration
     */
    static isIntegrationTask(task: Task): boolean;
    /**
     * Get integration source from task tags
     */
    static getIntegrationSource(task: Task): 'google-calendar' | 'github' | null;
}
