import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AssetHistoryItem } from '../types';

interface AssetTrendChartProps {
  data: AssetHistoryItem[];
}

export const AssetTrendChart: React.FC<AssetTrendChartProps> = ({ data }) => {
  // Helper to format "2023.10" -> "2023年10月"
  const formatTooltipDate = (dateStr: string) => {
    const [year, month] = dateStr.split('.');
    return `${year}年${month}月`;
  };

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 10, fill: '#94a3b8'}}
            dy={10}
            interval="preserveStartEnd"
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 10, fill: '#94a3b8'}}
            tickFormatter={(value) => `${(value / 10000).toFixed(0)}w`}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            labelFormatter={formatTooltipDate}
            formatter={(value: number) => [`¥${value.toLocaleString()}`, '净资产']}
            labelStyle={{ color: '#64748b', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#0ea5e9" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorValue)" 
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};