# Serenity Notes - Web Application

A cloud-based web application for Serenity Notes, featuring full feature parity with the desktop app, end-to-end encryption, and bidirectional sync with desktop clients.

## 🚀 Features

### ✅ Implemented (Phases 1-4)

- ✅ **Multi-provider OAuth** (Google, GitHub, Microsoft)
- ✅ **End-to-end encryption** with user password
- ✅ **Complete REST API** for all features:
  - Tasks API with encryption support
  - Projects API with encryption support
  - Journal API with encryption support
  - Goals API
  - Stats API
- ✅ **Redux state management** with existing @serenity/core
- ✅ **Protected routes** with authentication middleware
- ✅ **Database schema** with sync metadata for desktop sync
- ✅ **Self-hosted** deployment ready
- ✅ **Premium-ready** infrastructure for future paid features

### 🚧 Coming Soon (Future Phases)

- ⏳ **Bidirectional sync** with desktop app (infrastructure in place)
- ⏳ **AI Insights** integration
- ⏳ **Full UI components** from @serenity/ui
- ⏳ **Integrations** (Google Calendar, GitHub)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** 9.x or higher (comes with Node.js)
- **PostgreSQL** 15.x or higher ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/))

## 🛠️ Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/serenity.git
cd serenity
```

### 2. Install Dependencies

From the root directory:

```bash
npm install
```

This will install dependencies for all packages including the web app.

### 3. Set Up PostgreSQL Database

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL in Docker
docker run -d \
  --name serenity-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=serenity_dev \
  -p 5432:5432 \
  postgres:15

# Verify it's running
docker ps
```

#### Option B: Using Local PostgreSQL

1. Install PostgreSQL on your system
2. Create a new database:

```bash
createdb serenity_dev
```

### 4. Run Database Migrations

```bash
cd apps/web
npm run db:migrate
```

This will create all necessary tables and indexes from `packages/database/src/schema/schema.sql`.

### 5. Configure Environment Variables

Create a `.env.local` file in `apps/web/`:

```bash
cd apps/web
cp .env.example .env.local
```

Edit `.env.local` and fill in the required values:

#### Required Variables

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/serenity_dev

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-secret-key-here

# Encryption
ENCRYPTION_KEY=generate-a-256-bit-key-here
```

#### Generate Secret Keys

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY
openssl rand -hex 32

# Generate SYNC_WEBHOOK_SECRET
openssl rand -base64 32
```

#### OAuth Provider Setup (Optional for initial testing)

To enable OAuth login, you need to create OAuth apps:

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 Client ID
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env.local`

**GitHub OAuth:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Client Secret to `.env.local`

**Microsoft OAuth:**
1. Go to [Azure Portal](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps)
2. Create a new app registration
3. Add redirect URI: `http://localhost:3000/api/auth/callback/azure-ad`
4. Create a client secret
5. Copy Application (client) ID and Client Secret to `.env.local`

### 6. Start the Development Server

From the `apps/web` directory:

```bash
npm run dev
```

The web app will be available at: **http://localhost:3000**

## 🏗️ Project Structure

```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth routes (login, callback, setup)
│   │   ├── (dashboard)/        # Protected app routes
│   │   ├── api/                # API endpoints
│   │   ├── layout.tsx          # Root layout
│   │   └── globals.css         # Global styles
│   ├── components/             # Web-specific components
│   │   ├── auth/               # Authentication components
│   │   ├── sync/               # Sync-related components
│   │   └── layout/             # Layout components
│   ├── lib/                    # Utilities and services
│   │   ├── auth/               # NextAuth configuration
│   │   ├── db/                 # Database utilities
│   │   ├── encryption/         # Encryption utilities
│   │   └── sync/               # Sync engine
│   └── types/                  # TypeScript type definitions
├── public/                     # Static assets
├── scripts/                    # Database scripts
├── .env.local                  # Environment variables (not in git)
├── .env.example                # Example environment variables
├── next.config.js              # Next.js configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts
```

## 📦 Available Scripts

From the `apps/web` directory:

```bash
# Development
npm run dev              # Start development server (http://localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript type checking

# Database
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with sample data

# Utilities
npm run clean            # Clean build artifacts
```

## 🔒 Security Notes

### End-to-End Encryption

- User data (tasks, journal entries, projects) is **encrypted on the client** before being sent to the server
- The server **cannot decrypt** user data without the user's password
- User passwords are **never sent to the server** - only a derived encryption key is used
- OAuth tokens and integration credentials are encrypted with the server's encryption key

### Authentication Flow

1. User signs in with OAuth provider (Google, GitHub, Microsoft)
2. Server creates/updates user account in database
3. User is prompted to set up encryption password (required for sync)
4. Encryption key is derived from password on client-side using PBKDF2
5. All sensitive data is encrypted before storage

### Best Practices

- **Never commit `.env.local`** to git (it's in `.gitignore`)
- **Use strong secrets** for production (generate with `openssl rand`)
- **Enable DATABASE_SSL** in production
- **Use HTTPS** in production (set `NEXTAUTH_URL` to https://)
- **Rotate secrets** regularly

## 🔄 Desktop Sync

The web app supports bidirectional sync with the desktop app:

1. Desktop users can link their web account via Settings → Cloud Sync
2. Changes made on desktop sync to web, and vice versa
3. Conflicts are resolved using "last-write-wins" strategy with versioning
4. Encrypted data remains encrypted during sync

**Desktop Setup:**
1. Open desktop app
2. Go to Settings → Cloud Sync
3. Click "Connect to Web Account"
4. Sign in with OAuth
5. Enable auto-sync or sync manually

## 🐳 Docker Deployment

For self-hosted deployment, see `docker-compose.yml` in the root directory:

```bash
# From root directory
docker-compose up -d
```

This will start:
- PostgreSQL database
- Next.js web app
- Nginx reverse proxy (optional)

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🐛 Troubleshooting

### Database Connection Errors

**Error:** `ECONNREFUSED` or `connection refused`

**Solution:**
- Ensure PostgreSQL is running: `docker ps` or `pg_isready`
- Check `DATABASE_URL` in `.env.local`
- Verify PostgreSQL port (default: 5432)

### Build Errors

**Error:** `Cannot find module '@serenity/core'`

**Solution:**
```bash
# From root directory
npm run clean
npm install
npm run build
```

### OAuth Errors

**Error:** `redirect_uri_mismatch`

**Solution:**
- Ensure redirect URIs are correctly configured in OAuth provider settings
- Check `NEXTAUTH_URL` in `.env.local`
- For Google: Add `http://localhost:3000/api/auth/callback/google`

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill

# Or run on a different port
PORT=3001 npm run dev
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

## 📄 License

See [LICENSE](../../LICENSE) for license information.

## 💬 Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/your-username/serenity/issues)
- Documentation: [View docs](../../docs/)
