# Serenity Notes

> A powerful cross-platform productivity application that seamlessly integrates task management (ActionHub) and journaling for enhanced productivity and mindfulness.

![Serenity Notes](./screenshots/Screenshot%202025-07-18%20at%203.20.40%20AM.png)

## 🚀 Recent Major Improvements

**Production-Ready Enhancements (January 2025):**
- ✅ **Advanced Security**: Enhanced cryptographic security with dynamic salt generation and secure session management
- ✅ **Performance Optimized**: Fixed N+1 database queries (~98% performance improvement)
- ✅ **Production Logging**: Structured logging system with security-aware data redaction
- ✅ **Error Handling**: Comprehensive React Error Boundaries with retry mechanisms
- ✅ **Type Safety**: Eliminated unsafe type usage and improved TypeScript coverage
- ✅ **Cross-Platform**: Automatic native module rebuilding for different computers/Node versions
- ✅ **Database Persistence**: Fixed task completion persistence and SQLite reliability

## ✨ Core Features

- **ActionHub**: Advanced task management with subtasks, drag & drop, bulk operations, and smart analytics
- **Journal**: Private, secure journaling with rich text editing, mood tracking, and tagging
- **Analytics**: AI-powered productivity insights with interactive charts and activity heatmaps
- **Security**: Master password protection with biometric authentication and encrypted storage
- **Integrations**: Google Calendar and GitHub synchronization with encrypted token storage
- **Keyboard Shortcuts**: 40+ cross-platform shortcuts with beautiful help modal
- **Global Search**: Advanced search engine with filters and real-time results
- **Cross-Platform**: Desktop (Electron) fully functional, Mobile (React Native) planned
- **Database**: SQLite and PostgreSQL support with automatic migration and optimization
- **Dark/Light Themes**: Complete theming system with system preference detection
- **Offline-First**: Works seamlessly without internet connection with smart sync

## Architecture

Serenity Notes uses a monorepo architecture with shared packages:

```
serenity/
├── packages/
│   ├── core/         # Business logic, Redux store, TypeScript types
│   ├── ui/           # Shared UI components with Tailwind CSS
│   └── database/     # PostgreSQL schema and query functions
├── apps/
│   ├── desktop/      # Electron application
│   └── mobile/       # React Native application (coming soon)
├── screenshots/      # UI mockups and designs
└── docs/            # Documentation
```

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **State Management**: Redux Toolkit with enhanced persistence middleware
- **Desktop**: Electron 26.x with production-grade security
- **Mobile**: React Native with NativeWind (planned)
- **Database**: SQLite (primary) and PostgreSQL with optimized queries
- **Build System**: Turborepo, Vite, TypeScript with dual ES/CommonJS builds
- **Styling**: Tailwind CSS with comprehensive design system
- **Security**: bcryptjs, secure session management, encrypted storage
- **Logging**: Structured logging with performance tracking
- **Error Handling**: React Error Boundaries with recovery mechanisms

## ⚡ Prerequisites

Before running Serenity Notes locally, ensure you have:

- **Node.js** 18.x or 20.x (recommended for best compatibility)
- **npm** 9.0 or higher
- **Git** for version control
- **Build Tools** (automatically handled on most systems):
  - macOS: Xcode Command Line Tools (`xcode-select --install`)
  - Windows: Visual Studio Build Tools (automatically installed)
  - Linux: build-essential (`sudo apt-get install build-essential`)

**Note**: PostgreSQL is optional - the app uses SQLite by default for simplicity.

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-username/serenity-notes.git
cd serenity-notes

# Install dependencies (automatically builds all packages and rebuilds native modules)
npm install
```

**Important**: The installation automatically:
- Rebuilds native modules (like better-sqlite3) for your specific Node.js/Electron version
- Builds all packages in the correct order (core → database → ui → desktop)
- Generates both ESM and CommonJS outputs for maximum compatibility

If you encounter any "Cannot find module" errors, run `npm run clean && npm run build` to clear stale build caches.

### 2. Database Setup (Optional)

If you want full functionality with data persistence:

```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database
createdb serenity_notes

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials
```

Example `.env` file:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=serenity_notes
DATABASE_USER=your_username
DATABASE_PASSWORD=your_password
NODE_ENV=development
```

### 3. Development

```bash
# Start development servers for all apps
npm run dev

# Or start specific applications
npm run dev --filter=@serenity/desktop
npm run dev --filter=@serenity/mobile
```

The desktop app will be available at `http://localhost:3000` in development mode.

### 4. Building for Production

```bash
# Build all packages
npm run build

# Build specific app
npm run build --filter=@serenity/desktop
```

## Package Scripts

### Root Level Commands

```bash
npm run dev          # Start all apps in development mode
npm run build        # Build all packages and apps
npm run lint         # Lint all packages
npm run test         # Run tests across all packages
npm run clean        # Clean all build artifacts
npm run format       # Format code with Prettier
```

### Desktop App Commands

```bash
cd apps/desktop

npm run dev          # Start development with hot reload
npm run build        # Build renderer and main process
npm run electron     # Run built electron app
npm run start        # Build and run electron app
npm run dist         # Create distribution packages
npm run lint         # Lint desktop app code
```

## Desktop App Distribution

### Building Distributables

