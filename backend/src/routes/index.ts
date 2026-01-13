import { Router } from 'express';
import authRoutes from './auth.routes.js';
import chatRoutes from './chat.routes.js';
import dmRoutes from './dm.routes.js';
import { healthCheck } from '../controllers/health.controller.js';

const router = Router();

// Health check
router.get('/health', healthCheck);

// Auth routes
router.use('/auth', authRoutes);

// Chat routes
router.use('/chat', chatRoutes);

// Direct message routes
router.use('/dm', dmRoutes);

export default router;
