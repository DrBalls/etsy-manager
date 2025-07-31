'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  compareData?: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export function RevenueChart({ data, compareData }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorCompare" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload) return null;
            
            return (
              <div className="rounded-lg border bg-background p-2 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">Revenue:</span>
                    <span className="font-bold">${payload[0]?.value}</span>
                  </div>
                  {compareData && payload[1] && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-muted-foreground">Previous:</span>
                      <span className="font-bold">${payload[1]?.value}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#10b981"
          fillOpacity={1}
          fill="url(#colorRevenue)"
        />
        {compareData && (
          <Area
            data={compareData}
            type="monotone"
            dataKey="revenue"
            stroke="#8b5cf6"
            fillOpacity={1}
            fill="url(#colorCompare)"
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}