// src/components/Layout.jsx
import React from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';
import NotificationSystem from './prescription/NotificationSystem';

const Layout = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-grow flex flex-col">
        {/* Header with Notifications */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-end">
            <NotificationSystem />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
