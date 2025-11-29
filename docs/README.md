# Serenity Notes Documentation

Welcome to the Serenity Notes documentation! This folder contains comprehensive documentation for the entire project.

## 📁 Documentation Structure

### Root Level Documents

- **[STATUS.md](./STATUS.md)** - Current implementation status (what's working, what's not)
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development patterns, best practices, how-tos
- **[CLAUDE.md](../CLAUDE.md)** - Main instructions for Claude Code (at repo root)

### Subdirectories

#### 📐 [architecture/](./architecture/)
Architecture documentation and decisions:
- **[decisions/](./architecture/decisions/)** - Architecture Decision Records (ADRs)
  - ADR-001: SQLite as Primary Database
  - ADR-002: AI Insights Context Continuity
  - ADR-003: Turborepo Monorepo Structure
  - ADR-004: Electron IPC Architecture
  - ADR-005: MCP OAuth Device Flow Authentication

#### ✨ [features/](./features/)
Feature-specific documentation:
- **[ai-insights.md](./features/ai-insights.md)** - AI Insights architecture and usage
- **[database.md](./features/database.md)** - Database schema, migrations, best practices
- **[ipc-communication.md](./features/ipc-communication.md)** - IPC architecture and patterns
- **[mcp-authentication.md](./features/mcp-authentication.md)** - MCP OAuth device flow authentication

#### 🌐 [web-app/](./web-app/)
Web application documentation:
- **[FEATURE_PARITY_PROGRESS.md](./web-app/FEATURE_PARITY_PROGRESS.md)** - Complete feature parity journey (78% → 100%)
- **[FEATURE_PARITY_AUDIT.md](./web-app/FEATURE_PARITY_AUDIT.md)** - Detailed feature comparison
- **[FEATURE_PARITY_SUMMARY.md](./web-app/FEATURE_PARITY_SUMMARY.md)** - Quick reference summary
- **[IMPLEMENTATION_GUIDE.md](./web-app/IMPLEMENTATION_GUIDE.md)** - Implementation patterns and code examples
- **[WEB_APP_STATUS.md](./web-app/WEB_APP_STATUS.md)** - Web app specific status
- **[PARITY_AT_A_GLANCE.txt](./web-app/PARITY_AT_A_GLANCE.txt)** - Visual parity overview

#### 📚 [api/](./api/)
Auto-generated API documentation:
- Run `npm run docs:generate` to regenerate
- Contains TypeDoc output for all packages
- Class references, interfaces, functions, and type definitions

---

## 🚀 Quick Start

**New to the project?** Start here:
1. Read [STATUS.md](./STATUS.md) - Know what's implemented
2. Read [DEVELOPMENT.md](./DEVELOPMENT.md) - Understand development patterns
3. Browse [features/](./features/) - Learn about key features
4. Check [architecture/decisions/](./architecture/decisions/) - Understand architectural choices

**Working on web app?** Go to:
- [web-app/FEATURE_PARITY_PROGRESS.md](./web-app/FEATURE_PARITY_PROGRESS.md) - See the complete parity achievement

**Need API reference?** Check:
- [api/](./api/) - Auto-generated API documentation

---

## 📝 Documentation Standards

### When to Create Documentation

**Architecture Decision Records (ADRs):**
- Create when making significant architectural decisions
- Use template in `architecture/decisions/template.md`
- Number sequentially (ADR-005, ADR-006, etc.)

**Feature Documentation:**
- Create for complex features with multiple components
- Place in `features/` directory
- Include architecture, usage, and examples

**Web App Documentation:**
- Place web-specific docs in `web-app/`
- Keep feature parity tracking up to date
- Document API endpoints and patterns

### Documentation Workflow

**For New Features:**
1. Create ADR if architectural decision is needed
2. Create or update feature doc in `features/`
3. Add JSDoc comments to new services/methods
4. Run `npm run docs:generate` to update API docs
5. Update `STATUS.md` with new status

**For Bug Fixes:**
1. Update feature doc if behavior changes
2. Update `STATUS.md` if changing status (⚠️ → ✅)

**For Refactoring:**
1. Create ADR if changing architecture
2. Update affected feature docs
3. Regenerate API docs if interfaces changed

---

## 🏗️ Project Architecture

### Monorepo Structure
```
serenity/
├── apps/
│   ├── desktop/          # Electron app
│   └── web/             # Next.js web app
└── packages/
    ├── core/            # Business logic, Redux, utilities
    ├── ui/              # Shared React components
    └── database/        # Database layer (SQLite + PostgreSQL)
```

### Key Technologies
- **Desktop**: Electron, React, Vite
- **Web**: Next.js 14, React, PostgreSQL
- **Shared**: TypeScript, Redux Toolkit, Tailwind CSS
- **Database**: SQLite (desktop), PostgreSQL (web)

---

## 🤝 Contributing to Documentation

**Good documentation prevents knowledge loss and speeds up development.**

When making changes:
- Keep docs in sync with code
- Use clear, concise language
- Include code examples where helpful
- Update related docs when changing features
- Run `npm run docs:generate` after API changes

---

## 📊 Current Status

- ✅ Desktop App: Production ready
- ✅ Web App: **100% feature parity** achieved!
- ✅ Shared Packages: Fully implemented
- ✅ Documentation: Comprehensive and up-to-date

**Last Updated:** November 17, 2025
