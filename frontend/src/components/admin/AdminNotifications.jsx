// frontend/src/components/admin/AdminNotifications.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Package, Truck, Users, Settings, AlertCircle } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { socketService } from '../../services/socketService';
import NotificationItem from '../common/NotificationItem';
import NotificationFilters from '../common/NotificationFilters';

const AdminNotifications = () => {
  // State
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [perPage] = useState(20);
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await notificationService.getNotifications(
        pageNum, 
        perPage, 
        unreadOnly
      );

      if (response.success) {
        if (append) {
          setNotifications(prev => [...prev, ...response.notifications]);
        } else {
          setNotifications(response.notifications);
        }
        setTotalPages(response.pagination.pages);
        setTotalCount(response.pagination.total);
        setUnreadCount(response.unread_count || 0);
        setPage(pageNum);
      } else {
        setError('Failed to load notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [perPage, unreadOnly]);

  // Load more
  const loadMore = useCallback(() => {
    if (!loadingMore && page < totalPages) {
      fetchNotifications(page + 1, true);
    }
  }, [loadingMore, page, totalPages, fetchNotifications]);

  // Mark notification as read
  const handleMarkRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  // Mark all as read
  const handleMarkAllRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, []);

  // Delete notification
  const handleDelete = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      const deleted = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setTotalCount(prev => prev - 1);
      if (!deleted?.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [notifications]);

  // Delete all
  const handleDeleteAll = useCallback(async () => {
    if (!confirm('Are you sure you want to delete all notifications?')) return;
    
    try {
      await notificationService.deleteAllNotifications();
      setNotifications([]);
      setTotalCount(0);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error deleting all notifications:', err);
    }
  }, []);

  // Handle new notification from socket
  useEffect(() => {
    const handleNewNotification = (data) => {
      setNotifications(prev => [data, ...prev]);
      setTotalCount(prev => prev + 1);
      setUnreadCount(prev => prev + 1);
    };

    socketService.on('new_notification', handleNewNotification);

    return () => {
      socketService.off('new_notification');
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    // Search filter
    const matchesSearch = 
      notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Type filter
    let matchesType = true;
    if (filterType !== 'all') {
      switch (filterType) {
        case 'parcel':
          matchesType = notification.type?.startsWith('parcel_') || notification.type === 'destination_updated';
          break;
        case 'rider':
          matchesType = notification.type?.startsWith('rider_') || notification.type === 'rider_assigned';
          break;
        case 'admin':
          matchesType = notification.type === 'admin_alert';
          break;
        case 'system':
          matchesType = notification.type === 'test' || notification.type === 'system';
          break;
        default:
          matchesType = true;
      }
    }
    
    return matchesSearch && matchesType;
  });

  // Stats for filters
  const stats = {
    total: totalCount,
    unread: unreadCount,
    filtered: filteredNotifications.length
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-3">
            <Bell className="h-6 w-6 text-blue-600" />
            Notifications
            {unreadCount > 0 && (
              <span className="text-sm font-normal text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Stay updated with all your delivery activities
          </p>
        </div>
      </div>

      {/* Filters */}
      <NotificationFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterType={filterType}
        onFilterChange={setFilterType}
        unreadOnly={unreadOnly}
        onUnreadOnlyChange={setUnreadOnly}
        onMarkAllRead={handleMarkAllRead}
        onDeleteAll={handleDeleteAll}
        totalCount={totalCount}
        unreadCount={unreadCount}
      />

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">No notifications</h3>
            <p className="text-sm text-slate-500 mt-1">
              {searchTerm || filterType !== 'all' || unreadOnly
                ? 'Try adjusting your filters'
                : 'You\'re all caught up!'}
            </p>
            {(searchTerm || filterType !== 'all' || unreadOnly) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setUnreadOnly(false);
                }}
                className="mt-4 text-sm text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Unread count banner */}
            {unreadCount > 0 && (
              <div className="px-4 py-2 bg-blue-50/50 border-b border-blue-100">
                <p className="text-sm text-blue-700 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* Notifications */}
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
                showActions={true}
              />
            ))}

            {/* Load More */}
            {page < totalPages && (
              <div className="p-4 text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      Loading...
                    </span>
                  ) : (
                    'Load more'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;