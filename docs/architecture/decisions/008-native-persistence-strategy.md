# ADR-008: Native Persistence Strategy (GRDB Migrations + Multi-Backend Adapters)

**Date**: 2026-02-14
**Status**: Accepted
**Author**: Serenity Team

## Context

Electron persistence currently relies on TypeScript-managed migrations and SQLite usage patterns inside desktop services. The native migration plan requires:

1. GRDB-based SQLite persistence for local mode.
2. Cloud-backed persistence with local cache for `serenityCloud`.
3. External PostgreSQL support as a primary backend option.
4. A full Swift rewrite without TypeScript runtime ownership of schema migrations.

To reach parity and keep correctness, schema ownership and migration execution must move into native Swift code.

## Decision

Use GRDB as the native local persistence foundation and make Swift migration runners the schema authority.

- `sqliteLocal`:
  - GRDB-backed database layer.
  - Swift `DatabaseMigrator` owns schema evolution.
- `serenityCloud`:
  - Remote APIs as source of truth.
  - Local cache persisted via GRDB for offline/read performance.
- `externalPostgres`:
  - Dedicated adapter for direct PostgreSQL connectivity.
  - Contract-level parity with local/cloud repositories.

No new TypeScript migrations will be introduced for native app schema ownership.

## Consequences

### Positive

- Establishes one native source of truth for local schema changes.
- Aligns data layer with Swift domain architecture and testing.
- Supports required launch profile matrix with a consistent repository contract.

### Negative

- Migration parity work from TS to Swift is substantial.
- Data model drift risk during transition unless continuously validated.
- Adapter-level consistency rules must be carefully documented and tested.

### Neutral

- Electron and native schema tracks may temporarily coexist during migration.
- Migration tooling and observability become part of core platform work.

## Alternatives Considered

### Alternative 1: Keep TypeScript migrations as canonical

**Pros**:
- Reuses existing migration assets.
- Lower short-term migration effort.

**Cons**:
- Conflicts with full Swift rewrite objective.
- Requires embedding or coordinating non-native migration runtime.

**Why not chosen**: Violates native ownership goal.

### Alternative 2: Core Data for local persistence

**Pros**:
- Deep Apple ecosystem integration.
- Built-in object graph tooling.

**Cons**:
- Harder SQL-level parity with existing schema and queries.
- Less direct path for external PostgreSQL contract parity.

**Why not chosen**: GRDB provides a closer fit to existing relational model and migration requirements.

## Implementation Notes

- Initial migration runner should live in native data layer bootstrap.
- Every migrated table should include repository tests for CRUD and migration safety.
- Add diagnostics for schema version and profile health in Settings.
- Related ADRs: ADR-001, ADR-006, ADR-007.
- Related plan: `docs/plans/2026-02-14-macos-swiftui-native-migration-plan.md`.

## References

- `docs/plans/2026-02-14-macos-swiftui-native-migration-plan.md`
- `docs/architecture/decisions/001-sqlite-primary-database.md`
