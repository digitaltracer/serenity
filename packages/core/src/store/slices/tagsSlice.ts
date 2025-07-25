import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TagsState {
  usedTags: string[];
}

const initialState: TagsState = {
  usedTags: [],
};

const tagsSlice = createSlice({
  name: 'tags',
  initialState,
  reducers: {
    addUsedTag: (state, action: PayloadAction<string>) => {
      const tag = action.payload.trim();
      if (tag && !state.usedTags.includes(tag)) {
        state.usedTags.push(tag);
        // Keep only the most recent 100 tags to prevent unlimited growth
        if (state.usedTags.length > 100) {
          state.usedTags = state.usedTags.slice(-100);
        }
      }
    },
    addUsedTags: (state, action: PayloadAction<string[]>) => {
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
    clearUnusedTags: (state, action: PayloadAction<string[]>) => {
      // Remove tags that are no longer used in any tasks or journal entries
      const currentlyUsedTags = action.payload;
      state.usedTags = state.usedTags.filter(tag => currentlyUsedTags.includes(tag));
    },
    setUsedTags: (state, action: PayloadAction<string[]>) => {
      state.usedTags = action.payload;
    },
  },
});

export const {
  addUsedTag,
  addUsedTags,
  clearUnusedTags,
  setUsedTags,
} = tagsSlice.actions;

// Selectors
export const selectAllUsedTags = (state: { tags: TagsState }) => state.tags.usedTags;
export const selectAllTags = (state: { tags: TagsState }) => state.tags.usedTags;

export const selectTagSuggestions = (query: string) => (state: { tags: TagsState }) => {
  if (!query.trim()) return state.tags.usedTags.slice(0, 10);
  
  const queryLower = query.toLowerCase();
  return state.tags.usedTags
    .filter(tag => tag.toLowerCase().includes(queryLower))
    .sort((a, b) => {
      // Prioritize tags that start with the query
      const aStarts = a.toLowerCase().startsWith(queryLower);
      const bStarts = b.toLowerCase().startsWith(queryLower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.localeCompare(b);
    })
    .slice(0, 10);
};

export default tagsSlice.reducer;