// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/authService';

// Public Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import About from './pages/About';
import Contact from './pages/Contact';


// Layouts
import MainLayout from './layouts/MainLayout';
import NavbarLayout from './layouts/NavbarLayout';

// Protected Pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import CustomerDashboard from './pages/Customer/CustomerDashboard';
import RiderDashboard from './components/rider/RiderDashboard';
import ProtectedRoute from './routes/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes with Main Layout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        {/* Auth Routes with Navbar Layout */}
        <Route element={<NavbarLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
        </Route>

        {/* Protected Admin Routes */}
        <Route element={<MainLayout />}>
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Protected Customer Routes */}
        <Route 
          path="/customer/*" 
          element={
            <ProtectedRoute requiredRole="customer">
              <CustomerDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
            path="/rider" 
            element={
              <ProtectedRoute requiredRole="driver">
                <RiderDashboard />
              </ProtectedRoute>
            } 
          />
</Route>
        {/* Catch all - redirect to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;