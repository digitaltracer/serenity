import type { Task, Project, JournalEntry, Goal } from '../types';
export interface PersistenceStats {
    totalTasks: number;
    totalProjects: number;
    totalJournalEntries: number;
    totalGoals: number;
}
export interface PersistenceClient {
    initialize(): Promise<void>;
    tasks: {
        list(): Promise<Task[]>;
        create(input: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Task, 'id'>>): Promise<Task>;
        update(id: string, updates: Partial<Task>): Promise<Task>;
        remove(id: string): Promise<void>;
    };
    projects: {
        list(): Promise<Project[]>;
        create(input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Project, 'id'>>): Promise<Project>;
        update(id: string, updates: Partial<Project>): Promise<Project>;
        remove(id: string): Promise<void>;
    };
    journal: {
        list(): Promise<JournalEntry[]>;
        create(input: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<JournalEntry, 'id'>>): Promise<JournalEntry>;
        update(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry>;
        remove(id: string): Promise<void>;
    };
    goals: {
        list(): Promise<Goal[]>;
        create(input: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Goal, 'id'>>): Promise<Goal>;
        update(id: string, updates: Partial<Goal>): Promise<Goal>;
        remove(id: string): Promise<void>;
    };
    stats: {
        get(): Promise<PersistenceStats>;
    };
}
export declare function setPersistenceClient(client: PersistenceClient): void;
export declare function getPersistenceClient(): PersistenceClient;
