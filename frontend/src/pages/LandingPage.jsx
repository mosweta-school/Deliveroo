// pages/LandingPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Truck, 
  Shield, 
  Clock, 
  ArrowRight,
  MapPin,
  Star,
  Users,
  TrendingUp
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    { icon: Package, title: 'Parcel Tracking', description: 'Track your parcels in real-time with live updates and notifications' },
    { icon: Truck, title: 'Fast Delivery', description: 'Reliable and speedy delivery across all major cities in Kenya' },
    { icon: Shield, title: 'Secure & Safe', description: 'Your parcels are insured and handled with the utmost care' },
    { icon: Clock, title: '24/7 Support', description: 'Round the clock customer support for all your delivery needs' }
  ];

  const stats = [
    { icon: Users, value: '10,000+', label: 'Happy Customers' },
    { icon: Package, value: '50,000+', label: 'Parcels Delivered' },
    { icon: Truck, value: '500+', label: 'Active Couriers' },
    { icon: TrendingUp, value: '99.5%', label: 'Delivery Success Rate' }
  ];

  const testimonials = [
    {
      name: 'John Mwangi',
      role: 'Business Owner',
      content: 'Deliveroo has revolutionized how I send packages to my customers. Fast, reliable, and great customer service!',
      rating: 5
    },
    {
      name: 'Mary Wanjiru',
      role: 'Online Seller',
      content: 'I use Deliveroo for all my deliveries. The tracking feature gives me peace of mind knowing where my parcels are.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section with Glassmorphism */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")',
            filter: 'brightness(0.6)'
          }}
        />
        
        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-purple-600/20 to-blue-800/30" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Glass Card */}
          <div className="max-w-4xl mx-auto backdrop-blur-md bg-white/10 rounded-2xl p-8 md:p-12 border border-white/20 shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-600/20 backdrop-blur-sm p-4 rounded-full border border-blue-400/30">
                <Truck className="h-12 w-12 text-blue-300" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Send Parcels Across Kenya
              <span className="block text-blue-300"> With Ease</span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8 leading-relaxed">
              Track, manage, and dispatch local courier deliveries in real-time. 
              Fast, reliable, and secure parcel delivery service.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/register')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all transform hover:scale-105 inline-flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
              >
                Get Started
                <ArrowRight className="h-5 w-5" />
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all border border-white/30 inline-flex items-center justify-center gap-2"
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={index}
                  className="backdrop-blur-sm bg-white/5 rounded-xl p-4 border border-white/10"
                >
                  <Icon className="h-6 w-6 text-blue-300 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-white/70">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1">
            <div className="w-1 h-2 bg-white/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Why Choose Deliveroo?
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              We provide reliable, fast, and secure parcel delivery services across Kenya
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index} 
                  className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="h-14 w-14 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="h-7 w-7 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Real stories from real customers who trust SendIT
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${i < testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} 
                    />
                  ))}
                </div>
                <p className="text-slate-600 mb-4 leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{testimonial.name}</p>
                    <p className="text-sm text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Sending?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of Kenyans who trust Deliveroo for their parcel delivery needs
          </p>
          <button 
            onClick={() => navigate('/register')}
            className="bg-white hover:bg-slate-50 text-blue-600 px-8 py-4 rounded-lg text-lg font-medium transition-all transform hover:scale-105 shadow-lg inline-flex items-center gap-2"
          >
            Create Free Account
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;