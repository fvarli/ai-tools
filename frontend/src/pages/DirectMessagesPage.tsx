import { DirectMessagesProvider } from '../contexts/DirectMessagesContext';
import { DMContainer } from '../components/dm/DMContainer';
import { useAuth } from '../contexts/AuthContext';

export function DirectMessagesPage() {
  const { user, logout } = useAuth();

  return (
    <DirectMessagesProvider>
      <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-800">
        {/* Top bar */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Logged in as{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {user?.username}
              </span>
            </span>
          </div>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Logout
          </button>
        </div>

        {/* Chat container */}
        <div className="flex-1 max-w-3xl w-full mx-auto">
          <DMContainer />
        </div>
      </div>
    </DirectMessagesProvider>
  );
}
