# MCP Server Authentication (OAuth Device Flow)

**Status**: ✅ Fully Implemented
**Version**: 1.0.0
**Last Updated**: 2025-11-29
**Related ADR**: ADR-005

---

## Overview

The MCP (Model Context Protocol) server uses **OAuth 2.0 Device Authorization Grant** (RFC 8628) for user-friendly authentication. This eliminates the need for users to manually extract session tokens from browser DevTools, providing a seamless experience similar to GitHub CLI or Heroku CLI.

## Problem Statement

**Previous Authentication Method:**
- Users had to log into the web app
- Open browser DevTools (F12)
- Navigate to cookies or storage
- Manually copy NextAuth session tokens
- Paste tokens into MCP server configuration

**Issues:**
- Not user-friendly for non-technical users
- Error-prone (copying wrong values)
- Security risk (tokens exposed in plain text configs)
- Poor developer experience

## Solution: OAuth Device Flow

Implements RFC 8628 Device Authorization Grant with the following user experience:

```
$ mcp-server start
> To authenticate, visit: https://serenity.app/device
> Enter code: WXYZ-5678
> Waiting for authorization...

[User opens browser, enters code, clicks "Authorize"]

> ✓ Authorization successful!
> MCP server is ready.
```

### Subsequent Startups

Once authenticated, the session is saved to `~/.serenity/mcp-session.json` (mode 0600) and automatically reused:

```
$ mcp-server start
> ✓ Using saved session
> MCP server is ready.
```

---

## Architecture

### Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│  1. MCP server starts up                                     │
│  Checks for saved session at ~/.serenity/mcp-session.json   │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          v
            ┌─────────────┴──────────────┐
            │ Session found?             │
            └─────────────┬──────────────┘
                   No     │      Yes
         ┌────────────────┴────────────┐
         v                              v
┌────────────────────────┐    ┌────────────────────┐
│  2. Request device     │    │  7. Use existing   │
│  code from web app     │    │  session token     │
└────────┬───────────────┘    └────────────────────┘
         │
         v
┌────────────────────────────────────────────────┐
│  3. Display user-friendly code (e.g. WXYZ-5678)│
│  Show verification URL: /device                │
└────────┬───────────────────────────────────────┘
         │
         v
┌────────────────────────────────────────────────┐
│  4. User visits /device, logs in, enters code  │
│  Clicks "Authorize" to approve the device      │
└────────┬───────────────────────────────────────┘
         │
         v
┌────────────────────────────────────────────────┐
│  5. MCP server polls for approval status       │
│  (every 5 seconds)                             │
└────────┬───────────────────────────────────────┘
         │
         v
