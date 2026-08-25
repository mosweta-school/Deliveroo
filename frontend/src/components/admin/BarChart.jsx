// components/BarChart.jsx - Using Recharts
import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

const BarChart = ({ data }) => {
  // Colors for the bars
  const colors = {
    primary: '#2563EB',
    primaryLight: '#DBEAFE',
    success: '#16A34A',
    warning: '#F59E0B',
    error: '#DC2626',
    inTransit: '#7C3AED'
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-slate-900">{label}</p>
          <p className="text-sm text-slate-600">
            Deliveries: <span className="font-semibold text-blue-600">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-slate-900 flex items-center gap-2">
          <span className="text-blue-600"></span>
          Delivery Volume (This Week)
        </h3>
        <span className="text-xs text-slate-500">Mon – Sun</span>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
            barSize={32}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false}
              stroke="#E2E8F0"
            />
            <XAxis 
              dataKey="day" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748B', fontWeight: 500 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748B' }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
              iconType="circle"
            />
            <Bar 
              dataKey="value" 
              name="Deliveries"
              radius={[4, 4, 0, 0]}
              animationDuration={800}
              animationEasing="ease-in-out"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={entry.value > 80 ? colors.primary : colors.primaryLight}
                  style={{ 
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.fill = colors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.fill = entry.value > 80 ? colors.primary : colors.primaryLight;
                  }}
                />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-center gap-6 mt-2 text-xs text-slate-600">
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-blue-600 rounded"></span>
          Parcels
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-blue-100 rounded"></span>
          Delivered
        </span>
      </div>
    </div>
  );
};

export default BarChart;