// pages/Settings.jsx
import React, { useState } from 'react';
import { Settings as SettingsIcon, Bell, Lock, User, Palette, Globe, Save } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    darkMode: false,
    language: 'en',
    timezone: 'Africa/Nairobi'
  });

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-3">
          <SettingsIcon className="h-6 w-6 text-blue-600" />
          Settings
        </h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </button>
      </div>

      <div className="space-y-4">
        {/* Profile Settings */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-medium text-slate-900 flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-blue-600" />
            Profile Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                defaultValue="James Mwangi"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                defaultValue="james@sendit.com"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
                onClick={() => handleChange('notifications', !settings.notifications)}
                className={`relative w-12 h-6 rounded-full transition-colors ${settings.notifications ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.notifications ? 'translate-x-6' : ''}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Email Alerts</span>
              <button
                onClick={() => handleChange('emailAlerts', !settings.emailAlerts)}
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
              onClick={() => handleChange('darkMode', !settings.darkMode)}
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
      </div>
    </div>
  );
};

export default Settings;