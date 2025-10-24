import { Task, JournalEntry } from '../types';
export type QuickAddResult = {
    kind: 'task';
    task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;
    debug?: any;
} | {
    kind: 'journal';
    entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>;
    debug?: any;
};
export declare function parseQuickInput(input: string): QuickAddResult;
