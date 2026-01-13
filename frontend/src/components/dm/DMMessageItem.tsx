import type { DirectMessage } from '../../lib/types/dm';
import { useAuth } from '../../contexts/AuthContext';

interface DMMessageItemProps {
  message: DirectMessage;
}

export function DMMessageItem({ message }: DMMessageItemProps) {
  const { user } = useAuth();
  const isOwnMessage = user?.id === message.senderId;

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isOwnMessage
            ? 'bg-primary text-white rounded-br-md'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
        }`}
      >
        {!isOwnMessage && (
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            {message.senderUsername}
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p
          className={`text-xs mt-1 ${
            isOwnMessage ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}
