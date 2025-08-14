"use strict";
/**
 * Zod validation schemas for Serenity Notes data types
 * Provides runtime type validation and data sanitization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeValidateJournalEntries = exports.safeValidateProjects = exports.safeValidateTasks = exports.safeValidateJournalEntry = exports.safeValidateProject = exports.safeValidateTask = exports.validateJournalEntries = exports.validateProjects = exports.validateTasks = exports.validateUser = exports.validateJournalEntry = exports.validateProject = exports.validateTask = exports.JournalEntriesArraySchema = exports.ProjectsArraySchema = exports.TasksArraySchema = exports.UserSchema = exports.UserPreferencesSchema = exports.JournalEntrySchema = exports.ProjectSchema = exports.TaskSchema = exports.RecurringPatternSchema = exports.SubtaskSchema = exports.MoodSchema = exports.PrioritySchema = void 0;
const zod_1 = require("zod");
// Base schema utilities
const dateSchema = zod_1.z.union([
    zod_1.z.string().datetime(),
    zod_1.z.string().date(),
    zod_1.z.date(),
]).transform((val) => new Date(val));
const optionalDateSchema = zod_1.z.union([
    zod_1.z.string().datetime(),
    zod_1.z.string().date(),
    zod_1.z.date(),
    zod_1.z.null(),
    zod_1.z.undefined(),
]).transform((val) => val ? new Date(val) : undefined).optional();
// Priority enum
exports.PrioritySchema = zod_1.z.enum(['low', 'medium', 'high']);
// Mood enum for journal entries
exports.MoodSchema = zod_1.z.enum(['happy', 'excited', 'neutral', 'sad', 'stressed']);
// Subtask schema
exports.SubtaskSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    title: zod_1.z.string().min(1).max(255),
    completed: zod_1.z.boolean().default(false),
    order: zod_1.z.number().int().min(0).default(0),
});
// Recurring pattern schema (matching existing type)
exports.RecurringPatternSchema = zod_1.z.object({
    type: zod_1.z.enum(['daily', 'weekly', 'monthly', 'custom']),
    interval: zod_1.z.number().int().min(1),
    endDate: optionalDateSchema,
}).optional();
// Task schema (matching existing type)
exports.TaskSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    title: zod_1.z.string().min(1).max(500),
    description: zod_1.z.string().max(2000).optional(),
    completed: zod_1.z.boolean(),
    priority: exports.PrioritySchema,
    projectId: zod_1.z.string().min(1).optional(),
    dueDate: optionalDateSchema,
    tags: zod_1.z.array(zod_1.z.string().min(1).max(50)).default([]),
    subtasks: zod_1.z.array(exports.SubtaskSchema).optional(),
    recurring: exports.RecurringPatternSchema.optional(),
    userId: zod_1.z.string().optional(),
    createdAt: dateSchema,
    updatedAt: dateSchema,
});
// Project schema (matching existing type)
exports.ProjectSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1).max(255),
    description: zod_1.z.string().max(1000).optional(),
    color: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    icon: zod_1.z.string().max(50).optional(),
    archived: zod_1.z.boolean(),
    userId: zod_1.z.string().optional(),
    createdAt: dateSchema,
    updatedAt: dateSchema,
});
// Journal entry schema (matching existing type)
exports.JournalEntrySchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    title: zod_1.z.string().max(255).optional(),
    content: zod_1.z.string().min(1).max(50000), // 50k chars max for performance
    date: dateSchema,
    tags: zod_1.z.array(zod_1.z.string().min(1).max(50)),
    pinned: zod_1.z.boolean(),
    mood: exports.MoodSchema.optional(),
    userId: zod_1.z.string().optional(),
    createdAt: dateSchema,
    updatedAt: dateSchema,
});
// User preferences schema (matching existing type)
exports.UserPreferencesSchema = zod_1.z.object({
    theme: zod_1.z.enum(['light', 'dark', 'system']),
    compactMode: zod_1.z.boolean(),
    notifications: zod_1.z.object({
        enabled: zod_1.z.boolean(),
        sounds: zod_1.z.boolean(),
        taskReminders: zod_1.z.boolean(),
        dailyReview: zod_1.z.boolean(),
    }),
    language: zod_1.z.string(),
    dateFormat: zod_1.z.string(),
    timeFormat: zod_1.z.enum(['12h', '24h']),
});
// User schema (matching existing type)
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1).max(255),
    email: zod_1.z.string().email().max(255),
    preferences: exports.UserPreferencesSchema,
    createdAt: dateSchema,
    updatedAt: dateSchema,
});
// Collection schemas for arrays
exports.TasksArraySchema = zod_1.z.array(exports.TaskSchema);
exports.ProjectsArraySchema = zod_1.z.array(exports.ProjectSchema);
exports.JournalEntriesArraySchema = zod_1.z.array(exports.JournalEntrySchema);
// Validation functions
const validateTask = (data) => exports.TaskSchema.parse(data);
exports.validateTask = validateTask;
const validateProject = (data) => exports.ProjectSchema.parse(data);
exports.validateProject = validateProject;
const validateJournalEntry = (data) => exports.JournalEntrySchema.parse(data);
exports.validateJournalEntry = validateJournalEntry;
const validateUser = (data) => exports.UserSchema.parse(data);
exports.validateUser = validateUser;
const validateTasks = (data) => exports.TasksArraySchema.parse(data);
exports.validateTasks = validateTasks;
const validateProjects = (data) => exports.ProjectsArraySchema.parse(data);
exports.validateProjects = validateProjects;
const validateJournalEntries = (data) => exports.JournalEntriesArraySchema.parse(data);
exports.validateJournalEntries = validateJournalEntries;
// Removed validatePersistenceData
// Safe validation functions (return null on error)
const safeValidateTask = (data) => {
    try {
        return exports.TaskSchema.parse(data);
    }
    catch {
        return null;
    }
};
exports.safeValidateTask = safeValidateTask;
const safeValidateProject = (data) => {
    try {
        return exports.ProjectSchema.parse(data);
    }
    catch {
        return null;
    }
};
exports.safeValidateProject = safeValidateProject;
const safeValidateJournalEntry = (data) => {
    try {
        return exports.JournalEntrySchema.parse(data);
    }
    catch {
        return null;
    }
};
exports.safeValidateJournalEntry = safeValidateJournalEntry;
const safeValidateTasks = (data) => {
    try {
        return exports.TasksArraySchema.parse(data);
    }
    catch {
        return [];
    }
};
exports.safeValidateTasks = safeValidateTasks;
const safeValidateProjects = (data) => {
    try {
        return exports.ProjectsArraySchema.parse(data);
    }
    catch {
        return [];
    }
};
exports.safeValidateProjects = safeValidateProjects;
const safeValidateJournalEntries = (data) => {
    try {
        return exports.JournalEntriesArraySchema.parse(data);
    }
    catch {
        return [];
    }
};
exports.safeValidateJournalEntries = safeValidateJournalEntries;
// Removed ValidatedPersistenceData type
