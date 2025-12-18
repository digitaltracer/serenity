import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/postgres';
import { shouldRateLimitPolling } from '@/lib/mcp/rate-limiter';
import {
  generateAccessToken,
  generateRefreshToken,
  getAccessTokenExpiration,
  getRefreshTokenExpiration
} from '@/lib/mcp/oauth-utils';

// Force dynamic rendering (API routes should not be statically generated)
export const dynamic = 'force-dynamic';

/**
 * GET /api/mcp/device/status
 *
 * MCP server polls this endpoint to check if user has approved the device.
 * Follows RFC 8628 Device Authorization Grant polling mechanism.
 *
 * Query params:
 * - device_code: The device_code returned from /authorize
 *
 * Returns:
 * - 200: { status: "pending" } - Still waiting for user approval
 * - 200: { status: "approved", access_token, refresh_token, token_type: "Bearer", expires_in, refresh_expires_in } - Approved, tokens created
 * - 400: { error: "expired_token" } - Device code expired (>10 min)
 * - 400: { error: "access_denied" } - User denied the request
 * - 429: { error: "slow_down" } - Too many polls (>120)
 * - 400: { error: "invalid_request" } - Missing/invalid device_code
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceCode = searchParams.get('device_code');

    if (!deviceCode) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'device_code is required' },
        { status: 400 }
      );
    }

    // Query device code record
    const result = await db.query(
      `SELECT id, user_code, user_id, status, expires_at, poll_count, device_name, device_fingerprint
       FROM mcp_device_codes
       WHERE device_code = $1`,
      [deviceCode]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Invalid device_code' },
        { status: 400 }
      );
    }

    const deviceRecord = result.rows[0];

    // Check expiration
    if (new Date(deviceRecord.expires_at) < new Date()) {
      // Mark as expired
      await db.query(
        `UPDATE mcp_device_codes SET status = 'expired' WHERE id = $1`,
        [deviceRecord.id]
      );
      return NextResponse.json(
        { error: 'expired_token', error_description: 'Device code has expired' },
        { status: 400 }
      );
    }

    // Check rate limiting
    if (shouldRateLimitPolling(deviceRecord.poll_count)) {
      return NextResponse.json(
        { error: 'slow_down', error_description: 'Too many polling requests' },
        { status: 429 }
      );
    }

    // Increment poll count
    await db.query(
      `UPDATE mcp_device_codes SET poll_count = poll_count + 1 WHERE id = $1`,
      [deviceRecord.id]
    );

    // Handle different statuses
    switch (deviceRecord.status) {
      case 'pending':
        return NextResponse.json({ status: 'pending' });

      case 'denied':
        return NextResponse.json(
          { error: 'access_denied', error_description: 'User denied the authorization request' },
          { status: 400 }
        );

      case 'approved':
        // Check if session already created (prevent duplicate sessions on repeated polls)
        const existingSession = await db.query(
          `SELECT access_token, refresh_token, access_token_expires_at, refresh_token_expires_at
           FROM mcp_sessions
           WHERE user_id = $1
             AND device_fingerprint = $2
             AND revoked_at IS NULL
             AND refresh_token_expires_at > NOW()
           ORDER BY created_at DESC
           LIMIT 1`,
          [deviceRecord.user_id, deviceRecord.device_fingerprint || null]
        );

        let accessToken: string;
        let refreshToken: string;
        let accessExpiresIn: number;
        let refreshExpiresIn: number;

        if (existingSession.rows.length > 0) {
          // Return existing session tokens
          accessToken = existingSession.rows[0].access_token;
          refreshToken = existingSession.rows[0].refresh_token;

          const accessExpiresAt = new Date(existingSession.rows[0].access_token_expires_at);
          const refreshExpiresAt = new Date(existingSession.rows[0].refresh_token_expires_at);

          accessExpiresIn = Math.max(0, Math.floor((accessExpiresAt.getTime() - Date.now()) / 1000));
          refreshExpiresIn = Math.max(0, Math.floor((refreshExpiresAt.getTime() - Date.now()) / 1000));
        } else {
          // Create new MCP session with both access and refresh tokens
          accessToken = generateAccessToken();
          refreshToken = generateRefreshToken();
          const accessExpiresAt = getAccessTokenExpiration(); // 1 hour
          const refreshExpiresAt = getRefreshTokenExpiration(); // 90 days

          accessExpiresIn = 3600; // 1 hour in seconds
          refreshExpiresIn = 7776000; // 90 days in seconds

          await db.query(
            `INSERT INTO mcp_sessions (
              access_token, refresh_token, user_id, device_name, device_fingerprint,
              scopes, access_token_expires_at, refresh_token_expires_at, last_used_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
            [
              accessToken,
              refreshToken,
              deviceRecord.user_id,
              deviceRecord.device_name || null,
              deviceRecord.device_fingerprint || null,
              ['mcp:read', 'mcp:write'], // Default scopes
              accessExpiresAt,
              refreshExpiresAt,
            ]
          );

          console.log(`Created MCP session for user ${deviceRecord.user_id} with access and refresh tokens`);
        }

        return NextResponse.json({
          status: 'approved',
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: 'Bearer',
          expires_in: accessExpiresIn,
          refresh_expires_in: refreshExpiresIn,
        });

      case 'expired':
        return NextResponse.json(
          { error: 'expired_token', error_description: 'Device code has expired' },
          { status: 400 }
        );

      default:
        return NextResponse.json(
          { error: 'server_error', error_description: 'Unknown device code status' },
          { status: 500 }
        );
    }
  } catch (error) {
    console.error('Device status error:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    );
  }
}
