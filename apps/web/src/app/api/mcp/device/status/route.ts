import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/postgres';
import { generateMCPSessionToken } from '@/lib/mcp/device-flow-utils';
import { shouldRateLimitPolling } from '@/lib/mcp/rate-limiter';

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
 * - 200: { status: "approved", access_token, token_type: "Bearer", expires_in } - Approved, token created
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
          `SELECT session_token, expires_at
           FROM mcp_sessions
           WHERE user_id = $1
             AND device_fingerprint = $2
             AND revoked_at IS NULL
             AND expires_at > NOW()
           ORDER BY created_at DESC
           LIMIT 1`,
          [deviceRecord.user_id, deviceRecord.device_fingerprint || null]
        );

        let sessionToken: string;
        let expiresIn: number;

        if (existingSession.rows.length > 0) {
          // Return existing session
          sessionToken = existingSession.rows[0].session_token;
          const expiresAt = new Date(existingSession.rows[0].expires_at);
          expiresIn = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
        } else {
          // Create new MCP session
          sessionToken = generateMCPSessionToken();
          const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
          expiresIn = 90 * 24 * 60 * 60; // 90 days in seconds

          await db.query(
            `INSERT INTO mcp_sessions (
              session_token, user_id, device_name, device_fingerprint,
              scopes, expires_at, last_used_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [
              sessionToken,
              deviceRecord.user_id,
              deviceRecord.device_name || null,
              deviceRecord.device_fingerprint || null,
              ['mcp:read', 'mcp:write'], // Default scopes
              expiresAt,
            ]
          );

          console.log(`Created MCP session for user ${deviceRecord.user_id}`);
        }

        return NextResponse.json({
          status: 'approved',
          access_token: sessionToken,
          token_type: 'Bearer',
          expires_in: expiresIn,
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
