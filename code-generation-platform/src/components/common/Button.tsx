/* src/components/common/Button.tsx */

import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  className?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'left',
      isLoading,
      loadingText,
      fullWidth,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      primary:
        'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 disabled:bg-blue-500/50',
      secondary:
        'bg-neutral-700 text-neutral-100 hover:bg-neutral-600 disabled:bg-neutral-700/50',
      outline:
        'border border-neutral-600 text-neutral-100 hover:bg-neutral-800 disabled:border-neutral-600/50',
      danger:
        'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 disabled:bg-red-500/50',
      success:
        'bg-green-500 text-white hover:bg-green-600 active:bg-green-700 disabled:bg-green-500/50',
      ghost: 'text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700',
    };

    const sizeStyles = {
      sm: 'h-8 px-3 text-sm gap-1.5',
      md: 'h-10 px-4 text-base gap-2',
      lg: 'h-12 px-6 text-lg gap-2',
    };

    return (
      <button
        ref={ref}
        className={clsx(
          'button-base',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          isLoading && 'opacity-75 cursor-not-allowed',
          className
        )}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {icon && iconPosition === 'left' && !isLoading && icon}
        <span>{isLoading && loadingText ? loadingText : children}</span>
        {icon && iconPosition === 'right' && !isLoading && icon}
      </button>
    );
  }
);

Button.displayName = 'Button';
