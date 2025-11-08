# Serenity Web App Implementation Plan

## Executive Summary

### Requirements
Based on user requirements, the web app will:

1. **Hosting**: Self-hosted (backend + database)
2. **Database**: Self-hosted PostgreSQL (configuration via .env)
3. **Authentication**: Multi-provider OAuth (Google, GitHub, Microsoft) - NO username/password
4. **Encryption**: End-to-end encryption with user-set password (required for sync)
5. **Sync**: Bidirectional sync between desktop SQLite ↔ web PostgreSQL
6. **Features**: 100% feature parity with desktop app
7. **Business Model**: Free for all, with infrastructure for premium features
8. **Timeline**: Full rollout (all features at once)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                           │
├─────────────────────────────┬───────────────────────────────┤
│   Desktop App (Electron)    │   Web App (Next.js)          │
│   - SQLite local storage    │   - Browser-based            │
│   - Master password auth    │   - OAuth authentication     │
│   - Optional cloud sync     │   - Always cloud-connected   │
└──────────────┬──────────────┴──────────────┬────────────────┘
               │                             │
               │ (Sync API)                  │ (REST/GraphQL)
               ↓                             ↓
┌──────────────────────────────────────────────────────────────┐
│              BACKEND API (Next.js App Router)                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Auth Middleware (JWT + Session)                       │ │
│  │  - OAuth providers (Google, GitHub, Microsoft)         │ │
│  │  - Session management                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Encryption Layer (AES-256-GCM)                        │ │
│  │  - User password-derived encryption key               │ │
│  │  - Encrypt/decrypt sensitive data                     │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Business Logic Layer                                  │ │
│  │  - Tasks, Projects, Journal, Goals                    │ │
│  │  - AI Insights, Recaps                                │ │
│  │  - Integrations (Google Calendar, GitHub)             │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Sync Service                                          │ │
│  │  - Bidirectional sync logic                           │ │
│  │  - Conflict resolution (last-write-wins + versioning) │ │
│  │  - Webhook notifications to desktop clients           │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬──────────────────────────────┘
                                │
                                ↓
┌──────────────────────────────────────────────────────────────┐
│         POSTGRESQL DATABASE (Self-Hosted)                    │
│  - Multi-tenant with user_id isolation                       │
│  - Row-Level Security (RLS) policies                         │
│  - Encrypted sensitive fields (tasks, journal, integrations) │
│  - Sync metadata (versions, timestamps, conflict logs)       │
└──────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation & Infrastructure (Week 1)

### 1.1 Project Setup

