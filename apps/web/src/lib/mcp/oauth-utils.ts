/**
 * OAuth 2.0 Utility Functions
 * Implements PKCE, token generation, and OAuth flow helpers
 * Based on RFC 7636 (PKCE) and RFC 6749 (OAuth 2.0)
 */

import crypto from 'crypto';

// =============================================================================
// PKCE (Proof Key for Code Exchange) Functions
// =============================================================================

/**
 * Generate PKCE code verifier
 * Per RFC 7636: 128-character random string (base64url encoded)
 *
 * @returns Base64url-encoded random string (128 characters)
 */
export function generateCodeVerifier(): string {
  // 96 bytes = 128 base64url characters
  return crypto.randomBytes(96).toString('base64url');
}

/**
 * Generate PKCE code challenge from verifier
 * Per RFC 7636: base64url(sha256(code_verifier))
 *
 * @param verifier - Code verifier to hash
 * @returns Base64url-encoded SHA256 hash
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
}

/**
 * Verify PKCE code challenge matches verifier
 * Used during token exchange to validate client
 *
 * @param verifier - Code verifier from client
 * @param challenge - Stored code challenge from authorization request
 * @param method - Challenge method ('S256' or 'plain')
 * @returns true if verifier matches challenge
 */
export function verifyPKCE(
  verifier: string,
  challenge: string,
  method: 'S256' | 'plain' = 'S256'
): boolean {
  if (method === 'S256') {
    const computedChallenge = generateCodeChallenge(verifier);
    return computedChallenge === challenge;
  } else if (method === 'plain') {
    // Plain method: challenge === verifier (not recommended)
    return verifier === challenge;
  }
  return false;
}

// =============================================================================
// Token Generation Functions
// =============================================================================

/**
 * Generate cryptographically secure random token
 *
 * @param bytes - Number of random bytes (default: 48 = 64 base64url chars)
 * @returns Base64url-encoded random token
 */
export function generateToken(bytes: number = 48): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

/**
 * Generate OAuth authorization code
 * Short-lived (10 minutes), single-use
 *
 * @returns 32-character base64url-encoded string
 */
export function generateAuthorizationCode(): string {
  // 24 bytes = 32 base64url characters
  return crypto.randomBytes(24).toString('base64url');
}

/**
 * Generate OAuth access token
 * Short-lived (1 hour), high entropy
 *
 * @returns 64-character base64url-encoded string (384 bits entropy)
 */
export function generateAccessToken(): string {
  return generateToken(48); // 48 bytes = 64 characters
}

/**
 * Generate OAuth refresh token
 * Long-lived (90 days), high entropy
 *
 * @returns 64-character base64url-encoded string (384 bits entropy)
 */
export function generateRefreshToken(): string {
  return generateToken(48); // 48 bytes = 64 characters
}

// =============================================================================
// OAuth State Management
// =============================================================================

/**
 * Generate random state parameter for CSRF protection
 * Used in OAuth authorization requests
 *
 * @returns 32-character random string
 */
export function generateState(): string {
  // 24 bytes = 32 base64url characters
  return crypto.randomBytes(24).toString('base64url');
}

// =============================================================================
// Redirect URI Validation
// =============================================================================

/**
 * Validate redirect URI against allowed URIs
 * Supports wildcard ports for localhost (e.g., http://localhost:*)
 *
 * @param redirectUri - URI to validate
 * @param allowedUris - Array of allowed redirect URIs
 * @returns true if redirect URI is allowed
 */
export function validateRedirectUri(
  redirectUri: string,
  allowedUris: string[]
): boolean {
  // Exact match
  if (allowedUris.includes(redirectUri)) {
    return true;
  }

  // Check wildcard patterns (localhost only)
  for (const allowedUri of allowedUris) {
    if (allowedUri.includes('*')) {
      // Only allow wildcards in localhost/127.0.0.1 URIs
      if (!allowedUri.includes('localhost') && !allowedUri.includes('127.0.0.1')) {
        continue;
      }

      // Convert wildcard pattern to regex
      // Example: http://localhost:*/callback → http://localhost:\d+/callback
      const pattern = allowedUri
        .replace(/\./g, '\\.') // Escape dots
        .replace(/\*/g, '\\d+'); // Replace * with digits

      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(redirectUri)) {
        return true;
      }
    }
  }

  return false;
}

// =============================================================================
// OAuth Error Responses
// =============================================================================

export interface OAuthError {
  error: string;
  error_description?: string;
  error_uri?: string;
}

/**
 * Standard OAuth 2.0 error codes
 */
export const OAuthErrorCode = {
  INVALID_REQUEST: 'invalid_request',
  INVALID_CLIENT: 'invalid_client',
  INVALID_GRANT: 'invalid_grant',
  UNAUTHORIZED_CLIENT: 'unauthorized_client',
  UNSUPPORTED_GRANT_TYPE: 'unsupported_grant_type',
  INVALID_SCOPE: 'invalid_scope',
  ACCESS_DENIED: 'access_denied',
  SERVER_ERROR: 'server_error',
} as const;

/**
 * Create standardized OAuth error response
 *
 * @param code - OAuth error code
 * @param description - Human-readable error description
 * @returns OAuth error object
 */
export function createOAuthError(
  code: string,
  description?: string
): OAuthError {
  return {
    error: code,
    error_description: description,
  };
}

// =============================================================================
// Token Expiration Helpers
// =============================================================================

/**
 * Calculate access token expiration time
 *
 * @param hours - Hours until expiration (default: 1 hour)
 * @returns ISO timestamp
 */
export function getAccessTokenExpiration(hours: number = 1): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

/**
 * Calculate refresh token expiration time
 *
 * @param days - Days until expiration (default: 90 days)
 * @returns ISO timestamp
 */
export function getRefreshTokenExpiration(days: number = 90): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

/**
 * Calculate authorization code expiration time
 *
 * @param minutes - Minutes until expiration (default: 10 minutes)
 * @returns ISO timestamp
 */
export function getAuthCodeExpiration(minutes: number = 10): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Check if token is expired
 *
 * @param expiresAt - Expiration timestamp
 * @returns true if token is expired
 */
export function isTokenExpired(expiresAt: Date | string): boolean {
  const expiration = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return expiration <= new Date();
}

// =============================================================================
// Scope Management
// =============================================================================

/**
 * Default MCP scopes
 */
export const MCPScopes = {
  READ: 'mcp:read',
  WRITE: 'mcp:write',
} as const;

/**
 * Validate scopes against allowed scopes
 *
 * @param requestedScopes - Array of requested scope strings
 * @param allowedScopes - Array of allowed scope strings
 * @returns true if all requested scopes are allowed
 */
export function validateScopes(
  requestedScopes: string[],
  allowedScopes: string[]
): boolean {
  return requestedScopes.every(scope => allowedScopes.includes(scope));
}

/**
 * Parse scope string to array
 *
 * @param scopeString - Space-separated scope string
 * @returns Array of individual scopes
 */
export function parseScopes(scopeString: string): string[] {
  return scopeString.trim().split(/\s+/).filter(Boolean);
}

/**
 * Format scopes array to string
 *
 * @param scopes - Array of scopes
 * @returns Space-separated scope string
 */
export function formatScopes(scopes: string[]): string {
  return scopes.join(' ');
}
