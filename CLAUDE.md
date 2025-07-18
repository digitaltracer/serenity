# Serenity Notes - Development Guide

## Project Overview

Serenity Notes is a cross-platform productivity application that integrates task management (ActionHub) and journaling functionality. Built with a monorepo architecture supporting both desktop (Electron) and mobile (React Native) platforms.

### Key Features
- **ActionHub**: Comprehensive task management with projects, priorities, and due dates
- **Journal**: Rich text journaling with task integration and tagging
- **Analytics**: Productivity insights and progress tracking
- **Cross-Platform**: Desktop (Electron) and Mobile (React Native) applications
- **Self-Hosted**: User-controlled PostgreSQL database
- **Themes**: Light/Dark mode with system preference detection and top-right toggle
- **Advanced Features**: Subtasks, recurring patterns, tag suggestions, real-time analytics

## Architecture

```
serenity/
├── packages/
│   ├── core/         # Business logic, Redux store, TypeScript types
│   ├── ui/           # Shared UI components with Tailwind CSS
│   └── database/     # PostgreSQL schema and query functions
├── apps/
│   ├── desktop/      # Electron application
│   └── mobile/       # React Native application
└── scripts/          # Build and development scripts
```

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **State Management**: Redux Toolkit with RTK Query
- **Desktop**: Electron with security best practices
- **Mobile**: React Native with NativeWind
- **Database**: PostgreSQL with pg-promise
- **Build System**: Turborepo, Vite, TypeScript
- **Styling**: Tailwind CSS with custom design system

## Current Implementation Status

### ✅ Completed
- Core architecture and monorepo setup
- TypeScript interfaces and types
- Redux state management (tasks, projects, journal, UI, user, tags)
- Comprehensive UI component library with dark theme support
- Desktop app structure with Electron and proper window controls
- **Complete theme system with top-right toggle (light/dark/system)**
- **Real-time analytics with intelligent insights**
- **Advanced task management with subtasks and recurring patterns**
- **Intelligent tag suggestion system with autocomplete**
- **Separate subtask modal with parent task selection**
- **Draggable app window with proper header regions**
- Main page components (HomePage, ActionHubPage, JournalPage, AnalyticsPage, SettingsPage)
- Task and Journal CRUD operations
- Rich component library (TaskModal, JournalEntryModal, SubtaskModal, TagInput, ThemeToggle)
- Build system fixes (Vite/Rollup export issues)
- Theme toggle functionality
- Layout component with proper UI components
- Quick add task and journal entry modals
- Rich text editor for journal entries

### 🚧 In Progress
- Performance optimizations and UI polish
- Advanced filtering and search capabilities

### ⏳ Planned
- Database integration for persistence
- Mobile application
- Advanced keyboard shortcuts
- Data export/import functionality
- Advanced recurring task patterns
- Team collaboration features
- Advanced analytics charts and visualizations
- Real-time sync across devices

## Recent Enhancements

### 🎨 UI/UX Improvements
- **Draggable Window**: App is now draggable from header region with proper window controls
- **Theme Toggle**: Convenient top-right theme toggle button (light/dark/system)
- **Dark Mode**: Enhanced dark theme colors matching modern design standards
- **Responsive Design**: Improved layout and component responsiveness

### 🚀 Feature Additions
- **Subtask Management**: Separate modal for adding subtasks with parent task selection
- **Tag Suggestions**: Intelligent autocomplete system for tags with stored suggestions
- **Real-time Analytics**: Live calculations based on actual task and journal data
- **Recurring Tasks**: Support for daily, weekly, and monthly recurring patterns

### 🔧 Technical Improvements
- **Build System**: Fixed Vite/Rollup export issues for reliable builds
- **Component Library**: Expanded with specialized components (TagInput, ThemeToggle, SubtaskModal)
- **State Management**: Added tags slice for intelligent tag suggestions
- **Type Safety**: Enhanced TypeScript coverage across all components

### 📊 Analytics Features
- **Smart Metrics**: Completion rates, productivity streaks, task distribution
- **Intelligent Insights**: Personalized suggestions based on user behavior
- **Dynamic Calculations**: Real-time updates based on actual data
- **Trend Analysis**: Most productive day, project analysis, improvement suggestions

## Development Workflow

### Setup
```bash
# Install dependencies
npm install

# Build shared packages
npm run build

# Start development (builds only)
npm run dev

# Run the desktop app
npm run build  # Build first
cd apps/desktop && npm run electron

# Or use the start script
npm run start
```

### Build Commands
```bash
# Build all packages
npm run build

# Build specific package
npm run build --filter=@serenity/desktop

# Clean build artifacts
npm run clean

# Lint code
npm run lint

# Run tests
npm run test
```

### Desktop Development
```bash
cd apps/desktop

# Development with hot reload
npm run dev

# Build for production
npm run build

# Create distribution packages
npm run dist
```

## Key Components

