import { z } from 'zod';

export const createSessionSchema = z.object({
  title: z.string().max(255).optional(),
});

export const updateSessionSchema = z.object({
  title: z.string().min(1).max(255),
});

export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(10000, 'Message too long'),
  model: z
    .enum(['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'])
    .optional()
    .default('gpt-4o-mini'),
});

export const sessionIdSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
});

export const paginationSchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
});

export const messagesQuerySchema = z.object({
  limit: z.string().optional().default('50').transform(Number),
  before: z.string().uuid().optional(),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
