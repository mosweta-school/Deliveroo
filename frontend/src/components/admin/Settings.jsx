// frontend/src/components/admin/Settings.jsx
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Bell, Lock, User, Palette, Globe, Save, RefreshCw } from 'lucide-react';
import { authService } from '../../services/authService';

const Settings = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    darkMode: false,
    language: 'en',
    timezone: 'Africa/Nairobi'
  });
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: ''
  });

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setProfile({
        first_name: currentUser.first_name || '',
        last_name: currentUser.last_name || '',
        email: currentUser.email || '',
        phone_number: currentUser.phone_number || ''
      });
    }
    setLoading(false);
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    // Simulate save - in production, call API to update profile
    setTimeout(() => {
      alert('Profile updated successfully!');
      setSaving(false);
    }, 1000);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    // Simulate save - in production, call API to update settings
    setTimeout(() => {
      alert('Settings saved successfully!');
      setSaving(false);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-3">
          <SettingsIcon className="h-6 w-6 text-blue-600" />
          Settings
        </h1>
      </div>

      <div className="space-y-4">
        {/* Profile Settings */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-medium text-slate-900 flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-blue-600" />
            Profile Settings
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={profile.first_name}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={profile.last_name}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleProfileChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                name="phone_number"
                value={profile.phone_number}
                onChange={handleProfileChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Profile
                </>
              )}
            </button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-medium text-slate-900 flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-blue-600" />
            Notifications
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Push Notifications</span>
              <button
                onClick={() => handleSettingChange('notifications', !settings.notifications)}
                className={`relative w-12 h-6 rounded-full transition-colors ${settings.notifications ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.notifications ? 'translate-x-6' : ''}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Email Alerts</span>
              <button
                onClick={() => handleSettingChange('emailAlerts', !settings.emailAlerts)}
                className={`relative w-12 h-6 rounded-full transition-colors ${settings.emailAlerts ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.emailAlerts ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-medium text-slate-900 flex items-center gap-2 mb-4">
            <Palette className="h-5 w-5 text-blue-600" />
            Appearance
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Dark Mode</span>
            <button
              onClick={() => handleSettingChange('darkMode', !settings.darkMode)}
              className={`relative w-12 h-6 rounded-full transition-colors ${settings.darkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.darkMode ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-medium text-slate-900 flex items-center gap-2 mb-4">
            <Lock className="h-5 w-5 text-blue-600" />
            Security
          </h3>
          <button className="text-blue-600 text-sm hover:underline">Change Password</button>
        </div>

        {/* Save All Settings */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save All Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;