### Core Package (@serenity/core)
- **Types**: Task, Project, JournalEntry, User interfaces
- **Store**: Redux slices for state management
- **Utils**: Helper functions and utilities
- **Exports**: All shared business logic

### UI Package (@serenity/ui)
- **Components**: Reusable UI components
- **Styling**: Tailwind CSS with design system
- **Exports**: All UI components and utilities

### Database Package (@serenity/database)
- **Schema**: PostgreSQL table definitions
- **Queries**: Database interaction functions
- **Migrations**: Database schema updates

## Design System

### Colors
- **Light Theme**: 
  - Background: White, light grays
  - Text: Dark grays, blacks
  - Accent: Blue (#3B82F6)
  - Success: Green, Warning: Orange, Error: Red

- **Dark Theme**:
  - Background: Dark navy (#1E293B), blacks
  - Text: Light grays, whites
  - Accent: Blue (#60A5FA)
  - Borders: Subtle grays

### Layout Patterns
- **Sidebar Navigation**: Collapsible with animated transitions
- **Card-Based UI**: Clean cards with shadows and rounded corners
- **Progress Indicators**: Circular progress bars for completion
- **Tag System**: Color-coded tags for organization

### Typography
- **Headers**: Clear hierarchy (text-3xl, text-2xl, text-xl)
- **Body**: Readable sizes (text-base, text-sm)
- **Colors**: High contrast ratios for accessibility

## State Management

### Redux Slices
1. **tasksSlice**: Task CRUD operations, filtering, completion
2. **projectsSlice**: Project management and organization
3. **journalSlice**: Journal entry management
4. **userSlice**: User preferences and settings
5. **uiSlice**: Theme, sidebar state, modals, notifications

### Key Selectors
- `selectFilteredTasks`: Get filtered and sorted tasks
- `selectActiveProjects`: Get non-archived projects
- `selectSidebarCollapsed`: Get sidebar state
- `selectTheme`: Get current theme preference

## Common Development Tasks

### Adding New Components
1. Create component in `packages/ui/src/components/`
2. Export from `packages/ui/src/index.ts`
3. Build UI package: `cd packages/ui && npm run build`
4. Import in app: `import { Component } from '@serenity/ui'`

### Adding New Features
1. Define types in `packages/core/src/types/`
2. Create Redux slice in `packages/core/src/store/slices/`
3. Add database queries in `packages/database/src/queries/`
4. Build core package: `cd packages/core && npm run build`
5. Implement UI in desktop app

### Theme Development
- Use Tailwind dark: variants (`dark:bg-gray-800`)
- Update theme via `dispatch(setTheme('dark' | 'light' | 'system'))`
- Test both themes during development

## Troubleshooting

### Build Issues
```bash
# Clean and rebuild all packages
npx turbo clean
npm run build

# Check specific package exports
node -e "console.log(Object.keys(require('./packages/core/dist/index.js')))"
```

### Import/Export Issues
- Ensure proper exports in package index files
- Check TypeScript declarations are generated
- Verify package.json main/types fields

### Theme Issues
- Check Tailwind CSS is properly configured
- Ensure dark: variants are applied correctly
- Verify theme state updates in Redux DevTools

## Performance Considerations

- **UI Virtualization**: For large task/journal lists
- **Lazy Loading**: For images and rich content
- **Memory Management**: Cleanup event listeners and subscriptions
- **Bundle Size**: Code splitting for large features

## Security Best Practices

- **Data Sanitization**: Escape user input in rich text
- **Credential Storage**: Use OS keychain for sensitive data
- **Database Security**: Parameterized queries, input validation
- **File Handling**: Validate uploads and file types

## Testing Strategy

### Unit Tests
- Core business logic functions
- Redux reducers and selectors
- Utility functions

### Integration Tests
- Database query functions
- API endpoints and data flow
- Cross-package interactions

### E2E Tests
- Critical user journeys
- Task creation and completion
- Journal entry workflows

## Deployment

### Desktop Distribution
```bash
cd apps/desktop
npm run dist

# Platform-specific builds
npm run dist -- --mac
npm run dist -- --win
npm run dist -- --linux
```

### Database Setup
```sql
-- Create database
CREATE DATABASE serenity_notes;

-- Run migrations
\i packages/database/src/schema/schema.sql
```

## Future Roadmap

### Short Term
- [ ] Complete build system fixes
- [ ] Implement theme toggle
- [ ] Add quick task/journal modals
- [ ] Rich text editor integration

### Medium Term
- [ ] Mobile app development
- [ ] Advanced task features
- [ ] Analytics dashboard
- [ ] Keyboard shortcuts

### Long Term
- [ ] Real-time collaboration
- [ ] Plugin system
- [ ] AI-powered suggestions
- [ ] Calendar integration

## Contributing

1. Follow conventional commit messages
2. Use TypeScript strict mode
3. Add tests for new features
4. Update documentation
5. Ensure cross-platform compatibility

---

**Last Updated**: July 2025
**Version**: 0.1.0 Alpha