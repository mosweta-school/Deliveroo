import React from 'react';

const CustomerDashboard = () => {
  // Mock data to hold the layout until we wire up Redux
  const recentOrders = [
    { id: 'SND-8942-019', route: 'NBI to KAM', status: 'In Transit', date: 'Sep 28, 2024', amount: 'Kes 1000' },
    { id: 'SND-4029-108', route: 'NBI to KAM', status: 'Delivered', date: 'Sep 24, 2024', amount: 'Kes 2000' },
    { id: 'SND-3910-821', route: 'NBI to KAM', status: 'Delivered', date: 'Sep 22, 2024', amount: 'Kes 3000' },
    { id: 'SND-7821-492', route: 'NBI to KAM', status: 'Pending', date: 'Sep 30, 2024', amount: 'Kes 2000' },
  ];

  return (
    <div className="dashboard-container p-6 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Welcome back, Jane</h1>
        <p className="text-gray-500">Track, manage, and dispatch local courier deliveries in real-time.</p>
      </header>

      {/* Stats Overview */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Active Deliveries</p>
          <h2 className="text-3xl font-bold">3</h2>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Completed Orders</p>
          <h2 className="text-3xl font-bold">48</h2>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Pending Confirmations</p>
          <h2 className="text-3xl font-bold">1</h2>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Spent (Q3)</p>
          <h2 className="text-3xl font-bold">Kes 8000</h2>
        </div>
      </section>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Recent Orders List */}
        <section className="flex-grow bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Recent Delivery Orders</h3>
            <button className="text-blue-600 text-sm hover:underline">View all</button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 border-b">
                <th className="pb-2 font-medium">Tracking #</th>
                <th className="pb-2 font-medium">Route</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-700">{order.id}</td>
                  <td className="py-3 text-gray-600">{order.route}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'In Transit' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">{order.date}</td>
                  <td className="py-3 font-medium">{order.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded transition-colors">
            New Delivery Order
          </button>
        </section>
      </div>
    </div>
  );
};

export default CustomerDashboard;