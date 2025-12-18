/**
 * OAuth 2.0 Consent Endpoint
 * Handles user approval/denial of authorization requests
 * Generates authorization code on approval
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPostgresPool } from '@/lib/db/postgres';
import {
  generateAuthorizationCode,
  getAuthCodeExpiration,
  createOAuthError,
  OAuthErrorCode,
  parseScopes
} from '@/lib/mcp/oauth-utils';

export const dynamic = 'force-dynamic';

interface ConsentRequest {
  client_id: string;
  redirect_uri: string;
  scope?: string;
  state: string;
  code_challenge?: string;
  code_challenge_method?: string;
  approved: boolean;
  device_name?: string;
}

/**
 * POST /api/oauth/mcp/consent
 *
 * Body:
 * - client_id: OAuth client identifier (required)
 * - redirect_uri: Callback URI (required)
 * - scope: Requested scopes (optional)
 * - state: CSRF protection token (required)
 * - code_challenge: PKCE challenge (required if approval)
 * - code_challenge_method: 'S256' or 'plain' (required if approval)
 * - approved: boolean - user's consent decision (required)
 * - device_name: Optional device name for session tracking
 *
 * Response:
 * - 200 OK with redirectUrl containing authorization code (if approved)
 * - 200 OK with redirectUrl containing error (if denied)
 * - 401 Unauthorized (if not authenticated)
 * - 400 Bad Request (if invalid parameters)
 */
export async function POST(req: NextRequest) {
  // Check authentication
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      createOAuthError(OAuthErrorCode.ACCESS_DENIED, 'User not authenticated'),
      { status: 401 }
    );
  }

  let body: ConsentRequest;

  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json(
      createOAuthError(OAuthErrorCode.INVALID_REQUEST, 'Invalid JSON body'),
      { status: 400 }
    );
  }

  const {
    client_id,
    redirect_uri,
    scope = 'mcp:read mcp:write',
    state,
    code_challenge,
    code_challenge_method,
    approved,
    device_name
  } = body;

  // Validate required parameters
  if (!client_id || !redirect_uri || !state) {
    return NextResponse.json(
      createOAuthError(OAuthErrorCode.INVALID_REQUEST, 'Missing required parameters'),
      { status: 400 }
    );
  }

  // Build redirect URL
  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set('state', state);

  // Handle denial
  if (!approved) {
    redirectUrl.searchParams.set('error', OAuthErrorCode.ACCESS_DENIED);
    redirectUrl.searchParams.set('error_description', 'User denied authorization');

    return NextResponse.json({
      redirectUrl: redirectUrl.toString()
    });
  }

  // Handle approval - validate PKCE parameters
  if (!code_challenge || !code_challenge_method) {
    return NextResponse.json(
      createOAuthError(OAuthErrorCode.INVALID_REQUEST, 'PKCE parameters required'),
      { status: 400 }
    );
  }

  if (!['S256', 'plain'].includes(code_challenge_method)) {
    return NextResponse.json(
      createOAuthError(OAuthErrorCode.INVALID_REQUEST, 'Invalid code_challenge_method'),
      { status: 400 }
    );
  }

  const pool = getPostgresPool();

  try {
    // Validate client exists
    const clientResult = await pool.query(
      `SELECT id, allowed_scopes FROM mcp_clients WHERE id = $1`,
      [client_id]
    );

    if (clientResult.rows.length === 0) {
      redirectUrl.searchParams.set('error', OAuthErrorCode.INVALID_CLIENT);
      redirectUrl.searchParams.set('error_description', 'Unknown client');

      return NextResponse.json({
        redirectUrl: redirectUrl.toString()
      });
    }

    // Parse and validate scopes
    const requestedScopes = parseScopes(scope);
    const allowedScopes = clientResult.rows[0].allowed_scopes;

    // Check if all requested scopes are allowed
    const invalidScopes = requestedScopes.filter(s => !allowedScopes.includes(s));
    if (invalidScopes.length > 0) {
      redirectUrl.searchParams.set('error', OAuthErrorCode.INVALID_SCOPE);
      redirectUrl.searchParams.set('error_description', `Invalid scopes: ${invalidScopes.join(', ')}`);

      return NextResponse.json({
        redirectUrl: redirectUrl.toString()
      });
    }

    // Generate authorization code
    const authCode = generateAuthorizationCode();
    const expiresAt = getAuthCodeExpiration(); // 10 minutes

    // Store authorization code in database
    await pool.query(
      `INSERT INTO mcp_authorization_codes
       (code, user_id, client_id, redirect_uri, scopes, state,
        code_challenge, code_challenge_method, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        authCode,
        session.user.id,
        client_id,
        redirect_uri,
        requestedScopes,
        state,
        code_challenge,
        code_challenge_method,
        expiresAt
      ]
    );

    // Add authorization code to redirect URL
    redirectUrl.searchParams.set('code', authCode);

    return NextResponse.json({
      redirectUrl: redirectUrl.toString()
    });
  } catch (error) {
    console.error('Consent endpoint error:', error);

    redirectUrl.searchParams.set('error', OAuthErrorCode.SERVER_ERROR);
    redirectUrl.searchParams.set('error_description', 'Internal server error');

    return NextResponse.json({
      redirectUrl: redirectUrl.toString()
    }, { status: 500 });
  }
}
