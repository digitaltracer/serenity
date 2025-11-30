/**
 * Rate Limiting for MCP Device Flow
 * Prevents abuse of device authorization endpoints
 *
 * Note: This is an in-memory implementation suitable for development
 * and single-server deployments. For production with multiple servers,
 * use Redis or another distributed cache.
 */

import { NextRequest } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory rate limit storage
// Key format: "operation:identifier"
const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * Rate limit device authorization requests
 * Limits: 3 requests per IP address per hour
 *
 * This prevents attackers from flooding the system with device codes
 *
 * @param req - Next.js request object
 * @returns { success: boolean, remaining?: number, resetAt?: number }
 */
export async function rateLimitDeviceAuth(
  req: NextRequest
): Promise<{ success: boolean; remaining?: number; resetAt?: number }> {
  // Extract IP address
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  const key = `device_auth:${ip}`;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxRequests = 3;

  const record = rateLimitMap.get(key);

  // No record exists or window expired - create new record
  if (!record || now > record.resetAt) {
    const resetAt = now + windowMs;
    rateLimitMap.set(key, { count: 1, resetAt });
    return {
      success: true,
      remaining: maxRequests - 1,
      resetAt,
    };
  }

  // Rate limit exceeded
  if (record.count >= maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  // Increment count
  record.count++;
  return {
    success: true,
    remaining: maxRequests - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Check if device code polling should be rate limited
 * Tracked in database (poll_count column) rather than in-memory
 *
 * This function is a placeholder - actual rate limiting is done
 * in the API endpoint by checking the poll_count in mcp_device_codes table
 *
 * Max: 120 polls per device code (10 minutes at 5-second intervals)
 */
export function shouldRateLimitPolling(pollCount: number): boolean {
  const maxPolls = 120; // 10 minutes * 12 polls/minute
  return pollCount >= maxPolls;
}

/**
 * Cleanup expired entries from rate limit map
 * Should be run periodically (e.g., every 5 minutes)
 */
export function cleanupExpiredRateLimits(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}

// Auto-cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cleaned = cleanupExpiredRateLimits();
    if (cleaned > 0) {
      console.log(`[Rate Limiter] Cleaned up ${cleaned} expired entries`);
    }
  }, 5 * 60 * 1000);
}

/**
 * Get rate limit info for a specific key (for debugging/monitoring)
 */
export function getRateLimitInfo(key: string): RateLimitRecord | null {
  const record = rateLimitMap.get(key);
  return record || null;
}

/**
 * Reset rate limit for a specific key (for testing)
 */
export function resetRateLimit(key: string): void {
  rateLimitMap.delete(key);
}

/**
 * Clear all rate limits (for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitMap.clear();
}
