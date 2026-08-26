// pages/Users.jsx
import React, { useState } from 'react';
import { Users as UsersIcon, Search, UserPlus, Mail, Phone, Calendar, MoreVertical } from 'lucide-react';

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const users = [
    { id: 1, name: 'John Mwangi', email: 'john@email.com', phone: '+254 712 345 678', joinDate: 'Jan 15, 2024', orders: 45, status: 'Active' },
    { id: 2, name: 'Mary Wanjiru', email: 'mary@email.com', phone: '+254 723 456 789', joinDate: 'Feb 20, 2024', orders: 32, status: 'Active' },
    { id: 3, name: 'Peter Ochieng', email: 'peter@email.com', phone: '+254 734 567 890', joinDate: 'Mar 10, 2024', orders: 28, status: 'Active' },
    { id: 4, name: 'Grace Akinyi', email: 'grace@email.com', phone: '+254 745 678 901', joinDate: 'Apr 5, 2024', orders: 15, status: 'Suspended' },
    { id: 5, name: 'David Kamau', email: 'david@email.com', phone: '+254 756 789 012', joinDate: 'May 12, 2024', orders: 8, status: 'Active' },
  ];

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-3">
          <UsersIcon className="h-6 w-6 text-blue-600" />
          Users
        </h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add User
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-500">Total Users</p>
          <p className="text-2xl font-bold text-slate-900">342</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-500">Active Users</p>
          <p className="text-2xl font-bold text-green-600">298</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-500">Suspended</p>
          <p className="text-2xl font-bold text-red-600">44</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-500">New This Month</p>
          <p className="text-2xl font-bold text-blue-600">18</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">{user.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.status}
                  </span>
                </div>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="h-4 w-4 text-slate-400" />
                {user.email}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="h-4 w-4 text-slate-400" />
                {user.phone}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="h-4 w-4 text-slate-400" />
                Joined {user.joinDate}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-sm text-slate-600">
                <span className="font-medium text-slate-900">{user.orders}</span> orders
              </span>
              <button className="text-blue-600 text-sm hover:underline">View Profile</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Users;