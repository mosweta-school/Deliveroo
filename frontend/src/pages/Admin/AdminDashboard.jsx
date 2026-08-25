// pages/AdminDashboard.jsx
import React, { useState } from 'react';
import AdminSidebar from '../../components/admin/Sidebar';
import MobileBottomNav from '../../components/admin/MobileBottomNav';
import Dashboard from '../../components/admin/Dashboard';
import Orders from '../../components/admin/Orders';
import Users from '../../components/admin/Users';
import Drivers from '../../components/admin/Drivers';
import Analytics from '../../components/admin/Analytics';
import Settings from '../../components/admin/Settings';

const AdminDashboard = () => {
  const [activePage, setActivePage] = useState('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'orders':
        return <Orders />;
      case 'users':
        return <Users />;
      case 'drivers':
        return <Drivers />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar - hidden on mobile */}
      <AdminSidebar activePage={activePage} setActivePage={setActivePage} />
      
      {/* Main Content */}
      <main className="flex-1 ml-0 p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
        {renderPage()}
      </main>
      
      {/* Mobile Bottom Navigation - visible only on mobile */}
      <MobileBottomNav 
        activePage={activePage} 
        setActivePage={setActivePage}
        role="admin"
      />
    </div>
  );
};

export default AdminDashboard;