# ADR-003: Turborepo Monorepo with Shared Packages

**Date**: 2024-12-01 (Original decision)
**Status**: Accepted
**Author**: Development Team

## Context

Serenity Notes is planned as a cross-platform application with:
- Desktop app (Electron)
- Future mobile app (React Native)
- Shared business logic, UI components, and database layer

We needed a code organization strategy that would:
- Share code between desktop and mobile apps
- Avoid code duplication
- Enable independent development of packages
- Support efficient builds (don't rebuild unchanged packages)
- Allow different deployment targets (desktop, mobile, potentially web)
- Maintain type safety across packages
- Scale as the project grows

We considered:
1. Single codebase (all code in one app)
2. Separate repositories for desktop/mobile
3. Monorepo with manual build orchestration
4. Monorepo with build tool (Lerna, Nx, Turborepo)

## Decision

Use **Turborepo** to manage a monorepo with:
- **Shared packages**: `@serenity/core`, `@serenity/ui`, `@serenity/database`
- **App packages**: `@serenity/desktop` (Electron), `@serenity/mobile` (planned)
- **Build orchestration**: Turborepo handles build order, caching, and parallelization
- **Package manager**: npm workspaces for dependency management

**Structure**:
```
serenity/
├── apps/
│   ├── desktop/      # Electron application
│   └── mobile/       # React Native (planned)
├── packages/
│   ├── core/         # Business logic, Redux store, types
│   ├── ui/           # Shared React components
│   └── database/     # Database adapters and queries
└── package.json      # Root workspace configuration
```

## Consequences

### Positive

- **Code Reuse**: Business logic (`@serenity/core`) shared between desktop and mobile
  - Redux slices, services, utilities, types
  - Single source of truth for state management
  - Consistent behavior across platforms

- **UI Consistency**: Shared components (`@serenity/ui`) ensure consistent design
  - 70+ reusable components
  - Tailwind CSS design system
  - Platform-specific overrides when needed

- **Database Abstraction**: `@serenity/database` provides adapter pattern
  - SQLite for desktop (offline-first)
  - PostgreSQL for server (future)
  - Same API for both adapters

- **Type Safety**: TypeScript types shared across all packages
  - No duplicate type definitions
  - Compiler catches cross-package breaking changes
  - Centralized type definitions in `@serenity/core/types`

- **Incremental Builds**: Turborepo caching
  - Only rebuilds changed packages
  - Caches build artifacts
  - Parallelizes independent builds
  - Significantly faster than rebuilding everything

- **Dependency Management**: npm workspaces
  - Single `node_modules` at root (deduplication)
  - `npm install` installs all packages
  - Internal packages use `workspace:*` protocol

- **Independent Versioning**: Each package can have its own version
  - `@serenity/core` can be updated without touching UI
  - Semantic versioning per package

- **Clear Boundaries**: Package separation enforces architecture
  - Database logic stays in `@serenity/database`
  - Business logic stays in `@serenity/core`
  - UI components stay in `@serenity/ui`
  - Apps (`desktop`, `mobile`) are thin integration layers

### Negative

- **Build Complexity**: More complex than single codebase
  - Must build packages in correct order (core → database → ui → apps)
  - Handled automatically by Turborepo but adds configuration
  - New developers need to understand monorepo structure

- **Dependency Graph**: Must manage inter-package dependencies
  - `@serenity/database` depends on `@serenity/core`
  - `@serenity/ui` depends on `@serenity/core`
  - `@serenity/desktop` depends on all three
  - Circular dependencies must be avoided

- **Tooling Setup**: Requires Turborepo configuration
  - `turbo.json` defines pipeline and caching
  - Each package needs `package.json` with proper exports
  - TypeScript project references for cross-package imports

- **Dual Module System**: `@serenity/core` requires both ESM and CommonJS
  - Electron main process needs CommonJS
  - Renderer prefers ESM
  - Requires two builds: `dist/` (ESM) and `dist-cjs/` (CJS)
  - See ADR-004 for details

### Neutral

- **Mobile App Not Yet Started**: `@serenity/mobile` planned but not implemented
  - Monorepo ready for mobile when development begins
  - Shared packages already structured for cross-platform use

- **Package Publishing**: Not publishing to npm (private monorepo)
  - Packages used internally only
  - No need for npm version management

## Alternatives Considered

### Alternative 1: Single Codebase

**Description**: All code in `apps/desktop`, no shared packages

**Pros**:
- Simplest setup
- No build orchestration needed
- Fastest development for single app

**Cons**:
- Code duplication when adding mobile app
- No clear boundaries between layers
- All code rebuilt on every change
- Harder to test individual layers

**Why not chosen**: Not scalable. Would require massive refactoring when adding mobile app.

---

### Alternative 2: Separate Repositories

**Description**: Separate Git repos for desktop, mobile, shared code

**Pros**:
- Complete independence
- Can use different CI/CD for each
- Clear ownership boundaries

**Cons**:
- Shared code management nightmare
  - Publish shared packages to npm or use git submodules
  - Version synchronization issues
  - Breaking changes harder to coordinate
- Atomic commits across repos impossible
- More complex to develop features that touch multiple layers

**Why not chosen**: Too much coordination overhead. Atomic cross-layer changes are important for productivity.

---

### Alternative 3: Monorepo with Nx

**Description**: Use Nx instead of Turborepo

**Pros**:
- More mature than Turborepo (older, more features)
- Excellent generator scaffolding
- Built-in testing, linting, and more
- Better IDE integration

**Cons**:
- More opinionated, steeper learning curve
- Heavier configuration
- More "magic" (harder to understand what's happening)
- Overkill for current project size

**Why not chosen**: Turborepo is simpler, lighter, and sufficient for current needs. Nx may be considered if project grows significantly.

---

### Alternative 4: Monorepo with Lerna

**Description**: Use Lerna for monorepo management

**Pros**:
- Older, well-established tool
- Good for publishing packages to npm
- Handles versioning and changelogs

**Cons**:
- Slower builds (no caching by default)
- Focused on publishing, not build orchestration
- Less active development (Turborepo/Nx more modern)

**Why not chosen**: Build performance and caching more important than publishing features (we're not publishing to npm). Turborepo is faster.

## Implementation Notes

**Build Order** (defined in `turbo.json`):
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],  // Build dependencies first
      "outputs": ["dist/**", "dist-cjs/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**Package Dependencies** (`package.json` in each package):
```json
// @serenity/database
{
  "dependencies": {
    "@serenity/core": "workspace:*"  // Depends on core
  }
}

// @serenity/ui
{
  "dependencies": {
    "@serenity/core": "workspace:*"  // Depends on core
  }
}

// @serenity/desktop
{
  "dependencies": {
    "@serenity/core": "workspace:*",
    "@serenity/ui": "workspace:*",
    "@serenity/database": "workspace:*"
  }
}
```

**TypeScript Project References** (`tsconfig.json`):
```json
{
  "references": [
    { "path": "../core" },
    { "path": "../ui" },
    { "path": "../database" }
  ]
}
```

**Root Package Scripts**:
```json
{
  "scripts": {
    "build": "npm -w @serenity/core run build && npm -w @serenity/database run build && npm -w @serenity/ui run build && npm -w @serenity/desktop run build",
    "dev": "turbo run dev --no-daemon",
    "clean": "turbo run clean --no-daemon"
  }
}
```

**Postinstall Hook**:
```json
{
  "scripts": {
    "postinstall": "npm run build"
  }
}
```
Ensures all packages are built after `npm install`, critical for first-time setup.

**Key Files**:
- Root: `package.json`, `turbo.json`
- Workspaces: `apps/desktop`, `packages/*`
- Each package: `package.json`, `tsconfig.json`

## Build Performance

**Before Turborepo** (manual builds):
- Full build: ~3-4 minutes
- Rebuild everything on any change
- No parallelization

**After Turborepo** (with caching):
- Full clean build: ~2-3 minutes
- Incremental build (cached): ~5-10 seconds
- Only rebuilds changed packages
- Parallel builds where possible

**Impact**: 95% reduction in rebuild time for incremental changes

## Shared Package Contents

### `@serenity/core`
- **Business Logic**: Services (AI, integrations, encryption)
- **State Management**: Redux Toolkit slices, store configuration
- **Database Manager**: Abstraction layer (adapter pattern)
- **Utilities**: Logger, crypto, privacy, secure storage
- **Types**: TypeScript type definitions
- **Validation**: Zod schemas
- **Hooks**: React hooks (keyboard shortcuts, drag-drop)

**Output**: Dual build (ESM + CJS) - 2 `dist/` folders

### `@serenity/ui`
- **React Components**: 70+ reusable UI components
- **Tailwind CSS**: Design system
- **Hooks**: UI-specific React hooks
- **Utilities**: UI helper functions

**Output**: ESM only

### `@serenity/database`
- **Adapters**: SQLiteAdapter, PostgresAdapter
- **Queries**: Database-specific query functions
- **Schema**: SQL schema files
- **Services**: SQLiteService, database initialization

**Output**: ESM only

## References

- Turborepo Documentation: https://turbo.build/repo/docs
- npm Workspaces: https://docs.npmjs.com/cli/v7/using-npm/workspaces
- Related ADR: ADR-004 (Dual Module System for Electron Compatibility)
- Implementation: Root `package.json`, `turbo.json`
