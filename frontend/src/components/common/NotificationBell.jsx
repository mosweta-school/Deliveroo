// frontend/src/components/common/NotificationBell.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, AlertCircle, Package, Truck, CheckCircle, MapPin } from 'lucide-react';
import { socketService } from '../../services/socketService';
import { notificationService } from '../../services/notificationService';

const NotificationBell = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications(pageNum, 20);
      
      if (response.success) {
        if (append) {
          setNotifications(prev => [...prev, ...response.notifications]);
        } else {
          setNotifications(response.notifications);
        }
        setHasMore(response.pagination.pages > pageNum);
        setPage(pageNum);
        setUnreadCount(response.unread_count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load more notifications
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1, true);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (!notifications.find(n => n.id === notificationId)?.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // Socket listener for new notifications
  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    fetchNotifications();

    // Listen for new notifications via socket
    const handleNewNotification = (data) => {
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    socketService.on('new_notification', handleNewNotification);

    // Fetch unread count periodically
    const interval = setInterval(async () => {
      try {
        const response = await notificationService.getUnreadCount();
        if (response.success) {
          setUnreadCount(response.unread_count);
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    }, 30000);

    // Click outside to close
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      socketService.off('new_notification');
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userId]);

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    const icons = {
      'parcel_created': <Package className="h-5 w-5 text-blue-500" />,
      'parcel_picked_up': <Truck className="h-5 w-5 text-amber-500" />,
      'parcel_in_transit': <Truck className="h-5 w-5 text-purple-500" />,
      'parcel_delivered': <CheckCircle className="h-5 w-5 text-green-500" />,
      'parcel_cancelled': <X className="h-5 w-5 text-red-500" />,
      'rider_assigned': <Truck className="h-5 w-5 text-blue-500" />,
      'destination_updated': <MapPin className="h-5 w-5 text-amber-500" />,
      'admin_alert': <AlertCircle className="h-5 w-5 text-red-500" />,
      'rider_status_update': <Truck className="h-5 w-5 text-blue-500" />
    };
    return icons[type] || <Bell className="h-5 w-5 text-slate-500" />;
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-96 max-h-[500px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white">
            <h4 className="font-semibold text-slate-900">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-xs font-medium text-blue-600">
                  ({unreadCount} unread)
                </span>
              )}
            </h4>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1.5 text-xs text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-[380px]">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 font-medium">No notifications</p>
                <p className="text-xs text-slate-400">You're all caught up!</p>
              </div>
            ) : (
              <>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${
                      !notification.is_read ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm ${!notification.is_read ? 'font-medium text-slate-900' : 'text-slate-700'}`}>
                            {notification.title}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="flex-shrink-0 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{notification.message}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-slate-400">
                            {formatTime(notification.created_at)}
                          </span>
                          {notification.parcel_id && (
                            <span className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                              Parcel
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Load More */}
                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="w-full py-2 text-center text-sm text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load more'}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-slate-200 bg-slate-50">
            <button
              onClick={() => {
                setIsOpen(false);
                // Navigate to notifications page
                const role = JSON.parse(localStorage.getItem('user') || '{}')?.role;
                if (role === 'admin') {
                  window.location.href = '/admin/notifications';
                } else if (role === 'driver') {
                  window.location.href = '/rider/notifications';
                } else {
                  window.location.href = '/customer/notifications';
                }
              }}
              className="w-full text-center text-xs text-slate-500 hover:text-blue-600 transition-colors"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;