// pages/Orders.jsx
import React, { useState } from 'react';
import { Search, Filter, Eye, Edit, Trash2, Package, Plus } from 'lucide-react';

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const orders = [
    { id: 'SND-8942-019', sender: 'John Mwangi', route: 'NBI to KAM', weight: '2.5kg', status: 'In Transit', date: 'Sep 28, 2024', amount: 'KSh 1,000' },
    { id: 'SND-4029-108', sender: 'Mary Wanjiru', route: 'NBI to MSA', weight: '5kg', status: 'Delivered', date: 'Sep 24, 2024', amount: 'KSh 2,000' },
    { id: 'SND-3910-821', sender: 'Peter Ochieng', route: 'KAM to NBI', weight: '1kg', status: 'Delivered', date: 'Sep 22, 2024', amount: 'KSh 3,000' },
    { id: 'SND-7821-492', sender: 'Grace Akinyi', route: 'NBI to KIS', weight: '10kg+', status: 'Pending', date: 'Sep 30, 2024', amount: 'KSh 2,000' },
    { id: 'SND-3456-789', sender: 'David Kamau', route: 'NBI to ELD', weight: '3kg', status: 'In Transit', date: 'Oct 1, 2024', amount: 'KSh 1,500' },
  ];

  const getStatusColor = (status) => {
    const colors = {
      'Delivered': 'bg-green-100 text-green-700',
      'In Transit': 'bg-blue-100 text-blue-700',
      'Pending': 'bg-yellow-100 text-yellow-700',
      'Cancelled': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.sender.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-3">
          <Package className="h-6 w-6 text-blue-600" />
          Orders
        </h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Order
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="all">All Status</option>
          <option value="Pending">Pending</option>
          <option value="In Transit">In Transit</option>
          <option value="Delivered">Delivered</option>
        </select>
        <button className="px-4 py-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Sender</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Route</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm font-medium text-slate-900">{order.id}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{order.sender}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{order.route}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{order.date}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{order.amount}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-600 transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;