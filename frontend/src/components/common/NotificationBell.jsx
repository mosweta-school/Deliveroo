// frontend/src/components/common/NotificationBell.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell, X, CheckCheck, AlertCircle, Package, Truck,
  CheckCircle, MapPin, RefreshCw, Wifi, WifiOff,
} from 'lucide-react';
import { socketService } from '../../services/socketService';
import { notificationService } from '../../services/notificationService';

const NotificationBell = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const mountedRef = useRef(true);

  // ============================================================
  // Data fetching
  // ============================================================
  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    if (!mountedRef.current) return;
    try {
      setLoading(true);
      setError(null);
      const response = await notificationService.getNotifications(pageNum, 20);

      if (!mountedRef.current) return;

      if (response.success) {
        setNotifications((prev) =>
          append ? [...prev, ...response.notifications] : response.notifications
        );
        setHasMore(response.pagination.pages > pageNum);
        setPage(pageNum);
        setUnreadCount(response.unread_count || 0);
      } else {
        setError('Failed to load notifications');
      }
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success && mountedRef.current) {
        setUnreadCount(response.unread_count);
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, []);

  // ============================================================
  // Actions
  // ============================================================
  const markAsRead = useCallback(async (notificationId) => {
    // Optimistic UI: flip the flag immediately, roll back on failure.
    const previous = notifications;
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await notificationService.markAsRead(notificationId);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      if (mountedRef.current) {
        setNotifications(previous);
        setUnreadCount((prev) => prev + 1);
      }
    }
  }, [notifications]);

  const markAllAsRead = useCallback(async () => {
    const previous = notifications;
    const previousUnread = unreadCount;

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      if (mountedRef.current) {
        setNotifications(previous);
        setUnreadCount(previousUnread);
      }
    }
  }, [notifications, unreadCount]);

  const deleteNotification = useCallback(async (notificationId) => {
    const target = notifications.find((n) => n.id === notificationId);
    const previous = notifications;
    const previousUnread = unreadCount;

    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    if (target && !target.is_read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await notificationService.deleteNotification(notificationId);
    } catch (err) {
      console.error('Failed to delete notification:', err);
      if (mountedRef.current) {
        setNotifications(previous);
        setUnreadCount(previousUnread);
      }
    }
  }, [notifications, unreadCount]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) fetchNotifications(page + 1, true);
  }, [loading, hasMore, page, fetchNotifications]);

  // ============================================================
  // Socket wiring: push for changes, fetch for truth
  // ============================================================
  useEffect(() => {
    if (!userId) return;

    mountedRef.current = true;

    // 1. Seed the badge from the server
    fetchNotifications(1, false);

    // 2. Live pushes from the server
    const handleNewNotification = (data) => {
      if (!mountedRef.current) return;
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socketService.on('new_notification', handleNewNotification);

    // 3. Catch-up after any disconnect. While the socket was down we may
    //    have missed pushes, so do ONE fetch to reconcile.
    const handleReconnect = () => {
      if (!mountedRef.current) return;
      fetchNotifications(1, false);
    };
    socketService.on('socket_reconnected', handleReconnect);

    // 4. Track connection state so the UI can show "Offline" if needed
    const interval = setInterval(() => {
      if (mountedRef.current) {
        setIsConnected(socketService.isConnected());
      }
    }, 3000);

    return () => {
      mountedRef.current = false;
      socketService.off('new_notification');
      socketService.off('socket_reconnected');
      clearInterval(interval);
    };
  }, [userId, fetchNotifications]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        buttonRef.current && !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reconcile on open (freshness on demand)
  const handleBellClick = useCallback(() => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening) {
      // Cheap: one request, only when the user actually looks.
      fetchUnreadCount();
    }
  }, [isOpen, fetchUnreadCount]);

  // ============================================================
  // Presentation helpers
  // ============================================================
  const getNotificationIcon = (type) => {
    const icons = {
      parcel_created: <Package className="h-5 w-5 text-blue-500" />,
      parcel_picked_up: <Truck className="h-5 w-5 text-amber-500" />,
      parcel_in_transit: <Truck className="h-5 w-5 text-purple-500" />,
      parcel_delivered: <CheckCircle className="h-5 w-5 text-green-500" />,
      parcel_cancelled: <X className="h-5 w-5 text-red-500" />,
      rider_assigned: <Truck className="h-5 w-5 text-blue-500" />,
      destination_updated: <MapPin className="h-5 w-5 text-amber-500" />,
      admin_alert: <AlertCircle className="h-5 w-5 text-red-500" />,
      rider_status_update: <Truck className="h-5 w-5 text-blue-500" />,
    };
    return icons[type] || <Bell className="h-5 w-5 text-slate-500" />;
  };

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

  const handleViewAll = () => {
    setIsOpen(false);
    const role = JSON.parse(localStorage.getItem('user') || '{}')?.role;
    const path =
      role === 'admin'
        ? '/admin/notifications'
        : role === 'driver'
          ? '/rider/notifications'
          : '/customer/notifications';
    window.location.href = path;
  };

  return (
    <div className="relative">
      {/* Bell */}
      <button
        ref={buttonRef}
        onClick={handleBellClick}
        className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
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
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-900">Notifications</h4>
              {unreadCount > 0 && (
                <span className="text-xs font-medium text-blue-600">
                  ({unreadCount} unread)
                </span>
              )}
              {/* Connection status dot */}
              <span
                className="flex items-center"
                title={isConnected ? 'Live' : 'Reconnecting…'}
              >
                {isConnected ? (
                  <Wifi className="h-3 w-3 text-green-500" />
                ) : (
                  <WifiOff className="h-3 w-3 text-slate-400" />
                )}
              </span>
            </div>
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

          {/* List */}
          <div className="overflow-y-auto max-h-[380px]">
            {loading && notifications.length === 0 ? (
              <div className="p-3 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-5 h-5 bg-slate-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600 mb-3">{error}</p>
                <button
                  onClick={() => fetchNotifications(1, false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </button>
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
                      !notification.is_read
                        ? 'bg-blue-50/50 border-l-4 border-l-blue-500'
                        : ''
                    }`}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm ${
                              !notification.is_read
                                ? 'font-medium text-slate-900'
                                : 'text-slate-700'
                            }`}
                          >
                            {notification.title}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="flex-shrink-0 text-slate-400 hover:text-red-500 transition-colors"
                            aria-label="Delete notification"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {notification.message}
                        </p>
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
              onClick={handleViewAll}
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