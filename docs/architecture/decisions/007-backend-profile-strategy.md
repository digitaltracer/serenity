# ADR-007: Backend Profile Strategy for Native macOS

**Date**: 2026-02-14
**Status**: Accepted
**Author**: Serenity Team

## Context

The native macOS plan requires support for three backend modes at launch:

1. `sqliteLocal`
2. `serenityCloud`
3. `externalPostgres`

The app must allow users to select one active primary backend profile in Settings and provide validation and diagnostics during profile switching. Existing Electron flows and data operations are coupled to IPC/service paths and need a native replacement that keeps backend differences isolated.

## Decision

Adopt a **backend profile abstraction** with one active primary profile at a time.

- Define capability-driven contracts for core domains (tasks, projects, journal, goals, insights, summaries, integrations, auth metadata).
- Implement one adapter per backend profile.
- Use a profile coordinator to:
  - persist active profile selection,
  - validate connectivity and prerequisites,
  - expose health diagnostics,
  - orchestrate profile switching.

The domain/use-case layer talks only to profile contracts, not directly to backend-specific code.

## Consequences

### Positive

- Keeps business logic stable while backend implementations evolve.
- Makes profile switching explicit and testable.
- Enables launch scope for both Serenity cloud and user PostgreSQL without duplicating UI logic.
- Supports progressive hardening of each adapter independently.

### Negative

- Adds adapter and contract surface area to maintain.
- Capability mismatches across profiles require explicit UX handling.
- Switching profiles introduces migration/consistency edge cases.

### Neutral

- Some features may be profile-limited initially and must expose clear UI state.
- Profile diagnostics become a first-class part of Settings UX.

## Alternatives Considered

### Alternative 1: Single backend hard-coded to cloud

**Pros**:
- Simplest implementation and test surface.
- Fastest initial migration path.

**Cons**:
- Violates locked scope for local SQLite and external PostgreSQL support.
- Forces existing local-first users into cloud dependency.

**Why not chosen**: Incompatible with launch requirements.

### Alternative 2: Separate app variants per backend

**Pros**:
- Each build can be optimized for one backend.
- Less runtime branching.

**Cons**:
- Release and support complexity increase significantly.
- Fragmented user experience and documentation.

**Why not chosen**: Operationally expensive and unnecessary for current team size.

## Implementation Notes

- Core interfaces expected under native domain packages, e.g. `BackendProfile`, `ProfileCapabilities`, `ProfileHealth`.
- Settings should include profile selection, connection tests, and diagnostics.
- Profile switch flow should include confirmation and validation gates.
- Related ADRs: ADR-001, ADR-006, ADR-008.
- Related plan: `docs/plans/2026-02-14-macos-swiftui-native-migration-plan.md`.

## References

- `docs/plans/2026-02-14-macos-swiftui-native-migration-plan.md`
- `docs/architecture/decisions/001-sqlite-primary-database.md`
