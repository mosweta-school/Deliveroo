// frontend/src/components/admin/ViewOrderDetails.jsx
import React from 'react';
import { X, User, MapPin, Package, Weight, DollarSign, Calendar, Clock, Truck, UserCheck } from 'lucide-react';

const ViewOrderDetails = ({ isOpen, order, onClose }) => {
  if (!isOpen || !order) return null;

  const getStatusColor = (status) => {
    const colors = {
      'Delivered': 'bg-green-100 text-green-700 border-green-200',
      'In Transit': 'bg-blue-100 text-blue-700 border-blue-200',
      'Pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Cancelled': 'bg-red-100 text-red-700 border-red-200',
      'Picked Up': 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const formatDate = (dateString) => {
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
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return 'N/A';
    return `KSh ${Number(price).toLocaleString()}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Package className="h-6 w-6 text-blue-600" />
                Order Details
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
              {/* ... rest of the component remains the same ... */}
              {/* Tracking & Status */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-500">Tracking Number</p>
                  <p className="font-mono font-semibold text-slate-900">{order.tracking_number || order.id}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Created</p>
                  <p className="text-sm text-slate-900">{formatDate(order.created_at)}</p>
                </div>
              </div>

              {/* Customer & Courier */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="font-medium text-slate-900 flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-blue-600" />
                    Customer
                  </h4>
                  <p className="text-sm text-slate-700">{order.user?.full_name || order.sender || 'N/A'}</p>
                  <p className="text-sm text-slate-500">{order.user?.email || 'N/A'}</p>
                  <p className="text-sm text-slate-500">{order.user?.phone_number || 'N/A'}</p>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="font-medium text-slate-900 flex items-center gap-2 mb-2">
                    <Truck className="h-4 w-4 text-purple-600" />
                    Courier
                  </h4>
                  <p className="text-sm text-slate-700">{order.courier || 'Not assigned'}</p>
                  <p className="text-sm text-slate-500">{order.courier_phone || ''}</p>
                </div>
              </div>

              {/* Route Information */}
              <div className="p-4 border border-slate-200 rounded-lg">
                <h4 className="font-medium text-slate-900 flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  Route Information
                </h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-slate-500">Pickup</p>
                    <p className="text-sm text-slate-700">{order.pickup_location?.address || order.pickup || 'N/A'}</p>
                    <p className="text-xs text-slate-500">{order.pickup_location?.city}, {order.pickup_location?.county}</p>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <div className="flex-1 h-px border-t border-dashed" />
                    <span className="text-xs">→</span>
                    <div className="flex-1 h-px border-t border-dashed" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Destination</p>
                    <p className="text-sm text-slate-700">{order.destination?.address || order.destination || 'N/A'}</p>
                    <p className="text-xs text-slate-500">{order.destination?.city}, {order.destination?.county}</p>
                  </div>
                </div>
                {order.distance && (
                  <div className="mt-3 flex items-center gap-4 text-sm text-slate-600">
                    <span>Distance: {order.distance} km</span>
                    <span>Duration: {order.duration || 'N/A'}</span>
                  </div>
                )}
              </div>

              {/* Parcel Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border border-slate-200 rounded-lg">
                <div>
                  <p className="text-xs text-slate-500">Weight</p>
                  <p className="text-sm font-medium">{order.weight ? `${order.weight}kg` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Category</p>
                  <p className="text-sm font-medium">{order.weight_category || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Price</p>
                  <p className="text-sm font-medium text-green-600">{formatPrice(order.price)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Updated</p>
                  <p className="text-sm font-medium">{formatDate(order.updated_at)}</p>
                </div>
              </div>

              {/* Tracking History */}
              {order.tracking_history && order.tracking_history.length > 0 && (
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="font-medium text-slate-900 flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-blue-600" />
                    Tracking History
                  </h4>
                  <div className="space-y-3">
                    {order.tracking_history.map((event, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className={`mt-1.5 h-2 w-2 rounded-full ${index === 0 ? 'bg-blue-600' : 'bg-slate-300'}`} />
                        <div>
                          <p className="text-sm font-medium text-slate-700">{event.status}</p>
                          <p className="text-xs text-slate-500">{event.location || ''}</p>
                          <p className="text-xs text-slate-400">{formatDate(event.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {order.notes && (
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="font-medium text-slate-900 mb-1">Notes</h4>
                  <p className="text-sm text-slate-600">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewOrderDetails;