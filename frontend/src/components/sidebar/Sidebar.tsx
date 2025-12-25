import { useEffect, useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { SessionItem } from './SessionItem';
import { Spinner } from '../common/Spinner';

export function Sidebar() {
  const { user, logout } = useAuth();
  const {
    sessions,
    currentSession,
    isLoadingSessions,
    loadSessions,
    createSession,
    selectSession,
    deleteSession,
    renameSession,
  } = useChat();

  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleNewChat = async () => {
    setIsCreating(true);
    try {
      await createSession();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white w-64">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <button
          onClick={handleNewChat}
          disabled={isCreating}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {isCreating ? (
            <Spinner size="sm" />
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          )}
          New Chat
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoadingSessions ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No chats yet</p>
            <p className="text-sm mt-1">Start a new conversation</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                isActive={currentSession?.id === session.id}
                onSelect={() => selectSession(session.id)}
                onDelete={() => deleteSession(session.id)}
                onRename={(title) => renameSession(session.id, title)}
              />
            ))}
          </div>
        )}
      </div>

      {/* User menu */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-medium">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm truncate">{user?.username}</span>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
            title="Logout"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
