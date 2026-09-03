// frontend/src/components/admin/Sidebar.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Truck, 
  Users,
  Bell, 
  Map, 
  BarChart3, 
  Settings,
  Package,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronDown,
  User,
  Home,
  Info,
  Phone
} from 'lucide-react';
import { authService } from '../../services/authService';
import { socketService } from '../../services/socketService';
import { notificationService } from '../../services/notificationService';

const AdminSidebar = ({ activePage, setActivePage }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const mountedRef = useRef(true);
  const userMenuRef = useRef(null);

  // Navigation items
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { id: 'orders', icon: Truck, label: 'Orders', path: '/admin/orders' },
    { id: 'users', icon: Users, label: 'Users', path: '/admin/users' },
    { id: 'drivers', icon: Map, label: 'Drivers', path: '/admin/drivers' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
    { id: 'notifications', icon: Bell, label: 'Notifications', path: '/admin/notifications' },
    { id: 'settings', icon: Settings, label: 'Settings', path: '/admin/settings' }
  ];

  // Get user data
  const fetchUser = useCallback(() => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || 'null');
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.unread_count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  // Listen for new notifications
  useEffect(() => {
    const handleNewNotification = () => {
      setUnreadCount(prev => prev + 1);
    };

    socketService.on('new_notification', handleNewNotification);

    return () => {
      socketService.off('new_notification');
    };
  }, []);

  // Initial data fetch
  useEffect(() => {
    mountedRef.current = true;
    fetchUser();
    fetchUnreadCount();

    // Check connection status
    const interval = setInterval(() => {
      setConnectionStatus(socketService.isConnected() ? 'connected' : 'disconnected');
    }, 3000);

    // Listen for auth changes
    const handleAuthChange = () => {
      fetchUser();
      fetchUnreadCount();
    };

    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('storage', (e) => {
      if (e.key === 'user') {
        fetchUser();
      }
    });

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [fetchUser, fetchUnreadCount]);

  // Handle click outside user menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle navigation
  const handleNavigation = (item) => {
    setActivePage(item.id);
    navigate(item.path);
    setIsMobileOpen(false);
    setShowUserMenu(false);
  };

  // Handle logout
  const handleLogout = () => {
    authService.logout();
    navigate('/login');
    setIsMobileOpen(false);
    setShowUserMenu(false);
  };

  // Get user initials
  const getUserInitials = () => {
    if (!user) return 'U';
    const name = user.full_name || user.name || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return 'User';
    return user.full_name || user.name || user.email?.split('@')[0] || 'User';
  };

  // Get user role display
  const getUserRoleDisplay = () => {
    if (!user) return '';
    const roleMap = {
      'admin': 'Administrator',
      'driver': 'Rider',
      'customer': 'Customer'
    };
    return roleMap[user?.role] || user?.role || 'User';
  };

  if (isLoading) {
    return (
      <aside className="fixed top-0 left-0 h-full bg-white border-r border-slate-200 z-40 w-64">
        <div className="flex items-center gap-3 px-4 py-6 border-b border-slate-200">
          <div className="h-8 w-8 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-10 bg-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Mobile Hamburger */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-slate-200"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-white border-r border-slate-200 z-40
        transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:w-20 xl:w-64
        ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 lg:translate-x-0'}
        flex flex-col
      `}>
       

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id || location.pathname === item.path;
            const isNotifications = item.id === 'notifications';
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 relative
                  ${isActive 
                    ? 'bg-blue-50 text-blue-600 font-medium' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="hidden xl:inline text-sm flex-1 text-left">{item.label}</span>
                
                {/* Unread badge for notifications */}
                {isNotifications && unreadCount > 0 && (
                  <span className={`
                    hidden xl:inline-flex items-center justify-center
                    bg-red-500 text-white text-[10px] font-bold rounded-full
                    min-w-[20px] h-5 px-1.5
                    ${isActive ? 'bg-red-500' : 'bg-red-500'}
                  `}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
                
                {/* Mobile badge */}
                {isNotifications && unreadCount > 0 && (
                  <span className={`
                    xl:hidden absolute -top-0.5 -right-0.5
                    bg-red-500 text-white text-[8px] font-bold rounded-full
                    min-w-[16px] h-4 px-1 flex items-center justify-center
                  `}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Menu Dropdown (Mobile friendly) */}
        <div className="border-t border-slate-200 p-4 flex-shrink-0 relative" ref={userMenuRef}>
          {/* User info - always visible */}
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs flex-shrink-0">
              {getUserInitials()}
            </div>
            <div className="hidden xl:block flex-1 text-left">
              <div className="text-sm font-medium text-slate-900 truncate">
                {getUserDisplayName()}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {user?.email}
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* User Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                    {getUserInitials()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {user?.email}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full mt-0.5">
                      <Shield className="h-2.5 w-2.5" />
                      {getUserRoleDisplay()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="py-1">
                <button
                  onClick={() => {
                    navigate('/admin/profile');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User className="h-4 w-4 text-slate-400" />
                  Profile
                </button>
                <button
                  onClick={() => {
                    navigate('/admin/settings');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  Settings
                </button>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-200" />

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
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

export default AdminSidebar;