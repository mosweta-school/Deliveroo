// components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Mail, Phone, MapPin } from 'lucide-react';
// import { Facebook, Twitter, Instagram, Youtube } from 'react-icons/fa';
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-8 w-8 text-blue-400" />
              <span className="font-bold text-xl">Deliveroo</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Fast, reliable, and secure parcel delivery service across Kenya. 
              Track your parcels in real-time with ease.
            </p>
            {/* <div className="flex gap-3 mt-4">
              <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div> */}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-400 hover:text-white transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-white mb-4">Services</h4>
            <ul className="space-y-2">
              <li className="text-slate-400 hover:text-white transition-colors text-sm cursor-pointer">
                Same Day Delivery
              </li>
              <li className="text-slate-400 hover:text-white transition-colors text-sm cursor-pointer">
                Next Day Delivery
              </li>
              <li className="text-slate-400 hover:text-white transition-colors text-sm cursor-pointer">
                International Shipping
              </li>
              <li className="text-slate-400 hover:text-white transition-colors text-sm cursor-pointer">
                Parcel Tracking
              </li>
              <li className="text-slate-400 hover:text-white transition-colors text-sm cursor-pointer">
                Bulk Delivery
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contact Info</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-slate-400">
                <MapPin className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>Nairobi, Kenya</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-400">
                <Phone className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <span>+254 712 345 678</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-400">
                <Mail className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <span>info@deliveroo.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-400">
            © {currentYear} Deliveroo. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-slate-400">
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link to="/cookies" className="hover:text-white transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;