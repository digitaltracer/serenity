import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  DatabaseError,
  SessionError,
  isOperationalError,
} from '../utils/errors.js';
import logger from '../utils/logger.js';
import config from '../config/env.js';
import { AuthenticatedRequest } from './auth.js';

/**
 * Error response interface
 */
interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
  stack?: string;
}

/**
 * Convert Zod validation errors to readable format
 */
function formatZodError(error: ZodError): { field: string; message: string }[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

/**
 * Global error handling middleware
 * Must be registered last in the middleware chain
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const authReq = req as AuthenticatedRequest;

  // Log the error
  logger.error('Request error occurred', {
    error: err.message,
    stack: err.stack,
    userId: authReq.user?.id,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Default error response
  let statusCode = 500;
  let errorResponse: ErrorResponse = {
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
  };

  // Handle specific error types
  if (err instanceof AuthenticationError) {
    statusCode = 401;
    errorResponse = {
      error: 'Authentication Required',
      message: err.message,
    };
  } else if (err instanceof AuthorizationError) {
    statusCode = 403;
    errorResponse = {
      error: 'Access Denied',
      message: err.message,
    };
  } else if (err instanceof ValidationError) {
    statusCode = 400;
    errorResponse = {
      error: 'Validation Failed',
      message: err.message,
      details: err.details,
    };
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    errorResponse = {
      error: 'Not Found',
      message: err.message,
    };
  } else if (err instanceof RateLimitError) {
    statusCode = 429;
    errorResponse = {
      error: 'Rate Limit Exceeded',
      message: err.message,
    };
  } else if (err instanceof SessionError) {
    statusCode = 401;
    errorResponse = {
      error: 'Session Error',
      message: err.message,
    };
  } else if (err instanceof DatabaseError) {
    statusCode = 500;
    errorResponse = {
      error: 'Database Error',
      message: config.nodeEnv === 'development' ? err.message : 'A database error occurred',
    };
  } else if (err instanceof ZodError) {
    // Handle Zod validation errors
    statusCode = 400;
    errorResponse = {
      error: 'Validation Failed',
      message: 'Request validation failed',
      details: formatZodError(err),
    };
  } else if (err instanceof AppError) {
    // Generic AppError
    statusCode = err.statusCode;
    errorResponse = {
      error: 'Application Error',
      message: err.message,
    };
  }

  // Include stack trace in development
  if (config.nodeEnv === 'development') {
    errorResponse.stack = err.stack;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);

  // If error is not operational, we might want to crash the process
  // (In production, you'd have a process manager like PM2 to restart)
  if (!isOperationalError(err) && config.nodeEnv === 'production') {
    logger.error('Non-operational error occurred, might need manual intervention', {
      error: err.message,
      stack: err.stack,
    });

    // Optionally: process.exit(1);
    // But better to let the process manager handle this
  }
}

/**
 * 404 handler for undefined routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  logger.debug('Route not found', {
    path: req.path,
    method: req.method,
  });

  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler<T = any>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
