import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/postgres';
import { validateUserCode } from '@/lib/mcp/device-flow-utils';

// Force dynamic rendering (API routes should not be statically generated)
export const dynamic = 'force-dynamic';

/**
 * POST /api/mcp/device/approve
 *
 * User approves or denies a device authorization request.
 * Requires NextAuth authentication (user must be logged in).
 *
 * Body:
 * {
 *   user_code: "XXXX-XXXX",  // Required
 *   approved: boolean,        // Required - true to approve, false to deny
 *   device_name?: string      // Optional override for device name
 * }
 *
 * Returns:
 * - 200: { success: true, status: "approved" | "denied" }
 * - 400: Invalid user_code or expired
 * - 401: Not authenticated
 * - 404: User code not found
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // Get user ID from email
    const userResult = await db.query(
      `SELECT id FROM users WHERE email = $1`,
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
    }

    const userId = userResult.rows[0].id;

    // Parse request body
    const body = await req.json();
    const { user_code, approved, device_name } = body;

    // Validate user_code
    if (!user_code || !validateUserCode(user_code)) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Invalid user_code format' },
        { status: 400 }
      );
    }

    // Validate approved field
    if (typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'approved must be a boolean' },
        { status: 400 }
      );
    }

    // Query device code
    const deviceResult = await db.query(
      `SELECT id, status, expires_at, device_name FROM mcp_device_codes
       WHERE user_code = $1`,
      [user_code]
    );

    if (deviceResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'not_found', error_description: 'User code not found' },
        { status: 404 }
      );
    }

    const deviceRecord = deviceResult.rows[0];

    // Check if already processed
    if (deviceRecord.status !== 'pending') {
      return NextResponse.json(
        {
          error: 'invalid_request',
          error_description: `Device code already ${deviceRecord.status}`,
        },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date(deviceRecord.expires_at) < new Date()) {
      await db.query(
        `UPDATE mcp_device_codes SET status = 'expired' WHERE id = $1`,
        [deviceRecord.id]
      );
      return NextResponse.json(
        { error: 'expired_token', error_description: 'Device code has expired' },
        { status: 400 }
      );
    }

    // Update device code status
    const newStatus = approved ? 'approved' : 'denied';
    const finalDeviceName = device_name || deviceRecord.device_name || null;

    await db.query(
      `UPDATE mcp_device_codes
       SET status = $1, user_id = $2, device_name = $3
       WHERE id = $4`,
      [newStatus, userId, finalDeviceName, deviceRecord.id]
    );

    console.log(
      `User ${userId} ${newStatus} device authorization for code ${user_code}${
        finalDeviceName ? ` (${finalDeviceName})` : ''
      }`
    );

    return NextResponse.json({
      success: true,
      status: newStatus,
    });
  } catch (error) {
    console.error('Device approve error:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    );
  }
}
