import React, { useState } from 'react';

const OrderDetails = () => {
  // Mock order state
  const [order, setOrder] = useState({
    id: 'SND-8942-019',
    status: 'In Transit', // Try changing to 'Delivered' to test button locking
    courier: 'Samson Morara',
    pickup: 'Quickmart Moi Avenue',
    destination: 'Nyayo Estate Embakasi Gate D',
    eta: '3:15 PM',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [newDestination, setNewDestination] = useState(order.destination);

  const isDelivered = order.status === 'Delivered' || order.status === 'Cancelled';

  const handleDestinationUpdate = (e) => {
    e.preventDefault();
    setOrder({ ...order, destination: newDestination });
    setIsEditing(false);
    alert('Destination updated successfully!');
  };

  const handleCancelOrder = () => {
    if (window.confirm('Are you sure you want to cancel this delivery order?')) {
      setOrder({ ...order, status: 'Cancelled' });
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Track Parcel</h1>
          <p className="text-sm text-gray-500">Tracking #: <span className="font-mono font-semibold">{order.id}</span></p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
          order.status === 'In Transit' ? 'bg-blue-100 text-blue-700' :
          order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {order.status}
        </span>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Google Map Section */}
        <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between min-h-[400px]">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-green-600 uppercase tracking-wide">&#x25CF; Live Route Tracker</span>
            <span className="text-xs text-gray-400">TRK: {order.id}</span>
          </div>
          
          {/* Map Placeholder */}
          <div className="bg-slate-100 rounded-lg h-80 flex items-center justify-center border border-dashed border-slate-300 relative overflow-hidden">
            <p className="text-gray-400 text-sm font-medium">Google Map View (Pickup &#x2192; Destination)</p>
          </div>
        </div>

        {/* Shipment Details & Timeline Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Active Shipment</h3>
            <h2 className="text-xl font-bold text-gray-800 mb-4">{order.id}</h2>

            {/* Courier info */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                SM
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{order.courier}</p>
                <p className="text-xs text-gray-500">Verified Deliveroo Courier</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4 border-l-2 border-blue-500 ml-3 pl-4 text-sm mb-6">
              <div>
                <p className="font-semibold text-gray-800">In Transit</p>
                <p className="text-xs text-gray-400">On the way with courier</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">Picked Up</p>
                <p className="text-xs text-gray-400">Courier picked up parcel</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">Order Placed</p>
                <p className="text-xs text-gray-400">Delivery request registered</p>
              </div>
            </div>

            {/* Actions: Edit Destination & Cancel */}
            <div className="space-y-2 pt-4 border-t border-gray-100">
              <button 
                onClick={() => setIsEditing(true)}
                disabled={isDelivered}
                className="w-full py-2.5 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Change Destination
              </button>
              <button 
                onClick={handleCancelOrder}
                disabled={isDelivered}
                className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel Order
              </button>
              {isDelivered && (
                <p className="text-xs text-amber-600 text-center mt-1">
                  Order status is final and cannot be modified.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Destination Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold mb-4">Change Delivery Destination</h3>
            <form onSubmit={handleDestinationUpdate}>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Delivery Address</label>
              <input 
                type="text" 
                value={newDestination}
                onChange={(e) => setNewDestination(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 text-sm mb-4 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <div className="flex justify-end space-x-2">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;