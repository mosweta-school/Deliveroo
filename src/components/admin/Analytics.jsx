// pages/Analytics.jsx
import React from 'react';
import { BarChart3, TrendingUp, TrendingDown, Package, Clock, DollarSign, Users as UsersIcon } from 'lucide-react';

const Analytics = () => {
  const metrics = [
    { title: 'Total Revenue', value: 'KSh 1,284,000', change: '+12.5%', type: 'increase', icon: DollarSign },
    { title: 'Avg. Delivery Time', value: '42 min', change: '-8.3%', type: 'decrease', icon: Clock },
    { title: 'Completion Rate', value: '94.7%', change: '+2.1%', type: 'increase', icon: Package },
    { title: 'Active Users', value: '298', change: '+18', type: 'increase', icon: UsersIcon },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          Analytics
        </h1>
        <select className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-sm">
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
          <option>Last 90 Days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <metric.icon className="h-5 w-5 text-slate-400" />
              <span className={`text-xs font-medium ${metric.type === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                {metric.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
            <p className="text-sm text-slate-500">{metric.title}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-medium text-slate-900 mb-4">Revenue Overview</h3>
          <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200 border-dashed">
            <p className="text-slate-400">Revenue Chart Coming Soon</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-medium text-slate-900 mb-4">Order Distribution</h3>
          <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200 border-dashed">
            <p className="text-slate-400">Distribution Chart Coming Soon</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;