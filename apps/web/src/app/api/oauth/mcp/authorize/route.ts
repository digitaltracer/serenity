/**
 * OAuth 2.0 Authorization Endpoint
 * Implements the authorization request flow per RFC 6749
 * Requires PKCE per RFC 7636 (code_challenge/code_challenge_method)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPostgresPool } from '@/lib/db/postgres';
import { validateRedirectUri, createOAuthError, OAuthErrorCode } from '@/lib/mcp/oauth-utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/oauth/mcp/authorize
 *
 * Query Parameters:
 * - client_id: OAuth client identifier (required)
 * - redirect_uri: Callback URI (required)
 * - response_type: Must be 'code' (required)
 * - scope: Requested scopes, space-separated (optional, defaults to 'mcp:read mcp:write')
 * - state: CSRF protection token (required)
 * - code_challenge: PKCE challenge (required)
 * - code_challenge_method: 'S256' or 'plain' (required, S256 recommended)
 *
 * Response:
 * - 302 Redirect to login (if not authenticated)
 * - 302 Redirect to consent screen (if authenticated)
 * - 400 Bad Request (invalid parameters)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Extract OAuth parameters
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const responseType = searchParams.get('response_type');
  const scope = searchParams.get('scope') || 'mcp:read mcp:write';
  const state = searchParams.get('state');
  const codeChallenge = searchParams.get('code_challenge');
  const codeChallengeMethod = searchParams.get('code_challenge_method');

  // Validate required parameters
  if (!clientId) {
    return NextResponse.json(
      createOAuthError(OAuthErrorCode.INVALID_REQUEST, 'Missing client_id'),
      { status: 400 }
    );
  }

  if (!redirectUri) {
    return NextResponse.json(
      createOAuthError(OAuthErrorCode.INVALID_REQUEST, 'Missing redirect_uri'),
      { status: 400 }
    );
  }

  if (responseType !== 'code') {
    return NextResponse.json(
      createOAuthError(OAuthErrorCode.UNSUPPORTED_GRANT_TYPE, 'Only response_type=code is supported'),
      { status: 400 }
    );
  }

  if (!state) {
    return NextResponse.json(
      createOAuthError(OAuthErrorCode.INVALID_REQUEST, 'Missing state parameter (CSRF protection)'),
      { status: 400 }
    );
  }

  if (!codeChallenge) {
    return NextResponse.json(
      createOAuthError(OAuthErrorCode.INVALID_REQUEST, 'Missing code_challenge (PKCE required)'),
      { status: 400 }
    );
  }

  if (!codeChallengeMethod || !['S256', 'plain'].includes(codeChallengeMethod)) {
    return NextResponse.json(
      createOAuthError(OAuthErrorCode.INVALID_REQUEST, 'Invalid code_challenge_method (must be S256 or plain)'),
      { status: 400 }
    );
  }

  // Validate client and redirect URI
  const pool = getPostgresPool();

  try {
    const clientResult = await pool.query(
      `SELECT id, name, redirect_uris, allowed_scopes
       FROM mcp_clients
       WHERE id = $1`,
      [clientId]
    );

    if (clientResult.rows.length === 0) {
      return NextResponse.json(
        createOAuthError(OAuthErrorCode.INVALID_CLIENT, 'Unknown client_id'),
        { status: 400 }
      );
    }

    const client = clientResult.rows[0];

    // Validate redirect_uri against registered URIs
    if (!validateRedirectUri(redirectUri, client.redirect_uris)) {
      return NextResponse.json(
        createOAuthError(
          OAuthErrorCode.INVALID_REQUEST,
          'redirect_uri does not match registered URIs'
        ),
        { status: 400 }
      );
    }

    // Check user authentication
    const session = await auth();

    if (!session?.user?.id) {
      // User not authenticated - redirect to login with return URL
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', req.url);

      return NextResponse.redirect(loginUrl);
    }

    // User is authenticated - redirect to consent screen
    const consentUrl = new URL('/oauth/consent', req.url);

    // Pass all OAuth parameters to consent screen
    consentUrl.searchParams.set('client_id', clientId);
    consentUrl.searchParams.set('client_name', client.name);
    consentUrl.searchParams.set('redirect_uri', redirectUri);
    consentUrl.searchParams.set('scope', scope);
    consentUrl.searchParams.set('state', state);
    consentUrl.searchParams.set('code_challenge', codeChallenge);
    consentUrl.searchParams.set('code_challenge_method', codeChallengeMethod);

    return NextResponse.redirect(consentUrl);
  } catch (error) {
    console.error('Authorization endpoint error:', error);

    // Redirect to error page with OAuth error
    if (redirectUri) {
      const errorUrl = new URL(redirectUri);
      errorUrl.searchParams.set('error', OAuthErrorCode.SERVER_ERROR);
      errorUrl.searchParams.set('error_description', 'Internal server error');
      if (state) errorUrl.searchParams.set('state', state);

      return NextResponse.redirect(errorUrl);
    }

    return NextResponse.json(
      createOAuthError(OAuthErrorCode.SERVER_ERROR, 'Internal server error'),
      { status: 500 }
    );
  }
}
