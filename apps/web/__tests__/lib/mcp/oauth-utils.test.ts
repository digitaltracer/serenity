/**
 * Tests for OAuth 2.0 Utility Functions
 * Tests PKCE, token generation, and validation logic
 */

import {
  generateCodeVerifier,
  generateCodeChallenge,
  verifyPKCE,
  generateToken,
  generateAuthorizationCode,
  generateAccessToken,
  generateRefreshToken,
  generateState,
  validateRedirectUri,
  createOAuthError,
  OAuthErrorCode,
  getAccessTokenExpiration,
  getRefreshTokenExpiration,
  getAuthCodeExpiration,
  isTokenExpired,
  validateScopes,
  parseScopes,
  formatScopes,
  MCPScopes,
} from '@/lib/mcp/oauth-utils';

describe('PKCE Functions', () => {
  describe('generateCodeVerifier', () => {
    it('should generate a 128-character base64url string', () => {
      const verifier = generateCodeVerifier();
      expect(verifier).toHaveLength(128);
      // Base64url only contains A-Z, a-z, 0-9, -, _
      expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should generate unique verifiers', () => {
      const verifier1 = generateCodeVerifier();
      const verifier2 = generateCodeVerifier();
      expect(verifier1).not.toBe(verifier2);
    });
  });

  describe('generateCodeChallenge', () => {
    it('should generate a base64url-encoded SHA256 hash', () => {
      const verifier = 'test-verifier-123';
      const challenge = generateCodeChallenge(verifier);

      expect(challenge).toBeTruthy();
      expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should generate consistent challenges for the same verifier', () => {
      const verifier = 'test-verifier-123';
      const challenge1 = generateCodeChallenge(verifier);
      const challenge2 = generateCodeChallenge(verifier);

      expect(challenge1).toBe(challenge2);
    });

    it('should generate different challenges for different verifiers', () => {
      const challenge1 = generateCodeChallenge('verifier-1');
      const challenge2 = generateCodeChallenge('verifier-2');

      expect(challenge1).not.toBe(challenge2);
    });
  });

  describe('verifyPKCE', () => {
    it('should verify valid S256 challenge', () => {
      const verifier = generateCodeVerifier();
      const challenge = generateCodeChallenge(verifier);

      expect(verifyPKCE(verifier, challenge, 'S256')).toBe(true);
    });

    it('should reject invalid S256 challenge', () => {
      const verifier = generateCodeVerifier();
      const wrongChallenge = generateCodeChallenge('wrong-verifier');

      expect(verifyPKCE(verifier, wrongChallenge, 'S256')).toBe(false);
    });

    it('should verify plain challenge', () => {
      const verifier = 'plain-text-verifier';

      expect(verifyPKCE(verifier, verifier, 'plain')).toBe(true);
    });

    it('should reject invalid plain challenge', () => {
      expect(verifyPKCE('verifier', 'different', 'plain')).toBe(false);
    });
  });
});

