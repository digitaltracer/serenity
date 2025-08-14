export interface GitHubToken {
    id: string;
    token: string;
    username: string;
    displayName?: string;
    organizations?: string[];
    repositories?: string[];
    lastSync?: string;
    isActive: boolean;
    createdAt: string;
}
export interface GoogleCalendarIntegration {
    connected: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    userEmail?: string;
    lastSync?: string;
    syncEnabled: boolean;
    connectionDate?: string;
    clientId?: string;
    clientSecret?: string;
}
export interface GitHubIntegration {
    connected: boolean;
    tokens: GitHubToken[];
    syncEnabled: boolean;
    lastSync?: string;
    totalRepositories?: number;
}
export interface IntegrationsState {
    googleCalendar: GoogleCalendarIntegration;
    github: GitHubIntegration;
    syncing: boolean;
    lastSyncError?: string;
}
export declare const initializeIntegrations: import("@reduxjs/toolkit").AsyncThunk<IntegrationsState, string | null, {
    state?: unknown;
    dispatch?: import("redux").Dispatch;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const updateGoogleCalendarSyncEnabled: import("@reduxjs/toolkit").AsyncThunk<{
    enabled: boolean;
    persisted: boolean;
}, boolean, {
    state?: unknown;
    dispatch?: import("redux").Dispatch;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const updateGitHubSyncEnabled: import("@reduxjs/toolkit").AsyncThunk<{
    enabled: boolean;
    persisted: boolean;
}, boolean, {
    state?: unknown;
    dispatch?: import("redux").Dispatch;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const persistIntegrationsState: import("@reduxjs/toolkit").AsyncThunk<true, string, {
    state?: unknown;
    dispatch?: import("redux").Dispatch;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const connectGoogleCalendar: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    userEmail: string;
    clientId?: string;
    clientSecret?: string;
}, "integrations/connectGoogleCalendar">, disconnectGoogleCalendar: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"integrations/disconnectGoogleCalendar">, updateGoogleCalendarTokens: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    accessToken: string;
    expiresAt: number;
}, "integrations/updateGoogleCalendarTokens">, setGoogleCalendarSyncEnabled: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "integrations/setGoogleCalendarSyncEnabled">, updateGoogleCalendarLastSync: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "integrations/updateGoogleCalendarLastSync">, saveGoogleCalendarCredentials: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    clientId: string;
    clientSecret: string;
}, "integrations/saveGoogleCalendarCredentials">, connectGitHub: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    token: GitHubToken;
}, "integrations/connectGitHub">, addGitHubToken: import("@reduxjs/toolkit").ActionCreatorWithPayload<GitHubToken, "integrations/addGitHubToken">, removeGitHubToken: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "integrations/removeGitHubToken">, updateGitHubToken: import("@reduxjs/toolkit").ActionCreatorWithPayload<GitHubToken, "integrations/updateGitHubToken">, toggleGitHubTokenActive: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "integrations/toggleGitHubTokenActive">, disconnectGitHub: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"integrations/disconnectGitHub">, setGitHubSyncEnabled: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "integrations/setGitHubSyncEnabled">, updateGitHubTotalRepositories: import("@reduxjs/toolkit").ActionCreatorWithPayload<number, "integrations/updateGitHubTotalRepositories">, updateGitHubLastSync: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "integrations/updateGitHubLastSync">, setSyncing: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "integrations/setSyncing">, setSyncError: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "integrations/setSyncError">, clearSyncError: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"integrations/clearSyncError">, restoreState: import("@reduxjs/toolkit").ActionCreatorWithPayload<IntegrationsState, "integrations/restoreState">;
declare const _default: import("redux").Reducer<IntegrationsState>;
export default _default;
export declare const selectGoogleCalendarIntegration: (state: {
    integrations: IntegrationsState;
}) => GoogleCalendarIntegration;
export declare const selectGitHubIntegration: (state: {
    integrations: IntegrationsState;
}) => GitHubIntegration;
export declare const selectIsSyncing: (state: {
    integrations: IntegrationsState;
}) => boolean;
export declare const selectLastSyncError: (state: {
    integrations: IntegrationsState;
}) => string | undefined;
//# sourceMappingURL=integrationsSlice.d.ts.map