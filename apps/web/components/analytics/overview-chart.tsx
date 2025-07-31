'use client';

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface OverviewChartProps {
  data: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export function OverviewChart({ data }: OverviewChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
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
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col">
                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                      Revenue
                    </span>
                    <span className="font-bold text-muted-foreground">
                      ${payload[0]?.value}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                      Orders
                    </span>
                    <span className="font-bold">
                      {payload[1]?.value}
                    </span>
                  </div>
                </div>
              </div>
            );
          }}
        />
        <Line
          type="monotone"
          strokeWidth={2}
          dataKey="revenue"
          stroke="#10b981"
          dot={false}
        />
        <Line
          type="monotone"
          strokeWidth={2}
          dataKey="orders"
          stroke="#3b82f6"
          dot={false}
          yAxisId="right"
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}