/**
 * Database State Management Slice
 * Manages database connection, configuration, and status
 */
import { DatabaseConfig, DatabaseConnectionStatus, DatabaseStats, DatabasePreferences } from '../../types/database';
export interface DatabaseState {
    config: DatabaseConfig | null;
    connectionStatus: DatabaseConnectionStatus;
    stats: DatabaseStats | null;
    preferences: DatabasePreferences;
    isConfigModalOpen: boolean;
    isConnecting: boolean;
    lastBackup: Date | null;
    error: string | null;
}
export declare const initializeDatabaseConfig: import("@reduxjs/toolkit").AsyncThunk<{
    config: null;
    status: {
        connected: boolean;
        type: "sqlite";
        error?: undefined;
    };
    stats?: undefined;
} | {
    config: DatabaseConfig;
    status: DatabaseConnectionStatus;
    stats: DatabaseStats;
} | {
    config: DatabaseConfig;
    status: {
        connected: boolean;
        type: "sqlite" | "postgresql";
        error: string;
    };
    stats?: undefined;
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
export declare const connectToDatabase: import("@reduxjs/toolkit").AsyncThunk<{
    config: DatabaseConfig;
    status: DatabaseConnectionStatus;
    stats: DatabaseStats;
}, DatabaseConfig, {
    state?: unknown;
    dispatch?: import("redux").Dispatch;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const disconnectFromDatabase: import("@reduxjs/toolkit").AsyncThunk<DatabaseConnectionStatus, void, {
    state?: unknown;
    dispatch?: import("redux").Dispatch;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const testDatabaseConnection: import("@reduxjs/toolkit").AsyncThunk<{
    isConnected: boolean;
    status: DatabaseConnectionStatus;
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
export declare const refreshDatabaseStats: import("@reduxjs/toolkit").AsyncThunk<DatabaseStats, void, {
    state?: unknown;
    dispatch?: import("redux").Dispatch;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const createDatabaseBackup: import("@reduxjs/toolkit").AsyncThunk<Date, string, {
    state?: unknown;
    dispatch?: import("redux").Dispatch;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const optimizeDatabase: import("@reduxjs/toolkit").AsyncThunk<DatabaseStats, void, {
    state?: unknown;
    dispatch?: import("redux").Dispatch;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const switchDatabase: import("@reduxjs/toolkit").AsyncThunk<{
    config: DatabaseConfig;
    status: DatabaseConnectionStatus;
    stats: DatabaseStats;
}, DatabaseConfig, {
    state?: unknown;
    dispatch?: import("redux").Dispatch;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const openConfigModal: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"database/openConfigModal">, closeConfigModal: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"database/closeConfigModal">, updateDatabasePreferences: import("@reduxjs/toolkit").ActionCreatorWithPayload<Partial<DatabasePreferences>, "database/updateDatabasePreferences">, clearDatabaseError: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"database/clearDatabaseError">, updateDatabaseConnectionStatus: import("@reduxjs/toolkit").ActionCreatorWithPayload<DatabaseConnectionStatus, "database/updateDatabaseConnectionStatus">, setTemporaryConfig: import("@reduxjs/toolkit").ActionCreatorWithPayload<DatabaseConfig | null, "database/setTemporaryConfig">;
declare const _default: import("redux").Reducer<DatabaseState>;
export default _default;
export declare const selectDatabaseConfig: (state: {
    database: DatabaseState;
}) => DatabaseConfig | null;
export declare const selectConnectionStatus: (state: {
    database: DatabaseState;
}) => DatabaseConnectionStatus;
export declare const selectDatabaseStats: (state: {
    database: DatabaseState;
}) => DatabaseStats | null;
export declare const selectDatabasePreferences: (state: {
    database: DatabaseState;
}) => DatabasePreferences;
export declare const selectIsConfigModalOpen: (state: {
    database: DatabaseState;
}) => boolean;
export declare const selectIsConnecting: (state: {
    database: DatabaseState;
}) => boolean;
export declare const selectDatabaseError: (state: {
    database: DatabaseState;
}) => string | null;
export declare const selectLastBackup: (state: {
    database: DatabaseState;
}) => Date | null;
export declare const selectIsConnected: (state: {
    database: DatabaseState;
}) => boolean;
export declare const selectDatabaseType: (state: {
    database: DatabaseState;
}) => import("../../types/database").DatabaseType;
export declare const selectCanConnect: (state: {
    database: DatabaseState;
}) => boolean;
export declare const selectNeedsBackup: (state: {
    database: DatabaseState;
}) => boolean;
//# sourceMappingURL=databaseSlice.d.ts.map