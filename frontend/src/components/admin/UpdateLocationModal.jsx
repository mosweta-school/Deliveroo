// frontend/src/components/admin/UpdateLocationModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  MapPin, 
  Truck, 
  AlertTriangle, 
  Check, 
  Clock,
  Package,
  Navigation,
  Search
} from 'lucide-react';
import { adminService } from '../../services/adminService';

const UpdateLocationModal = ({ isOpen, onClose, order, onSuccess }) => {
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentLocations, setRecentLocations] = useState([]);
  const inputRef = useRef(null);

  // Load recent locations from localStorage
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('recentLocations');
      if (saved) {
        try {
          setRecentLocations(JSON.parse(saved));
        } catch {
          setRecentLocations([]);
        }
      }
      // Focus the input when modal opens
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  // Common locations in Kenya
  const commonLocations = [
    { address: 'Nairobi CBD', city: 'Nairobi', county: 'Nairobi', lat: -1.2921, lng: 36.8219 },
    { address: 'Westlands', city: 'Nairobi', county: 'Nairobi', lat: -1.2676, lng: 36.8041 },
    { address: 'Kilimani', city: 'Nairobi', county: 'Nairobi', lat: -1.2914, lng: 36.7895 },
    { address: 'Upper Hill', city: 'Nairobi', county: 'Nairobi', lat: -1.3007, lng: 36.8172 },
    { address: 'Karen', city: 'Nairobi', county: 'Nairobi', lat: -1.3192, lng: 36.6948 },
    { address: 'Mombasa CBD', city: 'Mombasa', county: 'Mombasa', lat: -4.0435, lng: 39.6682 },
    { address: 'Kisumu CBD', city: 'Kisumu', county: 'Kisumu', lat: -0.1022, lng: 34.7617 },
    { address: 'Nakuru CBD', city: 'Nakuru', county: 'Nakuru', lat: -0.3031, lng: 36.0800 },
    { address: 'Eldoret CBD', city: 'Eldoret', county: 'Uasin Gishu', lat: 0.5143, lng: 35.2698 },
    { address: 'Thika Road', city: 'Nairobi', county: 'Kiambu', lat: -1.2199, lng: 36.8896 },
    { address: 'Langata', city: 'Nairobi', county: 'Nairobi', lat: -1.3576, lng: 36.7447 },
    { address: 'Ruiru', city: 'Ruiru', county: 'Kiambu', lat: -1.1540, lng: 36.9594 },
    { address: 'Ongata Rongai', city: 'Rongai', county: 'Kajiado', lat: -1.3965, lng: 36.7635 },
    { address: 'Syokimau', city: 'Syokimau', county: 'Machakos', lat: -1.3800, lng: 36.8700 },
    { address: 'Kitengela', city: 'Kitengela', county: 'Kajiado', lat: -1.4119, lng: 36.9749 },
  ];

  // Quick status messages
  const quickStatuses = [
    'Parcel picked up and on the way',
    'Arrived at sorting center',
    'Out for delivery',
    'Near destination',
    'Delayed due to traffic',
    'Reached local distribution center'
  ];

  // Handle input change with suggestions
  const handleInputChange = (value) => {
    setLocation(value);
    setError(null);

    if (value.length > 1) {
      const filtered = commonLocations.filter(loc =>
        loc.address.toLowerCase().includes(value.toLowerCase()) ||
        loc.city.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Select a suggestion
  const selectSuggestion = (loc) => {
    setLocation(loc.address);
    setShowSuggestions(false);
    setSuggestions([]);
    // Focus the input after selection
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Add to recent locations
  const addToRecent = (address) => {
    const updated = [address, ...recentLocations.filter(l => l !== address)].slice(0, 5);
    setRecentLocations(updated);
    localStorage.setItem('recentLocations', JSON.stringify(updated));
  };

  // Handle save location
  const handleSave = async () => {
    if (!location.trim()) {
      setError('Please enter a location');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const foundLocation = commonLocations.find(
        loc => loc.address.toLowerCase() === location.toLowerCase().trim()
      );

      const locationData = {
        address: location,
        city: foundLocation?.city || 'Nairobi',
        county: foundLocation?.county || 'Nairobi',
        latitude: foundLocation?.lat || null,
        longitude: foundLocation?.lng || null
      };

      const response = await adminService.updateParcelLocation(order.id, locationData);

      if (response.success) {
        addToRecent(location);
        if (onSuccess) onSuccess();
        onClose();
        alert(`✅ Parcel location updated to: ${location}`);
      } else {
        setError(response.message || 'Failed to update location');
      }
    } catch (err) {
      console.error('Error updating location:', err);
      setError(err.response?.data?.error || 'Failed to update location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        selectSuggestion(suggestions[0]);
      } else {
        handleSave();
      }
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="bg-white rounded-2xl max-w-md w-full mx-auto">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-500" />
            Update Current Location
          </h3>
        </div>

        {/* Order Info */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-blue-600">Tracking Number</p>
              <p className="font-mono font-medium text-blue-800">{order.tracking_number || order.id}</p>
            </div>
            <div>
              <p className="text-xs text-blue-600">Status</p>
              <p className="font-medium text-blue-800">{order.status}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-blue-600">Destination</p>
              <p className="font-medium text-blue-800">{order.destination?.address || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Current Location */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Current Location
          </label>
          <p className="text-slate-900 font-medium p-2 bg-slate-50 rounded-lg border border-slate-200">
            {order.current_location?.address || '📍 Not yet updated'}
          </p>
          {order.current_location?.address && (
            <p className="text-xs text-slate-400 mt-1">
              Last updated: {order.updated_at ? new Date(order.updated_at).toLocaleString() : 'N/A'}
            </p>
          )}
        </div>

        {/* New Location Input */}
        <div className="relative">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            New Location <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={location}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => {
                if (location.length > 1) {
                  setShowSuggestions(true);
                }
              }}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., Fedha Stage, Westlands, Thika Road..."
            />
          </div>

          {/* Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-lg max-h-48 overflow-y-auto">
              {suggestions.map((loc, index) => (
                <button
                  key={index}
                  onClick={() => selectSuggestion(loc)}
                  className="w-full px-4 py-2 text-left hover:bg-orange-50 transition-colors flex items-center gap-2 border-b border-slate-100 last:border-0"
                >
                  <MapPin className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{loc.address}</p>
                    <p className="text-xs text-slate-500">{loc.city}, {loc.county}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
        </div>

        {/* Quick Status Messages */}
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Quick Updates</p>
          <div className="flex flex-wrap gap-2">
            {quickStatuses.map((status, index) => (
              <button
                key={index}
                onClick={() => {
                  setLocation(status);
                  setShowSuggestions(false);
                }}
                className="px-3 py-1 bg-blue-50 hover:bg-blue-100 rounded-full text-xs text-blue-700 transition-colors border border-blue-200"
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Locations */}
        {recentLocations.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">Recent Locations</p>
            <div className="flex flex-wrap gap-2">
              {recentLocations.map((loc, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setLocation(loc);
                    setShowSuggestions(false);
                  }}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-xs text-slate-700 transition-colors"
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notification Info */}
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 flex items-center gap-2">
            <Check className="h-4 w-4" />
            Customer will be notified via email when location is updated.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !location.trim()}
            className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4" />
                Update Location
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateLocationModal;