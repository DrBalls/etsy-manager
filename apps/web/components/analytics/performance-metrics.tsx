'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PerformanceMetricsProps {
  conversionRate: number;
  averageOrderValue: number;
  repeatCustomerRate: number;
  cartAbandonmentRate: number;
}

export function PerformanceMetrics({
  conversionRate,
  averageOrderValue,
  repeatCustomerRate,
  cartAbandonmentRate,
}: PerformanceMetricsProps) {
  const metrics = [
    {
      title: 'Conversion Rate',
      value: conversionRate,
      format: (v: number) => `${v.toFixed(2)}%`,
      target: 3,
      description: 'Visitors who make a purchase',
    },
    {
      title: 'Average Order Value',
      value: averageOrderValue,
      format: (v: number) => `$${v.toFixed(2)}`,
      target: 50,
      description: 'Average revenue per order',
    },
    {
      title: 'Repeat Customer Rate',
      value: repeatCustomerRate,
      format: (v: number) => `${v.toFixed(1)}%`,
      target: 20,
      description: 'Customers with 2+ orders',
    },
    {
      title: 'Cart Abandonment',
      value: cartAbandonmentRate,
      format: (v: number) => `${v.toFixed(1)}%`,
      target: 30,
      description: 'Carts not converted to orders',
      inverse: true, // Lower is better
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {metrics.map((metric) => {
        const progress = metric.inverse
          ? Math.max(0, 100 - (metric.value / metric.target) * 100)
          : Math.min(100, (metric.value / metric.target) * 100);

        const trend = metric.inverse
          ? metric.value > metric.target ? 'down' : 'up'
          : metric.value > metric.target ? 'up' : 'down';

        return (
          <Card key={metric.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {metric.format(metric.value)}
                </div>
                <div className="flex items-center">
                  {trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : trend === 'down' ? (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  ) : (
                    <Minus className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metric.description}
              </p>
              <div className="mt-3">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Target: {metric.format(metric.target)}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}