import React from 'react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ElementType;
  progress?: number;
  progressColor?: string;
  iconWrapperClass?: string;
  iconColorClass?: string;
  valueColorClass?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  progress,
  progressColor = 'bg-indigo-500',
  iconWrapperClass = 'bg-zinc-100 dark:bg-zinc-800',
  iconColorClass = 'text-zinc-600 dark:text-zinc-400',
  valueColorClass = 'text-zinc-900 dark:text-zinc-100',
  className
}: StatCardProps) {
  return (
    <Card className={cn("p-5 border-zinc-200 dark:border-zinc-800 space-y-2", className)}>
      {Icon ? (
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-sm", iconWrapperClass, iconColorClass)}>
            <Icon size={24} />
          </div>
          <div>
            <p className="text-sm font-mono text-zinc-500 uppercase tracking-wider">{title}</p>
            <p className={cn("text-3xl font-bold font-serif", valueColorClass)}>{value}</p>
          </div>
        </div>
      ) : (
        <>
          <span className="font-mono text-[11px] text-zinc-500 uppercase tracking-widest block">{title}</span>
          <div className="flex justify-between items-baseline">
            <h2 className={cn("font-serif text-3xl md:text-4xl font-semibold", valueColorClass)}>{value}</h2>
            {subtitle && <span className="font-mono text-sm text-zinc-500">{subtitle}</span>}
          </div>
          {typeof progress === 'number' && (
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-[2px] rounded-sm overflow-hidden mt-2">
              <div className={cn("h-full transition-all", progressColor)} style={{ width: `${progress}%` }} />
            </div>
          )}
        </>
      )}
    </Card>
  );
}
