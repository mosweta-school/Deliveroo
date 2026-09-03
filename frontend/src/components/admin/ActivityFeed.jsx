// frontend/src/components/admin/ActivityFeed.jsx
import React from 'react';
import { Activity, MapPin } from 'lucide-react';

const ActivityFeed = ({ activities, loading = false }) => {
  const statusColors = {
    green: 'bg-green-500',
    purple: 'bg-purple-600',
    orange: 'bg-amber-500',
    blue: 'bg-blue-600',
    gray: 'bg-slate-400'
  };

  const statusTextColors = {
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-amber-600',
    blue: 'text-blue-600',
    gray: 'text-slate-500'
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-slate-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-amber-500" />
            Real-Time Activity
          </h3>
          <span className="flex items-center gap-1.5 text-xs text-green-600">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            live
          </span>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="w-2 h-2 rounded-full mt-2 bg-slate-200 animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2 mt-1 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-slate-900 flex items-center gap-2">
          <Activity className="h-5 w-5 text-amber-500" />
          Real-Time Activity
        </h3>
        <span className="flex items-center gap-1.5 text-xs text-green-600">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          live
        </span>
      </div>
      
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
        {activities && activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className="flex gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${statusColors[activity.color] || 'bg-blue-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800">
                  <span className="font-medium">{activity.parcel || 'Unknown'}</span>
                  <span className={`ml-1 font-medium ${statusTextColors[activity.color] || 'text-blue-600'}`}>
                    {activity.status}
                  </span>
                  {activity.location && (
                    <span className="text-slate-600"> · {activity.location}</span>
                  )}
                </p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {activity.time || 'Just now'}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Activity className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No recent activity</p>
          </div>
        )}
      </div>
      
      {/* Map placeholder */}
      <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
        <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
          <MapPin className="h-4 w-4 text-blue-600" />
          <span className="font-medium">Active drivers</span>
        </div>
        <div className="flex justify-center gap-4 mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
            Delivered
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 bg-purple-600 rounded-full"></span>
            In transit
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 bg-amber-500 rounded-full"></span>
            Pending
          </span>
        </div>
      </div>
    </div>
  );
};

export default ActivityFeed;