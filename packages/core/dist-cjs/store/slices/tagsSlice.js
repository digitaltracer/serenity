"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectTagSuggestions = exports.selectAllTags = exports.selectAllUsedTags = exports.setUsedTags = exports.clearUnusedTags = exports.addUsedTags = exports.addUsedTag = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const initialState = {
    usedTags: [],
};
const tagsSlice = (0, toolkit_1.createSlice)({
    name: 'tags',
    initialState,
    reducers: {
        addUsedTag: (state, action) => {
            const tag = action.payload.trim();
            if (tag && !state.usedTags.includes(tag)) {
                state.usedTags.push(tag);
                // Keep only the most recent 100 tags to prevent unlimited growth
                if (state.usedTags.length > 100) {
                    state.usedTags = state.usedTags.slice(-100);
                }
            }
        },
        addUsedTags: (state, action) => {
            action.payload.forEach(tag => {
                const trimmedTag = tag.trim();
                if (trimmedTag && !state.usedTags.includes(trimmedTag)) {
                    state.usedTags.push(trimmedTag);
                }
            });
            // Keep only the most recent 100 tags
            if (state.usedTags.length > 100) {
                state.usedTags = state.usedTags.slice(-100);
            }
        },
        clearUnusedTags: (state, action) => {
            // Remove tags that are no longer used in any tasks or journal entries
            const currentlyUsedTags = action.payload;
            state.usedTags = state.usedTags.filter(tag => currentlyUsedTags.includes(tag));
        },
        setUsedTags: (state, action) => {
            state.usedTags = action.payload;
        },
    },
});
_a = tagsSlice.actions, exports.addUsedTag = _a.addUsedTag, exports.addUsedTags = _a.addUsedTags, exports.clearUnusedTags = _a.clearUnusedTags, exports.setUsedTags = _a.setUsedTags;
// Selectors
const selectAllUsedTags = (state) => state.tags.usedTags;
exports.selectAllUsedTags = selectAllUsedTags;
const selectAllTags = (state) => state.tags.usedTags;
exports.selectAllTags = selectAllTags;
const selectTagSuggestions = (query) => (state) => {
    if (!query.trim())
        return state.tags.usedTags.slice(0, 10);
    const queryLower = query.toLowerCase();
    return state.tags.usedTags
        .filter(tag => tag.toLowerCase().includes(queryLower))
        .sort((a, b) => {
        // Prioritize tags that start with the query
        const aStarts = a.toLowerCase().startsWith(queryLower);
        const bStarts = b.toLowerCase().startsWith(queryLower);
        if (aStarts && !bStarts)
            return -1;
        if (!aStarts && bStarts)
            return 1;
        return a.localeCompare(b);
    })
        .slice(0, 10);
};
exports.selectTagSuggestions = selectTagSuggestions;
exports.default = tagsSlice.reducer;
