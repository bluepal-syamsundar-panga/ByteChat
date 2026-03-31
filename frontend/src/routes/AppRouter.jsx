import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ChatPage from '../pages/ChatPage';
import LoginPage from '../pages/LoginPage';
import ProfilePage from '../pages/ProfilePage';
import RegisterPage from '../pages/RegisterPage';
import useAuthStore from '../store/authStore';
import { hasValidAccessToken } from '../utils/authToken';

import LandingPage from '../pages/LandingPage';
import WorkspaceWizard from '../pages/WorkspaceWizard';

function ProtectedRoute({ children }) {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  if (!hasHydrated) return null;
  const isAllowed = hasValidAccessToken(accessToken);
  return isAllowed ? children : <Navigate to="/login" replace />;
}

function PublicOnlyRoute({ children }) {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  if (!hasHydrated) return null;
  const isAllowed = hasValidAccessToken(accessToken);
  return isAllowed ? <Navigate to="/" replace /> : children;
}

const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />
      
      {/* Landing Page is protected but doesn't use MainLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <LandingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/create-workspace"
        element={
          <ProtectedRoute>
            <WorkspaceWizard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/" replace />} />
        <Route path=":type/:id" element={<ChatPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
