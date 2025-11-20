# Database Setup Guide for Serenity Notes Web App

This guide will walk you through setting up the PostgreSQL database for the Serenity Notes web application from scratch.

---

## Prerequisites

Before you begin, you need:

1. ✅ **PostgreSQL database** (local or hosted)
   - Local: PostgreSQL 14+
   - Hosted: Neon, Supabase, Railway, DigitalOcean, AWS RDS, etc.

2. ✅ **Database connection string** (DATABASE_URL)
   ```
   postgresql://username:password@host:port/database_name
   ```

3. ✅ **Node.js 18+** installed

---

## Quick Setup (3 Steps)

### Step 1: Configure Environment Variables

Create a `.env.local` file in `apps/web/`:

```bash
cd apps/web
cp .env.example .env.local  # If .env.example exists
# OR create manually:
nano .env.local
```

Add your database connection:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/serenity"
DATABASE_SSL="false"  # Set to "true" for hosted databases (Neon, Supabase, etc.)

# NextAuth (required for authentication)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-secret-key-here"  # Generate with: openssl rand -base64 32

# OAuth Providers (optional - configure as needed)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"

MICROSOFT_CLIENT_ID="your-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"
```

**Important:**
- For **hosted databases** (Neon, Supabase, Railway, etc.), set `DATABASE_SSL="true"`
- For **local PostgreSQL**, set `DATABASE_SSL="false"`

### Step 2: Run Database Migrations

This creates all tables and schema:

```bash
cd apps/web
npm run db:migrate
```

**What this does:**
- ✅ Connects to your PostgreSQL database
- ✅ Creates all base tables (users, tasks, projects, journal_entries, goals, etc.)
- ✅ Adds web-specific tables (sessions, accounts, summaries, integrations)
- ✅ Creates all indexes and constraints
- ✅ Runs web-extensions (NextAuth tables, OAuth, sync metadata)

**Expected output:**
```
🚀 Starting database migration...
📦 Connecting to database...
✅ Connected to database
📄 Running base schema from: .../schema.sql
✅ Base schema created
📄 Running web extensions from: .../web-extensions.sql
✅ Web extensions applied
✅ Migration completed successfully!
📊 Total tables: 30
```

### Step 3: (Optional) Seed with Sample Data

For development/testing, you can add sample data:

```bash
npm run db:seed
```

**What this does:**
- ✅ Creates a test user: `test@example.com`
- ✅ Creates a sample project
- ✅ Skips if data already exists

**Expected output:**
```
🌱 Starting database seeding...
📝 Creating sample user...
✅ Created user with ID: xxx-xxx-xxx
📁 Creating sample project...
✅ Created project with ID: xxx-xxx-xxx
✅ Seeding completed successfully!
```

---

## Verify Setup

### Check Database Tables

Connect to your PostgreSQL database and verify tables were created:

```bash
# Using psql
psql postgresql://username:password@localhost:5432/serenity

# List all tables
\dt

# Check specific tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

**Expected tables (30 total):**

**Core Tables:**
- `users`
- `projects`
- `tasks`
- `subtasks`
- `journal_entries`
- `goals`
- `daily_stats`
- `task_journal_links`

**Authentication (NextAuth):**
- `sessions`
- `accounts`
- `verification_tokens`
- `user_encryption_keys`

**Web-Specific:**
- `summaries` (AI-generated summaries)
- `integrations` (Google Calendar, GitHub)
- `ai_usage` (token tracking)
- `sync_metadata` (for desktop sync)
- `desktop_devices` (device registration)
- `sync_conflicts` (conflict resolution)
- `audit_logs` (security tracking)

**AI Features:**
- `ai_insights`
- `analysis_summaries`
- `insight_themes`
- `ai_recaps`

### Test Database Connection

Start the web app:

```bash
npm run dev
```

Visit `http://localhost:3000` - if the app loads without database errors, you're all set! ✅

---

## Database Schema Overview

### Core Tables

#### `users`
Stores user accounts and preferences.
```sql
- id (UUID, PK)
- name
- email (unique)
- google_id / github_id / microsoft_id (OAuth)
- preferences (JSONB)
- created_at, updated_at
```

#### `tasks`
Task management with subtasks, projects, priorities.
```sql
- id (UUID, PK)
- user_id (FK → users)
- project_id (FK → projects)
- title, description
- completed, completed_at
- priority (low/medium/high)
- due_date
- tags (array)
- recurring_pattern (JSONB)
- order_index
```

#### `journal_entries`
Daily journal entries with mood tracking.
```sql
- id (UUID, PK)
- user_id (FK → users)
- title, content
- date
- tags (array)
- mood (happy/neutral/sad/excited/stressed)
- word_count
- pinned
```

#### `projects`
Project organization for tasks.
```sql
- id (UUID, PK)
- user_id (FK → users)
- name, description
- color, icon
- archived
```

#### `goals`
Goal tracking with progress monitoring.
```sql
- id (UUID, PK)
- user_id (FK → users)
- title, description
- type (weekly_tasks/project_tasks/etc.)
- config, progress (JSONB)
- status (active/completed/paused/failed)
- priority
```

### Authentication Tables (NextAuth)

#### `sessions`
User sessions for authentication.
```sql
- id (TEXT, PK)
- session_token (unique)
- user_id (FK → users)
- expires
```

#### `accounts`
OAuth provider accounts (Google, GitHub, Microsoft).
```sql
- id (TEXT, PK)
- user_id (FK → users)
- provider (google/github/microsoft)
- provider_account_id
- access_token, refresh_token
- expires_at
```

