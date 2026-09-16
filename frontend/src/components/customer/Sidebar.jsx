// components/AdminSidebar.jsx
import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Plus,
  Map,
  Settings,
  Package,
  LogOut,
} from 'lucide-react';
import { authService } from '../../services/authService';
import { socketService } from '../../services/socketService';

const CustomerSidebar = ({ activePage, setActivePage }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();

  // Grouped nav — logout lives inside the Account group, after Support.
  const navSections = [
    {
      label: 'Main',
      items: [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'createorder', icon: Plus, label: 'Create Order' },
        { id: 'myorders', icon: Package, label: 'My Orders' },
        { id: 'trackparcel', icon: Map, label: 'Track Parcel' },
      ],
    },
    {
      label: 'Account',
      items: [
        { id: 'profile', icon: Users, label: 'Profile' },
        { id: 'support', icon: Settings, label: 'Support' },
        // Logout is a nav item now, styled differently below.
        { id: 'logout', icon: LogOut, label: 'Logout', variant: 'danger' },
      ],
    },
  ];

  const handleLogout = useCallback(() => {
    try {
      socketService.disconnect();
    } catch {
      // best effort
    }
    authService.logout();
    setIsMobileOpen(false);
    navigate('/');
  }, [navigate]);

  const handleNavClick = (id) => {
    if (id === 'logout') {
      handleLogout();
      return;
    }
    setActivePage(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      <aside
        className={`
          fixed  left-0 bottom-0 z-40
          flex flex-col
          bg-slate-50 border-r border-slate-200
          transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:w-20 xl:w-64
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 lg:translate-x-0'}
        `}
      >
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.label} className="mb-4 last:mb-0">
              <div className="hidden xl:block px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {section.label}
              </div>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  const isDanger = item.variant === 'danger';

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`
                        group relative w-full flex items-center gap-3
                        px-3 py-2.5 rounded-lg
                        text-sm transition-colors
                        ${isDanger
                          ? 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                          : isActive
                            ? 'bg-blue-600 text-white font-medium shadow-sm shadow-blue-600/20'
                            : 'text-slate-600 hover:bg-white hover:text-slate-900'}
                      `}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="hidden xl:inline">{item.label}</span>

                      {/* Tooltip for collapsed mode */}
                      <span
                        className="
                          pointer-events-none absolute left-full ml-3 px-2 py-1
                          rounded-md bg-slate-900 text-white text-xs whitespace-nowrap
                          opacity-0 group-hover:opacity-100 transition-opacity
                          z-50 hidden lg:inline xl:hidden
                        "
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
};

export default CustomerSidebar;