# MCP Multi-Tenant Architecture

## Overview

The MCP server now supports two deployment modes:

### 1. **Self-Hosted Mode** (Original)
- Single user runs their own MCP server instance
- OAuth device flow on startup
- Token saved to `~/.serenity/mcp-session.json`
- Example: Desktop app, personal server

### 2. **Multi-Tenant Mode** (New)
- One MCP server serves multiple users
- No device flow on startup
- Users generate tokens from web app UI
- Example: Hosted SaaS (serenity.app)

## Architecture

### Self-Hosted Flow (SKIP_DEVICE_FLOW=false)
```
┌─────────────────────────────────────────────────────────┐
│ 1. User starts MCP server                               │
│    $ npm run dev                                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────────────┐
│ 2. Device flow: Shows code (ABCD-1234)                  │
│    User visits /device and enters code                  │
└────────────────┬────────────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────────────┐
│ 3. Token saved to ~/.serenity/mcp-session.json          │
│    MCP server starts                                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────────────┐
│ 4. Claude Desktop connects with saved token             │
└─────────────────────────────────────────────────────────┘
```

### Multi-Tenant Flow (SKIP_DEVICE_FLOW=true)
```
┌─────────────────────────────────────────────────────────┐
│ 1. Admin starts MCP server (once)                       │
│    SKIP_DEVICE_FLOW=true npm run start                  │
│    Server starts immediately (no auth)                  │
└─────────────────────────────────────────────────────────┘
          │
          v
┌─────────────────────────────────────────────────────────┐
│ 2. User A visits web app settings                       │
│    Clicks "Generate MCP Token"                          │
│    Gets token: sk_abc123...                             │
└────────────────┬────────────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────────────┐
│ 3. User A configures Claude Desktop                     │
│    Authorization: Bearer sk_abc123...                   │
│    Claude → MCP Server → Returns User A's data          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 4. User B visits web app settings                       │
│    Gets different token: sk_xyz789...                   │
│    Claude → MCP Server → Returns User B's data          │
└─────────────────────────────────────────────────────────┘
```

## How Authentication Works (Multi-Tenant)

Each request to the MCP server includes:
```http
POST /mcp
Authorization: Bearer sk_abc123...
```

The auth middleware (`apps/mcp-server/src/middleware/auth.ts`):
1. Extracts token from `Authorization` header
2. Queries database:
   ```sql
   SELECT u.id, u.email, u.name
   FROM mcp_sessions s
   JOIN users u ON s.user_id = u.id
   WHERE s.session_token = $1
     AND s.expires_at > NOW()
     AND s.revoked_at IS NULL
   ```
3. Returns user-specific data based on `user_id`

**Key insight:** Each token is tied to a specific user in the database, so the single MCP server can serve multiple users!

## Configuration

### Environment Variables

**For Self-Hosted:**
```bash
# apps/mcp-server/.env
SKIP_DEVICE_FLOW=false  # or omit this line
PORT=3001
DATABASE_URL=postgresql://...
WEB_APP_URL=http://localhost:3000
```

**For Multi-Tenant:**
```bash
# apps/mcp-server/.env (production)
SKIP_DEVICE_FLOW=true
PORT=3001
DATABASE_URL=postgresql://...
WEB_APP_URL=https://serenity.app
ALLOWED_ORIGINS=https://serenity.app
NODE_ENV=production
```

## What's Needed for Multi-Tenant

### ✅ Already Implemented
- [x] Database schema with `user_id` in `mcp_sessions`
- [x] Per-request authentication middleware
- [x] User-scoped data queries
- [x] Session management (create, list, revoke)
- [x] Multi-tenant mode flag (`SKIP_DEVICE_FLOW`)

### 🔨 TODO: Web App UI (Approach 2)

Users need a way to generate tokens from the web app. Here's what needs to be added:

#### 1. Token Generation Page (`/settings/mcp`)

Create `apps/web/src/app/(dashboard)/settings/mcp/page.tsx`:

