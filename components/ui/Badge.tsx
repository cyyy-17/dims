import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'neutral' | 'accent';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]/60',
    accent: 'bg-[#4F46E5] text-white border border-[#4F46E5]',
    success: 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]',
    warning: 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]',
    danger: 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]',
    neutral: 'bg-[#F4F4F2] text-[#555552] border border-[#E4E4E0]',
  };

  const dotColors = {
    default: 'bg-[#4F46E5]',
    accent: 'bg-white',
    success: 'bg-[#16A34A]',
    warning: 'bg-[#D97706]',
    danger: 'bg-[#DC2626]',
    neutral: 'bg-[#8C8C8A]',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md font-medium tracking-wide',
    md: 'text-xs px-2.5 py-1 rounded-full font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />}
      {children}
    </span>
  );
};
