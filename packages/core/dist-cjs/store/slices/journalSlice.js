"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectPinnedEntries = exports.selectFilteredEntries = exports.selectJournalFilters = exports.selectJournalError = exports.selectJournalLoading = exports.selectAllEntries = exports.updateAllEntries = exports.setJournalError = exports.setJournalLoading = exports.setEntries = exports.clearJournalFilters = exports.setJournalFilter = exports.togglePin = exports.deleteEntry = exports.updateEntry = exports.addEntry = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const utils_1 = require("../../utils");
const persistence_1 = require("../../utils/persistence");
// Load journal entries from localStorage on initialization
const initialEntries = (() => {
    try {
        return (0, persistence_1.loadJournalEntries)();
    }
    catch (error) {
        console.error('Failed to load journal entries from storage:', error);
        return [];
    }
})();
const initialState = {
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
const journalSlice = (0, toolkit_1.createSlice)({
    name: 'journal',
    initialState,
    reducers: {
        addEntry: {
            reducer: (state, action) => {
                state.entries.push(action.payload);
            },
            prepare: (entryData) => {
                const newEntry = {
                    ...entryData,
                    id: (0, utils_1.generateId)(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                return { payload: newEntry };
            }
        },
        updateEntry: (state, action) => {
            const index = state.entries.findIndex(entry => entry.id === action.payload.id);
            if (index !== -1) {
                state.entries[index] = {
                    ...state.entries[index],
                    ...action.payload,
                    updatedAt: new Date(),
                };
            }
        },
        deleteEntry: (state, action) => {
            state.entries = state.entries.filter(entry => entry.id !== action.payload);
        },
        togglePin: (state, action) => {
            const entry = state.entries.find(entry => entry.id === action.payload);
            if (entry) {
                entry.pinned = !entry.pinned;
                entry.updatedAt = new Date();
            }
        },
        setJournalFilter: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearFilters: (state) => {
            state.filters = initialState.filters;
        },
        setEntries: (state, action) => {
            state.entries = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        updateAllEntries: (state, action) => {
            state.entries = action.payload;
        },
    },
});
_a = journalSlice.actions, exports.addEntry = _a.addEntry, exports.updateEntry = _a.updateEntry, exports.deleteEntry = _a.deleteEntry, exports.togglePin = _a.togglePin, exports.setJournalFilter = _a.setJournalFilter, exports.clearJournalFilters = _a.clearFilters, exports.setEntries = _a.setEntries, exports.setJournalLoading = _a.setLoading, exports.setJournalError = _a.setError, exports.updateAllEntries = _a.updateAllEntries;
// Selectors
const selectAllEntries = (state) => state.journal.entries;
exports.selectAllEntries = selectAllEntries;
const selectJournalLoading = (state) => state.journal.loading;
exports.selectJournalLoading = selectJournalLoading;
const selectJournalError = (state) => state.journal.error;
exports.selectJournalError = selectJournalError;
const selectJournalFilters = (state) => state.journal.filters;
exports.selectJournalFilters = selectJournalFilters;
exports.selectFilteredEntries = (0, toolkit_1.createSelector)([exports.selectAllEntries, exports.selectJournalFilters], (entries, filters) => {
    return entries.filter(entry => {
        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const matchesSearch = entry.title?.toLowerCase().includes(searchLower) ||
                entry.content.toLowerCase().includes(searchLower);
            if (!matchesSearch)
                return false;
        }
        // Tags filter
        if (filters.tags.length > 0) {
            const hasMatchingTag = filters.tags.some(tag => entry.tags.includes(tag));
            if (!hasMatchingTag)
                return false;
        }
        // Date range filter
        if (filters.dateRange.start || filters.dateRange.end) {
            const entryDate = new Date(entry.date);
            if (filters.dateRange.start && entryDate < filters.dateRange.start)
                return false;
            if (filters.dateRange.end && entryDate > filters.dateRange.end)
                return false;
        }
        return true;
    });
});
exports.selectPinnedEntries = (0, toolkit_1.createSelector)([exports.selectAllEntries], (entries) => entries.filter(entry => entry.pinned));
exports.default = journalSlice.reducer;