**Create web app structure:**
```bash
apps/web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth routes group
│   │   │   ├── login/
│   │   │   ├── oauth-callback/
│   │   │   └── setup-encryption/
│   │   ├── (dashboard)/        # Protected routes group
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx        # Home/Dashboard
│   │   │   ├── actionhub/
│   │   │   ├── today/
│   │   │   ├── journal/
│   │   │   ├── goals/
│   │   │   ├── insights/
│   │   │   ├── settings/
│   │   │   ├── database/
│   │   │   └── integrations/
│   │   ├── api/                # API routes
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/route.ts
│   │   │   │   └── setup-password/route.ts
│   │   │   ├── tasks/
│   │   │   ├── projects/
│   │   │   ├── journal/
│   │   │   ├── goals/
│   │   │   ├── ai/
│   │   │   ├── integrations/
│   │   │   ├── sync/
│   │   │   │   ├── desktop-auth/route.ts
│   │   │   │   ├── pull/route.ts
│   │   │   │   ├── push/route.ts
│   │   │   │   └── status/route.ts
│   │   │   └── stats/
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/             # Web-specific components
│   │   ├── auth/
│   │   │   ├── OAuthButtons.tsx
│   │   │   ├── EncryptionSetup.tsx
│   │   │   └── SessionGuard.tsx
│   │   ├── sync/
│   │   │   ├── SyncStatusIndicator.tsx
│   │   │   ├── DesktopSyncSetup.tsx
│   │   │   └── SyncConflictResolver.tsx
│   │   └── layout/
│   │       ├── WebNavigation.tsx
│   │       └── UserMenu.tsx
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── nextauth.config.ts
│   │   │   └── session.ts
│   │   ├── db/
│   │   │   ├── postgres.ts
│   │   │   └── schema.ts
│   │   ├── encryption/
│   │   │   ├── client-crypto.ts  # Browser crypto API
│   │   │   └── server-crypto.ts  # Node crypto
│   │   ├── sync/
│   │   │   ├── sync-engine.ts
│   │   │   ├── conflict-resolution.ts
│   │   │   └── version-control.ts
│   │   └── api-client.ts
│   ├── middleware.ts           # Auth & route protection
│   └── types/
│       ├── auth.ts
│       └── sync.ts
├── public/
├── .env.example
├── .env.local
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

**Dependencies (`apps/web/package.json`):**
```json
{
  "name": "@serenity/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:migrate": "tsx scripts/migrate.ts",
    "db:seed": "tsx scripts/seed.ts"
  },
  "dependencies": {
    "@serenity/core": "*",
    "@serenity/ui": "*",
    "@serenity/database": "*",
    "next": "^14.0.0",
    "next-auth": "^5.0.0-beta",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@reduxjs/toolkit": "^1.9.5",
    "react-redux": "^8.1.2",
    "pg": "^8.11.3",
    "drizzle-orm": "^0.29.0",
    "zod": "^3.22.2",
    "jose": "^5.1.0",
    "bcryptjs": "^2.4.3",
    "@types/bcryptjs": "^2.4.6",
    "uuid": "^9.0.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.20",
    "@types/react-dom": "^18.2.7",
    "typescript": "^5.2.2",
    "tailwindcss": "^3.3.3",
    "autoprefixer": "^10.4.15",
    "postcss": "^8.4.29",
    "drizzle-kit": "^0.20.0",
    "tsx": "^4.0.0"
  }
}
```

**Environment Variables (`.env.example`):**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/serenity
DATABASE_SSL=false

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production

# OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=

# Encryption
# Server-side encryption for OAuth tokens and integration credentials
ENCRYPTION_KEY=your-256-bit-encryption-key-here

# App Configuration
NODE_ENV=development
LOG_LEVEL=debug

# AI Providers (optional - users can provide their own keys)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=

# Sync Configuration
SYNC_WEBHOOK_SECRET=your-webhook-secret-for-desktop-notifications
```

### 1.2 Database Schema Extensions

**Add to existing `packages/database/src/schema/schema.sql`:**

