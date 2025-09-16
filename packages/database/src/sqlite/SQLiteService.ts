/**
 * SQLite Database Service for Serenity Notes
 * Main service that coordinates all SQLite operations
 */

import { SQLiteAdapter } from '../adapters/SQLiteAdapter';
import { SQLiteTaskQueries } from '../queries/sqlite/tasks';
import { SQLiteProjectQueries } from '../queries/sqlite/projects';
import { SQLiteJournalQueries } from '../queries/sqlite/journal';
import { SQLiteAIQueries } from '../queries/sqlite/ai';
import { SQLiteGoalQueries } from '../queries/sqlite/goals';
import { Task, Project, JournalEntry, Goal } from '@serenity/core';

export class SQLiteService {
  private adapter: SQLiteAdapter;
  private tasks: SQLiteTaskQueries | null = null;
  private projects: SQLiteProjectQueries | null = null;
  private journal: SQLiteJournalQueries | null = null;
  private goals: SQLiteGoalQueries | null = null;
  private ai: SQLiteAIQueries | null = null;
  private initialized = false;

  constructor(adapter?: SQLiteAdapter) {
    this.adapter = adapter || new SQLiteAdapter();
  }

  /**
   * Initialize the database service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.adapter.initialize();
      await this.adapter.createSchema();

      const db = this.adapter.getDatabase();
      this.tasks = new SQLiteTaskQueries(db);
      this.projects = new SQLiteProjectQueries(db);
      this.journal = new SQLiteJournalQueries(db);
      this.ai = new SQLiteAIQueries(db);
      this.goals = new SQLiteGoalQueries(db);

      this.initialized = true;
      console.log('✅ SQLite service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SQLite service:', error);
      throw error;
    }
  }

  /**
   * Ensure service is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('SQLite service not initialized. Call initialize() first.');
    }
  }

  // ===== TASK OPERATIONS =====

  /**
   * Get all tasks
   */
  async getTasks(): Promise<Task[]> {
    this.ensureInitialized();
    return this.tasks!.getTasksWithSubtasks();
  }

  /**
   * Get task by ID
   */
  async getTask(id: string): Promise<Task | null> {
    this.ensureInitialized();
    return this.tasks!.getTaskById(id);
  }

