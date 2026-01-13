import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import * as dmService from '../services/dm.service.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { prisma } from '../config/database.js';
import { ForbiddenError } from '../utils/errors.js';

const router = Router();

// Middleware to check DM_USER role
async function requireDMUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { role: true },
    });

    if (user?.role !== 'DM_USER') {
      throw new ForbiddenError('Access denied. DM_USER role required.', 'DM_ACCESS_DENIED');
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Get DM message history
 * GET /api/dm/messages
 */
router.get('/messages', authenticate, requireDMUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const before = req.query.before as string | undefined;

    const messages = await dmService.getMessages(limit, before);

    res.json({
      success: true,
      data: {
        messages,
        hasMore: messages.length === limit,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
