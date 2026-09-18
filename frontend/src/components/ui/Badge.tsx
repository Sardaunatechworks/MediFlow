import React from 'react';
import { cn, getUrgencyConfig } from '@/lib/utils';
import { UrgencyLevel } from '@/types/domain';
import { AlertTriangle, CheckCircle2, Flame } from 'lucide-react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
}

export function Badge({ className, variant = 'default', size = 'sm', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[#EBF1ED] text-[#17201B] border-[#E2E8E4]',
    primary: 'bg-[#EAF7EE] text-[#006B35] border-[#C4D4C9]',
    secondary: 'bg-[#E2E8E4] text-[#17201B] border-[#D4DDD6]',
    outline: 'bg-transparent text-[#17201B] border-[#E2E8E4]',
    success: 'bg-[#EAF7EE] text-[#006B35] border-[#A3D9B1]',
    warning: 'bg-[#FEFCE8] text-[#B45309] border-[#FDE047]',
    danger: 'bg-[#FCE8E6] text-[#C5221F] border-[#F8B4B4]',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 tracking-wide',
    md: 'text-[11px] px-2.5 py-0.5 tracking-normal',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-semibold rounded-full border select-none uppercase tracking-wider',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function UrgencyBadge({
  urgency,
  size = 'md',
  showDescription = false,
  className,
}: {
  urgency: UrgencyLevel | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
  className?: string;
}) {
  const config = getUrgencyConfig(urgency);

  const icons = {
    RED: <Flame className="w-3.5 h-3.5 text-[#C5221F]" />,
    YELLOW: <AlertTriangle className="w-3.5 h-3.5 text-[#B45309]" />,
    GREEN: <CheckCircle2 className="w-3.5 h-3.5 text-[#006B35]" />,
  };

  return (
    <div className={cn('inline-flex flex-col', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-1.5 font-bold rounded-full border select-none transition-all',
          config.bg,
          size === 'sm' && 'text-[10px] px-2 py-0.5',
          size === 'md' && 'text-xs px-2.5 py-0.5',
          size === 'lg' && 'text-[13px] px-3 py-1'
        )}
      >
        <span className={cn('w-2 h-2 rounded-full', config.dotColor)} />
        {urgency && icons[urgency]}
        <span>{config.label}</span>
      </span>
      {showDescription && (
        <span className="text-[10px] text-[#66736C] mt-0.5 ml-1">{config.description}</span>
      )}
    </div>
  );
}
