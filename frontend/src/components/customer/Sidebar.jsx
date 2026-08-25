// components/AdminSidebar.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Truck, 
  Users,
  Plus, 
  Map, 
  BarChart3, 
  Settings,
  Package,
  LogOut,
  Menu,
  X
} from 'lucide-react';

const CustomerSidebar = ({ activePage, setActivePage }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'createorder', icon: Plus, label: 'Create Order' },
    { id: 'myorders', icon: Package, label: 'My Orders' },
    { id: 'trackparcel', icon: Map, label: 'Track Parcel' },
    { id: 'profile', icon: Users, label: 'Profile' },
    { id: 'support', icon: Settings, label: 'Support' }
  ];

  const handleLogout = () => {
    // Clear auth tokens, logout logic
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Hamburger */}
      

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-white border-r border-slate-200 z-40
        transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:w-20 xl:w-64
        ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 lg:translate-x-0'}
      `}>
        {/* Brand */}
        

        {/* User Profile */}
        

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  setIsMobileOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-50 text-blue-600 font-medium' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="hidden xl:inline text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-slate-200 p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className="hidden xl:inline text-sm font-medium">Logout</span>
          </button>
        </div>
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-200">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
            JM
          </div>
          <div className="hidden xl:block flex-1">
            <div className="text-sm font-medium text-slate-900">James Mwangi</div>
            <div className="text-xs text-slate-500">JamesMwangi@gmail.com</div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
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