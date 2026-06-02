import React, { forwardRef } from 'react';
import { memo } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label text for the input */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Helper text to display below input */
  helperText?: string;
  /** Container class name */
  containerClassName?: string;
}

/**
 * Input component following arcade design system
 * Optimized with React.memo to prevent unnecessary re-renders
 */
export const Input = memo(function Input({
  label,
  error,
  helperText,
  containerClassName = '',
  className = '',
  disabled,
  ...props
}: InputProps) {
  const baseInputStyles =
    'w-full px-4 py-2 bg-slate-800 border-2 rounded-lg ' +
    'text-white placeholder-slate-400 ' +
    'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ' +
    'transition-all disabled:opacity-50 disabled:cursor-not-allowed';

  const errorStyles = error
    ? 'border-red-500 focus:ring-red-500'
    : 'border-slate-600 focus:border-cyan-500';

  const combinedInputClassName = `${baseInputStyles} ${errorStyles} ${className}`.trim();

  return (
    <div className={`flex flex-col gap-1 ${containerClassName}`.trim()}>
      {label && (
        <label className="text-sm font-bold uppercase text-slate-300 tracking-wider">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <input
        className={combinedInputClassName}
        disabled={disabled}
        {...props}
      />

      {error && (
        <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
          ⚠️ {error}
        </span>
      )}

      {helperText && !error && (
        <span className="text-xs text-slate-400">{helperText}</span>
      )}
    </div>
  );
});

export default Input;
