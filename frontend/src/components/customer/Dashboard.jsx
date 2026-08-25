// pages/CustomerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Eye, 
  Edit, 
  Trash2, 
  X, 
  Check,
  AlertTriangle,
  MapPin,
  Package,
  Calendar,
  Clock,
  User,
  Phone,
  DollarSign,
  Shield
} from 'lucide-react';
import DeliveryMap from '../maps/DeliveryMap';

const CustomerDashboard = () => {
  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [editDestination, setEditDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock orders data with sender IDs
  const mockOrders = [
    { 
      id: 'SND-8942-019', 
      route: 'NBI to KAM', 
      pickup: 'Nairobi CBD',
      destination: 'Kisumu',
      status: 'In Transit', 
      date: 'Sep 28, 2024', 
      amount: 'KSh 1,000',
      weight: '2.5kg',
      receiver: 'John Mwangi',
      receiverPhone: '+254 745 678 901',
      sender: 'Jane Doe',
      senderId: '2', // Customer user ID
      createdAt: '2024-09-28T10:00:00Z',
      estimatedDelivery: '2024-09-30T18:00:00Z',
      trackingHistory: [
        { status: 'Order Created', timestamp: '2024-09-28T10:00:00Z', location: 'Nairobi CBD' },
        { status: 'Picked Up', timestamp: '2024-09-28T12:00:00Z', location: 'Nairobi CBD' },
        { status: 'In Transit', timestamp: '2024-09-28T14:00:00Z', location: 'Nakuru' }
      ]
    },
    { 
      id: 'SND-4029-108', 
      route: 'NBI to MSA', 
      pickup: 'Nairobi CBD',
      destination: 'Mombasa',
      status: 'Delivered', 
      date: 'Sep 24, 2024', 
      amount: 'KSh 2,000',
      weight: '5kg',
      receiver: 'Mary Wanjiru',
      receiverPhone: '+254 756 789 012',
      sender: 'John Mwangi',
      senderId: '3', // Another user
      createdAt: '2024-09-24T09:00:00Z',
      estimatedDelivery: '2024-09-25T16:00:00Z',
      trackingHistory: [
        { status: 'Order Created', timestamp: '2024-09-24T09:00:00Z', location: 'Nairobi CBD' },
        { status: 'Picked Up', timestamp: '2024-09-24T11:00:00Z', location: 'Nairobi CBD' },
        { status: 'In Transit', timestamp: '2024-09-24T14:00:00Z', location: 'Mombasa Road' },
        { status: 'Delivered', timestamp: '2024-09-25T16:00:00Z', location: 'Mombasa' }
      ]
    },
    { 
      id: 'SND-3910-821', 
      route: 'KAM to NBI', 
      pickup: 'Kisumu',
      destination: 'Nairobi',
      status: 'Delivered', 
      date: 'Sep 22, 2024', 
      amount: 'KSh 3,000',
      weight: '1kg',
      receiver: 'Peter Ochieng',
      receiverPhone: '+254 734 567 890',
      sender: 'Grace Akinyi',
      senderId: '4',
      createdAt: '2024-09-22T08:00:00Z',
      estimatedDelivery: '2024-09-23T14:00:00Z',
      trackingHistory: [
        { status: 'Order Created', timestamp: '2024-09-22T08:00:00Z', location: 'Kisumu' },
        { status: 'Picked Up', timestamp: '2024-09-22T10:00:00Z', location: 'Kisumu' },
        { status: 'In Transit', timestamp: '2024-09-22T13:00:00Z', location: 'Nakuru' },
        { status: 'Delivered', timestamp: '2024-09-23T14:00:00Z', location: 'Nairobi' }
      ]
    },
    { 
      id: 'SND-7821-492', 
      route: 'NBI to KIS', 
      pickup: 'Nairobi CBD',
      destination: 'Kisumu',
      status: 'Pending', 
      date: 'Sep 30, 2024', 
      amount: 'KSh 2,000',
      weight: '10kg+',
      receiver: 'David Kamau',
      receiverPhone: '+254 767 890 123',
      sender: 'Jane Doe',
      senderId: '2', // Customer user ID
      createdAt: '2024-09-30T11:00:00Z',
      estimatedDelivery: '2024-10-02T18:00:00Z',
      trackingHistory: [
        { status: 'Order Created', timestamp: '2024-09-30T11:00:00Z', location: 'Nairobi CBD' }
      ]
    }
  ];

  useEffect(() => {
    // Load orders from localStorage or use mock data
    const savedOrders = localStorage.getItem('customerOrders');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    } else {
      setOrders(mockOrders);
      localStorage.setItem('customerOrders', JSON.stringify(mockOrders));
    }
  }, []);

  // Save orders to localStorage whenever they change
  useEffect(() => {
    if (orders.length > 0) {
      localStorage.setItem('customerOrders', JSON.stringify(orders));
    }
  }, [orders]);

  // Check if current user can modify the order
  const canModifyOrder = (order) => {
    // Rule 1: Only the user who created the order can modify it
    const isOwner = currentUser && order.senderId === currentUser.id;
    
    // Rule 2: Order must not be delivered or cancelled
    const isActive = order.status !== 'Delivered' && order.status !== 'Cancelled';
    
    return isOwner && isActive;
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'Delivered': 'bg-green-100 text-green-700',
      'In Transit': 'bg-blue-100 text-blue-700',
      'Pending': 'bg-yellow-100 text-yellow-700',
      'Cancelled': 'bg-red-100 text-red-700',
      'Picked Up': 'bg-purple-100 text-purple-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  // Stats calculation
  const stats = {
    activeDeliveries: orders.filter(o => o.status === 'In Transit' || o.status === 'Picked Up').length,
    completedOrders: orders.filter(o => o.status === 'Delivered').length,
    pendingConfirmations: orders.filter(o => o.status === 'Pending').length,
    totalSpent: orders
      .filter(o => o.status === 'Delivered')
      .reduce((sum, o) => sum + parseInt(o.amount.replace(/[^0-9]/g, '')), 0)
  };

  // View Order Details
  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  // Edit Destination
  const handleEditDestination = (order) => {
    // Verify user can edit
    if (!canModifyOrder(order)) {
      alert('You cannot edit this order. Only the sender can modify it, and it must not be delivered or cancelled.');
      return;
    }
    setSelectedOrder(order);
    setEditDestination(order.destination);
    setShowEditModal(true);
  };

  const handleSaveDestination = () => {
    if (!editDestination.trim()) {
      setError('Please enter a valid destination');
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const updatedOrders = orders.map(order => 
        order.id === selectedOrder.id 
          ? { 
              ...order, 
              destination: editDestination,
              route: `${order.pickup} to ${editDestination}`,
              updatedAt: new Date().toISOString()
            }
          : order
      );
      setOrders(updatedOrders);
      setLoading(false);
      setShowEditModal(false);
      setError(null);
      alert('Destination updated successfully!');
    }, 1000);
  };

  // Cancel Order
  const handleCancelOrder = (order) => {
    // Verify user can cancel
    if (!canModifyOrder(order)) {
      alert('You cannot cancel this order. Only the sender can cancel it, and it must not be delivered or cancelled.');
      return;
    }
    setSelectedOrder(order);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const updatedOrders = orders.map(order => 
        order.id === selectedOrder.id 
          ? { 
              ...order, 
              status: 'Cancelled',
              cancelledAt: new Date().toISOString()
            }
          : order
      );
      setOrders(updatedOrders);
      setLoading(false);
      setShowCancelModal(false);
      alert('Order cancelled successfully!');
    }, 1000);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fixed Modal component - proper overlay handling
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
          {/* Overlay - clickable to close */}
          <div 
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            onClick={onClose}
          />

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

          {/* Modal Content - higher z-index with click prevention */}
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

  // Get recent orders (latest 4)
  const recentOrders = orders.slice(0, 4);

  return (
    <div className="dashboard-container p-4 md:p-6 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome back, {currentUser?.name || 'Jane'}
        </h1>
        <p className="text-gray-500">Track, manage, and dispatch local courier deliveries in real-time.</p>
      </header>

      {/* Stats Overview */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500 mb-1">Active Deliveries</p>
          <h2 className="text-3xl font-bold text-blue-600">{stats.activeDeliveries}</h2>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500 mb-1">Completed Orders</p>
          <h2 className="text-3xl font-bold text-green-600">{stats.completedOrders}</h2>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500 mb-1">Pending Confirmations</p>
          <h2 className="text-3xl font-bold text-yellow-600">{stats.pendingConfirmations}</h2>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500 mb-1">Total Spent (Q3)</p>
          <h2 className="text-3xl font-bold text-purple-600">Kes {stats.totalSpent.toLocaleString()}</h2>
        </div>
      </section>

      {/* Delivery Map */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Live Delivery Route
          </h3>
          <p className="text-sm text-gray-500">
            Track your pickup and destination route in real-time.
          </p>
        </div>
        <DeliveryMap />
      </section>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Recent Orders List */}
        <section className="flex-grow bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Recent Delivery Orders</h3>
            <Link to="/customer/orders" className="text-blue-600 text-sm hover:underline">
              View all
            </Link>
          </div>
          
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 border-b">
                  <th className="pb-2 font-medium">Tracking #</th>
                  <th className="pb-2 font-medium">Route</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => {
                  const canModify = canModifyOrder(order);
                  return (
                    <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-3 font-mono text-sm font-medium text-gray-700">{order.id}</td>
                      <td className="py-3 text-gray-600">{order.route}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500">{order.date}</td>
                      <td className="py-3 font-medium">{order.amount}</td>
                      <td className="py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewDetails(order)}
                            className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {/* Only show edit/cancel buttons if user can modify */}
                          {canModify ? (
                            <>
                              <button
                                onClick={() => handleEditDestination(order)}
                                className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-600 transition-colors"
                                title="Edit Destination"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleCancelOrder(order)}
                                className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                                title="Cancel Order"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            // Show disabled state with tooltip
                            <div className="flex items-center gap-1">
                              {order.status === 'Delivered' && (
                                <span className="text-xs text-gray-400" title="Order already delivered">
                                  <Shield className="h-4 w-4 text-gray-300" />
                                </span>
                              )}
                              {order.status === 'Cancelled' && (
                                <span className="text-xs text-gray-400" title="Order already cancelled">
                                  <Shield className="h-4 w-4 text-gray-300" />
                                </span>
                              )}
                              {order.senderId !== currentUser?.id && order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                                <span className="text-xs text-gray-400" title="Only the sender can modify this order">
                                  <Shield className="h-4 w-4 text-gray-300" />
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {recentOrders.map((order) => {
              const canModify = canModifyOrder(order);
              return (
                <div key={order.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-sm font-medium text-gray-700">{order.id}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{order.route}</p>
                  <div className="flex justify-between text-sm text-gray-500 mb-3">
                    <span>{order.date}</span>
                    <span className="font-medium text-gray-700">{order.amount}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(order)}
                      className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye className="h-3 w-3" /> View
                    </button>
                    
                    {canModify ? (
                      <>
                        <button
                          onClick={() => handleEditDestination(order)}
                          className="flex-1 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors flex items-center justify-center gap-1"
                        >
                          <Edit className="h-3 w-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleCancelOrder(order)}
                          className="flex-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" /> Cancel
                        </button>
                      </>
                    ) : (
                      <div className="flex-1 px-3 py-1.5 bg-gray-50 text-gray-400 rounded-lg text-sm flex items-center justify-center gap-1">
                        <Shield className="h-3 w-3" />
                        Locked
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Action Panel */}
        <section className="w-full lg:w-1/3 bg-slate-800 text-white p-6 rounded-lg shadow-md flex flex-col justify-center">
          <h3 className="text-xl font-semibold mb-2">Request Courier</h3>
          <p className="text-slate-300 text-sm mb-6">Send packages instantly with our verified fleet.</p>
          <div className="flex items-center justify-between text-sm text-slate-400 mb-6">
            <span>Pickup</span>
            <span className="flex-grow border-t border-dashed border-slate-500 mx-2"></span>
            <span>Delivery</span>
          </div>
          <Link to="/customer/createorder" className="w-full">
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded transition-colors">
              New Delivery Order
            </button>
          </Link>
        </section>
      </div>

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
                <p className="font-mono font-semibold text-gray-900">{selectedOrder.id}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
                {selectedOrder.senderId === currentUser?.id && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Your Order</span>
                )}
              </div>
            </div>

            {/* Order Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Pickup Location</p>
                    <p className="font-medium text-gray-900">{selectedOrder.pickup}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Destination</p>
                    <p className="font-medium text-gray-900">{selectedOrder.destination}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Package className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Weight</p>
                    <p className="font-medium text-gray-900">{selectedOrder.weight}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <DollarSign className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="font-medium text-gray-900">{selectedOrder.amount}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Sender</p>
                    <p className="font-medium text-gray-900">{selectedOrder.sender}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Receiver</p>
                    <p className="font-medium text-gray-900">{selectedOrder.receiver}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Receiver Phone</p>
                    <p className="font-medium text-gray-900">{selectedOrder.receiverPhone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium text-gray-900">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Estimated Delivery</p>
                    <p className="font-medium text-gray-900">{formatDate(selectedOrder.estimatedDelivery)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking History */}
            {selectedOrder.trackingHistory && selectedOrder.trackingHistory.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Tracking History</h4>
                <div className="space-y-3">
                  {selectedOrder.trackingHistory.map((event, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="relative">
                        <div className={`h-3 w-3 rounded-full mt-1 ${
                          index === 0 ? 'bg-blue-600' : 
                          index === selectedOrder.trackingHistory.length - 1 && selectedOrder.status === 'Delivered' 
                            ? 'bg-green-600' : 'bg-gray-300'
                        }`} />
                        {index < selectedOrder.trackingHistory.length - 1 && (
                          <div className="absolute top-3 left-1.5 h-8 w-0.5 bg-gray-300" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{event.status}</p>
                        <p className="text-sm text-gray-500">{event.location}</p>
                        <p className="text-xs text-gray-400">{formatDate(event.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions - Only show if user can modify */}
            {canModifyOrder(selectedOrder) && (
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEditDestination(selectedOrder);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Destination
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleCancelOrder(selectedOrder);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Cancel Order
                </button>
              </div>
            )}

            {/* Cannot Modify Message */}
            {!canModifyOrder(selectedOrder) && selectedOrder.senderId !== currentUser?.id && (
              <div className="pt-4 border-t border-gray-200">
                <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2 text-sm text-gray-500">
                  <Shield className="h-4 w-4 text-gray-400" />
                  You cannot modify this order because you are not the sender.
                </div>
              </div>
            )}

            {!canModifyOrder(selectedOrder) && selectedOrder.status === 'Delivered' && (
              <div className="pt-4 border-t border-gray-200">
                <div className="p-3 bg-green-50 rounded-lg flex items-center gap-2 text-sm text-green-700">
                  <Check className="h-4 w-4 text-green-600" />
                  This order has already been delivered.
                </div>
              </div>
            )}

            {!canModifyOrder(selectedOrder) && selectedOrder.status === 'Cancelled' && (
              <div className="pt-4 border-t border-gray-200">
                <div className="p-3 bg-red-50 rounded-lg flex items-center gap-2 text-sm text-red-700">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  This order has been cancelled.
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Destination Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Destination"
        maxWidth="max-w-md"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                You can only change the destination if the parcel hasn't been delivered yet.
                {selectedOrder.senderId === currentUser?.id ? (
                  <span className="block text-amber-600 font-medium">✓ You are the sender of this order</span>
                ) : (
                  <span className="block text-red-600 font-medium">⚠️ You are not the sender of this order</span>
                )}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Destination
              </label>
              <p className="text-gray-900 font-medium">{selectedOrder.destination}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Destination <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editDestination}
                onChange={(e) => setEditDestination(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter new destination"
              />
              {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDestination}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
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

      {/* Cancel Order Modal */}
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
              <div>
                <p className="font-medium text-red-800">Are you sure?</p>
                <p className="text-sm text-red-700">
                  This action cannot be undone. This will permanently cancel order <span className="font-mono font-semibold">{selectedOrder.id}</span>.
                </p>
                {selectedOrder.senderId === currentUser?.id && (
                  <p className="text-xs text-green-600 mt-1">✓ You are the sender of this order</p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Route:</span> {selectedOrder.route}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Status:</span> {selectedOrder.status}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Amount:</span> {selectedOrder.amount}
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Keep Order
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cancelling...
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

export default CustomerDashboard;