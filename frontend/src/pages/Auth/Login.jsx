// pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Predefined users for demo
  const users = [
    {
      id: '1',
      name: 'James Mwangi',
      email: 'jamesmwangi@deliveroo.com',
      password: 'admin123',
      role: 'admin',
      phone: '+254 712 345 678',
      avatar: 'JM'
    },
    {
      id: '2',
      name: 'Jane Muthoni',
      email: 'janemuthoni@gmail.com',
      password: 'customer123',
      role: 'customer',
      phone: '+254 723 456 789',
      avatar: 'JM'
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      // Find user by email and password
      const user = users.find(
        u => u.email === formData.email && u.password === formData.password
      );

      if (user) {
        // Store user data in localStorage for persistence
        localStorage.setItem('token', `mock-jwt-token-${user.id}`);
        localStorage.setItem('user', JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar
        }));

        // Navigate based on role
        if (user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/customer');
        }
      } else {
        setError('Invalid email or password. Please try again.');
      }
      setLoading(false);
    }, 800);
  };

  const handleQuickLogin = (user) => {
    setFormData({
      email: user.email,
      password: user.password
    });
    // Trigger form submission
    setTimeout(() => {
      handleSubmit(new Event('submit'));
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4 flex-col items-center">
            <Truck className="h-12 w-12 text-blue-600" />
            <p className='text-xl font-bold text-blue-600'>Deliveroo</p>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
          <p className="text-slate-600 text-sm">Access your logistics and delivery hub</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full pl-10 pr-12 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-slate-600">Remember me</span>
            </label>
            <button type="button" className="text-blue-600 hover:underline">
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Quick Login - Demo Users */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-slate-500">Demo Credentials</span>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-3">
            {/* Admin Login */}
            <button
              type="button"
              onClick={() => handleQuickLogin(users[0])}
              className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                  {users[0].avatar}
                </div>
                <span className="text-xs font-semibold text-blue-700">Admin</span>
              </div>
              <p className="text-xs text-slate-600 truncate">{users[0].email}</p>
              <p className="text-xs text-slate-400 font-mono">••••••••</p>
            </button>

            {/* Customer Login */}
            <button
              type="button"
              onClick={() => handleQuickLogin(users[1])}
              className="p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="h-6 w-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-semibold">
                  {users[1].avatar}
                </div>
                <span className="text-xs font-semibold text-green-700">Customer</span>
              </div>
              <p className="text-xs text-slate-600 truncate">{users[1].email}</p>
              <p className="text-xs text-slate-400 font-mono">••••••••</p>
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-slate-600 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;