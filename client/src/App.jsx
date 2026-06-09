import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Repositories from './pages/Repositories';
import RepositoryDetails from './pages/RepositoryDetails';
import AIChat from './pages/AIChat';
import TaskHistory from './pages/TaskHistory';
import Settings from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '32px', height: '32px', border: '2px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/repositories" element={<Repositories />} />
        <Route path="/repositories/:id" element={<RepositoryDetails />} />
        <Route path="/chat" element={<AIChat />} />
        <Route path="/tasks" element={<TaskHistory />} />
        <Route path="/tasks/:id" element={<TaskHistory />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={
        <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <h1 className="gradient-text" style={{ fontSize: '80px', fontWeight: '900', letterSpacing: '-0.04em' }}>404</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Page not found</p>
          <a href="/" className="btn btn-primary btn-sm">Go Home</a>
        </div>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          {/* Global toaster — available on ALL pages including public routes */}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#111118',
                border: '1px solid rgba(255,255,255,0.09)',
                color: '#eef0f6',
                fontSize: '13px',
                borderRadius: '10px',
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