```bash
cd apps/desktop

# Install electron-builder if not already installed
npm install --save-dev electron-builder

# Add to package.json
npm pkg set build.appId="com.serenity.notes"
npm pkg set build.productName="Serenity Notes"
npm pkg set build.directories.output="dist"
npm pkg set build.files[0]="dist/**/*"
npm pkg set build.files[1]="node_modules/**/*"
npm pkg set build.files[2]="package.json"

# Build for current platform
npm run dist

# Build for specific platforms
npm run dist -- --mac
npm run dist -- --win
npm run dist -- --linux
```

### Distribution Configuration

Add to `apps/desktop/package.json`:

```json
{
  "build": {
    "appId": "com.serenity.notes",
    "productName": "Serenity Notes",
    "directories": {
      "output": "dist"
    },
    "files": [
      "dist/**/*",
      "node_modules/**/*",
      "package.json"
    ],
    "mac": {
      "category": "public.app-category.productivity",
      "icon": "assets/icon.icns",
      "target": [
        {
          "target": "dmg",
          "arch": ["x64", "arm64"]
        }
      ]
    },
    "win": {
      "icon": "assets/icon.ico",
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        }
      ]
    },
    "linux": {
      "icon": "assets/icon.png",
      "target": [
        {
          "target": "AppImage",
          "arch": ["x64"]
        },
        {
          "target": "deb",
          "arch": ["x64"]
        }
      ]
    }
  }
}
```

### Creating App Icons

Create icons in the following sizes and formats:

```
apps/desktop/assets/
├── icon.icns     # macOS (512x512)
├── icon.ico      # Windows (256x256)
└── icon.png      # Linux (512x512)
```

Use tools like:
- **macOS**: `iconutil` or online converters
- **Windows**: GIMP, Paint.NET, or online converters
- **Linux**: Any image editor that exports PNG

### Auto-Updates (Optional)

For automatic updates, integrate with services like:

- **electron-updater** with GitHub Releases
- **Hazel** for simple update server
- **Nuts** for advanced update management

## Mobile App Setup

### React Native Development

```bash
cd apps/mobile

# iOS setup (macOS only)
npx pod-install

# Start Metro bundler
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

### Prerequisites for Mobile Development

- **iOS Development**: Xcode 14+, iOS Simulator
- **Android Development**: Android Studio, Android SDK, Android Emulator
- **React Native CLI**: `npm install -g @react-native-community/cli`

## Database Migration

To set up the database schema:

```bash
# Navigate to database package
cd packages/database

# Run migrations (when implemented)
npm run migrate

# Seed with sample data (when implemented)
npm run seed
```

Manual setup:
```bash
# Connect to PostgreSQL
psql serenity_notes

# Run the schema file
\i packages/database/src/schema/schema.sql
```

## Development Guidelines

### Code Style

- **TypeScript**: Strict mode enabled, no `any` types
- **ESLint**: Configured for React, TypeScript, and accessibility
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Use conventional commit messages

### Package Development

When developing shared packages:

```bash
# Watch for changes in core package
cd packages/core && npm run dev

# Watch for changes in UI package
cd packages/ui && npm run dev
```

### Adding Dependencies

```bash
# Add to specific package
npm install <package> --workspace=@serenity/core

# Add to root (dev dependencies)
npm install <package> --save-dev
```

## Testing

```bash
# Run all tests
npm run test

# Run tests for specific package
npm run test --filter=@serenity/core

# Run tests in watch mode
npm run test:watch
```

## Troubleshooting

### Common Issues

1. **Build Failures / "Cannot find module" errors**
   ```bash
   # Clean stale build caches and rebuild
   npm run clean
   npm run build
   ```

   **Note**: The `npm install` postinstall hook automatically builds all packages, but if you encounter module resolution errors (especially `dist-cjs/index.js` not found), running `clean` then `build` will clear stale TypeScript incremental build caches.

2. **Database Connection Issues**
   - Verify PostgreSQL is running: `brew services list | grep postgresql`
   - Check connection string in `.env`
   - Ensure database exists: `psql -l`

3. **Electron Issues**
   ```bash
   # Rebuild native modules
   cd apps/desktop
   npm run electron-rebuild
   ```

4. **TypeScript Errors**
   ```bash
   # Check TypeScript configuration
   npx tsc --noEmit
   ```

### Getting Help

- **Issues**: Report bugs and feature requests on GitHub Issues
- **Discussions**: Join community discussions on GitHub Discussions
- **Documentation**: Check the `/docs` folder for detailed guides

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Workflow

```bash
# 1. Install dependencies
npm install

# 2. Start development
npm run dev

# 3. Make changes and test
npm run test
npm run lint

# 4. Build for production
npm run build

# 5. Create distribution (desktop)
cd apps/desktop && npm run dist
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Roadmap

- [x] Core architecture and monorepo setup
- [x] Desktop application with Electron
- [x] Basic task management (ActionHub)
- [x] Journal functionality
- [x] Analytics dashboard
- [ ] Rich text editor for journal entries
- [ ] Task relationships and dependencies
- [ ] Mobile application (React Native)
- [ ] Real-time sync across devices
- [ ] Plugin system for extensibility
- [ ] Team collaboration features
- [ ] Calendar integration
- [ ] Voice input and dictation
- [ ] AI-powered suggestions

## Acknowledgments

- Design inspiration from modern productivity tools
- Icons by [Lucide](https://lucide.dev)
- UI components influenced by [shadcn/ui](https://ui.shadcn.com)

---

**Built with ❤️ for productivity and mindfulness**