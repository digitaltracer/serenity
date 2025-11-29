/**
 * POST /api/mcp/device/authorize
 * Initiates OAuth 2.0 Device Authorization Grant (RFC 8628)
 *
 * Called by MCP server to start device flow
 * Returns device_code (for polling) and user_code (for user to enter)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/postgres';
import {
  generateDeviceCode,
  generateUserCode,
} from '@/lib/mcp/device-flow-utils';
import { rateLimitDeviceAuth } from '@/lib/mcp/rate-limiter';

export async function POST(req: NextRequest) {
  // Rate limiting: max 3 requests per IP per hour
  const rateLimitResult = await rateLimitDeviceAuth(req);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'rate_limit_exceeded',
        error_description: 'Too many device authorization requests. Please try again later.',
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetAt?.toString() || '',
        },
      }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { device_name, device_fingerprint } = body;

    // Generate codes
    const deviceCode = generateDeviceCode(); // 64-char random
    const userCode = generateUserCode();     // XXXX-XXXX format

    // Insert into database (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.query(
      `INSERT INTO mcp_device_codes
       (device_code, user_code, expires_at, device_name, device_fingerprint)
       VALUES ($1, $2, $3, $4, $5)`,
      [deviceCode, userCode, expiresAt, device_name || null, device_fingerprint || null]
    );

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (action, metadata, created_at)
       VALUES ($1, $2, NOW())`,
      ['mcp_device_code_created', JSON.stringify({ user_code: userCode })]
    ).catch(err => {
      console.error('Failed to write audit log:', err);
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return NextResponse.json({
      device_code: deviceCode,
      user_code: userCode,
      verification_uri: `${baseUrl}/device`,
      verification_uri_complete: `${baseUrl}/device?code=${userCode}`,
      expires_in: 600, // 10 minutes in seconds
      interval: 5,     // Poll every 5 seconds
    });
  } catch (error) {
    console.error('Device authorization error:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        error_description: 'Failed to create device authorization',
      },
      { status: 500 }
    );
  }
}
