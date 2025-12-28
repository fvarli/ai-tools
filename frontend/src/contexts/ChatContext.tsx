import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { ChatSession, Message } from '../lib/types/chat';
import * as chatApi from '../lib/api/chat';

interface ChatContextType {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  messages: Message[];
  isLoadingSessions: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  streamingContent: string;
  isSidebarOpen: boolean;
  loadSessions: () => Promise<void>;
  createSession: (title?: string) => Promise<ChatSession>;
  selectSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, title: string) => Promise<void>;
  sendMessage: (content: string, model?: string) => Promise<void>;
  clearCurrentSession: () => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const response = await chatApi.getSessions();
      setSessions(response.sessions);
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  const createSession = useCallback(async (title?: string) => {
    const session = await chatApi.createSession(title);
    setSessions((prev) => [session, ...prev]);
    setCurrentSession(session);
    setMessages([]);
    return session;
  }, []);

  const selectSession = useCallback(async (sessionId: string) => {
    setIsLoadingMessages(true);
    try {
      const [session, messagesResponse] = await Promise.all([
        chatApi.getSession(sessionId),
        chatApi.getMessages(sessionId),
      ]);
      setCurrentSession(session);
      setMessages(messagesResponse.messages);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const deleteSession = useCallback(
    async (sessionId: string) => {
      await chatApi.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));

      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }
    },
    [currentSession]
  );

  const renameSession = useCallback(
    async (sessionId: string, title: string) => {
      const updated = await chatApi.updateSession(sessionId, title);
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title: updated.title } : s))
      );

      if (currentSession?.id === sessionId) {
        setCurrentSession((prev) => (prev ? { ...prev, title: updated.title } : null));
      }
    },
    [currentSession]
  );

  const sendMessage = useCallback(
    async (content: string, model: string = 'gpt-4o-mini') => {
      if (!currentSession) return;

      setIsSending(true);
      setStreamingContent('');

      // Add user message immediately
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Add placeholder for assistant message
      const assistantMessage: Message = {
        id: `temp-assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        isStreaming: true,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        let fullContent = '';

        await chatApi.sendMessageStream(
          currentSession.id,
          { content, model },
          {
            onStart: (data) => {
              // Update user message with real ID
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === userMessage.id ? { ...m, id: data.messageId } : m
                )
              );
            },
            onDelta: (deltaContent) => {
              fullContent += deltaContent;
              setStreamingContent(fullContent);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessage.id
                    ? { ...m, content: fullContent }
                    : m
                )
              );
            },
            onDone: (data) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessage.id
                    ? {
                        ...m,
                        id: data.messageId,
                        content: fullContent,
                        isStreaming: false,
                        promptTokens: data.tokens.promptTokens,
                        completionTokens: data.tokens.completionTokens,
                      }
                    : m
                )
              );
              setStreamingContent('');

              // Reload session to get updated title
              loadSessions();
            },
            onError: (error) => {
              // Remove the streaming message and show error
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessage.id
                    ? {
                        ...m,
                        content: `Error: ${error.message}`,
                        isStreaming: false,
                      }
                    : m
                )
              );
              setStreamingContent('');
            },
          }
        );
      } catch (error) {
        // Remove the streaming message on error
        setMessages((prev) =>
          prev.filter((m) => m.id !== assistantMessage.id)
        );
        setStreamingContent('');
        throw error;
      } finally {
        setIsSending(false);
      }
    },
    [currentSession, loadSessions]
  );

  const clearCurrentSession = useCallback(() => {
    setCurrentSession(null);
    setMessages([]);
    setStreamingContent('');
  }, []);

  const value: ChatContextType = {
    sessions,
    currentSession,
    messages,
    isLoadingSessions,
    isLoadingMessages,
    isSending,
    streamingContent,
    isSidebarOpen,
    loadSessions,
    createSession,
    selectSession,
    deleteSession,
    renameSession,
    sendMessage,
    clearCurrentSession,
    toggleSidebar,
    closeSidebar,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
