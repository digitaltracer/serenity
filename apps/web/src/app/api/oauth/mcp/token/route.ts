/**
 * OAuth 2.0 Token Endpoint
 * Handles both authorization_code and refresh_token grant types
 * Implements PKCE verification and refresh token rotation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPostgresPool } from '@/lib/db/postgres';
import {
  generateAccessToken,
  generateRefreshToken,
  getAccessTokenExpiration,
  getRefreshTokenExpiration,
  verifyPKCE,
  createOAuthError,
  OAuthErrorCode,
  formatScopes
} from '@/lib/mcp/oauth-utils';

export const dynamic = 'force-dynamic';

interface TokenRequest {
  grant_type: 'authorization_code' | 'refresh_token';
  code?: string; // For authorization_code grant
  redirect_uri?: string; // For authorization_code grant
  client_id: string;
  code_verifier?: string; // PKCE verifier for authorization_code grant
  refresh_token?: string; // For refresh_token grant
}

/**
 * POST /api/oauth/mcp/token
 *
 * Authorization Code Grant:
 * - grant_type: 'authorization_code'
 * - code: Authorization code from /consent
 * - redirect_uri: Must match original request
 * - client_id: OAuth client identifier
 * - code_verifier: PKCE verifier
 *
 * Refresh Token Grant:
 * - grant_type: 'refresh_token'
 * - refresh_token: Valid refresh token
 * - client_id: OAuth client identifier
 *
 * Response:
 * - 200 OK with access_token, refresh_token, expires_in
 * - 400 Bad Request (invalid parameters or grant)
 */
export async function POST(req: NextRequest) {
  let body: TokenRequest;

  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json(
      createOAuthError(OAuthErrorCode.INVALID_REQUEST, 'Invalid JSON body'),
      { status: 400 }
    );
  }

  const { grant_type, client_id } = body;

  if (!client_id) {
    return NextResponse.json(
      createOAuthError(OAuthErrorCode.INVALID_REQUEST, 'Missing client_id'),
      { status: 400 }
    );
  }

  const pool = getPostgresPool();

  // Handle authorization_code grant
  if (grant_type === 'authorization_code') {
    return handleAuthorizationCodeGrant(pool, body);
  }

  // Handle refresh_token grant
  if (grant_type === 'refresh_token') {
    return handleRefreshTokenGrant(pool, body);
  }

  return NextResponse.json(
    createOAuthError(OAuthErrorCode.UNSUPPORTED_GRANT_TYPE, 'Unsupported grant_type'),
    { status: 400 }
  );
}

/**
 * Handle authorization code exchange
 * Verifies PKCE, marks code as used, generates tokens, creates session
 */
