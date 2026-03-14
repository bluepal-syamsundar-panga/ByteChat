import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Sidebar from '../components/Sidebar/Sidebar';

const MainLayout = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-slack-appBg w-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
