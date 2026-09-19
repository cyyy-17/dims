import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

    const variants = {
      primary: 'bg-[#4F46E5] text-white hover:bg-[#4338CA] shadow-sm',
      secondary: 'bg-white text-[#2C2C2A] border border-[#E4E4E0] hover:bg-[#F8F8F6] hover:border-[#D5D5D0] shadow-sm',
      danger: 'bg-[#DC2626] text-white hover:bg-[#B91C1C] shadow-sm',
      ghost: 'bg-transparent text-[#555552] hover:bg-[#ECECE8] hover:text-[#141414]',
      outline: 'border border-[#E4E4E0] bg-transparent text-[#2C2C2A] hover:bg-[#F8F8F6]',
    };

    const sizes = {
      sm: 'text-xs h-8 px-3 gap-1.5',
      md: 'text-sm h-9 px-4 gap-2',
      lg: 'text-base h-11 px-5 gap-2.5',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
