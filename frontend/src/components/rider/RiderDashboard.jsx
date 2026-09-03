// frontend/src/components/rider/RiderDashboard.jsx
import React, { useState, useEffect } from 'react';
import RiderDeliveryMap from './RiderDeliveryMap';
import { 
  Truck, 
  Package, 
  MapPin, 
  CheckCircle, 
  Clock, 
  User,
  LogOut,
  Menu,
  X,
  Home,
  Settings,
  RefreshCw,
  Navigation,
  Phone,
  Mail,
  Star,
  Calendar,
  TrendingUp,
  Award,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { riderService } from '../../services/riderService';
import { authService } from '../../services/authService';
import { socketService } from '../../services/socketService';
import LocationTracker from './LocationTracker';
// Add to navItems in the sidebar
import { Bell } from 'lucide-react';


const RiderDashboard = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [actionType, setActionType] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState({ 
    address: '', 
    city: '', 
    county: '' 
  });
  const [updating, setUpdating] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileForm, setProfileForm] = useState({
    vehicle: '',
    plate: '',
    phone_number: '',
    status: 'Available'
  });

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    fetchDashboard();
    
    // Connect socket for real-time updates
    socketService.connect();
    
    return () => {
      // Don't disconnect globally
    };
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await riderService.getDashboard();
      if (response.success) {
        setDashboardData(response);
        if (response.rider) {
          setProfileForm({
            vehicle: response.rider.vehicle || '',
            plate: response.rider.plate || '',
            phone_number: response.rider.phone_number || '',
            status: response.rider.status || 'Available'
          });
        }
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setError('Failed to load dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  const handleAction = (parcel, action) => {
    setSelectedParcel(parcel);
    setActionType(action);
    setShowActionModal(true);
    setDeliveryLocation({ address: '', city: '', county: '' });
  };

  const handleActionConfirm = async () => {
    setUpdating(true);
    try {
      let response;
      if (actionType === 'pickup') {
        response = await riderService.pickupParcel(selectedParcel.id);
      } else if (actionType === 'transit') {
        response = await riderService.updateStatus(selectedParcel.id, {
          status: 'In Transit',
          remarks: 'Parcel is in transit'
        });
      } else if (actionType === 'deliver') {
        response = await riderService.deliverParcel(selectedParcel.id, {
          address: deliveryLocation.address,
          city: deliveryLocation.city,
          county: deliveryLocation.county,
          remarks: 'Parcel delivered successfully'
        });
      }

      if (response.success) {
        await fetchDashboard();
        setShowActionModal(false);
        alert(`${actionType === 'pickup' ? 'Picked up' : actionType === 'deliver' ? 'Delivered' : 'Status updated'} successfully!`);
      } else {
        alert(response.message || 'Action failed');
      }
    } catch (error) {
      console.error('Error performing action:', error);
      alert(error.response?.data?.error || 'Failed to perform action. Please try again.');
    } finally {
      setUpdating(false);
    }
  };
const [mapRouteData, setMapRouteData] = useState(null);

  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      const response = await riderService.updateProfile(profileForm);
      if (response.success) {
        setProfile(response.rider);
        setShowProfileForm(false);
        await fetchDashboard();
        alert('Profile updated successfully!');
      } else {
        alert(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Available': 'bg-green-100 text-green-700',
      'Delivering': 'bg-blue-100 text-blue-700',
      'On Break': 'bg-yellow-100 text-yellow-700',
      'Offline': 'bg-gray-100 text-gray-700'
    };
    return badges[status] || badges['Offline'];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchDashboard}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { stats, active_deliveries = [], completed_deliveries = [], rider } = dashboardData || {};
  const statusColor = getStatusBadge(rider?.status || 'Offline');

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-white border-r border-slate-200 z-40
        transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:w-20 xl:w-64
        ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 lg:translate-x-0'}
      `}>
        <div className="flex items-center gap-3 px-4 py-6 border-b border-slate-200">
          <Truck className="h-8 w-8 text-blue-600 flex-shrink-0" />
          <span className="hidden xl:inline font-bold text-xl text-blue-600">Rider</span>
          <span className="xl:hidden font-bold text-xl text-blue-600">R</span>
        </div>

        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-200">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold text-sm flex-shrink-0">
            {currentUser?.first_name?.[0]}{currentUser?.last_name?.[0] || ''}
          </div>
          <div className="hidden xl:block flex-1">
            <div className="text-sm font-medium text-slate-900">{currentUser?.full_name}</div>
            <div className="text-xs text-slate-500">Rider</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <button
            onClick={() => { setActivePage('dashboard'); setIsMobileOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
              activePage === 'dashboard' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Home className="h-5 w-5 flex-shrink-0" />
            <span className="hidden xl:inline text-sm">Dashboard</span>
          </button>
          <button
            onClick={() => { setActivePage('profile'); setIsMobileOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
              activePage === 'profile' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <User className="h-5 w-5 flex-shrink-0" />
            <span className="hidden xl:inline text-sm">Profile</span>
          </button>
          
            <button
            onClick={() => { setActivePage('notifications'); setIsMobileOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
            activePage === 'notifications' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
            >
            <Bell className="h-5 w-5 flex-shrink-0" />
            <span className="hidden xl:inline text-sm">Notifications</span>
            </button>
        </nav>

        <div className="border-t border-slate-200 p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className="hidden xl:inline text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Hamburger */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-slate-200"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
        {activePage === 'dashboard' ? (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-3">
                  <Truck className="h-6 w-6 text-blue-600" />
                  Rider Dashboard
                  <span className={`text-xs px-3 py-1 rounded-full ${statusColor}`}>
                    {rider?.status || 'Offline'}
                  </span>
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage your deliveries and track your performance
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                <LocationTracker riderId={currentUser?.id} enabled={true} />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">Active Deliveries</p>
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats?.active_deliveries || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">Completed</p>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats?.completed_deliveries || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">Total Deliveries</p>
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-purple-600 mt-1">{stats?.total_deliveries || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">Rating</p>
                  <Star className="h-5 w-5 text-amber-500" />
                </div>
                <p className="text-2xl font-bold text-amber-600 mt-1">{rider?.rating || 'N/A'}</p>
              </div>
            </div>

            {/* Live Location Status */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-slate-900">Live Location</span>
                </div>
                <LocationTracker riderId={currentUser?.id} enabled={true} />
              </div>
            </div>

            {/* Active Deliveries */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm mb-6">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Active Deliveries
                  <span className="text-sm font-normal text-slate-500 ml-2">
                    ({active_deliveries.length})
                  </span>
                </h2>
              </div>
              <div className="divide-y divide-slate-200">
                {active_deliveries.length === 0 ? (
                  <div className="p-6 text-center text-slate-500">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p>No active deliveries</p>
                    <p className="text-sm text-gray-400">You'll see your assigned deliveries here</p>
                  </div>
                ) : (
                  active_deliveries.map((parcel) => (
                    <div key={parcel.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-mono text-sm font-medium text-slate-900">
                              {parcel.tracking_number}
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              parcel.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                              parcel.status === 'Picked Up' ? 'bg-blue-100 text-blue-700' :
                              parcel.status === 'In Transit' ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {parcel.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-blue-500" />
                            {parcel.pickup_location?.address || 'N/A'} 
                            <span className="text-slate-300 mx-1">→</span>
                            <MapPin className="h-3 w-3 text-red-500" />
                            {parcel.destination?.address || 'N/A'}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                            <span>Weight: {parcel.weight}kg</span>
                            <span>Receiver: {parcel.receiver || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {parcel.status === 'Pending' && (
                            <button
                              onClick={() => handleAction(parcel, 'pickup')}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                            >
                              <Package className="h-3 w-3" />
                              Pick Up
                            </button>
                          )}
                          {parcel.status === 'Picked Up' && (
                            <>
                              <button
                                onClick={() => handleAction(parcel, 'transit')}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                              >
                                <Truck className="h-3 w-3" />
                                In Transit
                              </button>
                              <button
                                onClick={() => handleAction(parcel, 'deliver')}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                              >
                                <CheckCircle className="h-3 w-3" />
                                Deliver
                              </button>
                            </>
                          )}
                          {parcel.status === 'In Transit' && (
                            <button
                              onClick={() => handleAction(parcel, 'deliver')}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Deliver
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Completed Deliveries */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Completed Deliveries
                  <span className="text-sm font-normal text-slate-500 ml-2">
                    ({completed_deliveries.length})
                  </span>
                </h2>
              </div>
              <div className="divide-y divide-slate-200">
                {completed_deliveries.length === 0 ? (
                  <div className="p-6 text-center text-slate-500">
                    <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p>No completed deliveries yet</p>
                    <p className="text-sm text-gray-400">Your completed deliveries will appear here</p>
                  </div>
                ) : (
                  completed_deliveries.map((parcel) => (
                    <div key={parcel.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                          <p className="font-mono text-sm font-medium text-slate-900">
                            {parcel.tracking_number}
                          </p>
                          <p className="text-sm text-slate-600">
                            <MapPin className="h-3 w-3 text-red-500 inline" />
                            {parcel.destination?.address || 'N/A'}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Delivered: {parcel.updated_at ? new Date(parcel.updated_at).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Delivered
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          // Profile Page
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-3 mb-6">
              <User className="h-6 w-6 text-blue-600" />
              Rider Profile
            </h1>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-2xl">
                    {currentUser?.first_name?.[0]}{currentUser?.last_name?.[0] || ''}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {currentUser?.full_name}
                    </h2>
                    <p className="text-sm text-slate-500">{currentUser?.email}</p>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                      {rider?.status || 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {showProfileForm ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Vehicle <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={profileForm.vehicle}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, vehicle: e.target.value }))}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter vehicle model"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Plate Number
                      </label>
                      <input
                        type="text"
                        value={profileForm.plate}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, plate: e.target.value }))}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter plate number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileForm.phone_number}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, phone_number: e.target.value }))}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Status
                      </label>
                      <select
                        value={profileForm.status}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Available">Available</option>
                        <option value="Delivering">Delivering</option>
                        <option value="On Break">On Break</option>
                        <option value="Offline">Offline</option>
                      </select>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleProfileUpdate}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => setShowProfileForm(false)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-500">Email</p>
                        <p className="font-medium">{currentUser?.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Phone</p>
                        <p className="font-medium">{rider?.phone_number || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Vehicle</p>
                        <p className="font-medium">{rider?.vehicle || 'Not assigned'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Plate Number</p>
                        <p className="font-medium">{rider?.plate || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Total Deliveries</p>
                        <p className="font-medium">{rider?.deliveries || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Rating</p>
                        <p className="font-medium flex items-center gap-1">
                          {rider?.rating || 'N/A'}
                          {rider?.rating && <Star className="h-4 w-4 fill-amber-500 text-amber-500" />}
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-200">
                      <button
                        onClick={() => setShowProfileForm(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Edit Profile
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Action Modal */}
      {showActionModal && selectedParcel && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              onClick={() => setShowActionModal(false)} 
            />
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-md">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-900">
                    {actionType === 'pickup' ? 'Pick Up Parcel' : 
                     actionType === 'deliver' ? 'Deliver Parcel' : 
                     'Update Status'}
                  </h3>
                  <button 
                    onClick={() => setShowActionModal(false)} 
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">Parcel:</span> {selectedParcel.tracking_number}
                    </p>
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">Route:</span> {selectedParcel.pickup_location?.address || 'N/A'} → {selectedParcel.destination?.address || 'N/A'}
                    </p>
                  </div>

                  {actionType === 'deliver' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Delivery Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={deliveryLocation.address}
                          onChange={(e) => setDeliveryLocation(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter delivery address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={deliveryLocation.city}
                          onChange={(e) => setDeliveryLocation(prev => ({ ...prev, city: e.target.value }))}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter city"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => setShowActionModal(false)}
                      className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleActionConfirm}
                      disabled={updating || (actionType === 'deliver' && !deliveryLocation.address)}
                      className={`flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        actionType === 'pickup' ? 'bg-amber-600 hover:bg-amber-700' :
                        actionType === 'deliver' ? 'bg-green-600 hover:bg-green-700' :
                        'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {updating ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        'Confirm'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiderDashboard;