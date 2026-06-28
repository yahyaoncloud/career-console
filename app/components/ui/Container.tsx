import React from 'react';
import { cn } from '../../lib/utils';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'page' | 'section' | 'none';
}

export function Container({ className, variant = 'page', children, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        variant === 'page' && "max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8 md:space-y-16",
        variant === 'section' && "space-y-6 md:space-y-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
