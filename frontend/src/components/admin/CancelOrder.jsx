// frontend/src/components/admin/CancelOrder.jsx
import React, { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { adminService } from '../../services/adminService';

const CancelOrder = ({ isOpen, order, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reason, setReason] = useState('');

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await adminService.updateParcelStatus(order.id, {
        status: 'Cancelled',
        remarks: reason || 'Cancelled by admin'
      });

      if (response.success) {
        if (onSuccess) onSuccess();
        onClose();
        alert('Order cancelled successfully!');
      } else {
        setError(response.message || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      setError('Failed to cancel order. Please try again.');
    } finally {
      setLoading(false);
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
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-6 w-6" />
                Cancel Order
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="font-medium text-red-800">Are you sure?</p>
              <p className="text-sm text-red-700">
                This will permanently cancel order <span className="font-mono font-semibold">{order.tracking_number || order.id}</span>.
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 space-y-1 mb-4">
              <p className="text-sm text-slate-600">
                <span className="font-medium">Customer:</span> {order.user?.full_name || order.sender || 'N/A'}
              </p>
              <p className="text-sm text-slate-600">
                <span className="font-medium">Status:</span> {order.status}
              </p>
              <p className="text-sm text-slate-600">
                <span className="font-medium">Amount:</span> {formatPrice(order.price)}
              </p>
              <p className="text-sm text-slate-600">
                <span className="font-medium">Route:</span> {order.pickup_location?.address || order.pickup || 'N/A'} → {order.destination?.address || order.destination || 'N/A'}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Cancellation Reason
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  placeholder="Why are you cancelling this order?"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
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
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelOrder;