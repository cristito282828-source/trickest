import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'purple' | 'pink';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  arcadeBorder?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-accent-cyan-500 hover:bg-accent-cyan-600 text-white border-white shadow-accent-cyan-500/30 hover:shadow-accent-cyan-500/50',
  secondary: 'bg-neutral-700 hover:bg-neutral-600 text-white border-neutral-500 shadow-neutral-700/30',
  danger: 'bg-red-500 hover:bg-red-600 text-white border-white shadow-red-500/30 hover:shadow-red-500/50',
  success: 'bg-green-500 hover:bg-green-600 text-white border-white shadow-green-500/30 hover:shadow-green-500/50',
  warning: 'bg-accent-yellow-500 hover:bg-accent-yellow-600 text-black border-white shadow-accent-yellow-500/30 hover:shadow-accent-yellow-500/50',
  purple: 'bg-accent-purple-600 hover:bg-accent-purple-700 text-white border-white shadow-accent-purple-500/30 hover:shadow-accent-purple-500/50',
  pink: 'bg-accent-pink-500 hover:bg-accent-pink-600 text-white border-white shadow-accent-pink-500/30 hover:shadow-accent-pink-500/50',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  leftIcon,
  rightIcon,
  fullWidth = false,
  arcadeBorder = true,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = [
    'font-black uppercase tracking-wider rounded-lg transition-all duration-200',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
    'transform hover:scale-105',
    arcadeBorder ? 'border-4 shadow-2xl' : 'border-2 shadow-lg',
    fullWidth ? 'w-full' : '',
  ].join(' ');

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      <div className="flex items-center justify-center gap-2">
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
        ) : (
          <>
            {leftIcon && <span>{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span>{rightIcon}</span>}
          </>
        )}
      </div>
    </button>
  );
};
