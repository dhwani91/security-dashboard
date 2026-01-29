// components/dashboard/TrendChart.tsx
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  chartData: {
    monthlyTrends: Array<{ month: string; CRITICAL: number; HIGH: number; MEDIUM: number; LOW: number }>;
  };
}

export function TrendChart({ chartData }: Props) {
  const trendData = chartData.monthlyTrends;

  if (!trendData || trendData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Vulnerability Trends Over Time</h2>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No trend data available
        </div>
      </div>
    );
  }

  const total = trendData.reduce((sum, item) => sum + item.CRITICAL + item.HIGH + item.MEDIUM + item.LOW, 0);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-2">Vulnerability Trends Over Time</h2>
      <p className="text-sm text-gray-600 mb-4">
        Showing {trendData.length} months • {total.toLocaleString()} total vulnerabilities
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="CRITICAL" stroke="#dc2626" strokeWidth={2} />
          <Line type="monotone" dataKey="HIGH" stroke="#ea580c" strokeWidth={2} />
          <Line type="monotone" dataKey="MEDIUM" stroke="#f59e0b" strokeWidth={2} />
          <Line type="monotone" dataKey="LOW" stroke="#84cc16" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}