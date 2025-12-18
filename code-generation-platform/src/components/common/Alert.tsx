/* src/components/common/Alert.tsx */

import React from 'react';
import clsx from 'clsx';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface AlertProps {
  variant: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const variantStyles = {
  success:
    'bg-green-500/10 border border-green-500/20 text-green-300',
  error:
    'bg-red-500/10 border border-red-500/20 text-red-300',
  warning:
    'bg-yellow-500/10 border border-yellow-500/20 text-yellow-300',
  info:
    'bg-blue-500/10 border border-blue-500/20 text-blue-300',
};

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertCircle,
  info: Info,
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      variant,
      title,
      message,
      dismissible,
      onDismiss,
      action,
      className,
    },
    ref
  ) => {
    const Icon = iconMap[variant];

    return (
      <div
        ref={ref}
        className={clsx(
          'flex items-start gap-4 p-4 rounded-lg border animate-slide-down',
          variantStyles[variant],
          className
        )}
      >
        <Icon size={20} className="flex-shrink-0 mt-0.5" />

        <div className="flex-1">
          {title && <h4 className="font-semibold mb-1">{title}</h4>}
          <p className="text-sm opacity-90">{message}</p>
        </div>

        {action && (
          <button
            onClick={action.onClick}
            className="flex-shrink-0 font-medium hover:opacity-80 transition-opacity text-sm"
          >
            {action.label}
          </button>
        )}

        {dismissible && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 hover:opacity-75 transition-opacity"
          >
            <X size={18} />
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = 'Alert';
