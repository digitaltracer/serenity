export declare const generateId: () => string;
export declare const formatDate: (date: Date, formatString?: string) => string;
export declare const isTaskOverdue: (dueDate?: Date) => boolean;
export declare const isTaskDueToday: (dueDate?: Date) => boolean;
export declare const isTaskUpcoming: (dueDate?: Date) => boolean;
export declare const calculateCompletionRate: (completed: number, total: number) => number;
export declare const truncateText: (text: string, maxLength: number) => string;
export declare const searchItems: <T extends {
    title: string;
    description?: string;
}>(items: T[], query: string) => T[];
export declare const sortTasksByPriority: <T extends {
    priority: "low" | "medium" | "high";
}>(tasks: T[]) => T[];
export * from './storage';
export * from './persistence';
export * from './logger';
export * from './privacy';
export * from './securityConfig';
export * from './secureStorage';
export * from './encryption';
export * from './secureExport';
export * from './useAutoLock';
export * from './cryptoUtils';
export * from './keyboardShortcuts';
export * from './searchEngine';
export * from './dragDrop';
export * from './goalProgress';
export * from './errorHandler';
//# sourceMappingURL=index.d.ts.map