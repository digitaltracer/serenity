import type { PersistenceClient, PersistenceStats } from './PersistenceClient';
import type { Task, Project, JournalEntry, Goal } from '../types';
interface WebApiClientOptions {
    baseUrl: string;
    getAuthHeaders?: () => Promise<Record<string, string>> | Record<string, string>;
}
export declare class WebApiPersistenceClient implements PersistenceClient {
    private baseUrl;
    private getAuthHeaders?;
    constructor(options: WebApiClientOptions);
    initialize(): Promise<void>;
    private request;
    tasks: {
        list: () => Promise<Task[]>;
        create: (input: Partial<Task> & Omit<Task, "id" | "createdAt" | "updatedAt">) => Promise<Task>;
        update: (id: string, updates: Partial<Task>) => Promise<Task>;
        remove: (id: string) => Promise<void>;
    };
    projects: {
        list: () => Promise<Project[]>;
        create: (input: Partial<Project> & Omit<Project, "id" | "createdAt" | "updatedAt">) => Promise<Project>;
        update: (id: string, updates: Partial<Project>) => Promise<Project>;
        remove: (id: string) => Promise<void>;
    };
    journal: {
        list: () => Promise<JournalEntry[]>;
        create: (input: Partial<JournalEntry> & Omit<JournalEntry, "id" | "createdAt" | "updatedAt">) => Promise<JournalEntry>;
        update: (id: string, updates: Partial<JournalEntry>) => Promise<JournalEntry>;
        remove: (id: string) => Promise<void>;
    };
    goals: {
        list: () => Promise<Goal[]>;
        create: (input: Partial<Goal> & Omit<Goal, "id" | "createdAt" | "updatedAt">) => Promise<Goal>;
        update: (id: string, updates: Partial<Goal>) => Promise<Goal>;
        remove: (id: string) => Promise<void>;
    };
    stats: {
        get: () => Promise<PersistenceStats>;
    };
}
export {};
