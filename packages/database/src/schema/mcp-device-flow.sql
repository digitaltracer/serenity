-- MCP OAuth Device Flow Tables
-- Implements OAuth 2.0 Device Authorization Grant (RFC 8628)

-- Device authorization codes (short-lived, 10 minutes)
-- Used during the device flow authorization process
CREATE TABLE IF NOT EXISTS mcp_device_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_code TEXT UNIQUE NOT NULL,           -- 64-char random string (server-side only)
    user_code VARCHAR(10) UNIQUE NOT NULL,      -- User-friendly code (e.g., "ABCD-1234")
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- NULL until approved by user
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_polled_at TIMESTAMP WITH TIME ZONE,
    poll_count INTEGER DEFAULT 0,                -- Rate limiting: max 120 polls
    device_name VARCHAR(255),                    -- Optional: device name from initial request
    device_fingerprint TEXT,                     -- Optional: OS/hostname info
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mcp_device_codes_device_code ON mcp_device_codes(device_code);
CREATE INDEX IF NOT EXISTS idx_mcp_device_codes_user_code ON mcp_device_codes(user_code);
CREATE INDEX IF NOT EXISTS idx_mcp_device_codes_status ON mcp_device_codes(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_mcp_device_codes_expires ON mcp_device_codes(expires_at);

-- MCP sessions (long-lived, 90 days)
-- Separate from NextAuth sessions for security isolation
CREATE TABLE IF NOT EXISTS mcp_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token TEXT UNIQUE NOT NULL,          -- 64-char random string (high entropy)
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_name VARCHAR(255),                     -- User-provided device name (e.g., "MacBook Pro")
    device_fingerprint TEXT,                      -- OS/hostname for display in settings
    scopes TEXT[] DEFAULT ARRAY['mcp:read', 'mcp:write'],  -- Future: granular permissions
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- 90 days from creation
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE,         -- Soft delete for audit trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mcp_sessions_token ON mcp_sessions(session_token) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mcp_sessions_user_id ON mcp_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_sessions_expires ON mcp_sessions(expires_at);

-- Cleanup function for expired device codes
-- Run via cron or on-demand to maintain database hygiene
CREATE OR REPLACE FUNCTION cleanup_expired_mcp_device_codes()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
    deleted_count INTEGER;
BEGIN
    -- Mark pending codes as expired if past expiration time
    UPDATE mcp_device_codes
    SET status = 'expired'
    WHERE status = 'pending' AND expires_at < NOW();

    GET DIAGNOSTICS expired_count = ROW_COUNT;

    -- Delete old device codes (approved/denied/expired older than 7 days)
    DELETE FROM mcp_device_codes
    WHERE status IN ('expired', 'denied', 'approved')
      AND created_at < NOW() - INTERVAL '7 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN expired_count + deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to run cleanup (if pg_cron is available)
-- SELECT cron.schedule('cleanup-mcp-device-codes', '*/15 * * * *', 'SELECT cleanup_expired_mcp_device_codes()');

-- Comments for documentation
COMMENT ON TABLE mcp_device_codes IS 'Stores device authorization codes during OAuth device flow (RFC 8628). Codes expire after 10 minutes.';
COMMENT ON TABLE mcp_sessions IS 'Stores long-lived MCP session tokens (90 days). Separate from NextAuth sessions for security isolation.';
COMMENT ON COLUMN mcp_device_codes.device_code IS 'Server-side only. 64-character random string used for polling.';
COMMENT ON COLUMN mcp_device_codes.user_code IS 'User-facing code displayed to user (XXXX-XXXX format). No ambiguous characters.';
COMMENT ON COLUMN mcp_device_codes.poll_count IS 'Rate limiting: Maximum 120 polls allowed (10 minutes * 12 polls/min).';
COMMENT ON COLUMN mcp_sessions.session_token IS 'MCP session token. Cannot be used for web app access (isolated from NextAuth).';
COMMENT ON COLUMN mcp_sessions.revoked_at IS 'Soft delete timestamp. Allows audit trail for revoked sessions.';
COMMENT ON COLUMN mcp_sessions.scopes IS 'Future-proof: granular permissions (e.g., read-only access).';
