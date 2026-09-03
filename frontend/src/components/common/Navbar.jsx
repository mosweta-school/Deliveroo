// frontend/src/components/common/Navbar.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Truck, 
  Menu, 
  X, 
  Bell, 
  User,
  LogOut,
  Home,
  Info,
  Phone,
  UserCircle,
  Settings,
  LayoutDashboard,
  Package,
  Truck as TruckIcon,
  MapPin,
  BarChart3,
  Users,
  ChevronDown,
  Shield,
  AlertCircle
} from 'lucide-react';
import { authService } from '../../services/authService';
import { socketService } from '../../services/socketService';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  // State
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('Home');
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  
  // Refs
  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const mountedRef = useRef(true);
  const authCheckedRef = useRef(false);
  const socketConnectedRef = useRef(false);

  const navigate = useNavigate();
  const location = useLocation();

  // --- FIX: Memoize getNavItems ---
  const getNavItems = useCallback(() => {
    if (!user) return [];

    const role = user.role || 'customer';
    const items = [];

    switch (role) {
      case 'admin':
        items.push(
          { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
          { label: 'Orders', path: '/admin/orders', icon: Package },
          { label: 'Users', path: '/admin/users', icon: Users },
          { label: 'Drivers', path: '/admin/drivers', icon: TruckIcon },
          { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
          { label: 'Notifications', path: '/admin/notifications', icon: Bell },
          { label: 'Settings', path: '/admin/settings', icon: Settings }
        );
        break;
      case 'driver':
        items.push(
          { label: 'Dashboard', path: '/rider', icon: LayoutDashboard },
          { label: 'Notifications', path: '/rider/notifications', icon: Bell },
          { label: 'Profile', path: '/rider/profile', icon: User },
          { label: 'Settings', path: '/rider/settings', icon: Settings }
        );
        break;
      case 'customer':
      default:
        items.push(
          { label: 'Dashboard', path: '/customer', icon: LayoutDashboard },
          { label: 'My Orders', path: '/customer/orders', icon: Package },
          { label: 'Track Parcel', path: '/customer/track', icon: MapPin },
          { label: 'Notifications', path: '/customer/notifications', icon: Bell },
          { label: 'Profile', path: '/customer/profile', icon: User },
          { label: 'Settings', path: '/customer/settings', icon: Settings }
        );
        break;
    }
    return items;
  }, [user]);

  // --- FIX: Stable checkAuth function ---
  const checkAuth = useCallback(() => {
    if (authCheckedRef.current) return;
    
    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user') || 'null');
      
      if (token && userData) {
        setIsLoggedIn(true);
        setUser(userData);
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsLoggedIn(false);
      setUser(null);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        authCheckedRef.current = true;
      }
    }
  }, []);

  // --- FIX: Handle scroll effect with cleanup ---
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- FIX: Update current page based on route ---
  useEffect(() => {
    const path = location.pathname;
    const pageMap = {
      '/': 'Home',
      '/about': 'About',
      '/contact': 'Contact',
      '/login': 'Login',
      '/register': 'Register',
      '/forgotpassword': 'Forgot Password',
      '/admin': 'Dashboard',
      '/admin/orders': 'Orders',
      '/admin/users': 'Users',
      '/admin/drivers': 'Drivers',
      '/admin/analytics': 'Analytics',
      '/admin/notifications': 'Notifications',
      '/admin/settings': 'Settings',
      '/customer': 'Dashboard',
      '/customer/orders': 'My Orders',
      '/customer/track': 'Track Parcel',
      '/customer/notifications': 'Notifications',
      '/customer/profile': 'Profile',
      '/customer/settings': 'Settings',
      '/rider': 'Rider Dashboard',
      '/rider/notifications': 'Notifications',
      '/rider/profile': 'Profile',
      '/rider/settings': 'Settings'
    };
    
    let found = false;
    for (const [route, page] of Object.entries(pageMap)) {
      if (path === route || path.startsWith(route + '/')) {
        setCurrentPage(page);
        found = true;
        break;
      }
    }
    if (!found) {
      setCurrentPage(path.split('/').pop() || 'Home');
    }
  }, [location.pathname]);

  // --- FIX: Initialize auth and socket with proper dependencies ---
  useEffect(() => {
    mountedRef.current = true;
    
    // Check auth once on mount
    checkAuth();

    // Listen for auth changes
    const handleAuthChange = () => {
      authCheckedRef.current = false;
      checkAuth();
    };

    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'user') {
        authCheckedRef.current = false;
        checkAuth();
      }
    };

    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      mountedRef.current = false;
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuth]);

  // --- FIX: Socket connection with proper cleanup ---
  useEffect(() => {
    if (!isLoggedIn || !user) {
      // Disconnect if logged out
      if (socketConnectedRef.current) {
        socketService.disconnect();
        socketConnectedRef.current = false;
      }
      return;
    }

    // Only connect once
    if (!socketConnectedRef.current) {
      socketService.connect();
      socketConnectedRef.current = true;
    }

    // Check connection status periodically
    const interval = setInterval(() => {
      setConnectionStatus(socketService.isConnected() ? 'connected' : 'disconnected');
    }, 3000);

    return () => {
      clearInterval(interval);
      // Don't disconnect on unmount if still logged in
    };
  }, [isLoggedIn, user]);

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

  // Handle click outside mobile menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileOpen]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      socketService.disconnect();
      socketConnectedRef.current = false;
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      setIsLoggedIn(false);
      setUser(null);
      setShowUserMenu(false);
      setIsMobileOpen(false);
      authCheckedRef.current = false;
      
      window.dispatchEvent(new Event('authChange'));
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsLoggedIn(false);
      setUser(null);
      navigate('/');
    }
  }, [navigate]);

  // Handle navigation
  const handleNavigation = useCallback((path) => {
    navigate(path);
    setIsMobileOpen(false);
    setShowUserMenu(false);
  }, [navigate]);

  // Get user initials
  const getUserInitials = useCallback(() => {
    if (!user) return 'U';
    const name = user.full_name || user.name || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }, [user]);

  // Get user display name
  const getUserDisplayName = useCallback(() => {
    if (!user) return 'User';
    return user.full_name || user.name || user.email?.split('@')[0] || 'User';
  }, [user]);

  // Get user role display
  const getUserRoleDisplay = useCallback(() => {
    if (!user) return '';
    const roleMap = {
      'admin': 'Administrator',
      'driver': 'Rider',
      'customer': 'Customer'
    };
    return roleMap[user.role] || user.role || 'User';
  }, [user]);

  // Navigation items for logged out users
  const publicNavItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'About', path: '/about', icon: Info },
    { label: 'Contact', path: '/contact', icon: Phone }
  ];

  // If loading, show minimal navbar
  if (isLoading) {
    return (
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <Truck className="h-8 w-8 text-blue-600" />
              <span className="font-bold text-xl text-blue-600 hidden sm:inline">Deliveroo</span>
            </Link>
            <div className="animate-pulse flex items-center gap-4">
              <div className="h-8 w-8 bg-slate-200 rounded-full" />
              <div className="h-8 w-24 bg-slate-200 rounded-lg hidden md:block" />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav 
      className={`
        bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50 
        transition-shadow duration-300
        ${isScrolled ? 'shadow-md' : ''}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
            aria-label="Home"
          >
            <Truck className="h-8 w-8 text-blue-600" />
            <span className="font-bold text-xl text-blue-600 hidden sm:inline">Deliveroo</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {!isLoggedIn ? (
              // Public Navigation
              <>
                {publicNavItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={`text-slate-600 hover:text-blue-600 font-medium transition-colors ${
                      location.pathname === item.path ? 'text-blue-600' : ''
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="flex items-center gap-3 ml-4">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm shadow-blue-200"
                  >
                    Sign Up
                  </Link>
                </div>
              </>
            ) : (
              // Logged In Navigation
              <>
                {/* Navigation Links */}
                {getNavItems().slice(0, 3).map((item) => (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={`text-slate-600 hover:text-blue-600 font-medium transition-colors ${
                      location.pathname === item.path ? 'text-blue-600' : ''
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}

                {/* Notification Bell */}
                {user && <NotificationBell userId={user.id} />}

                {/* Connection Status */}
                <div className="flex items-center gap-1">
                  <div className={`
                    w-2 h-2 rounded-full animate-pulse
                    ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}
                  `} />
                  <span className="text-xs text-slate-400 hidden xl:inline">
                    {connectionStatus === 'connected' ? 'Live' : 'Offline'}
                  </span>
                </div>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 hover:bg-slate-50 rounded-lg px-2 py-1.5 transition-colors"
                    aria-label="User menu"
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm ring-2 ring-blue-100">
                      {getUserInitials()}
                    </div>
                    <span className="text-sm font-medium text-slate-900 hidden lg:block">
                      {getUserDisplayName()}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* User Dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
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

                      {/* Navigation Links */}
                      <div className="py-1">
                        {getNavItems().map((item) => (
                          <button
                            key={item.label}
                            onClick={() => handleNavigation(item.path)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <item.icon className="h-4 w-4 text-slate-400" />
                            {item.label}
                          </button>
                        ))}
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
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileOpen && (
        <div 
          ref={mobileMenuRef}
          className="md:hidden bg-white/95 backdrop-blur-sm border-t border-slate-200 max-h-[calc(100vh-64px)] overflow-y-auto"
        >
          <div className="px-4 py-3 space-y-2">
            {!isLoggedIn ? (
              // Public Mobile Navigation
              <>
                {publicNavItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.path}
                    className="block px-3 py-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </span>
                  </Link>
                ))}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <Link
                    to="/login"
                    className="block w-full px-4 py-2 text-center text-blue-600 font-medium border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    onClick={() => setIsMobileOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block w-full px-4 py-2 text-center bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    onClick={() => setIsMobileOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              </>
            ) : (
              // Logged In Mobile Navigation
              <>
                {/* User Info */}
                <div className="flex items-center gap-3 px-3 py-3 bg-blue-50 rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                    {getUserInitials()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    <span className="text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">
                      {getUserRoleDisplay()}
                    </span>
                  </div>
                  {/* Connection Status */}
                  <div className="flex items-center gap-1">
                    <div className={`
                      w-2 h-2 rounded-full animate-pulse
                      ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}
                    `} />
                  </div>
                </div>

                {/* Current Page */}
                <div className="px-3 py-2 text-sm font-medium text-slate-900 bg-slate-50 rounded-lg">
                  {currentPage}
                </div>

                {/* Navigation Links */}
                {getNavItems().map((item) => (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={`block px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors ${
                      location.pathname === item.path ? 'bg-blue-50 text-blue-600' : 'text-slate-600'
                    }`}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </span>
                  </Link>
                ))}

                {/* Divider */}
                <div className="border-t border-slate-200 my-2" />

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-3"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;