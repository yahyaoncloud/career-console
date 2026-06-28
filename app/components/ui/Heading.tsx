import React from 'react';
import { cn } from '../../lib/utils';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  variant?: 'hero' | 'h1' | 'h2' | 'h3' | 'h4';
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'p';
}

export function Heading({ className, variant = 'h2', as, children, ...props }: HeadingProps) {
  const Component = as || (['hero', 'h1'].includes(variant) ? 'h1' : variant === 'h2' ? 'h2' : variant === 'h3' ? 'h3' : 'h4');
  
  return (
    <Component
      className={cn(
        "serif-header text-zinc-900 dark:text-zinc-50",
        variant === 'hero' && "text-3xl md:text-5xl font-bold tracking-tight",
        variant === 'h1' && "text-2xl sm:text-3xl font-bold tracking-tight",
        variant === 'h2' && "text-xl md:text-2xl font-bold",
        variant === 'h3' && "text-lg md:text-xl font-bold",
        variant === 'h4' && "text-base md:text-lg font-bold",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
