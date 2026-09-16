// pages/Customer/CustomerDashboard.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import CustomerSidebar from '../../components/customer/Sidebar';
import MobileBottomNav from '../../components/customer/MobileBottomNav';
import Dashboard from '../../components/customer/Dashboard';
import CreateOrder from '../../components/customer/CreateOrder';
import MyOrders from '../../components/customer/MyOrders';
import TrackParcel from '../../components/customer/TrackParcel';
import Settings from '../../components/customer/Settings';
import FAQ from '../../components/customer/FAQ';

// URL ↔ tab mapping. Adding a new tab = one line in each map.
const PATH_TO_TAB = {
  '/customer':            'dashboard',
  '/customer/':           'dashboard',
  '/customer/dashboard':  'dashboard',
  '/customer/createorder':'createorder',
  '/customer/myorders':   'myorders',
  '/customer/trackparcel':'trackparcel',
  '/customer/profile':    'profile',
  '/customer/support':    'support',
};

const TAB_TO_PATH = {
  dashboard:   '/customer',
  createorder: '/customer/createorder',
  myorders:    '/customer/myorders',
  trackparcel: '/customer/trackparcel',
  profile:     '/customer/profile',
  support:     '/customer/support',
};

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Derived, not stored — no drift between URL and UI.
  const activePage = PATH_TO_TAB[location.pathname] || 'dashboard';

  // Contract preserved: Sidebar / MobileBottomNav / Dashboard all call
  // setActivePage('tab'), so this stays a plain function of one string.
  const setActivePage = (tab) => {
    navigate(TAB_TO_PATH[tab] || '/customer');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':    return <Dashboard onNavigate={setActivePage} />;
      case 'createorder':  return <CreateOrder />;
      case 'myorders':     return <MyOrders />;
      case 'trackparcel':  return <TrackParcel />;
      case 'profile':      return <Settings />;
      case 'support':      return <FAQ />;
      default:             return <Dashboard onNavigate={setActivePage} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <CustomerSidebar activePage={activePage} setActivePage={setActivePage} />
      <main className="flex-1 ml-0 p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
        {renderPage()}
      </main>
      <MobileBottomNav
        activePage={activePage}
        setActivePage={setActivePage}
        role="customer"
      />
    </div>
  );
};

export default CustomerDashboard;