// components/customer/MyOrders.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Eye, Edit, Trash2, Search, X, Check, AlertTriangle,
  MapPin, Package, Calendar, Clock, User, Phone, DollarSign,
  Shield, Truck, Filter, Plus, RefreshCw, Receipt, Banknote,
  CreditCard, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { customerService } from '../../services/customerService';

// ============================================================
// Helpers
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
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(status)}`}>
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

const formatShortDate = (iso) => {
  if (!iso) return 'N/A';
  try {
    return new Date(iso).toLocaleDateString('en-KE', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

const formatPrice = (price) => {
  if (price == null) return 'N/A';
  return `KSh ${Number(price).toLocaleString()}`;
};

const truncateRoute = (parcel, len = 18) => {
  const p = (parcel?.pickup_location?.address || '').trim();
  const d = (parcel?.destination?.address || '').trim();
  const cut = (s) => (s.length <= len ? s : s.slice(0, len).trimEnd() + '…');
  if (!p && !d) return '—';
  return `${cut(p) || '—'} → ${cut(d) || '—'}`;
};

const userOwnsOrder = (order, user) =>
  !!(user && order && order.user_id === user.id);

const canModifyOrder = (order, user) => {
  const owns = userOwnsOrder(order, user);
  const active = order && order.status !== 'Delivered' && order.status !== 'Cancelled';
  return owns && active;
};

const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// ============================================================
// MODAL — module-scoped, responsive padding
// ============================================================
const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="flex items-center justify-center min-h-screen px-3 sm:px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>
        <div
          className={`inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full ${maxWidth} relative z-50`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white px-4 sm:px-6 pt-5 sm:pt-6 pb-4">
            <div className="flex items-center justify-between mb-4 gap-3">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100 flex-shrink-0"
                aria-label="Close"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
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
// SKELETONS
// ============================================================
const TableSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    {/* Desktop */}
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {['Tracking #', 'Route', 'Receiver', 'Status', 'Date', 'Amount', 'Actions'].map((h) => (
              <th
                key={h}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {[1, 2, 3, 4, 5].map((i) => (
            <tr key={i}>
              {[1, 2, 3, 4, 5, 6, 7].map((c) => (
                <td key={c} className="px-6 py-4">
                  <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {/* Mobile */}
    <div className="md:hidden divide-y divide-gray-200">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 space-y-3">
          <div className="flex justify-between">
            <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
            <div className="h-6 w-20 bg-slate-200 rounded-full animate-pulse" />
          </div>
          <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
          <div className="flex justify-between">
            <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="h-9 w-full bg-slate-200 rounded-lg animate-pulse" />
        </div>
      ))}
    </div>
  </div>
);

// ============================================================
// PAGINATION — shared between desktop and mobile
// ============================================================
const Pagination = ({ page, pages, total, perPage, loading, onChange }) => {
  if (total === 0) return null;

  const window = [];
  if (pages <= 7) {
    for (let i = 1; i <= pages; i++) window.push(i);
  } else {
    window.push(1);
    if (page > 3) window.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) {
      window.push(i);
    }
    if (page < pages - 2) window.push('…');
    window.push(pages);
  }

  const first = (page - 1) * perPage + 1;
  const last = Math.min(page * perPage, total);

  return (
    <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1">
        Showing <span className="font-medium text-gray-700">{first}</span> to{' '}
        <span className="font-medium text-gray-700">{last}</span> of{' '}
        <span className="font-medium text-gray-700">{total}</span> orders
      </p>
      <div className="flex items-center gap-1 order-1 sm:order-2">
        <button
          onClick={() => onChange(Math.max(page - 1, 1))}
          disabled={page === 1 || loading}
          className="p-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {window.map((p, idx) =>
          p === '…' ? (
            <span key={`gap-${idx}`} className="px-1.5 text-gray-400 text-sm">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              disabled={loading}
              className={`min-w-[36px] px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                page === p
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onChange(Math.min(page + 1, pages))}
          disabled={page === pages || loading}
          className="p-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// ============================================================