### Web-Specific Tables

#### `summaries`
AI-generated task/journal summaries.
```sql
- id (TEXT, PK)
- user_id (FK → users)
- title, content
- summary_type (tasks/journal/combined)
- start_date, end_date
- provider (openai/anthropic/gemini)
- prompt_tokens, completion_tokens
```

#### `integrations`
OAuth integrations (Google Calendar, GitHub).
```sql
- id (UUID, PK)
- user_id (FK → users)
- provider (google_calendar/github)
- access_token, refresh_token
- enabled
- last_sync_at
- sync_config (JSONB)
```

#### `sync_metadata`
Desktop app sync tracking.
```sql
- id (UUID, PK)
- user_id (FK → users)
- entity_type (task/journal/project/goal)
- entity_id
- version (incremental)
- checksum
- last_modified_at
- is_deleted
```

---

## Common Issues & Troubleshooting

### Issue 1: "DATABASE_URL is not set"

**Error:**
```
❌ DATABASE_URL environment variable is not set
💡 Create a .env.local file with your database connection string
```

**Solution:**
- Ensure `.env.local` exists in `apps/web/`
- Verify `DATABASE_URL` is set correctly
- Check for typos in connection string

### Issue 2: Connection Refused

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
- Ensure PostgreSQL is running: `sudo systemctl status postgresql` (Linux)
- Check connection string host/port
- For hosted DB, verify network access/firewall

### Issue 3: SSL Error with Hosted Database

**Error:**
```
Error: no pg_hba.conf entry for host ... SSL off
```

**Solution:**
- Set `DATABASE_SSL="true"` in `.env.local`
- Most hosted databases (Neon, Supabase, Railway) require SSL

### Issue 4: Tables Already Exist

**Message:**
```
ℹ️  Base schema already exists, skipping...
ℹ️  Some web extensions already exist, skipping...
```

**This is normal!** The migration script is idempotent - it won't recreate existing tables.

### Issue 5: Permission Denied

**Error:**
```
Error: permission denied for schema public
```

**Solution:**
- Ensure your database user has CREATE privileges
- Grant permissions:
  ```sql
  GRANT ALL PRIVILEGES ON DATABASE serenity TO your_user;
  GRANT ALL ON SCHEMA public TO your_user;
  ```

---

## Manual Setup (Alternative)

If you prefer to run SQL manually:

### 1. Connect to PostgreSQL

```bash
psql postgresql://username:password@localhost:5432/serenity
```

### 2. Run Base Schema

```bash
psql -U username -d serenity -f packages/database/src/schema/schema.sql
```

### 3. Run Web Extensions

```bash
psql -U username -d serenity -f packages/database/src/schema/web-extensions.sql
```

### 4. Verify

```sql
-- Check table count
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';

-- Should return ~30 tables
```

---

## Production Deployment

For production, follow these additional steps:

### 1. Use Environment Variables

Don't commit `.env.local` to git! Set environment variables via:

- **Vercel:** Project Settings → Environment Variables
- **Railway:** Project → Variables
- **Docker:** Pass via `-e` flags or docker-compose.yml
- **Kubernetes:** ConfigMaps and Secrets

### 2. Use Connection Pooling

For better performance, use connection pooling:

```env
# Add ?connection_limit=20 to DATABASE_URL
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20"
```

Or use external poolers:
- **PgBouncer** (self-hosted)
- **Neon** (built-in pooling)
- **Supabase** (Supavisor pooler)

### 3. Run Migrations on Deploy

Add to your CI/CD pipeline:

```yaml
# .github/workflows/deploy.yml
- name: Run database migrations
  run: |
    cd apps/web
    npm run db:migrate
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### 4. Backup Your Database

Set up automated backups:
- **Neon:** Automatic daily backups
- **Supabase:** Point-in-time recovery
- **Railway:** Automated snapshots
- **Self-hosted:** `pg_dump` cron jobs

---

## Next Steps

After database setup:

1. ✅ **Configure OAuth providers** (Google, GitHub, Microsoft)
   - See [NextAuth documentation](https://next-auth.js.org/providers)
   - Update redirect URIs in provider consoles

2. ✅ **Set up AI providers** (optional)
   - OpenAI API key for GPT-4
   - Anthropic API key for Claude
   - Google API key for Gemini

3. ✅ **Test authentication**
   - Visit `/login`
   - Sign in with OAuth provider
   - Verify user is created in `users` table

4. ✅ **Start building!**
   - Create tasks, projects, journal entries
   - Test sync between web and desktop apps

---

## Useful Commands

```bash
# Migrate database
npm run db:migrate

# Seed with sample data
npm run db:seed

# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Type check
npm run type-check

# Lint
npm run lint
```

---

## Database Maintenance

### Reset Database (Development Only)

**⚠️ Warning: This deletes all data!**

```bash
# Drop all tables
psql -U username -d serenity -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Re-run migrations
npm run db:migrate

# Re-seed (optional)
npm run db:seed
```

### View Logs

```bash
# PostgreSQL logs (Linux)
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Check table sizes
psql -U username -d serenity -c "
  SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

---

## Support

If you encounter issues:

1. Check logs: `npm run dev` output
2. Verify PostgreSQL is running
3. Test connection: `psql DATABASE_URL`
4. Check schema exists: `\dt` in psql
5. Review error messages carefully

**For hosted databases:**
- Neon: https://neon.tech/docs
- Supabase: https://supabase.com/docs
- Railway: https://docs.railway.app

---

**Database setup complete!** 🎉

Your Serenity Notes web app is ready to use with a fully configured PostgreSQL database.
