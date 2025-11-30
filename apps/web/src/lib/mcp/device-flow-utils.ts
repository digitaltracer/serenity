/**
 * OAuth Device Flow Utility Functions
 * Implements code generation for RFC 8628 Device Authorization Grant
 */

import crypto from 'crypto';

/**
 * Generate device code (server-side only, high entropy)
 * Used for polling endpoint - never shown to user
 *
 * @returns 64-character base64url-encoded random string (384 bits of entropy)
 */
export function generateDeviceCode(): string {
  return crypto.randomBytes(48).toString('base64url');
}

/**
 * Generate user code (user-friendly, easy to type)
 * Format: XXXX-XXXX (8 characters + hyphen)
 * Character set excludes ambiguous characters: 0 (zero), O (oscar), I (india), 1 (one)
 *
 * @returns 9-character string in format "ABCD-1234"
 */
export function generateUserCode(): string {
  // Charset: 32 characters (removed 0, O, I, 1 for clarity)
  // A-Z except I and O = 24 letters
  // 2-9 (8 digits, removed 0 and 1)
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';

  for (let i = 0; i < 8; i++) {
    // Add hyphen in the middle
    if (i === 4) {
      code += '-';
    }

    // Use cryptographically secure random
    const randomIndex = crypto.randomInt(0, charset.length);
    code += charset[randomIndex];
  }

  return code;
}

/**
 * Generate MCP session token (high entropy)
 * Used for long-lived MCP server authentication (90 days)
 *
 * @returns 64-character base64url-encoded random string (384 bits of entropy)
 */
export function generateMCPSessionToken(): string {
  return crypto.randomBytes(48).toString('base64url');
}

/**
 * Validate user code format
 * Ensures code matches expected pattern: XXXX-XXXX
 *
 * @param code - User code to validate
 * @returns true if valid format, false otherwise
 */
export function validateUserCode(code: string): boolean {
  // Must be exactly 9 characters: 4 + hyphen + 4
  if (code.length !== 9) {
    return false;
  }

  // Must match pattern: XXXX-XXXX (uppercase alphanumeric with hyphen)
  const pattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(code);
}

/**
 * Generate device fingerprint from request
 * Used for display in MCP session management UI
 *
 * @param userAgent - Optional user agent string
 * @param ip - Optional IP address
 * @returns Fingerprint string for display
 */
export function generateDeviceFingerprint(userAgent?: string, ip?: string): string {
  const parts: string[] = [];

  if (userAgent) {
    // Extract OS and browser from user agent
    const osMatch = userAgent.match(/(Windows|Mac OS|Linux|Android|iOS)/i);
    const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge)/i);

    if (osMatch) parts.push(osMatch[1]);
    if (browserMatch) parts.push(browserMatch[1]);
  }

  if (ip && !ip.includes('127.0.0.1') && !ip.includes('localhost')) {
    parts.push(`IP: ${ip}`);
  }

  return parts.length > 0 ? parts.join(', ') : 'Unknown Device';
}
