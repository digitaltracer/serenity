/**
 * Integration sync service
 * Handles syncing data from external services to tasks
 */

import { Task } from '../types';
import { GoogleCalendarService, GoogleCalendarEvent } from './googleCalendarService';
import { GitHubService, GitHubCommit, GitHubPullRequest } from './githubService';
import { generateId } from '../utils';

export interface SyncResult {
  success: boolean;
  tasksCreated: number;
  tasksUpdated: number;
  errors: string[];
}

export class IntegrationSyncService {
  /**
   * Sync Google Calendar events to tasks
   */
  static async syncGoogleCalendarEvents(
    accessToken: string,
    existingTasks: Task[],
    dateRange: { start: Date; end: Date }
  ): Promise<{ tasks: Task[]; result: SyncResult }> {
    const result: SyncResult = {
      success: true,
      tasksCreated: 0,
      tasksUpdated: 0,
      errors: [],
    };

    try {
      // Fetch calendar events
      const events = await GoogleCalendarService.getCalendarEvents(
        accessToken,
        dateRange.start,
        dateRange.end
      );

      const syncedTasks: Task[] = [];
      const existingCalendarTasks = existingTasks.filter(task => 
        task.tags?.includes('google-calendar')
      );

      for (const event of events) {
        if (event.status === 'cancelled') {
          continue; // Skip cancelled events
        }

        try {
          const task = this.convertCalendarEventToTask(event);
          
          // Check if task already exists
          const existingTask = existingCalendarTasks.find(existing => 
            existing.tags?.includes(`calendar-event-${event.id}`)
          );

          if (existingTask) {
            // Update existing task
            const updatedTask: Task = {
              ...existingTask,
              title: task.title,
              description: task.description,
              dueDate: task.dueDate,
              updatedAt: new Date(),
            };
            syncedTasks.push(updatedTask);
            result.tasksUpdated++;
          } else {
            // Create new task
            syncedTasks.push(task);
            result.tasksCreated++;
          }
        } catch (error) {
          result.errors.push(`Failed to process event ${event.id}: ${error}`);
        }
      }

      return { tasks: syncedTasks, result };
    } catch (error) {
      result.success = false;
      result.errors.push(`Calendar sync failed: ${error}`);
      return { tasks: [], result };
    }
  }

  /**
   * Sync GitHub commits and PRs to completed tasks
   */
  static async syncGitHubActivity(
    accessToken: string,
    repositories: string[],
    existingTasks: Task[],
    since?: Date
  ): Promise<{ tasks: Task[]; result: SyncResult }> {
    const result: SyncResult = {
      success: true,
      tasksCreated: 0,
      tasksUpdated: 0,
      errors: [],
    };

    try {
      // Fetch GitHub activity
      const activity = await GitHubService.getActivitySummary(
        accessToken,
        repositories,
        since
      );

      const syncedTasks: Task[] = [];
      const existingGitHubTasks = existingTasks.filter(task => 
        task.tags?.includes('github')
      );

      // Process commits
      for (const commit of activity.commits) {
        try {
          const task = this.convertCommitToTask(commit);
          
          // Check if task already exists
          const existingTask = existingGitHubTasks.find(existing => 
            existing.tags?.includes(`commit-${commit.sha}`)
          );

          if (!existingTask) {
            syncedTasks.push(task);
            result.tasksCreated++;
          }
        } catch (error) {
          result.errors.push(`Failed to process commit ${commit.sha}: ${error}`);
        }
      }

      // Process pull requests
      for (const pr of activity.pullRequests) {
        if (pr.state !== 'closed' && pr.merged_at === null) {
          continue; // Only sync closed/merged PRs as completed tasks
        }

        try {
          const task = this.convertPullRequestToTask(pr);
          
          // Check if task already exists
          const existingTask = existingGitHubTasks.find(existing => 
            existing.tags?.includes(`pr-${pr.id}`)
          );

          if (!existingTask) {
            syncedTasks.push(task);
            result.tasksCreated++;
          }
        } catch (error) {
          result.errors.push(`Failed to process PR ${pr.id}: ${error}`);
        }
      }

      return { tasks: syncedTasks, result };
    } catch (error) {
      result.success = false;
      result.errors.push(`GitHub sync failed: ${error}`);
      return { tasks: [], result };
    }
  }

  /**
   * Convert Google Calendar event to task
   */
  private static convertCalendarEventToTask(event: GoogleCalendarEvent): Task {
    const startTime = event.start.dateTime || event.start.date;
    const endTime = event.end.dateTime || event.end.date;
    
    let dueDate: Date | undefined;
    if (startTime) {
      dueDate = new Date(startTime);
    }

    let description = event.description || '';
    if (event.location) {
      description += description ? `\n\nLocation: ${event.location}` : `Location: ${event.location}`;
    }
    description += `\n\nGoogle Calendar Event: ${event.htmlLink}`;

    return {
      id: generateId(),
      title: event.summary || 'Untitled Event',
      description,
      completed: false,
      priority: 'medium',
      dueDate,
      tags: ['google-calendar', `calendar-event-${event.id}`],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Convert GitHub commit to completed task
   */
  private static convertCommitToTask(commit: GitHubCommit): Task {
    const commitMessage = commit.commit.message.split('\n')[0]; // First line only
    const description = `${commit.commit.message}\n\nRepository: ${commit.repository.full_name}\nCommit: ${commit.html_url}`;

    return {
      id: generateId(),
      title: `Commit: ${commitMessage}`,
      description,
      completed: true, // Commits are always completed
      priority: 'low',
      dueDate: new Date(commit.commit.author.date),
      tags: ['github', 'commit', commit.repository.name, `commit-${commit.sha}`],
      createdAt: new Date(commit.commit.author.date),
      updatedAt: new Date(),
    };
  }

  /**
   * Convert GitHub pull request to completed task
   */
  private static convertPullRequestToTask(pr: GitHubPullRequest): Task {
    const description = `${pr.body || ''}\n\nRepository: ${pr.repository.full_name}\nPull Request: ${pr.html_url}`;
    const completedDate = pr.merged_at || pr.closed_at || pr.updated_at;

    return {
      id: generateId(),
      title: `PR #${pr.number}: ${pr.title}`,
      description,
      completed: true, // PRs are marked as completed when closed/merged
      priority: 'medium',
      dueDate: new Date(completedDate),
      tags: ['github', 'pull-request', pr.repository.name, `pr-${pr.id}`],
      createdAt: new Date(pr.created_at),
      updatedAt: new Date(),
    };
  }

  /**
   * Get date range for syncing (e.g., last 30 days)
   */
  static getDefaultSyncDateRange(days: number = 30): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    return { start, end };
  }

  /**
   * Check if a task is from an integration
   */
  static isIntegrationTask(task: Task): boolean {
    return task.tags?.some(tag => 
      tag === 'google-calendar' || 
      tag === 'github' || 
      tag.startsWith('calendar-event-') ||
      tag.startsWith('commit-') ||
      tag.startsWith('pr-')
    ) || false;
  }

  /**
   * Get integration source from task tags
   */
  static getIntegrationSource(task: Task): 'google-calendar' | 'github' | null {
    if (task.tags?.includes('google-calendar')) return 'google-calendar';
    if (task.tags?.includes('github')) return 'github';
    return null;
  }
}