
import React, { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogoutIcon } from './Icons';

interface LayoutProps {
  title: string;
  sidebarContent: ReactNode;
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ title, sidebarContent, children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <aside className="w-64 flex-shrink-0 bg-primary-900 text-primary-100 flex flex-col">
        <div className="h-16 flex items-center justify-center text-2xl font-bold border-b border-primary-800">
          ACITM
        </div>
        <nav className="flex-grow px-4 py-6">
          {sidebarContent}
        </nav>
        <div className="p-4 border-t border-primary-800">
          <div className="text-sm">{user?.email}</div>
          <div className="text-xs text-primary-300 capitalize">{user?.role} {user?.role === 'center' && `- ${user.centerName}`}</div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
          >
            <LogoutIcon className="w-5 h-5" />
            Logout
          </button>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;