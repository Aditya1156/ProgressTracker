import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  variant = 'default',
  className,
}: StatCardProps) {
  const variantStyles = {
    default: '',
    success: 'bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-500/5 dark:border-emerald-500/15',
    warning: 'bg-amber-500/10 border-amber-500/20 dark:bg-amber-500/5 dark:border-amber-500/15',
    danger: 'bg-red-500/10 border-red-500/20 dark:bg-red-500/5 dark:border-red-500/15',
  };

  const iconColors = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    danger: 'bg-red-500/15 text-red-600 dark:text-red-400',
  };

  const trendIcons = {
    up: <TrendingUp className="h-3 w-3" />,
    down: <TrendingDown className="h-3 w-3" />,
    stable: <Minus className="h-3 w-3" />,
  };

  const trendColors = {
    up: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    down: 'text-red-600 dark:text-red-400 bg-red-500/10',
    stable: 'text-slate-600 dark:text-slate-400 bg-slate-500/10',
  };

  return (
    <Card className={cn('group hover:translate-y-[-2px]', variantStyles[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div className={cn('rounded-xl p-2.5 transition-all duration-300 group-hover:scale-110', iconColors[variant])}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-bold tracking-tight">{value}</div>
            {trend && (
              <Badge
                variant="secondary"
                className={cn('mt-2 gap-1', trendColors[trend.direction])}
              >
                {trendIcons[trend.direction]}
                <span className="text-xs font-medium">
                  {trend.direction === 'up' && '+'}
                  {trend.direction === 'down' && '-'}
                  {Math.abs(trend.value)}%
                </span>
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
