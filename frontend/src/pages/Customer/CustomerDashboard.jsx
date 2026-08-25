// pages/AdminDashboard.jsx
import React, { useState } from 'react';
import CustomerSidebar from '../../components/customer/Sidebar';
import MobileBottomNav from '../../components/customer/MobileBottomNav';
import Dashboard from '../../components/customer/Dashboard';
import CreateOrder from '../../components/customer/CreateOrder';
import MyOrders from '../../components/customer/MyOrders';
import FAQ from '../../components/customer/FAQ';
import TrackParcel from '../../components/customer/TrackParcel';
import Settings from '../../components/customer/Settings';
const CustomerDashboard = () => {
  const [activePage, setActivePage] = useState('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'createorder':
        return <CreateOrder />;
      case 'myorders':
        return <MyOrders />;
      case 'trackparcel':
        return <TrackParcel />;
      case 'profile':
        return <Settings />;
      case 'support':
        return <FAQ />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar - hidden on mobile */}
      <CustomerSidebar activePage={activePage} setActivePage={setActivePage} />
      
      {/* Main Content */}
      <main className="flex-1 ml-0  p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
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

export default CustomerDashboard;