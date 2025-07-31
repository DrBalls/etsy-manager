'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface ChartData {
  date: string;
  revenue: number;
  orders: number;
}

interface OverviewChartProps {
  data: ChartData[];
  title?: string;
  description?: string;
}

export function OverviewChart({
  data,
  title = 'Revenue Overview',
  description = 'Your revenue and order trends',
}: OverviewChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
              itemStyle={{ color: '#fff' }}
              formatter={(value: number, name: string) => {
                if (name === 'revenue') return [`$${value.toFixed(2)}`, 'Revenue'];
                return [value, 'Orders'];
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#8884d8"
              strokeWidth={2}
              dot={false}
              name="Revenue"
            />
            <Line
              type="monotone"
              dataKey="orders"
              stroke="#82ca9d"
              strokeWidth={2}
              dot={false}
              name="Orders"
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
      </CardContent>
    </Card>
  );
}