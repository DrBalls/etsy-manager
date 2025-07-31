'use client';

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface TrafficSourcesProps {
  sources: Array<{
    source: string;
    visits: number;
    pageViews: number;
    orders: number;
    revenue: number;
    conversionRate: number;
  }>;
}

export function TrafficSources({ sources }: TrafficSourcesProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={sources} layout="vertical">
        <XAxis type="number" />
        <YAxis dataKey="source" type="category" width={100} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload) return null;
            
            const data = payload[0]?.payload;
            if (!data) return null;
            
            return (
              <div className="rounded-lg border bg-background p-2 shadow-sm">
                <p className="font-semibold">{data.source}</p>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Visits:</span>
                    <span>{data.visits}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Orders:</span>
                    <span>{data.orders}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Revenue:</span>
                    <span>${data.revenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Conv Rate:</span>
                    <span>{data.conversionRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            );
          }}
        />
        <Bar dataKey="visits" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  );
}