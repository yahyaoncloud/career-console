import React from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps extends React.ComponentProps<'div'> {
  fallback?: React.ReactNode;
  error?: Error;
}

export function ErrorBoundary({ children, fallback, error, className, ...props }: ErrorBoundaryProps) {
  const [hasError, setHasError] = React.useState(!!error);

  if (hasError || error) {
    return fallback || (
      <div 
        {...props} 
        className={cn(
          "p-4 border border-destructive/50 bg-destructive/10 rounded-lg flex items-start gap-3",
          className
        )}
      >
        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-medium text-destructive">Something went wrong</h3>
          <p className="text-xs text-destructive/80 mt-1">
            {error?.message || "An unexpected error occurred in this component."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div {...props} onError={() => setHasError(true)} className={className}>
      {children}
    </div>
  );
}
