import React from 'react';

interface FloatingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  badge?: number | string;
  position?: 'fixed' | 'relative';
  color?: 'cyan' | 'purple' | 'red' | 'green' | 'yellow';
}

const colorStyles = {
  cyan: 'bg-accent-cyan-500 hover:bg-accent-cyan-600',
  purple: 'bg-accent-purple-600 hover:bg-accent-purple-700',
  red: 'bg-red-500 hover:bg-red-600',
  green: 'bg-green-500 hover:bg-green-600',
  yellow: 'bg-accent-yellow-500 hover:bg-accent-yellow-600',
};

export const FloatingButton: React.FC<FloatingButtonProps> = ({
  icon,
  badge,
  position = 'fixed',
  color = 'cyan',
  className = '',
  ...props
}) => {
  return (
    <button
      className={`${position} w-14 h-14 rounded-full ${colorStyles[color]} text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center ${className}`}
      {...props}
    >
      <div className="relative">
        {icon}
        {badge !== undefined && badge !== 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center animate-bounce">
            {badge}
          </span>
        )}
      </div>
    </button>
  );
};
