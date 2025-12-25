import { Sidebar } from '../components/sidebar/Sidebar';
import { ChatContainer } from '../components/chat/ChatContainer';
import { ChatProvider } from '../contexts/ChatContext';

export function ChatPage() {
  return (
    <ChatProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <ChatContainer />
        </main>
      </div>
    </ChatProvider>
  );
}
