import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import type { DirectMessage } from '../lib/types/dm';
import * as dmApi from '../lib/api/dm';
import { useAuth } from './AuthContext';

interface DirectMessagesContextType {
  messages: DirectMessage[];
  isLoading: boolean;
  isConnected: boolean;
  otherUserOnline: boolean;
  otherUserTyping: boolean;
  sendMessage: (content: string) => void;
  loadMoreMessages: () => Promise<void>;
  hasMore: boolean;
  setTyping: (isTyping: boolean) => void;
}

const DirectMessagesContext = createContext<DirectMessagesContextType | undefined>(undefined);

interface DirectMessagesProviderProps {
  children: ReactNode;
}

export function DirectMessagesProvider({ children }: DirectMessagesProviderProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await dmApi.getMessages(50);
        setMessages(response.messages);
        setHasMore(response.hasMore);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, []);

  // Setup socket connection
  useEffect(() => {
    if (!user || user.role !== 'DM_USER') return;

    // Connect with credentials (cookies will be sent automatically)
    const socket = io(window.location.origin, {
      path: '/socket.io',
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
      setOtherUserOnline(false);
    });

    socket.on('dm:message', (message: DirectMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('dm:user-online', ({ username }) => {
      console.log(`${username} is online`);
      setOtherUserOnline(true);
    });

    socket.on('dm:user-offline', ({ username }) => {
      console.log(`${username} is offline`);
      setOtherUserOnline(false);
    });

    socket.on('dm:user-typing', () => {
      setOtherUserTyping(true);
    });

    socket.on('dm:user-stop-typing', () => {
      setOtherUserTyping(false);
    });

    socket.on('dm:error', ({ message }) => {
      console.error('DM error:', message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const sendMessage = useCallback((content: string) => {
    if (!socketRef.current || !content.trim()) return;
    socketRef.current.emit('dm:send', content.trim());
  }, []);

  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || messages.length === 0) return;

    const oldestMessage = messages[0];
    try {
      const response = await dmApi.getMessages(50, oldestMessage.id);
      setMessages((prev) => [...response.messages, ...prev]);
      setHasMore(response.hasMore);
    } catch (error) {
      console.error('Failed to load more messages:', error);
    }
  }, [hasMore, messages]);

  const setTyping = useCallback((isTyping: boolean) => {
    if (!socketRef.current) return;

    if (isTyping) {
      socketRef.current.emit('dm:typing');

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Auto stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('dm:stop-typing');
      }, 3000);
    } else {
      socketRef.current.emit('dm:stop-typing');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  }, []);

  const value: DirectMessagesContextType = {
    messages,
    isLoading,
    isConnected,
    otherUserOnline,
    otherUserTyping,
    sendMessage,
    loadMoreMessages,
    hasMore,
    setTyping,
  };

  return (
    <DirectMessagesContext.Provider value={value}>
      {children}
    </DirectMessagesContext.Provider>
  );
}

export function useDirectMessages() {
  const context = useContext(DirectMessagesContext);
  if (context === undefined) {
    throw new Error('useDirectMessages must be used within a DirectMessagesProvider');
  }
  return context;
}
