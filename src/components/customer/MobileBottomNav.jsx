// components/MobileBottomNav.jsx
import React from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Map, 
  BarChart3, 
  Settings,
  Home,
  Package,
  User,
  Plus,
  Navigation
} from 'lucide-react';

const MobileBottomNav = ({ activePage, setActivePage, role }) => {

  // Customer navigation items
  const customerNavItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'createorder', icon: Plus, label: 'Create Order' },
    { id: 'myorders', icon: Package, label: 'My Orders' },
    { id: 'trackparcel', icon: Navigation, label: 'Track' },
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'support', icon: Settings, label: 'Support' }
  ];

  const navItems = role === 'customer' ? customerNavItems : customerNavItems;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`
                flex flex-col items-center justify-center flex-1 h-full
                transition-all duration-200 relative
                ${isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}
              `}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-blue-600 rounded-full" />
              )}
              
              {/* Icon */}
              <Icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''}`} />
              
              {/* Label */}
              <span className={`text-[10px] mt-0.5 font-medium ${isActive ? 'text-blue-600' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;