/* src/components/common/Badge.tsx */

import React from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'neutral';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const variantStyles = {
  primary:
    'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  success:
    'bg-green-500/10 text-green-400 border border-green-500/20',
  danger:
    'bg-red-500/10 text-red-400 border border-red-500/20',
  warning:
    'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  neutral:
    'bg-neutral-700 text-neutral-300 border border-neutral-600',
};

const sizeStyles = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
};

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      label,
      variant = 'primary',
      size = 'md',
      icon,
      dismissible,
      onDismiss,
      className,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'badge-base',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
      >
        {icon}
        <span>{label}</span>
        {dismissible && (
          <button
            onClick={onDismiss}
            className="ml-1 hover:opacity-75 transition-opacity"
          >
            <X size={14} />
          </button>
        )}
      </div>
    );
  }
);

Badge.displayName = 'Badge';