// MY ORDERS
// ============================================================
const MyOrders = ({ onNavigate }) => {
  const currentUser = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }, []);

  // ---- Data ----
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  // ---- Filters ----
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // ---- Load state ----
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // ---- Modals ----
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editDestination, setEditDestination] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const mountedRef = useRef(true);

  const goTo = useCallback(
    (tab) => {
      if (typeof onNavigate === 'function') onNavigate(tab);
    },
    [onNavigate]
  );

  // ---- Debounce search ----
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ---- Fetch orders ----
  const fetchOrders = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const res = await customerService.getOrders({
          page,
          perPage: PER_PAGE,
          status: statusFilter,
          q: debouncedSearch,
        });
        if (!mountedRef.current) return;
        if (res.success) {
          setOrders(res.orders || []);
          setTotal(res.total || 0);
          setPages(res.pages || 1);
        } else {
          setError(res.error || 'Failed to load orders');
        }
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err.message || 'Failed to load orders');
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [page, statusFilter, debouncedSearch]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch]);

  // ---- Details ----
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

  // ---- Edit destination ----
  const openEditModal = useCallback((order) => {
    setSelectedOrder(order);
    setEditDestination(order.destination?.address || '');
    setEditError(null);
    setShowEditModal(true);
  }, []);

  const handleSaveDestination = useCallback(async () => {
    if (!selectedOrder) return;
    const address = (editDestination || '').trim();
    if (!address) {
      setEditError('Please enter a valid destination');
      return;
    }

    setEditLoading(true);
    setEditError(null);
    try {
      const res = await customerService.updateDestination(selectedOrder.id, {
        address,
        city: selectedOrder.destination?.city || '',
        county: selectedOrder.destination?.county || '',
        latitude: selectedOrder.destination?.latitude ?? null,
        longitude: selectedOrder.destination?.longitude ?? null,
      });
      if (res.success) {
        toast.success('Destination updated successfully');
        setShowEditModal(false);
        await fetchOrders({ silent: true });
      } else {
        setEditError(res.error || 'Failed to update destination');
      }
    } catch (err) {
      setEditError(err.message || 'Failed to update destination');
    } finally {
      setEditLoading(false);
    }
  }, [selectedOrder, editDestination, fetchOrders]);

  // ---- Cancel order ----
  const openCancelModal = useCallback((order) => {
    setSelectedOrder(order);
    setShowCancelModal(true);
  }, []);

  const handleConfirmCancel = useCallback(async () => {
    if (!selectedOrder) return;
    setCancelLoading(true);
    try {
      const res = await customerService.cancelOrder(selectedOrder.id);
      if (res.success) {
        toast.success('Order cancelled successfully');
        setShowCancelModal(false);
        await fetchOrders({ silent: true });
      } else {
        toast.error(res.error || 'Failed to cancel order');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to cancel order');
    } finally {
      setCancelLoading(false);
    }
  }, [selectedOrder, fetchOrders]);

  // ---- Stats ----
  const stats = React.useMemo(() => {
    const inTransit = orders.filter(
      (o) => o.status === 'In Transit' || o.status === 'Picked Up'
    ).length;
    const delivered = orders.filter((o) => o.status === 'Delivered').length;
    const pending = orders.filter((o) => o.status === 'Pending').length;
    return { inTransit, delivered, pending };
  }, [orders]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto pb-24 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
            My Orders
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Track and manage all your delivery orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchOrders({ silent: true })}
            disabled={refreshing}
            className="p-2.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 flex-shrink-0"
            title="Refresh"
          >
            <RefreshCw
              className={`h-4 w-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`}
            />
          </button>
          <button
            onClick={() => goTo('createorder')}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-200"
          >
            <Plus className="h-4 w-4" />
            New Order
          </button>
        </div>
      </div>

      {/* Stats — 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-lg font-bold text-gray-800">{total}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500">In Transit</p>
          <p className="text-lg font-bold text-blue-600">{stats.inTransit}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500">Delivered</p>
          <p className="text-lg font-bold text-green-600">{stats.delivered}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-lg font-bold text-yellow-600">{stats.pending}</p>
        </div>
      </div>

      {/* Filters — stack on mobile, side by side on sm+ */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tracking #, sender, receiver…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:flex-none px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Picked Up">Picked Up</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setStatusFilter('all');
            }}
            className="px-3 sm:px-4 py-2.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm text-gray-600 flex-shrink-0"
            title="Reset filters"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={() => fetchOrders()}
            className="text-xs text-red-600 hover:underline flex-shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Content */}
      {loading && orders.length === 0 ? (
        <TableSkeleton />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* ---------- Desktop table (md+) ---------- */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tracking #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receiver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => {
                  const canModify = canModifyOrder(order, currentUser);
                  const owns = userOwnsOrder(order, currentUser);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm font-medium text-gray-900 whitespace-nowrap">
                        {order.tracking_number || order.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {truncateRoute(order)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {order.receiver_name || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {formatPrice(order.price)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewDetails(order)}
                            className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canModify ? (
                            <>
                              <button
                                onClick={() => openEditModal(order)}
                                className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-600 transition-colors"
                                title="Edit destination"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openCancelModal(order)}
                                className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                                title="Cancel order"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <span
                              className="p-1.5 text-gray-300"
                              title={
                                !owns
                                  ? 'Only the sender can modify this order'
                                  : order.status === 'Delivered'
                                    ? 'Order already delivered'
                                    : order.status === 'Cancelled'
                                      ? 'Order already cancelled'
                                      : 'Not modifiable'
                              }
                            >
                              <Shield className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ---------- Mobile cards (< md) ---------- */}
          <div className="md:hidden divide-y divide-gray-200">
            {orders.map((order) => {
              const canModify = canModifyOrder(order, currentUser);
              const owns = userOwnsOrder(order, currentUser);
              return (
                <div key={order.id} className="p-4 space-y-3">
                  {/* Top row: tracking + status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm font-semibold text-gray-900 truncate">
                        {order.tracking_number || order.id}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatShortDate(order.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  {/* Route */}
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-700 break-words line-clamp-2">
                        {order.pickup_location?.address || '—'}
                        <span className="text-gray-300 mx-1">→</span>
                        {order.destination?.address || '—'}
                      </p>
                    </div>
                  </div>

                  {/* Receiver + Amount */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-semibold flex-shrink-0">
                        {getInitials(order.receiver_name)}
                      </div>
                      <span className="text-sm text-gray-600 truncate">
                        {order.receiver_name || '—'}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {formatPrice(order.price)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleViewDetails(order)}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>
                    {canModify ? (
                      <>
                        <button
                          onClick={() => openEditModal(order)}
                          className="flex-1 px-3 py-2 bg-amber-50 text-amber-600 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => openCancelModal(order)}
                          className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center"
                          aria-label="Cancel order"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <div
                        className="flex-1 px-3 py-2 bg-gray-50 text-gray-400 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5"
                        title={
                          !owns
                            ? 'Only the sender can modify this order'
                            : order.status === 'Delivered'
                              ? 'Order already delivered'
                              : order.status === 'Cancelled'
                                ? 'Order already cancelled'
                                : 'Not modifiable'
                        }
                      >
                        <Shield className="h-3.5 w-3.5" />
                        Locked
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {orders.length === 0 && !loading && (
            <div className="text-center py-12 px-4">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No orders found</p>
              <p className="text-sm text-gray-400 mt-1">
                {debouncedSearch || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first delivery order to see it here'}
              </p>
              {!debouncedSearch && statusFilter === 'all' && (
                <button
                  onClick={() => goTo('createorder')}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Create Order
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          <Pagination
            page={page}
            pages={pages}
            total={total}
            perPage={PER_PAGE}
            loading={loading}
            onChange={setPage}
          />
        </div>
      )}

      {/* ============================================================
          DETAILS MODAL
         ============================================================ */}
      <Modal
        isOpen={showDetailsModal}
        onClose={closeDetails}
        title="Order Details"
        maxWidth="max-w-3xl"
      >
        {detailLoading && (
          <div className="space-y-4 py-4">
            <div className="h-6 w-40 bg-slate-200 rounded animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
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
          <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-200">
              <div className="min-w-0">
                <p className="text-sm text-gray-500">Tracking Number</p>
                <p className="font-mono font-semibold text-gray-900 text-base sm:text-lg truncate">
                  {orderDetail.tracking_number || orderDetail.id}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={orderDetail.status} />
                {userOwnsOrder(orderDetail, currentUser) && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    Your Order
                  </span>
                )}
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">Pickup Location</p>
                    <p className="font-medium text-gray-900 break-words">
                      {orderDetail.pickup_location?.address || 'N/A'}
                    </p>
                    {orderDetail.pickup_location?.street_address && (
                      <p className="text-xs text-gray-500 mt-0.5 break-words">
                        {orderDetail.pickup_location.street_address}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">Destination</p>
                    <p className="font-medium text-gray-900 break-words">
                      {orderDetail.destination?.address || 'N/A'}
                    </p>
                    {orderDetail.destination?.street_address && (
                      <p className="text-xs text-gray-500 mt-0.5 break-words">
                        {orderDetail.destination.street_address}
                      </p>
                    )}
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
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-medium text-gray-900">
                      {formatPrice(orderDetail.price)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">Sender</p>
                    <p className="font-medium text-gray-900 break-words">
                      {orderDetail.sender_name || orderDetail.user?.full_name || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">Receiver</p>
                    <p className="font-medium text-gray-900 break-words">
                      {orderDetail.receiver_name || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">Receiver Phone</p>
                    <p className="font-medium text-gray-900 break-words">
                      {orderDetail.receiver_phone || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(orderDetail.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment section */}
            {(orderDetail.payment_method || orderDetail.price > 0) && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  Payment
                </h4>
                <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total</span>
                    <span className="font-medium text-slate-900">
                      {formatPrice(orderDetail.price)}
                    </span>
                  </div>
                  {orderDetail.payment_method === 'cod' ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Banknote className="h-3.5 w-3.5" />
                          Method
                        </span>
                        <span className="font-medium text-slate-900">
                          Cash on Delivery
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Due on delivery</span>
                        <span className="font-semibold text-slate-900">
                          {formatPrice(orderDetail.amount_due ?? orderDetail.price)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">
                          Deposit{' '}
                          {orderDetail.deposit_percent === 100
                            ? '(full)'
                            : `(${orderDetail.deposit_percent ?? 40}%)`}
                        </span>
                        <span className="font-medium text-slate-900">
                          {formatPrice(orderDetail.deposit_amount ?? 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Balance on delivery</span>
                        <span className="font-medium text-slate-900">
                          {formatPrice(orderDetail.amount_due ?? 0)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-200">
                        <span className="text-slate-500">Status</span>
                        {orderDetail.is_deposit_paid ? (
                          <span className="inline-flex items-center gap-1 text-green-700 font-medium">
                            <Check className="h-3.5 w-3.5" />
                            Deposit paid
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium">
                            Payment pending
                          </span>
                        )}
                      </div>
                      {orderDetail.is_deposit_paid &&
                        orderDetail.payments?.length > 0 &&
                        (() => {
                          const p = orderDetail.payments.find(
                            (x) => x.type === 'deposit' && x.status === 'completed'
                          );
                          if (!p?.mpesa_receipt) return null;
                          return (
                            <div className="flex justify-between pt-1 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Receipt className="h-3 w-3" />
                                Receipt
                              </span>
                              <span className="font-mono">{p.mpesa_receipt}</span>
                            </div>
                          );
                        })()}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Tracking history */}
            {orderDetail.status_history?.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Tracking History
                </h4>
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {orderDetail.status_history.map((event, index) => (
                    <div key={event.id || index} className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <div
                          className={`h-3 w-3 rounded-full mt-1 ${
                            index === 0
                              ? 'bg-blue-600'
                              : orderDetail.status === 'Delivered'
                                ? 'bg-green-600'
                                : 'bg-gray-300'
                          }`}
                        />
                        {index < orderDetail.status_history.length - 1 && (
                          <div className="absolute top-3 left-1.5 h-8 w-0.5 bg-gray-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">{event.status}</p>
                        {event.remarks && (
                          <p className="text-sm text-gray-500 break-words">
                            {event.remarks}
                          </p>
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

            {/* Actions */}
            {canModifyOrder(orderDetail, currentUser) && (
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    closeDetails();
                    openEditModal(orderDetail);
                  }}
                  className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Destination
                </button>
                <button
                  onClick={() => {
                    closeDetails();
                    openCancelModal(orderDetail);
                  }}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Cancel Order
                </button>
              </div>
            )}

            {!canModifyOrder(orderDetail, currentUser) && (
              <div className="pt-4 border-t border-gray-200 space-y-2">
                {!userOwnsOrder(orderDetail, currentUser) && (
                  <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2 text-sm text-gray-500">
                    <Shield className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    You cannot modify this order because you are not the sender.
                  </div>
                )}
                {orderDetail.status === 'Delivered' && (
                  <div className="p-3 bg-green-50 rounded-lg flex items-center gap-2 text-sm text-green-700">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    This order has already been delivered.
                  </div>
                )}
                {orderDetail.status === 'Cancelled' && (
                  <div className="p-3 bg-red-50 rounded-lg flex items-center gap-2 text-sm text-red-700">
                    <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    This order has been cancelled.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ============================================================
          EDIT DESTINATION MODAL
         ============================================================ */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditError(null);
        }}
        title="Edit Destination"
        maxWidth="max-w-md"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                You can only change the destination if the parcel hasn't been
                delivered yet.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Destination
              </label>
              <p className="text-gray-900 font-medium p-2 bg-gray-50 rounded-lg break-words">
                {selectedOrder.destination?.address || 'N/A'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Destination <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editDestination}
                onChange={(e) => setEditDestination(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Enter new destination"
              />
              {editError && (
                <p className="text-sm text-red-600 mt-1">{editError}</p>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditError(null);
                }}
                disabled={editLoading}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDestination}
                disabled={editLoading}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {editLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ============================================================
          CANCEL ORDER MODAL
         ============================================================ */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Order"
        maxWidth="max-w-md"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-red-800">Are you sure?</p>
                <p className="text-sm text-red-700">
                  This action cannot be undone. This will permanently cancel
                  order{' '}
                  <span className="font-mono font-semibold">
                    {selectedOrder.tracking_number || selectedOrder.id}
                  </span>
                  .
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <p className="text-sm text-gray-600 break-words">
                <span className="font-medium">Route:</span>{' '}
                {truncateRoute(selectedOrder, 40)}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Status:</span>{' '}
                {selectedOrder.status}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Amount:</span>{' '}
                {formatPrice(selectedOrder.price)}
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelLoading}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Keep Order
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancelLoading}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {cancelLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Cancelling…
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Yes, Cancel Order
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyOrders;