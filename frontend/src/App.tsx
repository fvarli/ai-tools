import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { ChatPage } from './pages/ChatPage';
import { DirectMessagesPage } from './pages/DirectMessagesPage';
import './index.css';

// Component to handle role-based home redirect
function RoleBasedHome() {
  const { user } = useAuth();

  if (user?.role === 'DM_USER') {
    return <DirectMessagesPage />;
  }

  return <ChatPage />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="dark">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <RoleBasedHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:sessionId"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dm"
              element={
                <ProtectedRoute>
                  <DirectMessagesPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
