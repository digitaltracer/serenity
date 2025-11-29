# ADR-005: OAuth Device Flow for MCP Server Authentication

**Status**: ✅ Accepted and Implemented
**Date**: 2025-11-29
**Deciders**: Development Team
**Related**: [MCP Authentication Feature Doc](../../features/mcp-authentication.md)

---

## Context

The MCP (Model Context Protocol) server requires authentication to access user data (tasks, journal entries, etc.). The initial implementation required users to manually extract NextAuth session tokens from browser DevTools and configure them in the MCP server, which created a poor user experience, especially for non-technical users.

### Problems with Manual Token Extraction

1. **User Experience**: Requires technical knowledge (browser DevTools, cookies/storage inspection)
2. **Error-Prone**: Users can copy wrong values, partial tokens, or expired tokens
3. **Security**: Tokens exposed in plain text configuration files
4. **Maintenance**: Sessions expire after 30 days, requiring repeated manual extraction
5. **Developer Experience**: Friction in onboarding and setup

### Requirements

- ✅ User-friendly authentication (no technical knowledge required)
- ✅ Works for both local and remote/headless deployments
- ✅ Long-lived sessions that persist across restarts
- ✅ Ability to manage and revoke sessions
- ✅ Industry-standard security practices
- ✅ Replace old manual token method entirely (no backwards compatibility)

---

## Decision

We will implement **OAuth 2.0 Device Authorization Grant (RFC 8628)** for MCP server authentication, similar to GitHub CLI, Heroku CLI, and AWS CLI.

### Chosen Approach

**OAuth Device Flow Pattern:**
1. MCP server requests a device code from web app
2. Displays user-friendly code (e.g., "WXYZ-5678") and verification URL
3. User visits URL, logs in (if needed), enters code, and approves
4. MCP server polls for authorization status
5. Receives long-lived session token (90 days)
6. Token saved to `~/.serenity/mcp-session.json` for future use

### Why OAuth Device Flow (RFC 8628)?

**✅ Pros:**
- **User-Friendly**: Simple code entry, no DevTools knowledge needed
- **Standard**: RFC 8628 is an industry standard (GitHub CLI, Google Cloud, etc.)
- **Secure**: High-entropy tokens, rate limiting, proper expiration
- **Persistent**: Sessions saved to file, reused on restart
- **Manageable**: Users can view/revoke sessions from web UI
- **Remote-Ready**: Works on headless servers without browser access on same machine

**❌ Cons:**
- Requires web app to be accessible from where user is (not always localhost)
- More complex implementation than manual tokens
- Polling adds small latency (5 seconds per poll)

---

## Alternatives Considered

### 1. Continue with Manual NextAuth Token Extraction

**Rejected**: Poor UX, error-prone, security risk

### 2. Traditional OAuth with Redirect (PKCE Flow)

**Why Not Chosen:**
- Requires browser on the same machine as MCP server
- Doesn't work for headless/remote servers
- More complex for simple CLI tool

**Example:** User would need to:
1. Start MCP server
2. Server opens browser window
3. User authorizes
4. Browser redirects to `localhost` callback

**Problem:** Doesn't work on remote servers or Docker containers.

### 3. API Key Generation

**Why Not Chosen:**
- Requires separate credential management system
- Users must manually generate and copy keys
- Still somewhat manual
- No standard format or flow

**Example:**
```
1. Visit web app settings
2. Click "Generate MCP API Key"
3. Copy key
4. Paste into MCP server config
```

**Problem:** Similar to current manual token approach.

### 4. SSH-Style Key Pair Authentication

**Why Not Chosen:**
- Complex setup (key generation, public key upload)
- Uncommon for web application authentication
- Higher friction than device flow

### 5. Magic Link via Email

**Why Not Chosen:**
- Requires email configuration
- Slower (email delivery latency)
- Less secure (email interception risk)
- Poor experience for frequent authentication

---

## Implementation Details

### Component Architecture

