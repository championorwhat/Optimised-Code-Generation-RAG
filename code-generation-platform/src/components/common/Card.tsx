/* src/components/common/Card.tsx */

import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  hover?: boolean;
  border?: boolean;
  variant?: 'default' | 'elevated' | 'flat';
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      title,
      subtitle,
      footer,
      hover = true,
      border = true,
      variant = 'default',
      children,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      default: border ? 'card-base' : 'bg-neutral-800 rounded-lg',
      elevated: 'card-base shadow-lg',
      flat: 'bg-neutral-900 rounded-lg',
    };

    const hoverStyles = hover && variant === 'default' ? 'card-hover' : '';

    return (
      <div
        ref={ref}
        className={clsx(variantStyles[variant], hoverStyles, className)}
        {...props}
      >
        {(title || subtitle) && (
          <div className="px-6 py-4 border-b border-neutral-700">
            {title && (
              <h3 className="text-lg font-semibold text-neutral-100">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-neutral-400 mt-1">{subtitle}</p>
            )}
          </div>
        )}

        <div className="px-6 py-4">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-neutral-700 bg-neutral-900/50">
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';
