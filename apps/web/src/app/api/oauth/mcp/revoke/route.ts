/**
 * OAuth 2.0 Token Revocation Endpoint
 * Implements RFC 7009 (OAuth 2.0 Token Revocation)
 * Allows revoking both access and refresh tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPostgresPool } from '@/lib/db/postgres';
import { createOAuthError, OAuthErrorCode } from '@/lib/mcp/oauth-utils';

export const dynamic = 'force-dynamic';

interface RevokeRequest {
  token: string;
  token_type_hint?: 'access_token' | 'refresh_token';
  client_id?: string;
}

/**
 * POST /api/oauth/mcp/revoke
 *
 * Body:
 * - token: The token to revoke (required)
 * - token_type_hint: 'access_token' or 'refresh_token' (optional)
 * - client_id: OAuth client identifier (optional)
 *
 * Response:
 * - 200 OK (token revoked or already invalid)
 * - 400 Bad Request (invalid parameters)
 *
 * Note: Per RFC 7009, the endpoint should return 200 OK even if the token
 * is already invalid or doesn't exist (to prevent token scanning attacks)
 */
export async function POST(req: NextRequest) {
  let body: RevokeRequest;

  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json(
      createOAuthError(OAuthErrorCode.INVALID_REQUEST, 'Invalid JSON body'),
      { status: 400 }
    );
  }

  const { token, token_type_hint } = body;

  if (!token) {
    return NextResponse.json(
      createOAuthError(OAuthErrorCode.INVALID_REQUEST, 'Missing token parameter'),
      { status: 400 }
    );
  }

  const pool = getPostgresPool();

  try {
    // Attempt to revoke the token
    // If token_type_hint is provided, optimize the query
    if (token_type_hint === 'refresh_token') {
      // Revoke by refresh token (also invalidates access token)
      await pool.query(
        `UPDATE mcp_sessions
         SET refresh_token_revoked_at = NOW(),
             revoked_at = NOW()
         WHERE refresh_token = $1
           AND revoked_at IS NULL`,
        [token]
      );
    } else if (token_type_hint === 'access_token') {
      // Revoke by access token only
      await pool.query(
        `UPDATE mcp_sessions
         SET revoked_at = NOW()
         WHERE access_token = $1
           AND revoked_at IS NULL`,
        [token]
      );
    } else {
      // No hint - try both (less efficient but safer)
      // First try as refresh token (revokes both)
      const refreshResult = await pool.query(
        `UPDATE mcp_sessions
         SET refresh_token_revoked_at = NOW(),
             revoked_at = NOW()
         WHERE refresh_token = $1
           AND revoked_at IS NULL
         RETURNING id`,
        [token]
      );

      // If no rows updated, try as access token
      if (refreshResult.rowCount === 0) {
        await pool.query(
          `UPDATE mcp_sessions
           SET revoked_at = NOW()
           WHERE access_token = $1
             AND revoked_at IS NULL`,
          [token]
        );
      }
    }

    // Per RFC 7009, always return 200 OK
    // Don't reveal whether the token existed or was already revoked
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Token revocation error:', error);

    // Even on error, return 200 OK to prevent information leakage
    return NextResponse.json({ success: true });
  }
}