describe('Token Generation', () => {
  describe('generateToken', () => {
    it('should generate token with default length', () => {
      const token = generateToken();
      expect(token).toHaveLength(64); // 48 bytes = 64 base64url chars
    });

    it('should generate token with custom length', () => {
      const token = generateToken(24);
      expect(token).toHaveLength(32); // 24 bytes = 32 base64url chars
    });

    it('should generate unique tokens', () => {
      const token1 = generateToken();
      const token2 = generateToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('generateAuthorizationCode', () => {
    it('should generate 32-character code', () => {
      const code = generateAuthorizationCode();
      expect(code).toHaveLength(32);
    });
  });

  describe('generateAccessToken', () => {
    it('should generate 64-character token', () => {
      const token = generateAccessToken();
      expect(token).toHaveLength(64);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate 64-character token', () => {
      const token = generateRefreshToken();
      expect(token).toHaveLength(64);
    });
  });

  describe('generateState', () => {
    it('should generate 32-character state', () => {
      const state = generateState();
      expect(state).toHaveLength(32);
    });

    it('should generate unique states', () => {
      const state1 = generateState();
      const state2 = generateState();
      expect(state1).not.toBe(state2);
    });
  });
});

describe('Redirect URI Validation', () => {
  describe('validateRedirectUri', () => {
    it('should accept exact match', () => {
      const uri = 'https://example.com/callback';
      const allowed = ['https://example.com/callback'];

      expect(validateRedirectUri(uri, allowed)).toBe(true);
    });

    it('should reject non-matching URI', () => {
      const uri = 'https://evil.com/callback';
      const allowed = ['https://example.com/callback'];

      expect(validateRedirectUri(uri, allowed)).toBe(false);
    });

    it('should accept localhost wildcard port', () => {
      const uri = 'http://localhost:8080/callback';
      const allowed = ['http://localhost:*/callback'];

      expect(validateRedirectUri(uri, allowed)).toBe(true);
    });

    it('should accept 127.0.0.1 wildcard port', () => {
      const uri = 'http://127.0.0.1:3000/callback';
      const allowed = ['http://127.0.0.1:*/callback'];

      expect(validateRedirectUri(uri, allowed)).toBe(true);
    });

    it('should reject wildcard for non-localhost domains', () => {
      const uri = 'https://example.com:8080/callback';
      const allowed = ['https://example.com:*/callback'];

      expect(validateRedirectUri(uri, allowed)).toBe(false);
    });
  });
});

describe('OAuth Error Handling', () => {
  describe('createOAuthError', () => {
    it('should create error with code only', () => {
      const error = createOAuthError(OAuthErrorCode.INVALID_REQUEST);

      expect(error.error).toBe('invalid_request');
      expect(error.error_description).toBeUndefined();
    });

    it('should create error with description', () => {
      const error = createOAuthError(OAuthErrorCode.INVALID_CLIENT, 'Client not found');

      expect(error.error).toBe('invalid_client');
      expect(error.error_description).toBe('Client not found');
    });
  });
});

describe('Token Expiration', () => {
  describe('getAccessTokenExpiration', () => {
    it('should return expiration 1 hour in future by default', () => {
      const expiration = getAccessTokenExpiration();
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;

      expect(expiration.getTime()).toBeGreaterThan(now);
      expect(expiration.getTime()).toBeLessThan(now + oneHour + 1000);
    });

    it('should accept custom hours', () => {
      const expiration = getAccessTokenExpiration(2);
      const now = Date.now();
      const twoHours = 2 * 60 * 60 * 1000;

      expect(expiration.getTime()).toBeGreaterThan(now + twoHours - 1000);
      expect(expiration.getTime()).toBeLessThan(now + twoHours + 1000);
    });
  });

  describe('getRefreshTokenExpiration', () => {
    it('should return expiration 90 days in future by default', () => {
      const expiration = getRefreshTokenExpiration();
      const now = Date.now();
      const ninetyDays = 90 * 24 * 60 * 60 * 1000;

      expect(expiration.getTime()).toBeGreaterThan(now + ninetyDays - 1000);
    });
  });

  describe('getAuthCodeExpiration', () => {
    it('should return expiration 10 minutes in future by default', () => {
      const expiration = getAuthCodeExpiration();
      const now = Date.now();
      const tenMinutes = 10 * 60 * 1000;

      expect(expiration.getTime()).toBeGreaterThan(now);
      expect(expiration.getTime()).toBeLessThan(now + tenMinutes + 1000);
    });
  });

  describe('isTokenExpired', () => {
    it('should return true for past date', () => {
      const pastDate = new Date(Date.now() - 1000);
      expect(isTokenExpired(pastDate)).toBe(true);
    });

    it('should return false for future date', () => {
      const futureDate = new Date(Date.now() + 10000);
      expect(isTokenExpired(futureDate)).toBe(false);
    });

    it('should accept ISO string', () => {
      const pastDate = new Date(Date.now() - 1000).toISOString();
      expect(isTokenExpired(pastDate)).toBe(true);
    });
  });
});

describe('Scope Management', () => {
  describe('validateScopes', () => {
    it('should accept all valid scopes', () => {
      const requested = ['mcp:read', 'mcp:write'];
      const allowed = ['mcp:read', 'mcp:write'];

      expect(validateScopes(requested, allowed)).toBe(true);
    });

    it('should reject invalid scopes', () => {
      const requested = ['mcp:read', 'mcp:admin'];
      const allowed = ['mcp:read', 'mcp:write'];

      expect(validateScopes(requested, allowed)).toBe(false);
    });

    it('should accept subset of allowed scopes', () => {
      const requested = ['mcp:read'];
      const allowed = ['mcp:read', 'mcp:write'];

      expect(validateScopes(requested, allowed)).toBe(true);
    });
  });

  describe('parseScopes', () => {
    it('should parse space-separated scopes', () => {
      const scopes = parseScopes('mcp:read mcp:write');
      expect(scopes).toEqual(['mcp:read', 'mcp:write']);
    });

    it('should handle multiple spaces', () => {
      const scopes = parseScopes('mcp:read   mcp:write');
      expect(scopes).toEqual(['mcp:read', 'mcp:write']);
    });

    it('should handle empty string', () => {
      const scopes = parseScopes('');
      expect(scopes).toEqual([]);
    });

    it('should trim whitespace', () => {
      const scopes = parseScopes('  mcp:read mcp:write  ');
      expect(scopes).toEqual(['mcp:read', 'mcp:write']);
    });
  });

  describe('formatScopes', () => {
    it('should format scopes with spaces', () => {
      const formatted = formatScopes(['mcp:read', 'mcp:write']);
      expect(formatted).toBe('mcp:read mcp:write');
    });

    it('should handle empty array', () => {
      const formatted = formatScopes([]);
      expect(formatted).toBe('');
    });
  });

  describe('MCPScopes', () => {
    it('should define standard scopes', () => {
      expect(MCPScopes.READ).toBe('mcp:read');
      expect(MCPScopes.WRITE).toBe('mcp:write');
    });
  });
});

describe('Integration: Full PKCE Flow', () => {
  it('should complete full PKCE flow', () => {
    // 1. Client generates verifier and challenge
    const verifier = generateCodeVerifier();
    const challenge = generateCodeChallenge(verifier);

    // 2. Server stores challenge
    const storedChallenge = challenge;

    // 3. Client sends verifier for validation
    const isValid = verifyPKCE(verifier, storedChallenge, 'S256');

    expect(isValid).toBe(true);
  });

  it('should reject tampered verifier', () => {
    // 1. Client generates verifier and challenge
    const verifier = generateCodeVerifier();
    const challenge = generateCodeChallenge(verifier);

    // 2. Attacker tries different verifier
    const attackerVerifier = generateCodeVerifier();

    // 3. Validation fails
    const isValid = verifyPKCE(attackerVerifier, challenge, 'S256');

    expect(isValid).toBe(false);
  });
});
