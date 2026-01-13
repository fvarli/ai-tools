import { useEffect, useRef } from 'react';
import type { DirectMessage } from '../../lib/types/dm';
import { DMMessageItem } from './DMMessageItem';
import { Spinner } from '../common/Spinner';

interface DMMessageListProps {
  messages: DirectMessage[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  otherUserTyping: boolean;
}

export function DMMessageList({
  messages,
  isLoading,
  hasMore,
  onLoadMore,
  otherUserTyping,
}: DMMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle scroll for load more
  const handleScroll = () => {
    const container = containerRef.current;
    if (container && container.scrollTop === 0 && hasMore && !isLoading) {
      onLoadMore();
    }
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <svg
            className="w-16 h-16 mx-auto mb-4 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <h3 className="text-lg font-medium mb-2">No messages yet</h3>
          <p className="text-sm">Start a conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4"
    >
      {hasMore && (
        <div className="text-center mb-4">
          <button
            onClick={onLoadMore}
            className="text-sm text-primary hover:underline"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load earlier messages'}
          </button>
        </div>
      )}

      {messages.map((message) => (
        <DMMessageItem key={message.id} message={message} />
      ))}

      {otherUserTyping && (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span>typing...</span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