```sql
-- ============================================================================
-- WEB APP EXTENSIONS
-- ============================================================================

-- User authentication providers
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS microsoft_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'oauth';
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- User encryption password (hashed with bcrypt)
-- Required for end-to-end encryption of sensitive data
CREATE TABLE IF NOT EXISTS user_encryption_keys (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    key_derivation_version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OAuth session management (NextAuth compatibility)
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) PRIMARY KEY,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (identifier, token)
);

-- Add encryption status to sensitive tables
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS encryption_iv TEXT; -- Initialization vector for AES-GCM

ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS encryption_iv TEXT;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS encryption_iv TEXT;

ALTER TABLE goals ADD COLUMN IF NOT EXISTS encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS encryption_iv TEXT;

-- Sync metadata for bidirectional sync
CREATE TABLE IF NOT EXISTS sync_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- 'task', 'project', 'journal', 'goal'
    entity_id UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    last_modified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_modified_by VARCHAR(50) NOT NULL, -- 'web' or 'desktop:{device_id}'
    checksum TEXT, -- SHA-256 hash of entity data for conflict detection
    is_deleted BOOLEAN DEFAULT FALSE,
    UNIQUE(entity_type, entity_id)
);

CREATE INDEX idx_sync_metadata_user ON sync_metadata(user_id);
CREATE INDEX idx_sync_metadata_entity ON sync_metadata(entity_type, entity_id);
CREATE INDEX idx_sync_metadata_modified ON sync_metadata(last_modified_at);

-- Desktop device registration for sync
CREATE TABLE IF NOT EXISTS desktop_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) UNIQUE NOT NULL,
    device_name VARCHAR(255) NOT NULL,
    platform VARCHAR(50), -- 'windows', 'macos', 'linux'
    app_version VARCHAR(50),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_enabled BOOLEAN DEFAULT TRUE,
    access_token TEXT, -- JWT token for desktop authentication
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_desktop_devices_user ON desktop_devices(user_id);

-- Sync conflict logs
CREATE TABLE IF NOT EXISTS sync_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    web_version INTEGER,
    desktop_version INTEGER,
    web_data JSONB,
    desktop_data JSONB,
    resolution VARCHAR(50), -- 'web_wins', 'desktop_wins', 'manual', 'pending'
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sync_conflicts_user ON sync_conflicts(user_id);
CREATE INDEX idx_sync_conflicts_pending ON sync_conflicts(resolution) WHERE resolution = 'pending';

-- Subscription tiers (for future premium features)
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier VARCHAR(50) UNIQUE NOT NULL, -- 'free', 'pro', 'enterprise'
    name VARCHAR(255) NOT NULL,
    features JSONB NOT NULL, -- { "ai_insights": true, "custom_db_sync": true, etc. }
    limits JSONB, -- { "max_tasks": 1000, "max_projects": 50, etc. }
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default free tier
INSERT INTO subscription_plans (tier, name, features, limits, price_monthly, price_yearly)
VALUES (
    'free',
    'Free',
    '{"ai_insights": true, "integrations": true, "desktop_sync": true, "custom_db_sync": false}',
    '{"max_tasks": 10000, "max_projects": 100, "max_journal_entries": 10000}',
    0,
    0
) ON CONFLICT (tier) DO NOTHING;

-- User subscription tracking
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'canceled', 'expired'
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log for security and debugging
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- 'login', 'logout', 'create_task', 'sync', etc.
    entity_type VARCHAR(50),
    entity_id UUID,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Triggers for updated_at
CREATE TRIGGER update_user_encryption_keys_updated_at BEFORE UPDATE ON user_encryption_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_desktop_devices_updated_at BEFORE UPDATE ON desktop_devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Phase 2: Authentication & Encryption (Week 1-2)

### 2.1 OAuth Implementation (NextAuth v5)

**`src/lib/auth/nextauth.config.ts`:**
```typescript
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Microsoft from "next-auth/providers/azure-ad"
import { PostgresAdapter } from "./postgres-adapter"
import { db } from "../db/postgres"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Microsoft({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: "common",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Check if user needs to set up encryption password
      const hasEncryptionKey = await checkUserEncryptionKey(user.id!)

      if (!hasEncryptionKey) {
        // Redirect to encryption setup
        return `/auth/setup-encryption?userId=${user.id}`
      }

      // Update last login
      await db.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      )

      return true
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.hasEncryptionKey = await checkUserEncryptionKey(user.id!)
      }
      return token
    },

    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.hasEncryptionKey = token.hasEncryptionKey as boolean
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
})
```

### 2.2 Encryption System

**Client-side encryption (`src/lib/encryption/client-crypto.ts`):**
```typescript
/**
 * Client-side encryption using Web Crypto API
 * For encrypting sensitive data before sending to server
 */

export class ClientCrypto {
  private static ALGORITHM = 'AES-GCM'
  private static KEY_LENGTH = 256
  private static IV_LENGTH = 12

