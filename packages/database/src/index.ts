// PostgreSQL exports (for backwards compatibility)
export * from './connection';
export * from './queries';

// SQLite-based database system
export * from './adapters/SQLiteAdapter';
export * from './sqlite/SQLiteService';
export * from './queries/sqlite/tasks';
export * from './queries/sqlite/projects';
export * from './queries/sqlite/journal';
export * from './queries/sqlite/goals';

// Postgres-based database system (server)
export * from './adapters/PostgresAdapter';
export * from './queries/postgres/tasks';
export * from './queries/postgres/projects';
export * from './queries/postgres/journal';
export * from './queries/postgres/goals';
