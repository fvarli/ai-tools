import type { Message } from '../../lib/types/chat';

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`py-6 ${isUser ? 'bg-transparent' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
      <div className="max-w-3xl mx-auto px-4 flex gap-4">
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
            isUser ? 'bg-primary' : 'bg-emerald-600'
          }`}
        >
          {isUser ? 'U' : 'AI'}
        </div>

        {/* Message content */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">
            {isUser ? 'You' : 'Assistant'}
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {message.content.split('\n').map((line, i) => (
              <p key={i} className="mb-2 last:mb-0">
                {line || '\u00A0'}
              </p>
            ))}
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
            )}
          </div>

          {/* Token info for assistant messages */}
          {!isUser && message.promptTokens && (
            <div className="mt-2 text-xs text-gray-400">
              Tokens: {message.promptTokens} prompt + {message.completionTokens} completion
              {message.model && ` | Model: ${message.model}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
