// components/StatCard.jsx
import React from 'react';

const StatCard = ({ title, value, icon: Icon, change, changeType, color }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    purple: 'text-purple-600 bg-purple-50',
    green: 'text-green-600 bg-green-50',
    cyan: 'text-cyan-600 bg-cyan-50'
  };

  const changeColor = changeType === 'increase' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-semibold font-mono text-slate-900 mt-2">{value}</p>
          {change && (
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full mt-2 ${changeColor}`}>
              {changeType === 'increase' ? '↑' : '↓'} {change}
            </span>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;