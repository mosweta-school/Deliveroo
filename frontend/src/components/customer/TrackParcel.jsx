// pages/TrackParcel.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Navigation,
  Calendar,
  User,
  Phone,
  Mail,
  ArrowLeft,
  Copy,
  Check,
  XCircle
} from 'lucide-react';

const TrackParcel = () => {
  const [trackingId, setTrackingId] = useState('');
  const [parcelData, setParcelData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  // Mock parcel data for demonstration
  const mockParcelData = {
    id: 'SND-8942-019',
    status: 'In Transit',
    sender: 'Jane Doe',
    receiver: 'John Mwangi',
    pickup: 'Nairobi CBD',
    destination: 'Kisumu',
    weight: '2.5kg',
    category: '1-5kg',
    createdAt: '2026-09-28T10:00:00Z',
    estimatedDelivery: '2026-09-30T18:00:00Z',
    currentLocation: 'Nakuru',
    distance: '320 km',
    duration: '6 hours',
    price: 'KSh 1,300',
    trackingHistory: [
      {
        status: 'Order Created',
        timestamp: '2026-09-28T10:00:00Z',
        location: 'Nairobi CBD',
        description: 'Parcel order has been created and is awaiting pickup'
      },
      {
        status: 'Picked Up',
        timestamp: '2026-09-28T12:00:00Z',
        location: 'Nairobi CBD',
        description: 'Parcel has been picked up by courier'
      },
      {
        status: 'In Transit',
        timestamp: '2026-09-28T14:00:00Z',
        location: 'Nakuru',
        description: 'Parcel is currently in transit to destination'
      }
    ]
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!trackingId.trim()) {
      setError('Please enter a tracking ID');
      return;
    }

    setLoading(true);
    setError(null);

    // Simulate API call
    setTimeout(() => {
      if (trackingId.trim().toUpperCase() === 'SND-8942-019') {
        setParcelData(mockParcelData);
        setError(null);
      } else {
        setParcelData(null);
        setError('Parcel not found. Please check the tracking ID and try again.');
      }
      setLoading(false);
    }, 1000);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(trackingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusIcon = (status) => {
    const icons = {
      'Order Created': <Clock className="h-5 w-5 text-blue-500" />,
      'Picked Up': <Package className="h-5 w-5 text-orange-500" />,
      'In Transit': <Truck className="h-5 w-5 text-purple-500" />,
      'Delivered': <CheckCircle className="h-5 w-5 text-green-500" />,
      'Cancelled': <XCircle className="h-5 w-5 text-red-500" />
    };
    return icons[status] || <Clock className="h-5 w-5 text-slate-400" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      'Order Created': 'border-blue-500',
      'Picked Up': 'border-orange-500',
      'In Transit': 'border-purple-500',
      'Delivered': 'border-green-500',
      'Cancelled': 'border-red-500'
    };
    return colors[status] || 'border-slate-300';
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      'Order Created': 'bg-blue-100 text-blue-700',
      'Picked Up': 'bg-orange-100 text-orange-700',
      'In Transit': 'bg-purple-100 text-purple-700',
      'Delivered': 'bg-green-100 text-green-700',
      'Cancelled': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (estimatedDate) => {
    const now = new Date();
    const estimated = new Date(estimatedDate);
    const diff = estimated - now;
    
    if (diff < 0) return 'Delivered';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h remaining`;
    return `${hours}h remaining`;
  };

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Track Your Parcel
          </h1>
          <p className="text-slate-600 max-w-lg mx-auto">
            Enter your tracking ID to get real-time updates on your parcel's location
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                placeholder="Enter tracking ID (e.g., SND-8942-019)"
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Track Parcel'}
            </button>
          </form>
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Parcel Details */}
        {parcelData && (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Package className="h-6 w-6 text-blue-600" />
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        {parcelData.id}
                      </h2>
                      <p className="text-sm text-slate-500">
                        Created on {formatDate(parcelData.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(parcelData.status)}`}>
                      {parcelData.status}
                    </span>
                    <button
                      onClick={handleCopyId}
                      className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                      title="Copy tracking ID"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Route */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      Route
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-slate-600">{parcelData.pickup}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-px border-t-2 border-dashed border-slate-300" />
                        <Navigation className="h-3 w-3 text-slate-400" />
                      </div>
                      <span className="text-sm text-slate-600">{parcelData.destination}</span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Package className="h-4 w-4 text-blue-600" />
                      Details
                    </div>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>Weight: {parcelData.weight} ({parcelData.category})</p>
                      <p>Distance: {parcelData.distance}</p>
                      <p>Est. Delivery: {formatDate(parcelData.estimatedDelivery)}</p>
                      <p className="text-blue-600 font-medium">
                        {getTimeRemaining(parcelData.estimatedDelivery)}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Truck className="h-4 w-4 text-blue-600" />
                      Summary
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Base Fare</span>
                        <span className="text-slate-900 font-medium">KSh 500</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Distance Charge</span>
                        <span className="text-slate-900 font-medium">KSh 800</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-200">
                        <span className="font-semibold text-slate-900">Total</span>
                        <span className="font-bold text-blue-600">{parcelData.price}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Tracking History
                </h3>
              </div>
              <div className="p-6">
                <div className="relative">
                  {/* Vertical Line */}
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-200" />
                  
                  <div className="space-y-6">
                    {parcelData.trackingHistory.map((event, index) => (
                      <div key={index} className="relative pl-10">
                        {/* Timeline Dot */}
                        <div className={`absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 ${getStatusColor(event.status)} flex items-center justify-center`}>
                          {getStatusIcon(event.status)}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div>
                            <h4 className="font-medium text-slate-900">{event.status}</h4>
                            <p className="text-sm text-slate-600 mt-0.5">{event.description}</p>
                            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </p>
                          </div>
                          <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
                            {formatDate(event.timestamp)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      Sender
                    </h4>
                    <p className="text-slate-900">{parcelData.sender}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      Receiver
                    </h4>
                    <p className="text-slate-900">{parcelData.receiver}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 justify-center">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                Share Tracking
              </button>
              <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
                Download Receipt
              </button>
              <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
                Get Email Updates
              </button>
            </div>
          </div>
        )}

        {/* Example Tracking IDs */}
        {!parcelData && !error && (
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 mb-3">Try tracking with:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setTrackingId('SND-8942-019')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-slate-600 transition-colors font-mono"
              >
                SND-8942-019
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackParcel;