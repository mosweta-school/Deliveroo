// frontend/src/components/admin/Drivers.jsx
import React, { useState, useEffect } from 'react';
import { 
  Map, 
  Truck, 
  UserPlus, 
  Search, 
  Phone, 
  Mail, 
  Star, 
  MoreVertical, 
  RefreshCw,
  X,
  AlertCircle,
  Check, 
  Clock
} from 'lucide-react';
import { adminService } from '../../services/adminService';

// Modal component for driver details
const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={handleBackdropClick}>
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        <div 
          className={`inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full ${maxWidth} relative z-50`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [updating, setUpdating] = useState(false);

  const statusOptions = ['Available', 'Delivering', 'Offline', 'On Break'];

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getCouriers();
      
      if (response.success) {
        setDrivers(response.drivers || []);
      } else {
        setError('Failed to load drivers');
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setError('Failed to load drivers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDrivers();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Available': 'bg-green-100 text-green-700 border-green-200',
      'Delivering': 'bg-blue-100 text-blue-700 border-blue-200',
      'Offline': 'bg-gray-100 text-gray-700 border-gray-200',
      'On Break': 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'Available': <Check className="h-3 w-3" />,
      'Delivering': <Truck className="h-3 w-3" />,
      'Offline': <X className="h-3 w-3" />,
      'On Break': <Clock className="h-3 w-3" />
    };
    return icons[status] || null;
  };

  const handleViewDetails = (driver) => {
    setSelectedDriver(driver);
    setShowDetailsModal(true);
  };

  const handleUpdateStatus = (driver) => {
    setSelectedDriver(driver);
    setStatusUpdate(driver.status || 'Available');
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdate) {
      setError('Please select a status');
      return;
    }

    try {
      setUpdating(true);
      setError(null);
      const response = await adminService.updateDriverStatus(selectedDriver.id, {
        status: statusUpdate
      });

      if (response.success) {
        await fetchDrivers();
        setShowStatusModal(false);
        alert('Driver status updated successfully!');
      } else {
        setError(response.message || 'Failed to update driver status');
      }
    } catch (error) {
      console.error('Error updating driver status:', error);
      setError('Failed to update driver status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const filteredDrivers = drivers.filter(driver => {
    const search = searchTerm.toLowerCase();
    return driver.first_name?.toLowerCase().includes(search) ||
           driver.last_name?.toLowerCase().includes(search) ||
           driver.email?.toLowerCase().includes(search) ||
           driver.phone_number?.toLowerCase().includes(search);
  });

  const stats = {
    total: drivers.length,
    available: drivers.filter(d => d.status === 'Available').length,
    delivering: drivers.filter(d => d.status === 'Delivering').length,
    offline: drivers.filter(d => d.status === 'Offline' || !d.status).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading drivers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchDrivers}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-3">
            <Truck className="h-6 w-6 text-blue-600" />
            Drivers
            <span className="text-sm font-normal text-slate-500">
              ({stats.total} total)
            </span>
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Driver
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-500">Total Drivers</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-500">Available</p>
            <p className="text-2xl font-bold text-green-600">{stats.available}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-500">Delivering</p>
            <p className="text-2xl font-bold text-blue-600">{stats.delivering}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-500">Offline</p>
            <p className="text-2xl font-bold text-gray-600">{stats.offline}</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search drivers by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
          <button className="px-4 py-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Map className="h-4 w-4" />
            View Map
          </button>
        </div>

        {/* Drivers List */}
        {filteredDrivers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No drivers found</p>
            <p className="text-sm text-gray-400">Try adjusting your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDrivers.map((driver) => (
              <div key={driver.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                      {driver.first_name?.[0]}{driver.last_name?.[0] || ''}
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">{driver.first_name} {driver.last_name}</h3>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(driver.status || 'Offline')}`}>
                        {getStatusIcon(driver.status || 'Offline')}
                        {driver.status || 'Offline'}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleViewDetails(driver)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {driver.phone_number || 'N/A'}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="h-4 w-4 text-slate-400" />
                    {driver.email || 'N/A'}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Truck className="h-4 w-4 text-slate-400" />
                    {driver.vehicle || 'Not assigned'} · {driver.plate || ''}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-sm text-slate-600">
                    <span className="font-medium text-slate-900">{driver.deliveries || 0}</span> deliveries
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleUpdateStatus(driver)}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      Update Status
                    </button>
                    <button 
                      onClick={() => handleViewDetails(driver)}
                      className="text-purple-600 text-sm hover:underline"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedDriver(null);
        }}
        title="Driver Details"
        maxWidth="max-w-2xl"
      >
        {selectedDriver && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-2xl">
                {selectedDriver.first_name?.[0]}{selectedDriver.last_name?.[0] || ''}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">{selectedDriver.first_name} {selectedDriver.last_name}</h3>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedDriver.status || 'Offline')}`}>
                  {getStatusIcon(selectedDriver.status || 'Offline')}
                  {selectedDriver.status || 'Offline'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Email</p>
                <p className="font-medium">{selectedDriver.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Phone</p>
                <p className="font-medium">{selectedDriver.phone_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Vehicle</p>
                <p className="font-medium">{selectedDriver.vehicle || 'Not assigned'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Plate Number</p>
                <p className="font-medium">{selectedDriver.plate || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Deliveries</p>
                <p className="font-medium">{selectedDriver.deliveries || 0}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Rating</p>
                <p className="font-medium flex items-center gap-1">
                  {selectedDriver.rating || 'N/A'}
                  {selectedDriver.rating && <Star className="h-4 w-4 fill-amber-500 text-amber-500" />}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Joined</p>
                <p className="font-medium">
                  {selectedDriver.created_at ? new Date(selectedDriver.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex gap-2">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleUpdateStatus(selectedDriver);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Update Status
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Update Status Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedDriver(null);
          setStatusUpdate('');
          setError(null);
        }}
        title="Update Driver Status"
        maxWidth="max-w-md"
      >
        {selectedDriver && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-slate-700">
                <span className="font-medium">Driver:</span> {selectedDriver.first_name} {selectedDriver.last_name}
              </p>
              <p className="text-sm text-slate-700">
                <span className="font-medium">Current Status:</span> {selectedDriver.status || 'Offline'}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                New Status <span className="text-red-500">*</span>
              </label>
              <select
                value={statusUpdate}
                onChange={(e) => setStatusUpdate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Status...</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedDriver(null);
                  setStatusUpdate('');
                  setError(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={updating}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  'Update Status'
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default Drivers;