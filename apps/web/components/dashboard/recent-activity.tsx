import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { Package, ShoppingCart, Star, TrendingUp } from 'lucide-react';

interface Activity {
  id: string;
  type: 'order' | 'listing' | 'review' | 'view';
  title: string;
  description: string;
  timestamp: Date;
}

interface RecentActivityProps {
  activities: Activity[];
}

const activityIcons = {
  order: ShoppingCart,
  listing: Package,
  review: Star,
  view: TrendingUp,
};

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest shop activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : (
            activities.map((activity) => {
              const Icon = activityIcons[activity.type];
              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="rounded-full bg-secondary p-2">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}