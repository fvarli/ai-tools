import type { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service.js';
import {
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from '../services/token.service.js';
import { config } from '../config/index.js';

/**
 * Login user
 * POST /api/auth/login
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body);

    // Set cookies
    res.cookie('accessToken', accessToken, accessTokenCookieOptions);
    res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

    res.json({
      success: true,
      data: {
        user,
        expiresAt: new Date(
          Date.now() + accessTokenCookieOptions.maxAge
        ).toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Logout user
 * POST /api/auth/logout
 */
export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    // Clear cookies
    res.clearCookie('accessToken', { path: '/ai-tools' });
    res.clearCookie('refreshToken', { path: '/ai-tools/api/auth' });

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current user
 * GET /api/auth/me
 */
export async function me(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await authService.getUserById(req.user!.userId);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const oldRefreshToken = req.cookies?.refreshToken;

    if (!oldRefreshToken) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NO_REFRESH_TOKEN',
          message: 'Refresh token required',
        },
      });
      return;
    }

    const { accessToken, refreshToken } =
      await authService.refreshAccessToken(oldRefreshToken);

    // Set new cookies
    res.cookie('accessToken', accessToken, accessTokenCookieOptions);
    res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

    res.json({
      success: true,
      data: {
        expiresAt: new Date(
          Date.now() + accessTokenCookieOptions.maxAge
        ).toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}
