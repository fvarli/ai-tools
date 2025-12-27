import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '../utils/errors.js';

/**
 * Middleware factory to validate request body against a Zod schema
 */
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throw new ValidationError('Validation failed', errors);
      }

      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware factory to validate request query parameters against a Zod schema
 */
export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.query);

      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throw new ValidationError('Validation failed', errors);
      }

      // Store validated query in a custom property (req.query is read-only in newer Express)
      (req as any).validatedQuery = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware factory to validate request params against a Zod schema
 */
export function validateParams<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.params);

      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throw new ValidationError('Validation failed', errors);
      }

      req.params = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}
