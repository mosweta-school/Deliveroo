// components/Navbar.jsx
import React, { useState, useEffect } from 'react';
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
  UserCircle
} from 'lucide-react';

const Navbar = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('Home');
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Mock user data - replace with actual auth state
  useEffect(() => {
    // Check if user is logged in (from localStorage or context)
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (token && userData) {
      setIsLoggedIn(true);
      setUser(userData);
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }

    // Update current page based on route
    const path = location.pathname;
    if (path === '/') setCurrentPage('Home');
    else if (path === '/about') setCurrentPage('About');
    else if (path === '/contact') setCurrentPage('Contact');
    else if (path.includes('/dashboard')) setCurrentPage('Dashboard');
    else if (path.includes('/orders')) setCurrentPage('My Orders');
    else if (path.includes('/tracking')) setCurrentPage('Track Parcel');
    else if (path.includes('/profile')) setCurrentPage('Profile');
    else if (path.includes('/users')) setCurrentPage('Users');
    else if (path.includes('/drivers')) setCurrentPage('Drivers');
    else if (path.includes('/analytics')) setCurrentPage('Analytics');
    else if (path.includes('/settings')) setCurrentPage('Settings');
    else setCurrentPage(path.split('/').pop() || 'Home');
  }, [location]);

  // Navigation items for logged out users
  const publicNavItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'About', path: '/about', icon: Info },
    { label: 'Contact', path: '/contact', icon: Phone }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    navigate('/');
    setIsMobileOpen(false);
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  // Mock notifications
  const notifications = [
    { id: 1, message: 'Parcel #SEND-1023 has been delivered', time: '2 min ago', read: false },
    { id: 2, message: 'Parcel #SEND-0987 is in transit', time: '14 min ago', read: false },
    { id: 3, message: 'New parcel created #SEND-1124', time: '32 min ago', read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
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
                    className="text-slate-600 hover:text-blue-600 font-medium transition-colors"
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
                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              </>
            ) : (
              // Logged In Navigation
              <>
                {/* Current Page Name */}
                <span className="text-slate-900 font-medium">
                  {currentPage}
                </span>

                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={handleNotificationClick}
                    className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
                      <div className="p-3 border-b border-slate-200">
                        <h4 className="font-medium text-slate-900">Notifications</h4>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                              !notification.read ? 'bg-blue-50/50' : ''
                            }`}
                          >
                            <p className="text-sm text-slate-800">{notification.message}</p>
                            <p className="text-xs text-slate-500 mt-1">{notification.time}</p>
                          </div>
                        ))}
                      </div>
                      <div className="p-2 border-t border-slate-200">
                        <button className="w-full text-center text-sm text-blue-600 hover:underline">
                          View all notifications
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Profile */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm ring-2 ring-blue-100">
                      {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </div>
                    <span className="text-sm font-medium text-slate-900 hidden lg:block">
                      {user?.name || 'User'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-sm border-t border-slate-200">
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
                    className="block w-full px-4 py-2 text-center bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
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
                    {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{user?.name || 'User'}</p>
                    <p className="text-xs text-slate-500">{user?.email || ''}</p>
                  </div>
                </div>

                {/* Current Page */}
                <div className="px-3 py-2 text-sm font-medium text-slate-900 bg-slate-50 rounded-lg">
                  {currentPage}
                </div>

                {/* Notifications in Mobile */}
                <div className="px-3 py-2 flex items-center justify-between hover:bg-slate-50 rounded-lg transition-colors">
                  <span className="text-slate-600">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                      {unreadCount}
                    </span>
                  )}
                </div>

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