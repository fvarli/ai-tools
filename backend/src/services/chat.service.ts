import { prisma } from '../config/database.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { generateSessionTitle, type ChatMessage } from './openai.service.js';
import type { CreateSessionInput, UpdateSessionInput } from '../schemas/chat.schema.js';

export interface Session {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount?: number;
}

export interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
  promptTokens?: number | null;
  completionTokens?: number | null;
  model?: string | null;
}

/**
 * Get all sessions for a user
 */
export async function getSessions(
  userId: string,
  page: number,
  limit: number
): Promise<{ sessions: Session[]; total: number }> {
  const [sessions, total] = await Promise.all([
    prisma.chatSession.findMany({
      where: { userId, isArchived: false },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { messages: true } },
      },
    }),
    prisma.chatSession.count({ where: { userId, isArchived: false } }),
  ]);

  return {
    sessions: sessions.map((s) => ({
      id: s.id,
      title: s.title,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      messageCount: s._count.messages,
    })),
    total,
  };
}

/**
 * Create a new session
 */
export async function createSession(
  userId: string,
  input: CreateSessionInput
): Promise<Session> {
  const session = await prisma.chatSession.create({
    data: {
      userId,
      title: input.title || 'New Chat',
    },
  });

  return {
    id: session.id,
    title: session.title,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

/**
 * Get a session by ID (with ownership check)
 */
export async function getSession(
  sessionId: string,
  userId: string
): Promise<Session> {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: {
      _count: { select: { messages: true } },
    },
  });

  if (!session) {
    throw new NotFoundError('Session not found', 'SESSION_NOT_FOUND');
  }

  if (session.userId !== userId) {
    throw new ForbiddenError('Access denied', 'ACCESS_DENIED');
  }

  return {
    id: session.id,
    title: session.title,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    messageCount: session._count.messages,
  };
}

/**
 * Update a session
 */
export async function updateSession(
  sessionId: string,
  userId: string,
  input: UpdateSessionInput
): Promise<Session> {
  // Check ownership
  await getSession(sessionId, userId);

  const session = await prisma.chatSession.update({
    where: { id: sessionId },
    data: { title: input.title },
  });

  return {
    id: session.id,
    title: session.title,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

/**
 * Delete a session
 */
export async function deleteSession(
  sessionId: string,
  userId: string
): Promise<void> {
  // Check ownership
  await getSession(sessionId, userId);

  await prisma.chatSession.delete({
    where: { id: sessionId },
  });
}

/**
 * Get messages for a session
 */
export async function getMessages(
  sessionId: string,
  userId: string,
  limit: number,
  before?: string
): Promise<{ messages: Message[]; hasMore: boolean }> {
  // Check ownership
  await getSession(sessionId, userId);

  const where: {
    sessionId: string;
    createdAt?: { lt: Date };
  } = { sessionId };

  if (before) {
    const beforeMessage = await prisma.message.findUnique({
      where: { id: before },
      select: { createdAt: true },
    });
    if (beforeMessage) {
      where.createdAt = { lt: beforeMessage.createdAt };
    }
  }

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    take: limit + 1, // Get one extra to check if there are more
  });

  const hasMore = messages.length > limit;
  const result = hasMore ? messages.slice(0, -1) : messages;

  return {
    messages: result.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
      promptTokens: m.promptTokens,
      completionTokens: m.completionTokens,
      model: m.model,
    })),
    hasMore,
  };
}

/**
 * Save a user message
 */
export async function saveUserMessage(
  sessionId: string,
  content: string
): Promise<Message> {
  const message = await prisma.message.create({
    data: {
      sessionId,
      role: 'user',
      content,
    },
  });

  // Update session timestamp
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { updatedAt: new Date() },
  });

  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
  };
}

/**
 * Save an assistant message
 */
export async function saveAssistantMessage(
  sessionId: string,
  content: string,
  model: string,
  promptTokens: number,
  completionTokens: number
): Promise<Message> {
  const message = await prisma.message.create({
    data: {
      sessionId,
      role: 'assistant',
      content,
      model,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    },
  });

  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
    promptTokens: message.promptTokens,
    completionTokens: message.completionTokens,
    model: message.model,
  };
}

/**
 * Get conversation history for AI context
 */
export async function getConversationHistory(
  sessionId: string,
  maxMessages: number = 20
): Promise<ChatMessage[]> {
  const messages = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
    take: maxMessages,
    select: {
      role: true,
      content: true,
    },
  });

  // Reverse to get chronological order
  return messages.reverse().map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));
}

/**
 * Update session title based on first message
 */
export async function updateSessionTitleFromMessage(
  sessionId: string,
  firstMessage: string
): Promise<void> {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: { _count: { select: { messages: true } } },
  });

  // Only update title if this is the first message and title is default
  if (session && session._count.messages <= 1 && session.title === 'New Chat') {
    const title = await generateSessionTitle(firstMessage);
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { title },
    });
  }
}