```typescript
'use client';

export default function MCPSettingsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [sessions, setSessions] = useState<MCPSession[]>([]);

  // Generate new token
  const handleGenerateToken = async () => {
    const response = await fetch('/api/mcp/tokens/generate', {
      method: 'POST',
      body: JSON.stringify({
        deviceName: 'Claude Desktop',
      }),
    });
    const data = await response.json();
    setToken(data.token);
  };

  return (
    <div>
      <h1>MCP Integration</h1>
      <p>Connect AI assistants like Claude Desktop to your Serenity account</p>

      <button onClick={handleGenerateToken}>
        Generate New Token
      </button>

      {token && (
        <div>
          <h3>Your MCP Token</h3>
          <code>{token}</code>
          <p>⚠️ Save this token! It won't be shown again.</p>

          <h4>Configure Claude Desktop:</h4>
          <pre>{`{
  "mcpServers": {
    "serenity": {
      "command": "curl",
      "args": [
        "-X", "POST",
        "-H", "Authorization: Bearer ${token}",
        "https://mcp.serenity.app/mcp"
      ]
    }
  }
}`}</pre>
        </div>
      )}

      <h3>Active Sessions</h3>
      {/* List of sessions with revoke buttons */}
    </div>
  );
}
```

#### 2. Token Generation API (`/api/mcp/tokens/generate`)

Create `apps/web/src/app/api/mcp/tokens/generate/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/postgres';
import { generateMCPSessionToken } from '@/lib/mcp/device-flow-utils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { deviceName } = await req.json();

  // Generate token
  const token = generateMCPSessionToken();
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

  // Save to database
  await db.query(
    `INSERT INTO mcp_sessions
     (session_token, user_id, device_name, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [token, session.user.id, deviceName, expiresAt]
  );

  return NextResponse.json({
    token,
    expiresAt,
    expiresIn: 90 * 24 * 60 * 60, // 90 days in seconds
  });
}
```

## Testing Multi-Tenant Mode

### 1. Start MCP server in multi-tenant mode

```bash
# On VPS
cd /root/serenity/apps/mcp-server
SKIP_DEVICE_FLOW=true npm run start
```

Output:
```
Starting Serenity MCP Server...
Multi-tenant mode: Skipping device flow authentication
Users should generate MCP tokens from the web app settings page
Configure Claude Desktop with: Authorization: Bearer <user-token>
MCP server listening on port 3001
```

### 2. Generate token from web app

Visit: `https://serenity.app/settings/mcp`
- Click "Generate New Token"
- Copy the token (e.g., `sk_abc123...`)

### 3. Configure Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "serenity": {
      "command": "node",
      "args": [
        "-e",
        "const https = require('https'); const token = 'YOUR_TOKEN_HERE'; /* proxy requests to MCP server */"
      ]
    }
  }
}
```

Or use an HTTP MCP client (when available).

## Migration Path

For existing self-hosted users:
1. No changes needed - keep `SKIP_DEVICE_FLOW=false` (or omit)
2. Continue using device flow as before

For new multi-tenant deployments:
1. Set `SKIP_DEVICE_FLOW=true`
2. Build token generation UI
3. Users generate tokens from web app
4. Configure AI assistants with tokens

## Security Considerations

1. **Token Security**:
   - Tokens are 64-character random strings (384 bits entropy)
   - Stored hashed in database (TODO: implement hashing)
   - Only shown once during generation

2. **Token Lifecycle**:
   - Expire after 90 days
   - Can be revoked anytime from web UI
   - Auto-cleanup of expired tokens

3. **Rate Limiting**:
   - 100 requests/minute per user
   - Applied per session token

4. **Scope Isolation**:
   - MCP sessions separate from NextAuth web sessions
   - Cannot use MCP token to access web app
   - Cannot use web session to access MCP server

## Next Steps

1. **Implement token generation UI** (see TODO section above)
2. **Test with multiple users** on VPS
3. **Update documentation** for end users
4. **Add token hashing** for security
5. **Implement token rotation** (optional)
