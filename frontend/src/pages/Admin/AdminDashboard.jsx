// frontend/src/pages/Admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/Sidebar';
import MobileBottomNav from '../../components/admin/MobileBottomNav';
import Dashboard from '../../components/admin/Dashboard';
import Orders from '../../components/admin/Orders';
import Users from '../../components/admin/Users';
import Drivers from '../../components/admin/Drivers';
import Analytics from '../../components/admin/Analytics';
import Settings from '../../components/admin/Settings';
import { authService } from '../../services/authService';

const AdminDashboard = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated and is admin
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    const user = authService.getCurrentUser();
    if (user?.role !== 'admin') {
      navigate('/customer');
      return;
    }

    setLoading(false);
  }, [navigate]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar activePage={activePage} setActivePage={setActivePage} />
      
      <main className="flex-1 ml-0 p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
        {renderPage()}
      </main>
      
      <MobileBottomNav 
        activePage={activePage} 
        setActivePage={setActivePage}
        role="admin"
      />
    </div>
  );
};

export default AdminDashboard;