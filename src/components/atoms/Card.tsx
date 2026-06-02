import React from 'react';
import { memo } from 'react';

export interface CardProps {
  /** Card content */
  children: React.ReactNode;
  /** Visual variant */
  variant?: 'default' | 'bordered' | 'elevated' | 'neon';
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const variantStyles = {
  default: 'bg-slate-800 border-2 border-slate-700',
  bordered: 'bg-slate-900 border-4 border-cyan-500/30',
  elevated: 'bg-slate-800 border-2 border-slate-700 shadow-xl',
  neon: 'bg-slate-900 border-4 border-green-500/50 shadow-lg shadow-green-500/20',
};

/**
 * Card component following arcade design system
 * Optimized with React.memo
 */
export const Card = memo(function Card({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
}: CardProps) {
  const baseStyles = 'rounded-xl transition-all';
  const paddingClass = paddingStyles[padding];
  const variantClass = variantStyles[variant];
  const interactiveClass = onClick
    ? 'cursor-pointer hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30'
    : '';

  const combinedClassName = `${baseStyles} ${variantClass} ${paddingClass} ${interactiveClass} ${className}`.trim();

  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      className={combinedClassName}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      {children}
    </Wrapper>
  );
});

export default Card;
