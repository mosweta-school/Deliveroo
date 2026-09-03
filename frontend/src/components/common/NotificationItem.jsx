// frontend/src/components/common/NotificationItem.jsx
import React from 'react';
import { 
  Package, Truck, CheckCircle, X, MapPin, 
  AlertCircle, Bell, User, Calendar, Clock,
  Eye, EyeOff, Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const NotificationItem = ({ 
  notification, 
  onMarkRead, 
  onDelete,
  showActions = true,
  compact = false 
}) => {
  const { id, title, message, type, is_read, created_at, parcel_id, data } = notification;

  // Get notification icon based on type
  const getIcon = () => {
    const icons = {
      'parcel_created': <Package className="h-5 w-5 text-blue-500" />,
      'parcel_picked_up': <Truck className="h-5 w-5 text-amber-500" />,
      'parcel_in_transit': <Truck className="h-5 w-5 text-purple-500" />,
      'parcel_delivered': <CheckCircle className="h-5 w-5 text-green-500" />,
      'parcel_cancelled': <X className="h-5 w-5 text-red-500" />,
      'rider_assigned': <User className="h-5 w-5 text-blue-500" />,
      'destination_updated': <MapPin className="h-5 w-5 text-amber-500" />,
      'admin_alert': <AlertCircle className="h-5 w-5 text-red-500" />,
      'rider_status_update': <User className="h-5 w-5 text-blue-500" />,
      'test': <Bell className="h-5 w-5 text-slate-500" />
    };
    return icons[type] || <Bell className="h-5 w-5 text-slate-400" />;
  };

  // Get background color based on read status
  const getBgColor = () => {
    return is_read ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/70 hover:bg-blue-50';
  };

  // Get border color based on type
  const getBorderColor = () => {
    const colors = {
      'parcel_created': 'border-blue-400',
      'parcel_picked_up': 'border-amber-400',
      'parcel_in_transit': 'border-purple-400',
      'parcel_delivered': 'border-green-400',
      'parcel_cancelled': 'border-red-400',
      'rider_assigned': 'border-blue-400',
      'destination_updated': 'border-amber-400',
      'admin_alert': 'border-red-400',
      'rider_status_update': 'border-blue-400'
    };
    return colors[type] || 'border-slate-300';
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get tracking link if parcel_id exists
  const getTrackingLink = () => {
    if (!parcel_id) return null;
    return `/track/${parcel_id}`;
  };

  if (compact) {
    return (
      <div 
        className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${getBorderColor()} ${getBgColor()} transition-colors cursor-pointer`}
        onClick={() => onMarkRead && onMarkRead(id)}
      >
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${is_read ? 'text-slate-700' : 'font-medium text-slate-900'}`}>
            {title}
          </p>
          <p className="text-xs text-slate-500 truncate">{message}</p>
          <p className="text-[10px] text-slate-400 mt-1">{formatTime(created_at)}</p>
        </div>
        {!is_read && (
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`
        relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-200
        ${getBgColor()}
        ${!is_read ? 'border-l-4 ' + getBorderColor() : 'border-slate-200'}
        hover:shadow-md
      `}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center
          ${is_read ? 'bg-slate-100' : 'bg-white shadow-sm'}
        `}>
          {getIcon()}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className={`text-sm ${is_read ? 'text-slate-700' : 'font-semibold text-slate-900'}`}>
              {title}
            </h4>
            <p className="text-sm text-slate-600 mt-0.5">{message}</p>
          </div>
          {!is_read && (
            <span className="flex-shrink-0">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded-full">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                New
              </span>
            </span>
          )}
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(created_at)}
          </span>
          
          {parcel_id && (
            <Link 
              to={`/track/${parcel_id}`}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              <Package className="h-3 w-3" />
              View Parcel
            </Link>
          )}

          {data?.tracking_number && (
            <span className="text-xs text-slate-400 font-mono">
              #{data.tracking_number}
            </span>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
            {!is_read && (
              <button
                onClick={() => onMarkRead && onMarkRead(id)}
                className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
              >
                <Eye className="h-3 w-3" />
                Mark as read
              </button>
            )}
            <button
              onClick={() => onDelete && onDelete(id)}
              className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;