import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/common/Sidebar';
import { LoadingScreen } from './components/common/LoadingSpinner';

// Auth pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// User pages
import DashboardPage from './pages/user/DashboardPage';
import AccountsPage from './pages/user/AccountsPage';
import TransferPage from './pages/user/TransferPage';
import TransactionsPage from './pages/user/TransactionsPage';
import ProfilePage from './pages/user/ProfilePage';
import OnboardingPage from './pages/user/OnboardingPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOnboarding from './pages/admin/AdminOnboarding';
import AdminAccounts from './pages/admin/AdminAccounts';
import AdminTransactions from './pages/admin/AdminTransactions';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import AdminLedger from './pages/admin/AdminLedger';
import { adminAPI } from './services/api';

/* ── Route Guards ── */
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <LoadingScreen text="Loading session…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen text="Loading…" />;
  if (user) return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />;
  return children;
};

/* ── Shell with Sidebar ── */
function AppShell() {
  const { user, isAdmin } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    adminAPI.onboarding({ status: 'PENDING', limit: 1 })
      .then((r) => setPendingCount(r.data?.data?.total ?? 0))
      .catch(() => {});
  }, [isAdmin]);

  if (!user) return null;

  return (
    <div className="app-shell">
      <Sidebar pendingCount={pendingCount} />
      <div className="main-area">
        <div className="page-content">
          <Routes>
            {/* User */}
            <Route path="/dashboard"    element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/onboarding"   element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
            <Route path="/accounts"     element={<ProtectedRoute><AccountsPage /></ProtectedRoute>} />
            <Route path="/transfer"     element={<ProtectedRoute><TransferPage /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
            <Route path="/profile"      element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin"              element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users"        element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/onboarding"   element={<ProtectedRoute adminOnly><AdminOnboarding /></ProtectedRoute>} />
            <Route path="/admin/accounts"     element={<ProtectedRoute adminOnly><AdminAccounts /></ProtectedRoute>} />
            <Route path="/admin/transactions" element={<ProtectedRoute adminOnly><AdminTransactions /></ProtectedRoute>} />
            <Route path="/admin/audit"        element={<ProtectedRoute adminOnly><AdminAuditLogs /></ProtectedRoute>} />
            <Route path="/admin/ledger"       element={<ProtectedRoute adminOnly><AdminLedger /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/portal" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} replace /> : <Navigate to="/login" replace />} />
      <Route path="/*" element={<ProtectedRoute><AppShell /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
