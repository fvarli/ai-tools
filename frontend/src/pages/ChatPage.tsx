import { useParams } from 'react-router-dom';
import { Sidebar } from '../components/sidebar/Sidebar';
import { ChatContainer } from '../components/chat/ChatContainer';
import { ChatProvider, useChat } from '../contexts/ChatContext';

function ChatLayout() {
  const { isSidebarOpen, toggleSidebar, closeSidebar, currentSession } = useChat();

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="flex items-center gap-3 p-3 border-b border-gray-200 dark:border-gray-700 md:hidden">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Open sidebar"
          >
            <svg
              className="w-6 h-6 text-gray-600 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {currentSession?.title || 'Dev Tools'}
          </h1>
        </div>

        {/* Chat container */}
        <div className="flex-1 overflow-hidden">
          <ChatContainer />
        </div>
      </main>
    </div>
  );
}

export function ChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  return (
    <ChatProvider initialSessionId={sessionId}>
      <ChatLayout />
    </ChatProvider>
  );
}
