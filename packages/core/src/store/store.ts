import { configureStore } from '@reduxjs/toolkit';
import tasksReducer from './slices/tasksSlice';
import projectsReducer from './slices/projectsSlice';
import journalReducer from './slices/journalSlice';
import userReducer from './slices/userSlice';
import uiReducer from './slices/uiSlice';
import tagsReducer from './slices/tagsSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    tasks: tasksReducer,
    projects: projectsReducer,
    journal: journalReducer,
    user: userReducer,
    ui: uiReducer,
    tags: tagsReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;