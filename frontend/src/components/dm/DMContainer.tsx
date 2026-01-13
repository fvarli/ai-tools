import { useDirectMessages } from '../../contexts/DirectMessagesContext';
import { DMMessageList } from './DMMessageList';
import { DMMessageInput } from './DMMessageInput';

export function DMContainer() {
  const {
    messages,
    isLoading,
    isConnected,
    otherUserOnline,
    otherUserTyping,
    sendMessage,
    loadMoreMessages,
    hasMore,
    setTyping,
  } = useDirectMessages();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium text-gray-900 dark:text-white">
              Direct Messages
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
              {otherUserOnline && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span className="text-xs text-green-500">Partner online</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <DMMessageList
        messages={messages}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={loadMoreMessages}
        otherUserTyping={otherUserTyping}
      />

      {/* Input */}
      <DMMessageInput
        onSend={sendMessage}
        onTyping={setTyping}
        disabled={!isConnected}
      />
    </div>
  );
}
