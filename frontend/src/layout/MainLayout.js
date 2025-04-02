// src/layout/MainLayout.js
import React from 'react';
import { Sidebar, Navbar } from '../design-system';
import { useAuth } from '../context/AuthContext';

const MainLayout = ({ children, title = "Dashboard" }) => {
  const { user, logout, getPlanDetails } = useAuth();
  const planDetails = getPlanDetails ? getPlanDetails() : null;
  
  return (
    <div className="flex h-screen bg-bg-light">
      {/* Sidebar premium */}
      <Sidebar 
        user={user} 
        planDetails={planDetails}
        onLogout={logout}
      />
      
      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar premium */}
        <Navbar 
          title={title}
          userProfile={user}
          onLogout={logout}
        />
        
        {/* Conteúdo da página */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;