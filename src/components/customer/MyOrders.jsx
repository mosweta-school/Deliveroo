import React from 'react';

const MyOrders = () => {
  // Mock data mimicking the database fetch for the UI
  const orders = [
    { id: 'SND-8942-019', from: 'Nakuru', to: 'Naivasha', status: 'In Transit', date: 'Sep 28, 2024', weight: '2.4 kg', amount: 'Kes 3000' },
    { id: 'SND-4029-108', from: 'Nairobi', to: 'Narok', status: 'Delivered', date: 'Sep 24, 2024', weight: '4.8 kg', amount: 'Kes 4000' },
    { id: 'SND-3910-821', from: 'Nairobi', to: 'Naivasha', status: 'Delivered', date: 'Sep 22, 2024', weight: '1.2 kg', amount: 'Kes 3000' },
    { id: 'SND-7821-492', from: 'Kisumu', to: 'Kakamega', status: 'Pending', date: 'Sep 30, 2024', weight: '5.1 kg', amount: 'Kes 2000' },
    { id: 'SND-1204-583', from: 'Kisumu', to: 'Eldoret', status: 'Cancelled', date: 'Sep 19, 2024', weight: '0.8 kg', amount: 'Kes 3000' },
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case 'In Transit': return 'bg-blue-100 text-blue-700';
      case 'Delivered': return 'bg-green-100 text-green-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
      </header>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        {/* Top Controls: Tabs and Search */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium">All</button>
            <button className="px-4 py-2 border border-gray-300 text-gray-600 rounded text-sm font-medium hover:bg-gray-50 transition-colors">Pending</button>
            <button className="px-4 py-2 border border-gray-300 text-gray-600 rounded text-sm font-medium hover:bg-gray-50 transition-colors">In Transit</button>
            <button className="px-4 py-2 border border-gray-300 text-gray-600 rounded text-sm font-medium hover:bg-gray-50 transition-colors">Delivered</button>
            <button className="px-4 py-2 border border-gray-300 text-gray-600 rounded text-sm font-medium hover:bg-gray-50 transition-colors">Cancelled</button>
          </div>
          <div className="w-full md:w-72">
            <input 
              type="text" 
              placeholder="Search tracking # or city..." 
              className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-400 border-b border-gray-200">
                <th className="pb-3 font-medium whitespace-nowrap">Tracking #</th>
                <th className="pb-3 font-medium">Route Map</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Weight</th>
                <th className="pb-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="py-4 font-medium text-gray-800">{order.id}</td>
                  <td className="py-4">
                    <div className="flex items-center text-sm">
                      <span className="text-blue-600 font-medium">&#x2022; {order.from}</span>
                      <span className="text-gray-300 mx-2 tracking-widest">------</span>
                      <span className="text-green-600 font-medium">&#x2022; {order.to}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${getStatusStyle(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 text-gray-500 text-sm">{order.date}</td>
                  <td className="py-4 text-gray-500 text-sm">{order.weight}</td>
                  <td className="py-4 font-medium text-gray-800">{order.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100 text-sm text-gray-500">
          <span>Showing 5 of 12 orders</span>
          <div className="flex space-x-1">
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">Previous</button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded">1</button>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">2</button>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyOrders;