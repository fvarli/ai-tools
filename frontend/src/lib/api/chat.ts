import { get, post, patch, del, API_BASE_URL } from './client';
import type { ChatSession, Message, SendMessageInput } from '../types/chat';

export interface SessionsResponse {
  sessions: ChatSession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MessagesResponse {
  messages: Message[];
  hasMore: boolean;
  oldestMessageId?: string;
}

export async function getSessions(
  page: number = 1,
  limit: number = 20
): Promise<SessionsResponse> {
  return get<SessionsResponse>(`/chat/sessions?page=${page}&limit=${limit}`);
}

export async function createSession(title?: string): Promise<ChatSession> {
  return post<ChatSession>('/chat/sessions', { title });
}

export async function getSession(sessionId: string): Promise<ChatSession> {
  return get<ChatSession>(`/chat/sessions/${sessionId}`);
}

export async function updateSession(
  sessionId: string,
  title: string
): Promise<ChatSession> {
  return patch<ChatSession>(`/chat/sessions/${sessionId}`, { title });
}

export async function deleteSession(sessionId: string): Promise<void> {
  await del(`/chat/sessions/${sessionId}`);
}

export async function getMessages(
  sessionId: string,
  limit: number = 50,
  before?: string
): Promise<MessagesResponse> {
  let url = `/chat/sessions/${sessionId}/messages?limit=${limit}`;
  if (before) {
    url += `&before=${before}`;
  }
  return get<MessagesResponse>(url);
}

export function createMessageStream(
  sessionId: string,
  input: SendMessageInput
): {
  eventSource: EventSource;
  controller: AbortController;
} {
  const controller = new AbortController();

  // We need to make a POST request first, then read the stream
  // EventSource only supports GET, so we'll use fetch with streaming
  const url = `${API_BASE_URL}/chat/sessions/${sessionId}/messages/stream`;

  // Create a custom EventSource-like interface using fetch
  const eventSource = new EventSource(url);

  return { eventSource, controller };
}

// Helper function to send message and get SSE stream
export async function sendMessageStream(
  sessionId: string,
  input: SendMessageInput,
  callbacks: {
    onStart?: (data: { messageId: string; sessionId: string }) => void;
    onDelta?: (content: string) => void;
    onDone?: (data: { messageId: string; tokens: { promptTokens: number; completionTokens: number } }) => void;
    onError?: (error: { code: string; message: string }) => void;
  }
): Promise<void> {
  const url = `${API_BASE_URL}/chat/sessions/${sessionId}/messages/stream`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to send message');
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('No response body');
  }

  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    // Parse SSE events from buffer
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer

    let currentEvent = '';
    let currentData = '';

    for (const line of lines) {
      if (line.startsWith('event:')) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith('data:')) {
        currentData = line.slice(5).trim();
      } else if (line === '' && currentEvent && currentData) {
        // Empty line means end of event
        try {
          const data = JSON.parse(currentData);

          switch (currentEvent) {
            case 'start':
              callbacks.onStart?.(data);
              break;
            case 'delta':
              callbacks.onDelta?.(data.content);
              break;
            case 'done':
              callbacks.onDone?.(data);
              break;
            case 'error':
              callbacks.onError?.(data);
              break;
          }
        } catch (e) {
          console.error('Failed to parse SSE data:', e);
        }

        currentEvent = '';
        currentData = '';
      }
    }
  }
}
