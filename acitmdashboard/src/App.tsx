
import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { ToastContainer } from './components/shared/Toast';
import Login from './components/auth/Login';
import AdminDashboard from './components/admin/AdminDashboard';
import CenterDashboard from './components/center/CenterDashboard';

const AppToastContainer = () => {
    const { toasts } = useToast();
    return <ToastContainer toasts={toasts} />;
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'center':
      return <CenterDashboard />;
    default:
      return <Login />;
  }
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
        <AppToastContainer />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;