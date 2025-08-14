import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  addTask,
  addProject,
  updateGoogleCalendarLastSync,
  updateGitHubLastSync,
  IntegrationSyncService,
  GitHubService,
  persistIntegrationsState,
  setSyncing,
  clearSyncError,
  setSyncError,
} from '@serenity/core';

interface UseSyncNowParams {
  googleCalendar: any;
  github: any;
  tasks: any[];
  projects: any[];
  sessionMasterPassword?: string;
  showSuccess: (t: string, m: string) => void;
}

export const useSyncNow = ({
  googleCalendar,
  github,
  tasks,
  projects,
  sessionMasterPassword,
  showSuccess,
}: UseSyncNowParams) => {
  const dispatch = useDispatch();

  const handleSyncNow = useCallback(async () => {
    dispatch(setSyncing(true));
    dispatch(clearSyncError());

    try {
      let totalTasksCreated = 0;

      if (googleCalendar.connected && googleCalendar.syncEnabled && googleCalendar.accessToken) {
        try {
          const dateRange = IntegrationSyncService.getDefaultSyncDateRange(7);
          const { tasks: calendarTasks } = await IntegrationSyncService.syncGoogleCalendarEvents(
            googleCalendar.accessToken,
            tasks,
            dateRange,
            googleCalendar.connectionDate
          );
          calendarTasks.forEach((task: any) => {
            dispatch(addTask(task));
            totalTasksCreated++;
          });
          dispatch(updateGoogleCalendarLastSync(new Date().toISOString()));
        } catch (error) {
          console.error('Google Calendar sync failed:', error);
        }
      }

      if (github.connected && github.syncEnabled && github.tokens.length > 0) {
        try {
          const activeTokens = github.tokens.filter((token: any) => token.isActive);
          if (activeTokens.length > 0) {
            const now = new Date();
            const twoWeeksAgo = new Date(now);
            twoWeeksAgo.setDate(now.getDate() - 14);
            const tokenLastSyncs = activeTokens
              .map((t: any) => (t.lastSync ? new Date(t.lastSync) : null))
              .filter((d: any): d is Date => !!d);
            const globalLastSync = github.lastSync ? new Date(github.lastSync) : null;
            const allCandidates = [...tokenLastSyncs, globalLastSync].filter((d: any): d is Date => !!d);
            const since = allCandidates.length > 0 ? new Date(Math.min(...allCandidates.map((d: Date) => d.getTime()))) : twoWeeksAgo;
            const startOfDay = new Date(since);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(now);
            endOfDay.setHours(23, 59, 59, 999);

            const pullRequests = await GitHubService.getTodaysPullRequestsMultiToken(
              activeTokens.map((token: any) => ({ id: token.id, token: token.token, username: token.username, isActive: token.isActive })),
              startOfDay,
              endOfDay
            );

            let githubProject = projects.find((project: any) => project.name.toLowerCase() === 'github' && !project.archived);
            if (!githubProject) {
              const newGithubProject = {
                id: `github_project_${Date.now()}`,
                name: 'Github',
                description: 'Automatically synced GitHub pull requests and issues',
                color: '#333333',
                archived: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              dispatch(addProject(newGithubProject));
              githubProject = newGithubProject;
            }

            const existingGithubTasks = tasks.filter((task: any) => task.tags?.includes('github'));
            const uniqueById = new Map<string, any>();
            pullRequests.forEach((pr: any) => uniqueById.set(String(pr.id), pr));

            Array.from(uniqueById.values()).forEach((pr: any) => {
              const existingTask = existingGithubTasks.find(
                (existing: any) =>
                  existing.tags?.includes(`pr-${pr.id}`) ||
                  existing.tags?.includes(`github-pr-${pr.id}`) ||
                  existing.id === `github_pr_${pr.id}`
              );
              if (!existingTask) {
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                const task = {
                  id: `github_pr_${pr.id}`,
                  title: pr.title,
                  description: `${pr.body || 'No description'}\n\nRepository: ${pr.repository.full_name}\nPull Request: ${pr.html_url}`,
                  completed: pr.state === 'closed' || pr.state === 'merged',
                  priority: 'medium' as const,
                  tags: ['github', 'pull-request', pr.repository.name, `pr-${pr.id}`, `github-pr-${pr.id}`],
                  projectId: githubProject.id,
                  createdAt: new Date(pr.created_at),
                  updatedAt: new Date(),
                  dueDate: today,
                  subtasks: [],
                };
                dispatch(addTask(task));
                totalTasksCreated++;
              }
            });

            dispatch(updateGitHubLastSync(new Date().toISOString()));
          }
        } catch (error) {
          console.error('GitHub multi-token sync failed:', error);
        }
      }

      if (
        sessionMasterPassword &&
        ((googleCalendar.connected && googleCalendar.syncEnabled) || (github.connected && github.syncEnabled))
      ) {
        try {
          await (dispatch as any)(persistIntegrationsState(sessionMasterPassword));
        } catch (error) {
          console.warn('Failed to persist integration timestamps:', error);
        }
      }

      showSuccess('Sync Complete', `${totalTasksCreated} new task(s) created`);
    } catch (error: any) {
      dispatch(setSyncError(String(error)));
    } finally {
      dispatch(setSyncing(false));
    }
  }, [
    dispatch,
    googleCalendar,
    github,
    tasks,
    projects,
    sessionMasterPassword,
    showSuccess,
  ]);

  return { handleSyncNow };
};