  /**
   * Derive encryption key from user password
   */
  static async deriveKey(password: string, salt: string): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )

    const saltBuffer = this.base64ToBuffer(salt)

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 100000,
        hash: 'SHA-256',
      },
      passwordKey,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    )
  }

  /**
   * Encrypt data with user's encryption key
   */
  static async encrypt(
    data: string,
    key: CryptoKey
  ): Promise<{ encrypted: string; iv: string }> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)

    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH))

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: this.ALGORITHM, iv },
      key,
      dataBuffer
    )

    return {
      encrypted: this.bufferToBase64(encryptedBuffer),
      iv: this.bufferToBase64(iv),
    }
  }

  /**
   * Decrypt data with user's encryption key
   */
  static async decrypt(
    encrypted: string,
    iv: string,
    key: CryptoKey
  ): Promise<string> {
    const encryptedBuffer = this.base64ToBuffer(encrypted)
    const ivBuffer = this.base64ToBuffer(iv)

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: this.ALGORITHM, iv: ivBuffer },
      key,
      encryptedBuffer
    )

    const decoder = new TextDecoder()
    return decoder.decode(decryptedBuffer)
  }

  private static bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  private static base64ToBuffer(base64: string): Uint8Array {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }
}
```

**Server-side encryption (`src/lib/encryption/server-crypto.ts`):**
```typescript
/**
 * Server-side encryption for OAuth tokens and integration credentials
 * Uses server's encryption key (not user's password)
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')

export class ServerCrypto {
  static encrypt(text: string): { encrypted: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    }
  }

  static decrypt(encrypted: string, iv: string, authTag: string): string {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      KEY,
      Buffer.from(iv, 'hex')
    )

    decipher.setAuthTag(Buffer.from(authTag, 'hex'))

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }
}
```

---

## Phase 3: API Layer (Week 2-3)

### 3.1 API Endpoints Implementation

All endpoints follow the `WebApiPersistenceClient` interface already defined in `packages/core/src/persistence/WebApiPersistenceClient.ts`.

**Key principles:**
- All endpoints require authentication (JWT middleware)
- All sensitive data (tasks, journal, projects, goals) encrypted with user's password
- Row-level security: users can only access their own data
- Versioning for conflict detection in sync

**Example: Tasks API (`src/app/api/tasks/route.ts`):**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/nextauth.config'
import { db } from '@/lib/db/postgres'
import { z } from 'zod'
import { Task } from '@serenity/core'
import { updateSyncMetadata } from '@/lib/sync/sync-engine'

const CreateTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.string().optional(),
  projectId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  // Encrypted fields
  encrypted: z.boolean().default(false),
  encryptionIv: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await db.query<Task>(
      `SELECT * FROM tasks WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`,
      [session.user.id]
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const data = CreateTaskSchema.parse(body)

    const result = await db.query<Task>(
      `INSERT INTO tasks (
        user_id, title, description, priority, due_date, project_id, tags,
        encrypted, encryption_iv, completed, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE, NOW(), NOW())
      RETURNING *`,
      [
        session.user.id,
        data.title,
        data.description || null,
        data.priority,
        data.dueDate || null,
        data.projectId || null,
        data.tags,
        data.encrypted,
        data.encryptionIv || null,
      ]
    )

    const task = result.rows[0]

    // Update sync metadata
    await updateSyncMetadata({
      userId: session.user.id,
      entityType: 'task',
      entityId: task.id,
      modifiedBy: 'web',
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
```

### 3.2 Desktop Sync API

**`src/app/api/sync/desktop-auth/route.ts`:**
```typescript
/**
 * Desktop device registration and authentication
 * Desktop app calls this to get a sync token
 */

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { deviceId, deviceName, platform, appVersion } = await request.json()

  // Generate access token for desktop
  const accessToken = await generateDesktopToken({
    userId: session.user.id,
    deviceId,
  })

  // Register or update device
  await db.query(
    `INSERT INTO desktop_devices (user_id, device_id, device_name, platform, app_version, access_token)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (device_id) DO UPDATE SET
       device_name = $3, platform = $4, app_version = $5, access_token = $6, updated_at = NOW()`,
    [session.user.id, deviceId, deviceName, platform, appVersion, accessToken]
  )

  return NextResponse.json({ accessToken })
}
```

**`src/app/api/sync/pull/route.ts`:**
```typescript
/**
 * Desktop pulls changes from web
 */

