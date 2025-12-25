import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/token.service.js';
import { UnauthorizedError } from '../utils/errors.js';

/**
 * Middleware to authenticate requests using JWT from cookies
 */
export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    // Get token from cookie
    const token = req.cookies?.accessToken;

    if (!token) {
      throw new UnauthorizedError('Authentication required', 'NO_TOKEN');
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Attach user to request
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Invalid or expired token', 'INVALID_TOKEN'));
    }
  }
}

/**
 * Optional authentication - doesn't fail if no token present
 */
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const token = req.cookies?.accessToken;

    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = {
        userId: decoded.userId,
        username: decoded.username,
      };
    }

    next();
  } catch {
    // Silently continue without user
    next();
  }
}
