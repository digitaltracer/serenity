import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db/postgres';

/**
 * GET /api/mcp/sessions
 *
 * Lists all active MCP sessions for the authenticated user.
 * Requires NextAuth authentication.
 *
 * Returns:
 * - 200: { sessions: [...] }
 * - 401: Not authenticated
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // Get user ID
    const userResult = await db.query(
      `SELECT id FROM users WHERE email = $1`,
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
    }

    const userId = userResult.rows[0].id;

    // Query all active MCP sessions
    const sessionsResult = await db.query(
      `SELECT
        id,
        device_name,
        device_fingerprint,
        scopes,
        expires_at,
        last_used_at,
        created_at
       FROM mcp_sessions
       WHERE user_id = $1
         AND revoked_at IS NULL
         AND expires_at > NOW()
       ORDER BY last_used_at DESC`,
      [userId]
    );

    const sessions = sessionsResult.rows.map((row) => ({
      id: row.id,
      deviceName: row.device_name,
      deviceFingerprint: row.device_fingerprint,
      scopes: row.scopes,
      expiresAt: row.expires_at,
      lastUsedAt: row.last_used_at,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('List sessions error:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mcp/sessions
 *
 * Revokes an MCP session by ID.
 * Requires NextAuth authentication.
 * User can only revoke their own sessions.
 *
 * Query params:
 * - session_id: UUID of the session to revoke
 *
 * Returns:
 * - 200: { success: true }
 * - 400: Missing session_id
 * - 401: Not authenticated
 * - 403: Not authorized to revoke this session
 * - 404: Session not found
 */
export async function DELETE(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // Get user ID
    const userResult = await db.query(
      `SELECT id FROM users WHERE email = $1`,
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
    }

    const userId = userResult.rows[0].id;

    // Get session_id from query params
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'session_id is required' },
        { status: 400 }
      );
    }

    // Verify session exists and belongs to user
    const mcpSessionResult = await db.query(
      `SELECT id, user_id, revoked_at FROM mcp_sessions
       WHERE id = $1`,
      [sessionId]
    );

    if (mcpSessionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'not_found', error_description: 'Session not found' },
        { status: 404 }
      );
    }

    const mcpSession = mcpSessionResult.rows[0];

    // Check ownership
    if (mcpSession.user_id !== userId) {
      return NextResponse.json(
        { error: 'forbidden', error_description: 'Not authorized to revoke this session' },
        { status: 403 }
      );
    }

    // Check if already revoked
    if (mcpSession.revoked_at) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Session already revoked' },
        { status: 400 }
      );
    }

    // Soft delete (set revoked_at)
    await db.query(
      `UPDATE mcp_sessions SET revoked_at = NOW() WHERE id = $1`,
      [sessionId]
    );

    console.log(`User ${userId} revoked MCP session ${sessionId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Revoke session error:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    );
  }
}