export async function POST(request: NextRequest) {
  const { deviceId, lastSyncTimestamp } = await request.json()

  // Verify desktop token
  const device = await verifyDesktopToken(request)
  if (!device) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all changes since lastSyncTimestamp
  const changes = await db.query(
    `SELECT * FROM sync_metadata
     WHERE user_id = $1 AND last_modified_at > $2
     ORDER BY last_modified_at ASC`,
    [device.userId, new Date(lastSyncTimestamp)]
  )

  // Fetch actual entity data for each change
  const entities = await fetchEntitiesForSync(device.userId, changes.rows)

  return NextResponse.json({
    changes: entities,
    serverTimestamp: new Date().toISOString(),
  })
}
```

**`src/app/api/sync/push/route.ts`:**
```typescript
/**
 * Desktop pushes changes to web
 */

export async function POST(request: NextRequest) {
  const { deviceId, changes } = await request.json()

  const device = await verifyDesktopToken(request)
  if (!device) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = []

  for (const change of changes) {
    try {
      const result = await applySyncChange({
        userId: device.userId,
        entityType: change.entityType,
        entityId: change.entityId,
        data: change.data,
        version: change.version,
        modifiedBy: `desktop:${deviceId}`,
      })

      results.push({ id: change.entityId, status: 'success', result })
    } catch (error) {
      if (error.code === 'CONFLICT') {
        // Version conflict - log for resolution
        await logSyncConflict({
          userId: device.userId,
          entityType: change.entityType,
          entityId: change.entityId,
          webData: error.webData,
          desktopData: change.data,
        })

        results.push({ id: change.entityId, status: 'conflict', error })
      } else {
        results.push({ id: change.entityId, status: 'error', error: error.message })
      }
    }
  }

  // Update device's last sync time
  await db.query(
    'UPDATE desktop_devices SET last_sync_at = NOW() WHERE device_id = $1',
    [deviceId]
  )

  return NextResponse.json({ results })
}
```

---

## Phase 4: Sync Engine (Week 3-4)

### 4.1 Sync Strategy

**Bidirectional sync flow:**

```
Desktop (SQLite)                    Web (PostgreSQL)
      │                                   │
      │  1. Desktop initiates sync        │
      │─────────────────────────────────→ │
      │     POST /api/sync/pull           │
      │                                   │
      │  2. Web sends changes since       │
      │     last sync                     │
      │ ←─────────────────────────────────│
      │     { changes, serverTimestamp }  │
      │                                   │
      │  3. Desktop applies changes       │
      │     and resolves conflicts        │
      │                                   │
      │  4. Desktop sends local changes   │
      │─────────────────────────────────→ │
      │     POST /api/sync/push           │
      │     { changes, conflicts }        │
      │                                   │
      │  5. Web applies changes or        │
      │     logs conflicts                │
      │ ←─────────────────────────────────│
      │     { results }                   │
      │                                   │
      │  6. Both sides now in sync        │
```

**Conflict Resolution:**
```typescript
// Last-write-wins with version tracking
interface SyncConflictResolution {
  strategy: 'last-write-wins' | 'manual'

  resolve(webData: any, desktopData: any, metadata: SyncMetadata): any {
    if (this.strategy === 'last-write-wins') {
      // Compare timestamps
      const webTime = new Date(webData.updatedAt)
      const desktopTime = new Date(desktopData.updatedAt)

      if (webTime > desktopTime) {
        return { winner: 'web', data: webData }
      } else {
        return { winner: 'desktop', data: desktopData }
      }
    } else {
      // Log conflict for manual resolution
      return { winner: 'pending', requiresManualResolution: true }
    }
  }
}
```

---

## Phase 5: Frontend (Week 4-5)

### 5.1 Layout & Navigation

Reuse all components from `@serenity/ui` but adapt routing:

```typescript
// apps/web/src/app/(dashboard)/layout.tsx
import { Navigation } from '@/components/layout/WebNavigation'
import { SyncStatusIndicator } from '@/components/sync/SyncStatusIndicator'

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen">
      <Navigation />
      <main className="flex-1 overflow-auto">
        <SyncStatusIndicator />
        {children}
      </main>
    </div>
  )
}
```

### 5.2 Pages

**ActionHub, Journal, Goals, Insights, Settings, Database, Integrations** - all reuse desktop components!

```typescript
// apps/web/src/app/(dashboard)/actionhub/page.tsx
import { ActionHubPage } from '@serenity/ui'  // ← Same component as desktop!

