# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Plan & Review

### Before starting work
- Always in plan mode to make a plan
- After you get the plan, make sure you Write the plan to .claude/tasks/TASK_NAME.md
- The plan should be a detailed implementation plan and the reasoning behind them, as well as tasks broken down.
- If the task require external knowledge or certain package, also research to get the latest knowledge (Use Task tool for research)
- Don't over plan it, always think MVP.
- Oce you write the plan, firstly ask me to review it. Do not continue until I approve the plan.

### While implementing
- You should update the plan as you work.
- After you complete tasks in the plan, you should update and append detailed descriptions of the changes you made, so following tasks can be easily hand over to other engineers.

## Project Overview

Serenity Notes is a cross-platform productivity application that combines task management (ActionHub) with journaling. Built with a monorepo architecture using Turborepo, it consists of an Electron desktop app with shared TypeScript packages.

## Build & Development Commands

### Root Level
```bash
npm install                     # Install all dependencies (automatically builds all packages via postinstall hook)
npm run build                   # Build all packages in dependency order (core → database → ui → desktop)
npm run dev                     # Start all apps in watch mode with Turborepo
npm run lint                    # Lint all packages
npm run test                    # Run tests across all packages
npm run clean                   # Clean all build artifacts
npm run format                  # Format code with Prettier
npm run type-check              # TypeScript type checking without emitting
```

**First-time Setup**: After cloning the repository, simply run `npm install`. The postinstall hook will automatically build all packages in the correct order, ensuring all build artifacts (including `dist-cjs/` for CommonJS) are generated.

### Desktop App (apps/desktop)
```bash
npm run dev                     # Start Vite dev server (renderer) + TypeScript watch (main)
npm run build                   # Build both renderer (Vite) and main process (tsc)
npm run build:renderer          # Build renderer process only (Vite)
npm run build:main              # Build main process only (TypeScript)
npm run electron                # Run the built Electron app
npm run start                   # Build and run
npm run dist                    # Create distribution packages
npm run rebuild                 # Rebuild native modules (better-sqlite3) for Electron
```

### Package Development
```bash
# Watch mode for individual packages
cd packages/core && npm run dev        # Watch core package
cd packages/ui && npm run dev          # Watch UI components
cd packages/database && npm run dev    # Watch database package

# Build individual packages
npm -w @serenity/core run build
npm -w @serenity/ui run build
npm -w @serenity/database run build
```

### Important Notes
- **First Install**: Run `npm install` after cloning - the postinstall hook will automatically build all packages (including `dist-cjs/` for CommonJS).
- **Build Order**: Always build packages in order: `core → database → ui → desktop`. The root `npm run build` handles this automatically.
- **Native Modules**: After `npm install`, native modules (better-sqlite3) are automatically rebuilt for your Node.js/Electron version via postinstall hook.
- **Dual Module System**: `@serenity/core` outputs both ESM (`dist/`) and CommonJS (`dist-cjs/`) for maximum compatibility.
- **Build Issues**: If you encounter "Cannot find module" errors, run `npm run clean && npm run build` to clear stale build caches and rebuild from scratch.

## Architecture

