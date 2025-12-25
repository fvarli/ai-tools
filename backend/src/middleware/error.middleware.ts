import type { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
  };
}

/**
 * Global error handling middleware
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error
  if (err instanceof AppError && err.isOperational) {
    logger.warn(`Operational error: ${err.message}`, { code: err.code });
  } else {
    logger.error('Unexpected error:', err);
  }

  // Build error response
  const response: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  };

  let statusCode = 500;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    response.error.code = err.code;
    response.error.message = err.message;

    if (err instanceof ValidationError && err.details) {
      response.error.details = err.details;
    }
  }

  // Include stack trace in development
  if (config.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

/**
 * 404 handler for unknown routes
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}
