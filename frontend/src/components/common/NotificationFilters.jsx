// frontend/src/components/common/NotificationFilters.jsx
import React from 'react';
import { Search, Filter, Bell, BellOff, CheckAll, Trash2 } from 'lucide-react';

const NotificationFilters = ({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterChange,
  unreadOnly,
  onUnreadOnlyChange,
  onMarkAllRead,
  onDeleteAll,
  totalCount,
  unreadCount
}) => {
  const filterOptions = [
    { value: 'all', label: 'All', icon: Bell },
    { value: 'parcel', label: 'Parcels', icon: Package },
    { value: 'rider', label: 'Riders', icon: User },
    { value: 'admin', label: 'Admin', icon: AlertCircle },
    { value: 'system', label: 'System', icon: Settings }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {filterOptions.map((option) => {
              const Icon = option.icon;
              const isActive = filterType === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => onFilterChange(option.value)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5
                    ${isActive 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }
                  `}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {option.label}
                </button>
              );
            })}
          </div>

          {/* Unread Only Toggle */}
          <button
            onClick={() => onUnreadOnlyChange(!unreadOnly)}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5
              ${unreadOnly 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }
            `}
          >
            {unreadOnly ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
            Unread only
          </button>

          {/* Mark All Read */}
          <button
            onClick={onMarkAllRead}
            disabled={unreadCount === 0}
            className="px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <CheckAll className="h-3.5 w-3.5" />
            Mark all read
          </button>

          {/* Delete All */}
          <button
            onClick={onDeleteAll}
            disabled={totalCount === 0}
            className="px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear all
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
        <span>Total: <span className="font-medium text-slate-700">{totalCount}</span></span>
        <span>Unread: <span className="font-medium text-blue-600">{unreadCount}</span></span>
        {unreadCount > 0 && (
          <span className="text-blue-600">
            {unreadCount} notification{unreadCount > 1 ? 's' : ''} waiting
          </span>
        )}
      </div>
    </div>
  );
};

export default NotificationFilters;