### Monorepo Structure
```
serenity/
├── apps/
│   └── desktop/               # Electron application
│       ├── src/
│       │   ├── main/          # Electron main process (Node.js)
│       │   │   ├── ipc/       # IPC handlers (tasks, journal, auth, integrations, etc.)
│       │   │   ├── services/  # Backend services (TaskService, JournalService, etc.)
│       │   │   ├── security/  # Security policies and CSP
│       │   │   ├── middleware/# IPC middleware for auth and validation
│       │   │   ├── preload.ts # Preload script exposing safe APIs to renderer
│       │   │   └── main.ts    # App initialization
│       │   └── renderer/      # React UI (browser context)
│       │       ├── pages/     # Page components (ActionHub, Journal, Analytics, etc.)
│       │       ├── components/# Renderer-specific components
│       │       ├── store/     # Redux store configuration for renderer
│       │       └── App.tsx    # Main React app with routing
│       ├── vite.config.ts     # Vite build for renderer
│       └── tsconfig.main.json # TypeScript config for main process
│
└── packages/
    ├── core/                  # Business logic, Redux store, utilities
    │   ├── src/
    │   │   ├── store/         # Redux Toolkit setup
    │   │   │   ├── slices/    # Redux slices (tasks, journal, auth, ui, goals, etc.)
    │   │   │   └── middleware/# Custom middleware (persistence, error handling)
    │   │   ├── services/      # Core services (AI, integrations, encryption)
    │   │   ├── database/      # DatabaseManager (adapter pattern)
    │   │   ├── utils/         # Utilities (logger, crypto, privacy, secureStorage)
    │   │   ├── types/         # TypeScript type definitions
    │   │   ├── validation/    # Zod schemas
    │   │   ├── hooks/         # React hooks (keyboard shortcuts, drag-drop)
    │   │   └── persistence/   # Persistence layer abstraction
    │   ├── dist/              # ESM build output
    │   └── dist-cjs/          # CommonJS build output
    │
    ├── ui/                    # Shared React components with Tailwind
    │   └── src/
    │       ├── components/    # Reusable UI components (70+ components)
    │       ├── hooks/         # UI-specific hooks
    │       └── utils/         # UI utilities
    │
    └── database/              # Database layer (SQLite primary, PostgreSQL optional)
        └── src/
            ├── adapters/      # SQLiteAdapter, PostgresAdapter
            ├── sqlite/        # SQLite service and initialization
            ├── queries/       # Query functions (sqlite/, postgres/)
            │   ├── sqlite/    # SQLite-specific queries
            │   └── postgres/  # PostgreSQL-specific queries
            └── schema/        # SQL schema files
```

### Key Architectural Concepts

#### 1. Electron IPC Architecture
- **Main Process**: Node.js with full system access, manages SQLite database, handles business logic
- **Renderer Process**: Sandboxed browser context running React UI
- **Preload Script** (`apps/desktop/src/main/preload.ts`): Safely exposes IPC APIs to renderer via `window.api`
- **IPC Handlers** (`apps/desktop/src/main/ipc/`): Organized by domain (tasks, journal, auth, integrations, etc.)
- **Services** (`apps/desktop/src/main/services/`): Backend services called by IPC handlers

#### 2. Database Architecture
- **DatabaseManager** (`packages/core/src/database/DatabaseManager.ts`): Abstraction layer using adapter pattern
- **Primary**: SQLite (via better-sqlite3) for desktop - offline-first, no setup required
- **Optional**: PostgreSQL for server deployments
- **Adapters**: `SQLiteAdapter` and `PostgresAdapter` implement common `DatabaseOperations` interface
- **Queries**: Separate implementations in `packages/database/src/queries/sqlite/` and `packages/database/src/queries/postgres/`

#### 3. State Management
- **Redux Toolkit** with multiple slices:
  - `tasksSlice`: Task management with subtasks, projects, priorities
  - `journalSlice`: Journal entries with mood tracking
  - `authSlice`: Authentication and master password
  - `integrationsSlice`: Google Calendar, GitHub integration state
  - `uiSlice`: UI preferences, theme, compact mode
  - `goalsSlice`: Goal tracking and progress
  - `aiAssistantSlice`: AI-powered insights and analysis
  - `searchSlice`: Global search state
  - `shortcutsSlice`: Keyboard shortcut configuration
- **Enhanced Store** (`packages/core/src/store/enhancedStore.ts`): Custom persistence middleware for Redux state
- **Renderer Store** (`apps/desktop/src/renderer/store/`): Additional renderer-only configuration

#### 4. Security Architecture
- **Master Password**: bcryptjs with dynamic salt generation (see `packages/core/src/utils/privacy.ts`)
- **Secure Session Manager**: In-memory password storage during session
- **Encrypted Storage**: Electron safeStorage API for OAuth tokens
- **EncryptedIntegrationService**: Handles encrypted token storage/retrieval
- **CSP**: Content Security Policy enforcement
- **Sandboxing**: Renderer process runs in sandbox with restricted Node.js access

#### 5. AI Services
- **AIPreprocessingService**: Smart data summarization, temporal weighting, entity extraction
- **PromptEngineeringService**: Context-rich prompts with chain-of-thought reasoning
- **InsightQualityService**: Multi-dimensional quality scoring (relevance, actionability, novelty)
- **UserProfileService**: User behavior profiling for personalized insights
- See `AI-IMPROVEMENTS-SUMMARY.md` for detailed architecture

