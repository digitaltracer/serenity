-- MCP OAuth 2.0 Migration
-- Transforms MCP authentication from simple device flow to OAuth 2.0 with refresh tokens
-- This migration implements a "clean slate" approach: all existing sessions are invalidated

-- =============================================================================
-- STEP 1: Invalidate All Existing Sessions (Clean Slate Approach)
-- =============================================================================
-- All users must re-authenticate with the new OAuth flow
-- Rationale:
--   - Ensures all sessions use new security model immediately
--   - Simpler implementation (no dual code paths)
--   - Clear audit trail
UPDATE mcp_sessions
SET revoked_at = NOW()
WHERE revoked_at IS NULL;

-- =============================================================================
-- STEP 2: Add OAuth Token Columns to mcp_sessions
-- =============================================================================

-- Add access_token (short-lived, 1 hour)
ALTER TABLE mcp_sessions
ADD COLUMN IF NOT EXISTS access_token TEXT UNIQUE;

-- Add refresh_token (long-lived, 90 days)
ALTER TABLE mcp_sessions
ADD COLUMN IF NOT EXISTS refresh_token TEXT UNIQUE;

-- Add access token expiration (1 hour from creation)
ALTER TABLE mcp_sessions
ADD COLUMN IF NOT EXISTS access_token_expires_at TIMESTAMP WITH TIME ZONE;

-- Add refresh token expiration (90 days from creation)
ALTER TABLE mcp_sessions
ADD COLUMN IF NOT EXISTS refresh_token_expires_at TIMESTAMP WITH TIME ZONE;

-- Add refresh token revocation timestamp (for token rotation tracking)
ALTER TABLE mcp_sessions
ADD COLUMN IF NOT EXISTS refresh_token_revoked_at TIMESTAMP WITH TIME ZONE;

-- =============================================================================
-- STEP 3: Drop Old session_token Column
-- =============================================================================
-- The old session_token is replaced by access_token/refresh_token
-- Safe to drop since all sessions were invalidated in STEP 1
ALTER TABLE mcp_sessions
DROP COLUMN IF EXISTS session_token;

-- =============================================================================
-- STEP 4: Make New Columns Required for Future Inserts
-- =============================================================================
-- Future sessions MUST have access tokens
ALTER TABLE mcp_sessions
ALTER COLUMN access_token SET NOT NULL;

ALTER TABLE mcp_sessions
ALTER COLUMN access_token_expires_at SET NOT NULL;

-- =============================================================================
-- STEP 5: Create OAuth Authorization Codes Table
-- =============================================================================
-- Stores authorization codes during OAuth redirect flow
-- Codes are short-lived (10 minutes) and single-use
CREATE TABLE IF NOT EXISTS mcp_authorization_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,                      -- Authorization code (32-char random)
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id TEXT NOT NULL,                        -- 'serenity-web', 'claude-desktop', etc.
    redirect_uri TEXT NOT NULL,                     -- Must match registered URI
    scopes TEXT[] DEFAULT ARRAY['mcp:read', 'mcp:write'],
    state TEXT,                                     -- CSRF protection
    code_challenge TEXT NOT NULL,                   -- PKCE: base64url(sha256(verifier))
    code_challenge_method VARCHAR(10) NOT NULL DEFAULT 'S256',  -- 'S256' or 'plain'
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,   -- NOW() + 10 minutes
    exchanged_at TIMESTAMP WITH TIME ZONE,          -- Prevent code reuse
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for authorization codes
CREATE INDEX IF NOT EXISTS idx_mcp_auth_codes_code
ON mcp_authorization_codes(code)
WHERE exchanged_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_mcp_auth_codes_expires
ON mcp_authorization_codes(expires_at);

CREATE INDEX IF NOT EXISTS idx_mcp_auth_codes_user_id
ON mcp_authorization_codes(user_id);

