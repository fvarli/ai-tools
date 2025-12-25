import { Router } from 'express';
import * as chatController from '../controllers/chat.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validate.middleware.js';
import { chatLimiter } from '../middleware/rateLimit.middleware.js';
import {
  createSessionSchema,
  updateSessionSchema,
  sendMessageSchema,
  sessionIdSchema,
  paginationSchema,
  messagesQuerySchema,
} from '../schemas/chat.schema.js';

const router = Router();

// All chat routes require authentication
router.use(authenticate);

// GET /api/chat/sessions
router.get(
  '/sessions',
  validateQuery(paginationSchema),
  chatController.getSessions
);

// POST /api/chat/sessions
router.post(
  '/sessions',
  validateBody(createSessionSchema),
  chatController.createSession
);

// GET /api/chat/sessions/:sessionId
router.get(
  '/sessions/:sessionId',
  validateParams(sessionIdSchema),
  chatController.getSession
);

// PATCH /api/chat/sessions/:sessionId
router.patch(
  '/sessions/:sessionId',
  validateParams(sessionIdSchema),
  validateBody(updateSessionSchema),
  chatController.updateSession
);

// DELETE /api/chat/sessions/:sessionId
router.delete(
  '/sessions/:sessionId',
  validateParams(sessionIdSchema),
  chatController.deleteSession
);

// GET /api/chat/sessions/:sessionId/messages
router.get(
  '/sessions/:sessionId/messages',
  validateParams(sessionIdSchema),
  validateQuery(messagesQuerySchema),
  chatController.getMessages
);

// POST /api/chat/sessions/:sessionId/messages/stream
router.post(
  '/sessions/:sessionId/messages/stream',
  chatLimiter,
  validateParams(sessionIdSchema),
  validateBody(sendMessageSchema),
  chatController.streamMessage
);

export default router;
