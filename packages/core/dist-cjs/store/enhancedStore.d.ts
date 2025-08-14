/**
 * Enhanced store configuration with SQLite persistence and migration support
 */
/**
 * Create the enhanced store - always starts with localStorage middleware
 * SQLite functionality is added after app initialization
 */
export declare function createEnhancedStore(): import("@reduxjs/toolkit/dist/configureStore").ToolkitStore<{
    tasks: import("./slices/tasksSlice").TasksState;
    projects: import("./slices/projectsSlice").ProjectsState;
    journal: import("./slices/journalSlice").JournalState;
    user: import("./slices/userSlice").UserState;
    ui: import("./slices/uiSlice").UIState;
    tags: import("./slices/tagsSlice").TagsState;
    auth: import("./slices/authSlice").AuthState;
    database: import("./slices/databaseSlice").DatabaseState;
    shortcuts: import("./slices/shortcutsSlice").ShortcutsState;
    search: import("./slices/searchSlice").SearchState;
    dragDrop: import("./slices/dragDropSlice").DragDropReduxState;
    goals: import("./slices/goalsSlice").GoalsState;
    integrations: import("./slices/integrationsSlice").IntegrationsState;
    aiAssistant: import("./slices/aiAssistantSlice").AIAssistantState;
}, import("redux").AnyAction, import("@reduxjs/toolkit").MiddlewareArray<[import("@reduxjs/toolkit").ThunkMiddleware<{
    tasks: import("./slices/tasksSlice").TasksState;
    projects: import("./slices/projectsSlice").ProjectsState;
    journal: import("./slices/journalSlice").JournalState;
    user: import("./slices/userSlice").UserState;
    ui: import("./slices/uiSlice").UIState;
    tags: import("./slices/tagsSlice").TagsState;
    auth: import("./slices/authSlice").AuthState;
    database: import("./slices/databaseSlice").DatabaseState;
    shortcuts: import("./slices/shortcutsSlice").ShortcutsState;
    search: import("./slices/searchSlice").SearchState;
    dragDrop: import("./slices/dragDropSlice").DragDropReduxState;
    goals: import("./slices/goalsSlice").GoalsState;
    integrations: import("./slices/integrationsSlice").IntegrationsState;
    aiAssistant: import("./slices/aiAssistantSlice").AIAssistantState;
}, import("redux").AnyAction>, import("redux").Middleware<{}, any, import("redux").Dispatch<import("redux").AnyAction>>]>>;
export declare const store: import("@reduxjs/toolkit/dist/configureStore").ToolkitStore<{
    tasks: import("./slices/tasksSlice").TasksState;
    projects: import("./slices/projectsSlice").ProjectsState;
    journal: import("./slices/journalSlice").JournalState;
    user: import("./slices/userSlice").UserState;
    ui: import("./slices/uiSlice").UIState;
    tags: import("./slices/tagsSlice").TagsState;
    auth: import("./slices/authSlice").AuthState;
    database: import("./slices/databaseSlice").DatabaseState;
    shortcuts: import("./slices/shortcutsSlice").ShortcutsState;
    search: import("./slices/searchSlice").SearchState;
    dragDrop: import("./slices/dragDropSlice").DragDropReduxState;
    goals: import("./slices/goalsSlice").GoalsState;
    integrations: import("./slices/integrationsSlice").IntegrationsState;
    aiAssistant: import("./slices/aiAssistantSlice").AIAssistantState;
}, import("redux").AnyAction, import("@reduxjs/toolkit").MiddlewareArray<[import("@reduxjs/toolkit").ThunkMiddleware<{
    tasks: import("./slices/tasksSlice").TasksState;
    projects: import("./slices/projectsSlice").ProjectsState;
    journal: import("./slices/journalSlice").JournalState;
    user: import("./slices/userSlice").UserState;
    ui: import("./slices/uiSlice").UIState;
    tags: import("./slices/tagsSlice").TagsState;
    auth: import("./slices/authSlice").AuthState;
    database: import("./slices/databaseSlice").DatabaseState;
    shortcuts: import("./slices/shortcutsSlice").ShortcutsState;
    search: import("./slices/searchSlice").SearchState;
    dragDrop: import("./slices/dragDropSlice").DragDropReduxState;
    goals: import("./slices/goalsSlice").GoalsState;
    integrations: import("./slices/integrationsSlice").IntegrationsState;
    aiAssistant: import("./slices/aiAssistantSlice").AIAssistantState;
}, import("redux").AnyAction>, import("redux").Middleware<{}, any, import("redux").Dispatch<import("redux").AnyAction>>]>>;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
/**
 * Initialize the store with data from appropriate source
 */
export declare function initializeStoreData(): Promise<boolean>;
/**
 * Check if SQLite is available and working
 */
export declare function checkSQLiteAvailability(): Promise<boolean>;
/**
 * Get database statistics for monitoring
 */
export declare function getDatabaseStats(): Promise<any>;
//# sourceMappingURL=enhancedStore.d.ts.map