// pages/Drivers.jsx
import React, { useState } from 'react';
import { Map, Truck, UserPlus, Search, Phone, Mail, Star, MoreVertical } from 'lucide-react';

const Drivers = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const drivers = [
    { id: 1, name: 'James Kamau', phone: '+254 712 345 678', email: 'james@deliveroo.com', vehicle: 'Toyota Hilux', plate: 'KBA 123A', status: 'Available', rating: 4.8, deliveries: 156 },
    { id: 2, name: 'Peter Oduor', phone: '+254 723 456 789', email: 'peter@deliveroo.com', vehicle: 'Nissan NV350', plate: 'KBV 456B', status: 'Delivering', rating: 4.6, deliveries: 134 },
    { id: 3, name: 'Mary Wanjiru', phone: '+254 734 567 890', email: 'mary@deliveroo.com', vehicle: 'Mitsubishi L300', plate: 'KCD 789C', status: 'Offline', rating: 4.9, deliveries: 189 },
    { id: 4, name: 'David Mwangi', phone: '+254 745 678 901', email: 'david@deliveroo.com', vehicle: 'Isuzu NKR', plate: 'KDE 012D', status: 'Delivering', rating: 4.5, deliveries: 98 },
  ];

  const getStatusColor = (status) => {
    const colors = {
      'Available': 'bg-green-100 text-green-700',
      'Delivering': 'bg-blue-100 text-blue-700',
      'Offline': 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-3">
          <Truck className="h-6 w-6 text-blue-600" />
          Drivers
        </h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add Driver
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-500">Total Drivers</p>
          <p className="text-2xl font-bold text-slate-900">24</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-500">Available</p>
          <p className="text-2xl font-bold text-green-600">8</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-500">Delivering</p>
          <p className="text-2xl font-bold text-blue-600">12</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-500">Avg. Rating</p>
          <p className="text-2xl font-bold text-amber-600">4.7 ⭐</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search drivers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {drivers.map((driver) => (
          <div key={driver.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                  {driver.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">{driver.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(driver.status)}`}>
                    {driver.status}
                  </span>
                </div>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="h-4 w-4 text-slate-400" />
                {driver.phone}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="h-4 w-4 text-slate-400" />
                {driver.email}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Truck className="h-4 w-4 text-slate-400" />
                {driver.vehicle} · {driver.plate}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-600">
                  <span className="font-medium text-slate-900">{driver.deliveries}</span> deliveries
                </span>
                <span className="flex items-center gap-1 text-sm text-amber-600">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  {driver.rating}
                </span>
              </div>
              <button className="text-blue-600 text-sm hover:underline">View Details</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Drivers;