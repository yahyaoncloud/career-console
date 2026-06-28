import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ className, hover = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground p-4 md:p-6 rounded-lg border border-border shadow-sm",
        hover && "hover:border-primary/50 transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
