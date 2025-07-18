import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  activeModal: string | null;
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
  }>;
  loading: {
    [key: string]: boolean;
  };
}

const initialState: UIState = {
  sidebarCollapsed: false,
  theme: 'system',
  compactMode: false,
  activeModal: null,
  notifications: [],
  loading: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    setCompactMode: (state, action: PayloadAction<boolean>) => {
      state.compactMode = action.payload;
    },
    setActiveModal: (state, action: PayloadAction<string | null>) => {
      state.activeModal = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<UIState['notifications'][0], 'id'>>) => {
      const notification = {
        ...action.payload,
        id: Date.now().toString(),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setLoading: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      state.loading[action.payload.key] = action.payload.loading;
    },
    clearLoading: (state, action: PayloadAction<string>) => {
      delete state.loading[action.payload];
    },
  },
});

export const {
  setSidebarCollapsed,
  setTheme,
  setCompactMode,
  setActiveModal,
  addNotification,
  removeNotification,
  clearNotifications,
  setLoading,
  clearLoading,
} = uiSlice.actions;

// Selectors  
export const selectSidebarCollapsed = (state: { ui: UIState }) => state.ui.sidebarCollapsed;
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectCompactMode = (state: { ui: UIState }) => state.ui.compactMode;
export const selectActiveModal = (state: { ui: UIState }) => state.ui.activeModal;
export const selectNotifications = (state: { ui: UIState }) => state.ui.notifications;
export const selectLoading = (state: { ui: UIState }) => (key: string) => state.ui.loading[key] || false;

export default uiSlice.reducer;