export default function ActionHub() {
  return <ActionHubPage />
}
```

**Key difference:** Use `WebApiPersistenceClient` instead of direct IPC calls.

### 5.3 State Management

```typescript
// apps/web/src/app/providers.tsx
'use client'

import { Provider } from 'react-redux'
import { store, setPersistenceClient, WebApiPersistenceClient } from '@serenity/core'
import { ThemeProvider } from '@serenity/ui'

// Initialize web API client
const apiClient = new WebApiPersistenceClient({
  baseUrl: '/api',
  getAuthHeaders: async () => {
    // Session is in cookies, no need to add headers
    return {}
  },
})

setPersistenceClient(apiClient)

export function Providers({ children }) {
  return (
    <Provider store={store}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </Provider>
  )
}
```

---

## Phase 6: Desktop Sync Integration (Week 5)

### 6.1 Desktop Changes

Add sync settings to desktop app:

```typescript
// apps/desktop/src/renderer/pages/SettingsPage.tsx

<SettingsSection title="Cloud Sync">
  <div className="space-y-4">
    {!syncConfig.enabled ? (
      <Button onClick={handleEnableSync}>
        Connect to Web Account
      </Button>
    ) : (
      <>
        <div className="flex items-center justify-between">
          <span>Sync Status: {syncStatus}</span>
          <Button onClick={handleManualSync} size="sm">
            Sync Now
          </Button>
        </div>

        <div>
          <Label>Last Synced</Label>
          <p>{syncConfig.lastSyncAt}</p>
        </div>

        <Button variant="outline" onClick={handleDisableSync}>
          Disconnect
        </Button>
      </>
    )}
  </div>
</SettingsSection>
```

### 6.2 Desktop Sync Service

```typescript
// apps/desktop/src/main/services/SyncService.ts

export class DesktopSyncService {
  private accessToken: string | null = null
  private deviceId: string
  private syncInterval: NodeJS.Timeout | null = null

  constructor() {
    this.deviceId = this.getOrCreateDeviceId()
  }

  async authenticate(webUrl: string, userEmail: string) {
    // Open OAuth flow in system browser
    const authUrl = `${webUrl}/auth/desktop-link?device=${this.deviceId}`
    shell.openExternal(authUrl)

    // Wait for callback with token
    const token = await this.waitForAuthCallback()
    this.accessToken = token

    // Store in secure storage
    await this.storeToken(token)
  }

