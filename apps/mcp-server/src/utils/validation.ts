import { z } from 'zod';

/**
 * Zod schemas for runtime validation
 */

// Priority enum
export const prioritySchema = z.enum(['low', 'medium', 'high']);

// Task priority with default
export const priorityWithDefault = prioritySchema.default('medium');

// UUID validation
export const uuidSchema = z.string().uuid();

// Non-empty string
export const nonEmptyString = z.string().min(1);

// Tag array
export const tagsSchema = z.array(z.string()).default([]);

// Date string that can be parsed
export const dateStringSchema = z.string().datetime().optional();

/**
 * Create task schema
 */
export const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  priority: priorityWithDefault,
  dueDate: dateStringSchema,
  projectId: uuidSchema.optional(),
  tags: tagsSchema,
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

/**
 * Update task schema
 */
export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  priority: prioritySchema.optional(),
  dueDate: dateStringSchema.or(z.null()),
  projectId: uuidSchema.optional().or(z.null()),
  tags: z.array(z.string()).optional(),
  completed: z.boolean().optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

/**
 * Task filters schema
 */
export const taskFiltersSchema = z.object({
  filter: z.enum(['all', 'active', 'completed']).optional().default('active'),
  priority: prioritySchema.optional(),
  projectId: uuidSchema.optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  dueDateFrom: dateStringSchema,
  dueDateTo: dateStringSchema,
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});

export type TaskFiltersInput = z.infer<typeof taskFiltersSchema>;

/**
 * Complete task schema
 */
export const completeTaskSchema = z.object({
  taskId: uuidSchema,
});

export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;

/**
 * Delete task schema
 */
export const deleteTaskSchema = z.object({
  taskId: uuidSchema,
});

export type DeleteTaskInput = z.infer<typeof deleteTaskSchema>;

/**
 * Add subtask schema
 */
export const addSubtaskSchema = z.object({
  taskId: uuidSchema,
  title: z.string().min(1).max(500),
});

export type AddSubtaskInput = z.infer<typeof addSubtaskSchema>;

/**
 * Mood enum for journal (matching database schema)
 */
export const moodSchema = z.enum(['happy', 'neutral', 'sad', 'excited', 'stressed']);

/**
 * Create journal entry schema
 */
export const createJournalSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1),
  mood: moodSchema.optional(),
  tags: tagsSchema,
  date: dateStringSchema, // Defaults to today if not provided
});

export type CreateJournalInput = z.infer<typeof createJournalSchema>;

/**
 * Update journal entry schema
 */
export const updateJournalSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1).optional(),
  mood: moodSchema.optional().or(z.null()),
  tags: z.array(z.string()).optional(),
});

export type UpdateJournalInput = z.infer<typeof updateJournalSchema>;

/**
 * Journal filters schema
 */
export const journalFiltersSchema = z.object({
  dateFrom: dateStringSchema,
  dateTo: dateStringSchema,
  mood: moodSchema.optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});

export type JournalFiltersInput = z.infer<typeof journalFiltersSchema>;

/**
 * Delete journal entry schema
 */
export const deleteJournalSchema = z.object({
  entryId: uuidSchema,
});

export type DeleteJournalInput = z.infer<typeof deleteJournalSchema>;

/**
 * Search journal schema
 */
export const searchJournalSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(50).optional().default(20),
});

export type SearchJournalInput = z.infer<typeof searchJournalSchema>;

/**
 * Get entry by date schema
 */
export const getEntryByDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type GetEntryByDateInput = z.infer<typeof getEntryByDateSchema>;

/**
 * Create project schema
 */
export const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().max(50).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

/**
 * Update project schema
 */
export const updateProjectSchema = z.object({
  projectId: uuidSchema,
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().max(50).optional(),
  archived: z.boolean().optional(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

/**
 * Project filters schema
 */
export const projectFiltersSchema = z.object({
  archived: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});

export type ProjectFiltersInput = z.infer<typeof projectFiltersSchema>;

/**
 * Archive project schema
 */
export const archiveProjectSchema = z.object({
  projectId: uuidSchema,
});

export type ArchiveProjectInput = z.infer<typeof archiveProjectSchema>;

/**
 * Delete project schema
 */
export const deleteProjectSchema = z.object({
  projectId: uuidSchema,
});

export type DeleteProjectInput = z.infer<typeof deleteProjectSchema>;

/**
 * Goal type enum
 */
export const goalTypeSchema = z.enum(['weekly_tasks', 'project_tasks', 'priority_tasks', 'daily_streak', 'journal_weekly', 'completion_rate']);

/**
 * Goal status enum
 */
export const goalStatusSchema = z.enum(['active', 'completed', 'paused', 'failed']);

/**
 * Goal timeframe enum
 */
export const timeframeSchema = z.enum(['daily', 'weekly', 'monthly']);

/**
 * Goal config schema
 */
export const goalConfigSchema = z.object({
  targetCount: z.number().int().min(1).optional(),
  projectId: uuidSchema.optional(),
  priority: prioritySchema.optional(),
  streakDays: z.number().int().min(1).optional(),
  targetRate: z.number().min(0).max(100).optional(),
  timeframe: timeframeSchema,
});

/**
 * Create goal schema
 */
export const createGoalSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  type: goalTypeSchema,
  config: goalConfigSchema,
  priority: priorityWithDefault,
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;

/**
 * Update goal schema
 */
export const updateGoalSchema = z.object({
  goalId: uuidSchema,
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  config: z.record(z.any()).optional(),
  status: goalStatusSchema.optional(),
  priority: prioritySchema.optional(),
});

export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

/**
 * Goal filters schema
 */
export const goalFiltersSchema = z.object({
  status: goalStatusSchema.optional(),
  type: goalTypeSchema.optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});

export type GoalFiltersInput = z.infer<typeof goalFiltersSchema>;

/**
 * Track progress schema
 */
export const trackProgressSchema = z.object({
  goalId: uuidSchema,
  current: z.number().min(0),
});

export type TrackProgressInput = z.infer<typeof trackProgressSchema>;

/**
 * Delete goal schema
 */
export const deleteGoalSchema = z.object({
  goalId: uuidSchema,
});

export type DeleteGoalInput = z.infer<typeof deleteGoalSchema>;
