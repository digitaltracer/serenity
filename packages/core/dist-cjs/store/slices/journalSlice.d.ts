import { JournalEntry } from '../../types';
export interface JournalState {
    entries: JournalEntry[];
    loading: boolean;
    error: string | null;
    filters: {
        search: string;
        tags: string[];
        dateRange: {
            start: Date | null;
            end: Date | null;
        };
    };
}
export declare const addEntry: import("@reduxjs/toolkit").ActionCreatorWithPreparedPayload<[entryData: Omit<JournalEntry, "id" | "createdAt" | "updatedAt">], JournalEntry, "journal/addEntry", never, never>, updateEntry: import("@reduxjs/toolkit").ActionCreatorWithPayload<Partial<JournalEntry> & {
    id: string;
}, "journal/updateEntry">, deleteEntry: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "journal/deleteEntry">, togglePin: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "journal/togglePin">, setJournalFilter: import("@reduxjs/toolkit").ActionCreatorWithPayload<Partial<{
    search: string;
    tags: string[];
    dateRange: {
        start: Date | null;
        end: Date | null;
    };
}>, "journal/setJournalFilter">, clearJournalFilters: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"journal/clearFilters">, setEntries: import("@reduxjs/toolkit").ActionCreatorWithPayload<JournalEntry[], "journal/setEntries">, setJournalLoading: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "journal/setLoading">, setJournalError: import("@reduxjs/toolkit").ActionCreatorWithPayload<string | null, "journal/setError">, updateAllEntries: import("@reduxjs/toolkit").ActionCreatorWithPayload<JournalEntry[], "journal/updateAllEntries">;
export declare const selectAllEntries: (state: {
    journal: JournalState;
}) => JournalEntry[];
export declare const selectJournalLoading: (state: {
    journal: JournalState;
}) => boolean;
export declare const selectJournalError: (state: {
    journal: JournalState;
}) => string | null;
export declare const selectJournalFilters: (state: {
    journal: JournalState;
}) => {
    search: string;
    tags: string[];
    dateRange: {
        start: Date | null;
        end: Date | null;
    };
};
export declare const selectFilteredEntries: ((state: {
    journal: JournalState;
} & {
    journal: JournalState;
}) => JournalEntry[]) & import("reselect").OutputSelectorFields<(args_0: JournalEntry[], args_1: {
    search: string;
    tags: string[];
    dateRange: {
        start: Date | null;
        end: Date | null;
    };
}) => JournalEntry[], {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
export declare const selectPinnedEntries: ((state: {
    journal: JournalState;
}) => JournalEntry[]) & import("reselect").OutputSelectorFields<(args_0: JournalEntry[]) => JournalEntry[], {
    clearCache: () => void;
}> & {
    clearCache: () => void;
};
declare const _default: import("redux").Reducer<JournalState>;
export default _default;
//# sourceMappingURL=journalSlice.d.ts.map