import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';
import { loginSchema } from '../schemas/auth.schema.js';

const router = Router();

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  authController.login
);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// GET /api/auth/me
router.get('/me', authenticate, authController.me);

// POST /api/auth/refresh
router.post('/refresh', authController.refresh);

export default router;
