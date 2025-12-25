export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  promptTokens?: number;
  completionTokens?: number;
  model?: string;
  isStreaming?: boolean;
}

export interface SendMessageInput {
  content: string;
  model?: string;
}

export interface SSEEvent {
  type: 'start' | 'delta' | 'done' | 'error';
  data: unknown;
}

export interface StreamStartData {
  messageId: string;
  sessionId: string;
}

export interface StreamDeltaData {
  content: string;
  index: number;
}

export interface StreamDoneData {
  messageId: string;
  tokens: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface StreamErrorData {
  code: string;
  message: string;
}
