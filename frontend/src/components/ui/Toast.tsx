import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: () => void;
}

export function Toast({ type = 'info', title, message, onClose }: ToastProps) {
  const configs = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
      border: 'border-l-4 border-l-emerald-500 border-slate-200',
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
      border: 'border-l-4 border-l-red-500 border-slate-200',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
      border: 'border-l-4 border-l-amber-500 border-slate-200',
    },
    info: {
      icon: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
      border: 'border-l-4 border-l-sky-500 border-slate-200',
    },
  };

  const current = configs[type];

  return (
    <div
      className={cn(
        'bg-white rounded-card shadow-lg p-3.5 border flex items-start gap-3 transition-all duration-200',
        current.border
      )}
    >
      {current.icon}
      <div className="flex-1 min-w-0">
        <h6 className="text-xs font-semibold text-slate-900">{title}</h6>
        {message && <p className="text-xs text-slate-500 mt-0.5 break-words">{message}</p>}
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded-control text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
