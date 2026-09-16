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
  Settings,
  LayoutDashboard,
  Package,
  Truck as TruckIcon,
  MapPin,
  BarChart3,
  Users,
  ChevronDown,
  Shield,
} from 'lucide-react';
import { authService } from '../../services/authService';
import { socketService } from '../../services/socketService';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connected');

  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const mountedRef = useRef(true);
  const authCheckedRef = useRef(false);
  const socketConnectedRef = useRef(false);

  const navigate = useNavigate();
  const location = useLocation();

  // ----------------------------------------------------------------
  // Nav items — used ONLY inside the user dropdown now.
  // The Navbar itself no longer renders inline nav for logged-in users;
  // the Sidebar (customer/admin) and bottom nav (mobile) own navigation.
  // ----------------------------------------------------------------
  const getNavItems = useCallback(() => {
    if (!user) return [];
    const role = user.role || 'customer';

    switch (role) {
      case 'admin':
        return [
          { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
          { label: 'Orders', path: '/admin/orders', icon: Package },
          { label: 'Users', path: '/admin/users', icon: Users },
          { label: 'Drivers', path: '/admin/drivers', icon: TruckIcon },
          { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
          { label: 'Notifications', path: '/admin/notifications', icon: Bell },
          { label: 'Settings', path: '/admin/settings', icon: Settings },
        ];
      case 'driver':
        return [
          { label: 'Dashboard', path: '/rider', icon: LayoutDashboard },
          { label: 'Notifications', path: '/rider/notifications', icon: Bell },
          { label: 'Profile', path: '/rider/profile', icon: User },
          { label: 'Settings', path: '/rider/settings', icon: Settings },
        ];
      case 'customer':
      default:
        return [
          { label: 'Dashboard', path: '/customer', icon: LayoutDashboard },
          { label: 'Create Order', path: '/customer/createorder', icon: Package },
          { label: 'My Orders', path: '/customer/myorders', icon: Package },
          { label: 'Track Parcel', path: '/customer/trackparcel', icon: MapPin },
          { label: 'Notifications', path: '/customer/notifications', icon: Bell },
          { label: 'Profile', path: '/customer/profile', icon: User },
          { label: 'Support', path: '/customer/support', icon: Info },
        ];
    }
  }, [user]);

  // ----------------------------------------------------------------
  // Auth
  // ----------------------------------------------------------------
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

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    checkAuth();

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

  // ----------------------------------------------------------------
  // Socket — connected lazily, off the login critical path.
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!isLoggedIn || !user) {
      if (socketConnectedRef.current) {
        socketService.disconnect();
        socketConnectedRef.current = false;
      }
      return;
    }

    // Delay 500ms so the socket handshake doesn't compete with the
    // first page's data fetches. Missed pushes in that window are
    // caught by the reconnect handler / dropdown-open refetch.
    const connectTimer = setTimeout(() => {
      if (!socketConnectedRef.current) {
        socketService.connect();
        socketConnectedRef.current = true;
      }
    }, 500);

    const interval = setInterval(() => {
      setConnectionStatus(socketService.isConnected() ? 'connected' : 'disconnected');
    }, 3000);

    return () => {
      clearTimeout(connectTimer);
      clearInterval(interval);
    };
  }, [isLoggedIn, user]);

  // ----------------------------------------------------------------
  // Click-outside handlers
  // ----------------------------------------------------------------
  useEffect(() => {
    const handler = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if (
        isMobileOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setIsMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isMobileOpen]);

  // ----------------------------------------------------------------
  // Actions
  // ----------------------------------------------------------------
  const handleLogout = useCallback(() => {
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

  const handleNavigation = useCallback(
    (path) => {
      navigate(path);
      setIsMobileOpen(false);
      setShowUserMenu(false);
    },
    [navigate]
  );

  // ----------------------------------------------------------------
  // Display helpers
  // ----------------------------------------------------------------
  const getUserInitials = useCallback(() => {
    if (!user) return 'U';
    const name = user.full_name || user.name || '';
    const fromName = name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    return fromName || user.email?.[0]?.toUpperCase() || 'U';
  }, [user]);

  const getUserDisplayName = useCallback(() => {
    if (!user) return 'User';
    return user.full_name || user.name || user.email?.split('@')[0] || 'User';
  }, [user]);

  const getUserRoleDisplay = useCallback(() => {
    if (!user) return '';
    const roleMap = { admin: 'Administrator', driver: 'Rider', customer: 'Customer' };
    return roleMap[user.role] || user.role || 'User';
  }, [user]);

  const publicNavItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'About', path: '/about', icon: Info },
    { label: 'Contact', path: '/contact', icon: Phone },
  ];

  // ----------------------------------------------------------------
  // Loading skeleton
  // ----------------------------------------------------------------
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

          {/* Right side */}
          <div className="flex items-center gap-4">
            {!isLoggedIn ? (
              // ---------- Public ----------
              <div className="hidden md:flex items-center gap-8">
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
              </div>
            ) : (
              // ---------- Logged in: bell + identity + dropdown ----------
              <div className="flex items-center gap-3">
                {/* Notification bell */}
                {user && <NotificationBell userId={user.id} />}

                {/* Connection dot (subtle, hidden on small screens) */}
                <div
                  className="hidden sm:flex items-center gap-1.5"
                  title={connectionStatus === 'connected' ? 'Live' : 'Offline'}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                </div>

                {/* User menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 hover:bg-slate-50 rounded-lg px-2 py-1.5 transition-colors"
                    aria-label="User menu"
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm ring-2 ring-blue-100">
                      {getUserInitials()}
                    </div>
                    <span className="text-sm font-medium text-slate-900 hidden md:block">
                      {getUserDisplayName()}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform ${
                        showUserMenu ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                            {getUserInitials()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                              {getUserDisplayName()}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                            <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full mt-0.5">
                              <Shield className="h-2.5 w-2.5" />
                              {getUserRoleDisplay()}
                            </span>
                          </div>
                        </div>
                      </div>

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

                      <div className="border-t border-slate-200" />

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
              </div>
            )}

            
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden bg-white/95 backdrop-blur-sm border-t border-slate-200 max-h-[calc(100vh-64px)] overflow-y-auto"
        >
          <div className="px-4 py-3 space-y-2">
            {!isLoggedIn ? (
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
              <>
                {/* Identity */}
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
                  <span
                    className={`w-2 h-2 rounded-full ${
                      connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                </div>

                {/* Nav items */}
                {getNavItems().map((item) => (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={`block px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors ${
                      location.pathname === item.path
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-600'
                    }`}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </span>
                  </Link>
                ))}

                <div className="border-t border-slate-200 my-2" />

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