  async syncNow() {
    if (!this.accessToken) {
      throw new Error('Not authenticated')
    }

    // 1. Pull changes from web
    const response = await fetch(`${webUrl}/api/sync/pull`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceId: this.deviceId,
        lastSyncTimestamp: await this.getLastSyncTimestamp(),
      }),
    })

    const { changes, serverTimestamp } = await response.json()

    // 2. Apply changes to local SQLite
    await this.applyChangesToLocal(changes)

    // 3. Get local changes since last sync
    const localChanges = await this.getLocalChanges()

    // 4. Push local changes to web
    const pushResponse = await fetch(`${webUrl}/api/sync/push`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceId: this.deviceId,
        changes: localChanges,
      }),
    })

    const { results } = await pushResponse.json()

    // 5. Handle conflicts
    await this.handleConflicts(results.filter(r => r.status === 'conflict'))

    // 6. Update last sync timestamp
    await this.updateLastSyncTimestamp(serverTimestamp)
  }

  startAutoSync(intervalMinutes: number = 15) {
    this.syncInterval = setInterval(() => {
      this.syncNow().catch(error => {
        logger.error('Auto sync failed', error)
      })
    }, intervalMinutes * 60 * 1000)
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }
}
```

---

## Implementation Checklist

### Week 1: Foundation
- [ ] Create `apps/web/` directory structure
- [ ] Set up Next.js with App Router
- [ ] Configure TypeScript, Tailwind, ESLint
- [ ] Set up PostgreSQL database (local for dev)
- [ ] Run schema migrations
- [ ] Configure OAuth providers (Google, GitHub, Microsoft)
- [ ] Implement NextAuth integration
- [ ] Create basic auth pages (login, callback)

### Week 2: Encryption & Core API
- [ ] Implement client-side crypto utilities
- [ ] Implement server-side crypto utilities
- [ ] Create encryption setup flow (user password)
- [ ] Build Tasks API endpoints (CRUD)
- [ ] Build Projects API endpoints (CRUD)
- [ ] Build Journal API endpoints (CRUD)
- [ ] Build Goals API endpoints (CRUD)
- [ ] Add encryption/decryption to all APIs

### Week 3: Sync Infrastructure
- [ ] Implement sync metadata system
- [ ] Build desktop device registration
- [ ] Create sync pull endpoint
- [ ] Create sync push endpoint
- [ ] Implement conflict detection
- [ ] Implement conflict resolution (last-write-wins)
- [ ] Create sync conflict UI
- [ ] Add sync status indicator

### Week 4: Frontend Pages
- [ ] Set up Redux with WebApiPersistenceClient
- [ ] Build Dashboard/Home page
- [ ] Integrate ActionHub page (reuse from @serenity/ui)
- [ ] Integrate Today page
- [ ] Integrate Journal page
- [ ] Integrate Goals page
- [ ] Integrate Insights page
- [ ] Integrate Settings page
- [ ] Integrate Database page
- [ ] Integrate Integrations page

### Week 5: Desktop Sync
- [ ] Add cloud sync settings to desktop app
- [ ] Implement desktop sync service
- [ ] Add device registration flow
- [ ] Test bidirectional sync (desktop ↔ web)
- [ ] Handle offline scenarios
- [ ] Add conflict resolution UI in desktop

### Week 6: AI Features
- [ ] Migrate AI insights API
- [ ] Migrate AI recaps API
- [ ] Integrate AI providers (OpenAI, Anthropic, Google)
- [ ] Add user AI key management
- [ ] Test AI features end-to-end

### Week 7: Integrations
- [ ] Migrate Google Calendar integration
- [ ] Migrate GitHub integration
- [ ] OAuth flow for integrations in web
- [ ] Encrypt integration tokens
- [ ] Sync integration data

### Week 8: Polish & Testing
- [ ] E2E testing (Playwright/Cypress)
- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentation
- [ ] Deployment setup (Docker, docker-compose)
- [ ] CI/CD pipeline

---

## Security Considerations

1. **End-to-End Encryption:**
   - User's password never leaves the client
   - Encryption key derived on client-side
   - Server stores encrypted data, cannot decrypt

2. **OAuth Security:**
   - State parameter for CSRF protection
   - Token rotation
   - Secure cookie flags (httpOnly, secure, sameSite)

3. **Sync Security:**
   - Desktop tokens are JWTs with short expiry
   - Refresh tokens stored in desktop's secure storage
   - Rate limiting on sync endpoints

4. **Database Security:**
   - Row-level security policies
   - Parameterized queries (no SQL injection)
   - Audit logging for sensitive operations

---

## Deployment

**Docker Compose setup:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: serenity
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: serenity_production
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  web:
    build: ./apps/web
    environment:
      DATABASE_URL: postgresql://serenity:${DB_PASSWORD}@postgres:5432/serenity_production
      NEXTAUTH_URL: ${APP_URL}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    restart: unless-stopped

volumes:
  postgres_data:
```

---

## Next Steps

Once you approve this plan, I will:

1. Create the branch structure
2. Set up the Next.js app in `apps/web/`
3. Run database migrations
4. Implement OAuth authentication
5. Build the encryption system
6. Create API endpoints
7. Integrate with existing UI components

**Ready to proceed?** 🚀
