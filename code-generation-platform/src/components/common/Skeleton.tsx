/* src/components/common/Skeleton.tsx */

import React from 'react';
import clsx from 'clsx';

interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rectangle';
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      variant = 'text',
      width = '100%',
      height = 20,
      count = 1,
      className,
    },
    ref
  ) => {
    const variantStyles = {
      text: 'rounded',
      circle: 'rounded-full',
      rectangle: 'rounded-lg',
    };

    const style: React.CSSProperties = {
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
    };

    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            ref={ref}
            className={clsx(
              'bg-neutral-700 animate-pulse',
              variantStyles[variant],
              className
            )}
            style={style}
          />
        ))}
      </div>
    );
  }
);

Skeleton.displayName = 'Skeleton';