-- =============================================================================
-- STEP 6: Create OAuth Clients Table
-- =============================================================================
-- Register OAuth clients (public clients only, PKCE required)
-- No client secrets - all clients are public and must use PKCE
CREATE TABLE IF NOT EXISTS mcp_clients (
    id TEXT PRIMARY KEY,                            -- 'serenity-web', 'claude-desktop', etc.
    name VARCHAR(255) NOT NULL,                     -- Display name
    redirect_uris TEXT[] NOT NULL,                  -- Allowed redirect URIs
    allowed_scopes TEXT[] DEFAULT ARRAY['mcp:read', 'mcp:write'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- STEP 7: Seed Default OAuth Clients
-- =============================================================================
-- Insert default clients (all require PKCE)
INSERT INTO mcp_clients (id, name, redirect_uris) VALUES
    ('serenity-web', 'Serenity Web App',
     ARRAY[
         'http://localhost:3000/settings/mcp/callback',
         'http://localhost:3000/settings/mcp-sessions/callback',
         'https://serenity.app/settings/mcp/callback',
         'https://serenity.app/settings/mcp-sessions/callback'
     ]),
    ('serenity-desktop', 'Serenity Desktop App',
     ARRAY[
         'http://127.0.0.1:*/callback',
         'http://localhost:*/callback'
     ]),
    ('claude-desktop', 'Claude Desktop',
     ARRAY[
         'http://127.0.0.1:*/callback',
         'http://localhost:*/callback'
     ])
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    redirect_uris = EXCLUDED.redirect_uris,
    updated_at = NOW();

-- =============================================================================
-- STEP 8: Add Indexes for New OAuth Columns
-- =============================================================================

-- Index for access token lookup (most common operation)
CREATE INDEX IF NOT EXISTS idx_mcp_sessions_access_token
ON mcp_sessions(access_token)
WHERE revoked_at IS NULL;

-- Index for refresh token lookup (during token refresh)
CREATE INDEX IF NOT EXISTS idx_mcp_sessions_refresh_token
ON mcp_sessions(refresh_token)
WHERE refresh_token_revoked_at IS NULL AND revoked_at IS NULL;

-- Index for finding sessions needing refresh
CREATE INDEX IF NOT EXISTS idx_mcp_sessions_access_expires
ON mcp_sessions(access_token_expires_at);

-- =============================================================================
-- STEP 9: Update Cleanup Function
-- =============================================================================
-- Extend existing cleanup function to handle authorization codes
CREATE OR REPLACE FUNCTION cleanup_mcp_oauth_data()
RETURNS TABLE(
    expired_device_codes INTEGER,
    deleted_device_codes INTEGER,
    deleted_auth_codes INTEGER
) AS $$
DECLARE
    expired_device_count INTEGER;
    deleted_device_count INTEGER;
    deleted_auth_count INTEGER;
BEGIN
    -- Mark pending device codes as expired
    UPDATE mcp_device_codes
    SET status = 'expired'
    WHERE status = 'pending' AND expires_at < NOW();

    GET DIAGNOSTICS expired_device_count = ROW_COUNT;

    -- Delete old device codes (older than 7 days)
    DELETE FROM mcp_device_codes
    WHERE status IN ('expired', 'denied', 'approved')
      AND created_at < NOW() - INTERVAL '7 days';

    GET DIAGNOSTICS deleted_device_count = ROW_COUNT;

    -- Delete old authorization codes (exchanged or expired, older than 1 day)
    DELETE FROM mcp_authorization_codes
    WHERE (exchanged_at IS NOT NULL OR expires_at < NOW())
      AND created_at < NOW() - INTERVAL '1 day';

    GET DIAGNOSTICS deleted_auth_count = ROW_COUNT;

    -- Return counts
    expired_device_codes := expired_device_count;
    deleted_device_codes := deleted_device_count;
    deleted_auth_codes := deleted_auth_count;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STEP 10: Add Comments for Documentation
-- =============================================================================

COMMENT ON TABLE mcp_authorization_codes IS
'Stores OAuth 2.0 authorization codes during redirect flow. Codes expire after 10 minutes and are single-use.';

COMMENT ON TABLE mcp_clients IS
'Registered OAuth clients for MCP server. All clients are public (no secrets) and must use PKCE.';

COMMENT ON COLUMN mcp_sessions.access_token IS
'Short-lived access token (1 hour). Used to authenticate MCP API requests.';

COMMENT ON COLUMN mcp_sessions.refresh_token IS
'Long-lived refresh token (90 days). Used to obtain new access tokens. Rotates on each use.';

COMMENT ON COLUMN mcp_sessions.refresh_token_revoked_at IS
'Timestamp when refresh token was revoked. Used for token rotation tracking.';

COMMENT ON COLUMN mcp_authorization_codes.code_challenge IS
'PKCE code challenge: base64url(sha256(code_verifier)). All clients must use PKCE.';

COMMENT ON COLUMN mcp_clients.redirect_uris IS
'Allowed OAuth redirect URIs. Wildcard ports (*) supported for localhost only.';

-- =============================================================================
-- Migration Complete
-- =============================================================================
-- Next steps for users:
--   1. All existing MCP sessions have been invalidated
--   2. Users must re-authenticate through the web app settings
--   3. Device flow (desktop app) now returns both access and refresh tokens
--   4. Access tokens expire after 1 hour (auto-refresh supported)
--   5. Refresh tokens rotate on each use (security best practice)