  /**
   * Create a new task
   */
  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    this.ensureInitialized();
    return this.tasks!.createTask(task);
  }

  /**
   * Create a task with a specific ID (used by middleware to preserve Redux IDs)
   */
  async createTaskWithId(task: Task): Promise<Task> {
    this.ensureInitialized();
    return this.tasks!.createTaskWithId(task);
  }

  /**
   * Update a task
   */
  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    this.ensureInitialized();
    return this.tasks!.updateTask(id, updates);
  }

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<boolean> {
    this.ensureInitialized();
    return this.tasks!.deleteTask(id);
  }

  /**
   * Get tasks by project
   */
  async getTasksByProject(projectId: string): Promise<Task[]> {
    this.ensureInitialized();
    return this.tasks!.getTasksByProject(projectId);
  }

  /**
   * Search tasks
   */
  async searchTasks(query: string): Promise<Task[]> {
    this.ensureInitialized();
    return this.tasks!.searchTasks(query);
  }

  /**
   * Get tasks due today
   */
  async getTasksDueToday(): Promise<Task[]> {
    this.ensureInitialized();
    return this.tasks!.getTasksDueToday();
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(): Promise<Task[]> {
    this.ensureInitialized();
    return this.tasks!.getOverdueTasks();
  }

  // ===== PROJECT OPERATIONS =====

  /**
   * Get all projects
   */
  async getProjects(): Promise<Project[]> {
    this.ensureInitialized();
    return this.projects!.getAllProjects();
  }

  /**
   * Get active projects
   */
  async getActiveProjects(): Promise<Project[]> {
    this.ensureInitialized();
    return this.projects!.getActiveProjects();
  }

  /**
   * Get project by ID
   */
  async getProject(id: string): Promise<Project | null> {
    this.ensureInitialized();
    return this.projects!.getProjectById(id);
  }

  // ===== AI INSIGHTS/RECAPS =====

  async addAIInsights(insights: Array<{ provider: string; type: string; title: string; description: string; confidence: number; category: string; actionable?: boolean; metadata?: any }>): Promise<void> {
    this.ensureInitialized();
    const rows = insights.map(i => ({
      provider: (i.provider as any) || 'local',
      type: i.type as any,
      title: i.title,
      description: i.description,
      confidence: i.confidence ?? 0.5,
      category: i.category as any,
      actionable: !!i.actionable,
      metadata: JSON.stringify(i.metadata || {}),
    }));
    await this.ai!.addInsights(rows as any);
  }

  async listAIInsights(limit = 200) {
    this.ensureInitialized();
    return this.ai!.listInsights(limit);
  }

  async addAIRecap(recap: { provider: string; type: 'weekly' | 'monthly'; title: string; summary: string; highlights?: any[]; challenges?: any[]; recommendations?: any[]; period: { start: string; end: string }; metadata?: any }) {
    this.ensureInitialized();
    await this.ai!.addRecap({
      provider: (recap.provider as any) || 'local',
      type: recap.type,
      title: recap.title,
      summary: recap.summary,
      highlights: JSON.stringify(recap.highlights || []),
      challenges: JSON.stringify(recap.challenges || []),
      recommendations: JSON.stringify(recap.recommendations || []),
      period: JSON.stringify(recap.period),
      metadata: JSON.stringify(recap.metadata || {}),
    } as any);
  }

  async listAIRecaps(limit = 50) {
    this.ensureInitialized();
    return this.ai!.listRecaps(limit);
  }

  async addAIUsage(entries: Array<{ timestamp?: string; provider: 'openai' | 'gemini' | 'anthropic'; operation: 'analyze' | 'recap' | 'quickadd'; promptTokens: number; completionTokens: number; totalTokens: number }>): Promise<void> {
    this.ensureInitialized();
    return this.ai!.addUsage(entries);
  }

  async listAIUsage(limit = 500) {
    this.ensureInitialized();
    return this.ai!.listUsage(limit);
  }

  // ===== GOAL OPERATIONS =====

  async getGoals(): Promise<Goal[]> {
    this.ensureInitialized();
    return this.goals!.listGoals();
  }

  async createGoal(goal: Omit<Goal, 'id'>): Promise<Goal> {
    this.ensureInitialized();
    return this.goals!.createGoal(goal as any);
  }

  async createGoalWithId(goal: Goal): Promise<Goal> {
    this.ensureInitialized();
    return this.goals!.createGoalWithId(goal);
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal | null> {
    this.ensureInitialized();
    return this.goals!.updateGoal(id, updates);
  }

  async deleteGoal(id: string): Promise<boolean> {
    this.ensureInitialized();
    return this.goals!.deleteGoal(id);
  }

  /**
   * Create a new project
   */
  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    this.ensureInitialized();
    return this.projects!.createProject(project);
  }

  /**
   * Create a project with a specific ID (used by middleware to preserve Redux IDs)
   */
  async createProjectWithId(project: Project): Promise<Project> {
    this.ensureInitialized();
    return this.projects!.createProjectWithId(project);
  }

  /**
   * Update a project
   */
  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    this.ensureInitialized();
    return this.projects!.updateProject(id, updates);
  }

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<boolean> {
    this.ensureInitialized();
    return this.projects!.deleteProject(id);
  }

  /**
   * Get projects with task counts
   */
  async getProjectsWithTaskCounts(): Promise<(Project & { taskCount: number; completedTasks: number })[]> {
    this.ensureInitialized();
    return this.projects!.getProjectsWithTaskCounts();
  }

  // ===== JOURNAL OPERATIONS =====

  /**
   * Get all journal entries
   */
  async getJournalEntries(): Promise<JournalEntry[]> {
    this.ensureInitialized();
    return this.journal!.getAllEntries();
  }

  /**
   * Get journal entry by ID
   */
  async getJournalEntry(id: string): Promise<JournalEntry | null> {
    this.ensureInitialized();
    return this.journal!.getEntryById(id);
  }

  /**
   * Create a new journal entry
   */
  async createJournalEntry(entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> {
    this.ensureInitialized();
    return this.journal!.createEntry(entry);
  }

  /**
   * Create a journal entry with a specific ID (used by middleware to preserve Redux IDs)
   */
  async createJournalEntryWithId(entry: JournalEntry): Promise<JournalEntry> {
    this.ensureInitialized();
    return this.journal!.createEntryWithId(entry);
  }

  /**
   * Update a journal entry
   */
  async updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry | null> {
    this.ensureInitialized();
    return this.journal!.updateEntry(id, updates);
  }

  /**
   * Delete a journal entry
   */
  async deleteJournalEntry(id: string): Promise<boolean> {
    this.ensureInitialized();
    return this.journal!.deleteEntry(id);
  }

  /**
   * Get entries by date
   */
  async getJournalEntriesByDate(date: Date): Promise<JournalEntry[]> {
    this.ensureInitialized();
    return this.journal!.getEntriesByDate(date);
  }

  /**
   * Get pinned entries
   */
  async getPinnedJournalEntries(): Promise<JournalEntry[]> {
    this.ensureInitialized();
    return this.journal!.getPinnedEntries();
  }

  /**
   * Search journal entries
   */
  async searchJournalEntries(query: string): Promise<JournalEntry[]> {
    this.ensureInitialized();
    return this.journal!.searchEntries(query);
  }

  /**
   * Toggle pin status of an entry
   */
  async toggleJournalEntryPin(id: string): Promise<JournalEntry | null> {
    this.ensureInitialized();
    return this.journal!.togglePin(id);
  }

  // ===== UTILITY OPERATIONS =====

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      return await this.adapter.testConnection();
    } catch (error) {
      return false;
    }
  }

  /**
   * Get database statistics
   */
  getStatistics() {
    this.ensureInitialized();
    return this.adapter.getStats();
  }

  /**
   * Create a backup
   */
  async backup(backupPath?: string): Promise<string> {
    this.ensureInitialized();
    return this.adapter.backup(backupPath);
  }

  /**
   * Vacuum the database
   */
  vacuum(): void {
    this.ensureInitialized();
    this.adapter.vacuum();
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.initialized) {
      await this.adapter.close();
      this.initialized = false;
      this.tasks = null;
      this.projects = null;
      this.journal = null;
    }
  }

  /**
   * Execute a transaction
   */
  transaction<T>(fn: () => T): T {
    this.ensureInitialized();
    return this.adapter.transaction(() => fn());
  }

  /**
   * Import data from localStorage format
   */
  async importFromLocalStorage(data: {
    tasks?: Task[];
    projects?: Project[];
    journalEntries?: JournalEntry[];
    goals?: Goal[];
  }): Promise<{ imported: number; errors: string[] }> {
    this.ensureInitialized();
    
    let imported = 0;
    const errors: string[] = [];

    try {
      return this.adapter.transaction(() => {
        // Import projects first (tasks may reference them)
        if (data.projects) {
          for (const project of data.projects) {
            try {
              this.projects!.createProject({
                name: project.name,
                description: project.description,
                color: project.color,
                archived: project.archived || false
              });
              imported++;
            } catch (error) {
              errors.push(`Failed to import project "${project.name}": ${error}`);
            }
          }
        }

        // Import tasks
        if (data.tasks) {
          for (const task of data.tasks) {
            try {
              this.tasks!.createTask({
                title: task.title,
                description: task.description,
                completed: task.completed,
                priority: task.priority,
                projectId: task.projectId,
                dueDate: task.dueDate,
                tags: task.tags || []
              });
              imported++;
            } catch (error) {
              errors.push(`Failed to import task "${task.title}": ${error}`);
            }
          }
        }

        // Import journal entries
        if (data.journalEntries) {
          for (const entry of data.journalEntries) {
            try {
              this.journal!.createEntry({
                title: entry.title,
                content: entry.content,
                mood: entry.mood,
                date: entry.date,
                pinned: entry.pinned || false,
                tags: entry.tags || []
              });
              imported++;
            } catch (error) {
              errors.push(`Failed to import journal entry: ${error}`);
            }
          }
        }

        // Import goals
        if (data.goals) {
          for (const goal of data.goals) {
            try {
              this.goals!.createGoalWithId(goal as any);
              imported++;
            } catch (error) {
              errors.push(`Failed to import goal "${goal.title}": ${error}`);
            }
          }
        }

        return { imported, errors };
      });
    } catch (error) {
      return { imported: 0, errors: [`Transaction failed: ${error}`] };
    }
  }

  /**
   * Export all data
   */
  async exportAllData(): Promise<{
    tasks: Task[];
    projects: Project[];
    journalEntries: JournalEntry[];
    goals: Goal[];
  }> {
    this.ensureInitialized();
    
    const [tasks, projects, journalEntries, goals] = await Promise.all([
      this.getTasks(),
      this.getProjects(),
      this.getJournalEntries(),
      this.getGoals(),
    ]);

    return { tasks, projects, journalEntries, goals };
  }

  /**
   * Execute a raw SQL query
   */
  async executeRawQuery(query: string, params?: any[]): Promise<any> {
    this.ensureInitialized();
    return this.adapter.executeRawQuery(query, params);
  }
}

// Export singleton instance
export const sqliteService = new SQLiteService();
