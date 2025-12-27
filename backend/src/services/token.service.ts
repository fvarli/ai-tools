import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/index.js';

export interface TokenPayload {
  userId: string;
  username: string;
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

/**
 * Generate an access token
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRES_IN as string,
    algorithm: 'HS256',
  } as jwt.SignOptions);
}

/**
 * Generate a refresh token
 */
export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN as string,
    algorithm: 'HS256',
  } as jwt.SignOptions);
}

/**
 * Verify an access token
 */
export function verifyAccessToken(token: string): DecodedToken {
  return jwt.verify(token, config.JWT_ACCESS_SECRET) as DecodedToken;
}

/**
 * Verify a refresh token
 */
export function verifyRefreshToken(token: string): DecodedToken {
  return jwt.verify(token, config.JWT_REFRESH_SECRET) as DecodedToken;
}

/**
 * Hash a token for storage
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(payload: TokenPayload): {
  accessToken: string;
  refreshToken: string;
} {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

/**
 * Get token expiration time in milliseconds
 */
export function getTokenExpirationMs(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid expiration format: ${expiresIn}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
}

/**
 * Cookie options for access token
 */
export const accessTokenCookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/ai-tools',
  maxAge: getTokenExpirationMs(config.JWT_ACCESS_EXPIRES_IN),
};

/**
 * Cookie options for refresh token
 */
export const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/ai-tools/api/auth',
  maxAge: getTokenExpirationMs(config.JWT_REFRESH_EXPIRES_IN),
};
