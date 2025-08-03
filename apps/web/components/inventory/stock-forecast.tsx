'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TrendingDown, AlertTriangle, Calendar, Package } from 'lucide-react';
import { format } from 'date-fns';

interface StockForecast {
  inventoryItemId: string;
  listing: {
    id: string;
    title: string;
    images?: { url: string }[];
  };
  currentStock: number;
  averageDailySales: number;
  daysUntilStockout: number;
  estimatedStockoutDate: Date;
  recommendedReorderQuantity: number;
  recommendedReorderDate: Date;
  leadTimeDays: number;
}

interface StockForecastProps {
  shopId: string;
}

export function StockForecast({ shopId }: StockForecastProps) {
  const [forecasts, setForecasts] = useState<StockForecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForecasts();
  }, [shopId]);

  const fetchForecasts = async () => {
    try {
      const response = await fetch(`/api/inventory/forecast?shopId=${shopId}`);
      if (response.ok) {
        const data = await response.json();
        setForecasts(data);
      }
    } catch (error) {
      console.error('Error fetching forecasts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (daysUntilStockout: number) => {
    if (daysUntilStockout <= 7) return 'text-red-600 bg-red-50';
    if (daysUntilStockout <= 14) return 'text-orange-600 bg-orange-50';
    if (daysUntilStockout <= 30) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getUrgencyBadge = (daysUntilStockout: number) => {
    if (daysUntilStockout <= 7) return 'Critical';
    if (daysUntilStockout <= 14) return 'High';
    if (daysUntilStockout <= 30) return 'Medium';
    return 'Low';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const criticalItems = forecasts.filter(f => f.daysUntilStockout <= 7);
  const warningItems = forecasts.filter(f => f.daysUntilStockout > 7 && f.daysUntilStockout <= 14);

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      {criticalItems.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle>Critical Stock Alert</AlertTitle>
          <AlertDescription>
            {criticalItems.length} {criticalItems.length === 1 ? 'item is' : 'items are'} at risk of stockout within 7 days
          </AlertDescription>
        </Alert>
      )}

      {warningItems.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle>Stock Warning</AlertTitle>
          <AlertDescription>
            {warningItems.length} {warningItems.length === 1 ? 'item needs' : 'items need'} restocking within 14 days
          </AlertDescription>
        </Alert>
      )}

      {/* Forecast Cards */}
      <div className="grid gap-4">
        {forecasts.map((forecast) => (
          <Card key={forecast.inventoryItemId} className={forecast.daysUntilStockout <= 14 ? 'border-orange-200' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {forecast.listing.images?.[0] && (
                    <img
                      src={forecast.listing.images[0].url}
                      alt={forecast.listing.title}
                      className="w-16 h-16 rounded object-cover"
                    />
                  )}
                  <div>
                    <CardTitle className="text-lg">{forecast.listing.title}</CardTitle>
                    <CardDescription>
                      Current Stock: {forecast.currentStock} units
                    </CardDescription>
                  </div>
                </div>
                <Badge className={getUrgencyColor(forecast.daysUntilStockout)}>
                  {getUrgencyBadge(forecast.daysUntilStockout)} Priority
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stock Depletion Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Stock Depletion</span>
                  <span className="font-medium">
                    {forecast.daysUntilStockout} days remaining
                  </span>
                </div>
                <Progress 
                  value={Math.max(0, Math.min(100, (forecast.daysUntilStockout / 30) * 100))} 
                  className="h-2"
                />
              </div>

              {/* Forecast Details */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    <span>Average Daily Sales</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {forecast.averageDailySales.toFixed(1)} units/day
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Estimated Stockout</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {format(new Date(forecast.estimatedStockoutDate), 'MMM d')}
                  </p>
                </div>
              </div>

              {/* Reorder Recommendation */}
              <div className="rounded-lg bg-blue-50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Reorder Recommendation</span>
                </div>
                <div className="grid gap-2 md:grid-cols-2 text-sm">
                  <div>
                    <span className="text-blue-700">Quantity:</span>
                    <span className="ml-2 font-medium text-blue-900">
                      {forecast.recommendedReorderQuantity} units
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Order by:</span>
                    <span className="ml-2 font-medium text-blue-900">
                      {format(new Date(forecast.recommendedReorderDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-blue-700">
                  Based on {forecast.leadTimeDays} day lead time
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {forecasts.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Not enough sales data to generate stock forecasts
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}