// components/customer/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Eye, X, MapPin, Package, User, Phone, DollarSign,
  Calendar, Clock, RefreshCw, AlertCircle, Plus,
  Check, Truck,
} from 'lucide-react';
import { customerService } from '../../services/customerService';

// ============================================================
// Tunables
// ============================================================
// How many characters of each address to show in the recent-orders
// table before truncating with an ellipsis. Applies per side
// (pickup and destination are each truncated to this length).
const ADDRESS_TRUNCATE_LEN = 18;

// ============================================================
// Helpers
// ============================================================
const truncate = (str, len) => {
  if (str == null) return '';
  const s = String(str).trim();
  if (s.length <= len) return s;
  return s.slice(0, len).trimEnd() + '…';
};

const formatRoute = (parcel) => {
  const pickup = truncate(parcel?.pickup_location?.address, ADDRESS_TRUNCATE_LEN);
  const dest = truncate(parcel?.destination?.address, ADDRESS_TRUNCATE_LEN);
  if (!pickup && !dest) return '—';
  if (!pickup) return `— → ${dest}`;
  if (!dest) return `${pickup} → —`;
  return `${pickup} → ${dest}`;
};

// ============================================================
// MODAL — module-scoped
// ============================================================
const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={handleBackdropClick}>
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div
          className={`inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full ${maxWidth} relative z-50`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// SKELETON
// ============================================================
const DashboardSkeleton = () => (
  <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
    <div className="mb-8">
      <div className="h-8 w-64 bg-slate-200 rounded animate-pulse mb-2" />
      <div className="h-4 w-96 bg-slate-200 rounded animate-pulse" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mb-2" />
          <div className="h-8 w-16 bg-slate-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-grow bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="h-6 w-48 bg-slate-200 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 items-center">
              <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      <div className="w-full lg:w-1/3 bg-slate-200 rounded-lg animate-pulse h-48" />
    </div>
  </div>
);

// ============================================================
// Presentation helpers
// ============================================================
const getStatusColor = (status) => {
  const colors = {
    'Delivered': 'bg-green-100 text-green-700',
    'In Transit': 'bg-blue-100 text-blue-700',
    'Pending': 'bg-yellow-100 text-yellow-700',
    'Cancelled': 'bg-red-100 text-red-700',
    'Picked Up': 'bg-purple-100 text-purple-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

const getStatusIcon = (status) => {
  const icons = {
    'Delivered': <Check className="h-3 w-3" />,
    'In Transit': <Clock className="h-3 w-3" />,
    'Pending': <Package className="h-3 w-3" />,
    'Cancelled': <X className="h-3 w-3" />,
    'Picked Up': <Truck className="h-3 w-3" />,
  };
  return icons[status] || null;
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
    {getStatusIcon(status)}
    {status}
  </span>
);

const formatDate = (iso) => {
  if (!iso) return 'N/A';
  try {
    return new Date(iso).toLocaleDateString('en-KE', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return 'N/A';
  }
};

const formatPrice = (price) => {
  if (price == null) return 'N/A';
  return `KSh ${Number(price).toLocaleString()}`;
};

// ============================================================
// DASHBOARD
// ============================================================
const Dashboard = ({ onNavigate }) => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // Prefer the shell's nav callback when present; fall back to no-op
  // so the component is still usable standalone.
  const goTo = useCallback(
    (tab) => {
      if (typeof onNavigate === 'function') onNavigate(tab);
    },
    [onNavigate]
  );

  const fetchDashboard = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await customerService.getDashboard(10);
      if (data.success) setDashboard(data);
      else setError(data.error || 'Failed to load dashboard');
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleViewDetails = useCallback(async (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
    setOrderDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const res = await customerService.getOrder(order.id);
      if (res.success) setOrderDetail(res.order);
      else setDetailError(res.error || 'Failed to load order details');
    } catch (err) {
      setDetailError(err.message || 'Failed to load order details');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetails = useCallback(() => {
    setShowDetailsModal(false);
    setSelectedOrder(null);
    setOrderDetail(null);
    setDetailError(null);
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error && !dashboard) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-red-800 mb-1">Couldn't load your dashboard</h2>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <button
            onClick={() => fetchDashboard()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  const user = dashboard?.user;
  const stats = dashboard?.stats || {};
  const recentOrders = dashboard?.recent_orders || [];
  const totalSpent = stats.total_revenue ?? 0;

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome back, {user?.first_name || 'there'}
          </h1>
          <p className="text-gray-500">
            Track, manage, and dispatch local courier deliveries in real-time.
          </p>
        </div>
        <button
          onClick={() => fetchDashboard({ silent: true })}
          disabled={refreshing}
          className="self-start inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Orders</p>
          <h2 className="text-3xl font-bold text-gray-800">{stats.total_orders ?? 0}</h2>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Active Deliveries</p>
          <h2 className="text-3xl font-bold text-blue-600">{stats.active_orders ?? 0}</h2>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Completed</p>
          <h2 className="text-3xl font-bold text-green-600">{stats.completed_orders ?? 0}</h2>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Spent</p>
          <h2 className="text-3xl font-bold text-purple-600">{formatPrice(totalSpent)}</h2>
        </div>
      </section>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Recent Orders */}
        <section className="flex-grow min-w-0 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Recent Delivery Orders</h3>
            <button
              onClick={() => goTo('myorders')}
              className="text-blue-600 text-sm hover:underline"
            >
              View all
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-14 w-14 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No orders yet</p>
              <p className="text-sm text-gray-400 mb-4">
                Create your first delivery order to see it here.
              </p>
              <button
                onClick={() => goTo('createorder')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Order
              </button>
            </div>
          ) : (
            <>
              {/* Desktop table — horizontal scroll when narrow */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="text-gray-400 border-b">
                      <th className="pb-2 font-medium">Tracking #</th>
                      <th className="pb-2 font-medium">Route</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Amount</th>
                      <th className="pb-2 font-medium text-center">View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="py-3 font-mono text-sm font-medium text-gray-700 whitespace-nowrap">
                          {order.tracking_number || order.id}
                        </td>
                        <td
                          className="py-3 text-gray-600 text-sm whitespace-nowrap"
                          title={`${order.pickup_location?.address || '—'} → ${order.destination?.address || '—'}`}
                        >
                          {formatRoute(order)}
                        </td>
                        <td className="py-3">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="py-3 text-gray-500 text-sm whitespace-nowrap">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="py-3 text-sm font-medium text-gray-800 whitespace-nowrap">
                          {formatPrice(order.price)}
                        </td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => handleViewDetails(order)}
                            className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-sm font-medium text-gray-700">
                        {order.tracking_number || order.id}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {formatRoute(order)}
                    </p>
                    <div className="flex justify-between text-sm text-gray-500 mb-3">
                      <span>{formatDate(order.created_at)}</span>
                      <span className="font-medium text-gray-700">{formatPrice(order.price)}</span>
                    </div>
                    <button
                      onClick={() => handleViewDetails(order)}
                      className="w-full px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye className="h-3 w-3" /> View
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Request Courier panel — now navigates to Create Order */}
        <section className="w-full lg:w-1/3 bg-slate-800 text-white p-6 rounded-lg shadow-md flex flex-col justify-center">
          <h3 className="text-xl font-semibold mb-2">Request Courier</h3>
          <p className="text-slate-300 text-sm mb-6">
            Send packages instantly with our verified fleet.
          </p>
          <div className="flex items-center justify-between text-sm text-slate-400 mb-6">
            <span>Pickup</span>
            <span className="flex-grow border-t border-dashed border-slate-500 mx-2"></span>
            <span>Delivery</span>
          </div>
          <button
            onClick={() => goTo('createorder')}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded transition-colors"
          >
            New Delivery Order
          </button>
        </section>
      </div>

      {/* Details modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={closeDetails}
        title="Order Details"
        maxWidth="max-w-3xl"
      >
        {detailLoading && (
          <div className="space-y-4 py-4">
            <div className="h-6 w-40 bg-slate-200 rounded animate-pulse" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i}>
                  <div className="h-3 w-20 bg-slate-200 rounded animate-pulse mb-1" />
                  <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        )}

        {!detailLoading && detailError && (
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-700">{detailError}</p>
                <button
                  onClick={() => selectedOrder && handleViewDetails(selectedOrder)}
                  className="mt-2 text-xs text-red-600 hover:underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {!detailLoading && !detailError && orderDetail && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-200">
              <div>
                <p className="text-sm text-gray-500">Tracking Number</p>
                <p className="font-mono font-semibold text-gray-900">
                  {orderDetail.tracking_number || orderDetail.id}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={orderDetail.status} />
                {user?.id && orderDetail.user_id === user.id && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    Your Order
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">Pickup Location</p>
                    <p className="font-medium text-gray-900 break-words">
                      {orderDetail.pickup_location?.address || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">Destination</p>
                    <p className="font-medium text-gray-900 break-words">
                      {orderDetail.destination?.address || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Package className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Weight</p>
                    <p className="font-medium text-gray-900">
                      {orderDetail.weight ? `${orderDetail.weight} kg` : 'N/A'}
                      {orderDetail.weight_category ? ` · ${orderDetail.weight_category}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <DollarSign className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="font-medium text-gray-900">{formatPrice(orderDetail.price)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Sender</p>
                    <p className="font-medium text-gray-900">
                      {orderDetail.sender_name || orderDetail.user?.full_name || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Receiver</p>
                    <p className="font-medium text-gray-900">
                      {orderDetail.receiver_name || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Receiver Phone</p>
                    <p className="font-medium text-gray-900">
                      {orderDetail.receiver_phone || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(orderDetail.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {orderDetail.status_history?.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Tracking History</h4>
                <div className="space-y-3">
                  {orderDetail.status_history.map((event, index) => (
                    <div key={event.id || index} className="flex items-start gap-3">
                      <div className="relative">
                        <div className={`h-3 w-3 rounded-full mt-1 ${
                          index === 0
                            ? 'bg-blue-600'
                            : orderDetail.status === 'Delivered'
                              ? 'bg-green-600'
                              : 'bg-gray-300'
                        }`} />
                        {index < orderDetail.status_history.length - 1 && (
                          <div className="absolute top-3 left-1.5 h-8 w-0.5 bg-gray-300" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{event.status}</p>
                        {event.remarks && (
                          <p className="text-sm text-gray-500">{event.remarks}</p>
                        )}
                        <p className="text-xs text-gray-400">
                          {formatDate(event.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200 flex items-center justify-between text-sm">
              <span className="text-gray-500">Need to change this order?</span>
              <button
                onClick={() => {
                  closeDetails();
                  goTo('myorders');
                }}
                className="text-blue-600 hover:underline font-medium"
              >
                Manage in My Orders
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;