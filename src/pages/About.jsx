// pages/About.jsx
import React from 'react';
import { 
  Eye, 
  Target, 
  Shield, 
  Zap, 
  Users, 
  Lightbulb,
  MapPin,
  Clock,
  FileText,
  RefreshCw,
  MessageSquare,
  Truck,
  CheckCircle,
  Globe,
  Heart,
  Star,
  Award,
  BarChart3,
  Smartphone,
  RefreshCw as UpdateIcon,
  Bell
} from 'lucide-react';

const About = () => {
  const challenges = [
    {
      icon: MapPin,
      title: 'Limited Delivery Visibility',
      description: "Many customers don't know where their parcel is after it has been dispatched, leading to uncertainty and repeated follow-up calls.",
      solution: 'Deliveroo provides real-time parcel tracking and delivery status updates, giving users visibility into every stage of the delivery process.'
    },
    {
      icon: Clock,
      title: 'Delivery Delays',
      description: 'Traffic congestion, weather conditions, and communication gaps can make deliveries unpredictable.',
      solution: 'Our platform keeps customers informed through status updates and estimated journey information, helping them stay updated on their deliveries.'
    },
    {
      icon: FileText,
      title: 'Manual Delivery Management',
      description: 'Traditional courier processes often rely on phone calls and paper records, making it difficult to manage multiple deliveries.',
      solution: 'Users can create, manage, and monitor all their delivery orders from a single dashboard.'
    },
    {
      icon: RefreshCw,
      title: 'Difficulty Updating Delivery Information',
      description: 'Sometimes recipients change location after an order has already been dispatched.',
      solution: 'Deliveroo allows customers to update the destination of their parcel before it has been delivered, providing greater flexibility.'
    },
    {
      icon: MessageSquare,
      title: 'Poor Communication',
      description: 'Customers are often left wondering whether their parcel has been picked up, is on the way, or has already been delivered.',
      solution: 'The platform provides timely delivery status updates, and in the complete system, users receive email notifications whenever the parcel status or current location changes.'
    }
  ];

  const values = [
    { icon: Truck, title: 'Reliability', description: 'We aim to provide dependable delivery experiences through consistent tracking and clear communication.' },
    { icon: Shield, title: 'Security', description: 'We value the safe handling of every parcel and the protection of customer information.' },
    { icon: Zap, title: 'Efficiency', description: 'We strive to simplify the delivery process through intuitive digital tools.' },
    { icon: Users, title: 'Customer First', description: 'Every feature we build is designed to improve the customer experience.' },
    { icon: Lightbulb, title: 'Innovation', description: 'We embrace technology to solve everyday logistics challenges.' }
  ];

  const reasons = [
    { icon: Smartphone, text: 'Easy online parcel booking' },
    { icon: MapPin, text: 'Real-time delivery tracking' },
    { icon: Bell, text: 'Transparent delivery status updates' },
    { icon: UpdateIcon, text: 'Flexible destination updates before delivery' },
    { icon: BarChart3, text: 'User-friendly dashboard for managing orders' },
    { icon: Shield, text: 'Secure and reliable delivery experience' }
  ];

  const stats = [
    { value: '10,000+', label: 'Happy Customers', icon: Users },
    { value: '50,000+', label: 'Parcels Delivered', icon: Truck },
    { value: '500+', label: 'Active Couriers', icon: Globe },
    { value: '99.5%', label: 'Success Rate', icon: Award }
  ];

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            About Deliveroo
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            We believe parcel delivery should be simple, transparent, and reliable. 
            Whether you're sending documents across town, delivering products to customers, 
            or sending gifts to loved ones, our platform is designed to make every delivery seamless.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm">
              <Users className="h-4 w-4" />
              Connecting People
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm">
              <Truck className="h-4 w-4" />
              Trusted Couriers
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm">
              <Globe className="h-4 w-4" />
              Digital Platform
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white p-6 rounded-xl border border-slate-200 text-center hover:shadow-lg transition-shadow">
                <Icon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Our Story / Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900">Our Mission</h2>
            </div>
            <p className="text-slate-600 leading-relaxed">
              To make parcel delivery in Kenya more efficient, transparent, and convenient 
              by using technology to connect customers with reliable courier services.
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="h-6 w-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-slate-900">Our Vision</h2>
            </div>
            <p className="text-slate-600 leading-relaxed">
              To become one of Kenya's most trusted digital parcel delivery platforms by 
              providing secure, user-friendly, and innovative logistics solutions.
            </p>
          </div>
        </div>

        {/* Challenges Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">
            The Challenges We Address
          </h2>
          <p className="text-center text-slate-600 max-w-2xl mx-auto mb-8">
            Parcel delivery in Kenya can come with several challenges. Deliveroo is designed 
            to help reduce these common frustrations.
          </p>
          
          <div className="space-y-6">
            {challenges.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 bg-red-50 rounded-lg flex items-center justify-center">
                          <Icon className="h-6 w-6 text-red-500" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 text-lg mb-1">
                          {item.title}
                        </h3>
                        <p className="text-slate-600 text-sm mb-3">{item.description}</p>
                        <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-semibold text-green-700 uppercase">Our Solution</span>
                            <p className="text-sm text-green-700">{item.solution}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Core Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">
            Our Core Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div key={index} className="bg-white p-6 rounded-xl border border-slate-200 text-center hover:shadow-lg transition-shadow group">
                  <div className="h-14 w-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 transition-colors">
                    <Icon className="h-7 w-7 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">{value.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Why Choose Deliveroo */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 md:p-12 mb-8">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Why Choose Deliveroo?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {reasons.map((reason, index) => {
              const Icon = reason.icon;
              return (
                <div key={index} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                  <Icon className="h-5 w-5 text-blue-200 flex-shrink-0" />
                  <span className="text-white text-sm">{reason.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Our Story Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <Star className="h-6 w-6 text-blue-600" />
            Our Story
          </h2>
          <div className="space-y-4 text-slate-600 leading-relaxed max-w-4xl">
            <p>
              At Deliveroo, we believe parcel delivery should be simple, transparent, and reliable. 
              Whether you're sending documents across town, delivering products to customers, or 
              sending gifts to loved ones, our platform is designed to make every delivery seamless.
            </p>
            <p>
              We connect people with trusted courier services through an intuitive digital platform 
              that allows users to create delivery orders, track parcels in real time, and stay 
              informed throughout the delivery journey.
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-3">
              <Heart className="h-6 w-6 text-blue-600 flex-shrink-0" />
              <p className="text-blue-700 text-sm font-medium">
                Our goal is to make parcel delivery in Kenya more efficient, transparent, and 
                convenient by using technology to connect customers with reliable courier services.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;