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
    dateRange: { start: Date; end: Date },
    connectionDate?: string
  ): Promise<{ tasks: Task[]; result: SyncResult }> {
    const result: SyncResult = {
      success: true,
      tasksCreated: 0,
      tasksUpdated: 0,
      errors: [],
    };

    try {
      // Use connection date as minimum start date if provided
      let effectiveStartDate = dateRange.start;
      if (connectionDate) {
        const connectionDateTime = new Date(connectionDate);
        if (connectionDateTime > dateRange.start) {
          effectiveStartDate = connectionDateTime;
        }
      }

      // Fetch calendar events from connection date forward only
      const events = await GoogleCalendarService.getCalendarEvents(
        accessToken,
        effectiveStartDate,
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
          
          // Check if task already exists by event ID (more specific check)
          const existingTask = existingCalendarTasks.find(existing => 
            existing.tags?.includes(`calendar-event-${event.id}`) ||
            existing.tags?.includes(`gcal-event-${event.id}`) // Also check old format
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
            console.log(`📝 Updated existing calendar task: ${event.summary}`);
          } else {
            // Create new task
            syncedTasks.push(task);
            result.tasksCreated++;
            console.log(`📋 Created new calendar task: ${event.summary}`);
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
   * Sync GitHub Pull Requests from today only (across ALL user repositories)
   */
  static async syncGitHubActivity(
    accessToken: string,
    repositories: string[], // This is now only used for display purposes
    existingTasks: Task[],
    existingProjects: any[], // Add projects array to check/create Github project
    since?: Date
  ): Promise<{ tasks: Task[]; result: SyncResult; githubProjectId?: string }> {
    const result: SyncResult = {
      success: true,
      tasksCreated: 0,
      tasksUpdated: 0,
      errors: [],
    };

    try {
      // Step 1: Ensure "Github" project exists, create if needed
      let githubProject = existingProjects.find(project => 
        project.name.toLowerCase() === 'github' && !project.archived
      );
      
      let githubProjectId: string | undefined;
      
      if (!githubProject) {
        // Create Github project
        const { generateId } = await import('../utils');
        githubProjectId = generateId();
        githubProject = {
          id: githubProjectId,
          name: 'Github',
          description: 'Automatically synced GitHub pull requests and issues',
          color: '#333333', // GitHub's dark color
          archived: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        console.log('📁 Created new "Github" project for synced items');
        result.errors.push('CREATED_GITHUB_PROJECT'); // Signal to caller to create project
      } else {
        githubProjectId = githubProject.id;
        console.log('📁 Using existing "Github" project:', githubProjectId);
      }

      // Get today's date range in user's local timezone (start of day to end of day)
      const today = new Date();
      const localStartOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const localEndOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

      console.log(`🕒 Using local timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
      console.log(`📅 Local "today" range: ${localStartOfDay.toLocaleString()} to ${localEndOfDay.toLocaleString()}`);

      // Fetch pull requests from today across ALL accessible repositories (owned + collaborator + org)
      console.log('🔍 Syncing GitHub PRs from ALL accessible repositories (owned + collaborator + org)...');
      const pullRequests = await GitHubService.getTodaysPullRequests(
        accessToken,
        null, // null = fetch from all repositories, not just displayed ones
        localStartOfDay,
        localEndOfDay
      );

      const syncedTasks: Task[] = [];
      const existingGitHubTasks = existingTasks.filter(task => 
        task.tags?.includes('github')
      );

      // Process only pull requests (no commits)
      for (const pr of pullRequests) {
        try {
          const task = this.convertPullRequestToTask(pr, githubProjectId);
          
          // Check if task already exists by PR ID (more specific check)
          const existingTask = existingGitHubTasks.find(existing => 
            existing.tags?.includes(`pr-${pr.id}`) ||
            existing.tags?.includes(`github-pr-${pr.id}`) // Also check old format
          );

          if (!existingTask) {
            syncedTasks.push(task);
            result.tasksCreated++;
            console.log(`📋 Created task for PR: ${pr.title} (${pr.repository.name})`);
          } else {
            console.log(`⏭️ Skipped existing PR: ${pr.title} (${pr.repository.name})`);
          }
        } catch (error) {
          result.errors.push(`Failed to process PR ${pr.id}: ${error}`);
        }
      }

      return { tasks: syncedTasks, result, githubProjectId };
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
      tags: ['google-calendar', `calendar-event-${event.id}`, `gcal-event-${event.id}`], // Add both old and new format tags
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }


  /**
   * Convert GitHub pull request to task
   */
  private static convertPullRequestToTask(pr: GitHubPullRequest, projectId?: string): Task {
    // Use PR description as task description, add repository and link info
    let description = pr.body || '';
    if (description) {
      description += '\n\n';
    }
    description += `Repository: ${pr.repository.full_name}\nPull Request: ${pr.html_url}`;

    // Determine completion status based on PR state
    const isCompleted = pr.state === 'closed' || pr.merged_at !== null;
    
    // Set due date to today for better organization
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    return {
      id: generateId(),
      title: pr.title, // Use PR title directly, no prefix
      description,
      completed: isCompleted, // Open PRs are incomplete, closed/merged are complete
      priority: 'medium',
      dueDate: today, // Always set to today for GitHub items
      projectId: projectId, // Assign to Github project
      tags: ['github', 'pull-request', pr.repository.name, `pr-${pr.id}`, `github-pr-${pr.id}`], // Add both old and new format tags
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