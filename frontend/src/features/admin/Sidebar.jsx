// components/Sidebar.jsx
import React from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Map, 
  BarChart3, 
  Settings,
  Package
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { id: 1, icon: LayoutDashboard, label: 'Dashboard', active: true },
    { id: 2, icon: Truck, label: 'Orders' },
    { id: 3, icon: Users, label: 'Users' },
    { id: 4, icon: Map, label: 'Drivers' },
    { id: 5, icon: BarChart3, label: 'Analytics' },
    { id: 6, icon: Settings, label: 'Settings' }
  ];

  return (
    <aside className="hidden md:flex md:flex-col md:w-20 lg:w-64 bg-white border-r border-slate-200 h-screen sticky top-0 overflow-y-auto">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-6 border-b border-slate-200">
        <Truck className="h-8 w-8 text-blue-600 flex-shrink-0" />
        <span className="hidden lg:inline font-bold text-xl text-blue-600">Deliveroo</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <a
            key={item.id}
            href="#"
            className={`
              flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200
              ${item.active 
                ? 'bg-blue-50 text-blue-600 font-medium' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }
            `}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className="hidden lg:inline text-sm">{item.label}</span>
          </a>
        ))}
      </nav>

      {/* User Profile */}
      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
            JM
          </div>
          <div className="hidden lg:block">
            <div className="text-sm font-medium text-slate-900">James Mwangi</div>
            <div className="text-xs text-slate-500">Admin</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;