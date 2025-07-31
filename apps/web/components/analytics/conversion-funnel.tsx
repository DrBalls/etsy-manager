'use client';

interface ConversionFunnelProps {
  visitors: number;
  cartAdds: number;
  checkouts: number;
  purchases: number;
}

export function ConversionFunnel({
  visitors,
  cartAdds,
  checkouts,
  purchases,
}: ConversionFunnelProps) {
  const stages = [
    { name: 'Visitors', value: visitors, color: 'bg-blue-500' },
    { name: 'Cart Adds', value: cartAdds, color: 'bg-purple-500' },
    { name: 'Checkouts', value: checkouts, color: 'bg-orange-500' },
    { name: 'Purchases', value: purchases, color: 'bg-green-500' },
  ];

  const maxValue = visitors || 1;

  return (
    <div className="space-y-4">
      {stages.map((stage, index) => {
        const percentage = (stage.value / maxValue) * 100;
        const dropoffRate = index > 0 ? 
          ((stages[index - 1].value - stage.value) / stages[index - 1].value) * 100 : 0;

        return (
          <div key={stage.name} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{stage.name}</span>
              <div className="flex items-center gap-2">
                <span>{stage.value.toLocaleString()}</span>
                {index > 0 && dropoffRate > 0 && (
                  <span className="text-xs text-muted-foreground">
                    (-{dropoffRate.toFixed(1)}%)
                  </span>
                )}
              </div>
            </div>
            <div className="relative h-8 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full ${stage.color} transition-all duration-500`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}