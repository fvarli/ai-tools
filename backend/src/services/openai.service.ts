import OpenAI from 'openai';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamCallbacks {
  onStart?: () => void;
  onToken?: (token: string) => void;
  onDone?: (usage: { promptTokens: number; completionTokens: number }) => void;
  onError?: (error: Error) => void;
}

/**
 * Stream chat completion from OpenAI
 */
export async function streamChatCompletion(
  messages: ChatMessage[],
  model: string,
  callbacks: StreamCallbacks
): Promise<string> {
  try {
    callbacks.onStart?.();

    const stream = await openai.chat.completions.create({
      model,
      messages,
      stream: true,
      stream_options: { include_usage: true },
    });

    let fullContent = '';
    let usage = { promptTokens: 0, completionTokens: 0 };

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullContent += content;
        callbacks.onToken?.(content);
      }

      // Get usage from the final chunk
      if (chunk.usage) {
        usage = {
          promptTokens: chunk.usage.prompt_tokens,
          completionTokens: chunk.usage.completion_tokens,
        };
      }
    }

    callbacks.onDone?.(usage);
    return fullContent;
  } catch (error) {
    logger.error('OpenAI streaming error:', error);
    callbacks.onError?.(error instanceof Error ? error : new Error('OpenAI API error'));
    throw error;
  }
}

/**
 * Generate a title for a chat session based on the first message
 */
export async function generateSessionTitle(firstMessage: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Generate a very short title (3-6 words) for a chat that starts with the following message. Respond with just the title, no quotes or punctuation.',
        },
        {
          role: 'user',
          content: firstMessage,
        },
      ],
      max_tokens: 20,
    });

    return response.choices[0]?.message?.content?.trim() || 'New Chat';
  } catch (error) {
    logger.error('Error generating session title:', error);
    return 'New Chat';
  }
}
