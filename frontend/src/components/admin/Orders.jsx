// frontend/src/components/admin/Orders.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, Filter, Eye, Edit, Trash2, Package, Plus, RefreshCw, X,
  User, MapPin, Calendar, DollarSign, AlertTriangle, Check, Truck, UserCheck, AlertCircle,
  ChevronLeft, ChevronRight, Phone, Mail, Map
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import CreateOrder from './CreateOrder';
import DeliveryMap from '../maps/DeliveryMap';
import UpdateLocationModal from './UpdateLocationModal';

// Skeleton Loader Component
const OrdersSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse"></div>
        <div className="flex gap-2">
          <div className="h-10 w-10 bg-slate-200 rounded-lg animate-pulse"></div>
          <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-3 rounded-lg border border-slate-200">
            <div className="h-4 w-20 bg-slate-200 rounded animate-pulse mb-2"></div>
            <div className="h-8 w-16 bg-slate-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 h-10 bg-slate-200 rounded-lg animate-pulse"></div>
        <div className="h-10 w-40 bg-slate-200 rounded-lg animate-pulse"></div>
        <div className="h-10 w-24 bg-slate-200 rounded-lg animate-pulse"></div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <th key={i} className="px-6 py-3">
                    <div className="h-4 w-16 bg-slate-200 rounded animate-pulse"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b">
                  <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div></td>
                  <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-200 rounded animate-pulse"></div></td>
                  <td className="px-6 py-4"><div className="h-4 w-28 bg-slate-200 rounded animate-pulse"></div></td>
                  <td className="px-6 py-4"><div className="h-4 w-40 bg-slate-200 rounded animate-pulse"></div></td>
                  <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-200 rounded-full animate-pulse"></div></td>
                  <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div></td>
                  <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-200 rounded animate-pulse"></div></td>
                  <td className="px-6 py-4"><div className="flex gap-1 justify-end"><div className="h-8 w-8 bg-slate-200 rounded-lg animate-pulse"></div><div className="h-8 w-8 bg-slate-200 rounded-lg animate-pulse"></div></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Modal component