```
┌─────────────────┐
│   MCP Server    │
│                 │
│ DeviceFlowAuth  │──────┐
│   Service       │      │
└─────────────────┘      │
                         │
                         v
                  ┌──────────────────────┐
                  │    Web App API       │
                  │                      │
                  │ POST /device/auth    │
                  │ GET  /device/status  │
                  │ POST /device/approve │
                  │ GET  /sessions       │
                  └──────────────────────┘
                         │
                         v
                  ┌──────────────────────┐
                  │   PostgreSQL         │
                  │                      │
                  │ mcp_device_codes     │
                  │ mcp_sessions         │
                  └──────────────────────┘
```

### Database Schema

Two new tables created:

1. **`mcp_device_codes`**: Short-lived device authorization codes (10 min)
2. **`mcp_sessions`**: Long-lived MCP session tokens (90 days)

Both tables isolated from NextAuth tables (`sessions`, `users`, `accounts`).

### Security Considerations

1. **High Entropy**: 64-character tokens (384 bits)
2. **Rate Limiting**:
   - 3 device codes/hour per IP
   - Max 120 polls per device code
3. **Expiration**:
   - Device codes: 10 minutes
   - Sessions: 90 days (revocable)
4. **Secure Storage**: Files created with mode `0600`
5. **Audit Trail**: All authorization events logged
6. **Separate Token Space**: MCP sessions isolated from web sessions

---

## Consequences

### Positive

✅ **Vastly Improved UX**: Users simply enter a code - no technical knowledge needed

✅ **Better Security**: No tokens in config files, proper expiration, revocable sessions

✅ **Session Management**: Users can view and revoke active MCP sessions from web UI

✅ **Persistent Sessions**: 90-day validity with automatic reuse on restart

✅ **Standard Compliance**: Follows RFC 8628, well-documented pattern

✅ **Remote-Friendly**: Works on headless servers and Docker containers

### Negative

⚠️ **Implementation Complexity**: More code than simple manual tokens (but worthwhile)

⚠️ **Dependency on Web App**: Web app must be accessible for initial auth

⚠️ **Polling Overhead**: Small network overhead during authorization (5 sec intervals)

### Neutral

🔄 **No Backwards Compatibility**: Complete replacement of old method (per user requirement)

🔄 **Session File Management**: Users must maintain `~/.serenity/mcp-session.json`

---

## Validation

### Testing Performed

- [x] End-to-end device flow (fresh authentication)
- [x] Session persistence across MCP server restarts
- [x] User approval/denial flows
- [x] Rate limiting enforcement
- [x] Device code expiration handling
- [x] Session revocation from web UI
- [x] Error handling for all failure modes

### Success Criteria

✅ Non-technical users can authenticate without browser DevTools

✅ Sessions persist across restarts (no re-authentication needed)

✅ Users can manage active sessions from web UI

✅ Follows OAuth 2.0 RFC 8628 standard

✅ Secure (high-entropy tokens, rate limiting, audit logging)

✅ Works on both local and remote/headless deployments

---

## References

- [RFC 8628 - OAuth 2.0 Device Authorization Grant](https://datatracker.ietf.org/doc/html/rfc8628)
- [OAuth Device Flow](https://oauth.net/2/device-flow/)
- [GitHub CLI Authentication](https://cli.github.com/manual/)
- [MCP Server README](../../../apps/mcp-server/README.md)
- [MCP Authentication Feature Doc](../../features/mcp-authentication.md)

---

## Notes

This ADR documents a complete replacement of the previous authentication system. The decision was made after user feedback identified the manual token extraction as a "major flaw" and requested an OAuth-based solution.

The implementation took approximately 2-3 days and includes:
- Database schema (2 tables)
- Web app API (4 endpoints)
- Web app UI (2 pages)
- MCP server service
- Updated authentication middleware
- Comprehensive documentation

**Date Implemented**: 2025-11-29
**Implementation Plan**: [.claude/tasks/mcp-oauth-device-flow.md](../../../.claude/tasks/mcp-oauth-device-flow.md)
