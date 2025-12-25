import type { Request, Response } from 'express';
import { prisma } from '../config/database.js';

/**
 * Health check endpoint
 * GET /api/health
 */
export async function healthCheck(_req: Request, res: Response): Promise<void> {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
      },
    });
  }
}
