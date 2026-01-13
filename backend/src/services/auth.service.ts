import { prisma } from '../config/database.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import {
  generateTokenPair,
  hashToken,
  verifyRefreshToken,
  getTokenExpirationMs,
} from './token.service.js';
import { config } from '../config/index.js';
import { UnauthorizedError, ConflictError, NotFoundError } from '../utils/errors.js';
import type { CreateUserInput, LoginInput } from '../schemas/auth.schema.js';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: Date;
}

export interface LoginResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

/**
 * Create a new user (admin only)
 */
export async function createUser(input: CreateUserInput): Promise<AuthUser> {
  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username: input.username }, { email: input.email }],
    },
  });

  if (existingUser) {
    throw new ConflictError('Username or email already registered', 'USER_EXISTS');
  }

  // Hash password
  const passwordHash = await hashPassword(input.password);

  // Create user
  const user = await prisma.user.create({
    data: {
      username: input.username,
      email: input.email,
      passwordHash,
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
}

/**
 * Login user
 */
export async function login(input: LoginInput): Promise<LoginResult> {
  // Find user by username or email
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: input.username }, { email: input.username }],
      isActive: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid username or password', 'INVALID_CREDENTIALS');
  }

  // Verify password
  const isValid = await verifyPassword(user.passwordHash, input.password);
  if (!isValid) {
    throw new UnauthorizedError('Invalid username or password', 'INVALID_CREDENTIALS');
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokenPair({
    userId: user.id,
    username: user.username,
  });

  // Store refresh token hash
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(
    Date.now() + getTokenExpirationMs(config.JWT_REFRESH_EXPIRES_IN)
  );

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt,
    },
  });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  try {
    // Verify the refresh token
    const decoded = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);

    // Find the stored token
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        userId: decoded.userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!storedToken || !storedToken.user.isActive) {
      throw new UnauthorizedError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    // Revoke old token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const tokens = generateTokenPair({
      userId: storedToken.userId,
      username: storedToken.user.username,
    });

    // Store new refresh token
    const newTokenHash = hashToken(tokens.refreshToken);
    const expiresAt = new Date(
      Date.now() + getTokenExpirationMs(config.JWT_REFRESH_EXPIRES_IN)
    );

    await prisma.refreshToken.create({
      data: {
        userId: storedToken.userId,
        tokenHash: newTokenHash,
        expiresAt,
      },
    });

    return tokens;
  } catch {
    throw new UnauthorizedError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }
}

/**
 * Logout user (revoke refresh token)
 */
export async function logout(refreshToken: string): Promise<void> {
  try {
    const tokenHash = hashToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  } catch {
    // Silently ignore errors during logout
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId, isActive: true },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  return user;
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeAllTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
