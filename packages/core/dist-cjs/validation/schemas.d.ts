/**
 * Zod validation schemas for Serenity Notes data types
 * Provides runtime type validation and data sanitization
 */
import { z } from 'zod';
export declare const PrioritySchema: z.ZodEnum<["low", "medium", "high"]>;
export declare const MoodSchema: z.ZodEnum<["happy", "excited", "neutral", "sad", "stressed"]>;
export declare const SubtaskSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    completed: z.ZodDefault<z.ZodBoolean>;
    order: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    completed: boolean;
    id: string;
    title: string;
    order: number;
}, {
    id: string;
    title: string;
    completed?: boolean | undefined;
    order?: number | undefined;
}>;
export declare const RecurringPatternSchema: z.ZodOptional<z.ZodObject<{
    type: z.ZodEnum<["daily", "weekly", "monthly", "custom"]>;
    interval: z.ZodNumber;
    endDate: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodString, z.ZodDate, z.ZodNull, z.ZodUndefined]>, Date | undefined, string | Date | null | undefined>>;
}, "strip", z.ZodTypeAny, {
    type: "daily" | "weekly" | "monthly" | "custom";
    interval: number;
    endDate?: Date | undefined;
}, {
    type: "daily" | "weekly" | "monthly" | "custom";
    interval: number;
    endDate?: string | Date | null | undefined;
}>>;
export declare const TaskSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    completed: z.ZodBoolean;
    priority: z.ZodEnum<["low", "medium", "high"]>;
    projectId: z.ZodOptional<z.ZodString>;
    dueDate: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodString, z.ZodDate, z.ZodNull, z.ZodUndefined]>, Date | undefined, string | Date | null | undefined>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    subtasks: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        completed: z.ZodDefault<z.ZodBoolean>;
        order: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        completed: boolean;
        id: string;
        title: string;
        order: number;
    }, {
        id: string;
        title: string;
        completed?: boolean | undefined;
        order?: number | undefined;
    }>, "many">>;
    recurring: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<["daily", "weekly", "monthly", "custom"]>;
        interval: z.ZodNumber;
        endDate: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodString, z.ZodDate, z.ZodNull, z.ZodUndefined]>, Date | undefined, string | Date | null | undefined>>;
    }, "strip", z.ZodTypeAny, {
        type: "daily" | "weekly" | "monthly" | "custom";
        interval: number;
        endDate?: Date | undefined;
    }, {
        type: "daily" | "weekly" | "monthly" | "custom";
        interval: number;
        endDate?: string | Date | null | undefined;
    }>>>;
    userId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodString, z.ZodDate]>, Date, string | Date>;
    updatedAt: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodString, z.ZodDate]>, Date, string | Date>;
}, "strip", z.ZodTypeAny, {
    completed: boolean;
    id: string;
    title: string;
    priority: "low" | "medium" | "high";
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    description?: string | undefined;
    projectId?: string | undefined;
    dueDate?: Date | undefined;
    subtasks?: {
        completed: boolean;
        id: string;
        title: string;
        order: number;
    }[] | undefined;
    recurring?: {
        type: "daily" | "weekly" | "monthly" | "custom";
        interval: number;
        endDate?: Date | undefined;
    } | undefined;
    userId?: string | undefined;
}, {
    completed: boolean;
    id: string;
    title: string;
    priority: "low" | "medium" | "high";
    createdAt: string | Date;
    updatedAt: string | Date;
    description?: string | undefined;
    projectId?: string | undefined;
    dueDate?: string | Date | null | undefined;
    tags?: string[] | undefined;
    subtasks?: {
        id: string;
        title: string;
        completed?: boolean | undefined;
        order?: number | undefined;
    }[] | undefined;
    recurring?: {
        type: "daily" | "weekly" | "monthly" | "custom";
        interval: number;
        endDate?: string | Date | null | undefined;
    } | undefined;
    userId?: string | undefined;
}>;
export declare const ProjectSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    color: z.ZodString;
    icon: z.ZodOptional<z.ZodString>;
    archived: z.ZodBoolean;
    userId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodString, z.ZodDate]>, Date, string | Date>;
    updatedAt: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodString, z.ZodDate]>, Date, string | Date>;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    color: string;
    archived: boolean;
    description?: string | undefined;
    userId?: string | undefined;
    icon?: string | undefined;
}, {
    name: string;
    id: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    color: string;
    archived: boolean;
    description?: string | undefined;
    userId?: string | undefined;
    icon?: string | undefined;
}>;
export declare const JournalEntrySchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodString;
    date: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodString, z.ZodDate]>, Date, string | Date>;
    tags: z.ZodArray<z.ZodString, "many">;
    pinned: z.ZodBoolean;
    mood: z.ZodOptional<z.ZodEnum<["happy", "excited", "neutral", "sad", "stressed"]>>;
    userId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodString, z.ZodDate]>, Date, string | Date>;
    updatedAt: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodString, z.ZodDate]>, Date, string | Date>;
}, "strip", z.ZodTypeAny, {
    id: string;
    date: Date;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    content: string;
    pinned: boolean;
    title?: string | undefined;
    userId?: string | undefined;
    mood?: "happy" | "neutral" | "sad" | "excited" | "stressed" | undefined;
}, {
    id: string;
    date: string | Date;
    tags: string[];
    createdAt: string | Date;
    updatedAt: string | Date;
    content: string;
    pinned: boolean;
    title?: string | undefined;
    userId?: string | undefined;
    mood?: "happy" | "neutral" | "sad" | "excited" | "stressed" | undefined;
}>;
export declare const UserPreferencesSchema: z.ZodObject<{
    theme: z.ZodEnum<["light", "dark", "system"]>;
    compactMode: z.ZodBoolean;
    notifications: z.ZodObject<{
        enabled: z.ZodBoolean;
        sounds: z.ZodBoolean;
        taskReminders: z.ZodBoolean;
        dailyReview: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        sounds: boolean;
        taskReminders: boolean;
        dailyReview: boolean;
    }, {
        enabled: boolean;
        sounds: boolean;
        taskReminders: boolean;
        dailyReview: boolean;
    }>;
    language: z.ZodString;
    dateFormat: z.ZodString;
    timeFormat: z.ZodEnum<["12h", "24h"]>;
}, "strip", z.ZodTypeAny, {
    theme: "light" | "dark" | "system";
    compactMode: boolean;
    notifications: {
        enabled: boolean;
        sounds: boolean;
        taskReminders: boolean;
        dailyReview: boolean;
    };
    language: string;
    dateFormat: string;
    timeFormat: "12h" | "24h";
}, {
    theme: "light" | "dark" | "system";
    compactMode: boolean;
    notifications: {
        enabled: boolean;
        sounds: boolean;
        taskReminders: boolean;
        dailyReview: boolean;
    };
    language: string;
    dateFormat: string;
    timeFormat: "12h" | "24h";
}>;
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    preferences: z.ZodObject<{
        theme: z.ZodEnum<["light", "dark", "system"]>;
        compactMode: z.ZodBoolean;
        notifications: z.ZodObject<{
            enabled: z.ZodBoolean;
            sounds: z.ZodBoolean;
            taskReminders: z.ZodBoolean;
            dailyReview: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            sounds: boolean;
            taskReminders: boolean;
            dailyReview: boolean;
        }, {
            enabled: boolean;
            sounds: boolean;
            taskReminders: boolean;
            dailyReview: boolean;
        }>;
        language: z.ZodString;
        dateFormat: z.ZodString;
        timeFormat: z.ZodEnum<["12h", "24h"]>;
    }, "strip", z.ZodTypeAny, {
        theme: "light" | "dark" | "system";
        compactMode: boolean;
        notifications: {
            enabled: boolean;
            sounds: boolean;
            taskReminders: boolean;
            dailyReview: boolean;
        };
        language: string;
        dateFormat: string;
        timeFormat: "12h" | "24h";
    }, {
        theme: "light" | "dark" | "system";
        compactMode: boolean;
        notifications: {
            enabled: boolean;
            sounds: boolean;
            taskReminders: boolean;
            dailyReview: boolean;
        };
        language: string;
        dateFormat: string;
        timeFormat: "12h" | "24h";
    }>;
    createdAt: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodString, z.ZodDate]>, Date, string | Date>;
    updatedAt: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodString, z.ZodDate]>, Date, string | Date>;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    preferences: {
        theme: "light" | "dark" | "system";
        compactMode: boolean;
        notifications: {
            enabled: boolean;
            sounds: boolean;
            taskReminders: boolean;
            dailyReview: boolean;
        };
        language: string;
        dateFormat: string;
        timeFormat: "12h" | "24h";
    };
}, {
    name: string;
    id: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    email: string;
    preferences: {
        theme: "light" | "dark" | "system";
        compactMode: boolean;
        notifications: {
            enabled: boolean;
            sounds: boolean;
            taskReminders: boolean;
            dailyReview: boolean;
        };
        language: string;
        dateFormat: string;
        timeFormat: "12h" | "24h";
    };
}>;
export declare const TasksArraySchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    completed: z.ZodBoolean;
    priority: z.ZodEnum<["low", "medium", "high"]>;
    projectId: z.ZodOptional<z.ZodString>;
    dueDate: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodString, z.ZodDate, z.ZodNull, z.ZodUndefined]>, Date | undefined, string | Date | null | undefined>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    subtasks: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        completed: z.ZodDefault<z.ZodBoolean>;
        order: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        completed: boolean;
        id: string;
        title: string;
        order: number;
    }, {
        id: string;
        title: string;
        completed?: boolean | undefined;
        order?: number | undefined;
    }>, "many">>;
    recurring: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<["daily", "weekly", "monthly", "custom"]>;
        interval: z.ZodNumber;
        endDate: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodString, z.ZodDate, z.ZodNull, z.ZodUndefined]>, Date | undefined, string | Date | null | undefined>>;
    }, "strip", z.ZodTypeAny, {
        type: "daily" | "weekly" | "monthly" | "custom";
        interval: number;
        endDate?: Date | undefined;
    }, {
        type: "daily" | "weekly" | "monthly" | "custom";
        interval: number;
        endDate?: string | Date | null | undefined;
    }>>>;
    userId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodString, z.ZodDate]>, Date, string | Date>;
    updatedAt: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodString, z.ZodDate]>, Date, string | Date>;
}, "strip", z.ZodTypeAny, {
    completed: boolean;
    id: string;
    title: string;
    priority: "low" | "medium" | "high";
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    description?: string | undefined;
    projectId?: string | undefined;
    dueDate?: Date | undefined;
    subtasks?: {
        completed: boolean;
        id: string;
        title: string;
        order: number;
    }[] | undefined;
    recurring?: {
        type: "daily" | "weekly" | "monthly" | "custom";
        interval: number;
        endDate?: Date | undefined;
    } | undefined;
    userId?: string | undefined;
}, {
    completed: boolean;
    id: string;
    title: string;
    priority: "low" | "medium" | "high";
    createdAt: string | Date;
    updatedAt: string | Date;
    description?: string | undefined;
    projectId?: string | undefined;
    dueDate?: string | Date | null | undefined;
    tags?: string[] | undefined;
    subtasks?: {
        id: string;
        title: string;
        completed?: boolean | undefined;
        order?: number | undefined;
    }[] | undefined;
    recurring?: {
        type: "daily" | "weekly" | "monthly" | "custom";
        interval: number;
        endDate?: string | Date | null | undefined;
    } | undefined;
    userId?: string | undefined;
}>, "many">;
export declare const ProjectsArraySchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    color: z.ZodString;
    icon: z.ZodOptional<z.ZodString>;
    archived: z.ZodBoolean;
    userId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodString, z.ZodDate]>, Date, string | Date>;
    updatedAt: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodString, z.ZodDate]>, Date, string | Date>;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    color: string;
    archived: boolean;
    description?: string | undefined;
    userId?: string | undefined;
    icon?: string | undefined;
}, {
    name: string;
    id: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    color: string;
    archived: boolean;
    description?: string | undefined;
    userId?: string | undefined;
    icon?: string | undefined;
}>, "many">;
export declare const JournalEntriesArraySchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodString;
    date: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodString, z.ZodDate]>, Date, string | Date>;
    tags: z.ZodArray<z.ZodString, "many">;
    pinned: z.ZodBoolean;
    mood: z.ZodOptional<z.ZodEnum<["happy", "excited", "neutral", "sad", "stressed"]>>;
    userId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodString, z.ZodDate]>, Date, string | Date>;
    updatedAt: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodString, z.ZodDate]>, Date, string | Date>;
}, "strip", z.ZodTypeAny, {
    id: string;
    date: Date;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    content: string;
    pinned: boolean;
    title?: string | undefined;
    userId?: string | undefined;
    mood?: "happy" | "neutral" | "sad" | "excited" | "stressed" | undefined;
}, {
    id: string;
    date: string | Date;
    tags: string[];
    createdAt: string | Date;
    updatedAt: string | Date;
    content: string;
    pinned: boolean;
    title?: string | undefined;
    userId?: string | undefined;
    mood?: "happy" | "neutral" | "sad" | "excited" | "stressed" | undefined;
}>, "many">;
export declare const validateTask: (data: unknown) => {
    completed: boolean;
    id: string;
    title: string;
    priority: "low" | "medium" | "high";
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    description?: string | undefined;
    projectId?: string | undefined;
    dueDate?: Date | undefined;
    subtasks?: {
        completed: boolean;
        id: string;
        title: string;
        order: number;
    }[] | undefined;
    recurring?: {
        type: "daily" | "weekly" | "monthly" | "custom";
        interval: number;
        endDate?: Date | undefined;
    } | undefined;
    userId?: string | undefined;
};
export declare const validateProject: (data: unknown) => {
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    color: string;
    archived: boolean;
    description?: string | undefined;
    userId?: string | undefined;
    icon?: string | undefined;
};
export declare const validateJournalEntry: (data: unknown) => {
    id: string;
    date: Date;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    content: string;
    pinned: boolean;
    title?: string | undefined;
    userId?: string | undefined;
    mood?: "happy" | "neutral" | "sad" | "excited" | "stressed" | undefined;
};
export declare const validateUser: (data: unknown) => {
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    preferences: {
        theme: "light" | "dark" | "system";
        compactMode: boolean;
        notifications: {
            enabled: boolean;
            sounds: boolean;
            taskReminders: boolean;
            dailyReview: boolean;
        };
        language: string;
        dateFormat: string;
        timeFormat: "12h" | "24h";
    };
};
export declare const validateTasks: (data: unknown) => {
    completed: boolean;
    id: string;
    title: string;
    priority: "low" | "medium" | "high";
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    description?: string | undefined;
    projectId?: string | undefined;
    dueDate?: Date | undefined;
    subtasks?: {
        completed: boolean;
        id: string;
        title: string;
        order: number;
    }[] | undefined;
    recurring?: {
        type: "daily" | "weekly" | "monthly" | "custom";
        interval: number;
        endDate?: Date | undefined;
    } | undefined;
    userId?: string | undefined;
}[];
export declare const validateProjects: (data: unknown) => {
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    color: string;
    archived: boolean;
    description?: string | undefined;
    userId?: string | undefined;
    icon?: string | undefined;
}[];
export declare const validateJournalEntries: (data: unknown) => {
    id: string;
    date: Date;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    content: string;
    pinned: boolean;
    title?: string | undefined;
    userId?: string | undefined;
    mood?: "happy" | "neutral" | "sad" | "excited" | "stressed" | undefined;
}[];
export declare const safeValidateTask: (data: unknown) => {
    completed: boolean;
    id: string;
    title: string;
    priority: "low" | "medium" | "high";
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    description?: string | undefined;
    projectId?: string | undefined;
    dueDate?: Date | undefined;
    subtasks?: {
        completed: boolean;
        id: string;
        title: string;
        order: number;
    }[] | undefined;
    recurring?: {
        type: "daily" | "weekly" | "monthly" | "custom";
        interval: number;
        endDate?: Date | undefined;
    } | undefined;
    userId?: string | undefined;
} | null;
export declare const safeValidateProject: (data: unknown) => {
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    color: string;
    archived: boolean;
    description?: string | undefined;
    userId?: string | undefined;
    icon?: string | undefined;
} | null;
export declare const safeValidateJournalEntry: (data: unknown) => {
    id: string;
    date: Date;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    content: string;
    pinned: boolean;
    title?: string | undefined;
    userId?: string | undefined;
    mood?: "happy" | "neutral" | "sad" | "excited" | "stressed" | undefined;
} | null;
export declare const safeValidateTasks: (data: unknown) => {
    completed: boolean;
    id: string;
    title: string;
    priority: "low" | "medium" | "high";
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    description?: string | undefined;
    projectId?: string | undefined;
    dueDate?: Date | undefined;
    subtasks?: {
        completed: boolean;
        id: string;
        title: string;
        order: number;
    }[] | undefined;
    recurring?: {
        type: "daily" | "weekly" | "monthly" | "custom";
        interval: number;
        endDate?: Date | undefined;
    } | undefined;
    userId?: string | undefined;
}[];
export declare const safeValidateProjects: (data: unknown) => {
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    color: string;
    archived: boolean;
    description?: string | undefined;
    userId?: string | undefined;
    icon?: string | undefined;
}[];
export declare const safeValidateJournalEntries: (data: unknown) => {
    id: string;
    date: Date;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    content: string;
    pinned: boolean;
    title?: string | undefined;
    userId?: string | undefined;
    mood?: "happy" | "neutral" | "sad" | "excited" | "stressed" | undefined;
}[];
export type ValidatedTask = z.infer<typeof TaskSchema>;
export type ValidatedProject = z.infer<typeof ProjectSchema>;
export type ValidatedJournalEntry = z.infer<typeof JournalEntrySchema>;
export type ValidatedUser = z.infer<typeof UserSchema>;
export type ValidatedUserPreferences = z.infer<typeof UserPreferencesSchema>;
