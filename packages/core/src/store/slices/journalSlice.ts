import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit';
import { JournalEntry } from '../../types';
import { generateId } from '../../utils';
import { loadJournalEntries } from '../../utils/persistence';

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

// Load journal entries from localStorage on initialization
const initialEntries = (() => {
  try {
    return loadJournalEntries();
  } catch (error) {
    console.error('Failed to load journal entries from storage:', error);
    return [];
  }
})();

const initialState: JournalState = {
  entries: initialEntries,
  loading: false,
  error: null,
  filters: {
    search: '',
    tags: [],
    dateRange: {
      start: null,
      end: null,
    },
  },
};

const journalSlice = createSlice({
  name: 'journal',
  initialState,
  reducers: {
    addEntry: {
      reducer: (state, action: PayloadAction<JournalEntry>) => {
        state.entries.push(action.payload);
      },
      prepare: (entryData: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newEntry: JournalEntry = {
          ...entryData,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return { payload: newEntry };
      }
    },
    updateEntry: (state, action: PayloadAction<Partial<JournalEntry> & { id: string }>) => {
      const index = state.entries.findIndex(entry => entry.id === action.payload.id);
      if (index !== -1) {
        state.entries[index] = {
          ...state.entries[index],
          ...action.payload,
          updatedAt: new Date(),
        };
      }
    },
    deleteEntry: (state, action: PayloadAction<string>) => {
      state.entries = state.entries.filter(entry => entry.id !== action.payload);
    },
    togglePin: (state, action: PayloadAction<string>) => {
      const entry = state.entries.find(entry => entry.id === action.payload);
      if (entry) {
        entry.pinned = !entry.pinned;
        entry.updatedAt = new Date();
      }
    },
    setJournalFilter: (state, action: PayloadAction<Partial<JournalState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setEntries: (state, action: PayloadAction<JournalEntry[]>) => {
      state.entries = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    updateAllEntries: (state, action: PayloadAction<JournalEntry[]>) => {
      state.entries = action.payload;
    },
  },
});

export const {
  addEntry,
  updateEntry,
  deleteEntry,
  togglePin,
  setJournalFilter,
  clearFilters: clearJournalFilters,
  setEntries,
  setLoading: setJournalLoading,
  setError: setJournalError,
  updateAllEntries,
} = journalSlice.actions;

// Selectors
export const selectAllEntries = (state: { journal: JournalState }) => state.journal.entries;
export const selectJournalLoading = (state: { journal: JournalState }) => state.journal.loading;
export const selectJournalError = (state: { journal: JournalState }) => state.journal.error;
export const selectJournalFilters = (state: { journal: JournalState }) => state.journal.filters;

export const selectFilteredEntries = createSelector(
  [selectAllEntries, selectJournalFilters],
  (entries, filters) => {
    return entries.filter(entry => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          entry.title?.toLowerCase().includes(searchLower) ||
          entry.content.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => entry.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const entryDate = new Date(entry.date);
        if (filters.dateRange.start && entryDate < filters.dateRange.start) return false;
        if (filters.dateRange.end && entryDate > filters.dateRange.end) return false;
      }

      return true;
    });
  }
);

export const selectPinnedEntries = createSelector(
  [selectAllEntries],
  (entries) => entries.filter(entry => entry.pinned)
);

export default journalSlice.reducer;