async function handleAuthorizationCodeGrant(pool: any, body: TokenRequest) {
  const { code, redirect_uri, client_id, code_verifier } = body;

  // Validate required parameters
  if (!code || !redirect_uri || !code_verifier) {
    return NextResponse.json(
      createOAuthError(OAuthErrorCode.INVALID_REQUEST, 'Missing required parameters'),
      { status: 400 }
    );
  }

  try {
    // Fetch authorization code from database
    const authCodeResult = await pool.query(
      `SELECT ac.*, u.id as user_id, u.email, u.name
       FROM mcp_authorization_codes ac
       JOIN users u ON ac.user_id = u.id
       WHERE ac.code = $1
         AND ac.expires_at > NOW()
         AND ac.exchanged_at IS NULL`,
      [code]
    );

    if (authCodeResult.rows.length === 0) {
      return NextResponse.json(
        createOAuthError(OAuthErrorCode.INVALID_GRANT, 'Invalid or expired authorization code'),
        { status: 400 }
      );
    }

    const authCode = authCodeResult.rows[0];

    // Verify client_id matches
    if (authCode.client_id !== client_id) {
      return NextResponse.json(
        createOAuthError(OAuthErrorCode.INVALID_GRANT, 'client_id mismatch'),
        { status: 400 }
      );
    }

    // Verify redirect_uri matches
    if (authCode.redirect_uri !== redirect_uri) {
      return NextResponse.json(
        createOAuthError(OAuthErrorCode.INVALID_GRANT, 'redirect_uri mismatch'),
        { status: 400 }
      );
    }

    // Verify PKCE challenge
    const pkceValid = verifyPKCE(
      code_verifier,
      authCode.code_challenge,
      authCode.code_challenge_method
    );

    if (!pkceValid) {
      return NextResponse.json(
        createOAuthError(OAuthErrorCode.INVALID_GRANT, 'PKCE verification failed'),
        { status: 400 }
      );
    }

    // Mark authorization code as used (prevent reuse)
    await pool.query(
      `UPDATE mcp_authorization_codes
       SET exchanged_at = NOW()
       WHERE code = $1`,
      [code]
    );

    // Generate new tokens
    const accessToken = generateAccessToken();
    const refreshToken = generateRefreshToken();
    const accessExpiresAt = getAccessTokenExpiration(); // 1 hour
    const refreshExpiresAt = getRefreshTokenExpiration(); // 90 days

    // Create MCP session
    await pool.query(
      `INSERT INTO mcp_sessions
       (access_token, refresh_token, user_id, device_name, scopes,
        access_token_expires_at, refresh_token_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        accessToken,
        refreshToken,
        authCode.user_id,
        `${client_id} session`,
        authCode.scopes,
        accessExpiresAt,
        refreshExpiresAt
      ]
    );

    // Return tokens (OAuth 2.0 format)
    return NextResponse.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 3600, // 1 hour in seconds
      refresh_expires_in: 7776000, // 90 days in seconds
      scope: formatScopes(authCode.scopes)
    });
  } catch (error) {
    console.error('Authorization code grant error:', error);

    return NextResponse.json(
      createOAuthError(OAuthErrorCode.SERVER_ERROR, 'Internal server error'),
      { status: 500 }
    );
  }
}

/**
 * Handle refresh token grant
 * Implements refresh token rotation (both tokens change on refresh)
 */
async function handleRefreshTokenGrant(pool: any, body: TokenRequest) {
  const { refresh_token, client_id } = body;

  if (!refresh_token) {
    return NextResponse.json(
      createOAuthError(OAuthErrorCode.INVALID_REQUEST, 'Missing refresh_token'),
      { status: 400 }
    );
  }

  try {
    // Fetch session by refresh token
    const sessionResult = await pool.query(
      `SELECT s.*, u.id as user_id, u.email, u.name
       FROM mcp_sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.refresh_token = $1
         AND s.refresh_token_expires_at > NOW()
         AND s.refresh_token_revoked_at IS NULL
         AND s.revoked_at IS NULL`,
      [refresh_token]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json(
        createOAuthError(OAuthErrorCode.INVALID_GRANT, 'Invalid or expired refresh token'),
        { status: 400 }
      );
    }

    const session = sessionResult.rows[0];

    // Generate NEW access token AND NEW refresh token (rotation)
    const newAccessToken = generateAccessToken();
    const newRefreshToken = generateRefreshToken();
    const accessExpiresAt = getAccessTokenExpiration(); // 1 hour
    const refreshExpiresAt = getRefreshTokenExpiration(); // 90 days

    // Update session with BOTH new tokens (old refresh token is invalidated)
    await pool.query(
      `UPDATE mcp_sessions
       SET access_token = $1,
           refresh_token = $2,
           access_token_expires_at = $3,
           refresh_token_expires_at = $4,
           last_used_at = NOW()
       WHERE id = $5`,
      [newAccessToken, newRefreshToken, accessExpiresAt, refreshExpiresAt, session.id]
    );

    // Return BOTH new tokens (OAuth 2.0 format)
    return NextResponse.json({
      access_token: newAccessToken,
      refresh_token: newRefreshToken, // NEW refresh token (rotation)
      token_type: 'Bearer',
      expires_in: 3600, // 1 hour in seconds
      refresh_expires_in: 7776000, // 90 days in seconds
      scope: formatScopes(session.scopes)
    });
  } catch (error) {
    console.error('Refresh token grant error:', error);

    return NextResponse.json(
      createOAuthError(OAuthErrorCode.SERVER_ERROR, 'Internal server error'),
      { status: 500 }
    );
  }
}