#### 6. Module System & Build
- **core package**: Dual build (ESM + CommonJS) to support both Electron main and renderer
  - ESM: `dist/index.js` (for modern imports)
  - CJS: `dist-cjs/index.js` (for Electron main process compatibility)
- **Renderer**: Vite bundles React app with code splitting (vendor, ui, core, database chunks)
- **Main Process**: TypeScript compiled to `dist/main.js`
- **Vite Externals**: Node.js modules (pg, better-sqlite3) externalized from renderer bundle

## Common Development Tasks

### Adding a New IPC Handler
1. Create handler in `apps/desktop/src/main/ipc/[domain]Handlers.ts`
2. Register in `apps/desktop/src/main/ipc/index.ts`
3. Add type definitions to `packages/core/src/types/ipc.ts`
4. Update preload script if exposing new API to renderer

### Adding a New Redux Slice
1. Create slice in `packages/core/src/store/slices/[feature]Slice.ts`
2. Add to root reducer in `packages/core/src/store/store.ts`
3. Export types from `packages/core/src/store/index.ts`
4. Use in renderer via `useSelector` and `useDispatch`

### Database Changes
1. Modify schema in `packages/database/src/schema/`
2. Update both SQLite and PostgreSQL adapters
3. Add migration script in `packages/database/src/migrations/`
4. Update query functions in `packages/database/src/queries/sqlite/` and `packages/database/src/queries/postgres/`

### Adding UI Components
1. Add to `packages/ui/src/components/` if reusable across apps
2. Use Tailwind CSS for styling (configured in `tailwind.config.js`)
3. Export from `packages/ui/src/index.ts`
4. Import in renderer: `import { Component } from '@serenity/ui'`

### Working with Native Modules
- **better-sqlite3** is a native addon requiring compilation
- Rebuild after Node.js/Electron version changes: `cd apps/desktop && npm run rebuild`
- `postinstall` hook auto-rebuilds on `npm install`

## Important Patterns & Conventions

### Logging
- Use structured logger from `@serenity/core`: `import { logger } from '@serenity/core'`
- Log levels: `logger.debug()`, `logger.info()`, `logger.warn()`, `logger.error()`
- Include context: `logger.info('message', { component: 'ComponentName', operation: 'operationName' })`
- Production builds strip `debug` and `trace` calls via Vite plugin

### Error Handling
- React Error Boundaries in renderer for graceful degradation
- Try-catch in IPC handlers with detailed error logging
- Return consistent error shapes: `{ success: false, error: string }`

### Type Safety
- Strict TypeScript mode enabled
- No `any` types - use `unknown` with type guards
- Zod schemas for runtime validation (see `packages/core/src/validation/`)
- Shared types in `packages/core/src/types/`

### Security Best Practices
- Never store passwords in plain text
- Use `secureSessionManager` for in-memory password storage
- Use `EncryptedIntegrationService` for OAuth tokens
- Validate all IPC inputs in middleware
- Sanitize user input before database queries

### State Persistence
- Redux state persisted to SQLite via custom middleware
- Selective persistence (auth tokens excluded)
- Rehydration on app startup from database

### Performance Considerations
- Virtual scrolling for large lists (using @tanstack/react-virtual)
- Code splitting in Vite config (vendor, ui, core chunks)
- Debounced search inputs
- Optimized SQLite queries (avoid N+1 with proper joins)

## Testing

- Testing framework: Jest (configured but limited coverage)
- Run tests: `npm run test` or `npm run test --filter=@serenity/core`
- Test files: `*.test.ts` or `*.spec.ts` (currently minimal)

## Environment Variables

See `.env.example` for configuration options:
- PostgreSQL connection settings (optional, SQLite is default)
- Google Calendar OAuth credentials
- GitHub integration credentials
- Analytics and monitoring settings

## Git Workflow

- Main branch: `feature/initial`
- Current branch: `improv/code-improvements`
- Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`

## Known Issues & Considerations

- SQLite is primary database; PostgreSQL support is experimental
- Native module rebuilding required when switching Node.js/Electron versions
- Dual module system (ESM + CJS) required for Electron compatibility
- Renderer cannot directly access Node.js APIs (use IPC through preload)
