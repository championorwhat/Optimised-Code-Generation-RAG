/* src/components/common/ProgressBar.tsx */

import React from 'react';
import clsx from 'clsx';

interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  animated?: boolean;
  striped?: boolean;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantColors = {
  primary: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
};

const heightStyles = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      value,
      max = 100,
      variant = 'primary',
      showLabel,
      animated,
      striped,
      height = 'md',
      className,
    },
    ref
  ) => {
    const percentage = Math.min((value / max) * 100, 100);

    return (
      <div ref={ref} className={className}>
        <div
          className={clsx(
            'w-full bg-neutral-700 rounded-full overflow-hidden',
            heightStyles[height]
          )}
        >
          <div
            className={clsx(
              'h-full transition-all duration-500',
              variantColors[variant],
              animated && 'animate-pulse-glow',
              striped &&
                'bg-gradient-to-r from-transparent via-white/20 to-transparent'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {showLabel && (
          <div className="mt-2 text-right">
            <span className="text-sm font-medium text-neutral-300">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';
