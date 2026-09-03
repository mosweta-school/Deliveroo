// frontend/src/components/admin/Users.jsx
import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Search, UserPlus, Mail, Phone, Calendar, MoreVertical, RefreshCw } from 'lucide-react';
import { adminService } from '../../services/adminService';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getUsers();
      
      if (response.success) {
        setUsers(response.users || []);
      } else {
        setError('Failed to load users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase();
    return user.first_name?.toLowerCase().includes(search) ||
           user.last_name?.toLowerCase().includes(search) ||
           user.email?.toLowerCase().includes(search) ||
           user.phone_number?.toLowerCase().includes(search);
  });

  // Calculate stats
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active' || !u.status).length,
    suspended: users.filter(u => u.status === 'suspended').length,
    admins: users.filter(u => u.role === 'admin').length,
    customers: users.filter(u => u.role === 'customer' || !u.role).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchUsers}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-3">
          <UsersIcon className="h-6 w-6 text-blue-600" />
          Users
          <span className="text-sm font-normal text-slate-500">
            ({stats.total} total)
          </span>
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-500">Total Users</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-500">Admins</p>
          <p className="text-2xl font-bold text-blue-600">{stats.admins}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-500">Customers</p>
          <p className="text-2xl font-bold text-purple-600">{stats.customers}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search users by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        />
      </div>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <UsersIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No users found</p>
          <p className="text-sm text-gray-400">Try adjusting your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                    {user.first_name?.[0]}{user.last_name?.[0] || ''}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">{user.first_name} {user.last_name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${user.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {user.status || 'Active'}
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
                  {user.phone_number || 'N/A'}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  Joined {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  <span className="font-medium text-slate-900">{user.role || 'customer'}</span>
                </span>
                <button className="text-blue-600 text-sm hover:underline">View Profile</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Users;