const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={handleBackdropClick}>
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
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

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [perPage] = useState(10);

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showAssignRiderModal, setShowAssignRiderModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  
  // Form states
  const [editLocation, setEditLocation] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [availableRiders, setAvailableRiders] = useState([]);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', remarks: '' });

  const statusOptions = ['Pending', 'Picked Up', 'In Transit', 'Delivered', 'Cancelled'];

  // Optimized fetchOrders with abort controller
  const fetchOrders = useCallback(async () => {
    const controller = new AbortController();
    try {
      setLoading(true);
      const response = await adminService.getParcels(currentPage, perPage, statusFilter);
      
      if (response.success) {
        setOrders(response.parcels || []);
        setTotalPages(response.pages || 1);
        setTotalOrders(response.total || 0);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching orders:', error);
      }
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [currentPage, perPage, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  // Fetch drivers with memoization
  const fetchDrivers = useCallback(async () => {
    try {
      const response = await adminService.getCouriers();
      if (response.success) {
        const allDrivers = response.drivers || [];
        setDrivers(allDrivers);
        
        const available = allDrivers.filter(driver => {
          const isOnline = driver.status !== 'Offline';
          const hasActiveDelivery = orders.some(order => 
            order.rider_id === driver.id && 
            order.status !== 'Delivered' && 
            order.status !== 'Cancelled'
          );
          return isOnline && !hasActiveDelivery;
        });
        
        setAvailableRiders(available);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  }, [orders]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    await fetchDrivers();
    setRefreshing(false);
  };

  // Status color memoized
  const getStatusColor = useCallback((status) => {
    const colors = {
      'Delivered': 'bg-green-100 text-green-700',
      'In Transit': 'bg-blue-100 text-blue-700',
      'Pending': 'bg-yellow-100 text-yellow-700',
      'Cancelled': 'bg-red-100 text-red-700',
      'Picked Up': 'bg-purple-100 text-purple-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-KE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  }, []);

  const formatPrice = useCallback((price) => {
    if (!price && price !== 0) return 'N/A';
    return `KSh ${Number(price).toLocaleString()}`;
  }, []);

  // View Details
  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  // View Map
  const handleViewMap = (order) => {
    setSelectedOrder(order);
    setShowMapModal(true);
  };

  // Update Location (Current Location of Parcel)
  const handleUpdateLocation = (order) => {
    setSelectedOrder(order);
    setEditLocation(order.current_location?.address || '');
    setShowLocationModal(true);
  };

  const handleSaveLocation = async () => {
    if (!editLocation.trim()) {
      setError('Please enter a valid location');
      return;
    }

    setLoadingAction(true);
    setError(null);

    try {
      const response = await adminService.updateParcelLocation(selectedOrder.id, {
        address: editLocation,
        city: selectedOrder.destination?.city || '',
        county: selectedOrder.destination?.county || '',
        latitude: selectedOrder.destination?.latitude || null,
        longitude: selectedOrder.destination?.longitude || null
      });

      if (response.success) {
        await fetchOrders();
        setShowLocationModal(false);
        setEditLocation('');
        alert('Location updated successfully!');
      } else {
        setError(response.message || 'Failed to update location');
      }
    } catch (error) {
      console.error('Error updating location:', error);
      setError(error.response?.data?.error || 'Failed to update location. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Cancel Order - REMOVED for admin (only customers can cancel)
  // Admin should NOT cancel orders per MVP requirements

  // Assign Rider
  const handleAssignRider = (order) => {
    setSelectedOrder(order);
    setSelectedRiderId(order.rider_id || '');
    fetchDrivers();
    setShowAssignRiderModal(true);
  };

  const handleAssignRiderSubmit = async () => {
    if (!selectedRiderId) {
      setError('Please select a rider');
      return;
    }

    setLoadingAction(true);
    setError(null);

    try {
      const response = await adminService.assignRider(selectedOrder.id, selectedRiderId);

      if (response.success) {
        await fetchOrders();
        await fetchDrivers();
        setShowAssignRiderModal(false);
        setSelectedRiderId('');
        alert('Rider assigned successfully!');
      } else {
        setError(response.message || 'Failed to assign rider');
      }
    } catch (error) {
      console.error('Error assigning rider:', error);
      setError(error.response?.data?.error || 'Failed to assign rider. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Update Status
  const handleUpdateStatus = (order) => {
    setSelectedOrder(order);
    setStatusUpdate({ status: order.status || '', remarks: '' });
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdate.status) {
      setError('Please select a status');
      return;
    }

    setLoadingAction(true);
    setError(null);

    try {
      const response = await adminService.updateParcelStatus(selectedOrder.id, {
        status: statusUpdate.status,
        remarks: statusUpdate.remarks || `Status updated to ${statusUpdate.status}`
      });

      if (response.success) {
        await fetchOrders();
        setShowStatusModal(false);
        setStatusUpdate({ status: '', remarks: '' });
        alert('Status updated successfully!');
      } else {
        setError(response.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setError(error.response?.data?.error || 'Failed to update status. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Memoized filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.rider?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.sender?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [orders, searchTerm]);

  // Memoized stats
  const stats = useMemo(() => ({
    total: totalOrders,
    pending: orders.filter(o => o.status === 'Pending').length,
    inTransit: orders.filter(o => o.status === 'In Transit' || o.status === 'Picked Up').length,
    delivered: orders.filter(o => o.status === 'Delivered').length
  }), [orders, totalOrders]);

  // Show skeleton while loading
  if (loading && orders.length === 0) {
    return <OrdersSkeleton />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-3">
          <Package className="h-6 w-6 text-blue-600" />
          Orders
          <span className="text-sm font-normal text-slate-500">
            ({totalOrders} total)
          </span>
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Order
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <p className="text-xs text-gray-500">Total Orders</p>
          <p className="text-lg font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-lg font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <p className="text-xs text-gray-500">In Transit</p>
          <p className="text-lg font-bold text-blue-600">{stats.inTransit}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <p className="text-xs text-gray-500">Delivered</p>
          <p className="text-lg font-bold text-green-600">{stats.delivered}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search orders by ID, sender, rider, or route..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="all">All Status</option>
          {statusOptions.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <button className="px-4 py-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tracking #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Sender</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Rider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Route</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium">No orders found</p>
                    <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm font-medium text-slate-900">
                      {order.tracking_number || order.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-semibold">
                          {order.user?.first_name?.[0]}{order.user?.last_name?.[0] || ''}
                        </div>
                        <span>{order.user?.full_name || order.sender || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {order.rider ? (
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs font-semibold">
                            {order.rider.first_name?.[0]}{order.rider.last_name?.[0] || ''}
                          </div>
                          <span>{order.rider.full_name}</span>
                          <span className={`ml-1 text-xs ${order.rider.status === 'Delivering' ? 'text-blue-600' : 'text-green-600'}`}>
                            ● {order.rider.status || 'Available'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {order.pickup_location?.address || order.pickup || 'N/A'} → {order.destination?.address || order.destination || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {formatPrice(order.price)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleViewDetails(order)}
                          className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(order)}
                          className="p-1.5 hover:bg-purple-50 rounded-lg text-purple-600 transition-colors"
                          title="Update Status"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleUpdateLocation(order)}
                          className="p-1.5 hover:bg-orange-50 rounded-lg text-orange-600 transition-colors"
                          title="Update Location"
                        >
                          <MapPin className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleViewMap(order)}
                          className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-600 transition-colors"
                          title="View on Map"
                        >
                          <Map className="h-4 w-4" />
                        </button>
                        {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                          <button 
                            onClick={() => handleAssignRider(order)}
                            className="p-1.5 hover:bg-green-50 rounded-lg text-green-600 transition-colors"
                            title="Assign Rider"
                          >
                            <Truck className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalOrders > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page {currentPage} of {totalPages} ({totalOrders} total)
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm text-slate-600">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Delivery Order"
        maxWidth="max-w-4xl"
      >
        <CreateOrder 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchOrders}
        />
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Order Details"
        maxWidth="max-w-3xl"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Order Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-200">
              <div>
                <p className="text-sm text-gray-500">Tracking Number</p>
                <p className="font-mono font-semibold text-gray-900">{selectedOrder.tracking_number || selectedOrder.id}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>
            </div>

            {/* Order Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Sender</p>
                    <p className="font-medium text-gray-900">{selectedOrder.user?.full_name || selectedOrder.sender || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{selectedOrder.user?.email}</p>
                    <p className="text-xs text-gray-500">{selectedOrder.user?.phone_number}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Truck className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Rider</p>
                    <p className="font-medium text-gray-900">
                      {selectedOrder.rider?.full_name || 'Not assigned'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedOrder.rider?.phone_number || ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Pickup Location</p>
                    <p className="font-medium text-gray-900">{selectedOrder.pickup_location?.address || selectedOrder.pickup || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{selectedOrder.pickup_location?.city}, {selectedOrder.pickup_location?.county}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Destination</p>
                    <p className="font-medium text-gray-900">{selectedOrder.destination?.address || selectedOrder.destination || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{selectedOrder.destination?.city}, {selectedOrder.destination?.county}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Current Location</p>
                    <p className="font-medium text-gray-900">{selectedOrder.current_location?.address || 'Not updated'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Package className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Weight</p>
                    <p className="font-medium text-gray-900">{selectedOrder.weight ? `${selectedOrder.weight}kg` : 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <DollarSign className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="font-medium text-gray-900">{formatPrice(selectedOrder.price)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium text-gray-900">{formatDate(selectedOrder.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleUpdateStatus(selectedOrder);
                }}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                <Edit className="h-3 w-3 inline mr-1" />
                Update Status
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleUpdateLocation(selectedOrder);
                }}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                <MapPin className="h-3 w-3 inline mr-1" />
                Update Location
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleViewMap(selectedOrder);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                <Map className="h-3 w-3 inline mr-1" />
                View on Map
              </button>
              {selectedOrder.status !== 'Delivered' && selectedOrder.status !== 'Cancelled' && (
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleAssignRider(selectedOrder);
                  }}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <Truck className="h-3 w-3 inline mr-1" />
                  Assign Rider
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Update Status Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setStatusUpdate({ status: '', remarks: '' });
          setError(null);
        }}
        title="Update Parcel Status"
        maxWidth="max-w-md"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-700">
                <span className="font-medium">Parcel:</span> {selectedOrder.tracking_number || selectedOrder.id}
              </p>
              <p className="text-sm text-slate-700">
                <span className="font-medium">Current Status:</span> {selectedOrder.status}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                New Status <span className="text-red-500">*</span>
              </label>
              <select
                value={statusUpdate.status}
                onChange={(e) => setStatusUpdate(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Status...</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Remarks
              </label>
              <textarea
                value={statusUpdate.remarks}
                onChange={(e) => setStatusUpdate(prev => ({ ...prev, remarks: e.target.value }))}
                rows="3"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Add any remarks..."
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setStatusUpdate({ status: '', remarks: '' });
                  setError(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={loadingAction || !statusUpdate.status}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingAction ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Update Status
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <UpdateLocationModal
  isOpen={showLocationModal}
  onClose={() => {
    setShowLocationModal(false);
    setEditLocation('');
    setError(null);
  }}
  order={selectedOrder}
  onSuccess={fetchOrders}
/>

      {/* Assign Rider Modal */}
      <Modal
        isOpen={showAssignRiderModal}
        onClose={() => {
          setShowAssignRiderModal(false);
          setSelectedRiderId('');
          setError(null);
        }}
        title="Assign Rider"
        maxWidth="max-w-md"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-700">
                <span className="font-medium">Order:</span> {selectedOrder.tracking_number || selectedOrder.id}
              </p>
              <p className="text-sm text-slate-700">
                <span className="font-medium">Current Rider:</span> {selectedOrder.rider?.full_name || 'Not assigned'}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Select Rider <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedRiderId}
                onChange={(e) => setSelectedRiderId(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a rider...</option>
                {availableRiders.length === 0 ? (
                  <option value="" disabled>No available riders</option>
                ) : (
                  availableRiders.map(rider => (
                    <option key={rider.id} value={rider.id}>
                      {rider.full_name} ({rider.status}) - {rider.vehicle || 'No vehicle'}
                    </option>
                  ))
                )}
              </select>
              {availableRiders.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  No available riders found. All riders may be offline or already assigned to a delivery.
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowAssignRiderModal(false);
                  setSelectedRiderId('');
                  setError(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignRiderSubmit}
                disabled={loadingAction || !selectedRiderId || availableRiders.length === 0}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingAction ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Assigning...
                  </>
                ) : (
                  <>
                    <Truck className="h-4 w-4" />
                    Assign Rider
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Map View Modal */}
<Modal
  isOpen={showMapModal}
  onClose={() => {
    setShowMapModal(false);
    setSelectedOrder(null);
  }}
  title="Parcel Route Map"
  maxWidth="max-w-4xl"
>
  {selectedOrder && (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-200">
        <div>
          <p className="text-sm text-gray-500">Tracking Number</p>
          <p className="font-mono font-semibold text-gray-900">{selectedOrder.tracking_number || selectedOrder.id}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
            {selectedOrder.status}
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(selectedOrder.created_at)}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg overflow-hidden border border-slate-200">
        <DeliveryMap 
          pickupLocation={selectedOrder.pickup_location}
          destinationLocation={selectedOrder.destination}
          onRouteCalculated={(routeInfo) => {
            console.log('Route calculated:', routeInfo);
          }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="font-medium text-blue-800 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Pickup Location
          </p>
          <p className="text-blue-700">{selectedOrder.pickup_location?.address || selectedOrder.pickup || 'N/A'}</p>
          <p className="text-xs text-blue-600">
            {selectedOrder.pickup_location?.city && selectedOrder.pickup_location?.county && 
              `${selectedOrder.pickup_location.city}, ${selectedOrder.pickup_location.county}`
            }
          </p>
          {selectedOrder.pickup_location?.latitude && selectedOrder.pickup_location?.longitude && (
            <p className="text-xs text-blue-500 font-mono mt-1">
              📍 {selectedOrder.pickup_location.latitude.toFixed(6)}, {selectedOrder.pickup_location.longitude.toFixed(6)}
            </p>
          )}
        </div>
        <div className="p-3 bg-red-50 rounded-lg border border-red-100">
          <p className="font-medium text-red-800 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Destination
          </p>
          <p className="text-red-700">{selectedOrder.destination?.address || selectedOrder.destination || 'N/A'}</p>
          <p className="text-xs text-red-600">
            {selectedOrder.destination?.city && selectedOrder.destination?.county && 
              `${selectedOrder.destination.city}, ${selectedOrder.destination.county}`
            }
          </p>
          {selectedOrder.destination?.latitude && selectedOrder.destination?.longitude && (
            <p className="text-xs text-red-500 font-mono mt-1">
              📍 {selectedOrder.destination.latitude.toFixed(6)}, {selectedOrder.destination.longitude.toFixed(6)}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-gray-200">
        <button
          onClick={() => setShowMapModal(false)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
        >
          Close Map
        </button>
      </div>
    </div>
  )}
</Modal>
    </div>
  );
};

export default Orders;