"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectUserError = exports.selectUserLoading = exports.selectUserPreferences = exports.selectUser = exports.setUserError = exports.setUserLoading = exports.clearUser = exports.updatePreferences = exports.updateUser = exports.setUser = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const defaultPreferences = {
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
const initialState = {
    user: null,
    loading: false,
    error: null,
};
const userSlice = (0, toolkit_1.createSlice)({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload;
        },
        updateUser: (state, action) => {
            if (state.user) {
                state.user = {
                    ...state.user,
                    ...action.payload,
                    updatedAt: new Date(),
                };
            }
        },
        updatePreferences: (state, action) => {
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
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
    },
});
_a = userSlice.actions, exports.setUser = _a.setUser, exports.updateUser = _a.updateUser, exports.updatePreferences = _a.updatePreferences, exports.clearUser = _a.clearUser, exports.setUserLoading = _a.setLoading, exports.setUserError = _a.setError;
const selectUser = (state) => state.user.user;
exports.selectUser = selectUser;
const selectUserPreferences = (state) => state.user.user?.preferences || defaultPreferences;
exports.selectUserPreferences = selectUserPreferences;
const selectUserLoading = (state) => state.user.loading;
exports.selectUserLoading = selectUserLoading;
const selectUserError = (state) => state.user.error;
exports.selectUserError = selectUserError;
exports.default = userSlice.reducer;
