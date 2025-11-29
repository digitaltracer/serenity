import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';
import { AuthenticatedRequest } from './auth.js';

/**
 * Request logging middleware
 * Logs all incoming requests with timing information
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const authReq = req as AuthenticatedRequest;

  // Log request start
  logger.debug('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Capture response finish event
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

    logger.log(logLevel, 'Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: authReq.user?.id,
      ip: req.ip,
      contentLength: res.get('content-length'),
    });
  });

  // Capture response error event
  res.on('error', (error: Error) => {
    const duration = Date.now() - startTime;

    logger.error('Response error', {
      method: req.method,
      path: req.path,
      duration: `${duration}ms`,
      error: error.message,
      userId: authReq.user?.id,
      ip: req.ip,
    });
  });

  next();
}

/**
 * Audit logging middleware
 * Logs important mutations to the audit log table
 */
export function auditLogger(action: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      logger.warn('Audit log attempted without authenticated user', {
        action,
        path: req.path,
      });
      next();
      return;
    }

    logger.info('Audit log', {
      action,
      userId: authReq.user.id,
      path: req.path,
      method: req.method,
      ip: req.ip,
      body: req.body,
    });

    next();
  };
}
