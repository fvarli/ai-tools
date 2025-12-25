import type { Request, Response, NextFunction } from 'express';
import * as chatService from '../services/chat.service.js';
import { streamChatCompletion, type ChatMessage } from '../services/openai.service.js';
import { logger } from '../utils/logger.js';

const SYSTEM_PROMPT = `You are a helpful AI assistant. Provide clear, accurate, and helpful responses.
Be concise but thorough. If you're unsure about something, say so.
Format your responses with markdown when appropriate.`;

/**
 * Get all sessions
 * GET /api/chat/sessions
 */
export async function getSessions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { page, limit } = req.query as { page: number; limit: number };
    const { sessions, total } = await chatService.getSessions(
      req.user!.userId,
      page,
      limit
    );

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new session
 * POST /api/chat/sessions
 */
export async function createSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = await chatService.createSession(req.user!.userId, req.body);

    res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a session by ID
 * GET /api/chat/sessions/:sessionId
 */
export async function getSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = await chatService.getSession(
      req.params.sessionId,
      req.user!.userId
    );

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update a session
 * PATCH /api/chat/sessions/:sessionId
 */
export async function updateSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = await chatService.updateSession(
      req.params.sessionId,
      req.user!.userId,
      req.body
    );

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a session
 * DELETE /api/chat/sessions/:sessionId
 */
export async function deleteSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await chatService.deleteSession(req.params.sessionId, req.user!.userId);

    res.json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get messages for a session
 * GET /api/chat/sessions/:sessionId/messages
 */
export async function getMessages(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { limit, before } = req.query as { limit: number; before?: string };
    const { messages, hasMore } = await chatService.getMessages(
      req.params.sessionId,
      req.user!.userId,
      limit,
      before
    );

    res.json({
      success: true,
      data: {
        messages,
        hasMore,
        oldestMessageId: messages[0]?.id,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Send a message and stream the response
 * POST /api/chat/sessions/:sessionId/messages/stream
 */
export async function streamMessage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { sessionId } = req.params;
    const { content, model } = req.body;
    const userId = req.user!.userId;

    // Verify session ownership
    await chatService.getSession(sessionId, userId);

    // Save user message
    const userMessage = await chatService.saveUserMessage(sessionId, content);

    // Get conversation history
    const history = await chatService.getConversationHistory(sessionId);

    // Build messages array with system prompt
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
    ];

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send start event
    res.write(
      `event: start\ndata: ${JSON.stringify({
        messageId: userMessage.id,
        sessionId,
      })}\n\n`
    );

    let fullContent = '';
    let tokenIndex = 0;

    try {
      // Stream the response
      fullContent = await streamChatCompletion(messages, model, {
        onToken: (token) => {
          res.write(
            `event: delta\ndata: ${JSON.stringify({
              content: token,
              index: tokenIndex++,
            })}\n\n`
          );
        },
        onDone: async (usage) => {
          // Save assistant message
          const assistantMessage = await chatService.saveAssistantMessage(
            sessionId,
            fullContent,
            model,
            usage.promptTokens,
            usage.completionTokens
          );

          // Update session title if this is the first message
          chatService.updateSessionTitleFromMessage(sessionId, content);

          // Send done event
          res.write(
            `event: done\ndata: ${JSON.stringify({
              messageId: assistantMessage.id,
              tokens: usage,
            })}\n\n`
          );

          res.end();
        },
        onError: (error) => {
          logger.error('Stream error:', error);
          res.write(
            `event: error\ndata: ${JSON.stringify({
              code: 'STREAM_ERROR',
              message: error.message,
            })}\n\n`
          );
          res.end();
        },
      });
    } catch (error) {
      logger.error('Streaming error:', error);
      res.write(
        `event: error\ndata: ${JSON.stringify({
          code: 'OPENAI_ERROR',
          message: 'Failed to generate response',
        })}\n\n`
      );
      res.end();
    }
  } catch (error) {
    next(error);
  }
}
