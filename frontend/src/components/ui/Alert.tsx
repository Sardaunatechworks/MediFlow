import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
}

export function Alert({ variant = 'info', title, className, children, ...props }: AlertProps) {
  const configs = {
    info: {
      icon: <Info className="w-5 h-5 text-sky-600 shrink-0" />,
      bg: 'bg-sky-50 border-sky-200 text-sky-900',
      titleColor: 'text-sky-900',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      titleColor: 'text-amber-900',
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />,
      bg: 'bg-red-50 border-red-200 text-red-900',
      titleColor: 'text-red-900',
    },
    success: {
      icon: <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />,
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      titleColor: 'text-emerald-900',
    },
  };

  const current = configs[variant];

  return (
    <div
      role="alert"
      className={cn('flex items-start gap-3 p-4 border rounded-card text-sm', current.bg, className)}
      {...props}
    >
      {current.icon}
      <div className="flex-1">
        {title && <h5 className={cn('font-semibold text-sm mb-0.5', current.titleColor)}>{title}</h5>}
        <div className="text-xs leading-relaxed opacity-90">{children}</div>
      </div>
    </div>
  );
}
