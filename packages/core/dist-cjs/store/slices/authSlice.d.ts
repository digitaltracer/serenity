export interface AuthState {
    isLocked: boolean;
    isInitialized: boolean;
    hasMasterPassword: boolean;
    isValidating: boolean;
    failedAttempts: number;
    maxAttempts: number;
    lockoutUntil: number | null;
    autoLockTimeout: number;
    lastActivity: number;
    error: string | null;
    sessionActive: boolean;
}
export declare const initializeAuth: import("@reduxjs/toolkit").AsyncThunk<{
    hasMasterPassword: boolean;
    autoLockTimeout: number;
    isLocked: boolean;
}, void, {
    state?: unknown;
    dispatch?: import("redux").Dispatch;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const validatePassword: import("@reduxjs/toolkit").AsyncThunk<{
    success: boolean;
}, string, {
    state?: unknown;
    dispatch?: import("redux").Dispatch;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const setMasterPassword: import("@reduxjs/toolkit").AsyncThunk<{
    success: boolean;
}, {
    password: string;
    settings: any;
}, {
    state?: unknown;
    dispatch?: import("redux").Dispatch;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const authenticateWithBiometric: import("@reduxjs/toolkit").AsyncThunk<{
    success: boolean;
}, string | undefined, {
    state?: unknown;
    dispatch?: import("redux").Dispatch;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const resetPassword: import("@reduxjs/toolkit").AsyncThunk<{
    success: boolean;
}, void, {
    state?: unknown;
    dispatch?: import("redux").Dispatch;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const factoryReset: import("@reduxjs/toolkit").AsyncThunk<{
    success: boolean;
}, void, {
    state?: unknown;
    dispatch?: import("redux").Dispatch;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const lockApp: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"auth/lockApp">, unlockApp: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"auth/unlockApp">, updateLastActivity: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"auth/updateLastActivity">, clearError: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"auth/clearError">, setAutoLockTimeout: import("@reduxjs/toolkit").ActionCreatorWithPayload<number, "auth/setAutoLockTimeout">, checkAutoLock: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"auth/checkAutoLock">;
export declare const selectAuth: (state: {
    auth: AuthState;
}) => AuthState;
export declare const selectIsLocked: (state: {
    auth: AuthState;
}) => boolean;
export declare const selectIsInitialized: (state: {
    auth: AuthState;
}) => boolean;
export declare const selectHasMasterPassword: (state: {
    auth: AuthState;
}) => boolean;
export declare const selectIsValidating: (state: {
    auth: AuthState;
}) => boolean;
export declare const selectAuthError: (state: {
    auth: AuthState;
}) => string | null;
export declare const selectFailedAttempts: (state: {
    auth: AuthState;
}) => number;
export declare const selectLockoutTime: (state: {
    auth: AuthState;
}) => number;
export declare const selectSessionActive: (state: {
    auth: AuthState;
}) => boolean;
export declare const getSessionMasterPassword: () => string | null;
declare const _default: import("redux").Reducer<AuthState>;
export default _default;
//# sourceMappingURL=authSlice.d.ts.map