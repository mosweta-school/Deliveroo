// pages/Contact.jsx
import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  CheckCircle, 
  AlertCircle,
  Clock,
  MessageSquare,
  User,
  Globe
} from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState({
    submitted: false,
    loading: false,
    success: false,
    error: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormStatus({ ...formStatus, loading: true, error: null });

    // Simulate API call
    setTimeout(() => {
      // Check if all fields are filled
      if (Object.values(formData).every(value => value.trim() !== '')) {
        setFormStatus({
          submitted: true,
          loading: false,
          success: true,
          error: null
        });
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });
        // Reset success message after 5 seconds
        setTimeout(() => {
          setFormStatus(prev => ({ ...prev, submitted: false, success: false }));
        }, 5000);
      } else {
        setFormStatus({
          submitted: false,
          loading: false,
          success: false,
          error: 'Please fill in all fields.'
        });
      }
    }, 1500);
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Visit Us',
      details: ['Nairobi, Kenya', 'Westlands, Waiyaki Way'],
      color: 'blue'
    },
    {
      icon: Phone,
      title: 'Call Us',
      details: ['+254 712 345 678', '+254 723 456 789'],
      color: 'green'
    },
    {
      icon: Mail,
      title: 'Email Us',
      details: ['info@deliveroo.com', 'support@deliveroo.com'],
      color: 'purple'
    },
    {
      icon: Clock,
      title: 'Working Hours',
      details: ['Mon - Fri: 7:00 AM - 10:00 PM', 'Sat - Sun: 8:00 AM - 8:00 PM'],
      color: 'orange'
    }
  ];

//   const socialLinks = [
//     { icon: Facebook, label: 'Facebook', url: '#', color: '#1877f2' },
//     { icon: Twitter, label: 'Twitter', url: '#', color: '#1da1f2' },
//     { icon: Instagram, label: 'Instagram', url: '#', color: '#e4405f' },
//     { icon: Youtube, label: 'YouTube', url: '#', color: '#ff0000' }
//   ];

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Contact Us
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Have questions or need assistance? We're here to help. Reach out to us through any of the channels below.
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {contactInfo.map((item, index) => {
            const Icon = item.icon;
            const colorClasses = {
              blue: 'bg-blue-50 text-blue-600 border-blue-200',
              green: 'bg-green-50 text-green-600 border-green-200',
              purple: 'bg-purple-50 text-purple-600 border-purple-200',
              orange: 'bg-orange-50 text-orange-600 border-orange-200'
            };
            const colorClass = colorClasses[item.color] || colorClasses.blue;

            return (
              <div 
                key={index} 
                className={`p-6 rounded-xl border ${colorClass} hover:shadow-lg transition-shadow`}
              >
                <div className={`h-12 w-12 rounded-full ${colorClass} flex items-center justify-center mb-3`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                {item.details.map((detail, idx) => (
                  <p key={idx} className="text-sm text-slate-600">{detail}</p>
                ))}
              </div>
            );
          })}
        </div>

        {/* Contact Form & Map Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-blue-600" />
                Send Us a Message
              </h2>

              {/* Success Message */}
              {formStatus.success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-800">Message Sent Successfully!</p>
                    <p className="text-sm text-green-700">We'll get back to you within 24 hours.</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {formStatus.error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700">{formStatus.error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="John Mwangi"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="john@email.com"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+254 712 345 678"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="How can we help?"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="5"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Write your message here..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={formStatus.loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formStatus.loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar - Quick Contact & Social */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Contact Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4">Quick Contact</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-blue-300 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-200">Phone</p>
                    <p className="font-medium">+254 712 345 678</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-300 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-200">Email</p>
                    <p className="font-medium">info@deliveroo.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-300 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-200">Support Hours</p>
                    <p className="font-medium">24/7 Support</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Connect With Us
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Follow us on social media for updates and news.
              </p>
              {/* <div className="flex flex-wrap gap-3">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-12 w-12 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                      style={{ backgroundColor: social.color + '20', color: social.color }}
                    >
                      <Icon className="h-6 w-6" />
                    </a>
                  );
                })}
              </div> */}
            </div>

            {/* Business Hours */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Business Hours
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Monday - Friday</span>
                  <span className="font-medium text-slate-900">7:00 AM - 10:00 PM</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Saturday</span>
                  <span className="font-medium text-slate-900">8:00 AM - 8:00 PM</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Sunday</span>
                  <span className="font-medium text-slate-900">9:00 AM - 6:00 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-12">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Find Us
              </h3>
            </div>
            <div className="h-80 bg-slate-200 relative">
              {/* Map Placeholder - Replace with actual map component */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                  <p className="text-slate-600 font-medium">Deliveroo Headquarters</p>
                  <p className="text-sm text-slate-500">Nairobi, Kenya</p>
                  <p className="text-xs text-slate-400 mt-2">Interactive map loading...</p>
                </div>
              </div>
              {/* For Google Maps integration, uncomment below */}
              {/* <iframe
                title="Deliveroo Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d255282.35853743783!2d36.68219672234554!3d-1.3028611!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f1172d84d49a7%3A0xf7cf0254b297924c!2sNairobi%2C%20Kenya!5e0!3m2!1sen!2s!4v1645432100000!5m2!1sen!2s"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              /> */}
            </div>
          </div>
        </div>

        {/* FAQ Prompt */}
        <div className="mt-12 text-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Before You Contact Us
          </h3>
          <p className="text-slate-600 text-sm mb-4">
            You might find the answer to your question in our FAQ section.
          </p>
          <a
            href="/faq"
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            View FAQs
          </a>
        </div>
      </div>
    </div>
  );
};

export default Contact;