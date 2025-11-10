# Repository Guidelines

## Project Structure & Module Organization
- Monorepo (Turborepo) with workspaces:
  - `apps/desktop`: Electron app (main + renderer via Vite).
  - `packages/core`: Business logic, Redux store, types.
  - `packages/ui`: Shared React components and UI primitives.
  - `packages/database`: SQL schema and DB helpers.
  - `scripts/`, `screenshots/`: Dev helpers and assets.

## Build, Test, and Development Commands
- Root:
  - `npm run dev`: Start all workspaces in dev mode.
  - `npm run build`: Build all packages/apps.
  - `npm run lint`: Lint repo (ESLint + Prettier integration).
  - `npm run test`: Run tests across workspaces.
  - `npm run clean`: Clean build outputs.
  - `npm run format`: Format `ts/tsx/md` with Prettier.
  - `npm run type-check`: TypeScript project check.
- Filters: `npm run dev --filter=@serenity/desktop`, `npm run build --filter=@serenity/core`.
- Desktop app: `apps/desktop`
  - `npm run dev` (Vite + TS watch) • `npm run start` (build + run) • `npm run dist` (electron-builder).

## Coding Style & Naming Conventions
- Language: TypeScript; React 18.
- Formatting: Prettier (`singleQuote: true`, `trailingComma: all`, `printWidth: 100`).
- Linting: ESLint with TS, React, hooks; fix warnings before PR.
- Indentation: 2 spaces; no tabs.
- Naming: PascalCase components, camelCase variables, kebab-case files/assets; workspace scope `@serenity/<pkg>`.

## Testing Guidelines
- Framework: Jest in `packages/core`; expand similarly in other packages.
- File names: `*.test.ts(x)` colocated with source.
- Run: `npm run test` or `npm run test --filter=@serenity/core`.
- Targets: business logic, critical UI flows; mock external services; keep tests deterministic.

## Commit & Pull Request Guidelines
- Commits: Conventional Commits (e.g., `feat: add task snooze`, `fix: journal date parsing`).
- PRs should include:
  - Clear description with context; link issues (`Closes #123`).
  - Screenshots/GIFs for UI changes in `apps/desktop`.
  - Passing build, tests, lint, and `type-check`.
  - Scope limited to a single concern; update docs where relevant.

## Security & Configuration Tips
- Secrets: `cp .env.example .env`; never commit `.env`.
- Electron: keep `contextIsolation: true` and `nodeIntegration: false`; validate/sanitize IPC.
- Data: avoid logging sensitive values; use structured logs.

> Quick start: `npm install && npm run dev` at the repo root.
