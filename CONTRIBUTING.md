# Contributing to Serenity Notes

Thank you for your interest in contributing to Serenity Notes! This document provides guidelines and information for contributors.

## Development Setup

### Prerequisites

- Node.js 18.0+
- npm 9.0+
- PostgreSQL 14.0+ (optional, for database features)
- Git

### Getting Started

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/serenity-notes.git
   cd serenity-notes
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build Packages**
   ```bash
   npm run build
   ```

4. **Start Development**
   ```bash
   npm run dev
   # or use the helper script
   ./scripts/dev.sh
   ```

### Project Structure

```
serenity/
├── packages/
│   ├── core/           # Business logic, Redux store, types
│   ├── ui/             # Shared React components
│   └── database/       # PostgreSQL schema and queries
├── apps/
│   ├── desktop/        # Electron application
│   └── mobile/         # React Native app (future)
├── scripts/            # Build and development scripts
└── docs/              # Documentation
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
git checkout -b fix/issue-description
git checkout -b docs/update-readme
```

### 2. Make Changes

- Follow the existing code style
- Write TypeScript (no `any` types)
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run tests
npm run test

# Lint code
npm run lint

# Type check
npm run type-check

# Build to ensure no errors
npm run build
```

### 4. Commit Changes

We use [Conventional Commits](https://conventionalcommits.org/):

```bash
git commit -m "feat: add task due date notifications"
git commit -m "fix: resolve sidebar collapse animation"
git commit -m "docs: update installation instructions"
git commit -m "refactor: simplify task state management"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Code Style Guidelines

### TypeScript

- Use strict TypeScript settings
- Prefer interfaces over types for object shapes
- Use explicit return types for functions
- No `any` types (use `unknown` if needed)

```typescript
// Good
interface Task {
  id: string;
  title: string;
  completed: boolean;
}

function createTask(title: string): Task {
  return {
    id: generateId(),
    title,
    completed: false,
  };
}

// Avoid
function createTask(title: any): any {
  // ...
}
```

### React Components

- Use functional components with hooks
- Prefer named exports
- Use TypeScript interfaces for props
- Include JSDoc comments for complex components

```typescript
interface TaskCardProps {
  task: Task;
  onToggle: (taskId: string) => void;
  className?: string;
}

/**
 * Displays a task with toggle functionality and metadata
 */
export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onToggle, 
  className 
}) => {
  // Component implementation
};
```

### Styling

- Use Tailwind CSS utility classes
- Create reusable components in the UI package
- Follow mobile-first responsive design
- Support both light and dark themes

```tsx
// Good
<div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg">

// Avoid inline styles
<div style={{ display: 'flex', padding: '16px' }}>
```

### State Management

- Use Redux Toolkit for global state
- Create typed selectors
- Use RTK Query for data fetching
- Keep components pure when possible

```typescript
// Selector with proper typing
export const selectActiveTasks = createSelector(
  [selectAllTasks],
  (tasks): Task[] => tasks.filter(task => !task.completed)
);
```

## Testing Guidelines

### Unit Tests

- Test business logic in the `core` package
- Test component behavior, not implementation
- Use descriptive test names
- Mock external dependencies

```typescript
describe('TaskCard', () => {
  it('should call onToggle when checkbox is clicked', () => {
    const mockOnToggle = jest.fn();
    const task = createMockTask();
    
    render(<TaskCard task={task} onToggle={mockOnToggle} />);
    
    fireEvent.click(screen.getByRole('checkbox'));
    
    expect(mockOnToggle).toHaveBeenCalledWith(task.id);
  });
});
```

### Integration Tests

- Test user workflows end-to-end
- Use realistic data and scenarios
- Test error conditions and edge cases

## Package Development

### Adding Dependencies

```bash
# Add to specific package
npm install lodash --workspace=@serenity/core

# Add dev dependency to root
npm install jest --save-dev

# Add to all apps
npm install react --workspace=@serenity/desktop --workspace=@serenity/mobile
```

### Creating New Packages

1. Create package directory in `packages/`
2. Add `package.json` with proper naming
3. Set up TypeScript configuration
4. Export from `src/index.ts`
5. Add to root `package.json` workspaces

### Building Packages

```bash
# Build all packages
npm run build

# Build specific package
npm run build --filter=@serenity/core

# Watch for changes
cd packages/core && npm run dev
```

## Database Development

### Schema Changes

1. Modify `packages/database/src/schema/schema.sql`
2. Create migration script in `src/migrations/`
3. Update TypeScript interfaces in `@serenity/core`
4. Add corresponding query functions

### Query Development

- Use parameterized queries to prevent SQL injection
- Handle errors gracefully
- Return properly typed results
- Add appropriate indexes for performance

```typescript
export const getTasksByProject = async (
  projectId: string, 
  userId: string
): Promise<Task[]> => {
  const db = getDatabase();
  
  const results = await db.any(`
    SELECT * FROM tasks 
    WHERE project_id = $1 AND user_id = $2 
    ORDER BY created_at DESC
  `, [projectId, userId]);

  return results.map(mapTaskFromDB);
};
```

## Desktop App Development

### Electron Security

- Keep `nodeIntegration: false`
- Use `contextIsolation: true`
- Validate all IPC messages
- Sanitize user inputs

### IPC Communication

```typescript
// Main process
ipcMain.handle('task:create', async (_, taskData) => {
  // Validate taskData
  return await createTask(taskData);
});

// Preload script
contextBridge.exposeInMainWorld('taskAPI', {
  createTask: (taskData) => ipcRenderer.invoke('task:create', taskData),
});

// Renderer
const task = await window.taskAPI.createTask(taskData);
```

## Mobile App Development

### React Native Guidelines

- Use TypeScript throughout
- Follow platform-specific design guidelines
- Test on both iOS and Android
- Use native modules sparingly

### Shared Code

- Maximize code reuse with core and UI packages
- Platform-specific code should be minimal
- Use conditional rendering for platform differences

## Documentation

### Code Documentation

- Use JSDoc for functions and classes
- Document complex algorithms
- Include usage examples
- Keep comments up to date

### User Documentation

- Update README.md for new features
- Add troubleshooting steps for known issues
- Include screenshots for UI changes
- Write clear installation instructions

## Release Process

### Version Management

We use [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Creating Releases

1. Update version numbers
2. Update CHANGELOG.md
3. Create git tag
4. Build distribution packages
5. Create GitHub release
6. Publish to app stores (future)

## Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Create an Issue with reproduction steps
- **Features**: Open an Issue with detailed requirements
- **Security**: Email security@serenity-notes.com

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain a positive environment

Thank you for contributing to Serenity Notes! 🚀