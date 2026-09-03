// frontend/src/components/admin/CreateOrder.jsx
import React, { useState, useEffect } from 'react';
import { 
  User, 
  MapPin, 
  Package, 
  DollarSign, 
  Save,
  Search,
  AlertCircle,
  Check,
  Weight
} from 'lucide-react';
import { adminService } from '../../services/adminService';

const CreateOrder = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    pickup_address: '',
    pickup_city: '',
    pickup_county: '',
    pickup_latitude: '',
    pickup_longitude: '',
    destination_address: '',
    destination_city: '',
    destination_county: '',
    destination_latitude: '',
    destination_longitude: '',
    weight: '',
    weight_category: 'Medium',
    distance: '',
    notes: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const weightCategories = [
    { value: 'Light', label: 'Light (< 2kg)' },
    { value: 'Medium', label: 'Medium (2-5kg)' },
    { value: 'Heavy', label: 'Heavy (5-10kg)' },
    { value: 'Extra Heavy', label: 'Extra Heavy (10kg+)' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      // Reset form when opening
      setFormData({
        user_id: '',
        pickup_address: '',
        pickup_city: '',
        pickup_county: '',
        pickup_latitude: '',
        pickup_longitude: '',
        destination_address: '',
        destination_city: '',
        destination_county: '',
        destination_latitude: '',
        destination_longitude: '',
        weight: '',
        weight_category: 'Medium',
        distance: '',
        notes: ''
      });
      setSearchTerm('');
      setError(null);
      setSuccess(false);
      setShowUserDropdown(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const fetchUsers = async () => {
    try {
      const response = await adminService.getUsers();
      if (response.success) {
        setUsers(response.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase();
    return user.first_name?.toLowerCase().includes(search) ||
           user.last_name?.toLowerCase().includes(search) ||
           user.email?.toLowerCase().includes(search) ||
           user.phone_number?.toLowerCase().includes(search);
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUserSelect = (user) => {
    setFormData(prev => ({ ...prev, user_id: user.id }));
    setSearchTerm(`${user.first_name} ${user.last_name} (${user.email})`);
    setShowUserDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate
    if (!formData.user_id) {
      setError('Please select a customer');
      setLoading(false);
      return;
    }

    if (!formData.pickup_address || !formData.destination_address) {
      setError('Please fill in pickup and destination addresses');
      setLoading(false);
      return;
    }

    if (!formData.weight || !formData.weight_category) {
      setError('Please enter weight and select category');
      setLoading(false);
      return;
    }

    try {
      const parcelData = {
        user_id: formData.user_id,
        pickup_location: {
          address: formData.pickup_address,
          city: formData.pickup_city,
          county: formData.pickup_county,
          latitude: parseFloat(formData.pickup_latitude) || null,
          longitude: parseFloat(formData.pickup_longitude) || null
        },
        destination: {
          address: formData.destination_address,
          city: formData.destination_city,
          county: formData.destination_county,
          latitude: parseFloat(formData.destination_latitude) || null,
          longitude: parseFloat(formData.destination_longitude) || null
        },
        weight: parseFloat(formData.weight),
        weight_category: formData.weight_category,
        distance: parseFloat(formData.distance) || 100,
        notes: formData.notes || ''
      };

      const response = await adminService.createParcel(parcelData);
      
      if (response.success) {
        setSuccess(true);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(response.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      setError(error.response?.data?.message || 'Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">Order created successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <div className="border-b border-slate-200 pb-4">
          <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            Customer Information
          </h4>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Select Customer <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowUserDropdown(true);
                }}
                onFocus={() => setShowUserDropdown(true)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {showUserDropdown && searchTerm && filteredUsers.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-lg max-h-48 overflow-y-auto">
                  {filteredUsers.map(user => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleUserSelect(user)}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 transition-colors flex items-center gap-3"
                    >
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs">
                        {user.first_name?.[0]}{user.last_name?.[0] || ''}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {formData.user_id && (
              <div className="mt-2 p-2 bg-blue-50 rounded-lg flex items-center gap-2 text-sm text-blue-700">
                <User className="h-4 w-4" />
                Customer selected: {users.find(u => u.id === formData.user_id)?.first_name} {users.find(u => u.id === formData.user_id)?.last_name}
              </div>
            )}
          </div>
        </div>

        {/* Pickup Location */}
        <div className="border-b border-slate-200 pb-4">
          <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            Pickup Location
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="pickup_address"
                value={formData.pickup_address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter pickup address"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
              <input
                type="text"
                name="pickup_city"
                value={formData.pickup_city}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter city"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">County</label>
              <input
                type="text"
                name="pickup_county"
                value={formData.pickup_county}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter county"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Coordinates (Optional)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="pickup_latitude"
                  value={formData.pickup_latitude}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Latitude"
                />
                <input
                  type="text"
                  name="pickup_longitude"
                  value={formData.pickup_longitude}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Longitude"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Destination Location */}
        <div className="border-b border-slate-200 pb-4">
          <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-red-600" />
            Destination Location
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="destination_address"
                value={formData.destination_address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter destination address"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
              <input
                type="text"
                name="destination_city"
                value={formData.destination_city}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter city"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">County</label>
              <input
                type="text"
                name="destination_county"
                value={formData.destination_county}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter county"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Coordinates (Optional)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="destination_latitude"
                  value={formData.destination_latitude}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Latitude"
                />
                <input
                  type="text"
                  name="destination_longitude"
                  value={formData.destination_longitude}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Longitude"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Parcel Details */}
        <div className="border-b border-slate-200 pb-4">
          <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
            <Weight className="h-4 w-4 text-blue-600" />
            Parcel Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Weight (kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 2.5"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Weight Category <span className="text-red-500">*</span>
              </label>
              <select
                name="weight_category"
                value={formData.weight_category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {weightCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Distance (km)
              </label>
              <input
                type="number"
                step="1"
                name="distance"
                value={formData.distance}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 320"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <input
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any special instructions"
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-blue-600" />
            Order Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-slate-500">Weight</p>
              <p className="font-medium">{formData.weight || '—'} kg</p>
            </div>
            <div>
              <p className="text-slate-500">Category</p>
              <p className="font-medium">{formData.weight_category || '—'}</p>
            </div>
            <div>
              <p className="text-slate-500">Distance</p>
              <p className="font-medium">{formData.distance || '—'} km</p>
            </div>
            <div>
              <p className="text-slate-500">Estimated Price</p>
              <p className="font-medium text-blue-600">
                {formData.weight && formData.distance ? 
                  `KSh ${(500 + (parseFloat(formData.weight) * 200) + (parseFloat(formData.distance) * 5)).toLocaleString()}` : 
                  '—'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || success}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Create Order
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateOrder;