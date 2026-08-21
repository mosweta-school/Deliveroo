// components/AdminDashboard.jsx
import React from 'react';
import Sidebar from './Sidebar';
import StatCard from './StatCard';
import BarChart from './BarChart';
import ActivityFeed from './ActivityFeed';
import { 
  LayoutDashboard, 
  Truck, 
  Wallet, 
  Users,
  CalendarDays,
  MapPin,
  Clock,
  TrendingUp
} from 'lucide-react';

const Dashboard = () => {
  const stats = [
    {
      id: 1,
      title: 'Total Orders',
      value: '1,284',
      icon: LayoutDashboard,
      change: '+12%',
      changeType: 'increase',
      color: 'blue'
    },
    {
      id: 2,
      title: 'Active Deliveries',
      value: '47',
      icon: Truck,
      change: '+4',
      changeType: 'increase',
      color: 'purple'
    },
    {
      id: 3,
      title: 'Revenue Today',
      value: 'KSh 14,250',
      icon: Wallet,
      change: '+8%',
      changeType: 'increase',
      color: 'green'
    },
    {
      id: 4,
      title: 'Total Users',
      value: '342',
      icon: Users,
      change: '+18',
      changeType: 'increase',
      color: 'cyan'
    }
  ];

  const weeklyData = [
    { day: 'Mon', value: 58 },
    { day: 'Tue', value: 84 },
    { day: 'Wed', value: 42 },
    { day: 'Thu', value: 96 },
    { day: 'Fri', value: 65 },
    { day: 'Sat', value: 110 },
    { day: 'Sun', value: 78 }
  ];

  const activities = [
    {
      id: 1,
      parcel: '#SEND-1023',
      status: 'delivered',
      location: 'Westlands',
      time: '2 min ago',
      color: 'green'
    },
    {
      id: 2,
      parcel: '#SEND-0987',
      status: 'in transit',
      location: 'Nairobi CBD',
      time: '14 min ago',
      color: 'purple'
    },
    {
      id: 3,
      parcel: '#SEND-1124',
      status: 'picked up',
      location: 'Kilimani',
      time: '32 min ago',
      color: 'orange'
    },
    {
      id: 4,
      parcel: '#SEND-1150',
      status: 'created',
      location: 'by user@sendit.co',
      time: '1 hour ago',
      color: 'blue'
    },
    {
      id: 5,
      parcel: '#SEND-1133',
      status: 'cancelled',
      location: 'by sender',
      time: '2 hours ago',
      color: 'gray'
    }
  ];

  return (
    
      
      
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            Logistics Overview
          </h1>
          
          
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-white px-4 py-2 rounded-lg border border-slate-200">
            <CalendarDays className="h-4 w-4" />
            Aug 19, 2026
          </div>
        </div>
        <div>
<p className='text-l text-gray-600'>Monitor active fleets, dispatch deliveries and review financial yields</p>
          </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <StatCard key={stat.id} {...stat} />
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <BarChart data={weeklyData} />
          </div>
          <div className="lg:col-span-1">
            <ActivityFeed activities={activities} />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-sm text-slate-600 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Today's Completed
            </div>
            <div className="font-mono text-2xl font-semibold text-slate-900 mt-1">24</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-sm text-slate-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg. Delivery Time
            </div>
            <div className="font-mono text-2xl font-semibold text-slate-900 mt-1">42 min</div>
          </div>
        </div>
      </main>
    
  );
};

export default Dashboard;