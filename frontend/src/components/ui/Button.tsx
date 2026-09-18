import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99] rounded-[8px]';

    const variants = {
      primary:
        'bg-[#006B35] text-white hover:bg-[#004D27] active:bg-[#003D20] focus:ring-[#006B35]/30 shadow-2xs',
      secondary:
        'bg-[#EBF1ED] text-[#17201B] hover:bg-[#E2E8E4] active:bg-[#D4DDD6] focus:ring-[#006B35]/20',
      outline:
        'border border-[#E2E8E4] bg-white text-[#17201B] hover:bg-[#F4F8F5] hover:border-[#D4DDD6] active:bg-[#EBF1ED] focus:ring-[#006B35]/20 shadow-2xs',
      ghost:
        'bg-transparent text-[#66736C] hover:bg-[#F4F8F5] hover:text-[#17201B] active:bg-[#EBF1ED]',
      danger:
        'bg-[#DC2626] text-white hover:bg-[#B91C1C] active:bg-[#991B1B] focus:ring-red-500/30 shadow-2xs',
      success:
        'bg-[#006B35] text-white hover:bg-[#004D27] active:bg-[#003D20] focus:ring-[#006B35]/30 shadow-2xs',
    };

    const sizes = {
      sm: 'text-xs h-7.5 px-2.5 gap-1.5 font-medium',
      md: 'text-[13px] h-9 px-3.5 gap-2 font-medium',
      lg: 'text-sm h-10 px-4.5 gap-2 font-semibold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-current shrink-0" />}
        {!isLoading && leftIcon}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
