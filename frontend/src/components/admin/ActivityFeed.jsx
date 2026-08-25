// components/ActivityFeed.jsx
import React from 'react';
import { Activity, MapPin } from 'lucide-react';

const ActivityFeed = ({ activities }) => {
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
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${statusColors[activity.color]}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-800">
                <span className="font-medium">{activity.parcel}</span>
                <span className={`ml-1 font-medium ${statusTextColors[activity.color]}`}>
                  {activity.status}
                </span>
                {activity.location && (
                  <span className="text-slate-600"> · {activity.location}</span>
                )}
              </p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {activity.time}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Map placeholder */}
      <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
        <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
          <MapPin className="h-4 w-4 text-blue-600" />
          <span className="font-medium">12 active drivers</span>
        </div>
        <div className="flex justify-center gap-4 mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
            3 delivered
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 bg-purple-600 rounded-full"></span>
            5 in transit
          </span>
        </div>
      </div>
    </div>
  );
};

export default ActivityFeed;