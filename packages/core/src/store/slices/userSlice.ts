import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, UserPreferences } from '../../types';

export interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  compactMode: false,
  notifications: {
    enabled: true,
    sounds: true,
    taskReminders: true,
    dailyReview: false,
  },
  language: 'en',
  dateFormat: 'MM/dd/yyyy',
  timeFormat: '12h',
};

const initialState: UserState = {
  user: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload,
          updatedAt: new Date(),
        };
      }
    },
    updatePreferences: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      if (state.user) {
        state.user.preferences = {
          ...state.user.preferences,
          ...action.payload,
        };
        state.user.updatedAt = new Date();
      }
    },
    clearUser: (state) => {
      state.user = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setUser,
  updateUser,
  updatePreferences,
  clearUser,
  setLoading: setUserLoading,
  setError: setUserError,
} = userSlice.actions;

export const selectUser = (state: { user: UserState }) => state.user.user;
export const selectUserPreferences = (state: { user: UserState }) => 
  state.user.user?.preferences || defaultPreferences;
export const selectUserLoading = (state: { user: UserState }) => state.user.loading;
export const selectUserError = (state: { user: UserState }) => state.user.error;

export default userSlice.reducer;