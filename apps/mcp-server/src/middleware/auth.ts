import { Request, Response, NextFunction } from 'express';
import { PostgresAdapter } from '@serenity/database';
import config from '../config/env.js';
import { AuthenticationError, SessionError } from '../utils/errors.js';
import logger from '../utils/logger.js';

// Create adapter instance for auth queries
const authAdapter = new PostgresAdapter({
  connectionString: config.databaseUrl,
});

/**
 * User interface from NextAuth
 */
export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

/**
 * Extended Request with user context
 */
export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Authenticate request using MCP session token (OAuth Device Flow)
 *
 * @param authHeader - Authorization header value
 * @returns User object if authenticated, null otherwise
 */
export async function authenticateRequest(
  authHeader: string | undefined
): Promise<User | null> {
  // Check if Authorization header exists
  if (!authHeader) {
    logger.debug('No Authorization header provided');
    return null;
  }

  // Check if it's a Bearer token
  if (!authHeader.startsWith('Bearer ')) {
    logger.debug('Authorization header is not a Bearer token');
    return null;
  }

  // Extract session token
  const sessionToken = authHeader.substring(7); // Remove 'Bearer '

  if (!sessionToken || sessionToken.length === 0) {
    logger.debug('Session token is empty');
    return null;
  }

  try {
    // Validate against mcp_sessions table in PostgreSQL
    const result = await authAdapter.query(`
      SELECT
        u.id,
        u.email,
        u.name,
        u.image,
        s.expires_at,
        s.revoked_at,
        s.id as session_id
      FROM mcp_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = $1
        AND s.expires_at > NOW()
        AND s.revoked_at IS NULL
    `, [sessionToken]);

    // No valid session found
    if (result.rows.length === 0) {
      logger.debug('No valid MCP session found for token', {
        tokenPrefix: sessionToken.substring(0, 10) + '...',
      });
      return null;
    }

    const user = result.rows[0] as {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      expires_at: Date;
      revoked_at: Date | null;
      session_id: string;
    };

    // Update last_used_at for MCP session (fire and forget - don't block response)
    authAdapter.query(`
      UPDATE mcp_sessions
      SET last_used_at = NOW()
      WHERE id = $1
    `, [user.session_id]).catch((err: Error) => {
      logger.warn('Failed to update MCP session last_used_at', {
        sessionId: user.session_id,
        error: err.message,
      });
    });

    // Update user updatedAt timestamp (fire and forget)
    authAdapter.query(`
      UPDATE users
      SET "updatedAt" = NOW()
      WHERE id = $1
    `, [user.id]).catch((err: Error) => {
      logger.warn('Failed to update user last login', {
        userId: user.id,
        error: err.message,
      });
    });

    // Log to audit table (fire and forget)
    authAdapter.query(`
      INSERT INTO audit_logs ("userId", action, metadata, "createdAt")
      VALUES ($1, $2, $3, NOW())
    `, [
      user.id,
      'mcp_authenticated',
      JSON.stringify({
        service: 'mcp-server',
        sessionId: user.session_id,
        timestamp: new Date().toISOString(),
      })
    ]).catch((err: Error) => {
      logger.warn('Failed to log authentication to audit', {
        userId: user.id,
        error: err.message,
      });
    });

    logger.info('User authenticated successfully via MCP session', {
      userId: user.id,
      email: user.email,
      sessionId: user.session_id,
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    };
  } catch (error) {
    logger.error('Error validating MCP session token', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new SessionError('Failed to validate session');
  }
}

/**
 * Express middleware to authenticate requests
 * Attaches user to request object if authenticated
 * Throws AuthenticationError if not authenticated
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await authenticateRequest(req.headers.authorization);

    if (!user) {
      throw new AuthenticationError('Authentication required. Please authorize your MCP server using the device flow.');
    }

    // Attach user to request
    req.user = user;

    logger.debug('Request authenticated', {
      userId: user.id,
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication middleware
 * Attaches user to request if authenticated, but doesn't require it
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await authenticateRequest(req.headers.authorization);

    if (user) {
      req.user = user;
      logger.debug('Request optionally authenticated', {
        userId: user.id,
        path: req.path,
        method: req.method,
      });
    } else {
      logger.debug('Request proceeding without authentication', {
        path: req.path,
        method: req.method,
      });
    }

    next();
  } catch (error) {
    // For optional auth, we don't fail on errors, just log them
    logger.warn('Error in optional authentication', {
      error: error instanceof Error ? error.message : String(error),
      path: req.path,
    });
    next();
  }
}
