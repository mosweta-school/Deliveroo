// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import AdminDashboard from './pages/Admin/AdminDashboard';
import CustomerDashboard from './pages/Customer/Dashboard';
import MainLayout from './layouts/MainLayout';


function App() {



  return (
    <Router>
      <Routes>
        {/* Public Routes */}
<Route element={<MainLayout />}>
{/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/Forgotpassword" element={<ForgotPassword />} />

        {/* Admin Route */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Customer Route */}
        <Route path="/customer" element={<CustomerDashboard />} />

</Route>
        
      </Routes>
    </Router>
  );
}

export default App;