┌────────────────────────────────────────────────┐
│  6. Receives long-lived session token (90 days)│
│  Saves to ~/.serenity/mcp-session.json         │
└────────────────────────────────────────────────┘
```

### Components

#### 1. Database Tables

**`mcp_device_codes`** - Short-lived device authorization codes (10 min expiration)
```sql
CREATE TABLE mcp_device_codes (
    id UUID PRIMARY KEY,
    device_code TEXT UNIQUE NOT NULL,        -- 64-char server-side token
    user_code VARCHAR(10) UNIQUE NOT NULL,   -- XXXX-XXXX user-friendly code
    user_id UUID REFERENCES users(id),       -- NULL until approved
    status VARCHAR(20) DEFAULT 'pending',    -- pending/approved/denied/expired
    expires_at TIMESTAMP,
    poll_count INTEGER DEFAULT 0,            -- Rate limiting
    device_name VARCHAR(255),
    device_fingerprint TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**`mcp_sessions`** - Long-lived MCP session tokens (90 day expiration)
```sql
CREATE TABLE mcp_sessions (
    id UUID PRIMARY KEY,
    session_token TEXT UNIQUE NOT NULL,      -- 64-char random token
    user_id UUID NOT NULL REFERENCES users(id),
    device_name VARCHAR(255),
    device_fingerprint TEXT,
    scopes TEXT[] DEFAULT ARRAY['mcp:read', 'mcp:write'],
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT NOW(),
    revoked_at TIMESTAMP,                     -- Soft delete for audit
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. Web App API Endpoints

**POST `/api/mcp/device/authorize`**
- Generates device_code (64-char) and user_code (XXXX-XXXX)
- Stores in database with 10-minute expiration
- Rate limited: 3 requests/hour per IP
- Returns RFC 8628 compliant response

**GET `/api/mcp/device/status`**
- Polls for authorization status
- Query param: `?device_code=xxx`
- Returns `pending`, `approved` (with token), `denied`, or `expired`
- On approval: Creates MCP session and returns access_token
- Rate limited: Max 120 polls per device code

**POST `/api/mcp/device/approve`**
- User approves/denies device (requires NextAuth session)
- Updates device code status
- Logs to audit trail

**GET/DELETE `/api/mcp/sessions`**
- Lists active MCP sessions for user
- Revokes sessions (soft delete)

#### 3. Web App UI Pages

**`/device`** - Device Authorization Page
- Code entry input (auto-uppercase, auto-format)
- Optional device name input
- Authorize/Deny buttons
- Success/error states with visual feedback

**`/settings/mcp-sessions`** - Session Management Page
- Lists all active MCP sessions
- Shows device name, last used, expiration
- Revoke button for each session
- Real-time updates

#### 4. MCP Server Components

**`DeviceFlowAuthService`**
```typescript
class DeviceFlowAuthService {
  async authorize(): Promise<string>         // Full device flow
  async loadSession(): Promise<string|null>  // Load saved session
  async saveSession(token: string): void     // Save to file
  private async requestDeviceCode(): Promise<DeviceAuthResponse>
  private async pollForToken(deviceCode: string): Promise<string>
}
```

**Authentication Middleware** (`src/middleware/auth.ts`)
- Updated to validate MCP sessions instead of NextAuth sessions
- Queries `mcp_sessions` table
- Checks expiration and revocation
- Updates `last_used_at` on each request

---

## Security Features

### High-Entropy Tokens
- **Device codes**: 64 characters (384 bits entropy) using base64url
- **User codes**: 8 characters from reduced charset (no 0, O, I, 1)
- **MCP session tokens**: 64 characters (384 bits entropy)

### Rate Limiting
- **Device authorization**: 3 requests/hour per IP address
- **Polling**: Max 120 polls per device code (10 minutes)
- In-memory for development, Redis-ready for production

### Expiration & Revocation
- **Device codes**: Expire in 10 minutes
- **MCP sessions**: Expire in 90 days but revocable anytime
- **Soft deletes**: Sessions marked with `revoked_at` for audit trail
- **Auto-cleanup**: Expired device codes deleted after 7 days

### Secure Storage
- Session files created with mode `0600` (owner read/write only)
- Stored at `~/.serenity/mcp-session.json`
- Contains token and expiration timestamp

### Separate Token Space
- MCP sessions completely isolated from NextAuth web sessions
- Different tables, different token formats
- MCP tokens can't access web app features
- Web tokens can't access MCP endpoints

### Audit Logging
- Device code creation logged
- Approval/denial events logged
- Session creation/revocation logged
- All authentication attempts tracked

---

## Usage

### MCP Server Startup

```typescript
import { DeviceFlowAuthService } from './services/DeviceFlowAuthService';
import config from './config/env';

async function main() {
  const authService = new DeviceFlowAuthService(config.webAppUrl);

  // Try loading existing session
  let token = await authService.loadSession();

  // If no session, trigger device flow
  if (!token) {
    logger.info('Starting OAuth device flow...');
    token = await authService.authorize();
    logger.info('✓ Authentication successful!');
  } else {
    logger.info('✓ Using saved session');
  }

  // Store token for middleware
  process.env.MCP_SESSION_TOKEN = token;

  startServer();
}
```

### Web App - Device Authorization

```typescript
// User visits /device?code=WXYZ-5678
export default function DeviceAuthorizationPage() {
  const handleApprove = async () => {
    await fetch('/api/mcp/device/approve', {
      method: 'POST',
      body: JSON.stringify({
        user_code: userCode,
        approved: true,
        device_name: deviceName
      })
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authorize MCP Server</CardTitle>
      </CardHeader>
      <CardContent>
        <Input value={userCode} onChange={handleCodeInput} />
        <Button onClick={handleApprove}>Authorize</Button>
      </CardContent>
    </Card>
  );
}
```

### Session Management

```typescript
// List active sessions
const sessions = await fetch('/api/mcp/sessions').then(r => r.json());

// Revoke a session
await fetch(`/api/mcp/sessions?session_id=${id}`, {
  method: 'DELETE'
});
```

---

## Configuration

### Web App Environment Variables

```env
# Public URL for device flow
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### MCP Server Environment Variables

```env
# Web app URL for OAuth device flow
WEB_APP_URL=http://localhost:3000

# Database connection
DATABASE_URL=postgresql://user:pass@localhost:5432/serenity
```

---

## Error Handling

### Device Flow Errors

| Error | Description | HTTP Status |
|-------|-------------|-------------|
| `invalid_request` | Missing or malformed parameters | 400 |
| `expired_token` | Device code expired (>10 min) | 400 |
| `access_denied` | User denied authorization | 400 |
| `slow_down` | Too many poll requests | 429 |
| `rate_limit_exceeded` | Too many device codes | 429 |

### Session Errors

| Error | Description | Action |
|-------|-------------|--------|
| Session expired | Token > 90 days old | Re-authenticate |
| Session revoked | User revoked from web UI | Re-authenticate |
| Invalid token | Token not found in database | Re-authenticate |

---

## Testing

### Manual Testing Checklist

- [x] Fresh MCP server start triggers device flow
- [x] User can enter code and approve device
- [x] MCP server receives token and starts successfully
- [x] Session saved to `~/.serenity/mcp-session.json`
- [x] Subsequent starts reuse saved session
- [x] User can deny device (MCP server shows error)
- [x] Device code expires after 10 minutes
- [x] Rate limiting works (3 device codes/hour)
- [x] Session revocation works from settings page
- [x] Expired sessions rejected by MCP server

### Error Scenarios

- [x] Network failure during polling → Retry with backoff
- [x] Web app down during device flow → Clear error message
- [x] Invalid user code entered → 404 error displayed
- [x] User closes browser without approving → Timeout after 10 min
- [x] Multiple concurrent device authorizations → Each isolated by device_code

---

## Key Files

### Database
- `packages/database/src/schema/mcp-device-flow.sql` - Schema definition

### Web App
- `apps/web/src/lib/mcp/device-flow-utils.ts` - Code generation utilities
- `apps/web/src/lib/mcp/rate-limiter.ts` - Rate limiting logic
- `apps/web/src/app/api/mcp/device/authorize/route.ts` - Device auth endpoint
- `apps/web/src/app/api/mcp/device/status/route.ts` - Polling endpoint
- `apps/web/src/app/api/mcp/device/approve/route.ts` - Approval endpoint
- `apps/web/src/app/api/mcp/sessions/route.ts` - Session management endpoint
- `apps/web/src/app/(dashboard)/device/page.tsx` - Device authorization UI
- `apps/web/src/app/(dashboard)/settings/mcp-sessions/page.tsx` - Session management UI

### MCP Server
- `apps/mcp-server/src/services/DeviceFlowAuthService.ts` - Device flow orchestration
- `apps/mcp-server/src/middleware/auth.ts` - Authentication middleware
- `apps/mcp-server/src/index.ts` - Startup with device flow
- `apps/mcp-server/src/config/env.ts` - Configuration interface

### Shared UI
- `packages/ui/src/components/Alert.tsx` - Alert component (created for this feature)

---

## References

- [RFC 8628 - OAuth 2.0 Device Authorization Grant](https://datatracker.ietf.org/doc/html/rfc8628)
- [OAuth Device Flow Guide](https://oauth.net/2/device-flow/)
- [GitHub CLI Authentication](https://cli.github.com/manual/) - Similar UX pattern
- [MCP Server README](../../apps/mcp-server/README.md) - Complete MCP documentation

---

## Future Enhancements

### Potential Improvements
- [ ] **Multi-device management**: Name and organize multiple MCP servers
- [ ] **Scopes customization**: Allow users to grant limited permissions
- [ ] **Session notifications**: Email/push notifications on new device authorizations
- [ ] **Geographic restrictions**: Limit sessions to specific countries/IPs
- [ ] **Device fingerprinting**: Enhanced device identification
- [ ] **Token rotation**: Automatic token refresh before expiration

### Production Considerations
- [ ] Redis-based rate limiting for distributed deployments
- [ ] Metrics and monitoring (Prometheus/Grafana)
- [ ] Alert on suspicious authorization patterns
- [ ] Automated cleanup jobs for expired device codes
- [ ] GDPR compliance (data retention policies)

---

**Built with OAuth 2.0 RFC 8628 Device Authorization Grant**
