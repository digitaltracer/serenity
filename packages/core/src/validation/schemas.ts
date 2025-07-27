/**
 * Zod validation schemas for Serenity Notes data types
 * Provides runtime type validation and data sanitization
 */

import { z } from 'zod';

// Base schema utilities
const dateSchema = z.union([
  z.string().datetime(),
  z.string().date(),
  z.date(),
]).transform((val) => new Date(val));

const optionalDateSchema = z.union([
  z.string().datetime(),
  z.string().date(), 
  z.date(),
  z.null(),
  z.undefined(),
]).transform((val) => val ? new Date(val) : undefined).optional();

// Priority enum
export const PrioritySchema = z.enum(['low', 'medium', 'high']);

// Mood enum for journal entries
export const MoodSchema = z.enum(['happy', 'excited', 'neutral', 'sad', 'stressed']);

// Subtask schema
export const SubtaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(255),
  completed: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
});

// Recurring pattern schema (matching existing type)
export const RecurringPatternSchema = z.object({
  type: z.enum(['daily', 'weekly', 'monthly', 'custom']),
  interval: z.number().int().min(1),
  endDate: optionalDateSchema,
}).optional();

// Task schema (matching existing type)
export const TaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  completed: z.boolean(),
  priority: PrioritySchema,
  projectId: z.string().min(1).optional(),
  dueDate: optionalDateSchema,
  tags: z.array(z.string().min(1).max(50)).default([]),
  subtasks: z.array(SubtaskSchema).optional(),
  recurring: RecurringPatternSchema.optional(),
  userId: z.string().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

// Project schema (matching existing type)
export const ProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().max(50).optional(),
  archived: z.boolean(),
  userId: z.string().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

// Journal entry schema (matching existing type)
export const JournalEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().max(255).optional(),
  content: z.string().min(1).max(50000), // 50k chars max for performance
  date: dateSchema,
  tags: z.array(z.string().min(1).max(50)),
  pinned: z.boolean(),
  mood: MoodSchema.optional(),
  userId: z.string().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

// User preferences schema (matching existing type)
export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  compactMode: z.boolean(),
  notifications: z.object({
    enabled: z.boolean(),
    sounds: z.boolean(),
    taskReminders: z.boolean(),
    dailyReview: z.boolean(),
  }),
  language: z.string(),
  dateFormat: z.string(),
  timeFormat: z.enum(['12h', '24h']),
});

// User schema (matching existing type)
export const UserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  preferences: UserPreferencesSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

// Collection schemas for arrays
export const TasksArraySchema = z.array(TaskSchema);
export const ProjectsArraySchema = z.array(ProjectSchema);
export const JournalEntriesArraySchema = z.array(JournalEntrySchema);

// Validation functions
export const validateTask = (data: unknown) => TaskSchema.parse(data);
export const validateProject = (data: unknown) => ProjectSchema.parse(data);
export const validateJournalEntry = (data: unknown) => JournalEntrySchema.parse(data);
export const validateUser = (data: unknown) => UserSchema.parse(data);

export const validateTasks = (data: unknown) => TasksArraySchema.parse(data);
export const validateProjects = (data: unknown) => ProjectsArraySchema.parse(data);
export const validateJournalEntries = (data: unknown) => JournalEntriesArraySchema.parse(data);

// Removed validatePersistenceData

// Safe validation functions (return null on error)
export const safeValidateTask = (data: unknown) => {
  try {
    return TaskSchema.parse(data);
  } catch {
    return null;
  }
};

export const safeValidateProject = (data: unknown) => {
  try {
    return ProjectSchema.parse(data);
  } catch {
    return null;
  }
};

export const safeValidateJournalEntry = (data: unknown) => {
  try {
    return JournalEntrySchema.parse(data);
  } catch {
    return null;
  }
};

export const safeValidateTasks = (data: unknown) => {
  try {
    return TasksArraySchema.parse(data);
  } catch {
    return [];
  }
};

export const safeValidateProjects = (data: unknown) => {
  try {
    return ProjectsArraySchema.parse(data);
  } catch {
    return [];
  }
};

export const safeValidateJournalEntries = (data: unknown) => {
  try {
    return JournalEntriesArraySchema.parse(data);
  } catch {
    return [];
  }
};

// Export types derived from schemas
export type ValidatedTask = z.infer<typeof TaskSchema>;
export type ValidatedProject = z.infer<typeof ProjectSchema>;
export type ValidatedJournalEntry = z.infer<typeof JournalEntrySchema>;
export type ValidatedUser = z.infer<typeof UserSchema>;
export type ValidatedUserPreferences = z.infer<typeof UserPreferencesSchema>;
// Removed ValidatedPersistenceData type