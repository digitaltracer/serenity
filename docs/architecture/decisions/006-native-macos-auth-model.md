# ADR-006: Native macOS Authentication Model (OAuth + Optional Local Lock)

**Date**: 2026-02-14
**Status**: Accepted
**Author**: Serenity Team

## Context

The native macOS migration requires an authentication model that supports cloud identity, secure local usage, and offline-friendly workflows. The previous Electron model centered on a master-password/session approach and secure settings storage. The migration plan locks these requirements:

1. OAuth account authentication is required.
2. Local app lock remains available as an optional user control.
3. Touch ID support should unlock the app lock where available.
4. Secrets and tokens must move to Keychain-backed storage.

The model must work for both `serenityCloud` and local/external database profiles while preserving a clear boundary between account authentication and local access control.

## Decision

Adopt a dual-layer authentication model:

1. **Primary identity**: OAuth account session for cloud-backed features and cross-device identity.
2. **Secondary local gate (optional)**: Local lock (password + Touch ID) that controls local UI access and sensitive operations even when OAuth is valid.

Implementation baseline:

- OAuth session lifecycle is managed as the account authority.
- Local lock state is device-local and never replaces OAuth identity.
- Tokens, provider credentials, and integration secrets are stored in Keychain.
- Sensitive operations can require an active local unlock window.

## Consequences

### Positive

- Matches locked migration scope and preserves current security expectations.
- Separates concerns cleanly: account identity vs local physical/session protection.
- Supports secure secret storage through native Keychain APIs.
- Enables Touch ID-based low-friction unlock.

### Negative

- Adds complexity in state coordination (OAuth session + local lock session).
- Requires careful UX to avoid user confusion about which lock is active.
- More edge cases around startup, timeout, and background/foreground transitions.

### Neutral

- Local-only backend usage may still ask for OAuth in some flows depending on feature policy.
- Security policy and timeout defaults will need periodic review.

## Alternatives Considered

### Alternative 1: OAuth only (no local lock)

**Pros**:
- Simpler architecture and fewer states.
- Lower implementation effort.

**Cons**:
- Removes an explicit local security control users currently rely on.
- Weaker protection for shared devices and shoulder-surfing scenarios.

**Why not chosen**: Does not meet locked migration decision for optional local lock.

### Alternative 2: Local lock only (no OAuth)

**Pros**:
- Works fully offline.
- Simpler local account model.

**Cons**:
- Breaks cloud identity and sync requirements.
- Incompatible with locked cloud-at-launch scope.

**Why not chosen**: Incompatible with required cloud sync and account model.

## Implementation Notes

- Core modules expected: `AuthSessionService`, `LocalLockService`, `KeychainSecretStore`.
- Sensitive actions should consult a shared security policy service.
- Related ADRs: ADR-001, ADR-004, ADR-008.
- Related plan: `docs/plans/2026-02-14-macos-swiftui-native-migration-plan.md`.

## References

- `docs/plans/2026-02-14-macos-swiftui-native-migration-plan.md`
- `docs/architecture/decisions/004-electron-ipc-architecture.md`
