import { useChat } from '../../contexts/ChatContext';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

export function ChatContainer() {
  const {
    currentSession,
    messages,
    isLoadingMessages,
    isSending,
    sendMessage,
    createSession,
  } = useChat();

  const handleSendMessage = async (content: string) => {
    if (!currentSession) {
      // Create a new session and send message immediately with session ID
      const session = await createSession();
      await sendMessage(content, 'gpt-4o-mini', session.id);
    } else {
      await sendMessage(content);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header - hidden on mobile (shown in ChatPage mobile header) */}
      <div className="hidden md:block border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <h1 className="text-lg font-medium text-gray-900 dark:text-white truncate">
          {currentSession?.title || 'New Chat'}
        </h1>
      </div>

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoadingMessages} />

      {/* Input */}
      <MessageInput
        onSend={handleSendMessage}
        disabled={isSending}
        placeholder={
          currentSession
            ? 'Type your message...'
            : 'Type a message to start a new chat...'
        }
      />
    </div>
  );
}
