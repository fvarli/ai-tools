import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { ChatPage } from './pages/ChatPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="dark">
          <Routes>
            <Route path="/ai-tools/login" element={<LoginPage />} />
            <Route
              path="/ai-tools"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-tools/chat/:sessionId"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/ai-tools" replace />} />
            <Route path="*" element={<Navigate to="/ai-tools" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
