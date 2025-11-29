import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import config from '../config/env.js';
import logger from '../utils/logger.js';
import { AuthenticatedRequest } from './auth.js';

/**
 * Rate limiter configuration for MCP endpoints
 * Limits requests per user (if authenticated) or per IP
 */
export const mcpRateLimiter = rateLimit({
  windowMs: config.rateLimitWindow, // Time window in milliseconds
  max: config.rateLimitRequests, // Max requests per window
  message: {
    error: 'Too many requests',
    message: `Rate limit exceeded. Please try again after ${config.rateLimitWindow / 1000} seconds.`,
    retryAfter: Math.ceil(config.rateLimitWindow / 1000),
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers

  // Key generator: use userId if authenticated, otherwise use IP
  keyGenerator: (req: Request) => {
    const authReq = req as AuthenticatedRequest;

    if (authReq.user?.id) {
      logger.debug('Rate limit key: user ID', { userId: authReq.user.id });
      return `user:${authReq.user.id}`;
    }

    // Fallback to IP address
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    logger.debug('Rate limit key: IP address', { ip });
    return `ip:${ip}`;
  },

  // Handler called when rate limit is exceeded
  handler: (req: Request, res, _next, options) => {
    const authReq = req as AuthenticatedRequest;

    logger.warn('Rate limit exceeded', {
      userId: authReq.user?.id,
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    res.status(options.statusCode).json(options.message);
  },
});

/**
 * More lenient rate limiter for health checks and info endpoints
 */
export const healthRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    error: 'Too many health check requests',
    message: 'Please slow down your health check requests',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req: Request) => {
    // Skip rate limiting in development for health checks
    return config.nodeEnv === 'development';
  },
});

/**
 * Strict rate limiter for authentication attempts
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 authentication attempts per 15 minutes
  message: {
    error: 'Too many authentication attempts',
    message: 'Account temporarily locked. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful auth towards limit
  handler: (req: Request, res, _next, options) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });

    res.status(options.statusCode).json(options.message);
  },
});
