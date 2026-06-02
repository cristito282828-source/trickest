import React from 'react';
import { memo } from 'react';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'purple' | 'cyan';

export interface BadgeProps {
  /** Badge content */
  children: React.ReactNode;
  /** Visual variant */
  variant?: BadgeVariant;
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-green-600 text-white border-2 border-green-300',
  warning: 'bg-yellow-500 text-black border-2 border-yellow-200',
  error: 'bg-red-600 text-white border-2 border-red-300',
  info: 'bg-cyan-600 text-white border-2 border-cyan-300',
  purple: 'bg-purple-600 text-white border-2 border-purple-300',
  cyan: 'bg-cyan-500 text-white border-2 border-cyan-200',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

/**
 * Badge component following arcade design system
 * Optimized with React.memo
 */
export const Badge = memo(function Badge({
  children,
  variant = 'info',
  size = 'md',
  className = '',
  onClick,
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-black uppercase tracking-wider rounded-lg border-2';
  const variantClass = variantStyles[variant];
  const sizeClass = sizeStyles[size];
  const interactiveClass = onClick
    ? 'cursor-pointer hover:scale-105 transition-transform'
    : '';

  const combinedClassName = `${baseStyles} ${variantClass} ${sizeClass} ${interactiveClass} ${className}`.trim();

  if (onClick) {
    return (
      <button className={combinedClassName} onClick={onClick} type="button">
        {children}
      </button>
    );
  }

  return <span className={combinedClassName}>{children}</span>;
});

export default Badge;
