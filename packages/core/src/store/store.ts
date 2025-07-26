import { configureStore } from '@reduxjs/toolkit';
import tasksReducer from './slices/tasksSlice';
import projectsReducer from './slices/projectsSlice';
import journalReducer from './slices/journalSlice';
import userReducer from './slices/userSlice';
import uiReducer from './slices/uiSlice';
import tagsReducer from './slices/tagsSlice';
import authReducer from './slices/authSlice';
import databaseReducer from './slices/databaseSlice';
import shortcutsReducer from './slices/shortcutsSlice';
import searchReducer from './slices/searchSlice';
import dragDropReducer from './slices/dragDropSlice';
import goalsReducer from './slices/goalsSlice';
import { persistenceMiddleware } from './middleware/persistenceMiddleware';

export const store = configureStore({
  reducer: {
    tasks: tasksReducer,
    projects: projectsReducer,
    journal: journalReducer,
    user: userReducer,
    ui: uiReducer,
    tags: tagsReducer,
    auth: authReducer,
    database: databaseReducer,
    shortcuts: shortcutsReducer,
    search: searchReducer,
    dragDrop: dragDropReducer,
    goals: goalsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
        ignoredActionsPaths: ['payload.date', 'payload.createdAt', 'payload.updatedAt', 'payload.dueDate', 'payload.lastConnected', 'payload.lastBackup', 'payload.lastOptimized', 'payload.startDate', 'payload.endDate', 'payload.reminderDate'],
      },
    }).concat(persistenceMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;