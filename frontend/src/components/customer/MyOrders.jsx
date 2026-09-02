import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  Edit,
  Trash2,
  Search,
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
  Shield,
  Truck,
  Filter,
  Plus
} from "lucide-react";

const MyOrders = () => {
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [editDestination, setEditDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Fetch orders from backend
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/parcels?page=1&per_page=50",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }
        const data = await response.json();
        setOrders(data.parcels || []);
        setFilteredOrders(data.parcels || []);
      } catch (err) {
        setError(err.message);
        // Fall back to mock data if API fails
        const mockOrders = [
          { id: "SND-8942-019", route: "NBI to KAM", pickup: "Nairobi CBD", destination: "Kisumu", status: "In Transit", date: "Sep 28, 2024", amount: "KSh 1,000", weight: "2.5kg", receiver: "John Mwangi", receiverPhone: "+254 745 678 901", sender: "Jane Doe", senderId: "2", createdAt: "2024-09-28T10:00:00Z", estimatedDelivery: "2024-09-30T18:00:00Z", trackingHistory: [{ status: "Order Created", timestamp: "2024-09-28T10:00:00Z", location: "Nairobi CBD" }, { status: "Picked Up", timestamp: "2024-09-28T12:00:00Z", location: "Nairobi CBD" }, { status: "In Transit", timestamp: "2024-09-28T14:00:00Z", location: "Nakuru" }] },
          { id: "SND-4029-108", route: "NBI to MSA", pickup: "Nairobi CBD", destination: "Mombasa", status: "Delivered", date: "Sep 24, 2024", amount: "KSh 2,000", weight: "5kg", receiver: "Mary Wanjiru", receiverPhone: "+254 756 789 012", sender: "John Mwangi", senderId: "3", createdAt: "2024-09-24T09:00:00Z", estimatedDelivery: "2024-09-25T16:00:00Z", trackingHistory: [{ status: "Order Created", timestamp: "2024-09-24T09:00:00Z", location: "Nairobi CBD" }, { status: "Picked Up", timestamp: "2024-09-24T11:00:00Z", location: "Nairobi CBD" }, { status: "In Transit", timestamp: "2024-09-24T14:00:00Z", location: "Mombasa Road" }, { status: "Delivered", timestamp: "2024-09-25T16:00:00Z", location: "Mombasa" }] },
          { id: "SND-3910-821", route: "KAM to NBI", pickup: "Kisumu", destination: "Nairobi", status: "Delivered", date: "Sep 22, 2024", amount: "KSh 3,000", weight: "1kg", receiver: "Peter Ochieng", receiverPhone: "+254 734 567 890", sender: "Grace Akinyi", senderId: "4", createdAt: "2024-09-22T08:00:00Z", estimatedDelivery: "2024-09-23T14:00:00Z", trackingHistory: [{ status: "Order Created", timestamp: "2024-09-22T08:00:00Z", location: "Kisumu" }, { status: "Picked Up", timestamp: "2024-09-22T10:00:00Z", location: "Kisumu" }, { status: "In Transit", timestamp: "2024-09-22T13:00:00Z", location: "Nakuru" }, { status: "Delivered", timestamp: "2024-09-23T14:00:00Z", location: "Nairobi" }] },
          { id: "SND-7821-492", route: "NBI to KIS", pickup: "Nairobi CBD", destination: "Kisumu", status: "Pending", date: "Sep 30, 2024", amount: "KSh 2,000", weight: "10kg+", receiver: "David Kamau", receiverPhone: "+254 767 890 123", sender: "Jane Doe", senderId: "2", createdAt: "2024-09-30T11:00:00Z", estimatedDelivery: "2024-10-02T18:00:00Z", trackingHistory: [{ status: "Order Created", timestamp: "2024-09-30T11:00:00Z", location: "Nairobi CBD" }] },
          { id: "SND-3456-789", route: "NBI to ELD", pickup: "Nairobi CBD", destination: "Eldoret", status: "Pending", date: "Oct 1, 2024", amount: "KSh 1,500", weight: "3kg", receiver: "Sarah Wanjiku", receiverPhone: "+254 778 901 234", sender: "John Mwangi", senderId: "3", createdAt: "2024-10-01T09:00:00Z", estimatedDelivery: "2024-10-03T18:00:00Z", trackingHistory: [{ status: "Order Created", timestamp: "2024-10-01T09:00:00Z", location: "Nairobi CBD" }] }
        ];
        setOrders(mockOrders);
        setFilteredOrders(mockOrders);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Filter orders
  useEffect(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.receiver.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.sender.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, orders]);

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      Delivered: "bg-green-100 text-green-700",
      "In Transit": "bg-blue-100 text-blue-700",
      Pending: "bg-yellow-100 text-yellow-700",
      Cancelled: "bg-red-100 text-red-700",
      "Picked Up": "bg-purple-100 text-purple-700"
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  // Get status icon
  const getStatusIcon = (status) => {
    const icons = {
      Delivered: <Check className="h-3 w-3" />,
      "In Transit": <Clock className="h-3 w-3" />,
      Pending: <Package className="h-3 w-3" />,
      Cancelled: <X className="h-3 w-3" />,
      "Picked Up": <Truck className="h-3 w-3" />
    };
    return icons[status] || null;
  };

  // Check if current user can modify the order
  const canModifyOrder = (order) => {
    const isOwner = currentUser && order.senderId === currentUser.id;
    const isActive = order.status !== "Delivered" && order.status !== "Cancelled";
    return isOwner && isActive;
  };

  // Get status badge with icon
  const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {getStatusIcon(status)}
      {status}
    </span>
  );

  // Custom Modal Component with fixed overlay
  const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-2xl" }) => {
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

          {/* Modal Content - higher z-index */}
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

  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            My Orders
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Track and manage all your delivery orders
          </p>
        </div>
        <Link to="/customer/createorder">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm shadow-blue-200"
          >
            <Plus className="h-4 w-4" />
            New Delivery Order
          </button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500">Total Orders</p>
          <p className="text-lg font-bold text-gray-800">{orders.length}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500">In Transit</p>
          <p className="text-lg font-bold text-blue-600">
            {orders.filter(
              (o) => o.status === "In Transit" || o.status === "Picked Up"
            ).length}
          </p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500">Delivered</p>
          <p className="text-lg font-bold text-green-600">
            {orders.filter((o) => o.status === "Delivered").length}
          </p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-lg font-bold text-yellow-600">
            {orders.filter((o) => o.status === "Pending").length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ID, route, sender, or receiver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Picked Up">Picked Up</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button
            className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm text-gray-600"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tracking #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sender
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentItems.map((order) => {
                const canModify = canModifyOrder(order);
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm font-medium text-gray-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <span>{order.route.split(" to ")[0]}</span>
                        <span className="text-gray-300">→</span>
                        <span>{order.route.split(" to ")[1]}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-semibold">
                          {order.sender.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <span>{order.sender}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{order.date}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.amount}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowDetailsModal(true);
                          }}
                          className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {canModify ? (
                          <>
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setEditDestination(order.destination);
                                setShowEditModal(true);
                              }}
                              className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-600 transition-colors"
                              title="Edit Destination"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowCancelModal(true);
                              }}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                              title="Cancel Order"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            className="p-1.5 text-gray-300 cursor-not-allowed"
                            title={
                              order.status === "Delivered"
                                ? "Order already delivered"
                                : order.status === "Cancelled"
                                ? "Order already cancelled"
                                : "Only the sender can modify this order"
                            }
                          >
                            <Shield className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No orders found</p>
            <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Loading State */}
        {loading && !filteredOrders.length && (
          <div className="text-center py-8">
            <svg
              className="animate-spin h-8 w-8 mx-auto text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="ml-4 text-gray-500">Loading orders...</span>
          </div>
        )}

        {/* Pagination */}
        {filteredOrders.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredOrders.length)} of {filteredOrders.length} orders
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm transition-colors ${
                    currentPage === page
                      ? "bg-blue-600 text-white"
                      : "border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Order Details"
        maxWidth="max-w-3xl"
      >
        {selectedOrder && (
          <div className="space-y-5">
            {/* Order Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-200">
              <div>
                <p className="text-sm text-gray-500">Tracking Number</p>
                <p className="font-mono font-semibold text-gray-900 text-lg">{selectedOrder.id}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={selectedOrder.status} />
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
                  <DollarSign className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="font-medium text-gray-900">{selectedOrder.amount}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking History */}
            {selectedOrder.trackingHistory && selectedOrder.trackingHistory.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Tracking History
                </h4>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {selectedOrder.trackingHistory.map((event, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="relative">
                        <div
                          className={`h-3 w-3 rounded-full mt-1 ${
                            index === 0
                              ? "bg-blue-600"
                              : index === selectedOrder.trackingHistory.length - 1 && selectedOrder.status === "Delivered"
                                ? "bg-green-600"
                                : "bg-gray-300"
                        }`} />
                        {index < selectedOrder.trackingHistory.length - 1 && (
                          <div className="absolute top-3 left-1.5 h-8 w-0.5 bg-gray-300" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{event.status}</p>
                        <p className="text-sm text-gray-500">{event.location}</p>
                        <p className="text-xs text-gray-400">{new Date(event.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {canModifyOrder(selectedOrder) && (
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setEditDestination(selectedOrder.destination);
                    setShowEditModal(true);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Destination
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setShowCancelModal(true);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Cancel Order
                </button>
              </div>
            )}

            {/* Cannot Modify Messages */}
            {!canModifyOrder(selectedOrder) && (
              <div className="pt-4 border-t border-gray-200">
                {selectedOrder.senderId !== currentUser?.id && (
                  <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2 text-sm text-gray-500">
                    <Shield className="h-4 w-4 text-gray-400" />
                    You cannot modify this order because you are not the sender.
                  </div>
                )}
                {selectedOrder.status === "Delivered" && (
                  <div className="p-3 bg-green-50 rounded-lg flex items-center gap-2 text-sm text-green-700">
                    <Check className="h-4 w-4 text-green-600" />
                    This order has already been delivered.
                  </div>
                )}
                {selectedOrder.status === "Cancelled" && (
                  <div className="p-3 bg-red-50 rounded-lg flex items-center gap-2 text-sm text-red-700">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    This order has been cancelled.
                  </div>
                )}
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
              <div>
                <p className="text-sm text-amber-700">
                  You can only change the destination if the parcel hasn't been delivered yet.
                </p>
                {selectedOrder.senderId === currentUser?.id && (
                  <p className="text-xs text-green-600 mt-1">✓ You are the sender of this order</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Destination
              </label>
              <p className="text-gray-900 font-medium p-2 bg-gray-50 rounded-lg">{selectedOrder.destination}</p>
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
                onClick={() => {
                  if (!editDestination.trim()) {
                    setError("Please enter a valid destination");
                    return;
                  }
                  setLoading(true);
                  setTimeout(async () => {
                    try {
                      await updateParcelDestination(selectedOrder.id, editDestination);
                      // Update local state
                      const updatedOrders = orders.map((order) =>
                        order.id === selectedOrder.id
                          ? { ...order, destination: editDestination, route: `${order.pickup} to ${editDestination}` }
                          : order
                      );
                      setOrders(updatedOrders);
                      setFilteredOrders(updatedOrders);
                      localStorage.setItem("customerOrders", JSON.stringify(updatedOrders));
                      setLoading(false);
                      setShowEditModal(false);
                      setError(null);
                      toast.success("Destination updated successfully!");
                    } catch (err) {
                      setLoading(false);
                      toast.error(err.message || "Failed to update destination");
                    }
                  }, 1000);
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
                onClick={() => {
                  setLoading(true);
                  setTimeout(async () => {
                    try {
                      await cancelParcel(selectedOrder.id);
                      // Update local state
                      const updatedOrders = orders.map((order) =>
                        order.id === selectedOrder.id
                          ? { ...order, status: "Cancelled", cancelledAt: new Date().toISOString() }
                          : order
                      );
                      setOrders(updatedOrders);
                      setFilteredOrders(updatedOrders);
                      localStorage.setItem("customerOrders", JSON.stringify(updatedOrders));
                      setLoading(false);
                      setShowCancelModal(false);
                      toast.success("Order cancelled successfully!");
                    } catch (err) {
                      setLoading(false);
                      toast.error(err.message || "Failed to cancel order");
                    }
                  }, 1000);
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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

export default MyOrders;