import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Image as ImageIcon } from 'lucide-react';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackUrl?: string;
}

export function Image({ className, src, alt, fallbackUrl, ...props }: ImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={cn('relative overflow-hidden bg-muted flex items-center justify-center', className)}>
      {(!loaded && !error) && (
        <div className="absolute inset-0 animate-pulse bg-muted-foreground/10" />
      )}
      {error ? (
        fallbackUrl ? (
          <img
            src={fallbackUrl}
            alt={alt || 'Fallback image'}
            className={cn('w-full h-full object-cover', className)}
            {...props}
          />
        ) : (
          <ImageIcon className="text-muted-foreground/50 w-1/3 h-1/3 max-w-[48px]" />
        )
      ) : (
        <img
          src={src}
          alt={alt || ''}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
          {...props}
        />
      )}
    </div>
  );
}
