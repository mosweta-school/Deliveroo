// frontend/src/components/admin/Analytics.jsx
import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Package, Clock, DollarSign, Users as UsersIcon, RefreshCw } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getStats();
      
      if (response.success) {
        setStats(response.stats);
      } else {
        setError('Failed to load analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const metrics = stats ? [
    { 
      title: 'Total Revenue', 
      value: `KSh ${(stats.total_revenue || 0).toLocaleString()}`, 
      change: '+12.5%', 
      type: 'increase', 
      icon: DollarSign 
    },
    { 
      title: 'Total Orders', 
      value: stats.total_orders?.toString() || '0', 
      change: '+8.3%', 
      type: 'increase', 
      icon: Package 
    },
    { 
      title: 'Active Deliveries', 
      value: stats.active_deliveries?.toString() || '0', 
      change: '+2.1%', 
      type: 'increase', 
      icon: Clock 
    },
    { 
      title: 'Total Users', 
      value: stats.total_users?.toString() || '0', 
      change: '+18', 
      type: 'increase', 
      icon: UsersIcon 
    }
  ] : [];

  // Status distribution for pie chart
  const statusData = stats ? [
    { name: 'Pending', value: stats.pending || 0 },
    { name: 'In Transit', value: stats.active_deliveries || 0 },
    { name: 'Delivered', value: stats.delivered_today || 0 },
    { name: 'Cancelled', value: stats.cancelled || 0 }
  ] : [];

  const COLORS = ['#F59E0B', '#2563EB', '#16A34A', '#DC2626'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchAnalytics}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          Analytics
        </h1>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 90 Days</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <Icon className="h-5 w-5 text-slate-400" />
                <span className={`text-xs font-medium ${metric.type === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
              <p className="text-sm text-slate-500">{metric.title}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-medium text-slate-900 mb-4">Revenue Overview</h3>
          <div className="h-64">
            {stats ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Mon', value: Math.round(stats.total_revenue || 0) * 0.15 },
                  { name: 'Tue', value: Math.round(stats.total_revenue || 0) * 0.2 },
                  { name: 'Wed', value: Math.round(stats.total_revenue || 0) * 0.1 },
                  { name: 'Thu', value: Math.round(stats.total_revenue || 0) * 0.25 },
                  { name: 'Fri', value: Math.round(stats.total_revenue || 0) * 0.12 },
                  { name: 'Sat', value: Math.round(stats.total_revenue || 0) * 0.08 },
                  { name: 'Sun', value: Math.round(stats.total_revenue || 0) * 0.1 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748B" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#64748B" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-400">No revenue data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-medium text-slate-900 mb-4">Order Status Distribution</h3>
          <div className="h-64">
            {statusData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-400">No order data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;